'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),a=require('assert/strict'),vm=require('vm'),crypto=require('crypto');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/catalog-native-tabs-20261108',O=R+'/records/catalog-native-tabs-20261108';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),installation=JSON.parse(fs.readFileSync(O+'/installation.json','utf8'));
for(const [p,h]of Object.entries(installation.protected))a.equal(hash(p),h,p);
const paths=new Set(installation.changes.map(e=>e.target));for(const e of JSON.parse(fs.readFileSync(O+'/followup.json','utf8')))paths.add(e.target);
const finalHashes={};for(const p of paths){finalHashes[p]=hash(p);if(/\.c?js$/.test(p))new vm.Script(fs.readFileSync(p,'utf8'));}
for(const name of ['catalog_workshop.js','catalog-tabs.js','catalog_cuts.js'])a.equal(fs.readFileSync(R+'/tools/local-workspace/catalog-seed/'+name,'utf8').replace(/\r\n/g,'\n'),fs.readFileSync(G+'/modtools/catalog/'+name,'utf8').replace(/\r\n/g,'\n'),name);
for(const name of ['server.cjs','catalog-tabs.cjs'])a.equal(hash(R+'/tools/text-workshop/'+name),hash(G+'/modtools/text-workshop/'+name),name);
const before=JSON.parse(fs.readFileSync(T+'/before.json','utf8'));
for(const [i,p]of [[0,G+'/modtools/catalog/catalog_merge_vs_original.html'],[1,R+'/tools/local-workspace/catalog-seed/catalog_merge_vs_original.html']]){
 const original=fs.readFileSync(T+'/'+i+'-catalog_merge_vs_original.html','utf8'),now=fs.readFileSync(p,'utf8');
 for(const re of [/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/,/window\.JO9_GIRLS_CHECKLIST=([\s\S]*?);\s*<\/script>/,/window\.JO9_MOB_SETS=([\s\S]*?);\s*<\/script>/,/window\.JO9_ADDITIONAL_PACK=([\s\S]*?);\s*<\/script>/,/window\.JO9_SCENE_CONDITIONS=([\s\S]*?);\s*<\/script>/])a.deepEqual(JSON.parse(original.match(re)[1]),JSON.parse(now.match(re)[1]));
}
const readme=`# 이미지 패치리스트 탭 구조 수정 (2026-11-08)

WORK와 추적 소스에 적용했다. 초기 HTML에 탭 5개와 빈 패널을 선언한다. 기존 화면을 load 후 옮기거나 summary를 CSS로 감추던 코드는 제거했다.

## 사용

- 전체 이미지 / 노예 이미지 / 추가 이미지팩 / 전투 MOB / 처리 주석을 선택한다. 처음 선택한 탭만 데이터·렌더러를 읽고 목록을 만든다. 돌아올 때는 검색·필터·페이지·이미지 교체 UI의 현재 상태를 재사용한다.
- 검색은 기존 요청대로 버튼으로 실행한다. 입력만으로 결과를 바꾸지 않는다. 왼쪽 캐릭터 버튼은 노예 탭, 폴더 선택은 전체 이미지 탭으로 이어진다.
- 이미지 체크, 노예 ID별 태그, 미체크 보기, 원본 비교/작업폴더 복사, 교체기, B·C컷과 등장 조건, MOB 얼굴 선택·프레임, 추가팩 WORK 미리보기, 씬 조건/처리 주석은 기존 기능을 재사용한다. 실제 쓰기 승인·백업 방식은 유지한다.
- 이미 열려 있던 창은 새로고침해야 새 구조가 적용된다. 초안이 있을 수 있어 사용자 기존 탭은 강제 새로고침하지 않았다. 검증한 새 탭을 별도로 열어 두었다.

## 코드와 데이터 흐름

catalog_merge_vs_original.html은 실제 nav/tabpanel과 실행하지 않는 탭별 template을 가진다. 데이터는 한 벌만 보관하며 기존 var D 및 window.JO9_* JSON 패턴을 보존해서 기존 PIC 등록·B컷·캐릭터 ID 파서와 호환한다.

catalog-tabs.js는 선택→탭 내용 요청→해당 패널에 직접 생성→해당 기능 실행을 맡는다. 한 탭 최초 로드를 합치고 완료 전 다른 탭으로 전환하면 이전 요청 결과를 실행하지 않는다. 이미 열린 탭 상태를 캐시하고 오류 시 다시 불러오기를 표시한다. 비활성 전체/노예/MOB 목록은 이미지 재생성을 멈춘다.

server.cjs는 catalog-tabs.cjs의 shell로 초기 응답에서 모든 template을 제외하고, GET /catalog-tab/{gallery,girls,pack,mob,notes,conditions}에서 허용한 내용만 반환한다. conditions는 전체 이미지와 처리 주석이 공유하는 포맷/데이터로 한 번 읽는다. 원본 JSON·데이터 배열은 바꾸지 않는다. HTTP 브리지는 초기 head에서 전달하며 전체 탭에서 낡은 설정 파일을 다시 읽지 않는다. 파일 직접 열기는 원천 HTML의 template을 재사용한다(이 모드는 전체 HTML 다운로드를 줄이는 HTTP 최적화와 구분).

노예 렌더러와 씬 주석 생성기도 해당 패널/템플릿에 직접 기록하도록 맞췄다. 씬 재분석은 기존 conditions 템플릿 안의 블록을 교체한다. 전체 이미지 전용 동기화 버튼도 해당 패널에 직접 만든다. 기존 스타일과 그림 자체는 변경하지 않았다.

## 확인 결과

- 자동 검사20개 통과: 초기 구조/선택 로드/중복·느린 요청/재시도, 데이터 보존, 기존 체크 API7개와 씬 주석6개 포함. 기존 PIC 교체기 fixture 2개(hang/cached) 통과.
- 브라우저 notes 첫 진입: 나머지4개 패널의 자식0개·이미지0개, gallery 검색/교체기 미생성. girls 첫12개 → 검색어1400 입력만으로12개 유지 → 버튼 후1개. MOB86개 section(개별78+단체8), 추가팩27명108이미지 확인. 전체 이미지도 별도 최초 생성한다.
- 전체 이미지 beauty_shop.png 검색: 입력만으로28,556건 유지 → 버튼 후1개 카드/짝1개. 탭 왕복과 미체크 전체 보기41,253개 후 복귀 시 검색·1개 결과 복원. 실제 교체창 무저장 열기·닫기 확인. 이미지·태그 저장/동기화 버튼은 누르지 않았다.
- HTTP 초기 응답123,794바이트(기존 원천HTML13,206,691바이트). 다른 탭 데이터는 초기 응답에 없음. 알 수 없는 탭404. 대표 각 탭 요청200, conditions는 JS MIME.
- QSP 및 catalog_status.js 해시는 시작 전과 동일(verification.json). 운영 이미지/세이브 변경 없음. Full/배포ZIP/커밋/푸시 없음.

## 복구 및 재현

installation.json / followup.json은 변경 이력, verification.json은 최종 해시다. before/<sha>.gz는 변경 전 복구 자료다. 복구 전 사용자 후속 변경을 대조한다. 새 loader/helper만 삭제하면 초기화와 탭 API가 끊기므로 HTML·서버 호출부도 함께 복원한다. build-native-tabs.cjs는 최초 원본을 받는 일회 변환 기록이며 현재 구조 위에 재실행하지 않는다. 테스트 파일·수정 스크립트는 이 폴더에 보존한다. 재생성 가능한 격리 빌드·중복 임시자료는 정리했다.
`;
fs.writeFileSync(O+'/REPORT_KO.md',readme);
const browser={initialSelected:'notes',unselectedPanelsEmpty:4,firstNotesImages:0,girlsManualSearch:{before:12,typed:12,after:1,preservedAfterTabSwitch:true},pack:{characters:27,images:108},mob:{entries:78,groups:8},gallery:{manualSearch:true,pairedCards:true,buttonsPreserved:true,openCloseReplacementWithoutWrite:true,unchecked:41253,restoredQuery:'beauty_shop.png'},lateDomMove:false,firstResponseBytes:123794,oldSourceBytes:13206691};
fs.writeFileSync(O+'/verification.json',JSON.stringify({date:'2026-11-08',tests:{pass:20,fail:0,picFixtureScenarios:['hang','cached']},browser,protected:installation.protected,finalHashes},null,2)+'\n');
for(const n of ['catalog-tabs.js','catalog-tabs.cjs','catalog-native-tabs.test.cjs','catalog-tabs.test.cjs','build-native-tabs.cjs','install-native-tabs.cjs','finalize-native-tabs.cjs'])fs.copyFileSync(path.join(__dirname,n),O+'/'+n);
fs.copyFileSync(__dirname+'/catalog-native-tabs.png',O+'/native-tabs.png');
let unit=fs.readFileSync(__dirname+'/catalog-tabs.test.cjs','utf8').replace("require('./catalog-tabs.js')","require('../../local-workspace/catalog-seed/catalog-tabs.js')");fs.writeFileSync(R+'/tools/imgmg/tests/catalog-tabs.test.cjs',unit);
const idx=R+'/docs/SESSION_HANDOFF_INDEX.md',s=fs.readFileSync(idx,'utf8');if(!s.includes('## 2026-11-08 이미지 목록 초기 탭·선택 로딩'))fs.writeFileSync(idx,s.replace('# JO9 통합 대화 인계','# JO9 통합 대화 인계\n\n## 2026-11-08 이미지 목록 초기 탭·선택 로딩\n\n[구조·사용·검증·복구](../records/catalog-native-tabs-20261108/REPORT_KO.md). 초기 HTML 탭/빈패널 및 탭별 실행 분리. load 후 DOM 이동·summary CSS 숨김 제거. 선택한 탭만 최초 로드, 재방문 상태 유지. 초기 응답124KB, 미선택4개 패널 비생성. 자동20개+PIC2시나리오, 브라우저5탭/수동검색/미체크복귀/교체창 확인. QSP·체크상태 불변. Full/배포/커밋푸시 없음.'));
const tmp=path.resolve(T),parent=path.resolve('G:/Codex/tmp')+path.sep;a(tmp.startsWith(parent));a.equal(fs.realpathSync(tmp).toLowerCase(),tmp.toLowerCase());
function check(p){a(!fs.lstatSync(p).isSymbolicLink(),p);if(fs.statSync(p).isDirectory())for(const n of fs.readdirSync(p))check(path.join(p,n));}check(tmp);fs.rmSync(tmp,{recursive:true});
console.log(JSON.stringify({protectedUnchanged:true,sourceWorkMatch:true,sourceDatasetsUnchanged:true,record:O,temporaryBuildRemoved:true}));
