'use strict';
const fs=require('fs'),assert=require('assert/strict');
const repo='G:/somi/JO9sa',out=repo+'/records/fame-expansion-20261024',old=repo+'/records/fame-content-audit-20261024',c=require(repo+'/tools/text-workshop/core.cjs'),game='G:/somi/Jack O Nine Tails v2.4_work/game';
const raw=fs.readFileSync(game+'/jack.qsp'),sha=c.hash(raw);assert.equal(sha,'738443e5e33db32bb42495a1cd6cfe89ecef9d16f3a164517f1ff0bfa46aa3dc');
fs.mkdirSync(out+'/scripts',{recursive:true});
const rules={id:'FAME_EXPANSION_RULES_20261024',date:'2026-10-24',status:'VALUES_CONFIRMED_USER_FOG_TARGET_SELECTION_PENDING_NOT_IMPLEMENTED',sourceWorkSha256:sha,unit:'actor_rate[fame] personal fame points; not display grade or protagonist reputation',approved:{rally:{firstWin:10,repeatBelow80:1,repeatAtLeast80:0.25,threshold:80},catfight:{firstWin:10,subsequentWin:3,maxRewardedWins:3,maxPoints:16,entryLimitInterpretation:'3wins',defeatDoesNotReduceLifetimeWins:true},fog:{onlyUniqueOrBoss:true,triggerOnVictory:true,witnessProbabilityPercent:20,famePoints:5,ordinaryFightsExcluded:true,eligibleIds:null,targetSelectionOwner:'user',targetSelectionStatus:'awaiting_user_named_targets'},redlightPublicService:'unchanged'},proposedInterpretations:{rallyFirstWinOverridesThreshold:true,quarterAccounting:'Per-actor0..3 quarters; four repeat victories above80 settle1 point. No fractional loss.',legacyRally:'No per-person historic wins available. Preserve existing fame; recommend first newly recorded victory after update for new bonus.',legacyCatfight:'Do not infer by halving catfight_level or global result visits. Exact personal history unavailable. No unapproved rewrite.',fogActor:'Only the companion who actually won; no fame for a defeated companion after protagonist takeover.',fogResult:'Existing battle victory semantics, including routed opponents; no extra mandatory-kill requirement.'},answeredQuestions:[{id:'catfight_limit',answer:'3승 달성 후 출전 금지'},{id:'fog_scope',answer:'직접 대상 몬스터를 정하겠다'}],pendingQuestions:[],otherPending:['Legacy first-win and catfight counter policy','User-selected fog target monster list'],implementation:{runtimeApplied:false,qspWritten:false,savesWritten:false,commitPush:false},witnessDialogue:['안개 너머에서 싸움을 지켜보던 여행자가 조심스럽게 다가왔다.','“저런 상대를 쓰러뜨리다니… 도시에서도 당신의 이름을 전하겠소.”','[출전자 이름]의 무용담이 퍼지기 시작했다. (개인 명성 +5)']};
fs.writeFileSync(out+'/rules.json',JSON.stringify(rules,null,2)+'\n');
fs.writeFileSync(out+'/DECISIONS_KO.md',`# 명성 확장 — 사용자 확정 수치와 남은 결정

2026-10-24. **기획·대사 준비이며 WORK 미적용.** 기준 QSP: ${sha}. 이전 +2 캣파이트안, 최상위 몬스터10%/+1안 및 랠리 무조건승리당+10안은 이번 수치로 대체한다.

## 확정 수치

| 활동 | 첫 우승 | 이후 우승 | 제한 |
|---|---:|---:|---|
| 정액랠리 | +10 | 개인 명성80 미만 +1 /80 이상 +0.25 | 현재값80은 표시등급이 아닌 명성 원천 누적값 |
| 캣파이트 클럽 | +10 | +3 | 3승 달성 후 출전 금지. 패배는 누적 승수를 줄이지 않음. 최대16 |
| 안개경계 고유/보스전 | 승리 후20% 추첨에 당첨되면+5 | 같은 조건 | 일반 적 전투는 추첨도 하지 않음. 고유/보스 대상 집합 확인 필요 |
| 홍등가 공개 영업 | 현행 유지 | 현행 유지 | 수식·보상·메뉴 수정 없음 |

랠리는 최초 우승 +10을 먼저 판정하고80점 경계는 반복 우승에만 적용하는 해석을 제안한다. 이 해석이면 첫승 당시 이미80 이상이어도+10이다. 명성0.25는 정수 계산에서 버리지 않고 개인별1/4 누적치로 보존한다. 예를 들어 첫 보상까지 끝난 인물이79점에서 반복우승하면80, 그다음4번 반복우승하면81이 된다. 기존 명성 표시등급과 상한은 유지한다.

## 목격담 초안

> 안개 너머에서 싸움을 지켜보던 여행자가 조심스럽게 다가왔다.
> “저런 상대를 쓰러뜨리다니… 도시에서도 당신의 이름을 전하겠소.”
> [출전자 이름]의 무용담이 퍼지기 시작했다. **개인 명성 +5**

익명 여행자는 이 상황의 대사만 담당하며 새로운 NPC 데이터·얼굴·퀘스트를 만들지 않는다. 실제 승리한 노예/조수 이름을 넣는다. 패배한 동료 대신 주인공이 이긴 경우 동료 명성을 주지 않는다. 적의 사망을 별도로 강제하지 않고 기존 전투 승리 판정을 따른다. 전투 종료 정산 시 짧은 알림을 쓰는 안이면 후속 결과 대사에 덮이지 않는다.

## 코드에서 확인한 걸림점

### 랠리

현재 직접 참가는 slave만 가능하다. 102113~102116 추첨 확정 블록은 남녀 주인공 각각4곳이다. 승리 결과102118/102119/102121/102123이 확정되는 시점에서 정산하면, 결과 화면을 다시 여는 것만으로 명성이 반복 지급되지 않는다. 추첨 분기 직접 재실행은 기존 구조상 새 경기 실행이며 이번 명성 보상 때문에 새 결과 창을 만들 필요는 없다.

개인별 기존 우승 카운터는 없다. city_already_done_ever는 여러 인물 합산의 결과 방문수이므로 개인 첫승을 복원하는 데 쓸 수 없다. 개인 배열의 승수/첫승 표시1개와1/4 누적치1개, 총2개 숫자 키로 추적하는 안이다. 역할 교환 시 기존 전체 배열 복사에 따라 보존된다. 구세이브의 기존 명성·기술을 바꾸지 않고, 업데이트 후 처음 기록되는 우승을 첫 보상으로 보는 안을 권하지만 아직 정책 확정은 아니다.

### 캣파이트

catfight_level은 현재 승리당 공통 종료+1과 남녀 결과+1로 두 번 오른다. 패배/도주에는1 내려가므로 누적승수·출전수로 쓸 수 없다. 실제 공통 출전 제한은 catfight_level<3이며, 통상 무패라면0→2→4로 두 번만 우승하고 막힌다.

사용자는3승 후 출전 금지를 선택했다. 단조 누적 승수를 사용하고 패배가 기존 우승 기록을 줄이지 않아야 한다. 이 규칙과 함께 결과의 중복 증가·패배 감소·기존 레벨5 특수 분기·캐시된 출전 메뉴까지 일관되게 정리해야 한다. 공통 전투 종료의 Start1 토큰을 먼저 소비한 다음 승리 보상을 주면 남녀 결과와 결과 화면 재진입에 새 명성 보상이 중복되지 않는다.

기존 개인 승수는 정확히 복원할 수 없다. catfight_level을 단순히 반으로 나누거나 전역 결과 방문수를 개인 기록으로 배정하지 않는다. 기존 수치와 명성을 보존하면서 새 기록을 언제부터 셀지 정해야 한다. 새 카운터만0으로 더하고 옛 레벨 분기를 그대로 두면 잘못된 패배 결과로 갈 수 있으므로 그런 부분 적용은 하지 않는다.

### 안개경계

경계 순찰61101~61114에는 보스/고유 플래그가 없다. 거대 안개괴물·리치·오우거·와그·늑대인간·흡혈귀도 반복 일반 종이다. 이들을 강하다는 이유로 자동 보스 지정하지 않는다.

엄격한 경계 순찰에서 이름 있는 고유 전투는61115의 가르시드(garsid)이며 적 배열의5번째 슬롯이다. 따라서 첫 적만 검사하면 누락된다. 가르시드는 고정 이름NPC이며 이 분류가 고유 괴물 보스라는 뜻은 아니다. 도주한 적도 기존 전체 승리에 포함되므로 별도의 직접 처치 조건을 임의로 넣지 않는다. 사용자가 직접 대상 몬스터를 정하기로 했으므로 가르시드나 거대괴물도 자동 대상 지정하지 않는다.

안개 내부의 vatican_paladin(6215/fogs_battle1), strazhnik(6216/fogs_battle2)은 별도 퀘스트 전투이며 현재 동료 출전 연결이 없다. 그린치·에게야·에르자는 다른 지역이므로 이 확장에 자동 포함하지 않는다. 대상 목록이 정해지기 전 일반 순찰23종을 보스 보상에 넣지 않는다.

기존 jo9_fog_relay settle은 active=1/settled=0을 통과하면 즉시 settled=1로 소비한다. 그 안의 실제 동료 승리 분기에서만20%를 한 번 추첨하고, 당첨 시 그 인물의 명성 원천+5와 위 대사를 출력하면 추가 영구키 없이 반복 지급을 막을 수 있다. 주인공 대타 승리는 기존 교대/소비 경로로 제외된다.

## 적용 상태와 검증

수치와 목격담을 기록했다. 캣파이트3승 제한은 확정됐으며, 안개 대상 몬스터 목록은 사용자 지정 대기다. 구세이브 개인별 첫승 기록 처리도 구현 전에 명시해야 한다. 코드·세이브·리소스·배포물은 변경하지 않았다. 이번 단계는 소스 조사이며 문법·실제 엔진 통과를 새로 주장하지 않는다. 구현 시에는 최초/반복·79→80·4회1점·캣파이트 최대16·결과재진입·고유/일반·20% 조건·대타승리·기존 세이브와 공식 출고 검사를 수행한다. 커밋·푸시 없음.
`);
const previous=old+'/USER_REVISION_20261024_KO.md';let p=fs.readFileSync(previous,'utf8');const note='> 후속 확정 수치: 랠리 최초10/반복1/80이상0.25, 캣파이트10+3+3, 고유·보스 목격20%/+5. 아래 이전10%/+1 및+2안은 대체됐다. [최신 결정](../fame-expansion-20261024/DECISIONS_KO.md).\n\n';if(!p.includes('후속 확정 수치: 랠리')){const i=p.indexOf('\n\n');p=p.slice(0,i+2)+note+p.slice(i+2);fs.writeFileSync(previous,p);}
const bundle=repo+'/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md';let b=fs.readFileSync(bundle,'utf8');if(!b.includes('FAME_EXPANSION_RULES_20261024'))b+='\r\n\r\n## 수치 확정·세부 확인 대기 — 명성 확장 (FAME_EXPANSION_RULES_20261024)\r\n\r\n- 랠리 개인최초우승+10, 반복+1, 현재명성80이상반복+0.25. 분수누적보존안. 캣파이트첫승10/이후3/보상3승최대16.\r\n- 안개경계 고유/보스전만 승리시20%목격/+5. 홍등가공개영업현행유지. 익명목격담준비.\r\n- 캣파이트3승달성후출전금지확정. 안개대상몬스터는사용자가직접지정하며현재목록은비워둠. 구세이브개인우승기록불명정책과대상집합정리후구현.\r\n- WORK/세이브/배포물미적용,커밋/푸시없음. [결정·대사·근거](../records/fame-expansion-20261024/DECISIONS_KO.md).\r\n';b=b.replace('- 총3출전vs3승제한 및 고유전만vs거대안개괴물포함 질문대기. 구세이브개인우승기록불명정책과정확한대상집합정리후구현.','- 캣파이트3승달성후출전금지확정. 안개대상몬스터는사용자가직접지정하며현재목록은비워둠. 구세이브개인우승기록불명정책과대상집합정리후구현.');fs.writeFileSync(bundle,b);
assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),sha);assert.equal(rules.approved.catfight.firstWin+2*rules.approved.catfight.subsequentWin,16);assert.equal(4*rules.approved.rally.repeatAtLeast80,1);
fs.writeFileSync(out+'/verification.json',JSON.stringify({status:'PASS',documentChecksOnly:true,sourceWorkSha256:sha,workUnchanged:true,maximumCatfightPoints:16,fourQuarterWinsTotal:1,questionsPending:0,fogTargetSelectionPending:true,runtimeApplied:false,qspSyntaxTestsRun:false,temporaryGameCopiesCreated:0,commitPush:false},null,2)+'\n');
fs.copyFileSync(__filename,out+'/scripts/record-decisions.cjs');console.log(JSON.stringify({status:'RECORDED',workUnchanged:true,questionsPending:0,fogTargetSelectionPending:true}));
