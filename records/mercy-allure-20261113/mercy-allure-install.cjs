'use strict';
const fs=require('fs'),a=require('assert/strict'),z=require('zlib'),R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',D=R+'/records/mercy-allure-20261113',T='G:/Codex/tmp/mercy-allure-20261113',P=R+'/records/release-prep-20261113',Q=R+'/records/release-q04-work-source-20261113',c=require(R+'/tools/text-workshop/core.cjs'),rd=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),wr=(p,j)=>fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');
const mod=rd(D+'/change.json'),raw=fs.readFileSync(T+'/patched.qsp'),baseline=z.gunzipSync(fs.readFileSync(D+'/jack.before.qsp.gz'));a.equal(c.hash(raw),mod.after_sha256);a.equal(c.hash(baseline),mod.before_sha256);a.equal(Buffer.compare(raw,fs.readFileSync(T+'/replay.qsp')),0);a(rd(D+'/green-results.json').every(x=>x.pass));a.equal(rd(D+'/green-fixture.json').casesCount,59);a.equal(rd(D+'/green-fixture.json').sourceQspSha256,mod.after_sha256);
const b=c.parse(baseline),n=c.parse(raw),changed=b.locations.filter(l=>b.lines[l.body]!==n.lines[n.locations.find(x=>x.name===l.name).body]).map(x=>x.name).sort();a.deepEqual(changed,['#help_msg','$calculate_attributes','$ongload','jo9_cruel_mercy_apply'].sort());a.equal(n.locations.length,311);a.equal(Buffer.compare(raw,c.serialize(n)),0);
for(const p of [W+'/jack.qsp',R+'/assets/runtime/2.4.1/jack.qsp'])a.equal(c.hash(fs.readFileSync(p)),mod.before_sha256,p);for(const p of [W+'/jack.qsp',R+'/assets/runtime/2.4.1/jack.qsp'])fs.writeFileSync(p,raw);wr(R+'/mods/'+mod.id+'.json',mod);
for(const p of [R+'/assets/runtime-source-2.4.1.json',R+'/assets/runtime-manifests/2.4.2-work.json']){const j=rd(p);a.equal(j.sourceQspSha256,mod.before_sha256);j.sourceQspSha256=mod.after_sha256;for(const row of j.files||[])if(row.path==='game/jack.qsp'||row.runtimePath==='jack.qsp'){row.sha256=mod.after_sha256;row.bytes=raw.length;}j.mercyAllureFollowup={date:'2026-11-13',record:'records/mercy-allure-20261113/REPORT_KO.md',before:mod.before_sha256,after:mod.after_sha256,locations:311,newSaveFields:0};wr(p,j);}
const verification={date:'2026-11-13',before:mod.before_sha256,after:mod.after_sha256,locations:311,changedLocations:changed,addedLocations:['jo9_mercy_allure'],thresholds:[5,15,25,40,60],currentScoreFormula:'whole*2+half compared to10/30/50/80/120',bothDirections:true,nativeCases:59,nativePass:true,exactReplay:true,idempotent:true,roundTrip:true,newSavedFields:0,allRuntimeCMWritesUseHelper:true,independentReview:'Static scoped review found no important defects.',limits:['Actual calculation segment, CM adjustment location and load prefix on synthetic states; not whole-game UI playback.','No personal save was read or loaded.'],FullChanged:false,committed:false,pushed:false};wr(D+'/verification.json',verification);
fs.writeFileSync(D+'/REPORT_KO.md',`# 현재 Mercy에 따른 주인공 매력 등급

2026-11-13 / WORK ${mod.after_sha256}. 사용자가 확정한 표를 주인공 최종 매력에 적용했습니다.

| 현재 Mercy | 최종 매력 |
|---|---|
| 5 미만 |0 역겨움|
| 5 이상15 미만 |1 불쾌함|
| 15 이상25 미만 |2 평범함|
| 25 이상40 미만 |3 인상적|
| 40 이상60 미만 |4 매력적|
| 60 이상 |5 치명적|

## 동작·저장

과거의 총 획득량이나 최고 달성 등급이 아니라 현재 jo9_cruel_mercy 및 jo9_cruel_mercy_half 값을 읽습니다. 내부 비교는 기존 반점 표현인 whole*2+half를 사용하므로60→59.5는5→4,40→39.5는4→3으로 즉시 내려갑니다. 새 저장값·성장 경험치·이관 플래그를 만들지 않았습니다. 기존 CM 행동 점수와 반점 정산은 보존합니다.

사용자의 “그 표대로, 내려가면 등급도 하락”을 충족하기 위해 옛 의상·청결·행동력·단장·힘·기분 합산식을 최종 매력 계산에서 대체했습니다. 이를 그대로 더하면 관리 상태에 따라 표와 다른 등급으로 남을 수 있습니다. 해당 관리·의상 기능 자체나 다른 용도의 효과를 제거한 것은 아닙니다. 예전 세이브도 현재 CM값으로 다시 계산되므로CM0은 역겨움으로 표시됩니다.

## 함수·호출·의존성

새 jo9_mercy_allure는 인자 없이 현재 CM을 읽고 숫자0~5를 반환하는 순수 helper입니다. 문자열 인자 help에는 현재 매력 도움말을 반환합니다. 기존 매력 도움말 변수만 교체하며 신규 저장값은 없습니다.

$calculate_attributes가 정상 갱신 때 helper로 매력을 계산합니다. jo9_cruel_mercy_apply는 기존 점수 정산 뒤 매력을 즉시 갱신합니다. 현재 WORK의 실플레이 CM 변경은 이 helper를 통하고, init_game만 초기값0을 지정합니다. $ongload 앞부분은 저장된 옛 매력 등급과 옛 안내를 현재 기준으로 갱신하고 그 뒤 기존 화면 재표시가 진행됩니다. #help_msg의 신규 도움말도 같은 문자열 helper를 사용합니다. 통솔력 및 음수 CM의 장악력 보정식은 수정하지 않았습니다. 장악력 계산에서 기존대로 매력값을 읽으므로 매력 변화가 반영됩니다.

이 helper만 삭제하면 남은 호출이 실패합니다. 제거할 때에는 mods/${mod.id}.json의 추가location과4곳의 호출·도움말 편집을 함께 역적용해야 합니다. 기존 CM값을 초기화하지 않습니다.

## 검증·한계

실제 FastQSP59합성사례: 모든 등급 경계±0.5, 양/음수, 큰값, 반점의 다른 부호 표현, 의상·컨디션 최상/최하에서 같은 등급, CM 변경 직후 상승·하락, 기존 CM 산술 보존, 반점 필드 없는 옛 상태, 반복 새로고침으로 성장하지 않음, 저장된 옛 등급·도움말 갱신. 원본 RED 실패와 후보 GREEN을 보존했습니다.

선언형 패치 정확재생·재적용 멱등성·311location 바이트왕복 및 변경 범위를 확인했고 독립 정적 검토에 중요 지적은 없었습니다. 개인 SAV 및 실제 화면을 열어 검증한 것은 아닙니다. 실제 엔진 검사는 현재 계산 구간·CM 정산 location·불러오기 앞부분을 합성 상태로 실행한 범위입니다. 전체 배포 출고 검사는 별도입니다.

WORK·추적 QSP·배포 입력에 반영했습니다. 게임을 재실행해 기존 저장을 불러오면 현재 CM으로 갱신됩니다. 현재 CM이 기준을 넘거나 아래로 내려가는 행동 뒤 주인공 매력 등급을 확인할 수 있습니다. 복구 원본은 jack.before.qsp.gz, 정확 패치는 mods/${mod.id}.json입니다. Full·개인 SAV·음원·ZIP·커밋·푸시는 변경하지 않았습니다.
`);
wr(D+'/review.json',{reviewer:'/root/review_mercy_allure',candidate:mod.after_sha256,mode:'Static read-only scoped review',remainingImportantFindings:[],limits:'Reviewer did not rerun native tests or open saves/UI.'});
const p=Q+'/complete-change-register.json',reg=rd(p);a(!reg.entries.some(x=>x.id==='A-MERCY-ALLURE'));reg.sourceQspSha256=mod.after_sha256;reg.entries.push({id:'A-MERCY-ALLURE',layer:'Q04 이후 확정 수정',date:'2026-11-13',domain:'게임 밸런스',title:'현재 Mercy 5/15/25/40/60에 따른 주인공 매력 등급 상승·하락',before:'의상·청결·컨디션 등의 합산으로 최종 매력을0~5로 계산했다.',after:'현재 CM반점 포함값으로 확정 표를 적용. CM 정산 직후·상태 갱신·세이브 불러오기에 같은 판정. 새 저장값0개, 이전 CM점수는 유지.',status:'WORK·추적 QSP 반영 / 실제엔진59합성사례·정확재생·독립검토',verificationLimit:verification.limits.join(' '),evidencePaths:[D+'/REPORT_KO.md',D+'/verification.json',R+'/mods/'+mod.id+'.json']});reg.counts.approvedAfterQ04=(reg.counts.approvedAfterQ04||0)+1;reg.counts.rows=reg.entries.length;wr(p,reg);
for(const f of ['release-data.json','checklist.json']){const p=P+'/'+f,j=rd(p);j.sourceQspSha256=mod.after_sha256;j.mercyAllureFollowup='records/mercy-allure-20261113/REPORT_KO.md';if(j.playerReleaseNotes){j.playerReleaseNotes.sourceQspSha256=mod.after_sha256;j.playerReleaseNotes.publicItems=37;}if(j.items){const row=j.items.find(x=>x.id==='R23');row.action=row.action.replace('게임36항목','게임37항목');}wr(p,j);}
for(const f of ['mercy-allure-native.cjs','mercy-allure-patch.cjs','mercy-allure-install.cjs']){const bytes=fs.readFileSync(f);fs.writeFileSync(D+'/'+f,bytes);a.equal(c.hash(bytes),c.hash(fs.readFileSync(D+'/'+f)));}console.log(JSON.stringify({installed:true,sha:mod.after_sha256,records:reg.entries.length,nativeCases:59,newSavedFields:0}));
