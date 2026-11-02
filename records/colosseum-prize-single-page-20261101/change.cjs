'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib'),cp=require('child_process'),a=require('assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',F='G:/somi/Jack O Nine Tails v2.4 Kor_Full/game';
const T='G:/Codex/tmp/colosseum-prize-single-page-20261101',B='G:/somi/JO9_work_backups/colosseum-prize-single-page-20261101',REC=R+'/records/colosseum-prize-single-page-20261101';
const REL='G:/Codex/tmp/colosseum-prize-single-page-release-20261101',ID='2026-11-01_colosseum_prize_single_page';
const LOCAL=__dirname;
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs');
const j=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),hash=p=>c.hash(fs.readFileSync(p));
const saveMeta=()=>fs.readdirSync(W+'/save').filter(n=>/\.sav$/i.test(n)).sort().map(n=>{const s=fs.statSync(W+'/save/'+n);return{name:n,bytes:s.size,mtimeMs:s.mtimeMs};});
function prepare(){
 const red=j(LOCAL+'/red-report.json');a.equal(red.pass,true);a.equal(red.redReproduced,true);a.equal(red.results.length,4);
 const raw=fs.readFileSync(W+'/jack.qsp');a.equal(c.hash(raw),red.sourceSha256);const d=c.parse(raw);a.deepEqual(c.serialize(d),raw);
 const l=d.locations.find(x=>x.name==='interaction_city'),body=c.shift(d.lines[l.body],5);
 const start=body.indexOf('if interaction_city = 1294:'),end=body.indexOf('!slave is freed in the arena',start);a(start>0&&end>start);
 const block=body.slice(start,end);
 const old=block.slice(block.indexOf("\tpurse = (slave['arena_level']*12)"),block.indexOf('\tsparks += purse')).replace(/\r\n$/,'');
 a(old.includes('if purse < 50: purse = 50'));a(old.includes("$text[2] = '<center>우승 상금 : $<<purse>> !</center>'"));
 a.equal(body.split(old).length-1,1);
 const originalCalculation=old.slice(0,old.indexOf('! JO9 MOD START J9M1208')).trimEnd();
 const next=[
 '! JO9 MOD START COLOSSEUM_PRIZE_SINGLE_PAGE_20261101',
 originalCalculation,
 '\tpurse *= 2',
 '\ttxt_count = 1',
 "\t$text[1] += '<br>우승 상금: $<<purse>>'",
 '! JO9 MOD END COLOSSEUM_PRIZE_SINGLE_PAGE_20261101',
 ''
 ].join('\r\n');
 const updated=body.replace(old,next),newBlock=updated.slice(start,updated.indexOf('!slave is freed in the arena',start));
 a.equal((newBlock.match(/sparks \+= purse/g)||[]).length,1);a(!newBlock.includes('$text[2]'));
 d.lines[l.body]=c.shift(updated,-5);const candidate=c.serialize(d),world=qa.inspectWorld(candidate);
 const inverse=c.parse(candidate),il=inverse.locations.find(x=>x.name==='interaction_city');inverse.lines[il.body]=c.shift(c.shift(inverse.lines[il.body],5).replace(next,old),-5);a.deepEqual(c.serialize(inverse),raw);
 fs.mkdirSync(T+'/mods',{recursive:true});fs.mkdirSync(B,{recursive:true});
 if(fs.existsSync(T+'/candidate.qsp')){
  const previous=j(T+'/prepared.json');a.equal(hash(T+'/candidate.qsp'),previous.after);a.equal(previous.before,c.hash(raw));
  a.equal(previous.after,'5650f9ab56327a8f905f692e8564f682eb74cbd0976eb7ccb78a63c07974ebac');
  for(const [src,dest]of [[T+'/prepared.json',T+'/superseded-fixed100-prepared.json'],[T+'/mods/'+ID+'.json',T+'/superseded-fixed100-patch.json']]){a(!fs.existsSync(dest));fs.copyFileSync(src,dest);}
 }
 if(fs.existsSync(T+'/before.qsp'))a.deepEqual(fs.readFileSync(T+'/before.qsp'),raw);else fs.writeFileSync(T+'/before.qsp',raw);
 if(!fs.existsSync(B+'/before.qsp.gz'))fs.writeFileSync(B+'/before.qsp.gz',zlib.gzipSync(raw),{flag:'wx'});a.deepEqual(zlib.gunzipSync(fs.readFileSync(B+'/before.qsp.gz')),raw);
 fs.writeFileSync(T+'/candidate.qsp',candidate);
 const mod={id:ID,description:'Double the original step-based standard Colosseum victory reward after applying its original minimum, raising $50 to $100; append the receipt to the growth/results page. Preserve once-only settlement, champion liberation and sparring.',before_sha256:c.hash(raw),after_sha256:c.hash(candidate),edits:[{location:'interaction_city',field:'body',old,new:next,count:1}]};
 fs.writeFileSync(T+'/mods/'+ID+'.json',JSON.stringify(mod,null,2)+'\n');
 const info={id:ID,before:mod.before_sha256,after:mod.after_sha256,world,backup:B,baseline:T+'/before.qsp',candidate:T+'/candidate.qsp',saveMetadata:saveMeta(),fullQsp:hash(F+'/jack.qsp'),sourceQsp:T+'/before.qsp',edits:1,changedLocations:['interaction_city'],changedInteraction:1294};
 fs.writeFileSync(T+'/prepared.json',JSON.stringify(info,null,2)+'\n');console.log(JSON.stringify({status:'PREPARED',before:info.before,after:info.after,edits:1,locations:world.locations}));
}
function releaseGate(){const dirs=fs.readdirSync(REL).filter(n=>n.startsWith('run-')).map(n=>({dir:REL+'/'+n,data:j(REL+'/'+n+'/report.json')}));const gate=dirs.find(x=>x.data.verdict==='PASS');a(gate,'Official release gate has not passed');return gate;}
function install(){
 const p=j(T+'/prepared.json'),green=j(LOCAL+'/green-report.json'),gate=releaseGate();a.equal(green.pass,true);a.equal(green.sourceSha256,p.after);a.equal(green.results.length,4);a.equal(gate.data.checks.find(x=>x.name==='inputs-readable').detail.candidate,p.after);
 a.equal(hash(W+'/jack.qsp'),p.before);a.equal(hash(F+'/jack.qsp'),p.fullQsp);a.deepEqual(saveMeta(),p.saveMetadata);
 const existing=new Set(fs.readdirSync(W).filter(n=>n.startsWith('jack.qsp.bak_')));
 const result=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/apply_mods.ps1','-Qsp',W+'/jack.qsp','-ModsDir',T+'/mods'],{encoding:'utf8',windowsHide:true,timeout:30000});a.equal(result.status,0,(result.stdout||'')+(result.stderr||''));a.equal(hash(W+'/jack.qsp'),p.after);qa.inspectWorld(fs.readFileSync(W+'/jack.qsp'));
 a.equal(hash(F+'/jack.qsp'),p.fullQsp);a.deepEqual(saveMeta(),p.saveMetadata);
 fs.mkdirSync(REC,{recursive:true});fs.copyFileSync(T+'/mods/'+ID+'.json',R+'/mods/'+ID+'.json');fs.copyFileSync(T+'/prepared.json',REC+'/prepared.json');
 for(const n of ['change.cjs','probe.cjs','red-report.json','green-report.json'])fs.copyFileSync(LOCAL+'/'+n,REC+'/'+n);
 for(const n of ['report.json','report.md'])fs.copyFileSync(gate.dir+'/'+n,REC+'/release-'+n);
 const v={status:'PASS',id:ID,before:p.before,after:p.after,backup:B+'/before.qsp.gz',payoutMultiplier:2,minimumPayout:100,resultPages:1,actualEngineCases:4,officialEnginePaths:gate.data.checks.find(x=>x.name==='installed-client-smoke').detail.passed,saveMetadataPreserved:p.saveMetadata.length,newPersistentFields:0,newLocations:0,changedLocations:p.changedLocations,changedInteraction:1294,fullUnchanged:p.fullQsp,createdInGameBackups:fs.readdirSync(W).filter(n=>n.startsWith('jack.qsp.bak_')&&!existing.has(n)),humanMousePlay:false};
 fs.writeFileSync(REC+'/verification.json',JSON.stringify(v,null,2)+'\n');
 fs.writeFileSync(REC+'/MANUAL_KO.md',[
 '# 콜로세움 일반 승리 보상·결과 통합',
 '사용자 최종 요청에 따라 정식 경기의 일반 승리 결과(interaction_city 1294)의 기존 단계별 상금 산식과 최저 $50을 그대로 계산한 뒤 최종 금액에2를 곱한다. 시작 $50은 $100, 같은 검사 상태의 상위 단계 $112는 $224로 오르며 원래 단계별 차이와 변동 비율을 유지한다. 기존 성장 안내 다음 줄에 상금을 함께 표시하여 상금 전용 두 번째 화면을 없앴다. 고정 $100 후보는 채택·설치하지 않았다.',
 '입력은 기존 전투 종료 결과와 처형/생존 선택이다. $text[2]를 만들지 않고 $text[1]에 상금만 덧붙이며, sparks += purse는 원래 위치에서 한 번 실행한다. txt_count와 실제 문장 배열 크기 모두 한 페이지가 된다. 화면 재표시나 종료 재호출로 정산을 다시 실행하지 않는다.',
 '성장·명성·트로피·승수·선택 결과 그림과 기존 중복 방지 가드를 그대로 둔다. 별도 챔피언 해방 이벤트1295와 유료 연습1296~1298의 규칙은 이번 변경 대상이 아니다. 새 저장 변수·로케이션·세이브 형식을 추가하지 않는다. 이미 지급·완료된 결과를 소급 재정산하지 않으며 다음 승리부터 적용된다.',
 '수정 전 실제 설치 엔진의 진행1단계/9단계×처형/생존4경로에서 $50/$112와 두 페이지를 재현했다. 후보의 같은4경로는 실제 선택→전투 종료→정산→결과 UI와 다음 버튼을 실행하여 $100/$224 지급, 성장·상금 한 페이지, 이미지와 텍스트 범위, 재표시·반복 종료 중복 없음 및 실제 복귀를 확인했다. 공식 구조·줄바꿈·주석경계·패치 재생·재적용·인물 JSON과 설치 엔진9경로도 PASS다. 사람의 마우스 수동 플레이/모든 기존 SAV 로딩은 검사에 포함하지 않는다.',
 '변경 명세는 mods/'+ID+'.json이며 적용 전/후 해시가 고정돼 있다. apply_mods.ps1로 같은 기준본에 재생할 수 있다. 제거하려면 새 마커 블록을 패치 old 조각으로 되돌리며, 지급값과 페이지 구조가 기존 가변/2페이지로 돌아온다. 현재 WORK를 별도 검사 없이 옛 전체 QSP로 덮어쓰지 않는다.',
 'WORK와 추적 패치·검증 기록에 반영했다. 배포본은 사용자의 수동 동기화 범위이며 QSP 해시가 작업 전과 동일함을 확인했다. 커밋·푸시·ZIP 제작은 하지 않았다.'
 ].join('\n\n')+'\n');
 console.log(JSON.stringify(v));
}
const mode=process.argv[2];if(mode==='prepare')prepare();else if(mode==='install')install();else throw Error('Use prepare or install');
