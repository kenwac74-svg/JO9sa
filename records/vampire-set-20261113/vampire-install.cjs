'use strict';
const fs=require('fs'),a=require('assert/strict'),z=require('zlib'),R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/vampire-set-20261113',D=R+'/records/vampire-set-20261113',P=R+'/records/release-prep-20261113',c=require(R+'/tools/text-workshop/core.cjs'),rd=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),wr=(p,j)=>fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');
const mod=rd(D+'/candidate-mod.json'),raw=fs.readFileSync(T+'/candidate.qsp'),baseline=z.gunzipSync(fs.readFileSync(D+'/jack.before.qsp.gz'));a.equal(c.hash(raw),mod.after_sha256);a.equal(c.hash(baseline),mod.before_sha256);a.equal(Buffer.compare(raw,fs.readFileSync(T+'/replay.qsp')),0);a(rd(D+'/green-results.json').every(x=>x.pass));a(rd(D+'/link-results.json').every(x=>x.pass));a.equal(rd(D+'/green-fixture.json').assertions,47);a.equal(rd(D+'/green-fixture.json').inputSha256,mod.after_sha256);
const b=c.parse(baseline),n=c.parse(raw),changed=b.locations.filter(l=>b.lines[l.body]!==n.lines[n.locations.find(x=>x.name===l.name).body]).map(x=>x.name).sort();a.deepEqual(changed,['jo9_traits','#static_base','$stock_traits','jo9_farid_consignment','$newloc','jo9_chaotic','$ongload'].sort());a.equal(n.locations.length,311);a.equal(Buffer.compare(raw,c.serialize(n)),0);
for(const p of [W+'/jack.qsp',R+'/assets/runtime/2.4.1/jack.qsp'])a.equal(c.hash(fs.readFileSync(p)),mod.before_sha256,p);
for(const p of [W+'/jack.qsp',R+'/assets/runtime/2.4.1/jack.qsp'])fs.writeFileSync(p,raw);wr(R+'/mods/'+mod.id+'.json',mod);
for(const p of [R+'/assets/runtime-source-2.4.1.json',R+'/assets/runtime-manifests/2.4.2-work.json']){const j=rd(p);a.equal(j.sourceQspSha256,mod.before_sha256);j.sourceQspSha256=mod.after_sha256;for(const row of j.files||[])if(row.path==='game/jack.qsp'||row.runtimePath==='jack.qsp'){row.sha256=mod.after_sha256;row.bytes=raw.length;}j.vampireSetFollowup={date:'2026-11-13',record:'records/vampire-set-20261113/REPORT_KO.md',before:mod.before_sha256,after:mod.after_sha256,newSaveFields:0};wr(p,j);}
const verification={date:'2026-11-13',before:mod.before_sha256,after:mod.after_sha256,locations:311,changedLocations:changed,newLocations:0,newSaveFields:0,nativeAssertions:47,nativeAssertionsPass:true,nativeActualLinkCases:8,nativeActualLinkPass:true,roundTrip:true,lineEndings:true,markerBoundaries:true,exactReplay:true,idempotent:true,independentReview:'No blockers; reviewed exact20edits across7bodies, callbacks, ordering, cache and Chaotic protection.',limits:['Synthetic engine states; no personal save was read or loaded.','Native engine messages and actual generated EXEC links verified; visual wrapping and physical mouse clicks in user window remain user visual QA.'],FullChanged:false,committed:false,pushed:false};wr(D+'/verification.json',verification);wr(D+'/review.json',{reviewer:'review_vampire_set',candidate:mod.after_sha256,result:'No blocker',scope:changed,limits:'Static bounded review and exact replay; no independent visual/personal-save QA.'});
fs.writeFileSync(D+'/REPORT_KO.md',`# 뱀파이어 종족 세트 — 구현·검사 기록

2026-11-13 / WORK ${mod.after_sha256}

사용자 확정: 기존 jo9_vampire 표식을 여섯 기존 특성의 묶음으로 사용합니다. 신규 특성 수식·종족 저장키는 만들지 않았습니다.

| 포함 특성 | 기존 키·확정값 |
|---|---|
|혈액기호증|blood_attitude=2|
|암흑기호증|darkness_attitude=2|
|까다로운 입맛|passion_sweets=-1|
|건강체질|jo9_constitution=1|
|고도 대사량|metabolism=5|
|타고난 마법사|enchanter_affinity=1|

## 표시·이동

노예의 특성 제목 바로 아래 첫 행은 [뱀파이어]입니다. 천재·역전의 용사보다 먼저 표시하며, 여섯 구성 특성은 일반 목록에서 중복 출력하지 않습니다. 노예·조수·재고·위탁 정보·냉동 보관 목록에 같은 순서를 사용합니다. 빈 냉동 슬롯은 여전히 빈 목록입니다.

클릭하면 기존 msg 하단창에 “뱀파이어는 다음과 같은 특성을 모두 가집니다.”와 여섯 대괄호 링크가 한 문단으로 나옵니다. 혈액·암흑·입맛은 기존 등급2색, 대사량·마법사는 기존 등급5색, 건강체질은 원래 특성 링크 색을 유지합니다. 각 링크는 같은 msg 경로로 해당 기존 설명을 표시합니다. 설명 여섯 개를 한꺼번에 늘어놓지 않습니다.

## 입력·반환·부수효과

jo9_traits vampire_apply(role): 기존 종족값1인 역할 배열에만 위 여섯 값을 고정하고 기존 발견값을2로 둡니다. 기존 까다로운 입맛 효과와 같이 pos_dessert를0으로 정리합니다. 새 생성은 generate_stock의 기존 시루 표식 설정 이후 정상 속성계산의 repair 호출로 적용됩니다. 이미 영입한 인물도 불러오기 및 일반 갱신 시 보정합니다. 육성 기술·경험치·이름·이벤트·역전의 용사 등 다른 값은 그대로 둡니다. JSON은 변경하지 않았습니다.

race_list(role): 묶음을 보정하고 종족 링크 문자열을 반환합니다. list 및 repair에서도 구성값을 유지합니다. vampire_text는 여섯 링크를 반환합니다. vampire_component_text(key)는 blood/darkness/picky/healthy/metabolism/mage에 원래 설명을 반환하며, vampire_component(key)는 그 설명을 msg로 표시합니다. text/describe vampire도 같은 짧은 메뉴를 사용합니다.

vampire_cache는 저장된 표시 함수에 VAMPIRE_SET_20261113 표식이 없을 때만 #static_base를 다시 정의하고 냉동 표시 캐시를 무효화합니다. 별도 이관 완료 저장키는 없습니다. vampire_load는 기존 all_slave_characters와 재고·위탁 보관 역할의 종족 보유분만 보정합니다. $ongload는 cache와load를, $newloc는cache를 호출합니다.

카오틱 에센스가 종족에 포함된 까다로운 입맛만 제거했다가 다음 갱신에서 복구하는 빈 소비를 하지 않도록 해당 묶음 구성값을 후보에서 제외했습니다. 일반 인물의 제거 규칙과 기존 비용·도미니 부작용·아편 중독 경로는 보존합니다.

## 의존성·분리 시 영향

실제 효과는 원래 여섯 필드를 읽는 속성·성장·전투·선호 로직에 의존합니다. 건강체질과 역전의 용사의 기존 전투 보정은 각각 한 번만 적용됩니다. 링크 색은 #static_base의 vb_cycle_skill, 설명은 기존 static_txt 변수와 jo9_traits healthy 설명을 사용합니다.

안정 참조는 mods/2026-11-13_vampire_set.json의20개 편집과 VAMPIRE_SET_20261113 계열 블록입니다. helper만 제거하면 남은 링크·repair·캐시 호출이 설명과 보정을 잃습니다. 표시 숨김만 제거하면 구성 특성이 중복 출력됩니다. 해제할 때는 같은 패치 전체를 대조하고 이미 저장된 여섯 값의 처리도 별도로 결정해야 합니다.

## 검증·한계

기존본은 실제 엔진에서 FAIL_VAMP_blood_attitude로 누락을 재현했습니다. 후보는47개 상태·표시·기존효과 검사 및 실제 생성된 EXEC 링크8사례를 통과했습니다. 여섯 설명은 원문 변수/원래 healthy 설명을 그대로 읽습니다. 엔진 로그의CP949를 정확히 디코딩해 한글 하단 메시지와6개 링크를 확인했습니다. 줄경계·주석경계·311위치 왕복·정확재생·재적용 무변경·독립 검토를 확인했습니다.

개인 세이브를 읽거나 변경하지 않았으며 실제 게임 창의 줄바꿈·물리 클릭·저장 재개 플레이는 미확인입니다. WORK와 추적 QSP만 반영했습니다. Full·배포ZIP·사운드·커밋·푸시는 변경하지 않았습니다.

게임 확인: WORK를 다시 실행하고 시루의 특성 화면에서 ①최상단 [뱀파이어] ②하단 여섯 링크 ③각 링크의 원래 설명을 확인하면 됩니다.
`);
const register=R+'/records/release-q04-work-source-20261113/complete-change-register.json',reg=rd(register);a.equal(reg.sourceQspSha256,mod.before_sha256);a(!reg.entries.some(x=>x.id==='A-VAMPIRE-SET'));reg.sourceQspSha256=mod.after_sha256;reg.entries.push({id:'A-VAMPIRE-SET',layer:'Q04 이후 확정 수정',date:'2026-11-13',domain:'게임시스템',title:'뱀파이어 여섯 기존 특성 묶음·하단 링크 설명',before:'뱀파이어가 일반 문구로만 표시되고 묶음 효과·상세 안내가 없었다.',after:'종족 보유자에게 기존6특성을 적용하고 중복행을 숨겨 최상단 [뱀파이어]로 표시. 하단의6개 원래색 링크에서 개별 원문 설명을 확인한다.',status:'WORK·추적 QSP 반영 / 실제 엔진47검사·8링크·정확재생·독립검토',verificationLimit:verification.limits.join(' '),evidencePaths:[D+'/REPORT_KO.md',D+'/verification.json',R+'/mods/'+mod.id+'.json']});reg.counts.rows=reg.entries.length;reg.counts.approvedAfterQ04++;wr(register,reg);
for(const f of ['release-data.json','checklist.json']){const p=P+'/'+f,j=rd(p);a.equal(j.sourceQspSha256,mod.before_sha256);j.sourceQspSha256=mod.after_sha256;j.vampireSetFollowup='records/vampire-set-20261113/REPORT_KO.md';if(j.playerReleaseNotes){j.playerReleaseNotes.sourceQspSha256=mod.after_sha256;j.playerReleaseNotes.publicItems=39;}if(j.items){const row=j.items.find(x=>x.id==='R23');row.action=row.action.replace('게임38항목','게임39항목');}wr(p,j);}
const gen=R+'/records/release-notes-player-20261113/release-categories.cjs',genText=fs.readFileSync(gen,'utf8'),anchor="add('systems','yagisuna-random','야기슈나를 일반 무작위 등장 대상에서 제외했습니다.',[],['A-YAGISUNA-RANDOM']);";a.equal(genText.split(anchor).length,2);fs.writeFileSync(gen,genText.replace(anchor,anchor+"\nadd('systems','vampire-set','뱀파이어를 여섯 기존 특성을 포함한 종족 세트로 정리했습니다. 목록 맨 위의 [뱀파이어]를 누르면 세부 특성과 설명을 확인할 수 있습니다.',[],['A-VAMPIRE-SET']);"));
const banner='> 최신 확정 후속: 뱀파이어6특성 묶음·최상단 대괄호 표기·하단 개별설명 링크 반영. WORK '+mod.after_sha256+' / 원장704행 / 공개39항목·초상52카드. [구현·검사 기록](G:/somi/JO9sa/records/vampire-set-20261113/REPORT_KO.md). 아래 이전 해시·행수는 당시 기록이다.\n\n';for(const f of ['FULL_CHANGE_REGISTER_KO.md','RELEASE_NOTES_CHECKLIST_KO.md']){const p=R+'/docs/release-prep/2026-11-13/'+f;fs.writeFileSync(p,banner+fs.readFileSync(p,'utf8'));}
const index=R+'/docs/SESSION_HANDOFF_INDEX.md';fs.writeFileSync(index,'## 2026-11-13 뱀파이어 종족 세트\n\n[구현·검사 기록](../records/vampire-set-20261113/REPORT_KO.md) — 기존6특성 효과, 중복행 숨김, 최상단 [뱀파이어], 하단6색상 링크와 원문 설명. 엔진47검사·8링크 통과. WORK '+mod.after_sha256+'. 개인SAV·Full·사운드·커밋·푸시 변경 없음.\n\n'+fs.readFileSync(index,'utf8'));
for(const f of ['vampire-native.cjs','vampire-patch.cjs','vampire-links.cjs','vampire-panes.ps1','vampire-install.cjs'])fs.copyFileSync(f,D+'/'+f);console.log(JSON.stringify({installed:true,sha:mod.after_sha256,records:reg.entries.length,nativeAssertions:47,actualLinks:8}));
