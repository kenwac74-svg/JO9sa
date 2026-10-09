'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const FIXED_ORIGIN='http://127.0.0.1:5269',CACHE_MS=1500,TIMEOUT_MS=1800;

function registration(game){
 try{
  for(const dir of [game,path.join(game,'modtools'),path.join(game,'modtools','runtime')]){
   const st=fs.lstatSync(dir);if(!st.isDirectory()||st.isSymbolicLink())return null;
  }
  const read=name=>{
   const file=path.join(game,'modtools','runtime',name),st=fs.lstatSync(file);
   if(!st.isFile()||st.isSymbolicLink()||st.size>64)return null;
   const fd=fs.openSync(file,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW||0));
   try{
    const opened=fs.fstatSync(fd);
    if(!opened.isFile()||opened.size>64||opened.ino!==st.ino||opened.dev!==st.dev)return null;
    const raw=fs.readFileSync(fd,'ascii').trim();
    return /^\d{1,10}$/.test(raw)?{value:Number(raw),stamp:[st.ino,st.size,st.mtimeMs,st.ctimeMs,raw].join(':')}:null;
   }finally{fs.closeSync(fd);}
  };
  const port=read('port.txt'),pid=read('server.pid');
  if(!port||!pid||port.value<1||port.value>65535||pid.value<1||pid.value>4294967295)return null;
  return {port:port.value,pid:pid.value,key:port.stamp+'|'+pid.stamp};
 }catch{return null;}
}

function alive(record){
 return new Promise(resolve=>{
  let settled=false,request,timer;
  const done=ok=>{if(settled)return;settled=true;clearTimeout(timer);resolve(ok);};
  timer=setTimeout(()=>{done(false);request?.destroy();},TIMEOUT_MS);
  request=http.get({hostname:'127.0.0.1',port:record.port,path:'/api/status',agent:false},response=>{
   if(response.statusCode!==200){done(false);request.destroy();return;}
   let size=0,text='';response.setEncoding('utf8');
   response.on('data',chunk=>{size+=Buffer.byteLength(chunk);if(size>4096){done(false);request.destroy();}else text+=chunk;});
   response.on('end',()=>{
    try{const value=JSON.parse(text);done(value.alive===true&&value.pid===record.pid&&value.port===record.port);}catch{done(false);}
   });
   response.on('error',()=>done(false));
  });
  request.on('error',()=>done(false));
 });
}

// The fixed port remains compatible. A dynamic origin must match this game's
// current runtime registration and the live workshop identity; no wildcard CORS.
function create(game){
 let cache=null;
 return async origin=>{
  if(origin===FIXED_ORIGIN)return true;
  if(typeof origin!=='string'||!/^http:\/\/127\.0\.0\.1:[1-9]\d{0,4}$/.test(origin))return false;
  const record=registration(game);
  if(!record||origin!=='http://127.0.0.1:'+record.port){cache=null;return false;}
  if(!cache||cache.key!==record.key||cache.until<=Date.now()){
   const pending=alive(record);cache={key:record.key,until:Date.now()+CACHE_MS,pending};
  }
  const ok=await cache.pending;
  // A new workshop registration while the status request was running invalidates it.
  const current=registration(game);
  return ok&&current?.key===record.key;
 };
}
module.exports={create};
