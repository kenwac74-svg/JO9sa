'use strict';
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const repo='G:/somi/JO9sa',base=repo+'/records/trait-system-review-20261024';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const json=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function applyDecision(){
 const protectedInputs=read(repo+'/records/strong-obedience-rename-20261024/inputs.json');
 const before=protectedInputs.map(x=>({path:x.path,sha256:hash(x.path)}));
 const decision={id:'TRAIT_SLOT_DECISION_20261024',date:'2026-10-24',status:'USER_APPROVED_DESIGN_NOT_IMPLEMENTED',userAnswer:'일반 성향 8칸＋칭호형 성취 3칸으로 구분 (추천)',generalSlots:8,titleAchievementSlots:3,totalSlots:11,routeIndependentGeneralTraits:true,discoveryIsNotAcquisition:true,sameAxisUpgradeConsumesAdditionalSlot:false,reservedTitleAchievements:[{slot:1,key:'jo9_versatile',name:'다재다능'},{slot:2,key:null,name:'향후 창관용 성취',effectDesigned:false},{slot:3,key:null,name:'미정'}],pending:['투기장·경주 칭호의 통합/개별 집계와 표시','전투 직업·절세미인의 개별 슬롯 분류','세 번째 칭호형 성취','만석 시 새 일반 성향의 획득·교체 정책','기존 초과 보유 세이브 보존 방식','생성 시 긍정·부정 배분 및 새 배제 규칙'],runtimeApplied:false,saveMigrationApplied:false,commitPush:false};
 json(base+'/slot-decision.json',decision);
 const section=`## 확정된 슬롯 구조 — 2026-10-24 사용자 선택

**일반 성향 8칸＋칭호형 성취 3칸, 총 11칸**으로 구분한다. 이는 설계 기준의 확정이며 게임의 개수 제한을 적용한 것은 아니다.

- 일반 성향은 생성 때 보유했는지, 보유 중 새로 생겼는지와 관계없이 같은 8칸에서 관리한다. 뒤늦은 발견은 새 획득이 아니다.
- 칭호형 성취는 다재다능 1칸, 향후 창관용 1칸, 미정 1칸을 계획한다. 창관 효과와 세 번째 대상은 아직 결정하지 않았다.
- 같은 축의 단계 상승은 기존 칸을 교체한다. 임신·부상·회복 등의 상태는 특성 슬롯과 별도이며, 이전의 분류 제목을 추가하지 않는 방향도 유지한다.
- 필수 성취가 다른 임의 성향의 누적으로 막히지 않도록 두 묶음을 분리한다. 실제 지급·만석 정책은 구현 전에 별도로 정한다.

현재 전체표의 획득 경로는 원천 조사 사실이다. 획득 시점만으로 칭호 칸을 배정하지 않는다. 투기장·경주 칭호의 통합 여부, 전투 직업·절세미인의 개별 배치, 기존 초과 보유자의 처리와 새 배제 규칙은 미정이다. 기존 세이브에서 특성을 자동 삭제하지 않는다.

일반 후보 49축·다재다능 확정 1축·경계 검토 4축이라는 표의 구분은 **분류 초안**이다. 일반 후보 49개를 한 인물이 모두 보유한다는 뜻이 아니며, 성취가 총 3종으로 이미 확정됐다는 뜻도 아니다.

[확정 결정 데이터](slot-decision.json). 게임·세이브·CSS·배포물은 이 결정 기록 작업에서 변경하지 않았다.

`;
 let review=fs.readFileSync(base+'/REVIEW_KO.md','utf8');
 const start=review.indexOf('## 성취 슬롯에서 먼저 결정할 문제'),end=review.indexOf('## 별도 결함 후보와 검증 한계');
 if(start>=0&&end>start)review=review.slice(0,start)+section+review.slice(end);
 else {const a=review.indexOf('## 확정된 슬롯 구조'),b=review.indexOf('## 별도 결함 후보와 검증 한계');assert(a>=0&&b>a,'Known readable report section');review=review.slice(0,a)+section+review.slice(b);}
 review=review.replace('새 배제·개수·발생률·출처 분류는 아래의 **검토안이며 미적용**이다.','8＋3 슬롯 구분은 사용자 확정 설계다. 개별 분류·새 배제·발생률·세이브 처리 및 실제 제한은 아직 미적용이다.');
 fs.writeFileSync(base+'/REVIEW_KO.md',review);
 const all=read(base+'/all-traits.json'),boundary=new Set(['arena_level','has_ride_win','jo9_combat_trait','jo9_peerless']);
 all.classificationDecision=decision.status;
 all.slotDecisionRef='slot-decision.json';all.acquisitionClassificationIsHistoricalRouteAudit=true;
 const normalRoute=r=>{const x=r.classification;if(Array.isArray(x))return x.length>1?'초기 보유 / 보유 중 새 획득':x[0]==='선천'?'초기 보유':'보유 중 조건 획득';const t=typeof x==='string'?x:x.type;return t.includes('양경로')?'초기 보유 / 보유 중 획득·변화':t.includes('초기보유')?'초기 보유':t==='성취 전용 후보'?'경주 승리 누적':t;};
 for(const r of all.rows)r.slotPlan=r.key==='jo9_versatile'?{group:'title',status:'confirmed',label:'칭호 3칸: 확정'}:boundary.has(r.key)?{group:null,status:'pending',label:'일반/칭호 경계 미정'}:{group:'general',status:'proposed',label:'일반 8칸 후보'};
 assert.equal(all.rows.length,54);assert.equal(all.rows.reduce((n,r)=>n+r.variants.length,0),95);json(base+'/all-traits.json',all);
 const cell=x=>String(x).replaceAll('|',' / ').replace(/\r?\n/g,' ');
 let table='# 전체 특성 대조표 — 2026-10-24\n\n54개 저장 축·95개 표시 변형이다. 같은 축의 반대값과 상위 단계는 한 칸이다. 상태와 기본 속성은 별도다.\n\n**사용자 확정: 일반 성향 8칸＋칭호형 성취 3칸.** 획득 경로와 슬롯 분류를 분리했다. 아래 일반 후보 및 경계 미정 표시는 개별 분류 초안이며 실제 게임 제한은 적용하지 않았다. 다재다능·향후 창관용·미정 1칸을 계획한다. [결정 및 잔여 사항](slot-decision.json).\n\n조사 스냅샷 afb2… 이후 WORK f2d5…에서는 명칭·설명 4문구만 변경됐다. 실제 효과·획득 경로는 유지했다.\n\n| 출처 | 저장 축 | 표시 변형 | 유불리 | 실제 획득 경로 | 8＋3 분류 검토 | 핵심 효과 |\n|---|---|---|---|---|---|---|\n';
 for(const r of all.rows)table+='|'+[r.origin,r.key,r.variants.map(v=>v.label+' ('+v.value+')').join(' / '),[...new Set(r.variants.map(v=>v.valence||v.polarity))].join(' / '),normalRoute(r),r.slotPlan.label,r.effect].map(cell).join('|')+'|\n';
 table+='\n初期보유 전용 분류는 직접 쓰기 추적 범위의 결과이며 모든 임의 동적 코드를 증명한 것은 아니다. [추가 추적](initial-only-write-followup.json).\n\n[원본 전체 경로](ORIGINAL_KO.md) · [신규·복원 전체 경로](NEW_KO.md) · [관계 검토](RELATIONS_KO.md)\n';
 table=table.replace('初期보유','초기 보유');fs.writeFileSync(base+'/ALL_TRAITS_KO.md',table);
 const bundle=repo+'/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md';let b=fs.readFileSync(bundle,'utf8');
 b=b.replace('- 일반8+특별성취3 vs 모든후천을성취로집계하는분류는사용자답변대기. 신규배제/상한/발생률/출처이관/창관특성미적용.','- 2026-10-24 사용자 확정: 일반 성향 8칸＋칭호형 성취 3칸. 다재다능·향후 창관용·미정 1칸. 보유 중 새 성향도 일반 칸에서 관리한다. 개별 분류·만석 정책·기존 세이브 처리·배제·발생률·실제 제한은 미적용. [결정](../records/trait-system-review-20261024/slot-decision.json).');
 assert(!b.includes('일반8+특별성취3 vs 모든후천을성취로집계하는분류는사용자답변대기'));fs.writeFileSync(bundle,b);
 for(const x of before)assert.equal(hash(x.path),x.sha256,'Protected input unchanged: '+x.path);
 const counts={generalProposals:all.rows.filter(r=>r.slotPlan.status==='proposed').length,titleConfirmed:all.rows.filter(r=>r.slotPlan.status==='confirmed').length,boundaryPending:all.rows.filter(r=>r.slotPlan.status==='pending').length};
 assert.deepEqual(counts,{generalProposals:49,titleConfirmed:1,boundaryPending:4});
 const result={status:'PASS',date:'2026-10-24',decisionId:decision.id,slots:{general:8,title:3,total:11},axes:54,variants:95,...counts,protectedFilesChecked:before.length,protectedFilesUnchanged:true,workSha256:hash('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'),runtimeApplied:false,saveMigrationApplied:false,tests:'Document/JSON consistency and protected-file hash equality only; QSP not edited',temporaryGameCopiesCreated:0,commitPush:false};
 json(base+'/slot-decision-verification.json',result);return result;
}
module.exports={applyDecision};
if(require.main===module){fs.mkdirSync(base+'/scripts',{recursive:true});if(__filename.replaceAll('\\','/')!==base+'/scripts/apply-slot-decision.cjs')fs.copyFileSync(__filename,base+'/scripts/apply-slot-decision.cjs');console.log(JSON.stringify(applyDecision()));}
