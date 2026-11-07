'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),live=require('./live-scene.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function create(game){
 const dir=path.join(game,'modtools','runtime');let memo=null;
 function file(name,max){for(const p of [game,path.join(game,'modtools'),dir]){const s=fs.lstatSync(p);if(!s.isDirectory()||s.isSymbolicLink())throw Error('감지 경로가 유효하지 않습니다.');}
  const p=path.join(dir,name),s=fs.lstatSync(p);if(!s.isFile()||s.isSymbolicLink()||s.size>max)throw Error('감지 파일이 유효하지 않습니다.');return fs.readFileSync(p);
 }
 function registration(){try{const port=Number(file('port.txt',64).toString().trim()),pid=Number(file('server.pid',64).toString().trim());return Number.isInteger(port)&&port>0&&port<=65535&&Number.isInteger(pid)&&pid>0?{url:'http://127.0.0.1:'+port+'/',pid}:null;}catch{return null;}}
 function state(doc,entries,navigator){
  const workshop=registration(),workshopUrl=workshop?.url||null;
  let context;try{context=JSON.parse(file('context.json',512*1024).toString('utf8').replace(/^\uFEFF/,''));}catch{return {id:'waiting:'+doc.hash+':'+workshopUrl,status:'waiting',workshopUrl,candidates:[],confident:false,text:'',resources:[]};}
  if(context.status!=='ok'&&context.status!=='no_resources')return {id:String(context.updated),status:'detect_error',error:String(context.error||'감지 결과를 읽을 수 없습니다.'),workshopUrl,candidates:[],confident:false};
  let html;try{html=file('show-html.html',4*1024*1024);}catch{return {id:String(context.updated),status:'snapshot_required',workshopUrl,candidates:[],confident:false,resources:context.resources||[],text:''};}
  if(sha(html)!==context.showHtmlSha256)return {id:String(context.updated),status:'snapshot_required',workshopUrl,candidates:[],confident:false,resources:context.resources||[],text:''};
  const id=[context.updated,doc.hash,context.showHtmlSha256,workshopUrl].join(':');if(memo?.id===id)return memo;
  const parsed=live.parse(html.toString('utf8'));
  const matched=live.match(parsed,entries,(entry,usageId)=>navigator.context({...entry,hash:doc.hash},undefined,'text',usageId));
  memo={id,status:'ok',updated:context.updated,workshopUrl,...parsed,...matched};return memo;
 }
 return {state,registration};
}
function forCandidate(snapshot,input,context){
 if(snapshot.status!=='ok'||snapshot.id!==input.liveSnapshotId)throw Error('SHOW HTML이 바뀌었습니다. 감지 결과를 다시 불러오세요.');
 const candidate=snapshot.candidates.find(c=>c.sceneId===input.sceneId&&(c.usageId||null)===(input.usageId||null)&&['hash','location','fieldIndex','start'].every(k=>c.selection[k]===input.selection[k]));
 if(!candidate)throw Error('현재 SHOW HTML에 연결되지 않은 대사입니다.');
 return {...context,images:snapshot.resources.map(r=>({path:live.imageKey(r.path),note:'SHOW HTML · 현재 화면'})),liveSnapshotId:snapshot.id};
}
module.exports={create,forCandidate};
