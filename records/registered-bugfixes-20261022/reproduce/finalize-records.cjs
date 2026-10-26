'use strict';
const fs=require('node:fs'),path=require('node:path');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const tmp='G:/Codex/tmp/jo9-bugfixes-20261022',repo='G:/somi/JO9sa',dest=repo+'/records/registered-bugfixes-20261022';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const install=json(tmp+'/installed.json'),manifest=json(tmp+'/manifest.json'),gate=json(tmp+'/release-validation.json');
if(gate.verdict!=='PASS'||install.after!==manifest.candidate.sha256||!install.fullUnchanged||!install.saveHashesUnchanged)throw Error('Final verification required');
fs.mkdirSync(dest,{recursive:true});
function copy(from,to){fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);if(c.hash(fs.readFileSync(from))!==c.hash(fs.readFileSync(to)))throw Error('Copy mismatch '+to);}
for(const [source,folder]of [['fog','fog'],['egeya-revised','egeya'],['milk','milk']]){
 const src=tmp+'/'+source;for(const name of fs.readdirSync(src)){const p=src+'/'+name;if(!fs.statSync(p).isFile())continue;
  if(/\.(?:cjs|json|md|qsps|diff)$/i.test(name)||['before.png','after.png','installed.png'].includes(name))copy(p,dest+'/'+folder+'/'+name);
 }
}
for(const name of ['results-baseline.json','results-final.json'])copy(tmp+'/root/'+name,dest+'/selection-grinch-'+name);
copy(tmp+'/review.md',dest+'/INDEPENDENT_REVIEW.md');copy(tmp+'/installed.json',dest+'/installed.json');copy(tmp+'/release-validation.json',dest+'/release-validation.json');
for(const name of ['root-patches.cjs','root-tests.cjs','integrate.cjs','apply-work.ps1'])copy(path.join(__dirname,name),dest+'/reproduce/'+name);
const m=json(tmp+'/mods/2026-10-22_registered_bugfixes.json');
const backup='G:/somi/JO9_work_backups/registered_bugfixes_20261022/before.qsp';
const manual=`# WORK 등록 버그·미번역 선택지 수정 — 2026-10-22

사용자 승인 범위의 다섯 항목을 WORK에 반영했다. 커밋·푸시·Full 동기화·ZIP 갱신은 하지 않았다.

## 변경 내용

- 안개 전투: 출전한 노예/조수에게 최소 행동력1을 정산한다. 원래 더 크게 소모하던 피로는 유지한다. 비출전 주인공, 전투 전 취소, 이미 정산한 교대에는 추가 차감하지 않는다.
- 그린치: 안개 순찰 메뉴14 대신 원래 있던 전용10384 메뉴와 대사를 연결한다. 예전 세이브의 전투 직전14페이지도 같은 장소/이벤트/무기선택 전 조건에서만 정상화한다. 원래 전투 시작·승리10385 복귀·보상 조건은 유지한다.
- 에게야 외형: 원작2577~2601과 구 도나 리소스가 충돌했을 때 남은 것으로 확인된96개 역할 경로만 해석한다. 원래 역할CG가 없으면 현재 기본 그림을 사용한다. 정상 도나8877~8901, 다른 사용자 경로, 실제 인물/능력치/관계/장비는 바꾸지 않는다.
- 미번역: 영어 선택지/링크8표시지점, 툴팁4지점, 이름 입력 안내1개를 한국어로 정리했다. 러시아어 흡혈 링크1문구의4분기와 Tip 혼용8지점도 정리했다. 일부 같은 줄의 캡션/툴팁을 따로 센 수치이며, 내부키·확률·조건·콜백은 유지했다. 비활성 여주인·주석·고유명사는 번역 누락으로 집계하지 않았다.
- 우유 협동조합: 가격판과 숫자를 함께 오른쪽392px 이동했다. 메뉴/판매 조건과 버튼 좌표, 그림 파일, 우유통 위치는 유지한다.

펠리시티의 훈계 실패 시 콧대+10은 기존 역효과 분기여서 수정 대상에서 제외했다.

## 파일과 재현

- 실행 파일: WORK/game/jack.qsp, WORK/game/css/base.css.
- 관리 기록: mods/2026-10-22_registered_bugfixes.json, assets/css-2.4/base.css 및 manifest.json.
- QSP 적용 전: ${manifest.before.sha256}
- QSP 적용 후: ${manifest.candidate.sha256}
- CSS 적용 후: ${manifest.css.files[0].sha256After}
- 최소 복구 사본: ${backup}. 배포 ZIP과 별개인 개발 복구 자료다.
- 이 패치의 QSP 편집 ${m.edits.length}개와 추가 로케이션1개를 tools/apply_mods.ps1로 적용했다. 정확 재생/재적용 검사가 통과한 기록이다. 현재 이후 수동 편집에 전체 과거 mods를 무조건 재적용하지 않는다.

## 호출·입출력·부작용

| 식별자/진입점 | 입력·결과 | 의존성/분리 시 영향 |
|---|---|---|
| FOG_ENERGY_MIN_COST_SLAVE / ASSISTANT | jo9_fog_relay 정산의 전투 종료 지구력·기존 행동력 → 원래 피로값과 기존 행동력-1 중 작은 값 | 기존 active/settled 1회 정산 가드를 사용한다. 이 두 식만 제거하면 무소모 승리가 다시 가능하다. 새 상태 키는 없다. |
| GRINCH_DEDICATED_MENU / INTRO_INDEX | interaction_city10384 → skip_to10384, 전용 대사 | #options의 기존 $edge_of_mists[10384]에 의존한다. 한쪽만 복구하면 대사/버튼 페이지가 어긋난다. 안개 장소 가드는 유지한다. |
| GRINCH_SAVED_MENU / LOAD | 구 shop_general 그린치 전투 직전14페이지 → 같은 이벤트10384 페이지 재표시 | 무기선택 중에는 제외한다. 제거하면 기존에 그 페이지로 저장한 상태만 예전 메뉴를 재사용할 수 있다. 새 세이브 형식은 만들지 않는다. |
| EGEYA_STALE_ROLE_IMAGES_20261022 | 훅 모드: 확인된 전역 역할 경로96개만 비움. resolve 모드: 원작ID·캐시 경로·선택적 역할키 → 해당하는 현재 등록 역할 또는 기본 경로, 나머지는 원문 반환 | $ongload/$newloc와 전체 시각적 소비처가 같은 helper를 쓴다. resolve는 인스턴스/전역값을 쓰지 않는다. 로드→JSON 등록 순서 사이에도 캐시의 판별 문자열을 유지해 새 사용자 이미지가 뒤늦게 등록되어도 다음 읽기에서 반영된다. helper만 제거하면 호출 오류, 소비처만 제거하면 해당 화면에 옛 외형이 재등장한다. 새 영구 플래그/인스턴스 필드는 없다. |
| CHOICE_KO_* | 기존 선택지·툴팁·입력 안내 → 같은 실행 코드의 한국어 표시 | quest 문자열의 줄 연결을 보존했다. 번역만 되돌리면 원래 언어가 다시 보이며 기능 수치는 바뀌지 않는다. |
| MILK_COOPERATIVE_SIGN_OVERLAP_20261022 | shop_general이 출력한 가격판/숫자 ID → CSS 좌표 변경 | 두 left 값을 함께 유지한다. 한쪽만 되돌리면 숫자/판이 분리된다. 두 값 모두 복구하면 메뉴 겹침이 재발한다. |

에게야 helper의 정확한 호출/소비처 전후식은 egeya/consumer-inventory.json 및 egeya/MANUAL_KO.md, 상세 검사는 각 하위 폴더를 참고한다. 원작25명의 현재 JSON과 구 도나 고번호 JSON을 대조한 경로만 사용하며, 다른 이름으로 수동 지정한 그림은 교체하지 않는다. 동일한 구충돌 경로를 의도적으로 다시 지정한 경우는 원래 잘못된 캐시와 구분할 수 없으므로 같은 정규화 대상이다.

## 검사 결과와 한계

- QSP 바이트 왕복/중복 로케이션/CRLF/주석 경계, 정확 패치 재생/멱등성, 인물 JSON 등록 검사: PASS.
- 공식 설치 FastQSP 엔진9경로: PASS. 고정된 현재2.4 세이브 사본으로 검사했고 입력 해시 보존도 확인했다.
- 안개: 실제 엔진18시나리오, 지구력·행동력200조합과 반복 정산 포함 PASS.
- 선택지/그린치: 실제 엔진10검사 PASS. 원래 오류9개 실패를 확인한 뒤 교정했으며 원래 승리 복귀는 전후 모두 통과했다.
- 에게야: 최종 통합 후보13검사 PASS. 구 후보의 JSON 등록 순서 결함2개를 실패 재현한 뒤 비파괴 해석으로 교정했다. 전체96경로/32슬롯 원문 보존/정상 고번호/직접 소비처 식을 확인했다.
- 우유 CSS: 소지품·자격증·재고20개 조합의 Headless Edge 배치 PASS. 실제 게임 화면을 클릭한 결과와 구분한다.
- 적용 직전/직후 세이브 ${install.saveFiles}개 해시 동일, Full QSP/CSS 동일, 설치된 WORK와 검증 후보의 바이트 동일.

초기 검사 중 실제 자동저장2개가 외부에서 갱신되어 입력보존 검사가 실패한 이력과, 오래된1.sav의 버전변환 안내로 중단된 이력은 폐기한 검사의 사유로 기록했다. 실제 세이브를 되돌리거나 덮어쓰지 않았으며 최종 검사는 고정 사본으로 PASS했다. 문법 전체를 정적으로 증명하는 정식 컴파일러는 아니고, 실제 세이브 불러오기 UI/모든 게임 분기/전투 밸런스/전체 퀘스트 완료를 전수 플레이한 결과도 아니다. 실행 중인 게임에는 디스크 수정이 즉시 적용되지 않으므로 게임 종료 후 WORK로 다시 실행한다.
`;
fs.writeFileSync(dest+'/MANUAL_KO.md',manual);
const specs=[
 ['FOG_ASSISTANT_ZERO_ENERGY_20261022','안개전투 동료 행동력 미소모','출전한 노예/조수의 최소 행동력1을 정산하고 기존 피로·1회 정산·비출전 주인공 처리를 보존했다. 실제 엔진18시나리오와200경계 조합을 확인했다.'],
 ['GRINCH_FOG_MENU_COLLISION_20261022','그린치 전투 메뉴 충돌','메뉴/대사 인덱스를 기존 전용10384로 분리하고 구 세이브의 전투 직전14페이지를 한정 복구했다. 원래 전투 진입·승리10385 복귀를 검사했다.'],
 ['EGEYA_STALE_ROLE_IMAGES_20261022','에게야 역할 외형 잔류','확인된 구충돌96경로를 표시 시 현재 이미지로 해석한다. 저장된 인스턴스 외형을 덮어쓰지 않아 로드 후 새 JSON 사용자 그림도 보존한다. 정상 고번호·능력치·관계·장비 보존과 최종13개 실제 엔진 검사를 통과했다.'],
 ['SELECTION_TRANSLATION_GAPS_20261022','조건부 선택지 번역 누락','영어 선택지8표시지점/툴팁4지점/입력안내1개, 러시아어1문구4분기와 Tip8지점을 한국어로 정리했다. 내부키·조건·확률·콜백을 보존했다.'],
 ['MILK_COOPERATIVE_SIGN_OVERLAP_20261022','우유 협동조합 가격판 겹침','가격판/숫자 CSS만 함께 이동하고 메뉴·판매 로직은 유지했다. 소지품·자격증·재고20조합 배치 검사를 통과했다.']
];
function replaceSection(text,id,newText){const re=new RegExp('^## [^\\r\\n]*\\('+id+'\\)[^\\r\\n]*(?:\\r?\\n|$)','m');const match=re.exec(text);if(!match)throw Error('Missing section '+id);const tail=text.slice(match.index+match[0].length),next=tail.search(/^## /m);const end=next<0?text.length:match.index+match[0].length+next;return text.slice(0,match.index)+newText+'\r\n\r\n'+text.slice(end);}
for(const file of ['PENDING_ISSUES_20261015.md','SECOND_PATCH_WORK_BUNDLE_20261021.md']){
 let text=fs.readFileSync(repo+'/docs/'+file,'utf8');for(const[id,title,summary]of specs){const block=`## WORK 수정 완료 — ${title} (${id})\r\n\r\n- 2026-10-22 사용자 승인 후 WORK 반영 완료·미배포. ${summary}\r\n- 구조/줄·주석 경계/패치 재생·멱등성/최종 실제 엔진9경로 PASS. GUI 세이브 불러오기와 전수 플레이 검증은 별도다.\r\n- Full·배포 ZIP·커밋·푸시는 변경하지 않았다. 다음 패치 작업묶음의 적용 완료·미배포 항목이다.\r\n- [수정 및 검증 기록](../records/registered-bugfixes-20261022/MANUAL_KO.md), [최종 출고 검사](../records/registered-bugfixes-20261022/release-validation.json).`;text=replaceSection(text,id,block);}fs.writeFileSync(repo+'/docs/'+file,text);
}
const plan=repo+'/docs/superpowers/plans/2026-10-22-registered-bugfixes.md';fs.appendFileSync(plan,'\n\n## Completion\nAll five authorized issues applied to WORK after exact replay, native regression and final official PASS. See records/registered-bugfixes-20261022/MANUAL_KO.md. No commit/push/Full sync/packaging.\n');
fs.writeFileSync(dest+'/FINAL_RESULT.json',JSON.stringify({status:'WORK_APPLIED',qsp:manifest.candidate,css:manifest.css.files.map(x=>({file:x.file,sha256:x.sha256After})),releaseGate:'PASS',fogNative:18,selectionGrinchNative:10,egeyaNative:13,milkGeometryStates:20,saveFilesPreserved:install.saveFiles,fullUnchanged:true,commitPush:false,packaged:false,backup},null,2));
console.log(JSON.stringify({dest,after:manifest.candidate.sha256,gate:gate.verdict}));
