'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),a=require('assert/strict'),vm=require('vm');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',O=R+'/records/dialogue-range-20261108';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const expected=JSON.parse(fs.readFileSync(O+'/installation.json','utf8')).protectedHashes;
for(const [p,h]of Object.entries(expected))a.equal(hash(p),h,p);
const names=['server.cjs','scenes.cjs','script-export.cjs','script-export.js','index.html','script-range.cjs','script-range.js'];
const installed={};for(const name of names){const src=R+'/tools/text-workshop/'+name,work=G+'/modtools/text-workshop/'+name;a.equal(hash(src),hash(work),name);installed[name]=hash(src);const s=fs.readFileSync(src,'utf8');if(name.endsWith('.js')||name.endsWith('.cjs'))new vm.Script(s);else for(const m of s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/\bsrc=/.test(m[1]))new vm.Script(m[2]);}
const downloaded=G+'/content/modworkpic/JO9_각본_interaction_city_1608-1609.txt';
const raw=fs.readFileSync(downloaded),txt=raw.toString('utf8');a.equal(raw.subarray(0,3).toString('hex'),'efbbbf');a.equal([...txt.matchAll(/---- \[S\d+-P\d+\] ----/g)].length,2);a(txt.includes('전 글로리아이며'));a(txt.includes('그 일을 잘 해낼'));a(!txt.includes('전속 부동산 상담가'));
const verification={date:'2026-11-08',unitTests:{pass:13,fail:0},browser:{url:'http://127.0.0.1:3813/',benignEvent:1311,startMiddleWarning:true,endMiddleWarning:true,keepSelectedEnd:true,downloadPages:2,excludeAfterEnd:true,editTabPreserved:true,stageTransitionLocksMarkers:true,unansweredConfirmationLocksSave:true,screenshot:'range-ui.png'},download:{sha256:hash(downloaded),bytes:raw.length,encoding:'UTF-8 BOM / CRLF'},protectedHashes:expected,installed};
fs.writeFileSync(O+'/verification.json',JSON.stringify(verification,null,2)+'\n');
const guide=`## 시작·마무리로 각본 파일 만들기 (2026-11-08)

1. 기본 탭 **각본 파일 만들기**에서 대사를 검색하고 결과를 선택한다.
2. **이 대사를 시작으로 지정**을 누른다. 앞에 시작 대사가 있으면 첫 대사로 바꿀지, 선택한 위치를 유지할지 고른다.
3. 같은 이벤트의 다른 대사 목록 또는 새 검색으로 마무리를 고른 뒤 **이 대사를 마무리로 지정**을 누른다. 뒤에 대사가 있으면 예상 끝 대사와 현재 선택 중 하나를 고른다.
4. **각본 파일 저장**을 누른다. 선택지·조건 분기가 나오면 포함할 경로를 고른다. 선택한 양끝과 중간을 포함하는 TXT 하나가 저장된다.

확인에 답하기 전에는 저장이 잠긴다. 마무리 이후, 고르지 않은 분기의 대사는 제외한다. 연결을 확인하지 못했거나 선택한 길이 마무리에 닿지 않으면 안내하며, 미완성 구간을 완성 파일로 저장하지 않는다. 예상 시작·끝은 선택한 이벤트에서 계산한 후보이며, 더 큰 줄거리 전체의 경계를 확정하는 기능은 아니다.

기존 원문 수정·추가·각색본 반영은 **대사 수정·반영** 탭에 있다. 고급 각본 출력은 그 탭의 접힌 메뉴에 유지한다. 구간 TXT도 기존 각본 ID/페이지 번호를 유지하므로 기존 각색본 검토·반영 기능으로 읽을 수 있다. 각본 저장만으로 게임 QSP는 바뀌지 않는다.
`;
for(const root of [R+'/tools/text-workshop',G+'/modtools/text-workshop']){
 const p=root+'/README.md',s=fs.readFileSync(p,'utf8');if(!s.includes('## 시작·마무리로 각본 파일 만들기'))fs.writeFileSync(p,s+'\n'+guide);
 const v=root+'/VERIFICATION.md',old=fs.existsSync(v)?fs.readFileSync(v,'utf8'):'';if(!old.includes('## 2026-11-08 선택 구간 각본'))fs.writeFileSync(v,old+'\n## 2026-11-08 선택 구간 각본\n\n구간/기존 각본 검사 13개 통과. 실제 WORK 이벤트1311에서 중간 시작·끝 안내, 2개 대사 TXT 다운로드와 뒤 대사 제외, 수정 탭 복원, 전환 중 지정 잠금, 확인 전 저장 차단을 확인했다. QSP와 catalog_status.js 해시 불변. 상세: records/dialogue-range-20261108/REPORT_KO.md.\n');
}
const report=`# 대사 편집실 시작·마무리 구간 출력

${guide}
## 구현과 검증

- 입력: 현재 QSP 해시, 시작/끝 문자열의 원문 위치, 이벤트 사용 위치, 사용자가 고른 분기. 반환: 위치 후보, 분기 선택 요청, 또는 각본 본문과 원문 대응표.
- 호출: script-range.js → /api/script/boundary 또는 /api/script/range → scenes.cjs → script-export.cjs → script-range.cjs. 선택 전달은 index.html의 jo9:selection 이벤트를 쓴다. 대사 전환이 끝날 때까지 지정 버튼을 잠근다.
- 종속성: 기존 씬 수집·배열/단계·주인공 성별판 선택·원문 인덱스·plain 변환을 재사용한다. 조건부 대사도 사용자가 선택한다. 범위는 최대256장면이며 동적/미해결 연결은 오류나 경로 재선택으로 표시한다.
- 부수 효과: 지정점/분기 선택은 브라우저 sessionStorage, 완성 파일의 원문 대응표는 runtime/script-exports에 저장한다. 다운로드는 UTF-8 BOM/CRLF TXT 한 개. QSP·세이브·이미지 체크 상태는 쓰지 않는다.
- 검증: 범위/역순/낡은 해시/잘못 고른 길/조건부 대사/기존 가져오기 등13개 통과. 실제 부동산 안내 이벤트1311에서 시작·끝 안내와 2개 대사 다운로드 확인. 마무리 뒤 상담가 대사는 파일에 없었다. 기존 수정 탭, 전환 중 지정 잠금, 확인 미응답 중 저장 비활성 확인.
- 브라우저 확인용 파일과 임시 빌드 복사본은 검증 뒤 정리한다. 사용자 기존 작업 탭의 초안은 유지하고 별도 탭에서 검증했다. AI 요청/반영/실제 게임 실행은 수행하지 않았다.
- WORK QSP: ${expected[G+'/jack.qsp']}. 이미지 체크 상태 해시도 verification.json과 동일. Full, 커밋/푸시, 배포 ZIP 변경 없음.

## 복구·제거

installation.json은 최초 변경 전/후 경로, selection-bridge.json은 선택 연결 보완 경로, verification.json은 최종 설치 해시를 기록한다. before/<sha256>.gz는 변경 전 코드이며, 복원 전 최종 해시와 사용자 후속 변경을 확인한다. 새 모듈만 삭제하면 API/스크립트 호출이 실패하므로 index/server/scenes/script-export 호출부도 함께 복원한다. 초기 설치 스크립트와 보완 스크립트는 재현 이력이며 현재 코드 위에 재실행하는 업데이터가 아니다.
`;
fs.writeFileSync(O+'/REPORT_KO.md',report);
for(const name of ['prepare.cjs','install.cjs','restart.ps1','selection-bridge.cjs','selection-race.cjs','pending-confirmation.cjs','script-range.cjs','script-range.js','script-range.test.cjs','finalize.cjs'])fs.copyFileSync(__dirname+'/'+name,O+'/'+name);
fs.copyFileSync(__dirname+'/range-ui.png',O+'/range-ui.png');
const idx=R+'/docs/SESSION_HANDOFF_INDEX.md',s=fs.readFileSync(idx,'utf8');if(!s.includes('## 2026-11-08 시작·마무리 지정 각본 출력'))fs.writeFileSync(idx,s.replace('# JO9 통합 대화 인계','# JO9 통합 대화 인계\n\n## 2026-11-08 시작·마무리 지정 각본 출력\n\n[사용법·검증·복구](../records/dialogue-range-20261108/REPORT_KO.md). 기본 각본 탭에서 시작/마무리 지정 → 경로 선택 → TXT 하나 다운로드. 중간 선택 시 예상 시작/끝 안내와 유지/변경 확인. 실제 WORK 이벤트1311 다운로드, 뒤 대사 제외, 기존 수정 탭·잠금 확인 및 관련13개 검사 통과. QSP/체크상태 불변, Full/배포/커밋푸시 없음.'));
// 검증을 위해 생성한 정확한 파일만 제거한다. 사용자 원본·설정·초안은 제외한다.
a.equal(hash(downloaded),verification.download.sha256);fs.unlinkSync(downloaded);
const tmp=path.resolve('G:/Codex/tmp/dialogue-range-20261108'),prefix=path.resolve('G:/Codex/tmp')+path.sep;
a(tmp.startsWith(prefix));a.equal(fs.realpathSync(tmp).toLowerCase(),tmp.toLowerCase());
function checkTree(p){a(!fs.lstatSync(p).isSymbolicLink(),p);if(fs.statSync(p).isDirectory())for(const n of fs.readdirSync(p))checkTree(path.join(p,n));}
checkTree(tmp);fs.rmSync(tmp,{recursive:true});
console.log(JSON.stringify({verified:13,installed:installed,protected:expected,temporaryBuildRemoved:true,downloadVerifiedThenRemoved:true}));
