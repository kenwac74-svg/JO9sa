'use strict';
const fs=require('node:fs'); const path=require('node:path'); const http=require('node:http'); const crypto=require('node:crypto');
const core=require('./core.cjs');
const scenes=require('./scenes.cjs');
const arg=n=>{const i=process.argv.indexOf(n);return i<0 ? undefined : process.argv[i+1];};
const game=path.resolve(arg('--game-dir') || 'G:/somi/JO9/game');
const target=path.join(game,'jack.qsp');
const runtime=path.resolve(arg('--runtime') || path.join(__dirname,'runtime'));
fs.mkdirSync(runtime,{recursive:true});
const backups=path.join(runtime,'backups');fs.mkdirSync(backups,{recursive:true});
const token=crypto.randomBytes(24).toString('hex'); let cache,cacheEntries,navigator,preview; let busy=false;
function current() {
  const raw=fs.readFileSync(target);const digest=core.hash(raw);
  if(!cache || cache.hash!==digest){cache=core.parse(raw);cacheEntries=core.entries(cache);navigator=scenes.buildNavigator(cache,cacheEntries);}
  return {raw,doc:cache};
}
function history() {return fs.readdirSync(backups).filter(n=>/^\d.*\.json$/.test(n)).sort().reverse().map(n=>JSON.parse(fs.readFileSync(path.join(backups,n),'utf8')));}
function transact(before,after,details) {
  if(busy) throw Error('다른 반영 작업이 진행 중입니다.'); busy=true;
  const id=new Date().toISOString().replace(/[:.]/g,'-')+'_'+crypto.randomBytes(3).toString('hex');
  const tmp=path.join(game,`.jack-text-${id}.tmp`);
  const backup=path.join(backups,id+'.qsp');const record=path.join(backups,id+'.json');
  const meta={id,date:new Date().toISOString(),before:core.hash(before),after:core.hash(after),target,...details,status:'prepared'};
  try {
    if(core.hash(fs.readFileSync(target))!==meta.before) throw Error('반영 직전 QSP가 바뀌었습니다. 다시 검색해 주세요.');
    fs.writeFileSync(backup,before,{flag:'wx'});
    if(!fs.readFileSync(backup).equals(before)) throw Error('백업 검사가 실패했습니다.');
    fs.writeFileSync(record,JSON.stringify(meta,null,2),{flag:'wx'});
    fs.writeFileSync(tmp,after,{flag:'wx'});
    if(!fs.readFileSync(tmp).equals(after)) throw Error('임시 파일 검사가 실패했습니다.');
    if(core.hash(fs.readFileSync(target))!==meta.before) throw Error('다른 프로그램이 QSP를 수정했습니다. 반영을 중단했습니다.');
    fs.renameSync(tmp,target);
    if(core.hash(fs.readFileSync(target))!==meta.after) throw Error('저장 후 검사 실패: 백업을 확인하세요.');
    meta.status='applied';fs.writeFileSync(record,JSON.stringify(meta,null,2));cache=null;preview=null;return meta;
  } catch(e) {
    meta.status='failed';meta.error=e.message;
    if(fs.existsSync(record))fs.writeFileSync(record,JSON.stringify(meta,null,2));throw e;
  } finally {if(fs.existsSync(tmp))fs.unlinkSync(tmp);busy=false;}
}
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
async function body(req){let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>3000000)throw Error('입력 크기가 너무 큽니다.');}return JSON.parse(text);}
const server=http.createServer(async(req,res)=>{
  try {
    const host=`127.0.0.1:${server.address().port}`;
    if(req.headers.host!==host){json(res,403,{error:'허용되지 않은 접속 주소입니다.'});return;}
    const url=new URL(req.url,'http://'+host);
    if(req.method==='GET' && url.pathname==='/'){
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"});
      res.end(fs.readFileSync(path.join(__dirname,'index.html'),'utf8').replace('__SESSION_TOKEN__',token));return;
    }
    if(req.headers['x-jo9-token']!==token) {json(res,403,{error:'편집기를 다시 열어 주세요.'});return;}
    if(req.headers.origin && req.headers.origin!=='http://'+host){json(res,403,{error:'다른 사이트에서는 사용할 수 없습니다.'});return;}
    if(req.method==='GET' && url.pathname==='/api/state'){
      const {doc}=current();json(res,200,{target,hash:doc.hash,locations:doc.locations.length,backups});return;
    }
    if(req.method==='GET' && url.pathname==='/api/search'){
      const query=(url.searchParams.get('q')||'').trim(),loc=(url.searchParams.get('location')||'').trim();
      if(query.length<2 && !loc)throw Error('원문 일부를 두 글자 이상 입력하거나 위치 이름을 넣어 주세요.');
      const {doc}=current();const found=cacheEntries.filter(e=>(!query || e.text.includes(query)) && (!loc || e.location.includes(loc)));
      json(res,200,{hash:doc.hash,total:found.length,results:found.slice(0,200).map(e=>({...e,hash:doc.hash}))});return;
    }
    if(req.method==='GET' && url.pathname==='/api/history'){json(res,200,history().map(({id,date,location,field,status,before,after,kind})=>({id,date,location,field,status,before,after,kind})));return;}
    if(req.method==='POST' && url.pathname==='/api/context'){
      const input=await body(req);current();json(res,200,navigator.context(input.selection,input.sceneId));return;
    }
    if(req.method==='POST' && url.pathname==='/api/scene'){
      const input=await body(req);const {doc}=current();if(input.hash!==doc.hash)throw Error('QSP가 바뀌었습니다. 다시 검색해 주세요.');json(res,200,navigator.open(input.destination));return;
    }
    if(req.method==='POST' && url.pathname==='/api/incoming'){
      const input=await body(req);current();json(res,200,navigator.incoming(input));return;
    }
    if(req.method==='GET' && url.pathname==='/api/export'){
      const id=url.searchParams.get('id');if(!/^[\dTZ_-]+[a-f0-9]{6}$/.test(id||''))throw Error('잘못된 기록 번호입니다.');
      const m=history().find(e=>e.id===id);if(!m || !m.mod || m.status!=='applied')throw Error('내보낼 수정 기록이 없습니다.');json(res,200,m.mod);return;
    }
    if(req.method==='POST' && url.pathname==='/api/preview'){
      const input=await body(req);const {doc}=current();const p=core.prepare(doc,input.selection,input.replacement);
      preview={...p,before:doc.hash,id:crypto.randomBytes(24).toString('hex')};
      json(res,200,{id:preview.id,location:p.entry.location,field:p.entry.field,line:p.entry.line,old:p.entry.text,new:p.replacement,after:p.after});return;
    }
    if(req.method==='POST' && url.pathname==='/api/apply'){
      const input=await body(req);if(!preview || input.id!==preview.id || input.approved!==true)throw Error('미리보기와 수정문 승인이 필요합니다.');
      const p=preview,{raw,doc}=current();if(doc.hash!==p.before)throw Error('미리보기 이후 QSP가 변경되었습니다. 다시 검색해 주세요.');
      if(doc.locations.filter(l=>l.name===p.entry.location).length!==1)throw Error('동일한 이름의 위치가 중복되어 반영할 수 없습니다.');
      const mod={id:'text_'+new Date().toISOString().replace(/[:.]/g,'-'),before_sha256:p.before,after_sha256:p.after,edits:[{location:p.entry.location,field:p.entry.field,old:p.oldField,new:p.newField,count:1}]};
      const m=transact(raw,p.raw,{kind:'edit',location:p.entry.location,field:p.entry.field,line:p.entry.line,mod});current();
      const updated=cacheEntries.find(e=>e.fieldIndex===p.entry.fieldIndex&&e.start===p.entry.start);
      json(res,200,{...m,selection:updated?{...updated,hash:cache.hash}:null});return;
    }
    if(req.method==='POST' && url.pathname==='/api/restore'){
      const input=await body(req),m=history().find(e=>e.id===input.id);
      if(!m || m.status!=='applied')throw Error('복원할 기록을 찾지 못했습니다.');
      const {raw,doc}=current();if(doc.hash!==m.after)throw Error('이 기록 이후 다른 변경이 있습니다. 최근 변경부터 되돌려 주세요.');
      const old=fs.readFileSync(path.join(backups,m.id+'.qsp'));if(core.hash(old)!==m.before)throw Error('백업 내용이 기록과 다릅니다.');core.parse(old);
      json(res,200,transact(raw,old,{kind:'restore',location:m.location,field:m.field,restores:m.id}));return;
    }
    json(res,404,{error:'요청을 찾지 못했습니다.'});
  }catch(e){json(res,400,{error:e.message});}
});
current();
server.listen(Number(arg('--port')||0),'127.0.0.1',()=>{
  const state={url:`http://127.0.0.1:${server.address().port}/`,pid:process.pid,target};
  fs.writeFileSync(path.join(runtime,'server.json'),JSON.stringify(state,null,2));console.log(JSON.stringify(state));
});
