import {randomUUID, X509Certificate, createPrivateKey, createPublicKey} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {PKPass} from 'passkit-generator';
import {PNG} from 'pngjs';

export class RequestError extends Error {constructor(status,message){super(message);this.status=status;}}
const labels={
  en:['Name','Breed','Weight','Medical conditions','Allergies','Current medications','Owner','Phone','Emergency contact','Microchip no.','Regular vet'],
  ja:['名前','犬種','体重','持病','アレルギー','服用中の薬','飼い主','電話','緊急連絡先','マイクロチップ番号','かかりつけ動物病院'],
  zh:['名字','品种','体重','既往病史','过敏','正在服用的药物','主人','电话','紧急联系人','芯片号','常去的宠物医院'],
  ko:['이름','견종','체중','지병','알레르기','복용 중인 약','보호자','전화','비상 연락처','마이크로칩 번호','주치 동물병원']
};
const keys=['name','breed','weight','conditions','allergies','medications','owner','phone','emergency','chip','vet'];
const notes={en:'Owner-provided information. Free-text notes and medication names remain in their original language. Not an official certificate.',ja:'飼い主が提供した情報です。自由記入のメモ・薬名は原文のままです。公的な証明書ではありません。',zh:'信息由主人提供。自由填写的备注及药名保留原文。本卡不是官方证明。',ko:'보호자 제공 정보입니다. 직접 쓴 메모와 약 이름은 원문입니다. 원본 증명서를 대신하지 않습니다.'};

export function configuration(env=process.env){
  const required=['PASS_TYPE_IDENTIFIER','APPLE_TEAM_IDENTIFIER','PASS_CERTIFICATE_BASE64','PASS_PRIVATE_KEY_BASE64','APPLE_WWDR_CERTIFICATE_BASE64'];
  if(required.some(k=>!env[k])) throw new RequestError(503,'Wallet 카드 발급 준비 중입니다. PNG 저장을 이용해 주세요.');
  const config={passTypeIdentifier:env.PASS_TYPE_IDENTIFIER,teamIdentifier:env.APPLE_TEAM_IDENTIFIER,
    certificates:{signerCert:Buffer.from(env.PASS_CERTIFICATE_BASE64,'base64'),signerKey:Buffer.from(env.PASS_PRIVATE_KEY_BASE64,'base64'),wwdr:Buffer.from(env.APPLE_WWDR_CERTIFICATE_BASE64,'base64'),signerKeyPassphrase:env.PASS_PRIVATE_KEY_PASSPHRASE||undefined}};
  validateCertificates(config);return config;
}
export function validateCertificates(config){
  try{
    const cert=new X509Certificate(config.certificates.signerCert),wwdr=new X509Certificate(config.certificates.wwdr);
    const key=createPrivateKey({key:config.certificates.signerKey,passphrase:config.certificates.signerKeyPassphrase});
    const now=Date.now();
    for(const c of [cert,wwdr]) if(now<Date.parse(c.validFrom)||now>=Date.parse(c.validTo)) throw new Error('expired');
    const subject=cert.subject.split('\n');
    if(!subject.includes('UID='+config.passTypeIdentifier)||!subject.includes('OU='+config.teamIdentifier)) throw new Error('identifier mismatch');
    if(!cert.verify(wwdr.publicKey)) throw new Error('issuer mismatch');
    if(!cert.publicKey.export({type:'spki',format:'der'}).equals(createPublicKey(key).export({type:'spki',format:'der'}))) throw new Error('key mismatch');
  }catch(_){throw new RequestError(503,'Wallet 인증서 설정을 확인해야 합니다. PNG 저장을 이용해 주세요.');}
}
function resized(input,width,height){
  const out=new PNG({width,height});
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const from=(Math.min(input.height-1,Math.floor(y*input.height/height))*input.width+Math.min(input.width-1,Math.floor(x*input.width/width)))*4;
    input.data.copy(out.data,(y*width+x)*4,from,from+4);
  }
  return PNG.sync.write(out);
}
const icon=PNG.sync.read(readFileSync(new URL('./assets/icon.png',import.meta.url)));
const assets=Object.fromEntries([1,2,3].map(scale=>[`icon${scale===1?'':'@'+scale+'x'}.png`,resized(icon,29*scale,29*scale)]));

export function validateCard(body){
  if(!body || typeof body!=='object' || !Object.hasOwn(labels,body.language) || !body.card || typeof body.card!=='object' || Array.isArray(body.card)) throw new RequestError(400,'카드 정보를 확인해 주세요.');
  const card={};
  for(const key of keys){const value=body.card[key];if(value!=null && (typeof value!=='string'||value.length>(['conditions','allergies','medications'].includes(key)?1600:200))) throw new RequestError(400,'카드 항목이 너무 길거나 형식이 잘못됐습니다.');card[key]=(value||'').trim();}
  if(!card.name || !card.phone || !card.weight || !Number.isFinite(Number(card.weight)) || Number(card.weight)<=0 || Number(card.weight)>100) throw new RequestError(400,'이름·체중·보호자 전화를 확인해 주세요.');
  let thumbnail;
  if(body.photo){
    if(typeof body.photo!=='string'||body.photo.length>90000||!/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(body.photo)) throw new RequestError(400,'사진 형식을 확인해 주세요.');
    const buffer=Buffer.from(body.photo.split(',')[1],'base64');
    // Check dimensions before decompression to bound memory use.
    if(buffer.length<24||buffer.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||buffer.readUInt32BE(16)!==180||buffer.readUInt32BE(20)!==180) throw new RequestError(400,'사진 크기를 확인해 주세요.');
    try{const image=PNG.sync.read(buffer);thumbnail={'thumbnail.png':resized(image,90,90),'thumbnail@2x.png':buffer,'thumbnail@3x.png':resized(image,270,270)};}catch(_){throw new RequestError(400,'사진을 읽지 못했습니다.');}
  }
  return {language:body.language,card,thumbnail};
}
export function buildPass(body,config){
  const {language,card,thumbnail}=validateCard(body);validateCertificates(config);
  const text=labels[language],title={en:'Pet Medical Information',ja:'ペット医療情報カード',zh:'宠物医疗信息卡',ko:'반려견 의료 정보 카드'}[language];
  const pass=new PKPass({...assets,...thumbnail},config.certificates,{formatVersion:1,passTypeIdentifier:config.passTypeIdentifier,teamIdentifier:config.teamIdentifier,serialNumber:randomUUID(),organizationName:'PawTrip',description:title,logoText:'PawTrip · My Card',backgroundColor:'rgb(22, 52, 73)',foregroundColor:'rgb(255, 255, 255)',labelColor:'rgb(215, 229, 238)',sharingProhibited:true});
  pass.type='generic';
  pass.primaryFields.push({key:'name',label:text[0],value:card.name});
  pass.secondaryFields.push({key:'weight',label:text[2],value:card.weight+' kg'},{key:'phone',label:text[7],value:card.phone});
  pass.auxiliaryFields.push({key:'conditions',label:text[3],value:card.conditions||'—'},{key:'allergies',label:text[4],value:card.allergies||'—'});
  keys.forEach((key,i)=>{if(card[key])pass.backFields.push({key:'detail-'+key,label:text[i],value:key==='weight'?card[key]+' kg':card[key]});});
  pass.backFields.push({key:'note',label:'PawTrip',value:notes[language]},{key:'generated',label:'Created / 作成 / 생성일',value:new Date().toISOString().slice(0,10)},{key:'site',label:'Website',value:'https://pawtrip.us'});
  return pass.getAsBuffer();
}
