'use strict';
// Only successful workshop writes establish ownership; directory mtimes do not.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function safe(p){if(typeof p!=='string'||!p||p.includes('\\')||p.startsWith('/')||/[\x00-\x1f:]/.test(p)||p.split('/').some(x=>!x||x==='.'||x==='..'||/[. ]$/.test(x)))throw Error('잘못된 패치 이미지 경로');return p;}
function create(game,catalogRoot){
 const root=path.join(catalogRoot,'image_work','personal-patch'),objects=path.join(root,'objects'),ledger=path.join(root,'events.jsonl');
 fs.mkdirSync(objects,{recursive:true});
 const settings=path.join(root,'settings.json');if(!fs.existsSync(settings))fs.writeFileSync(settings,JSON.stringify({version:1,trackingStarted:new Date().toISOString(),timezone:'Asia/Seoul',game,catalogRoot},null,2),{flag:'wx'});
 function record(r,operation='replace',imported=false){
  const key=r.id+':'+operation;
  const previous=fs.existsSync(ledger)?fs.readFileSync(ledger,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse):[];
  if(previous.some(e=>e.key===key))return;
  const files=(r.files||[{path:r.path,after:r.sha256,before:null}]).map(f=>{
   safe(f.path);const full=path.join(game,'content','pic',f.path),b=fs.readFileSync(full);
   if(hash(b)!==f.after)throw Error('패치 기록과 현재 이미지가 다릅니다: '+f.path);
   const object=path.join(objects,f.after);if(!fs.existsSync(object))fs.writeFileSync(object,b,{flag:'wx'});
   const beforePath=f.beforePath||(f.before?path.join(game,'content','pic','__JO9_ImageBackups',r.backupId||r.id,'original',f.path):null);
   return{path:f.path,after:f.after,before:f.before||null,bytes:b.length,beforePath};
  });
  const created=new Date(r.created);if(!Number.isFinite(+created))throw Error('작업 시각 오류');
  const event={version:1,key,id:r.id,created:created.toISOString(),createdKST:created.toLocaleString('sv-SE',{timeZone:'Asia/Seoul'})+' +09:00',recorded:new Date().toISOString(),operation,imported,files};
  fs.appendFileSync(ledger,JSON.stringify(event)+'\n');return event;
 }
 return{root,record};
}
module.exports={create,safe,hash};
if(require.main===module){
 const [game,catalogRoot,runtime]=process.argv.slice(2);if(!game||!catalogRoot)throw Error('사용법: node personal-patch.cjs GAME CATALOG RUNTIME');
 const tracker=create(game,catalogRoot),report={imported:0,skipped:[]};
 const backup=path.join(game,'content','pic','__JO9_ImageBackups');
 for(const name of fs.existsSync(backup)?fs.readdirSync(backup):[]){const p=path.join(backup,name,'manifest.json');if(!fs.existsSync(p))continue;const r=JSON.parse(fs.readFileSync(p,'utf8'));if(r.status!=='applied')continue;for(const f of r.files)try{if(tracker.record({...r,id:r.id+'_'+hash(Buffer.from(f.path)).slice(0,12),backupId:r.id,files:[f]},r.operation||'replace',true))report.imported++;}catch(e){report.skipped.push({id:r.id,path:f.path,reason:e.message});}}
 const cuts=path.join(runtime||'','cut-history');for(const name of runtime&&fs.existsSync(cuts)?fs.readdirSync(cuts).filter(n=>n.endsWith('.json')):[]){try{const r=JSON.parse(fs.readFileSync(path.join(cuts,name),'utf8'));if(tracker.record(r,'cut',true))report.imported++;}catch(e){report.skipped.push({id:name,reason:e.message});}}
 const progress=path.join(catalogRoot,'image_work','progress.json');
 if(fs.existsSync(progress))for(const item of JSON.parse(fs.readFileSync(progress,'utf8').replace(/^\uFEFF/,'' )).items||[]){
  // Imported checklist flags alone are explicitly not production evidence.
  if(!item.input_image||!item.completed_at||!item.sha256_after||item.work_status!=='placed')continue;
  const rel=item.relative_path.replaceAll('\\','/').replace(/^content\/pic\//i,'');
  try{const old=item.original_path&&fs.existsSync(item.original_path)?fs.readFileSync(item.original_path):null;if(tracker.record({id:'legacy_'+hash(Buffer.from(rel+item.sha256_after)).slice(0,24),created:item.completed_at,files:[{path:rel,after:item.sha256_after,before:old?hash(old):null,beforePath:old?item.original_path:null}]},'replace',true))report.imported++;}catch(e){report.skipped.push({path:rel,reason:e.message});}
 }
 fs.writeFileSync(path.join(tracker.root,'import-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({root:tracker.root,imported:report.imported,skipped:report.skipped.length}));
}
