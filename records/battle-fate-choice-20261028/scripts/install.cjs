'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),a=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const stage=__dirname,repo='G:/somi/JO9sa',work='G:/somi/Jack O Nine Tails v2.4_work/game';
const tmp='G:/Codex/tmp/battle-fate-20261028',game=tmp+'/candidate-game';
const args=process.argv.slice(2);a.equal(args.length,4,'--official REPORT --ui REPORT');
a.equal(args[0],'--official');a.equal(args[2],'--ui');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),hash=p=>c.hash(fs.readFileSync(p));
const manifest=read(stage+'/candidate.json'),official=read(args[1]),ui=read(args[3]);
const record=repo+'/records/battle-fate-choice-20261028';
const scriptFiles=['build-candidate.cjs','fate-native.cjs','fate-ui-native.cjs','helper.qsp.txt','fate-ui.css','execution.svg','install.cjs','cleanup.cjs'];
for(const f of scriptFiles)a(fs.statSync(stage+'/'+f).isFile(),'Missing installation source '+f);
a(!fs.existsSync(record),'Record directory already exists');
a.equal(official.verdict,'PASS');a.equal(official.checks.find(x=>x.name==='inputs-readable').detail.candidate,manifest.qspAfter);
a.equal(ui.status,'PASS','Native UI verification must pass before install');
a.equal(ui.inputHashes[ui.candidate],manifest.qspAfter,'Native UI candidate must match final QSP');
const logic=read(tmp+'/native-green-v4/fate-native-results.json');a.equal(logic.status,'PASS');a.equal(logic.inputHashes.candidate,manifest.qspAfter);
const protectedInputs={
 [work+'/save/1.sav']:'f1017c082ef5c8edcc6b5ba59d2909b582492c52abe2ed7e52f08979dc53455e',
 [work+'/save/JO9_GOLD_AP_CHECK_20261026.sav']:'581fc472bfa5aedcbca85c379d0061ad8d28a9b928ef948a259dee7c800ad2ec'
};
for(const [p,h]of Object.entries(protectedInputs))a.equal(hash(p),h,'Input save changed: '+p);
for(const [f,want]of[['jack.qsp',manifest.qspBefore],['css/base.css',manifest.cssBefore],['content/js/jo9_battle_log.js',manifest.jsBefore]])a.equal(hash(work+'/'+f),want,'Live WORK changed: '+f);
a.equal(hash(repo+'/assets/css-2.4/base.css'),manifest.cssBefore,'Tracked CSS has independent edits');
a.equal(hash(repo+'/assets/content/js/jo9_battle_log.js'),manifest.jsBefore,'Tracked JS has independent edits');
const svg='content/pic/ui/jo9_battle_test_v01/execution.svg';
a(fs.realpathSync(path.dirname(work+'/'+svg)).toLowerCase().startsWith(fs.realpathSync(work).toLowerCase()+path.sep),'WORK effect directory resolves outside WORK');
a(!fs.existsSync(work+'/'+svg),'Do not overwrite an existing WORK effect');
const patchName='2026-10-28_battle_fate_choice.json';a(!fs.existsSync(repo+'/mods/'+patchName),'Patch name already exists');
const unaffected=['assets/content/js/jo9_traits_view.js','assets/json/menu_icon.json','assets/json/slave_index.json'];
const unaffectedBefore=Object.fromEntries(unaffected.map(f=>[f,hash(repo+'/'+f)]));
const backup='G:/somi/JO9_work_backups/battle_fate_'+new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14);
fs.mkdirSync(backup,{recursive:true});
for(const [src,dst]of[['jack.before.qsp','jack.qsp'],['base.before.css','base.css'],['battle_log.before.js','jo9_battle_log.js']]){fs.copyFileSync(tmp+'/'+src,backup+'/'+dst);a.equal(hash(tmp+'/'+src),hash(backup+'/'+dst));}
const previousBackups=new Set(fs.readdirSync(work).filter(x=>x.startsWith('jack.qsp.bak_')));
let installed=false;
try{
 const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',work+'/jack.qsp','-ModsDir',stage+'/mods'],{encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:1024*1024});
 fs.writeFileSync(stage+'/apply-work.log',(r.stdout||'')+(r.stderr||''));a.equal(r.status,0,'WORK declarative replay failed');
 a.equal(hash(work+'/jack.qsp'),manifest.qspAfter);
 for(const rel of ['css/base.css','content/js/jo9_battle_log.js',svg]){fs.mkdirSync(path.dirname(work+'/'+rel),{recursive:true});fs.copyFileSync(game+'/'+rel,work+'/'+rel);a.equal(hash(game+'/'+rel),hash(work+'/'+rel));}
 installed=true;
}catch(e){
 for(const [src,dst]of[['jack.qsp','jack.qsp'],['base.css','css/base.css'],['jo9_battle_log.js','content/js/jo9_battle_log.js']])fs.copyFileSync(backup+'/'+src,work+'/'+dst);
 fs.writeFileSync(stage+'/install-failure.json',JSON.stringify({error:e.message,restoredFrom:backup},null,2)+'\n');throw e;
}
a(installed);
for(const rel of ['css/base.css','content/js/jo9_battle_log.js',svg]){
 const target=rel==='css/base.css'?repo+'/assets/css-2.4/base.css':repo+'/assets/'+rel;
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(work+'/'+rel,target);a.equal(hash(work+'/'+rel),hash(target));
}
fs.copyFileSync(stage+'/mods/'+patchName,repo+'/mods/'+patchName);
fs.mkdirSync(record+'/scripts',{recursive:true});
for(const f of ['PLAN_KO.md','MANUAL_KO.md','README_UI_KO.md','candidate.json'])fs.copyFileSync(stage+'/'+f,record+'/'+f);
for(const f of scriptFiles)fs.copyFileSync(stage+'/'+f,record+'/scripts/'+f);
fs.copyFileSync(args[1],record+'/official-report.json');fs.copyFileSync(args[3],record+'/native-ui-results.json');
fs.copyFileSync(tmp+'/native-green-v4/fate-native-results.json',record+'/native-logic-results.json');
fs.copyFileSync(tmp+'/native-red-v1/fate-native-results.json',record+'/baseline-red-results.json');
const handoff=repo+'/docs/SESSION_HANDOFF_INDEX.md',beforeHandoff=fs.readFileSync(handoff);
const note='\r\n## 2026-10-28 일반 전투 승리 후 생사 선택\r\n\r\n[처리·검사·복구 안내](../records/battle-fate-choice-20261028/MANUAL_KO.md): 안개는 처형만 활성, 일반 콜로세움·정규 투기장 인간 여성 상대는 처형/생존 선택. 특수전·기존 세이브·배포 폴더 보존. 단계 잠금·슬롯별 집계·결과 HTML 재표시·고정 SVG 연출을 WORK와 추적 자료에 반영했다. 검증 범위는 같은 기록의 최종 보고를 따른다. 커밋·푸시는 하지 않았다.\r\n';
a(!beforeHandoff.toString('utf8').includes('## 2026-10-28 일반 전투 승리 후 생사 선택'));
fs.appendFileSync(handoff,note,'utf8');a(fs.readFileSync(handoff).subarray(0,beforeHandoff.length).equals(beforeHandoff));
const autoBackups=fs.readdirSync(work).filter(x=>x.startsWith('jack.qsp.bak_')&&!previousBackups.has(x));
for(const [p,h]of Object.entries(protectedInputs))a.equal(hash(p),h,'Input save changed during install: '+p);
const report={status:'complete',backup,qspBefore:manifest.qspBefore,qspAfter:hash(work+'/jack.qsp'),cssBefore:manifest.cssBefore,cssAfter:hash(work+'/css/base.css'),jsBefore:manifest.jsBefore,jsAfter:hash(work+'/content/js/jo9_battle_log.js'),effect:{path:svg,sha256:hash(work+'/'+svg)},modifiedLocations:manifest.modifiedLocations,addedLocations:manifest.addedLocations,officialVerdict:official.verdict,nativeLogicCases:logic.cases.length,nativeUiStatus:ui.status,protectedInputs,scope:'WORK and exact tracked assets/mod records only; no distribution/save/review-art/git mutations',unaffectedBefore,unaffectedAfter:Object.fromEntries(unaffected.map(f=>[f,hash(repo+'/'+f)])),automaticPatchBackups:autoBackups.map(n=>({path:work+'/'+n,sha256:hash(work+'/'+n)}))};
a.deepEqual(report.unaffectedBefore,report.unaffectedAfter);a.equal(report.qspAfter,manifest.qspAfter);
for(const p of [stage+'/installation.json',record+'/installation.json'])fs.writeFileSync(p,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
