import {buildPass,configuration,RequestError,validateCard} from './pass.js';
const MAX_BODY=128*1024;
const limits=new Map();
function readBody(req){
  if(req.body!==undefined){if(Buffer.byteLength(JSON.stringify(req.body))>MAX_BODY)throw new RequestError(413,'카드 정보가 너무 큽니다.');return Promise.resolve(req.body);}
  return new Promise((resolve,reject)=>{let total=0;const chunks=[];req.on('data',chunk=>{total+=chunk.length;if(total>MAX_BODY){chunks.length=0;reject(new RequestError(413,'카드 정보가 너무 큽니다.'));}else chunks.push(chunk);});req.on('end',()=>{if(total>MAX_BODY)return;try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch(_){reject(new RequestError(400,'카드 요청을 읽지 못했습니다.'));}});req.on('error',()=>reject(new RequestError(400,'카드 요청이 중단됐습니다.')));});
}
export function createHandler(env=process.env){
  const allowed=new Set((env.ALLOWED_ORIGINS||'https://pawtrip.us').split(',').map(s=>s.trim()).filter(Boolean));
  return async function handler(req,res){
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Vary','Origin');
    const origin=req.headers.origin;
    const json=(status,message)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify({message}));};
    if(!origin || !allowed.has(origin))return json(403,'이 사이트의 Wallet 발급 요청만 허용됩니다.');
    res.setHeader('Access-Control-Allow-Origin',origin);
    if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.statusCode=204;return res.end();}
    if(req.method!=='POST'){res.setHeader('Allow','POST, OPTIONS');return json(405,'POST 요청을 이용해 주세요.');}
    if((req.headers['content-type']||'').split(';')[0].trim()!=='application/json')return json(415,'JSON 형식으로 보내 주세요.');
    // Local instance limit. Production hosting must also apply an edge rate limit.
    const now=Date.now(),ip=req.socket?.remoteAddress||'unknown';
    for(const [key,value] of limits)if(now-value.since>60000)limits.delete(key);
    const rate=limits.get(ip)||{since:now,count:0};if(++rate.count>20){res.setHeader('Retry-After','60');return json(429,'잠시 후 다시 시도해 주세요.');}limits.set(ip,rate);
    try{
      const body=await readBody(req);validateCard(body);const config=configuration(env);const buffer=buildPass(body,config);
      res.setHeader('Content-Type','application/vnd.apple.pkpass');res.setHeader('Content-Disposition','attachment; filename="pawtrip-my-card.pkpass"');res.statusCode=200;res.end(buffer);
    }catch(err){json(err instanceof RequestError?err.status:500,err instanceof RequestError?err.message:'Wallet 카드를 만들지 못했어요. PNG 저장을 이용해 주세요.');}
  };
}
