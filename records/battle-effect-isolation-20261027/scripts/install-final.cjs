'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),a=require('node:assert/strict');
const repo='G:/somi/JO9sa',work='G:/somi/Jack O Nine Tails v2.4_work/game',rec=repo+'/records/battle-effect-isolation-20261027',tmp='G:/Codex/tmp/battle-effect-isolation-20261027';
const c=require(repo+'/tools/text-workshop/core.cjs'),j=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),hash=p=>c.hash(fs.readFileSync(p));
const meta=j(rec+'/candidate.json'),effects=j(rec+'/native-effects-results.json'),official=j(tmp+'/official/run-7YOYwA/report.json');
a.equal(effects.hashes.qsp,meta.qspAfter);a.equal(effects.isolationContract.status,'PASS');a(effects.client.every(x=>x.pass));
for(const name of ['effects-off','enemy-hit','player-hit','both-hit']){const row=effects.isolationContract.cases.find(x=>x.name===name);a(row&&row.pass,name);}
a.equal(official.verdict,'PASS');a.equal(official.checks.find(x=>x.name==='inputs-readable').detail.candidate,meta.qspAfter);
const review=j(rec+'/independent-review.json');a.equal(review.status,'PASS');a.equal(review.qspAfter,meta.qspAfter);
a.equal(hash(work+'/jack.qsp'),meta.qspBefore);a.equal(hash(work+'/css/base.css'),meta.cssBefore);a.equal(hash(repo+'/assets/css-2.4/base.css'),meta.cssBefore);
a.equal(hash(meta.backup+'/jack.qsp'),meta.qspBefore);a.equal(hash(meta.backup+'/css/base.css'),meta.cssBefore);
a.equal(hash(tmp+'/candidate/jack.qsp'),meta.qspAfter);a.equal(hash(tmp+'/candidate/css/base.css'),meta.cssAfter);
const beforeBackups=new Set(fs.readdirSync(work).filter(n=>n.startsWith('jack.qsp.bak_')));
const record={status:'ready',...meta,installedAt:new Date().toISOString()};fs.writeFileSync(rec+'/installation.json',JSON.stringify(record,null,2)+'\n');
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',work+'/jack.qsp','-ModsDir',tmp+'/mods'],{encoding:'utf8',windowsHide:true,timeout:180000,maxBuffer:1024*1024});fs.writeFileSync(rec+'/installation-apply.log',run.stdout+'\n'+run.stderr);a.equal(run.status,0,'Inspect installation-apply.log');a.equal(hash(work+'/jack.qsp'),meta.qspAfter);
function atomicCopy(from,to){const stage=to+'.jo9-fx-stage';a(!fs.existsSync(stage));fs.copyFileSync(from,stage);a.equal(hash(stage),hash(from));fs.renameSync(stage,to);a.equal(hash(to),hash(from));}
atomicCopy(tmp+'/candidate/css/base.css',work+'/css/base.css');atomicCopy(tmp+'/candidate/css/base.css',repo+'/assets/css-2.4/base.css');
const snapshot=j(repo+'/records/ui-live-consolidation-20261027/ui-resource-snapshot.json');
const expected=new Map([['jack.qsp',meta.qspAfter],['css/base.css',meta.cssAfter],['content/js/jo9_traits_view.js','ae381a49506e50cdecff3a20a840c44e7a8889cedc81460b9b419ea3ea369886'],['json/menu_icon.json','0c2529b9c604bd982439fd2bc6d81cc7e98b9482b7dc133e8768ebf11a0d4482']]);
for(const row of snapshot.sources)a.equal(hash(work+'/'+row.path),expected.get(row.path)||row.sha256,row.path);
a.equal(hash(work+'/content/js/jo9_battle_log.js'),'4449ecbf3d2794979573622a3b53759ab341eaca8d305f07d4533c85b201dfb5');
for(const n of ['report.json','report.md','patch-replay.log','patch-reapply.log','client-runner.log'])fs.copyFileSync(tmp+'/official/run-7YOYwA/'+n,rec+'/official-'+n);
fs.copyFileSync(tmp+'/official/run-7YOYwA/client/client-results.json',rec+'/official-client-results.json');
fs.copyFileSync(path.dirname(__filename)+'/MANUAL_KO.md',rec+'/MANUAL_KO.md');
record.status='complete';record.runtimeInputsVerified=snapshot.sources.length;record.automaticBackupPaths=fs.readdirSync(work).filter(n=>n.startsWith('jack.qsp.bak_')&&!beforeBackups.has(n));fs.writeFileSync(rec+'/installation.json',JSON.stringify(record,null,2)+'\n');
const heading='## 2026-10-27 전투 이펙트 분리·배경 폴더 경로 복구',handoff=repo+'/docs/SESSION_HANDOFF_INDEX.md';
if(!fs.readFileSync(handoff,'utf8').includes(heading))fs.appendFileSync(handoff,'\n\n'+heading+'\n\nWORK와 추적 CSS에 전용 연출층을 반영했다. 기존 효과 좌표·키프레임·전투 계산을 유지하며, 프레임·입력·로그와 분리한다. 직전 UI 경로 치환의 bg.png/file stem과 bg/폴더 혼동280곳/44본문도 복구했다. [구성·검증·복구](../records/battle-effect-isolation-20261027/MANUAL_KO.md). 공식9경로와 이펙트 시간별 계약 검사는 통과했으나 실제 Windows 화면 재도색 문제는 미확인이다. 최신 baseline에서 기하 변화는 미재현이었고, 새 분리 계약 FAIL→PASS와 구분했다. 배포·원본세이브·엔진·설정·ZIP·커밋·푸시 없음.\n');
fs.copyFileSync(__filename,rec+'/scripts/install-final.cjs');console.log(JSON.stringify({status:record.status,qsp:meta.qspAfter,css:meta.cssAfter,runtimeInputsVerified:record.runtimeInputsVerified,backup:meta.backup}));
