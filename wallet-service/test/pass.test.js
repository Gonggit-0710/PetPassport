import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash,verify} from 'node:crypto';
import forge from 'node-forge';
import {unzipSync,strFromU8} from 'fflate';
import {PNG} from 'pngjs';
import {buildPass,configuration,validateCard,validateCertificates} from '../pass.js';
import {createHandler} from '../handler.js';

// Synthetic certificates only. These files are never written to disk and are
// deliberately not usable in Apple Wallet. Tests validate package mechanics.
const keys=forge.pki.rsa.generateKeyPair(2048);
function certificate(serial,subject,issuer,ca){
  const cert=forge.pki.createCertificate();cert.publicKey=keys.publicKey;cert.serialNumber=serial;
  cert.validity.notBefore=new Date(Date.now()-60000);cert.validity.notAfter=new Date(Date.now()+86400000);
  cert.setSubject(subject);cert.setIssuer(issuer);cert.setExtensions([{name:'basicConstraints',cA:ca},{name:'keyUsage',digitalSignature:true,keyCertSign:ca}]);cert.sign(keys.privateKey,forge.md.sha256.create());return cert;
}
const issuer=[{name:'commonName',value:'Synthetic Test Issuer'}];
const root=certificate('01',issuer,issuer,true);
const leaf=certificate('02',[{name:'commonName',value:'Synthetic Test Pass'},{shortName:'OU',value:'TESTTEAM01'},{type:'0.9.2342.19200300.100.1.1',value:'pass.us.pawtrip.test'}],issuer,false);
const config={passTypeIdentifier:'pass.us.pawtrip.test',teamIdentifier:'TESTTEAM01',certificates:{wwdr:forge.pki.certificateToPem(root),signerCert:forge.pki.certificateToPem(leaf),signerKey:forge.pki.privateKeyToPem(keys.privateKey)}};
const body={language:'ja',card:{name:'보리 / Bori',breed:'Maltese',weight:'4.2',phone:'+82 10-0000-0000',conditions:'未入力',allergies:'鶏肉 / 닭고기',medications:'Original medicine',chip:'410000000000000'}};
test('signed package, hashes, fields and detached signature',()=>{
  const bytes=buildPass(body,config),files=unzipSync(bytes),pass=JSON.parse(strFromU8(files['pass.json'])),manifest=JSON.parse(strFromU8(files['manifest.json']));
  assert.equal(pass.generic.primaryFields[0].value,body.card.name);assert.equal(pass.teamIdentifier,config.teamIdentifier);assert.equal(pass.passTypeIdentifier,config.passTypeIdentifier);
  assert.equal(pass.sharingProhibited,true);assert.equal(pass.webServiceURL,undefined);assert.equal(pass.authenticationToken,undefined);
  assert.ok(pass.generic.backFields.some(f=>f.value==='Original medicine'));
  for(const [file,hash] of Object.entries(manifest)) assert.equal(createHash('sha1').update(files[file]).digest('hex'),hash);
  const signature=forge.pkcs7.messageFromAsn1(forge.asn1.fromDer(forge.util.createBuffer(Buffer.from(files.signature).toString('binary'))));
  assert.ok(signature.rawCapture.signature.length>0);assert.equal(signature.certificates.length,2);
  const attributes=forge.asn1.toDer(forge.asn1.create(forge.asn1.Class.UNIVERSAL,forge.asn1.Type.SET,true,signature.rawCapture.authenticatedAttributes)).getBytes();
  assert.ok(verify('sha1',Buffer.from(attributes,'binary'),config.certificates.signerCert,Buffer.from(signature.rawCapture.signature,'binary')),'CMS signature verifies');
  const digestAttribute=signature.rawCapture.authenticatedAttributes.find(a=>a.value[0].value===forge.asn1.oidToDer('1.2.840.113549.1.9.4').getBytes());
  assert.equal(Buffer.from(digestAttribute.value[1].value[0].value,'binary').toString('hex'),createHash('sha1').update(files['manifest.json']).digest('hex'),'signature binds the manifest');
  assert.notEqual(pass.serialNumber,JSON.parse(strFromU8(unzipSync(buildPass(body,config))['pass.json'])).serialNumber);
});
test('bounded photo and all language packages',()=>{
  const image=new PNG({width:180,height:180});image.data.fill(255);
  const photo='data:image/png;base64,'+PNG.sync.write(image).toString('base64');
  for(const language of ['en','ja','zh','ko']){const files=unzipSync(buildPass({...body,language,photo},config));assert.ok(files['thumbnail@2x.png']);assert.equal(PNG.sync.read(Buffer.from(files['icon.png'])).width,29);}
  assert.throws(()=>validateCard({...body,language:'__proto__'}));
  assert.throws(()=>validateCard({...body,card:{...body.card,weight:'NaN'}}));
  assert.throws(()=>validateCard({...body,card:{...body.card,conditions:'x'.repeat(1601)}}));
  assert.throws(()=>validateCard({...body,photo:'data:image/png;base64,eA=='}));
  assert.throws(()=>configuration({}),e=>e.status===503);
  assert.throws(()=>validateCertificates({...config,teamIdentifier:'WRONGTEAM'}),e=>e.status===503);
});
test('HTTP privacy, origin checks, limits and missing certificates',async()=>{
  const env={ALLOWED_ORIGINS:'http://127.0.0.1:8766',PASS_TYPE_IDENTIFIER:config.passTypeIdentifier,APPLE_TEAM_IDENTIFIER:config.teamIdentifier};
  for(const [key,value] of [['PASS_CERTIFICATE_BASE64',config.certificates.signerCert],['PASS_PRIVATE_KEY_BASE64',config.certificates.signerKey],['APPLE_WWDR_CERTIFICATE_BASE64',config.certificates.wwdr]])env[key]=Buffer.from(value).toString('base64');
  const server=createServer(createHandler(env));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}/api/wallet-pass`;
  const request=(data,origin='http://127.0.0.1:8766')=>fetch(url,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
  try{
    const response=await request(body);assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(response.headers.get('content-type'),'application/vnd.apple.pkpass');assert.ok((await response.arrayBuffer()).byteLength>1000);
    assert.equal((await request(body,'https://other.example')).status,403);
    assert.equal((await request({})).status,400);
    assert.equal((await request({pad:'x'.repeat(140000)})).status,413);
    for(let i=0;i<20;i++)await request({});assert.equal((await request(body)).status,429);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
