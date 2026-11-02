'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),a=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),hash=p=>c.hash(fs.readFileSync(p));
const input=read(__dirname+'/inputs.json'),candidate=read(__dirname+'/candidate.json'),qa=read(__dirname+'/qa-reports.json'),{work,repo,tmp}=input;
const reports={};
function reportHash(r){if(r.candidateHash)return r.candidateHash;if(r.inputHashes){for(const [k,h]of Object.entries(r.inputHashes))if(k==='candidate'||k.replace(/\\/g,'/').toLowerCase()===candidate.candidate.toLowerCase())return h;}return undefined;}
for(const [name,p]of Object.entries(qa)){
 const r=reports[name]=read(p);a.equal(name==='official'?r.verdict:r.status,'PASS','Required QA '+name);
 a.equal(name==='official'?r.checks.find(x=>x.name==='inputs-readable').detail.candidate:reportHash(r),candidate.qspAfter,'QA must match final candidate '+name);
}
for(const name of ['official','ui','logic','group','scenes','hit','hitdom'])a(reports[name],'Missing QA '+name);
for(const [f,h]of Object.entries(input.hashes))a.equal(hash(work+'/'+f),h,'WORK drift '+f);
for(const [f,h]of Object.entries(input.tracked))a.equal(hash(repo+'/'+f),h,'Tracked drift '+f);
a.equal(hash(candidate.candidate),candidate.qspAfter);a.equal(hash(candidate.game+'/css/base.css'),candidate.cssAfter);a.equal(hash(candidate.game+'/content/js/jo9_battle_log.js'),candidate.jsAfter);
const patch='2026-10-28_battle_followup.json',record=repo+'/records/battle-followup-20261028';a(!fs.existsSync(record));a(!fs.existsSync(repo+'/mods/'+patch));
for(const x of input.assets){a.equal(hash(x.source),x.sha256);a.equal(hash(candidate.game+'/'+x.destination),x.sha256);a(!fs.existsSync(work+'/'+x.destination),'Existing WORK asset '+x.destination);a(!fs.existsSync(repo+'/resources/new/'+x.destination),'Existing tracked asset '+x.destination);}
const beforeBackups=new Set(fs.readdirSync(work).filter(n=>n.startsWith('jack.qsp.bak_')));
try{
 const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',work+'/jack.qsp','-ModsDir',__dirname+'/mods'],{encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:1024*1024});
 fs.writeFileSync(__dirname+'/apply-work.log',(r.stdout||'')+(r.stderr||''));a.equal(r.status,0);a.equal(hash(work+'/jack.qsp'),candidate.qspAfter);
 for(const f of ['css/base.css','content/js/jo9_battle_log.js'])fs.copyFileSync(candidate.game+'/'+f,work+'/'+f);
 for(const x of input.assets){const dst=work+'/'+x.destination;fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(candidate.game+'/'+x.destination,dst);a.equal(hash(dst),x.sha256);}
 a.equal(hash(work+'/css/base.css'),candidate.cssAfter);a.equal(hash(work+'/content/js/jo9_battle_log.js'),candidate.jsAfter);
}catch(error){for(const f of ['jack.qsp','css/base.css','content/js/jo9_battle_log.js'])fs.copyFileSync(tmp+'/before/'+f,work+'/'+f);fs.writeFileSync(__dirname+'/install-failure.json',JSON.stringify({error:error.message,restoredRuntimeFrom:tmp+'/before'},null,2)+'\n');throw error;}
fs.copyFileSync(work+'/css/base.css',repo+'/assets/css-2.4/base.css');fs.copyFileSync(work+'/content/js/jo9_battle_log.js',repo+'/assets/content/js/jo9_battle_log.js');
for(const x of input.assets){const dst=repo+'/resources/new/'+x.destination;fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(work+'/'+x.destination,dst);a.equal(hash(dst),x.sha256);}
fs.copyFileSync(__dirname+'/mods/'+patch,repo+'/mods/'+patch);fs.mkdirSync(record+'/scripts',{recursive:true});
for(const f of ['PLAN_KO.md','MANUAL_KO.md','DIALOGUE_PROPOSAL_KO.md','FOG_GROUPS_AUDIT_KO.md','INVESTIGATION_KO.md','HIT_AUDIT_KO.md','UI_TESTS_KO.md','inputs.json','candidate.json','qa-reports.json'])if(fs.existsSync(__dirname+'/'+f))fs.copyFileSync(__dirname+'/'+f,record+'/'+f);
for(const f of ['prepare.cjs','build.cjs','group-and-scene.css','make-hit-snippets.cjs','hit-snippets.json','prepare-regression.cjs','fate-native.cjs','fate-ui-native.cjs','followup-scene-ui-native.cjs','group-roster-native.cjs','hit-native.cjs','install.cjs'])if(fs.existsSync(__dirname+'/'+f))fs.copyFileSync(__dirname+'/'+f,record+'/scripts/'+f);
for(const [name,p]of Object.entries(qa))fs.copyFileSync(p,record+'/'+name+'-report.json');
const handoff=repo+'/docs/SESSION_HANDOFF_INDEX.md',prior=fs.readFileSync(handoff),title='## 2026-10-28 전투 표시 후속 보완';a(!prior.toString('utf8').includes(title));
fs.appendFileSync(handoff,'\r\n'+title+'\r\n\r\n[처리·검사·복구 안내](../records/battle-followup-20261028/MANUAL_KO.md): 선택지 박스 제거·5px 상향, 안개 전투 전신18개·실제 무리 패배 구성, 피해 종류별4종 타격, 중앙화면70% 투명도 지속 처형필터, 콜로세움 종료컷 크기만 WORK에 반영. 주인공 전용 그림 보류·후속 대사 제안 미적용. 문법·실제엔진·UI 검사 보고서와 원본에서 확인된 별도 이슈를 함께 보존. 기존 세이브·배포 폴더 보존, 커밋·푸시 없음.\r\n','utf8');a(fs.readFileSync(handoff).subarray(0,prior.length).equals(prior));
for(const f of ['save/1.sav','save/JO9_GOLD_AP_CHECK_20261026.sav'])a.equal(hash(work+'/'+f),input.hashes[f]);
for(const f of ['assets/content/js/jo9_traits_view.js','assets/json/menu_icon.json','assets/json/slave_index.json'])a.equal(hash(repo+'/'+f),input.tracked[f]);
const report={status:'complete',qspBefore:candidate.qspBefore,qspAfter:hash(work+'/jack.qsp'),cssAfter:hash(work+'/css/base.css'),jsAfter:hash(work+'/content/js/jo9_battle_log.js'),addedAssets:input.assets.map(x=>({path:x.destination,sha256:hash(work+'/'+x.destination)})),qa:qa,officialVerdict:reports.official.verdict,uiFixtures:reports.ui.fixtureCount,groupCases:reports.group.caseCount,logicCases:reports.logic.cases.length,protectedSaves:Object.fromEntries(Object.entries(input.hashes).filter(([f])=>f.startsWith('save/'))),backups:{before:tmp+'/before',automatic:fs.readdirSync(work).filter(n=>n.startsWith('jack.qsp.bak_')&&!beforeBackups.has(n)).map(n=>({path:work+'/'+n,sha256:hash(work+'/'+n)}))},deferred:['protagonist-specific colosseum illustration','proposed colosseum outcome dialogue'],record,scope:'WORK and exact tracked files only; no distribution/save/review-source/commit/push mutation'};
for(const p of [__dirname+'/installation.json',record+'/installation.json'])fs.writeFileSync(p,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,addedAssets:input.assets.length},null,2));
