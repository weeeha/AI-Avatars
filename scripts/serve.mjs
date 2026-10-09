import http from 'node:http';
import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {byteRange} from './byte-range.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.webp':'image/webp','.gif':'image/gif','.mp4':'video/mp4','.md':'text/plain; charset=utf-8'};
const port=Number(process.env.PORT||4173);
http.createServer(async(req,res)=>{
  try{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(pathname.split('/').some(s=>s.startsWith('.'))){res.writeHead(404);res.end('Not found');return;}
    if(pathname.endsWith('/'))pathname+='index.html';
    const target=path.resolve(root,'.'+pathname);
    if(!target.startsWith(root+path.sep)){res.writeHead(404);res.end('Not found');return;}
    const stat=await fs.stat(target);
    if(!stat.isFile()){res.writeHead(404);res.end('Not found');return;}
    const headers={'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
    const range=req.headers.range?byteRange(req.headers.range,stat.size):null;
    if(req.headers.range&&!range){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});res.end();return;}
    const start=range?.start??0,end=range?.end??stat.size-1;
    headers['Content-Length']=Math.max(0,end-start+1);
    if(range)headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;
    res.writeHead(range?206:200,headers);
    if(req.method==='HEAD'||stat.size===0){res.end();return;}
    const stream=createReadStream(target,{start,end});
    stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`AI Avatars: http://127.0.0.1:${port}`));
