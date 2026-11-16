const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib'),vm=require('node:vm');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',task='json-character-discovery-20261111';
const record=repo+'/records/'+task,backup='G:/somi/JO9_work_backups/'+task;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFileSync(p),text=p=>read(p).toString('utf8').replace(/^\uFEFF/,'');
function capture(p){if(!fs.existsSync(p))return null;const bytes=read(p),hash=sha(bytes),dest=backup+'/'+hash+'.gz';fs.mkdirSync(backup,{recursive:true});if(!fs.existsSync(dest))fs.writeFileSync(dest,zlib.gzipSync(bytes),{flag:'wx'});return {sha256:hash,bytes:bytes.length,backup:dest};}
function protectedFiles(){const result={};for(const rel of ['jack.qsp','modtools/catalog/catalog_status.js','modtools/catalog/patch-schedule.json','modtools/game-reference/runtime/ideas.json']){const p=game+'/'+rel;if(fs.existsSync(p))result[p]=sha(read(p));}
 for(const name of fs.readdirSync(game+'/json/slaves'))if(/\.json$/i.test(name)){const p=game+'/json/slaves/'+name;if(fs.lstatSync(p).isFile())result[p]=sha(read(p));}
 const c=JSON.parse(text(game+'/json/slaves/3040_chunhyang.json'));for(const val of Object.values(c)){if(typeof val!=='string')continue;const r=val.replaceAll('\\','/').replace(/^content\/pic\//i,'');if(!/^(?:girls|characters)\//i.test(r))continue;const p=game+'/content/pic/'+r.replace(/\.png$/i,'')+'.png';if(fs.existsSync(p))result[p]=sha(read(p));}return result;}
function protectedCheck(){const before=JSON.parse(text(record+'/before.json')).protected;let count=0;for(const [p,h]of Object.entries(before)){if(!fs.existsSync(p)||sha(read(p))!==h)throw Error('Protected input changed: '+p);count++;}return count;}
function write(p,b){fs.mkdirSync(path.dirname(p),{recursive:true});const tmp=p+'.json-discovery.tmp';if(fs.existsSync(tmp))throw Error('Staging file exists: '+tmp);try{fs.writeFileSync(tmp,b,{flag:'wx'});fs.renameSync(tmp,p);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}}
const mode=process.argv[2];
if(mode==='prepare'){
 fs.mkdirSync(record,{recursive:true});if(fs.existsSync(record+'/before.json'))throw Error('Baseline already captured');const files={};
 for(const p of [repo+'/tools/local-workspace/Open-Modding-Tools.ps1',repo+'/docs/modding/MOD_TOOLS_OPEN_20261021.md',repo+'/docs/SESSION_HANDOFF_INDEX.md',repo+'/tools/girls-image-checklist/README_KO.md',repo+'/tools/text-workshop/VERIFICATION.md',repo+'/assets/runtime-source-2.4.1.json',repo+'/tools/local-workspace/catalog-seed/catalog_merge_vs_original.html',game+'/modtools/catalog/catalog_merge_vs_original.html',game+'/modtools/catalog/JO9_캐릭터_이미지체크리스트.html',...['server.cjs','catalog.cjs','character-image-links.cjs','character-portrait-frame.cjs'].map(n=>game+'/modtools/text-workshop/'+n)])files[p]=capture(p);
 write(record+'/before.json',JSON.stringify({createdAt:new Date().toISOString(),files,protected:protectedFiles()},null,2)+'\n');console.log(JSON.stringify({backedUp:Object.keys(files).length,protected:Object.keys(protectedFiles()).length}));
}
if(mode==='sound'){
 const p=repo+'/tools/local-workspace/Open-Modding-Tools.ps1';let s=text(p);const before='($editorUrl+\'catalog\'),$workshopUrl,$reviewUrl,$soundUrl,$referenceUrl';const after='($editorUrl+\'catalog\'),$workshopUrl,$reviewUrl,$referenceUrl';if(!s.includes(before))throw Error('Sound opener anchor missing');s=s.replace(before,after);write(p,Buffer.concat([Buffer.from([239,187,191]),Buffer.from(s)]));
 const doc=repo+'/docs/modding/MOD_TOOLS_OPEN_20261021.md';write(doc,text(doc)+'\n\n## 2026-11-11 — 사운드 목록은 경로만 제공\n\n사용자 확정: 사운드 청취 목록은 자동으로 파일을 열지 않고 목록 링크/경로만 제공한다. 통합 실행기는 SoundAudition 출력은 유지하고 브라우저 자동 열기 대상에서 제외한다. 사용자가 직접 열기를 요청한 경우에만 파일 열기를 수행한다.\n');
 console.log(JSON.stringify({soundAutoOpenRemoved:true,soundPathOutputPreserved:true}));
}
if(mode==='install'){
 const ui=text(repo+'/tools/girls-image-checklist/catalog-girls-checklist.js').replace(/<\/(script|body|html)/gi,(_,x)=>'<\\/'+x);new vm.Script(ui);
 const installed=[];for(const p of [game+'/modtools/catalog/catalog_merge_vs_original.html',repo+'/tools/local-workspace/catalog-seed/catalog_merge_vs_original.html',game+'/modtools/catalog/JO9_캐릭터_이미지체크리스트.html']){
  const s=text(p),start='<!-- JO9 GIRLS CHECKLIST START 20261104 -->',end='<!-- JO9 GIRLS CHECKLIST END 20261104 -->';const a=s.indexOf(start),b=s.indexOf(end,a);if(a<0||b<0||s.indexOf(start,a+1)>=0)throw Error('Checklist block invalid: '+p);
  const block=s.slice(a,b),scripts=[...block.matchAll(/<script>([\s\S]*?)<\/script>/g)];if(scripts.length!==2||!scripts[0][1].trimStart().startsWith('window.JO9_GIRLS_CHECKLIST='))throw Error('Checklist scripts changed: '+p);
  const t=scripts[1],from=a+t.index,to=from+t[0].length,next=s.slice(0,from)+'<script>'+ui+'</script>'+s.slice(to);for(const m of next.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1]);
  capture(p);write(p,next);installed.push({path:p,sha256:sha(read(p)),outsideBlockPreserved:next.slice(0,a)===s.slice(0,a)&&next.slice(next.indexOf(end))===s.slice(b)});
 }
 for(const name of ['character-image-links.cjs','catalog.cjs','server.cjs','character-portrait-frame.cjs']){const source=repo+'/tools/text-workshop/'+name,to=game+'/modtools/text-workshop/'+name;new vm.Script(text(source));capture(to);write(to,read(source));installed.push({path:to,sha256:sha(read(to))});}
 write(record+'/installation.json',JSON.stringify({installedAt:new Date().toISOString(),installed,protectedUnchanged:protectedCheck()},null,2)+'\n');console.log(JSON.stringify({installed:installed.length,protectedUnchanged:protectedCheck()}));
}
if(mode==='verify')console.log(JSON.stringify({protectedUnchanged:protectedCheck()}));
