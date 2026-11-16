'use strict';
const fs=require('fs'),a=require('assert/strict'),z=require('zlib'),R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/species-sets-20261113',D=R+'/records/species-sets-20261113',P=R+'/records/release-prep-20261113',c=require(R+'/tools/text-workshop/core.cjs'),rd=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),wr=(p,j)=>fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');
const mod=rd(D+'/candidate-mod.json'),raw=fs.readFileSync(T+'/candidate.qsp'),base=z.gunzipSync(fs.readFileSync(D+'/jack.before.qsp.gz'));a.equal(c.hash(raw),mod.after_sha256);a.equal(c.hash(base),mod.before_sha256);a.equal(Buffer.compare(raw,fs.readFileSync(T+'/replay.qsp')),0);a(rd(D+'/green-results.json').every(x=>x.pass));a.equal(rd(D+'/green-fixture.json').assertions,62);a.equal(rd(D+'/green-fixture.json').sourceQspSha256,mod.after_sha256);a(rd(D+'/vampire-regression-results.json').every(x=>x.pass));a.equal(rd(D+'/vampire-regression-fixture.json').inputSha256,mod.after_sha256);const links=rd(T+'/link-results.json');a.equal(links.length,21);a(links.every(x=>x.pass));wr(D+'/link-results.json',links);const n=c.parse(raw),b=c.parse(base),changed=b.locations.filter(l=>b.lines[l.body]!==n.lines[n.locations.find(x=>x.name===l.name).body]).map(l=>l.name).sort();a.equal(changed.length,13);a.equal(n.locations.length,311);a.equal(Buffer.compare(raw,c.serialize(n)),0);
for(const p of [W+'/jack.qsp',R+'/assets/runtime/2.4.1/jack.qsp'])a.equal(c.hash(fs.readFileSync(p)),mod.before_sha256,p);for(const p of [W+'/jack.qsp',R+'/assets/runtime/2.4.1/jack.qsp'])fs.writeFileSync(p,raw);wr(R+'/mods/'+mod.id+'.json',mod);
for(const p of [R+'/assets/runtime-source-2.4.1.json',R+'/assets/runtime-manifests/2.4.2-work.json']){const j=rd(p);a.equal(j.sourceQspSha256,mod.before_sha256);j.sourceQspSha256=mod.after_sha256;for(const row of j.files||[])if(row.path==='game/jack.qsp'||row.runtimePath==='jack.qsp'){row.sha256=mod.after_sha256;row.bytes=raw.length;}j.speciesSetsFollowup={date:'2026-11-13',record:'records/species-sets-20261113/REPORT_KO.md',before:mod.before_sha256,after:mod.after_sha256,newSavedFields:1};wr(p,j);}
const verification={date:'2026-11-13',before:mod.before_sha256,after:mod.after_sha256,locations:311,changedLocations:changed,newLocations:0,newSavedFields:['jo9_species:1 ghost/2 android; existing vampire marker retained'],nativeSpeciesAssertions:62,nativeVampireRegressionAssertions:47,nativeLinkCases:21,allNativePass:true,roundTrip:true,lineEndings:true,markerBoundaries:true,exactReplay:true,idempotent:true,reviewFindingsFixed:['Legacy attention alias -1 corrected; unrelated +2 preserved; RED/GREEN native proof.','Old saved stone description extended once while preserving manual prefix; RED/GREEN native proof.'],limits:['Synthetic states and exact combat-loss branch; not full personal save gameplay or physical UI mouse/line-wrapping verification.','Incoming combat losses of the controlled slave/assistant; action costs/recovery/forced-defeat scripts are unchanged.'],personalSaveRead:false,FullChanged:false,committed:false,pushed:false};wr(D+'/verification.json',verification);wr(D+'/review.json',{reviewer:'review_vampire_set',scope:changed,result:'Two findings reproduced and fixed; other scope reviewed clean.',findings:verification.reviewFindingsFixed,limits:'Reviewer performed static/replay inspection, not independent native or visual QA.'});
fs.writeFileSync(D+'/REPORT_KO.md',`# 유령·안드로이드 종족 세트와 전투 방어 / 석녀 배척

2026-11-13 / WORK ${mod.after_sha256}

사용자가 순차 지정한 종족 묶음과 방어를 반영했습니다. 뱀파이어·안드로이드의 1/3 감소는 사용자 확인대로 원래 피해의2/3을 받는 뜻입니다.

|종족|포함 기존 특성|체력 피해|스태미나 피해|사기 피해|
|---|---|---|---|---|
|뱀파이어|이전 확정6특성 유지|2/3|2/3|2/3|
|유령|통증 내성·암흑기호증·검소함·은둔형 외톨이·고도 대사량|1/2|1/2|원래 그대로|
|안드로이드|석녀·강한 복종심·고도 대사량·보좌관|2/3|2/3|0 면역|

## 캐릭터·저장

현재 JSON의 설명으로 유령인 사다코3011과 안드로이드인 요르하3018을 확인했습니다. 사용자에게 연결 대상을 알린 뒤 이 두 프리셋의 신규·기존 역할에 적용했습니다. 원래 JSON은 바꾸지 않았습니다. 새 저장 필드는 인물별 jo9_species 하나이며1=유령,2=안드로이드입니다. 이전 jo9_vampire=1 표식과 기존 호출 이름은 호환 유지합니다. 종족표식이0일 때만 프리셋 유형으로 지정하므로 명시 종족값은 덮어쓰지 않습니다. 뱀파이어 표식이 함께 있다면 기존 뱀파이어를 우선합니다.

유령은 masochism1·darkness_attitude2·passion_luxury-1·passion_fame-1·metabolism5로 구성됩니다. 사다코의 기존 masochism2는 요청한 통증 내성1로 정리합니다. 은둔형과 배척되는 관심종자의 옛 abuse_attitude=-1 별칭과 jo9_attention은 정리하되, 관련 없는 abuse_attitude=2는 보존합니다. 기존 은둔형 효과와 같이 pos_praise=0을 적용합니다.

안드로이드는 nymphomania-2·meekness1·metabolism5·secretary_affinity1로 구성됩니다. 발견값은 기존 필드에서2로 지정합니다. 종족 외 이름·육성 경험치·이벤트 진행은 보존합니다. 개인 SAV 파일은 읽거나 수정하지 않았으며 게임의 정상 배열 갱신으로 적용합니다.

## UI·설명

노예의 특성 맨 위에 [유령] 또는 [안드로이드]를 표시하고 구성 특성의 개별행은 숨깁니다. 기존 [뱀파이어]와 동일하게 클릭하면 하단 msg창에 짧은 소개·원래 등급색을 사용한 대괄호 링크·방어 요약이 나옵니다. 각 링크는 원래 설명 변수로 연결합니다. 뱀파이어에도 새 피해 감소 안내를 추가했습니다.

species_apply(role)는 종족 필드와 포함 기존값을 보정합니다. 이전 vampire_apply(role)가 호환 진입점으로 이를 호출하므로 기존 repair/list/load/위탁·재고·냉동 표시 경로를 유지합니다. species_component_text(key)는 원래 설명을 반환하고 species_component(key)는 같은 msg창에 표시합니다. ghost_text/android_text 및 기존 text/describe 진입점은 각각의 짧은 링크 메뉴를 반환·표시합니다.

vampire_cache는 새 SPECIES_SET_20261113 표식으로 저장된 일반·냉동 표시 함수를 한 번 갱신합니다. 석녀 설명의 새 배척 문장도 없을 때만 뒤에 붙입니다. 기존 수동 설명은 보존하며, 별도 캐시 이관 필드는 추가하지 않습니다.

## 전투 입력·반환·의존성

jo9_traits_combat incoming(resource,amount)는 실제 참전 중인 기존 jo9_trait_combat_actor 역할의 종족을 읽고 감소한 정수 피해를 반환합니다. hp/stamina/morale 세 인자를 사용합니다. 현재 전투 역할이 비어 있으면 원래 피해를 반환해 주인공에게 노예 종족 방어가 새지 않게 합니다. 0이하 피해는 그대로 돌려주므로 무적치트의0피해를 다시 양수로 만들지 않습니다. QSP 정수 나눗셈으로 소수점 이하는 버립니다.

конец_раунда의 조종 측 체력1·스태미나2·사기3개 차감 위치에서 난이도/치트 배율 적용 후 이 함수를 호출합니다. 타격 공격은 원래대로 체력을 손상하지 않고, 정신 공격은 원래대로 사기만 손상합니다. 공유 공격 피해 숫자·공격 비용·물약 회복·기존 방어/저항·적의 사기 회복은 바꾸지 않습니다. 기존 즉사·강제패배 스크립트는 일반 피해 차감과 구별되어 유지됩니다. 전투 시작 setup은 종족 묶음을 먼저 보정합니다.

## 석녀 배척

석녀 상태 nymphomania<-1에서는 oral_affinity/anal_affinity의 양수만0으로 정리합니다. 혐오 등 음수값은 유지합니다. allow 진입점도 양수 oral/anal/nymph 후보를 거절합니다. 색정광·정액 중독은 같은 nymphomania 축의 양수 단계이므로 석녀와 동시에 저장하지 않습니다. 기존 경험치 발현은 이미 석녀를 제외했고, 추가로 일반 생성의 불감증 재추첨·직업 보정·구형 시루/도나도나 보정이 석녀를 양수 단계로 덮어쓰지 않게 했습니다. 원래 석녀를 치료해 불감증으로 만드는 경로는 일반 인물에게 유지됩니다.

카오틱 에센스에서 유령의 검소함·은둔형과 안드로이드의 석녀는 종족의 고정 구성값이므로 제거 후보에서 제외합니다. 치료 뒤 다음 갱신에서 원상복구되어 빈 소비가 발생하는 것을 막습니다. 일반 인물의 같은 특성 제거와 기존 부작용은 유지합니다.

## 검증·제거 영향

새 규칙62검사·기존 뱀파이어47회귀·실제 생성 EXEC링크21사례를 실제 엔진에서 확인했습니다. 실제 라운드의 피해 차감 구간을 사용해4종 상태×물리/타격/정신12사례를 검사했습니다. 기존 상태의 구형 관심종자 충돌과 설명 캐시도 각각 실패를 재현한 뒤 수정 통과했습니다. 311위치 왕복·정확 패치 재생·재적용 무변경·줄/주석 경계를 통과했습니다.

안정 참조는 mods/2026-11-13_species_sets_damage_stone.json 및 SPECIES_SET_20261113, SPECIES_DAMAGE_20261113, STONE_EXCLUSION_20261113, STONE_EXCLUSION_CACHE_20261113 블록입니다. helper만 지우면 링크·차감 호출이 기능을 잃고, 숨김만 지우면 구성행이 중복됩니다. 종족필드만 지우고 보정 호출을 남기면 프리셋에서 다시 생성됩니다. 해제하려면 패치 전체와 이미 저장된 구성값의 처리 기준을 함께 정해야 합니다.

개인 세이브 로드·사용자 창의 실제 줄바꿈/마우스 클릭은 미확인입니다. WORK·추적 소스만 반영했으며 Full·배포ZIP·사운드·커밋·푸시는 변경하지 않았습니다.

게임 확인: WORK 재실행 후 사다코·요르하의 첫 특성행과 하단 링크를 확인하고, 두 인물을 경기 참가자로 사용해 같은 공격에서 종족별 자원 손실이 위 표대로 달라지는지 확인할 수 있습니다.
`);
const regPath=R+'/records/release-q04-work-source-20261113/complete-change-register.json',reg=rd(regPath);a.equal(reg.sourceQspSha256,mod.before_sha256);for(const [id,title,before,after]of [['A-SPECIES-SETS','유령·안드로이드 종족 세트와 세 종족 방어','뱀파이어 방어 및 유령·안드로이드 묶음 미구현.','사다코·요르하 종족 묶음/하단 링크와 현재·신규 보정. 뱀파이어3자원2/3, 유령체력·스태미나1/2, 안드로이드체력·스태미나2/3·사기면역.'],['A-STONE-EXCLUSIONS','석녀와 네 중독 성향 배척','석녀와 구강·애널 중독이 겹치고 일부 구형/직업 보정이 석녀를 덮어쓸 수 있었다.','석녀는 구강·애널 중독 생성/보유를 차단하고 색정광·정액중독으로 진행하지 않음. 일반 치료·음수 혐오는 유지하며 설명 캐시도 보강.']]){a(!reg.entries.some(x=>x.id===id));reg.entries.push({id,layer:'Q04 이후 확정 수정',date:'2026-11-13',domain:'게임시스템',title,before,after,status:'WORK·추적 QSP 반영 / 실제 엔진109검사·21링크·정확재생·검토보완',verificationLimit:verification.limits.join(' '),evidencePaths:[D+'/REPORT_KO.md',D+'/verification.json',R+'/mods/'+mod.id+'.json']});}reg.sourceQspSha256=mod.after_sha256;reg.counts.rows=reg.entries.length;reg.counts.approvedAfterQ04+=2;wr(regPath,reg);
for(const f of ['release-data.json','checklist.json']){const p=P+'/'+f,j=rd(p);a.equal(j.sourceQspSha256,mod.before_sha256);j.sourceQspSha256=mod.after_sha256;j.speciesSetsFollowup='records/species-sets-20261113/REPORT_KO.md';if(j.playerReleaseNotes){j.playerReleaseNotes.sourceQspSha256=mod.after_sha256;j.playerReleaseNotes.publicItems=41;}if(j.items){const row=j.items.find(x=>x.id==='R23');row.action=row.action.replace('게임39항목','게임41항목');}wr(p,j);}
const gen=R+'/records/release-notes-player-20261113/release-categories.cjs',s=fs.readFileSync(gen,'utf8'),anchor=s.split('\n').find(l=>l.startsWith("add('systems','vampire-set',"));a(anchor&&!s.includes("'species-sets',"));fs.writeFileSync(gen,s.replace(anchor,anchor+"\nadd('systems','species-sets','유령·안드로이드를 기존 특성을 포함한 종족 세트로 정리했습니다. 뱀파이어·유령·안드로이드에게 각각 종족에 맞는 전투 피해 감소와 면역을 적용했습니다.',[],['A-SPECIES-SETS']);\nadd('systems','stone-exclusions','석녀에게 애널·펠라 중독, 색정광·정액 중독이 발생하지 않도록 배척 관계와 안내를 보강했습니다.',[],['A-STONE-EXCLUSIONS']);"));
const banner='> 최신 확정 후속: 유령·안드로이드 묶음, 세 종족 전투 방어와 석녀 배척 반영. WORK '+mod.after_sha256+' / 원장706행 / 공개41항목·초상52카드. [구현·검사 기록](G:/somi/JO9sa/records/species-sets-20261113/REPORT_KO.md). 아래 이전 해시·행수는 당시 기록이다.\n\n';for(const f of ['FULL_CHANGE_REGISTER_KO.md','RELEASE_NOTES_CHECKLIST_KO.md']){const p=R+'/docs/release-prep/2026-11-13/'+f;fs.writeFileSync(p,banner+fs.readFileSync(p,'utf8'));}const index=R+'/docs/SESSION_HANDOFF_INDEX.md';fs.writeFileSync(index,'## 2026-11-13 유령·안드로이드·종족 방어·석녀 배척\n\n[구현·검사 기록](../records/species-sets-20261113/REPORT_KO.md) — 사다코3011/요르하3018, 종족값1개 추가. 엔진62+47검사·21링크 통과. 구형 관심종자 별칭·설명 캐시 보완. WORK '+mod.after_sha256+'. Full·사운드·커밋·푸시 없음.\n\n'+fs.readFileSync(index,'utf8'));
for(const f of ['species-native.cjs','species-patch.cjs','species-vamp-regression.cjs','species-links.cjs','species-panes.ps1','species-install.cjs'])fs.copyFileSync(f,D+'/'+f);for(const f of fs.readdirSync(T).filter(x=>/-stderr\.log$/.test(x)||/^(?:replay|idempotent)\.log$/.test(x)))fs.copyFileSync(T+'/'+f,D+'/'+f);console.log(JSON.stringify({installed:true,sha:mod.after_sha256,records:reg.entries.length,nativeAssertions:109,links:21}));
