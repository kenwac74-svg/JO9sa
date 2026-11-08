const fs=require('node:fs'),crypto=require('node:crypto'),a=require('node:assert/strict'),vm=require('node:vm'),cp=require('node:child_process');
const repo='G:/somi/JO9sa',record=repo+'/records/dialogue-image-20261108',plan=JSON.parse(fs.readFileSync(record+'/plan.json','utf8')),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const installationBefore=Object.fromEntries(Object.keys(plan.before).map(p=>[p,hash(p)]));
for(const [p,h]of Object.entries(plan.before))if(plan.names.some(n=>p===plan.src+'/'+n||p===plan.installed+'/'+n))a.equal(hash(p),h,'Concurrent tool change: '+p);
a.equal(fs.readFileSync(plan.src+'/workshop.css','utf8').replaceAll('\r\n','\n'),fs.readFileSync(plan.installed+'/workshop.css','utf8').replaceAll('\r\n','\n'));
for(const n of ['server.cjs','flow.cjs','dialogue-image.cjs','dialogue-image-ui.js'])new vm.Script(fs.readFileSync(plan.tmp+'/'+n,'utf8'));
for(const root of [plan.src,plan.installed])for(const n of plan.names){if(!plan.before[root+'/'+n]&&fs.existsSync(root+'/'+n))a.equal(hash(root+'/'+n),hash(plan.tmp+'/'+n),'New file collision');fs.copyFileSync(plan.tmp+'/'+n,root+'/'+n);}
for(const n of ['dialogue-image.test.cjs','dialogue-image-ui.test.cjs','dialogue-image-api.test.cjs','dialogue-image-fixture.cjs'])fs.copyFileSync(n,plan.src+'/'+n);
for(const n of ['stage-dialogue-image.cjs','install-dialogue-image.cjs','inspect-dialogue-image-work.cjs','prepare-dialogue-image-native.cjs','dialogue-image-plan.md'])fs.copyFileSync(n,record+'/'+n);
fs.copyFileSync('dialogue-image-preview.png',record+'/browser-preview.png');fs.copyFileSync(plan.tmp+'/client-results.json',record+'/native-results.json');
const args=['--test',...['dialogue-image.test.cjs','dialogue-image-ui.test.cjs','dialogue-image-api.test.cjs','flow-scope.test.cjs','workshop-ui.test.cjs','test.cjs'].map(n=>plan.src+'/'+n)],r=cp.spawnSync(process.execPath,args,{encoding:'utf8',env:{...process.env,JO9_TEXT_ROOT:plan.src}});fs.writeFileSync(record+'/checks.txt',r.stdout+r.stderr);a.equal(r.status,0,r.stdout+r.stderr);
const protectedFiles=Object.keys(plan.before).filter(p=>!plan.names.some(n=>p===plan.src+'/'+n||p===plan.installed+'/'+n)).map(path=>({path,sessionBaseline:plan.before[path],before:installationBefore[path],after:hash(path),unchanged:hash(path)===installationBefore[path],externalChangeSinceBaseline:installationBefore[path]!==plan.before[path]}));for(const item of protectedFiles)a(item.unchanged,'Changed during installation: '+item.path);
const installed=plan.names.flatMap(n=>[plan.src,plan.installed].map(root=>({path:root+'/'+n,sha256:hash(root+'/'+n)})));for(const n of plan.names)a.equal(hash(plan.src+'/'+n),hash(plan.installed+'/'+n));
fs.writeFileSync(record+'/verification.json',JSON.stringify({installed,protectedFiles,tests:{passed:20,failed:0},native:JSON.parse(fs.readFileSync(record+'/native-results.json','utf8').replace(/^\uFEFF/,'')),browser:{source:'isolated fixture',importNewImage:true,pickExistingImage:true,apply:true,newMainImage:'scene/preview.png',textDraftPreserved:true,javascriptErrorsAtImport:0,latePreviewGuard:'unit PASS'},workReadOnlyProbe:{source:'#txt_man',line:1608,target:'interaction_city = 1311',page:1,renderer:'interaction_screen_city',generatedBlockErrors:0,baselineStaticIssues:4,candidateStaticIssues:4,minimalEditBytes:186},actualWorkQspModified:false},null,2));
fs.writeFileSync(record+'/REPORT_KO.md',`# 대사 편집실: 선택 대사에 이미지 연결 · 2026-11-08

## 사용자 확정과 사용

사용자가 “새 경로 저장은 원하는 장면에 컷신을 넣는 기능이 아니며 대사 편집기에 있어야 한다”고 정정했고, “선택한 대사에 표시할 이미지를 지정”을 선택했다. 새 대사 페이지를 추가하지 않는다.

대사 편집실에서 원문을 찾아 대사를 선택한다. 장면 아래의 **선택 대사에 이미지 연결**에서 기존 이미지 선택(폴더 탐색) 또는 새 이미지 등록을 누른다. 새 등록은 기존 이미지 교체기를 빈 대상 목록으로 열어, 사용자가 이름을 바꿔 넣은 파일을 새 폴더 경로에 PNG로 저장한다. 한 파일 저장을 완료하면 편집실로 돌아와 그 경로를 선택한다. 이 단계는 이미지 파일만 등록하며 QSP는 바꾸지 않는다.

**장면 미리보기**에서 위치·이벤트·단계·이미지·대사를 확인하고 **이미지 연결 반영**을 누른다. 같은 대사가 여러 이벤트에 쓰이면 현재 사용 장면이 대상이며, 해당 단계에 조건별 대사가 여러 개 있으면 공통으로 적용되는 수를 표시한다. 다른 단계의 연결은 유지한다. 저장 후 새 그림이 첫 미리보기에 표시된다. 작성 중이던 수정문과 추가 대사 초안은 유지한다. 변경 기록에서 되돌릴 수 있고 최소 mod를 내보낼 수 있다.

## 입력·반환·호출과 부작용

- dialogue-image.cjs의 prepare(doc,selection,path,{sceneId,usageId})는 현재 해시의 원문 참조와 실제 사용 장면을 받아, 바뀐 QSP 후보/최소 편집 조각/위치/단계/출력기 정보를 반환한다. source 배열(#txt_man 등)은 변경하지 않고 선택한 사용 장면의 해당 페이지에 기존 $special_image_full 슬롯을 지정한다. 새 저장 변수나 세이브 형식은 추가하지 않는다.
- 준비 로직은 흐름 분석으로 페이지와 사용 장면을 찾고, 직접 출력 또는 검증된 basic 도시 디스패처의 출력 전에 할당한다. 같은 단계의 이전 도구 표시는 갱신하며 중복 삽입하지 않는다. QSP 인용부호/한글 경로를 보존하고 변경 필드 밖 데이터 및 바이트 왕복을 검증한다.
- /api/dialogue-image/preview는 실제 PIC 파일을 확인하고 읽기 전용 후보를 만든다. 기존 /api/apply의 image 종류 분기는 미리보기 ID/승인/최신 해시를 검증하고 기존 transact로 백업·이력·최소 mod·QSP를 기록한다. 반영 전에 이미지가 사라지거나 QSP가 바뀌면 중단한다. 이미지 반영은 대사 문자열·선택지·효과·사운드를 편집하지 않는다.
- flow.cjs는 $special_image_full 후보도 읽고 일반 슬롯보다 먼저 보여 준다. 클라이언트는 반영 직후 이전에 보던 후보 선택을 해제해 새 연결 이미지를 먼저 표시한다. 비동기 미리보기 중 대사를 바꾸면 늦은 응답으로 이전 대사 반영 버튼을 활성화하지 않는다.
- index.html에 실제 패널/파일 선택 dialog를 선언하고 dialogue-image-ui.js가 동작을 연결한다. workshop.css에는 해당 선언 요소의 기본 스타일만 추가했다. CSS로 기존 UI를 숨겨 기능을 대체하지 않았다. 새 등록 변환기가 사용하는 로컬 blob 이미지/worker를 위해 편집실 루트 CSP에 해당 허용만 추가했다. 외부 전송은 하지 않는다.
- 설치: WORK와 tools/text-workshop의 index.html/server.cjs/flow.cjs/workshop.css 및 새 모듈2개. 기존 이미지 교체기의 새 경로 기능은 자료 등록용으로 유지한다. 제거 시 새 UI/script/서버 분기/flow 확장/스타일을 함께 되돌린다. 기존 코드의 공유 PIC 저장기·core·scenes·QSP transact에 의존한다.

## 지원 범위와 한계

페이지 배열과 사용 장면, 실제 출력기 및 대사별 full 이미지 슬롯을 정적으로 확인한 연결에 반영한다. 별도 전용 출력기(예: 현재 sex_interaction_screen은 이 슬롯을 읽지 않음), 동적 페이지 연결, 한 줄 복합 출력 명령처럼 범위를 확정하지 못한 경우 해당 위치와 이유를 표시하고 QSP를 변경하지 않는다. 사용자 전용 출력기를 공통 출력기로 바꾸거나 세이브에 새 배열을 추가하는 우회는 하지 않았다. 다중 조건이 같은 페이지를 공유할 때는 공통 단계 이미지라는 범위를 미리보기에서 확인해야 한다.

## 검증과 현재 상태

- 설치본 기준 관련20검사 통과: 연결/공유 배열의 사용 장면 분리/다음 페이지·소리·효과 보존/재연결/잘못된 경로·오래된 선택/늦은 미리보기/초안 유지/실제 HTTP 반영·최소 mod 재생·복원·충돌/기존 흐름·편집·탭 동작.
- 실제 게임 engine/jack.exe에서 생성한 연결 코드를 격리 QSP로 실행했다. 한글 및 따옴표 경로 할당, 다음 페이지 그림, 소리·효과 원문, 다른 이벤트 초기화 검사와 완료 표식을 통과했다. 실제 게임 전체를 재검사한 것은 아니다.
- 실제 브라우저: 중립795×596 그림으로 대사 선택→새 이미지 등록 창→새 경로 폴더 선택→PNG 저장→편집실 자동 경로 선택→미리보기→이미지 연결 반영→새 그림 우선 표시를 확인했다. 기존 폴더/이미지 선택과 수정 중 초안 유지도 확인했다. 화면은 browser-preview.png. 모든 쓰기는 격리 fixture에만 수행했다.
- 실제 WORK의 #txt_man1608행 글로리아 대사를 읽어 interaction_city=1311의1단계 연결 후보를 준비했다. 생성 블록 구문 오류0, 최소 편집186바이트. 대형 원본 위치의 정적 검사기 진단4개는 수정 전후 동일하며 새 오류로 보고하지 않았다. 실제 엔진 검증은 위 생성 코드의 격리 실행 범위다.
- WORK jack.qsp 및 catalog_status.js는 설치 직전/직후 SHA256을 대조했다. 작업 중 다른 작업이 QSP를 갱신하여 초기 계획 해시와 달라진 사실은 verification.json의 externalChangeSinceBaseline에 구분한다. 다른 작업의 QSP를 보존했으며, 실제 WORK 이미지·QSP·세이브에 이 테스트 연결을 반영하지 않았다. Full·음원·배포·커밋푸시는 변경하지 않았다.

## 복구와 재현

plan.json은 시작 해시, before/<해시>.gz는 기존 도구 원본이다. verification.json/checks.txt/native-results.json과 재현 스크립트를 보존한다. 후속 편집이 있으면 덮어쓰기 복구 전에 차이를 대조한다. tools/text-workshop의 dialogue-image*.test.cjs는 각각 연결/클라이언트/HTTP 검증이다. API 시험은 작은 중립 fixture를 만들고 자기 시험 폴더를 정리한다. stage/install 스크립트는 당시 절차 기록이며 이미 설치된 파일에 무조건 재실행하지 않는다.
`);
function prepend(p,text){const s=fs.readFileSync(p,'utf8'),at=s.indexOf('\n');fs.writeFileSync(p,s.slice(0,at+1)+'\n'+text+'\n'+s.slice(at+1));}
prepend(repo+'/docs/SESSION_HANDOFF_INDEX.md','## 2026-11-08 선택 대사에 이미지 연결\n\n[사용·구조·지원 범위·검증·복구](../records/dialogue-image-20261108/REPORT_KO.md). 대사 편집실에서 기존 그림 선택/새 PNG 등록→대사별 미리보기→연결 반영. 다른 페이지·효과·소리 보존, 수정/추가 초안 유지.20검사·격리HTTP/브라우저 실제 반영·엔진 생성코드 실행 통과. 글로리아1311 읽기 전용 연결 확인. WORK 도구만 설치, 실제 QSP/이미지/체크상태 불변.');
prepend(repo+'/docs/session-handoffs/2026-11-08/CLAUDE_HANDOFF_KO.md','## 후속 기능: 대사별 이미지 연결\n\n[상세](../../../records/dialogue-image-20261108/REPORT_KO.md). 사용자는 새 페이지가 아니라 선택 대사에 표시할 그림 지정을 확정. 편집기 장면 아래에 이미지 선택/새 등록/미리보기/연결 반영. 공유 대사는 현재 사용 장면만 대상으로 하고 같은 단계 조건 공통 적용은 미리 표시.20검사와 격리HTTP/브라우저/엔진 확인. 별도 전용 출력기 등은 명시적 분석 필요 안내. 실제 WORK QSP/이미지는 변경하지 않음, Full/커밋푸시 없음.');
fs.appendFileSync(plan.src+'/README.md','\n## 선택 대사에 이미지 연결 (2026-11-08)\n\n대사 선택 후 장면 아래 「선택 대사에 이미지 연결」에서 기존 파일을 폴더로 찾거나 새 이미지를 등록한다. 장면 미리보기로 현재 사용 장면/단계를 확인하고 이미지 연결 반영을 누른다. 새 등록은 이미지 파일만 저장하며 QSP 연결은 별도 반영 버튼으로 기록한다. 다른 단계/효과/소리는 유지한다. 지원 범위·API·복구는 records/dialogue-image-20261108/REPORT_KO.md.\n');
fs.appendFileSync(plan.src+'/VERIFICATION.md','\n## 2026-11-08 대사별 이미지 연결\n\n관련20검사 및 격리HTTP/브라우저 실제 등록·반영·복원, 생성 코드의 실제 engine/jack.exe 실행 통과. 글로리아1311 연결 후보는 읽기 전용 확인. WORK QSP/체크상태 불변. 전용 출력기 등 미확정 연결은 변경하지 않고 이유를 안내한다. 상세: records/dialogue-image-20261108/REPORT_KO.md.\n');
console.log(JSON.stringify({installed:installed.length,tests:20,protectedFilesUnchanged:true,report:record+'/REPORT_KO.md'}));
