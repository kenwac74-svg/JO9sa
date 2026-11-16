'use strict';
const fs=require('fs'),z=require('zlib'),assert=require('assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/chunhyang-combat-fixes-20261112',rec=repo+'/records/chunhyang-combat-fixes-20261112';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs'),read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),json=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const p=read(rec+'/plan.json'),raw=fs.readFileSync(game+'/jack.qsp'),m=read(repo+'/assets/runtime-source-2.4.1.json');assert.equal(c.hash(raw),p.afterSha256);assert(raw.equals(fs.readFileSync(repo+'/assets/runtime/2.4.1/jack.qsp')));assert.equal(m.sourceQspSha256,p.afterSha256);qa.inspectWorld(raw);assert.equal(c.hash(z.gunzipSync(fs.readFileSync(rec+'/baseline.qsp.gz'))),p.beforeSha256);
const css=fs.readFileSync(game+'/css/base.css');assert.equal(c.hash(css),p.cssAfterSha256);assert(css.equals(fs.readFileSync(repo+'/assets/css-2.4/base.css')));assert.equal(m.files.find(f=>f.runtimePath==='css/base.css').sha256,p.cssAfterSha256);
const body=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),before=c.parse(z.gunzipSync(fs.readFileSync(rec+'/baseline.qsp.gz'))),after=c.parse(raw);
for(const tag of ["if $args[0] = 'cost':","if $args[0] = 'finish':"]){const old=body(before,'jo9_chun_battle'),now=body(after,'jo9_chun_battle'),tail=tag.includes('cost')?"if $args[0] = 'reset':":null;assert.equal(old.slice(old.indexOf(tag),tail?old.indexOf(tail):undefined),now.slice(now.indexOf(tag),tail?now.indexOf(tail):undefined));}
const fate=[];for(const run of ['fate-probes','fate-installed']){
 const out=tmp+'/'+run,results=read(out+'/client-results.json'),plan=read(out+'/plan.json');assert.equal(results.length,3);assert(results.every(x=>x.pass));let assertions=0;const cases=[];
 for(const row of results){const s=sc.parse(fs.readFileSync(out+'/'+row.name+'.sav')),checks=Number(sc.value(s,'qa_checks')[0]);assert.equal(checks,plan.find(x=>x.name===row.name).assertions);assertions+=checks;fs.copyFileSync(out+'/'+row.name+'-stderr.log',rec+'/'+run+'-'+row.name+'-native.log');const item={name:row.name,checks,cash:Number(sc.value(s,'sparks')[0]),cm:Number(sc.value(s,'jo9_cruel_mercy')[0]),cmHalf:Number(sc.value(s,'jo9_cruel_mercy_half')[0])};if(row.name!=='rules'){
  const choice=sc.value(s,'qa_choice_html')[1],result=sc.value(s,'qa_result_html')[1];assert(choice.includes('처형한다')&&choice.includes('살려준다'));assert(result.includes('jo9_scene_bottom_frame'),'Actual scene frame marker');fs.writeFileSync(rec+'/'+run+'-'+row.name+'-choices.html',choice);fs.writeFileSync(rec+'/'+run+'-'+row.name+'-result.html',result);item.frameEmitted=true;
 }cases.push(item);}assert.equal(assertions,36);const report={run,results,cases,assertions,passed:true};json(rec+'/'+run+'-verification.json',report);fate.push(report);
}
for(const v of ['candidate','installed']){const q=read(rec+'/cheat-native-'+v+'.json');assert.equal(q.assertions,20);assert(q.passed);assert.equal(q.sourceHash,p.afterSha256);}
json(rec+'/verification.json',{qspSha256:p.afterSha256,cssSha256:p.cssAfterSha256,workTrackedMetadataMatch:true,nativePerVariant:{scenarios:7,assertions:56},variants:['candidate','installed'],actualFateChoices:true,actualSceneFrameMarker:true,cmCostAndInjuryCapCodeUnchanged:true,uiPreview:{before:'ui-before.png',after:'ui-after.png',visibleFramePixels:{before:18,after:9},textBottom:786,textPaddingBottom:8},userSaveTouched:false,realGameGuiVisuallyVerified:false});
const report=`# 대사창 하단 프레임·캣파이트 처분 선택·춘향 즉사 치트 호환

2026-11-12 사용자 요청을 WORK와 추적 소스에 반영했다. [검증 요약](verification.json) · [프레임 전](ui-before.png) / [후](ui-after.png) · [QSP 패치](../../mods/2026-11-12_chunhyang_combat_repairs.json).

## 수정한 동작

1. 대사창 하단의 원래 배경에 그려진 18px 프레임을 같은 이미지의 표시 좌표·배율로 9px로 표시한다. 그림 파일 픽셀은 바꾸지 않았다. 대사·선택 화면에서 #text 높이185→165px, 아래 여백8px와 세로 스크롤을 두어 마지막 글자가 하단 선에 붙거나 가려지는 일을 막는다. 글꼴·문자 크기는 유지한다. 적용 화면은 shop_general, interaction_screen_city, interaction_screen, slave_sell, choice_screen이며 전투 전용 화면의 별도 스킨을 덮지 않는다.
2. 새 일반전 적 chun_gladiatrix1~3이 jo9_battle_fate의 캣파이트 대상 목록에 빠져 있었다. 기존 gladiatrix1~3에 새3종을 추가했다. 기존 장소·단일 적·전투 출처 조건은 유지한다. 춘향 보스 자신은 처형/석방 선택 대상에 넣지 않는다. 일반전 승리 후 선택→CM 변화→기존 결과/상금/승수 정산을 다시 거친다.
3. 시작 및 주기 일섬이 HP를 건드리지 않고 강제 패배로 이동하던 두 지점을 고쳤다. 현재 HP만큼 피해를 계산하되 일반 전투와 같은 cheat_fight_dif 배율을 적용한다. 무적0이면 피해0으로 계속 싸우며, 일반1이면 HP0이 된다. HP가0 이하인 경우에만 기존 HP0 결과(убит)로 전투 종료 화면에 간다. 곧바로 CM과 무관하게 게임오버시키는 처리를 추가하지 않았다.

실제 무적 치트는 HP0 자동 복구가 아닌 피해 배율0 방식이다. 단순히 HP를0으로 대입하는 것만으로는 치트가 적용되지 않으므로 같은 피해 배율 계산을 거친다. 무적 상태에서 기술 설명이 쓰러졌다고 잘못 말하지 않도록 공격 묘사로 조정했다.

## 입력·출력·상태·부작용

- jo9_battle_fate(init,catfight)는 기존 place/fight_return/arena_mode/적수/적ID를 읽어 mode2를 설정한다. 이후 기존 선택 및 정산 콜백을 사용한다. 승수·돈·CM에 별도 중복 지급 코드를 넣지 않았다.
- jo9_chun_battle(init/after_player)는 기존 주인공 HP·cheat_fight_dif와 시작/주기 조건을 읽는다. 바뀌는 값은 HP와 실제 HP0일 때의 전투 결과뿐이다. 주기·확률·연고·공격/회피 수치는 유지한다. 전체 라운드를 새로 돌리지 않아 턴·기존 피해 처리가 중복되지 않는다.
- 무적이 아닌 HP0 패배에는 기존 부상 계산이 적용된다. 이전 강제 패배는 HP가 남아 부상이 적게 계산될 수 있었지만, 이제 HP 소실에 따른 부상이 생길 수 있다. CM별 사망/차감 및 생존 결과의 치명상 방지 상한은 코드 그대로 보존했다.
- _layout은 위5화면에서만 클릭을 받지 않는 하단 프레임 표시 요소를 출력한다. base.css가 좌표/크기/텍스트 여백을 맡는다. 새 진행 변수·저장 필드·세이브 초기화는 없다. 실제 사용자 SAV는 열거나 수정하지 않았다.

## 위치와 제거 시 영향

mods/2026-11-12_chunhyang_combat_repairs.json의 CHUNHYANG_LETHAL_DAMAGE_CHEAT_20261112, CHUNHYANG_CATFIGHT_FATE_20261112, SCENE_BOTTOM_FRAME_HALF_20261112로 조회한다. 실제 QSP 변경은 jo9_chun_battle·jo9_battle_fate·_layout의3본문이다. CSS 변경 전후는 css-change.json, 원본 CSS는 base.before.css에 있다.

프레임은 QSP 마커 출력과 CSS 정의가 한 쌍이다. QSP 요소만 지우면 원래 두꺼운 프레임이 보이고, CSS만 지우면 표시 요소가 역할을 하지 않는다. 전체 복구는 기준 압축 QSP와 이전 CSS를 쓰되 이후 수동 변경을 먼저 비교한다. 처분 목록을 되돌리면 춘향 일반전 선택이 다시 사라진다. 일섬 수정을 되돌리면 무적을 우회한 강제 패배가 돌아온다.

## 검증

후보와 설치본 각각 실제 엔진7경로·56단언을 통과했다. 기존 적3종과 새3종의 mode2, 보스/다른장소/출처/인원 제외, 실제 일반전 초기화→승리 화면의 두 선택→선택 전 진행 차단→처형/석방→CM·승수·상금1회 및 반복 호출 차단을 확인했다. 즉사 검사는 시작/주기×무적 켬/끔4경로이며 실제 결과 진입 전에 HP/돈/CM/활성/다음 판정/연고를 검사한다. 즉사 진단에서는 CM 정산 전체를 다시 실행하지 않았고 비용·부상 상한 코드 동일성을 대조했다.

실제 결과 화면 HTML에 새 하단 프레임 요소가 출력되는 것도 확인했다. 별도 숨김 브라우저의 고정1280×800 재현 화면을 렌더링해 프레임 두께와 글자 간격을 육안 확인했다. 이는 실제 사용자 게임 창 외형 확인과 구분한다. 사용자 게임 창과 실제 SAV 플레이는 확인 전이며 전체 출고 PASS나 장시간 전투 검증으로 확대하지 않는다.

공식 적용기의 이번 패치 재생·재적용, 바이트 왕복·CRLF·마커 경계·변경 범위와 WORK/추적 QSP·CSS·원장 일치를 확인했다. 과거 jo9_battle_fate 전체 이력은 기존 콜로세움 후속2편의 조각이 맞지 않아 완전 재생되지 않는다(fate-history.json). 현재 WORK 본문을 보존하는 명시적 snapshot bridge는 현재에서는 변경0건이며 새3종 목록 수정만 실제 적용된다. 과거 전체 이력을 고쳤다고 보고하지 않는다.

현재 QSP SHA-256: ${p.afterSha256}. CSS SHA-256: ${p.cssAfterSha256}.

## 게임에서 확인

게임을 완전히 종료하고 다시 실행한다. (1) 긴 대사창의 하단 선과 마지막 글자 간격, (2) 춘향 단계 일반전 승리 후 처형/석방 두 선택, (3) 무적을 켠 춘향 결투에서 일섬이 직접 패배시키지 않는지 확인한다.

## 보관·복구

baseline.qsp.gz는 이번 직전 QSP ${p.beforeSha256}의 검증된 압축 복구본이다. base.before.css·이전 메타·선언형 패치·재현 스크립트·엔진/HTML/전후 미리보기를 남긴다. 재생성 가능한 임시 QSP·가상 SAV·복제 이미지·숨김 브라우저 임시 프로필·중복 공식 .bak은 정리한다. Full·음원·커밋·푸시는 변경하지 않았다.
`;
fs.writeFileSync(rec+'/REPORT_KO.md',report);const local='C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7';for(const f of ['combat-fixes.cjs','combat-fixes-records.cjs','chun-cheat-probes.cjs','chun-fate-probes.cjs'])fs.copyFileSync(local+'/'+f,rec+'/'+f);
const idx=repo+'/docs/SESSION_HANDOFF_INDEX.md',entry=`## 2026-11-12 Codex: 하단 프레임 절반·캣파이트 처분 복구·일섬 무적 호환

[적용·원인·사용·부작용·검증·복구](../records/chunhyang-combat-fixes-20261112/REPORT_KO.md). 사용자 지시로 대사5화면 하단 프레임18→9px와 글자 여백, 새 일반전 적3종의 처형/석방 whitelist, 시작/주기 일섬의 HP피해·기존 치트배율·HP0 판정을 반영했다. CM/확률/자원/보스 처분 제외 유지. 후보/설치 각각 실제7경로56단언·공식 재생/재적용·구조/경계 및 CSS 전후 브라우저 렌더 확인. WORK/추적/메타 QSP ${p.afterSha256.slice(0,8)},CSS ${p.cssAfterSha256.slice(0,8)} 일치. 실제 사용자 SAV·게임창 외형 미확인. Full·음원·커밋푸시 없음.

`;
fs.writeFileSync(idx,entry.replace(/\n/g,'\r\n')+fs.readFileSync(idx,'utf8'));console.log(JSON.stringify({qsp:p.afterSha256,css:p.cssAfterSha256,nativePerVariant:56,frameMarkupInActualResult:true,reportSaved:true}));
