import {createServer} from 'node:http';
import {createHandler} from './handler.js';
const handler=createHandler();
createServer((req,res)=>{if(req.url?.split('?')[0]!=='/api/wallet-pass'){res.statusCode=404;return res.end();}handler(req,res);}).listen(Number(process.env.PORT||8787),process.env.HOST||'127.0.0.1',()=>console.log('PawTrip Wallet service listening (no request-body logging).'));
