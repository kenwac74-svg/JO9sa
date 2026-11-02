'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),a=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),hash=p=>c.hash(fs.readFileSync(p));
const input=read(__dirname+'/inputs.json'),candidate=read(__dirname+'/candidate.json'),{work,repo,tmp}=input;
const qa='G:/Codex/tmp/battle-fate-visual-qa-20261028';
const reports={official:qa+'/release-v1/run-fjmBO1/report.json',ui:qa+'/ui-green-v1/fate-ui-native-results.json',logic:qa+'/logic-v1/fate-native-results.json',paths:qa+'/asset-paths-v1/report.json',red:qa+'/ui-red/fate-ui-native-results.json'};
const r=Object.fromEntries(Object.entries(reports).map(([k,p])=>[k,read(p)]));
a.equal(r.official.verdict,'PASS');a.equal(r.official.checks.find(x=>x.name==='inputs-readable').detail.candidate,candidate.qspAfter);
a.equal(r.ui.status,'PASS');a.equal(r.ui.inputHashes[r.ui.candidate],candidate.qspAfter);
a.equal(r.logic.status,'PASS');a.equal(r.logic.inputHashes.candidate,candidate.qspAfter);
a.equal(r.paths.status,'PASS');a.equal(r.paths.candidateHash,candidate.qspAfter);
a.equal(hash(candidate.candidate),candidate.qspAfter);
for(const [f,h]of Object.entries(input.hashes))a.equal(hash(work+'/'+f),h,'WORK changed since input snapshot: '+f);
for(const [f,h]of Object.entries(input.tracked))a.equal(hash(repo+'/'+f),h,'Tracked file changed since input snapshot: '+f);
const patch='2026-10-28_battle_fate_visual.json',record=repo+'/records/battle-fate-visual-20261028';
a(!fs.existsSync(repo+'/mods/'+patch));a(!fs.existsSync(record));
for(const x of input.assets){a.equal(hash(x.source),x.sha256);a.equal(hash(candidate.game+'/'+x.destination),x.sha256);a(!fs.existsSync(work+'/'+x.destination),'Do not overwrite existing resource '+x.destination);a(!fs.existsSync(repo+'/resources/new/'+x.destination),'Do not overwrite tracked resource '+x.destination);}
const oldBackups=new Set(fs.readdirSync(work).filter(n=>n.startsWith('jack.qsp.bak_')));
try{
 const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',work+'/jack.qsp','-ModsDir',__dirname+'/mods'],{encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:1024*1024});
 fs.writeFileSync(__dirname+'/apply-work.log',(run.stdout||'')+(run.stderr||''));a.equal(run.status,0,'WORK patch replay');a.equal(hash(work+'/jack.qsp'),candidate.qspAfter);
 for(const f of ['css/base.css','content/js/jo9_battle_log.js'])fs.copyFileSync(candidate.game+'/'+f,work+'/'+f);
 for(const x of input.assets){const dst=work+'/'+x.destination;fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(candidate.game+'/'+x.destination,dst);a.equal(hash(dst),x.sha256);}
 a.equal(hash(work+'/css/base.css'),candidate.cssAfter);a.equal(hash(work+'/content/js/jo9_battle_log.js'),candidate.jsAfter);
}catch(error){
 for(const f of ['jack.qsp','css/base.css','content/js/jo9_battle_log.js'])fs.copyFileSync(tmp+'/before/'+f,work+'/'+f);
 fs.writeFileSync(__dirname+'/install-failure.json',JSON.stringify({error:error.message,restoredFrom:tmp+'/before',note:'Original runtime restored; any newly copied image remains harmless and is not removed.'},null,2)+'\n');throw error;
}
fs.copyFileSync(work+'/css/base.css',repo+'/assets/css-2.4/base.css');fs.copyFileSync(work+'/content/js/jo9_battle_log.js',repo+'/assets/content/js/jo9_battle_log.js');
for(const x of input.assets){const dst=repo+'/resources/new/'+x.destination;fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(work+'/'+x.destination,dst);a.equal(hash(dst),x.sha256);}
fs.copyFileSync(__dirname+'/mods/'+patch,repo+'/mods/'+patch);
fs.mkdirSync(record+'/scripts',{recursive:true});
for(const name of ['PLAN_KO.md','MANUAL_KO.md','UI_HARNESS_KO.md','inputs.json','candidate.json'])fs.copyFileSync(__dirname+'/'+name,record+'/'+name);
for(const name of ['prepare.cjs','build.cjs','contract-check.cjs','fate-ui-native.cjs','asset-paths-native.cjs','install.cjs'])fs.copyFileSync(__dirname+'/'+name,record+'/scripts/'+name);
for(const [name,p]of Object.entries(reports))fs.copyFileSync(p,record+'/'+name+'-report.json');
const handoff=repo+'/docs/SESSION_HANDOFF_INDEX.md',previous=fs.readFileSync(handoff);
const note='\r\n## 2026-10-28 전투 결과 화면 표시 보완\r\n\r\n[변경·검사·복구 안내](../records/battle-fate-visual-20261028/MANUAL_KO.md): 선택지 폰트·색상·하단 여백, 썸업 단독 진행, 패배 포즈 60개 연결, 첨부 경기장 배경과 캐릭터 뒤 붉은 처형 연출을 WORK에 반영했다. 공식 9경로·생사 회귀58·실제UI10fixture·리소스73상황을 통과했다. 기존 세이브·배포 폴더·보류 검토 이미지와 수동 변경 보존, 커밋·푸시 없음.\r\n';
a(!previous.toString('utf8').includes('## 2026-10-28 전투 결과 화면 표시 보완'));fs.appendFileSync(handoff,note,'utf8');a(fs.readFileSync(handoff).subarray(0,previous.length).equals(previous));
for(const f of ['save/1.sav','save/JO9_GOLD_AP_CHECK_20261026.sav'])a.equal(hash(work+'/'+f),input.hashes[f]);
for(const f of ['assets/content/js/jo9_traits_view.js','assets/json/menu_icon.json','assets/json/slave_index.json'])a.equal(hash(repo+'/'+f),input.tracked[f]);
const report={status:'complete',qspBefore:candidate.qspBefore,qspAfter:hash(work+'/jack.qsp'),cssAfter:hash(work+'/css/base.css'),jsAfter:hash(work+'/content/js/jo9_battle_log.js'),addedAssets:input.assets.map(x=>({path:x.destination,sha256:hash(work+'/'+x.destination)})),officialVerdict:r.official.verdict,nativeUiFixtures:r.ui.fixtureCount,logicCases:r.logic.cases.length,pathCases:r.paths.caseCount,pathAssertions:r.paths.assertionCount,protectedSaves:Object.fromEntries(Object.entries(input.hashes).filter(([f])=>f.startsWith('save/'))),backups:{before:tmp+'/before',automatic:fs.readdirSync(work).filter(n=>n.startsWith('jack.qsp.bak_')&&!oldBackups.has(n)).map(n=>({path:work+'/'+n,sha256:hash(work+'/'+n)}))},record,scope:'WORK and exact tracked assets/mod records only; no original/review/save/distribution/git mutation'};
for(const p of [__dirname+'/installation.json',record+'/installation.json'])fs.writeFileSync(p,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,addedAssets:report.addedAssets.length},null,2));
