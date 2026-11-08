'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),crypto=require('crypto'),z=require('zlib'),vm=require('vm');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/workshop-native-layout-20261108',O=R+'/records/workshop-native-layout-20261108';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),installation=JSON.parse(fs.readFileSync(O+'/installation.json','utf8'));
for(const [p,h]of Object.entries(installation.protected))a.equal(hash(p),h,p);
const files={};for(const name of ['index.html','workshop.css','workshop-ui.js','script-range.js','script-export.js','dialogue-ai.js','variable-inspector.js','journal-keywords-ui.js','server.cjs']){const src=R+'/tools/text-workshop/'+name,work=G+'/modtools/text-workshop/'+name;a.equal(hash(src),hash(work),name);files[name]=hash(src);if(name.endsWith('.js')||name.endsWith('.cjs'))new vm.Script(fs.readFileSync(src,'utf8'));}
const before=JSON.parse(fs.readFileSync(O+'/before.json','utf8')),oldIndex=z.gunzipSync(fs.readFileSync(O+'/before/'+before[G+'/modtools/text-workshop/index.html']+'.gz')).toString('utf8'),newIndex=fs.readFileSync(G+'/modtools/text-workshop/index.html','utf8');
const oldIds=[...oldIndex.split('<script')[0].matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]),newIds=[...newIndex.split('<script')[0].matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);for(const id of oldIds)a(newIds.includes(id),id);a.equal(newIds.length,new Set(newIds).size);
const oldAi=z.gunzipSync(fs.readFileSync(O+'/before/'+before[G+'/modtools/text-workshop/dialogue-ai.js']+'.gz')).toString('utf8').replace(/\r\n/g,'\n'),newAi=fs.readFileSync(G+'/modtools/text-workshop/dialogue-ai.js','utf8');
const modelStart="(function(){\n 'use strict';\n const model=window.JO9_JOURNAL;";a.equal(oldAi.slice(0,oldAi.indexOf(modelStart)),newAi.slice(0,newAi.indexOf(modelStart)),'Journal definitions changed');
const download=G+'/content/modworkpic/JO9_각본_interaction_city_1608-1609.txt',b=fs.readFileSync(download),text=b.toString('utf8');a.equal(b.subarray(0,3).toString('hex'),'efbbbf');a.equal([...text.matchAll(/---- \[S\d+-P\d+\] ----/g)].length,2);a(text.includes('전 글로리아이며'));a(!text.includes('전속 부동산 상담가'));
const exportId=text.match(/^# 각본 ID: (\w+)/m)[1],map=G+'/modtools/text-workshop/runtime/script-exports/'+exportId+'.json';const downloadInfo={sha256:hash(download),bytes:b.length,pages:2,exportId,mapSha256:fs.existsSync(map)?hash(map):null};
const browser={url:'http://127.0.0.1:3813/',benignEvent:1311,initial:{task:'script',styleElements:0,stylesheet:'workshop.css',appHeight:720,scrollHeight:720,aiHidden:true,noPreviewImages:true},edit:{staticPanels:true,journalPresent:true,advancedPresent:true,variables:16,emojiPreviewIcons:25,modelProvider:'kindroid',configuredKeyShownAsMaskedState:true},statePreserved:['replacement','additionText','aiCommand','scriptAdapted','preview','openAdvancedDetails'],dock:{viewport:720,expandedHeight:180,scrollBottom:540,dockTop:540,collapsedHeight:48,scriptModeNoGap:true},preview:{tagsPreserved:true,approved:false,applyDisabled:true},script:{endConfirmation:true,downloadPages:2,excludeAfterEnd:true},testInputsRestored:true,noSendNoSettingsSaveNoApply:true};
fs.writeFileSync(O+'/verification.json',JSON.stringify({date:'2026-11-08',tests:{pass:33,fail:0},browser,download:downloadInfo,originalStaticIdsPreserved:oldIds.length,journalModelUnchanged:true,protected:installation.protected,finalHashes:files},null,2)+'\n');
const report=`# 대사 편집실 초기 구조 정리 (2026-11-08)

사용자 요청에 따라 기존 화면을 CSS로 가리는 방식을 제거하고 WORK와 추적 소스에 적용했다.

## 바뀐 구조와 사용

- 초기 HTML에 작업 탭·각본 영역·공유 검색·수정/흐름·고급 각본/각색본 반영·저널·AI 도크를 선언한다. script-range / script-export / dialogue-ai는 화면과 style 태그를 삽입하지 않고 기존 노드의 동작을 연결한다.
- 각본 탭과 수정 탭의 소유 패널을 코드의 hidden 상태로 전환한다. 작업 모드 선택자로 editor/navigation/AI를 display:none!important로 덮던 CSS는 없다. 기본 각본 화면에서는 수정 화면의 그림을 만들지 않고, 수정 탭에서 현재 선택을 그린다.
- AI는 고정 화면을 덮는 패널이 아니라 workshopApp Grid의 두 번째 행이다. 첫 행은 본문 스크롤 영역이다. 본문 padding-bottom 보정과 aiClosed/closed CSS 숨김을 없앴다. 접기·펼치기, 드래그 높이 조절, 높이/접힘 기억은 같은 저장 키로 유지하며 aiBody.hidden을 직접 변경한다.
- 겹쳐 선언하던 기본 배치/이모지/미디어 스타일을 workshop.css에 정리했다. 정적 스타일시트의 일반 모양 규칙은 유지한다. 실제 화면에서 style 요소0개, 정적 스타일시트1개를 확인했다.
- 선택 알림은 명시적 jo9:selection 이벤트로 변수 검사·고급 각본·구간 출력을 각각 갱신한다. 하나의 전역 콜백을 계속 덮는 연결은 제거했다. 저널 생성기용 journal-keywords-ui.js도 정적 노드를 재사용한다.

검색 후 각본 탭에서는 시작/끝을 지정해 저장한다. 수정 탭에서는 원문·수정문·장면 흐름과 기존 반영 도구를 사용한다. 초안/추가 대사/AI 요청·응답/각색본은 탭 전환으로 초기화하지 않는다. 기존 열린 창은 새로고침해야 적용된다. 사용자 기존 탭을 강제 새로고침하지 않고 별도 검증 탭을 열어 두었다.

## 확인 결과

- 구조·모드·높이7개와 기존 각본13개, 편집/이모지/기록6개, 저널3개, 일괄 치환UI2개, 검색/AI fixture2개: 총33개 통과. 운영 AI 전송은 수행하지 않았다.
- 실제 WORK 부동산 안내 이벤트1311에서 원문 선택, 탭 왕복 후 수정 초안/추가 대사/AI 요청/각색본/미리보기 유지 확인. 변경 미리보기는 태그 검사를 통과했고 승인 미체크·반영 비활성이었다. 원문·추가 대사·각색본 등 검증 입력은 원상복원했다.
- 이모지 미리보기25개, 변수·조건 읽기16개, 저장된 Kindroid 설정의 연결 상태 표시, 고급 출력/각색본/변경 기록/일괄 치환 패널 연결 확인. 설정 저장·전송·게임 반영/복구 버튼은 누르지 않았다.
- 각본 시작/끝 안내 후 TXT 실제 다운로드 확인:2개 대사, 마무리 뒤 대사 제외, UTF-8 BOM. 검증 TXT와 해당 테스트 대응표만 정리했다.
- 720px 높이에서 각본 탭은 본문720px. 수정 탭 AI180px일 때 본문 끝540px = AI 시작540px, 접으면48px. AI 접힘 선호를 원래대로 돌리고 기본 각본 화면으로 복귀했다.
- 기존 정적 입력 ID ${oldIds.length}개 전부 보존·전체 ID 중복 없음. 저널 모델/등록 데이터도 원본과 동일. QSP와 이미지 체크 상태의 SHA256은 작업 전과 동일. 이미지·세이브·Full·배포 ZIP·커밋/푸시 변경 없음.

## 호출·부수 효과·복구

workshop-ui.js는 초기 DOM과 두 패널/도크의 표시를 소유하고 jo9:workshop-mode 이벤트를 낸다. index의 미리보기·dialogue-ai의 표시/설정 복원은 수정 모드에서 연결한다. 각 기능 API 입력/반환과 저장·승인·백업·복구 경로는 그대로다. 서버에는 workshop.css(CSS MIME)와 workshop-ui.js의 정적 제공만 추가했다. 승인 전 수정은 기존 브라우저 초안/미리보기이며 게임 파일을 쓰지 않는다.

installation.json / before.json / before/<sha>.gz는 변경 전 경로와 복구 자료, verification.json은 최종 해시다. 새 UI/controller/CSS만 지우면 초기 표시가 깨지므로 HTML과 기능 바인딩도 함께 복원한다. 복원 전에는 사용자 후속 변경을 대조한다. build-workshop-layout.cjs는 before.json과 gz 원본에서 후보를 재생성하는 일회 변환 기록이며, install은 현재 파일이 최초 원본 해시와 같을 때만 허용한다. 재생성 가능한 임시 빌드는 정리했고 핵심 코드·검사·화면·기록을 보관한다.
`;
fs.writeFileSync(O+'/REPORT_KO.md',report);
for(const n of ['build-workshop-layout.cjs','install-workshop-layout.cjs','finalize-workshop-layout.cjs','workshop-native-layout.test.cjs','workshop-ui.test.cjs','workshop-ui.js'])fs.copyFileSync(__dirname+'/'+n,O+'/'+n);
fs.copyFileSync(__dirname+'/workshop-native-layout.png',O+'/native-layout.png');
const use=`\n## 2026-11-08 편집실 구조\n\n각본 파일 만들기 / 대사 수정·반영은 초기 HTML의 독립 패널이다. 검색은 공유하며 각 기능의 입력과 초안은 탭을 왕복해도 유지한다. AI 도크는 본문과 별도 Grid 행이며 접기·높이 조절을 지원한다. 강제 숨김 CSS·본문 하단 여백 보정·나중 UI 삽입은 제거했다. 기존 창은 새로고침해야 적용된다.\n`;
for(const root of [R+'/tools/text-workshop',G+'/modtools/text-workshop']){const p=root+'/README.md',old=fs.readFileSync(p,'utf8');if(!old.includes('## 2026-11-08 편집실 구조'))fs.writeFileSync(p,old+use);const v=root+'/VERIFICATION.md',s=fs.existsSync(v)?fs.readFileSync(v,'utf8'):'';if(!s.includes('## 2026-11-08 초기 구성·실제 AI 도크'))fs.writeFileSync(v,s+'\n## 2026-11-08 초기 구성·실제 AI 도크\n\n관련33개 검사 통과. 실제 WORK 이벤트1311에서 각본 TXT2대사 저장, 편집/추가/AI/각색본 초안·미리보기 탭 왕복 유지, 이모지25개·변수16개·설정 표시 확인. AI 본문 영역 분리/접기와 기본 화면 여백 없음 확인. 검증 입력 복원, 실제 반영/AI 전송 없음. QSP·체크상태 해시 불변. records/workshop-native-layout-20261108/REPORT_KO.md 참조.\n');}
const idx=R+'/docs/SESSION_HANDOFF_INDEX.md',s=fs.readFileSync(idx,'utf8');if(!s.includes('## 2026-11-08 대사 편집실 초기 구성·실제 AI 도크'))fs.writeFileSync(idx,s.replace('# JO9 통합 대화 인계','# JO9 통합 대화 인계\n\n## 2026-11-08 대사 편집실 초기 구성·실제 AI 도크\n\n[구조·사용·검증·복구](../records/workshop-native-layout-20261108/REPORT_KO.md). 각본/수정/고급출력/저널/AI 초기 HTML, 모드별 실제 패널, Grid AI행. JS의 style/UI 삽입·강제 CSS 숨김·body 여백 보정 제거. 관련33검사와 실제 초안/미리보기·이모지·변수·설정·TXT저장 확인, 게임/체크상태 불변. Full/배포/커밋푸시 없음.'));
a.equal(hash(download),downloadInfo.sha256);fs.unlinkSync(download);if(downloadInfo.mapSha256){a.equal(hash(map),downloadInfo.mapSha256);const record=JSON.parse(fs.readFileSync(map,'utf8'));a.equal(record.id,exportId);a.equal(record.range,true);fs.unlinkSync(map);}
const resolved=path.resolve(T);a(resolved.startsWith(path.resolve('G:/Codex/tmp')+path.sep));a.equal(fs.realpathSync(resolved).toLowerCase(),resolved.toLowerCase());function check(p){a(!fs.lstatSync(p).isSymbolicLink(),p);if(fs.statSync(p).isDirectory())for(const n of fs.readdirSync(p))check(path.join(p,n));}check(resolved);fs.rmSync(resolved,{recursive:true});
console.log(JSON.stringify({sourceWorkMatch:true,protectedUnchanged:true,journalModelUnchanged:true,originalStaticIdsPreserved:oldIds.length,downloadPages:2,temporaryBuildRemoved:true,record:O}));
