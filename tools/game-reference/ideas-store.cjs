'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),model=require('./ideas-core.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function error(status,message){const e=new Error(message);e.status=status;return e;}
function createStore(file){
 file=path.resolve(file);
 const empty=Buffer.from(JSON.stringify({schema:1,items:[]})+'\n');
 function read(){
  let bytes;
  try{bytes=fs.readFileSync(file);}catch(e){if(e.code==='ENOENT')return{schema:1,items:[],revision:hash(empty),storagePath:file};throw error(500,'개인 아이디어 파일을 읽을 수 없습니다: '+file);}
  let doc;try{doc=model.document(JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,'')));}catch(e){throw error(500,'개인 아이디어 파일이 손상되었거나 형식이 다릅니다. 원본을 보존했습니다: '+file);}
  return{...doc,revision:hash(bytes),storagePath:file};
 }
 function requireRevision(expected,current){if(expected!==current.revision)throw error(409,'다른 창이나 파일에서 내용이 변경됐습니다. 최신 목록을 불러온 뒤 다시 저장하세요.');}
 function commit(expected,items){
  requireRevision(expected,read());const doc=model.document({schema:1,items}),bytes=Buffer.from(JSON.stringify(doc,null,2)+'\n');
  fs.mkdirSync(path.dirname(file),{recursive:true});const pending=file+'.'+process.pid+'.'+crypto.randomUUID()+'.tmp';
  try{fs.writeFileSync(pending,bytes,{flag:'wx'});requireRevision(expected,read());fs.renameSync(pending,file);}finally{if(fs.existsSync(pending))fs.unlinkSync(pending);}
  return read();
 }
 function upsert(expected,input){const current=read();requireRevision(expected,current);const id=input.id||crypto.randomUUID(),old=current.items.find(x=>x.id===id),item=model.makeItem(input,{id,existing:old,now:new Date().toISOString()});const items=current.items.map(x=>x.id===id?item:x);if(!old)items.push(item);return commit(expected,items);}
 function remove(expected,id){const current=read();requireRevision(expected,current);if(!current.items.some(x=>x.id===id))throw error(404,'아이디어를 찾을 수 없습니다.');return commit(expected,current.items.filter(x=>x.id!==id));}
 function importIdeas(expected,value){const current=read();requireRevision(expected,current);const merged=model.mergeImport(current.items,value);if(!merged.added)return{...current,added:0,skipped:merged.skipped};return{...commit(expected,merged.items),added:merged.added,skipped:merged.skipped};}
 return{read,upsert,remove,import:importIdeas,file};
}
module.exports={createStore};
