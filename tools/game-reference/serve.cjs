'use strict';
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const root=__dirname,file=path.join(root,'jo9-reference.html');
const readyAt=process.argv.indexOf('--ready'),ready=readyAt>=0?path.resolve(process.argv[readyAt+1]):null;
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
 if(url.pathname==='/api/status'){
  const data=JSON.stringify({app:'jo9-game-reference',pid:process.pid,root});
  res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}).end(req.method==='HEAD'?undefined:data);return;
 }
 if(url.pathname!=='/'){res.writeHead(404).end();return;}
 const page=fs.readFileSync(file);
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Length':page.length}).end(req.method==='HEAD'?undefined:page);
});
server.listen(Number(process.argv[2])||0,'127.0.0.1',()=>{
 const info={app:'jo9-game-reference',pid:process.pid,root,url:'http://127.0.0.1:'+server.address().port+'/'};
 if(ready){fs.mkdirSync(path.dirname(ready),{recursive:true});fs.writeFileSync(ready+'.tmp',JSON.stringify(info));fs.renameSync(ready+'.tmp',ready);}
 console.log(info.url);
});
