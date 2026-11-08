const fs=require('node:fs'),a=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm'),cp=require('node:child_process');
const repo='G:/somi/JO9sa',record=repo+'/records/new-image-path-20261108',plan=JSON.parse(fs.readFileSync(record+'/plan.json','utf8')),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),dir=repo+'/tools/imgmg';
for(const p of plan.paths)a.equal(hash(p),plan.before[p],'Concurrent editor change: '+p);
a.equal(hash(plan.candidate),plan.after);new vm.Script(fs.readFileSync(plan.candidate,'utf8'));
for(const p of plan.paths)fs.copyFileSync(plan.candidate,p);
for(const name of ['workshop-new-path.js','workshop-new-path.test.cjs','new-image-path-save.test.cjs'])fs.copyFileSync(process.cwd()+'/'+name,dir+'/'+name);
for(const name of ['stage-new-image-path.cjs','preview-new-image-path.cjs','install-new-image-path.cjs','new-image-path-plan.md'])fs.copyFileSync(process.cwd()+'/'+name,record+'/'+name);
fs.copyFileSync(process.cwd()+'/new-image-folder.png',record+'/browser-folder-picker.png');
const commands=[['--test',dir+'/workshop-new-path.test.cjs',dir+'/new-image-path-save.test.cjs',repo+'/tools/cut-addition/workshop-cut-editor.test.cjs',repo+'/tools/cut-addition/workshop-cut-target-state.test.cjs'],[dir+'/tests/catalog-pic.test.cjs',plan.paths[0],'G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/catalog_merge_vs_original.html','cached']];
for(let i=0;i<commands.length;i++){const r=cp.spawnSync(process.execPath,commands[i],{encoding:'utf8'});fs.writeFileSync(record+'/checks-'+i+'.txt',r.stdout+r.stderr);a.equal(r.status,0,r.stdout+r.stderr);}
const moduleSource=fs.readFileSync(dir+'/workshop-new-path.js','utf8');for(const p of plan.paths){a.equal(hash(p),plan.after);a(fs.readFileSync(p,'utf8').includes(moduleSource));new vm.Script(fs.readFileSync(p,'utf8'));}
const protectedFiles=Object.keys(plan.before).filter(p=>!plan.paths.includes(p)).map(p=>({path:p,before:plan.before[p],after:hash(p),unchanged:hash(p)===plan.before[p]}));
for(const p of protectedFiles)a(p.unchanged,'Concurrent protected file change: '+p.path);
fs.writeFileSync(record+'/verification.json',JSON.stringify({installed:plan.paths.map(path=>({path,sha256:hash(path)})),protectedFiles,tests:{passed:38,failed:0,catalogPicScenario:'cached PASS'},browser:{fixture:'G:/Codex/tmp/new-image-path-20261108/browser-f1RFL0',selected:'content/pic/bg/새 이미지/qm_v_clean.png',created:true,dimensions:[24,26],collisionBlocked:true,cancelPreservesMapping:true,javascriptErrors:0},scope:'WORK and tracked editor JS only; no production image write'},null,2));
fs.writeFileSync(record+'/REPORT_KO.md',`# 이미지 교체 도구: 새 경로 추가 · 2026-11-08

## 사용

열어 둔 작업을 마무리한 뒤 이미지 패치리스트를 새로고침한다. 이미지 교체 창에 미리 원하는 이름으로 바꾼 이미지를 투입하고, 교체 대상 선택에서 “＋ 새 경로 추가 · 폴더 선택”을 고른다. content/pic 안의 폴더를 탐색해 “이 폴더 선택”을 누른다. 필요한 경우 “하위 폴더 추가”로 새 폴더를 준비한다. “규격 맞추기”와 “구도·비교”로 확인한 다음 “새 파일로 저장”을 누른다. 새 폴더와 이미지는 실제 저장 때 생성된다.

파일명은 투입한 이미지 이름을 사용한다. JPEG/WebP 입력의 확장자는 PNG로 바뀐다. 같은 경로의 파일이 이미 있으면 새 파일 지정/저장을 중단한다. 기존 이미지 교체는 기존 선택 항목을 사용한다. 새 경로는 관련 베리에이션을 자동 연결하지 않고 지정한 한 파일만 대상으로 한다. 저장 이후 재구성해도 해당 경로를 유지하며, 명시적으로 기존 대상을 선택하면 일반 매칭으로 돌아간다.

## 구조와 영향

- tools/imgmg/workshop-new-path.js는 기존 편집기 스코프에 삽입되는 원본 모듈이다. newImageDestination(folder,name)은 폴더+파일명에서 PIC 경로를 반환하며 잘못된 경로/Windows 예약명은 거부한다. 폴더 선택기는 공유 PIC root의 entries/getDirectoryHandle을 읽고 아직 없는 폴더는 메모리에만 준비한다.
- openNewImagePath는 투입 이미지의 파일명과 폴더 선택을 결합한다. sourceTargets/selectTarget/sourceCardHtml/targetCardHtml을 확장하고, map-target/버튼 이벤트로 진입한다. 기존 대상/전환 컷은 기존 함수로 전달한다.
- 새 파일의 크기는 투입 이미지에서 읽고 기존 encoder/크롭/용량 상한을 사용한다. 새 파일만이므로 원본 테두리 복원은 적용하지 않는다. 기존 PIC apply를 before:null/createMissing:true로 호출하며, 서버는 실제 경로 확인과 동시 변경 검사를 계속 수행한다.
- completeNewPathRows는 성공한 새 파일을 현재 편집기 목록/공유 PIC 인덱스에 등록하고 일반 재편집 상태로 바꾼다. 기존 선택은 유지한다. 이후 데이터베이스/QSP의 이미지 참조를 자동 변경하는 기능은 아니다. 기존 카탈로그 D에 없는 파일의 전체 원장 재생성은 종전 “현재 상태로 동기화” 절차를 따른다.
- 실제 설치 대상은 WORK catalog_editor.js와 추적 catalog-seed/cut-addition의 같은 파일이다. 별도 서버 재시작 없이 다음 스크립트 로딩부터 적용한다. 열려 있는 사용자 탭/작업은 강제 새로고침하지 않았다.
- 모듈을 제거할 때는 함께 바꾼 apply/map/render/poll 훅도 복구해야 한다. 원본 모듈과 생성본을 함께 관리하고, make_catalog_editor.ps1로 재생성한 경우 이번 훅/모듈을 재병합해야 한다. 생성 스크립트와 독립 place 워크숍은 이번 범위에서 수정하지 않았다.

## 검증

회귀9개와 격리 PIC 저장1개, 기존 전환 컷28개가 통과했다. 기존 catalog-pic cached 연결 시나리오도 통과했다. 전체 설치 JS 구문 검사와 원본 모듈 포함/해시 일치를 확인했다. 실제 브라우저에서는 중립 V 아이콘으로 폴더 상위/하위 탐색, 새 한글 폴더 준비, 원래 파일명 지정, 변환, 새 폴더/PNG 저장 완료, 저장 결과 재조회, 같은 파일 충돌 안내와 취소 후 선택 보존을 확인했다. JS 오류0. 화면은 browser-folder-picker.png.

WORK의 QSP/1031 JSON/catalog_status.js는 작업 시작 대비 해시가 같다. 실제 WORK 이미지 파일을 생성/교체하지 않았다. Full·음원·세이브·커밋/푸시는 수정하지 않았다. 실제 게임 장면 연결/표시는 이번 도구 기능 검사 대상이 아니다.

## 복구와 자료

plan.json은 작업 전 해시와 대상 경로, before/<해시>.gz는 기존 편집기3개 원본이다. verification.json과 checks-*.txt에 최종 검사를 기록했다. 후속 수동 변경이 있으면 복원 전에 차이를 비교한다. stage/install/preview 스크립트는 당시 작업 재현용이며 이미 적용된 파일에 무조건 재실행하지 않는다. 핵심 회귀 검사는 tools/imgmg/workshop-new-path.test.cjs 및 new-image-path-save.test.cjs다.
`);
function prepend(p,text){const s=fs.readFileSync(p,'utf8'),i=s.indexOf('\n');fs.writeFileSync(p,s.slice(0,i+1)+'\n'+text+'\n'+s.slice(i+1));}
prepend(repo+'/docs/SESSION_HANDOFF_INDEX.md','## 2026-11-08 이미지 교체 도구 새 경로 추가\n\n[사용·구조·검증·복구](../records/new-image-path-20261108/REPORT_KO.md). 대상 선택에 새 경로 추가, PIC 폴더 탐색/하위 폴더 준비, 투입 파일명으로 PNG 생성. 새 경로는 단일 대상, 기존 파일 충돌 차단.38검사+PIC연결/격리브라우저 실제 저장 확인. WORK/추적 도구만 반영, 실제 이미지/QSP/체크상태 불변.');
prepend(repo+'/docs/session-handoffs/2026-11-08/CLAUDE_HANDOFF_KO.md','## 후속 기능: 이미지 교체 도구 새 경로 저장\n\n[사용·검증·복구](../../../records/new-image-path-20261108/REPORT_KO.md). 사용자는 경로 직접 입력 대신 폴더 선택, 파일명은 이름 바꿔 투입한 파일을 쓰도록 확정. 대상 드롭다운의 새 경로 추가→폴더 선택/하위 폴더 준비→규격 맞추기→새 파일로 저장. 기존 파일은 새 경로 모드에서 덮어쓰지 않음. WORK/추적 editor JS만 설치.38검사/PIC연결/격리실제저장 통과. 이미지/QSP/JSON/체크 상태/Full/커밋푸시는 변경하지 않음.');
fs.appendFileSync(dir+'/README.md','\n## 새 경로에 이미지 저장 (2026-11-08)\n\n이미지 교체 창의 대상 선택 → 「＋ 새 경로 추가 · 폴더 선택」 → PIC 폴더 탐색 → 규격 맞추기 → 「새 파일로 저장」. 파일명은 투입한 이름, 출력은 PNG다. 하위 폴더 추가는 실제 저장 때 생성하며 같은 경로의 기존 파일은 새 경로 모드에서 덮어쓰지 않는다. 원본 모듈은 workshop-new-path.js, 사용/구조/복구는 records/new-image-path-20261108/REPORT_KO.md. catalog_editor.js 재생성 시 이 모듈뿐 아니라 apply/map/render/poll 훅을 함께 재병합할 것.\n');
console.log(JSON.stringify({installed:plan.paths,tests:38,catalogPic:'PASS',protectedFilesUnchanged:true,report:record+'/REPORT_KO.md'}));
