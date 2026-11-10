'use strict';
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),crypto=require('node:crypto'),{createStore}=require('./ideas-store.cjs');
const apiVersion=2;
const build=['serve.cjs','ideas-core.cjs','ideas-store.cjs'].map(name=>crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,name))).digest('hex')).join(':');
function createServer(options={}){
 const root=path.resolve(options.root||__dirname),file=path.join(root,'jo9-reference.html'),store=createStore(options.ideasFile||path.join(root,'runtime','ideas.json'));
 const server=http.createServer(async(req,res)=>{
  const send=(status,data,headers={})=>{const body=Buffer.isBuffer(data)?data:Buffer.from(typeof data==='string'?data:JSON.stringify(data));res.writeHead(status,{'Content-Type':Buffer.isBuffer(data)?'text/html; charset=utf-8':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Length':body.length,...headers});res.end(req.method==='HEAD'?undefined:body);};
  try{
   const port=server.address().port,hosts=['127.0.0.1:'+port,'localhost:'+port];
   if(!hosts.includes(String(req.headers.host||'').toLowerCase())||(req.headers.origin&&!hosts.some(h=>req.headers.origin==='http://'+h))){send(403,{error:'이 도구에서 연 요청만 허용합니다.'});return;}
   const url=new URL(req.url,'http://127.0.0.1'),route=url.pathname;
   if(['GET','HEAD'].includes(req.method)){
    if(route==='/api/status'){send(200,{app:'jo9-game-reference',apiVersion,build,pid:process.pid,root});return;}
    if(route==='/api/ideas'){send(200,store.read());return;}
    if(route==='/api/ideas/export'){const data=store.read();send(200,{schema:1,items:data.items});return;}
    if(route==='/'){send(200,fs.readFileSync(file));return;}
    send(404,{error:'찾을 수 없습니다.'});return;
   }
   if(req.method!=='POST'||!['/api/ideas','/api/ideas/delete','/api/ideas/import'].includes(route)){send(405,{error:'지원하지 않는 요청입니다.'});return;}
   if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')){send(415,{error:'JSON 요청이 필요합니다.'});return;}
   const chunks=[];let length=0;
   for await(const chunk of req){length+=chunk.length;if(length>4*1024*1024){send(413,{error:'아이디어 JSON이 4MB를 넘습니다.'});return;}chunks.push(chunk);}
   let input;try{input=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch(e){send(400,{error:'JSON을 읽을 수 없습니다.'});return;}
   if(!input||typeof input!=='object'||Array.isArray(input)){send(400,{error:'요청 형식을 확인하세요.'});return;}
   let result;
   if(route==='/api/ideas'){if(!input.item||typeof input.item!=='object'||Array.isArray(input.item)){send(400,{error:'아이디어 내용을 확인하세요.'});return;}result=store.upsert(input.revision,input.item);}
   else if(route==='/api/ideas/delete')result=store.remove(input.revision,input.id);
   else result=store.import(input.revision,input.document);
   send(200,result);
  }catch(e){if(!res.headersSent)send(e.status||500,{error:e.status?e.message:'개인 기록을 저장하지 못했습니다. 입력과 기존 파일을 유지했습니다.'});else res.end();}
 });
 return server;
}
if(require.main===module){
 const root=__dirname,readyAt=process.argv.indexOf('--ready'),ready=readyAt>=0?path.resolve(process.argv[readyAt+1]):null,server=createServer({root});
 server.listen(Number(process.argv[2])||0,'127.0.0.1',()=>{
  const info={app:'jo9-game-reference',apiVersion,build,pid:process.pid,root,url:'http://127.0.0.1:'+server.address().port+'/'};
  if(ready){fs.mkdirSync(path.dirname(ready),{recursive:true});fs.writeFileSync(ready+'.tmp',JSON.stringify(info));fs.renameSync(ready+'.tmp',ready);}
  console.log(info.url);
 });
}
module.exports={createServer,apiVersion,build};
