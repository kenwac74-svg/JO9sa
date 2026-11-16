'use strict';
const fs=require('fs'),a=require('assert/strict'),z=require('zlib');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',D=R+'/records/chaotic-opium-penalty-20261113',T='G:/Codex/tmp/chaotic-opium-penalty-20261113',P=R+'/records/release-prep-20261113',Q=R+'/records/release-q04-work-source-20261113',c=require(R+'/tools/text-workshop/core.cjs'),rd=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),wr=(p,j)=>fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');
const mod=rd(D+'/change.json'),raw=fs.readFileSync(T+'/patched.qsp'),baseline=z.gunzipSync(fs.readFileSync(D+'/jack.before.qsp.gz'));a.equal(c.hash(raw),mod.after_sha256);a.equal(c.hash(baseline),mod.before_sha256);a.equal(Buffer.compare(raw,fs.readFileSync(T+'/replay.qsp')),0);a(rd(D+'/green-results.json').every(x=>x.pass));a.equal(rd(D+'/green-fixture.json').casesCount,36);a.equal(rd(D+'/green-fixture.json').sha,mod.after_sha256);
const b=c.parse(baseline),n=c.parse(raw),changed=b.locations.filter(l=>b.lines[l.body]!==n.lines[n.locations.find(x=>x.name===l.name).body]).map(x=>x.name).sort();a.deepEqual(changed,['jo9_chaotic','menu_form','next_day','pharmacy']);a.equal(Buffer.compare(raw,c.serialize(n)),0);
for(const p of [W+'/jack.qsp',R+'/assets/runtime/2.4.1/jack.qsp'])a.equal(c.hash(fs.readFileSync(p)),mod.before_sha256,p);
for(const p of [W+'/jack.qsp',R+'/assets/runtime/2.4.1/jack.qsp'])fs.writeFileSync(p,raw);wr(R+'/mods/'+mod.id+'.json',mod);
for(const p of [R+'/assets/runtime-source-2.4.1.json',R+'/assets/runtime-manifests/2.4.2-work.json']){const j=rd(p);a.equal(j.sourceQspSha256,mod.before_sha256);j.sourceQspSha256=mod.after_sha256;for(const row of j.files||[])if(row.path==='game/jack.qsp'||row.runtimePath==='jack.qsp'){row.sha256=mod.after_sha256;row.bytes=raw.length;}j.chaoticOpiumFollowup={date:'2026-11-13',record:'records/chaotic-opium-penalty-20261113/REPORT_KO.md',before:mod.before_sha256,after:mod.after_sha256,newSaveFields:0};wr(p,j);}
const verification={date:'2026-11-13',before:mod.before_sha256,after:mod.after_sha256,locations:310,changedLocations:changed,nativeCases:36,nativePass:true,exactReplay:true,idempotent:true,roundTrip:true,independentReview:'No remaining Important findings after bonus-AP correction; static review only.',domini:'Existing spellbound mood penalty and original stress expression; negative result clamped to0. No spell flag, forced obedience or opium mood bonus.',energy:'Immediate -2 energy; effective remaining energy*2-half_action<=0 faints; preserves half/bonus AP.',opium:'Existing on_opium/opium_addiction fields; first daily dose pending, each extra dose+1, original next_day adds first dose; existing decay and treatment/pilfering rules kept.',newSaveFields:0,zeroStaminaGuard:true,limits:['Native synthetic helper and actual extracted original next_day opium block, not full day playback.','Menu/newloc/cache pipeline statically reviewed.','Personal saves and visual click/hover not tested.','Existing spellbound mood dialogue is shared and retains its spell wording.'],FullChanged:false,soundChanged:false,packaged:false,committed:false,pushed:false};wr(D+'/verification.json',verification);
fs.writeFileSync(D+'/REPORT_KO.md',`# 카오틱 에센스 — 도미니 부작용·행동력·아편형 중독 반영

2026-11-13 / WORK ${mod.after_sha256}. 사용자 확정대로 새로운 중독 곡선이나 신경쇠약 공식을 만들지 않고 기존 효과를 조합했습니다.

## 실제 동작

- 원래 특성 제거가 성공했을 때만 약 1개와 페널티를 함께 적용합니다. 가격900, 후보 우선순위·긍정 특성 보호·정액 중독 완화 등 원래 약효는 유지했습니다.
- 도미니 딕툼의 neg_spellbound 기분 불이익과 기존 스트레스 식을 사용합니다. 원래 식이 음수인 경우 스트레스 감소 이득을 주지 않도록0으로 제한합니다. 명령 강제·주문 상태·아편 기분 상승은 부여하지 않습니다. 교육차단 주문 상태도 부여하지 않습니다.
- 복용 즉시 행동력2 차감. 반칸·보너스 잔량까지 반영해 실제 잔량이0이하이면 즉시 기절하고 기존 exhaustion_fainted 표시를 사용합니다. 일반 행동의 기절 경계는 바꾸지 않았습니다.
- 아편과 같은 기존 중독 수치를 공유합니다. 첫 복용은 on_opium으로 예약되어 원래 하루 처리에서+1, 그날 추가 복용은 즉시+1이므로 하루N회가N회로 누적됩니다. 실제 아편을 이미 쓴 날에도 중복 누락이나 이중 가산 없이 합산합니다. 별도 영구 복용 총량·새 저장값은 없습니다.
- 중독이 체력을 넘었을 때의 기분·체력 불이익, 기존 자연 감소·치료·조수의 약물 자가복용 규칙은 기존 아편 시스템을 따릅니다. 기존 아편 기분 상승 상태가 이미 있으면 지우지 않지만 에센스가 새로 부여하지는 않습니다.
- 기존 아편 식의 day mod stamina가 체력0에서 연산을 멈춰 분모만 max(1,stamina)로 보호했습니다. 체력이1이상인 기존 계산은 같습니다.
- 사용·구매 메뉴 툴팁에 행동력 소모·기절·정신교란·중독을 안내했습니다. 기분 보고는 기존 주문 부작용 항목을 공유하므로 기존 주문 관련 표현이 나올 수 있습니다.

## 입력·반환·호출·의존성

jo9_chaotic의 count/apply/use와 slave/assistant 인자는 그대로입니다. count는 상태·아이템·행동력을 바꾸지 않습니다. 성공 반환1, 실패0이며, 성공 직후에만 역할별 배열 및 _rate/_state에 부작용을 적용합니다. menu_form의 두 기존 사용 버튼에서 호출하며 새 경로나 이미지·음원은 필요 없습니다. 아편 누적/회복은 next_day의 기존 $next_day_healing_and_dependence가 담당하며 이 함수는 하루마다 다시 정의되어 저장된 옛 코드가 남지 않습니다. jo9_chaotic은 캐시 함수가 아닌 현재 QSP location을 직접 호출합니다.

## 검증

기존본 RED: 행동력 소모가 없어 첫 사례 실패. 체력0 경계의 기존 아편 나머지 연산 오류와 반칸/이월 행동력 오판도 별도 RED로 확인 후 수정했습니다. 최종 실제 FastQSP36사례 GREEN: 양 역할, AP5/3/2/1/0, 반칸·보너스, 조회 부작용 없음, 후보/재고/대상 없음, 긍정효과 제외, 하루5회 누적, 기존 아편 합산, 체력0. 선언형 패치의 정확 재생·재적용 멱등성·310location 왕복·변경4곳을 확인했습니다. 독립 검토의 보너스AP 지적은 고쳤으며 남은 Important 지적은 없습니다.

이 검사는 합성 상태의 실제 helper 및 원래 하루 아편 블록을 실행한 것입니다. 실제 개인 세이브·화면·전체 하루 진행을 새로 검증한 것은 아닙니다. 메뉴→$newloc→행동력·상태·기분 갱신과 캐시 경로는 정적으로 검토했습니다. 전체 배포 출고 검사는 별도입니다.

일반 EXE 재실행 후 노예 또는 조수에게 에센스를 사용하면 약효와 함께 행동력이2 줄어야 합니다. 잔량이0이하인 대상은 기절하고, 반복 복용은 다음 날 기존 아편 중독 처리에 합산됩니다.

복구 원본은 jack.before.qsp.gz, 정확 변경은 mods/${mod.id}.json입니다. 부작용 블록을 제거하면 기존 무비용 특성 제거로 돌아갑니다. 기존 아편 저장축을 공유하므로 이후 기능을 제거하더라도 기존 아편 중독값을 일괄0으로 지우면 사용자가 원래 가지고 있던 중독까지 사라집니다. 일괄 초기화하지 않습니다.

WORK와 추적 QSP·배포 입력만 갱신했습니다. Full·SAV·음원·ZIP·커밋·푸시는 건드리지 않았습니다.
`);
const p=Q+'/complete-change-register.json',reg=rd(p);a(!reg.entries.some(x=>x.id==='A-CHAOTIC-OPIUM-PENALTY'));reg.sourceQspSha256=mod.after_sha256;reg.entries.push({id:'A-CHAOTIC-OPIUM-PENALTY',layer:'Q04 이후 확정 수정',date:'2026-11-13',domain:'게임 밸런스',title:'카오틱 에센스 정신교란·행동력 소모·아편형 중독 연결',before:'900스파크로 특성을 제거하며 정신 부작용·행동력 소모·중독 누적이 없었다.',after:'성공한 복용에 도미니의 기분·스트레스 부작용(이득 제외), 즉시 행동력2 소모와 잔량0이하 기절, 기존 아편 중독 합산. 새 저장값0개. 체력0 아편 계산 방어와 안내 보강.',status:'WORK·추적 QSP 반영 / 실제 엔진36사례 및 정확 재생 검증',verificationLimit:verification.limits.join(' '),evidencePaths:[D+'/REPORT_KO.md',D+'/verification.json',R+'/mods/'+mod.id+'.json']});reg.counts.approvedAfterQ04=(reg.counts.approvedAfterQ04||0)+1;reg.counts.rows=reg.entries.length;wr(p,reg);
for(const f of ['release-data.json','checklist.json']){const p=P+'/'+f,j=rd(p);j.sourceQspSha256=mod.after_sha256;j.chaoticOpiumFollowup='records/chaotic-opium-penalty-20261113/REPORT_KO.md';if(j.playerReleaseNotes){j.playerReleaseNotes.sourceQspSha256=mod.after_sha256;j.playerReleaseNotes.publicItems=36;}if(j.items){const row=j.items.find(x=>x.id==='R23');row.action=row.action.replace('게임35항목','게임36항목');}wr(p,j);}
const previous=R+'/records/chaotic-sanity-review-20261113/LATEST_REQUIREMENTS.json',req=rd(previous);req.status='IMPLEMENTED_EXISTING_DOMINI_NEGATIVE_AND_OPIUM';req.notImplemented=false;req.currentQspSha256=mod.after_sha256;req.clarification='User selected Domini negative only, instant-2, opium-style; applied with no new save fields.';req.implementation='records/chaotic-opium-penalty-20261113/REPORT_KO.md';wr(previous,req);
for(const file of ['chaotic-opium-native.cjs','chaotic-opium-patch.cjs','chaotic-opium-install.cjs']){const b=fs.readFileSync(file);fs.writeFileSync(D+'/'+file,b);a.equal(c.hash(fs.readFileSync(D+'/'+file)),c.hash(b));}
console.log(JSON.stringify({installed:true,sha:mod.after_sha256,records:reg.entries.length,nativeCases:36,newSaveFields:0}));
