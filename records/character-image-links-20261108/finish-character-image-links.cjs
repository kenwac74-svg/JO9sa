const fs=require('node:fs'),crypto=require('node:crypto'),a=require('node:assert/strict');const repo='G:/somi/JO9sa',record=repo+'/records/character-image-links-20261108',work='G:/somi/Jack O Nine Tails v2.4_work/game',hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),audit=JSON.parse(fs.readFileSync(record+'/shiru-audit.json','utf8')),installation=JSON.parse(fs.readFileSync(record+'/installation.json','utf8'));
for(const p of audit.pairs){a.equal(hash(work+'/content/pic/'+p.old),p.sha256);a.equal(hash(work+'/content/pic/'+p.canonical),p.sha256);}a.equal(hash(work+'/json/slaves/2577_pelageya.json'),installation.pelageyaBefore);
fs.copyFileSync('native-character-image-links.cjs',record+'/native-character-image-links.cjs');fs.copyFileSync('verify-live-character-links.cjs',record+'/verify-live-character-links.cjs');fs.copyFileSync('finish-character-image-links.cjs',record+'/finish-character-image-links.cjs');fs.copyFileSync('G:/Codex/tmp/character-image-links-20261108/native/client-results.json',record+'/native-results.json');
fs.writeFileSync(record+'/verification.json',JSON.stringify({tests:{passed:12,failed:0},native:JSON.parse(fs.readFileSync(record+'/native-results.json','utf8').replace(/^\uFEFF/,'')),canonicalPng:7,oldCompatibilityPng:7,all14ByteHashesMatch:true,jsonImageKeysChanged:7,nonImageJsonUnchanged:true,pelageyaJsonUnchanged:true,userStatusUnchanged:installation.tagsBefore===hash(work+'/modtools/catalog/catalog_status.js'),qspWrittenByThisTask:false,qspAtInstall:installation.qspAfter,currentQspHash:hash(work+'/jack.qsp'),externalQspChangeAfterInstall:hash(work+'/jack.qsp')!==installation.qspAfter,liveRead:JSON.parse(fs.readFileSync(record+'/live-read.json','utf8')),browser:installation.browser},null,2));
fs.writeFileSync(record+'/REPORT_KO.md',`# 캐릭터 PNG 수동 연결 · 시루1448 경로 정리 · 2026-11-08

## 사용

이미지 체크리스트를 새로고침하고 캐릭터 번호를 검색한다. 기본 전신·초상·복장 또는 전체 복장의 일반/흥분/반항 항목에 있는 **파일 선택·연결**을 누른다. PIC 폴더 안의 기존 PNG를 탐색해 선택한 뒤 **이 파일 연결**을 누른다. PNG 파일 자체는 덮어쓰지 않고 해당 캐릭터 JSON의 경로만 바꾼다. PNG 교체/추가 버튼은 기존 기능을 유지한다.

화면을 열거나 WORK 이미지 상태 새로고침을 누르면 실제 WORK JSON을 다시 읽는다.1448·2577의 복장 경로는 이미 JSON에 있었는데 옛 내장 원장이 이를 표시하지 못한 것이 확인됐다. 재분석/재생성 없이 현재 등록이 표시된다. 이름 있는 유니크 수와 태그·정렬·수동 검색·탭 기능은 유지한다. 이벤트 전용 이미지와 기존 이름별 장면 자료도 갱신 중 누락하지 않는다.

## 시루1448 적용

현재 JSON의 전신·하녀·비서·도미나·컬러/흑백/세피아 초상7개 참조를 1448_white_long_young 계열에서 **1448_shiru** 계열로 바꿨다. 폴더는 그대로이며 초상 _gray/_sepia 접미사를 유지한다. PNG 크기는 전신/복장795×596, 초상151×150이다. 새 이름7개와 옛 이름7개의 바이트 해시가 각각 동일하다. 그림/테두리를 다시 만들거나 압축하지 않았다.

JSON 파일명1448_Shiru.json, 번호, 능력치, 특성, 설정문은 바꾸지 않았다. 현재 QSP 본문과 다른 캐릭터 JSON에 옛 이미지 이름의 직접 참조는 없었다. 다만 저장된 인물/세이브는 옛 경로를 보관할 수 있어 옛7개를 호환 파일로 남겼다. 이 파일은 중복 정리 대상이 아니다. 새 기준 경로와 JSON·추적 이미지 원장은 WORK와 소스에 반영했다. assets/compatibility-aliases/2026-11-08_shiru-paths.json에 관계를 기록했다. 기존23개 호환 원장은 변경하지 않았다.

2577 펠라게야는 이미 등록된 cloth/pelageya_red_long, secretary/pelageya_red_long, mistress/pelageya_red_long을 현재 JSON에서 읽어 보여 준다.2577 JSON은 변경하지 않았다.

## 구조·입출력·부작용·복구

- character-image-links.cjs의 create(game,catalogRoot)는 read(ids,{rescan})와 apply({id,field,path,expectedHash})를 제공한다. 실제 번호 접두어의 JSON을 찾아 현재 경로/원본 해시/유효 복장/파일 인덱스를 반환한다. 같은 번호의 JSON이 중복되면 잘못된 파일을 추측해 편집하지 않는다.
- 기본 전신은 fullimage/indpack_title, 역할 일반 그림은 fullmade/indpack_maid·fullsecretary/indpack_secr·fullmistress/indpack_dom을 함께 지정한다. 상태 변형·다른 의상은 선택한 키만 바꾼다. 초상은 content/pic/ 접두어를 유지하고 모든 등록은 엔진의 PNG 확장자 생략 규칙을 따른다. 실제 PNG 존재/형식/PIC 경계와 최신 JSON 해시를 확인한다.
- JSON 문자열 토큰만 바꾸고 다른 속성/설정문의 값과 기존 서식을 유지한다. 쓰기 전 원본과 이력을 catalog/image_work/character-links/<기록번호>/before.json 및 record.json에 저장한다. 잘못 연결했으면 이전 PNG를 다시 선택하거나 후속 변경 여부를 대조한 뒤 이 원본으로 복구한다. 기존 SVG/씬 컷/다른 인물 이미지·태그를 수정하지 않는다.
- 서버 API는 POST /api/catalog/character-images/read 및 /apply이며 기존 로컬 토큰/접속 검사 아래에서 동작한다. 체크리스트의 슬롯/등록 경로/미등록 복장 버튼이 호출한다. 이 모듈을 제거하면 서버 require/두 API 경로와 체크리스트 버튼·live read를 함께 제거해야 한다.
- build_inventory.py도 수동으로 고른 PIC 경로를 이미지 키에서 읽으며 시루 호환 주소는 별도 호환 자료로 분리한다. 일반 카탈로그에도 새7개 경로를 추가했다. 전체 QSP 씬 분석의 해시는 이번에 허위 갱신하지 않았다. Python 생성기 전체 실행은 하지 않았고 현재 연결 메타데이터는 실제 WORK를 읽는 공통 JS 모듈로 갱신했다.
- 기존 SAV의 인물 캐시를 강제로 변환하지 않는다. 게임이 JSON을 다시 읽은 뒤 복장을 다시 선택해 확인한다. 새 이름 적용으로 옛 세이브가 그림을 잃지 않도록 옛 PNG 경로를 유지한다.

## 검증

관련12검사 통과: 최신 JSON 조회, 역할의 두 등록 방식, 초상 접두어/상태별 키, 설정문·능력치 보존, 중복 ID/경로/오래된 JSON 거부, 실제 서버의 저장·백업·인증·QSP/PNG/태그 보존, 이벤트 전용 자료 유지, 기존1031역할 판정 회귀. 캐릭터1448을 골라 복장에 다른 PNG를 연결하고 새로고침한 실제 격리 브라우저에서 결과 유지,2577불변,작업중 태그 유지,JS오류0을 확인했다. browser-file-picker.png는 원본 캐릭터 그림을 쓰지 않은 중립 시험 화면이다.

실제 game/engine/jack.exe에서 최신1448/2577 JSON과 실제 display_fullimage/jo9_seed_role_images를 읽는 격리 QSP로 기본/조수 복장8조건,역할 메뉴6검사,시루 초상3경로를 확인했다. 원래 장면 그림은 렌더링하지 않고 중립 PNG를 사용했다. 새/옛14PNG 해시 일치와 JSON의 비이미지 항목 보존도 확인했다. 실제 플레이 화면은 별도이며 EXE 재실행 후 시루 전신·조수 복장을 다시 선택해 확인한다.

QSP·SAV·Full·음원·커밋푸시는 이번 작업에서 수정하지 않았다. 다른 작업이 동시 진행돼 WORK QSP가 설치 이후 갱신된 사실은 verification.json에 분리했다. 이번 도구 설치 직전/직후 QSP와 상태 파일은 동일했다. 이후 새 연결 API의 실제 WORK 읽기 응답200과 두 인물의3역할 유효 경로를 확인했다.

## 보존 자료

shiru-audit.json은 참조 조사·7쌍 경로·이미지 해시/크기,installation.json은 변경 범위/소스 원장/원본 해시,verification.json/native-results.json/live-read.json은 검증 결과다. before/<해시>.gz에 도구·JSON·덮어쓴 추적 원장의 원본을 보존했다. 생성 진단 QSP/중복 시험 사본은 검증 후 정리한다. stage/install/finalize 스크립트는 당시 재현 기록이며 이미 적용한 파일에 무조건 재실행하지 않는다.
`);
const readme=repo+'/tools/girls-image-checklist/README_KO.md';let text=fs.readFileSync(readme,'utf8');text=text.replace('경로 자체가 비어 있는 복장은 캐릭터 이미지추가도구에서 등록해야 한다. 이 화면이 임의로 JSON을 수정하지 않는다.','경로가 있는 칸과 없는 복장 칸 모두 파일 선택·연결로 기존 PNG를 지정할 수 있다. 이 파일 연결 버튼을 누르면 해당 이미지 키만 JSON에 저장하고 원본을 백업한다.').replace('이미지 파일을 직접 넣은 뒤 새로고침하면 파일 상태를 갱신한다. JSON의 등록 경로를 바꿨으면 inventory 재생성이 필요하다.','이미지 파일이나 JSON 경로를 직접 바꾼 뒤 WORK 이미지 상태 새로고침을 누르면 현재 등록과 파일 상태를 다시 읽는다.').replace('사용자가 새 이미지를 넣으면 PNG와 해당 이미지 패치·백업만 저장한다. 새로운 JSON 필드, 게임 상태, SAV는 변경하지 않는다.','PNG 교체/추가는 기존 이미지 패치·백업을 저장한다. 파일 선택·연결은 선택한 이미지의 JSON 등록만 저장하고 JSON 원본·이력을 남긴다. 게임 상태와 SAV는 변경하지 않는다.');text+='\n## 2026-11-08 PNG 수동 연결\n\n기본 전신·초상·일반 복장·흥분/반항 변형의 파일 선택·연결 → PIC 폴더 탐색 → 이 파일 연결. 실시간 WORK JSON 조회로1448/2577의 옛 원장 표시를 수정했다.1448_shiru7개 새 기준과 옛 주소7개 호환 파일을 유지한다. API·저장 위치·지원 범위·검증·복구는 records/character-image-links-20261108/REPORT_KO.md.\n';fs.writeFileSync(readme,text);
fs.appendFileSync(repo+'/docs/IMAGE_COMPATIBILITY_ALIASES_KO.md','\n## 2026-11-08 시루1448 파일명 정리7쌍\n\n새 기준은1448_shiru 계열이다. 옛1448_white_long_young 전신/하녀/비서/도미나/초상3종7개는 저장된 인물의 옛 경로를 위해 동일 바이트의 호환 파일로 유지한다. 삭제/중복 정리 대상이 아니다. 기준 원장: assets/compatibility-aliases/2026-11-08_shiru-paths.json. 새로운 그림을 교체할 때 두 경로를 어떻게 유지할지 명시적으로 검토한다.\n');
function prepend(p,s){const old=fs.readFileSync(p,'utf8'),i=old.indexOf('\n');fs.writeFileSync(p,old.slice(0,i+1)+'\n'+s+'\n'+old.slice(i+1));}
prepend(repo+'/docs/SESSION_HANDOFF_INDEX.md','## 2026-11-08 캐릭터 PNG 수동 연결·시루1448 이름 정리\n\n[사용·입출력·호환·검증·복구](../records/character-image-links-20261108/REPORT_KO.md). 슬롯마다 기존PNG 폴더 선택·JSON 연결, 현재WORK JSON 실시간조회.1448/2577은 실제복장등록과 옛원장불일치.시루7개1448_shiru로 연결,옛7개 호환보존,비이미지JSON/2577불변.12검사/격리브라우저/실제엔진8전신·역할메뉴·초상 확인. QSP/SAV/Full/커밋푸시 미수정.');
prepend(repo+'/docs/session-handoffs/2026-11-08/CLAUDE_HANDOFF_KO.md','## 후속 기능: 캐릭터 PNG 수동 연결 및1448_shiru\n\n[상세](../../../records/character-image-links-20261108/REPORT_KO.md). 파일 선택·연결 버튼은 기존PNG를 해당 캐릭터의 전신/초상/의상/상태키에 지정하고 JSON원본·이력을 저장한다. 실제JSON을 로딩/새로고침 때 읽음.1448·2577복장은이미등록되어옛원장이잘못표시한것.1448시루7개 새기준경로와옛세이브주소7개KEEP,소스JSON/자산원장동기화.2577 JSON변경없음.12검사/브라우저/엔진확인. 다른작업의QSP변경은보존,이번작업은QSP/SAV/Full/커밋푸시미수정.');
console.log(JSON.stringify({report:record+'/REPORT_KO.md',pngIntegrity:true,tests:12}));
