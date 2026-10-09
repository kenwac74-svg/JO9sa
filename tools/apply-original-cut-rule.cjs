'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const project='C:/Users/Ken Choung/Documents/Codex/2026-10-06/task/JO9sa',game='C:/MOVE/Jack O Nine Tails v2.3 Kor_nosex/game',original='G:/내 드라이브/Moding/JO9main/game';
const cat=path.join(project,'tools/local-workspace/catalog'),runtime=path.join(project,'tools/local-workspace/runtime'),helpers=path.join(project,'tools/text-workshop');
const core=require(path.join(helpers,'core.cjs')),registrar=require(path.join(helpers,'original-cuts.cjs')),catalog=require(path.join(helpers,'catalog.cjs')).create(cat),api=require(path.join(helpers,'image-cuts.cjs')).create(game,cat,catalog,runtime);
const target=path.join(game,'jack.qsp'),before=fs.readFileSync(target),beforeDoc=core.parse(before),status=catalog.state(),selected=registrar.readRows(cat).filter(d=>status.items[d[0]]?.includes('spare'));
assert.equal(core.hash(before),'9ed938684d9750e5903be572bddb55a16cf74f919f2f8b6b9744a102c09f1d7d','검증했던 게임 파일과 달라졌습니다.');
const imageHashes=new Map(selected.map(d=>[d[0],core.hash(fs.readFileSync(path.join(game,d[0])))]));
const registration=registrar.register(game,cat,original,runtime);let refreshed;
try{refreshed=api.refresh('original_B_bulk_'+Date.now());}catch(error){if(core.hash(fs.readFileSync(target))===core.hash(before))registrar.rollback(registration);throw error;}
const after=fs.readFileSync(target),afterDoc=core.parse(after),loc=afterDoc.locations.find(l=>l.name==='interior_change');
assert.ok(core.serialize(afterDoc).equals(after));assert.equal(afterDoc.locations.length,beforeDoc.locations.length);
for(let i=0;i<beforeDoc.lines.length;i++)if(i!==loc.body)assert.equal(afterDoc.lines[i],beforeDoc.lines[i],'전환 목록 밖의 QSP 필드가 변경됨');
const old=core.shift(beforeDoc.lines[loc.body],5),next=core.shift(afterDoc.lines[loc.body],5),start=' if jo9_selected < 0: jo9_selected = 0\r\n',end='\r\n if jo9_selected >= jo9_count:';
const withoutRegistry=s=>s.slice(0,s.indexOf(start)+start.length)+s.slice(s.indexOf(end,s.indexOf(start)));
assert.equal(withoutRegistry(next),withoutRegistry(old),'이미지 전환 코드의 동작이 변경됨');
for(const d of selected)assert.equal(core.hash(fs.readFileSync(path.join(game,d[0]))),imageHashes.get(d[0]),'A 이미지가 변경됨');
for(const e of registration.registered){const source=path.join(original,e.source);assert.equal(core.hash(fs.readFileSync(source)),e.sourceSha);assert.equal(api.resolveAlias(e.alias),fs.realpathSync(source));assert.ok(!fs.existsSync(path.join(game,'content/pic',e.alias)),'B 이미지가 복사됨');assert.ok(next.includes("$jo9_path = '"+e.target+"'"),'게임 전환 목록에 원본 누락');}
assert.equal(Object.keys(api.reservations()).length,selected.length);
const added=registrar.exposeCatalog(cat,catalog,registration.registered,runtime);
const checks=['bg/beach.png','characters/sdf.png','reserve/bg/beach.png','characters/Tsyuansu.png'].filter(p=>fs.existsSync(path.join(game,'content/pic',p))).map(p=>{const plan=api.info(p);return{base:plan.base,next:plan.next,cuts:plan.cuts,originalPending:plan.originalPending};});
fs.copyFileSync(path.join(project,'mods/2026-10-08_persistent_image_cycle.json'),path.join(__dirname,'../mods/2026-10-08_persistent_image_cycle.json'));
const report={created:new Date().toISOString(),game,original,selected:selected.length,linked:registration.registered.length,pending:registration.pending,ignored:registration.ignored,catalogAdded:added.length,imageCopies:0,imageBytesChanged:0,qspBefore:core.hash(before),qspAfter:core.hash(after),locations:afterDoc.locations.length,manifest:registration.manifest,link:registration.link,registrationBackup:registration.backup,qspPatch:refreshed,checks};
const reportFile=path.join(runtime,'original-cut-rule-report.json');fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(__dirname,'../tmp/original-cut-rule-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({selected:report.selected,linked:report.linked,pending:report.pending.length,catalogAdded:report.catalogAdded,imagesCopied:0,qspBefore:report.qspBefore,qspAfter:report.qspAfter,checks,report:reportFile},null,2));
