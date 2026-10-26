'use strict';
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const repo='G:/somi/JO9sa',source=repo+'/records/trait-system-review-20261024',out=repo+'/records/trait-slot-proposal-20261024';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const protectedPaths=read(repo+'/records/strong-obedience-rename-20261024/inputs.json').map(x=>x.path);
const before=protectedPaths.map(p=>({path:p,sha256:hash(p)}));
const inventory=read(source+'/all-traits.json');
assert.equal(inventory.rows.length,54);assert.equal(new Set(inventory.rows.map(x=>x.key)).size,54);
const titles=new Set(['arena_level','has_ride_win','jo9_versatile']);
const rows=inventory.rows.map(x=>({key:x.key,labels:x.variants.map(v=>v.label),variants:x.variants.map(v=>({name:v.label,value:v.value})),group:titles.has(x.key)?'title':'general',slotFamily:x.key==='jo9_versatile'?'versatile':titles.has(x.key)?'competition':null,randomRemovalEligible:!titles.has(x.key),neutralValue:titles.has(x.key)?null:x.key==='metabolism'?3:0,status:'PROPOSED_NOT_IMPLEMENTED'}));
const general=rows.filter(x=>x.group==='general'),titleRows=rows.filter(x=>x.group==='title');
assert.equal(general.length,51);assert.equal(general.reduce((n,x)=>n+x.variants.length,0),90);assert.equal(titleRows.length,3);assert.equal(titleRows.reduce((n,x)=>n+x.variants.length,0),5);
fs.mkdirSync(out+'/scripts',{recursive:true});
const proposal={id:'TRAIT_SLOT_RANDOM_REMOVAL_PROPOSAL_20261024',date:'2026-10-24',status:'PROPOSAL_NOT_IMPLEMENTED',sourceWorkSha256:hash('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'),sourceInventory:source+'/all-traits.json',approved:{generalSlots:8,titleSlots:3,preserveExistingSaveTraits:true},latestUserDirection:{removePositiveOrNegative:true,randomTarget:true,playerCannotSelectTrait:true,statusesNotRemovable:true},proposed:{generalAxes:51,generalDisplayVariants:90,titleStoredAxes:3,titleDisplayVariants:5,titleSlots:[{id:1,name:'다재다능',keys:['jo9_versatile']},{id:2,name:'향후 창관용成취'.replace('成','성'),keys:[],effectDesigned:false},{id:3,name:'경기 챔피언',keys:['arena_level','has_ride_win'],displayGroupOnly:true,condition:'arena_level >= 5 OR has_ride_win >= 4',tooltip:'두 종목의 현재 단계를 각각 표시; 과거 최고기록으로 바꾸지 않음',requiresUserApproval:true}],item:{nameDraft:'성향 소거제',price:null,priceDirection:'고가; 구체 금액 미정',scope:'실제로 보유한 유효한 일반 특성 축',includeHidden:true,uniformPerAxis:true,removesAxesPerUse:1,notSelectable:true,doesNotRerollOtherTraits:true,excluded:['칭호형 성취','임신·문신 없음·상처·질병·기아·회복 등 상태','기본 능력치·신체 단계·명성·시설/퀘스트 상태','보류된 비활성 값과 해석 불명인 비표준 세이브 값'],consumeOnlyAfterSuccessfulRemoval:true,noEligibleTargetConsumesNothing:true},fullSlots:{newAxis:'보류, 자동 삭제/교체 없음',discovery:'허용; 이미 점유한 칸',existingAxisChange:'허용; 같은 칸 교체, 기존 성장/변화 조건 유지',persistentConditions:'진행도 보존 후 빈칸이 생긴 다음 정상 검사에서 재판정',randomEvents:'유효한 다음 발생 시 재추첨; 성공 후보를 몰래 저장하지 않음',paidOneOff:'결제/소모 전에 슬롯 점검하고 만석이면 실행하지 않음',queueAdded:false},legacy:{preserveAll:true,preserveEffects:true,noOriginMigration:true,greaterThanEight:'새 일반 축만 제한',nineToEightStillFull:true,newAcquisitionWhen:'7개 이하',overflowDisplay:'일반 목록을 8개씩 페이지로 보기; 상태·칭호 자리 유지. 기존 특성 제목을 넘김 진입점으로 쓰는 안',unknownValues:'자동 정규화/삭제 금지; 해당 값별 판정 확인 전 보존'},removalConsequences:{selectedAxisExpressionXp:'즉시 재발 방지를 위해 선택된 축의 발현 누적 XP만 초기화하는 안; 추가 효과로 명시',confirmedSkillXpPreserved:true,baseAttributesPreserved:true,grantHistoryPreserved:true,permanentImmunityAdded:false,unrelatedTraitProgressPreserved:true},pending:['경기 칭호를 한 성취 칸으로 묶는 세 번째 성취안','개별 일반/칭호 분류의 채택','가격','선택된 축 발현 XP 정리','기존 초과 목록의 페이지 표시','저장·불러오기에 따른 삭제 결과 재추첨 취급'],runtimeApplied:false},rows};
write(out+'/proposal.json',proposal);
const escape=s=>String(s).replaceAll('|',' / ').replace(/\r?\n/g,' ');
let table='# 54개 특성의 일반·칭호 분류안\n\n일반 51축·90표시 변형, 칭호 관련 기존 3축·5표시 변형이다. 한 인물의 최대 보유 숫자가 아니며, 여러 단계/반대값은 같은 축 한 칸이다. 일반8＋칭호3 구조는 확정됐지만 아래 개별 배치는 제안이다.\n\n칭호 세 칸은 다재다능 / 향후 창관용 / 경기 챔피언을 제안한다. 마지막 항목은 투기장·경주의 기존 두 저장값을 한 줄에 묶는 표시안이다. 기존 등급·승수·장비 조건을 합치거나 초기화하지 않는다.\n\n| 분류 제안 | 저장 축 | 포함되는 표시명 | 무작위 삭제 대상 |\n|---|---|---|---|\n';
for(const r of rows)table+='|'+[r.group==='general'?'일반 8칸':r.slotFamily==='versatile'?'칭호: 다재다능':'칭호: 경기 챔피언(두 종목 공유)',r.key,r.labels.join(' / '),r.randomRemovalEligible?'대상: 유효한 실제 보유값만':'제외 제안'].map(escape).join('|')+'|\n';
table+='\n향후 창관용 성취는 아직 미구현이어서 54개 기존 저장 축에 더하지 않았다. 일반 중 숨은 보유도 집계/삭제 추첨에 포함하며, 임신·문신 없음 등의 상태와 기본 속성은 처음부터 이 표 밖이다.\n\n등록값의 부호나 표시 유무만으로 활성 여부를 판정하지 않는다. metabolism의 중립은3이고, 일부 성향의 중간값1 또는2에도 효과가 있다. 보류된 voice=2와 해석 불명인 값은 자동 처리하지 않는다.\n';
fs.writeFileSync(out+'/CLASSIFICATION_KO.md',table);
const designPath=repo+'/docs/superpowers/specs/2026-10-24-trait-slots-and-random-removal-design.md';fs.mkdirSync(repo+'/docs/superpowers/specs',{recursive:true});
fs.writeFileSync(designPath,`# 일반 특성 슬롯과 무작위 소거 아이템 — 제안

2026-10-24. **게임 미적용.** 일반8＋칭호3 구조는 사용자 확정이다. 구체 분류·획득 규칙·상품 가격은 이 문서의 제안이다. 기존 세이브·수동 편집·보유 특성을 불러오기만으로 변경하지 않는다.

## 분류

일반은 51개 저장 축·90개 표시 변형이다. 재능·적성·체질·성격·학습 성향·적응·취향을 포함한다. 전투 직업(광전사/성기사/역전의 용사)과 절세미인도 일반으로 두는 안을 권한다. 생성 때 가졌든 보유 중 새로 얻었든 같은 종류는 같은 칸을 사용한다.

칭호는 다재다능, 향후 창관용, **경기 챔피언**으로 제안한다. 경기 챔피언은 기존 투기장·경주 칭호를 한 칸에 묶은 표시다. arena_level>=5 또는 has_ride_win>=4에서 표시하고, 설명에는 각 종목의 현재 챔피언/그랜드 챔피언 단계를 각각 적는다. 기존 두 값과 효과는 그대로 유지한다. 한 번 이겼다는 뜻이나 새 영구 최고기록을 뜻하지 않는다. 에게야의 영입 전 경력도 같은 칭호 칸에 표시한다. 미래 창관 효과는 만들지 않았다.

[54축 전체 분류표](../../../records/trait-slot-proposal-20261024/CLASSIFICATION_KO.md). 두 경기 칭호를 각각 칭호 한 칸으로 쓰면 다재다능·창관용과 합쳐4칸이 되어 확정된3칸을 넘는다. 둘을 일반 칸으로 돌리는 안보다 한 경기 칭호 묶음으로 표시하는 안을 권한다. 이는 아직 세 번째 성취의 채택 결정이 아니다.

## 일반 8칸의 획득 규칙

1. 실제 보유한 일반 축을 세며, 아직 발견하지 않은 선천 특성도 포함한다. 새 인물 생성 단계에서8칸을 맞춰야 하며, 먼저51축을 다 부여한 뒤 화면만8개로 자르지 않는다.
2. 빈칸이 있으면 기존 조건에 따라 새 일반 특성을 얻는다. 만석이면 자동 삭제·대체·9번째 숨은 부여를 하지 않는다. 기본 능력치·기술 학습은 계속된다.
3. 같은 축의 단계 변화·반대값 변화는 새 칸을 요구하지 않는다. 기존 변화 조건을 유지하며, 이 규칙만으로 반대값을 자유롭게 고르게 하지 않는다. 이미 보유한 숨은 특성의 발견도 허용한다.
4. 누적 조건형은 진행도를 유지해 빈칸이 생긴 뒤 정상 검사에서 다시 판정한다. 무작위 사건형은 다음 유효한 사건에서 다시 기회를 얻는다. 만석 때 성공한 후보를 저장하는 대기열은 추가하지 않는 간단한 안이다.
5. 결제·소모가 있는 일회성 경로는 실행 전에 슬롯을 확인해 만석이면 결제하지 않는다. 일반8칸이 칭호의 조건 달성 지급을 막지 않는다.
6. 상태는 따로 유지한다. 임신·문신 없음·상처·질병·기아·회복과 기본 속성은 슬롯 확보를 위해 지우거나 부여를 막지 않는다.

## 고가 소모품: 성향 소거제(가칭)

사용자 최신 방향을 반영해 **긍정/부정을 가리지 않고 일반 특성 하나를 무작위로 제거**한다. 특정 특성을 선택하거나 제거 후 새 특성을 즉석으로 다시 뽑는 상품은 아니다. 가격은 고가라는 방향만 있고 금액은 미정이다.

- 후보는 그 인물이 실제로 가진 유효한 일반 축이다. 전체51축 중 보유하지 않은 것은 뽑지 않는다. 숨은 선천 특성도 포함하며, 사용 전 이 점과 현재 후보 수를 알려준다.
- 축당 같은 확률이다. 보유 일반8개면 각각12.5%, 기존 세이브에12개면 각각1/12이다. 긍정과 부정을 먼저50:50으로 고르거나 같은 축의 여러 단계·표시명을 중복 후보로 넣지 않는다.
- 문신 없음·임신 등의 상태, 기본 능력치·명성·신체 단계, 칭호형 성취는 추첨에서 제외하는 안이다. 그 밖에 특정 일반 특성을 임의로 보호하는 규칙은 추가하지 않는다. 비활성/해석 불명 세이브 값은 자동 제거하지 않는다.
- 확인 후 한 번 추첨하고 실제 제거가 성공했을 때만 아이템 한 개를 소비한다. 취소·대상 없음·처리 실패는 소비하지 않는다. 결과를 본 뒤 마음에 드는 대상으로 바꾸는 선택은 없다.
- 결과는 “산만함이 사라졌습니다. 일반 특성 8/8 → 7/8.”처럼 보여준다. 숨은 특성이 선택되면 “아직 발견하지 못했던 ○○ 특성이 사라졌습니다.”라고 알린다. 실패 확률·빈 추첨·다른 특성의 추가 추첨은 넣지 않는 안이다.

## 제거가 되돌리는 것과 보존하는 것

표시명만 지우지 않고 선택된 일반 축을 중립으로 돌려 지속 효과를 없앤다. metabolism은3, 그 밖의 지원되는 축은0이 중립이다. 실제 값의 범위와 적용 조건은 축별로 확인한다. 기존 편집기 전체 함수를 그대로 호출하면 다른 초기화와 다재다능 자동 획득까지 연결될 수 있어 제거에 필요한 정리만 사용해야 한다.

원본13축은 성향 발현용 누적 XP를 남기면 바로 다시 생길 수 있다. **선택된 축의 발현용 누적 XP만 함께 초기화**하는 안을 권한다. 이것은 아이템의 추가 효과로 설명하고, 다른 특성의 진행도·일반 기술 경험치·능력치·승수는 보존한다. 제거한 축의 미정산 분수 보정·known/revealed·표시 캐시도 필요한 범위만 정리한다. 새 영구 면역 플래그는 만들지 않아 이후 정상 플레이로 다시 얻을 수 있다.

노예근성 제거는 영입 때 이미 변한 복종·태도·기억을 역산하지 않는다. 초기화 완료 이력도 유지한다. 천재/백치 제거는 이미 정해진 지성이나 이미 얻은 경험치를 빼지 않는다. 절세미인 제거는 기초 외모에서 다시 계산하고 수술 사용·결제 이력을 유지한다. 전투 직업 제거는 전투 승수를 지우지 않는다. 과거에 사라진 기억도 복원하지 않는다.

## 기존 세이브 보존

기존 일반 특성이8개를 넘겨도 모두 유지하고 효과를 끄지 않는다. 출처를 추정해 재분류하거나 무작위로 덜어내지 않는다. 새 일반 축만 추가하지 않고 발견·동일 축 변화·칭호 달성은 허용한다.

9개에서 하나를 지우면8개로 여전히 만석이다.7개 이하가 되어야 새 일반 특성을 받을 수 있다. 강제 정리나 벌금은 없다. 초과 일반 목록은8개씩 페이지로 보여주는 안을 제안한다. 기존 특성 제목을 페이지 전환 진입점으로 쓰면 상태와 칭호 줄을 밀지 않고 기존 특성도 전부 열람할 수 있다. 페이지는 표시 방식일 뿐 효과를 비활성화하지 않는다.

## 부작용과 남은 결정

무작위 소거는 좋은 특성도 잃을 수 있어 저장·불러오기로 결과를 바꾸려는 유인이 생긴다. 사용 후 취소를 없애는 것만으로 재로드 추첨을 막았다고 할 수는 없다. 이번 안에서는 저장 동작이나 RNG를 바꾸지 않으며, 결과 고정이 필요하다면 별도 설계를 해야 한다.

개별 분류와 경기 칭호 통합, 가격, 선택된 축 발현 XP 초기화, 기존 초과 표시 및 저장·불러오기 취급이 채택 대상이다. 새 배제 규칙·부정 발생률·창관 효과는 이 제안으로 확정하지 않는다.

## 확인 범위

원본/신규 인벤토리54축·95표시 변형을 누락·중복 검사했다. 읽기 전용 소스 추적으로 중간값, 성향 XP, 초기화 이력과 편집기 부작용을 확인했다. 실제 게임 수정·문법 검사·플레이 시험은 이번 문서 작업에서 하지 않았다. 게임 파일을 수정하지 않아 문법 통과를 새로 주장하지 않는다.
`);
const bundle=repo+'/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md';let b=fs.readFileSync(bundle,'utf8');const marker='TRAIT_SLOT_RANDOM_REMOVAL_PROPOSAL_20261024';
if(!b.includes(marker))b+='\r\n\r\n## 제안 — 일반·칭호 개별 분류와 무작위 특성 소거 ('+marker+')\r\n\r\n- 일반51축/90변형, 칭호 관련 기존3축/5변형. 다재다능·창관용·경기 챔피언(투기장/경주 묶음)을 제안. 개별 분류/세 번째 칭호는 미채택.\r\n- 최신 사용자 방향: 긍정·부정 구분 없이 실제 일반 특성1개를 무작위로 지우는 고가 아이템. 문신 없음·임신 등 상태는 제외. 가격/발현XP 정리/재추첨 취급은 미정.\r\n- 기존8개 초과 보유/효과 유지, 새 일반 축만 제한하는 안. 게임·세이브·CSS·배포물 미적용, 커밋/푸시 없음.\r\n- [전체 분류표](../records/trait-slot-proposal-20261024/CLASSIFICATION_KO.md), [규칙 제안](superpowers/specs/2026-10-24-trait-slots-and-random-removal-design.md).\r\n';fs.writeFileSync(bundle,b);
for(const name of ['REVIEW_KO.md','ALL_TRAITS_KO.md']){let text=fs.readFileSync(source+'/'+name,'utf8');const note='> 후속 개별 분류·무작위 소거 제안은 [최신 분류표](../trait-slot-proposal-20261024/CLASSIFICATION_KO.md)와 [설계안](../../docs/superpowers/specs/2026-10-24-trait-slots-and-random-removal-design.md)에 있다. 기존8＋3 확정과 구체 제안 채택은 구분한다.\n\n';if(!text.includes('후속 개별 분류·무작위 소거 제안')){const n=text.indexOf('\n\n');text=text.slice(0,n+2)+note+text.slice(n+2);fs.writeFileSync(source+'/'+name,text);}}
for(const x of before)assert.equal(hash(x.path),x.sha256,'Protected file changed: '+x.path);
const saved=read(out+'/proposal.json');assert.equal(saved.rows.length,54);assert.equal(saved.rows.filter(x=>x.randomRemovalEligible).length,51);assert(!saved.latestUserDirection.playerCanSelectTrait);assert.equal(saved.latestUserDirection.playerCannotSelectTrait,true);assert.equal(saved.proposed.runtimeApplied,false);
for(const p of [out+'/CLASSIFICATION_KO.md',designPath])for(const match of fs.readFileSync(p,'utf8').matchAll(/\]\(([^:)]+)\)/g)){const target=require('path').resolve(require('path').dirname(p),match[1]);assert(fs.existsSync(target),'Missing relative link: '+target);}
write(out+'/verification.json',{status:'PASS',date:'2026-10-24',sourceWorkSha256:proposal.sourceWorkSha256,axes:54,variants:95,generalAxes:51,generalVariants:90,titleStoredAxes:3,titleVariants:5,duplicateKeys:0,protectedFilesChecked:before.length,protectedFilesUnchanged:true,relativeLinksValid:true,runtimeEdited:false,saveEdited:false,qspSyntaxTestsRun:false,qspSyntaxTestsReason:'Design documentation only; no QSP edits',temporaryGameCopiesCreated:0,commitPush:false});
if(__filename.replaceAll('\\','/')!==out+'/scripts/build-proposal.cjs')fs.copyFileSync(__filename,out+'/scripts/build-proposal.cjs');
console.log(JSON.stringify(read(out+'/verification.json')));
