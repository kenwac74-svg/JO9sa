'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),z=require('zlib'),crypto=require('crypto'),a=require('assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',O=R+'/records/commit-handoff-20261108';fs.mkdirSync(O+'/before',{recursive:true});
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function backup(p){if(!fs.existsSync(p))return null;const h=hash(p);fs.writeFileSync(O+'/before/'+h+'.gz',z.gzipSync(fs.readFileSync(p)));return h;}
const mf=R+'/assets/runtime-source-2.4.1.json',manifest=JSON.parse(fs.readFileSync(mf,'utf8'));backup(mf);const sync=[];
for(const e of manifest.files.filter(e=>e.repositoryPath)){
 const source=W+'/'+e.runtimePath;let dest=R+'/'+e.repositoryPath;a(fs.existsSync(source)&&fs.existsSync(dest),e.runtimePath);const wh=hash(source),rh=hash(dest);if(wh===rh&&e.sha256===wh)continue;
 const old={...e},changedFields=[];
 if(e.runtimePath.endsWith('.json')){const b=JSON.parse(fs.readFileSync(dest,'utf8').replace(/^\uFEFF/,'')),v=JSON.parse(fs.readFileSync(source,'utf8').replace(/^\uFEFF/,''));for(const k of new Set([...Object.keys(b),...Object.keys(v)]))if(JSON.stringify(b[k])!==JSON.stringify(v[k]))changedFields.push(k);}
 if(!e.repositoryPath.startsWith('assets/')){e.repositoryPath='assets/'+e.runtimePath;dest=R+'/'+e.repositoryPath;}
 const before=backup(dest);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(source,dest);e.bytes=fs.statSync(source).size;e.sha256=wh;
 sync.push({runtimePath:e.runtimePath,previousRepositoryPath:old.repositoryPath,repositoryPath:e.repositoryPath,before,sourceBeforeSha256:rh,after:wh,bytes:e.bytes,changedFields});a.equal(hash(dest),wh);
}
fs.writeFileSync(mf,JSON.stringify(manifest,null,2)+'\n');fs.writeFileSync(O+'/work-source-sync.json',JSON.stringify({policy:'WORK_ONLY_SYNC_POLICY_20261026',checked:manifest.files.filter(e=>e.repositoryPath).length,synchronized:sync,WORKModified:false,FullModified:false},null,2)+'\n');
const qspHash=hash(W+'/jack.qsp');a.equal(qspHash,hash(R+'/assets/runtime/2.4.1/jack.qsp'));a.equal(qspHash,manifest.sourceQspSha256);
const readme=R+'/assets/runtime/2.4.1/README_KO.md';backup(readme);let rm=fs.readFileSync(readme,'utf8');rm=rm.replace(/- SHA-256: `[^`]+`/,'- SHA-256: `'+qspHash+'`').replace(/- 최신 수정: [^\n]+/,'- 최신 수정: `records/sfx-runtime-fix-20261108/REPORT_KO.md` (채택 전투 효과음5종·몬스터18종 연결; 음원 형식 통일·게임오버 전용 음향·목표 요약 포함).');fs.writeFileSync(readme,rm);
const handoff=`# Codex → Claude 인수인계 · 2026-11-08

사용자 최신 지시: **“커밋 푸시하고 사용량이 충전 될 때까지 클로드가 작업한다. 인수인계 해.”** 완료 작업을 main에 커밋·푸시하는 마무리이며, 이후 새 커밋/푸시·Full 동기화·정식 패치 ZIP 제작을 포괄 승인한 것은 아니다. 이 문서를 현재 시작점으로 읽고, 과거 GPT_HANDOFF_KO.md는 당시 기록으로만 참고한다.

## 1. 현재 기준과 작업 경계

- repo: G:/somi/JO9sa, 브랜치 main. 이 인계 문서가 포함된 커밋이 이번 마무리다. 실제 커밋은 git log -1, 원격 반영은 git rev-list --left-right --count HEAD...origin/main으로 확인한다. 시작 HEAD는2436b52a93fc7abb2d18623d16e04a78eff3c16f였고 fetch 후 원격과0/0이었다.
- 최신 WORK: G:/somi/Jack O Nine Tails v2.4_work/game. QSP SHA256: **${qspHash}**. 추적 스냅샷 assets/runtime/2.4.1/jack.qsp와 같고 assets/runtime-source-2.4.1.json이 현재 리소스 원장이다.
- 옛 source/jack_2026-10-01.qsp나 구 QSRC를 최신 실행본으로 쓰거나 다시 빌드하지 않는다. 기존 mods 전체를 최신 QSP에 재적용하지 않는다. 적용할 새 mod만 격리해 tools/apply_mods.ps1로 적용하고 필수 구조·줄/주석·재생 검사를 한다.
- WORK는 현재 수동 변경까지 포함한 기준이다. 이번 commit 준비에서 원장4356개를 대조했고, 초상2331의3개·캐릭터JSON3개·library city 아이콘1개의 차이를 WORK 기준으로 추적 소스에 반영했다. details는 records/commit-handoff-20261108/work-source-sync.json. resources/new의 과거 아이콘은 덮어쓰지 않고 assets 쪽 현재 override로 원장 경로를 바꿨다. JSON 수치/설정은 WORK의 기존 값을 복사했으며 이번에 새로 설계/변경하지 않았다.
- **Kor_Full은 사용자 수동 설치·테스트 대상**이다. 별도 명시 지시 없이 수정/동기화하지 않는다. 세이브·원본JO9O·기존 배포ZIP도 보존한다. 이후 공식 패치는 같은 출시 기준본부터 승인분을 누적으로 포함한다.
- 프로젝트 sources/는 읽기 전용. 임시자료는 G:/Codex/tmp 작업별 폴더, 검증 뒤 재생성 가능한 사본만 정리한다. 창작 문구·수동 편집을 임의로 바꾸거나 불확실한 수치/연결을 추측해 채우지 않는다.

## 2. 완료·반영된 게임 변경

| 항목 | 현재 상태 / 근거 |
|---|---|
| 목표 표시 | 색으로 강조된 수급 조건은 보존. 강조 없는 특별 고객11개만 요구/보상/기한 중심 요약, 인사·배경 장문 제외. NPC 원대사/진행 판정은 그대로. records/goal-summary-20261108/REPORT_KO.md |
| 아이템 그림 | slut_dress.png와 underwear_nun.png를 해당 아이템에 연결. records/item-component-images-20261108/REPORT_KO.md |
| 초상/전신 | 기존 초상 검색 후 불일치31명 초상93개와 테두리15개, 총108PNG 반영. AI 재그림이 아니라 사용자가 고른 얼굴 크롭+기존 테두리 코드 합성. records/portrait-sync-20261108/REPORT_KO.md. 이번2331 최신 WORK 동기화는 별도 이력 참조 |
| 음원 형식 | BGM MP3·효과음 PCM WAV. 게임오버 BGM/효과음은 게임오버 화면에서만. 원본 귀족 신분/평판 우선순위 유지. records/audio-format-normalize-20261108/REPORT_KO.md |
| 실제 효과음 연결 | 가르시드/둔기뿐 아니라 전투5종(승/패/처형/석방/치명타)·몬스터18종의 파일/PLAY 연결. 신규 WAV21개와 기존 gsid 보존. records/sfx-runtime-fix-20261108/REPORT_KO.md, 앞선 sfx-hooks/sound-adoption 기록 |

사운드는 채택 JSON만 바꾼 상태가 아니라 실제 본체에 연결돼 있다. 게임은 QSP를 메모리에 보유하므로 새 연결을 테스트할 때 완전히 종료 후 다시 실행해야 한다. 청감·사용자 세이브 전체 플레이는 사용자가 확인한다. 사용자가 테스트하면서 알 수 있는 WAV 확인을 과하게 반복하지 말라고 했다.

## 3. 완료·반영된 모드툴

### 이미지 패치리스트

- 전체/노예/추가팩/MOB/처리주석5탭. 노예 전용 보기 복구. 검색은 입력 즉시 실행하지 않고 검색 버튼으로 확정한다.
- **이전의 load 후 DOM 재배치와 summary CSS 강제 숨김은 폐기했다.** 초기 HTML nav/빈 panel + 탭별 inert template, catalog-tabs.js가 선택한 탭만 최초 로드·직접 생성한다. 재방문 시 검색/필터/페이지 상태 유지, 느린 이전 요청이 새 탭을 덮지 않는다.
- HTTP 초기 응답124KB. 다른 탭 데이터는 /catalog-tab/{gallery,girls,pack,mob,notes,conditions}로 지연 제공한다. source HTML 안의 var D / window.JO9_* 패턴은 기존 데이터 쓰기 도구와 호환되도록 남겼다. file:// 열기는 template을 재사용하지만 HTTP 응답 최적화와는 구분한다.
- server.cjs ↔ catalog-tabs.cjs, tools/local-workspace/catalog-seed/catalog-tabs.js. 씬 생성기는 conditions template 안을 교체하도록 변경. 최신 UI구조를 예전 생성 결과로 덮지 않는다.
- records/catalog-native-tabs-20261108/REPORT_KO.md: 자동20개+PIC2시나리오 및 실제5탭/수동검색/미체크복귀/교체창 무저장 확인. 이전 catalog-ui 기록은 경위이며 현 구조는 native-tabs다.
- 씬 조건은 현재 QSP60f8bc40… 기준. 주석130개는 실행 연결 미확인128개와 같은 뜻/집합이 아니다. 과거 검토 근거가 낡은 주석은 재확인 표시를 유지한다. records/catalog-action-notes-20261108 및 scene-condition-refresh/sfx-runtime-fix 기록을 본다. 미확인만으로 이미지 삭제하지 않는다.

### 대사 편집실

- 시작과 마무리 대사를 지정 → 필요할 때 분기 선택 → 사이를 포함한 TXT 하나. 중간 시작은 앞의 시작 대사 제안, 중간 끝은 예상 끝 대사와 유지/변경 확인. 확인 미응답 동안 저장 잠금. 선택 마무리 뒤는 제외하고 잘못 고른 길/미해결 연결은 완성 파일로 오인하지 않게 안내한다. records/dialogue-range-20261108/REPORT_KO.md.
- **대사 편집실의 CSS 덧씌움도 폐기했다.** index.html이 탭·각본·수정/흐름·고급 출력/반영·저널·AI를 처음부터 선언. workshop-ui.js가 두 패널의 실제 hidden 상태를 소유, 스타일은 workshop.css 하나. 기능 JS는 UI/style 삽입 대신 동작만 바인딩한다.
- AI는 고정 overlay가 아니라 workshopApp Grid의 실제 두 번째 행. 본문 보정 padding 없음. 접기·높이 조절/기억, 수정·추가 대사·AI 요청/응답·각색본 상태 유지. 수정 탭에서만 그림 미리보기와 AI 설정 복원을 한다.
- 선택 전달은 jo9:selection 이벤트로 독립 구독한다. 전역 변수 검사 콜백을 여러 모듈이 덮던 연결은 제거. journal-keywords-ui.js도 정적 노드를 재사용한다.
- records/workshop-native-layout-20261108/REPORT_KO.md: 관련33개 통과, 실제 부동산 이벤트1311에서 미리보기·초안 왕복·이모지25·변수16·Kindroid 설정 표시·TXT2대사 저장 검증. 실제 게임 반영/AI전송은 하지 않았고 테스트 입력·TXT·대응표를 정리했다. 기존 정적 ID80개와 저널 모델 보존.
- 새 창은 준비돼 있다. 기존 창에는 초안이 있을 수 있어 강제 새로고침하지 않았다. 새 구조는 새로고침 후 사용한다.

### 사운드 청취/특성·아이템 DB

- 사운드 목록에 직접 폴더·파일 지정과 재제작/채택/보류 동작. 채택 결과와 본체 실제 연결을 구분해 표시한다. tools/sound-audition/README.md 및 records/sound-file-picker-20261108, sound-adoption-20261108 참조.
- 사용자 **사운드 폴더 정리는 취소**. 불필요 음원 이동을 하지 않았다. 원본 china/town 유지 요구도 여전히 유효하다. 취소 이후127개 해시 보존 확인.
- tools/game-reference는 최신 WORK 추출 특성128/아이템271(기본196+조리75), 정적 열람표·검색·획득처/발현/치료 설명·HTML/JSON/생성기. 별도 마법DB는 원래 범위에 없었다. 모드툴 실행기에 연결 완료. records/game-reference-refresh-20261108/REPORT_KO.md.
- 다운로드 ZIP은 정식 게임패치와 다른 도구용17항목 ZIP이다. 로컬 위치: C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/output/game-reference-refresh-20261108/JO9_특성_아이템_열람표_WORK_20261108.zip. SHA2566df734b5927522220056ed5a4335bab1358c42f0d3ab02b662ea37e195a01f66. ZIP 자체는 Git 제외, 소스는 커밋한다.
- 최신 통합 실행: tools/local-workspace/Open-Modding-Tools.ps1. 사운드/열람표 포함. 인물 **상태** 편집기와 이미 HTML로 만든 씬 추가기는 기본 모드툴 연결에서 제외한다(11/8 사용자 결정이 옛 기본 목록보다 우선).

## 4. 미완료·보류: 완료로 오해하거나 임의로 구현하지 말 것

1. **거주지/명성 BGM 순차 재생**은 가능성 진단만 완료, 본체 기능은 아직 미반영이다. 원본 귀족/평판 우선, 기본1+명성70%초과 타지역3=총4곡 합의. 네이티브 ISPLAY 종료 감지는 현재 엔진에서 신뢰할 수 없고 HTML 시각+네이티브 PLAY 진단만 통과했다. 지역별 독립 명성 부재/이벤트 음악 우선순위 검토가 남는다. records/residence-bgm-feasibility-20261108/REPORT_KO.md. 추측으로 새 명성 변수를 만들지 않는다.
2. **조수 헌신 일일 상승**은 결정 대기. ASSISTANT_DEVOTION_DECISION_KO.md의 A/A′/B/C와 역할 범위를 사용자에게 결정받아야 한다. 현재 미수정이다.
3. 안개 아이템 기획, 경매 대사/Gemini NPC 분기, 혀 손실 등은 기존 보류 원장/트리거를 따른다. 인계 지시가 보류 해제가 아니다. 4차 시작 시 부동산32문구 포함 여부, 명령 확장 시 tongue_loss 검토를 알린다.
4. 공식 패치 새 ZIP/Full 동기화는 이번에 하지 않았다. 다음 배포 때 기존 출시본부터 누적 검사한다. 도구 수정 검증만으로 게임 전체 정상/실제 청감 완료를 주장하지 않는다.

## 5. 다음 작업자에게

이 문서·AGENTS.md·WORK_ONLY_SYNC_POLICY_20261026.md를 먼저 읽고 현재 WORK와 Git 상태를 다시 대조한다. 완료된 기능을 다시 만들거나 CSS로 가려 붙이는 패치로 되돌리지 않는다. 사용자 새 지시가 우선이며 미결정 설계를 자동 선택하지 않는다. QSP 주석 안 작은따옴표가 다음 줄을 문자열로 삼킨 전력이 있으므로 새 QSP 변경 시 줄/주석 검사와 관련 경로 검사 필수다.

클로드의 실행/계정 상태나 사용량 충전 시각은 이 문서로 제어하지 않는다. 사용자에게 클로드를 실행했다고 보고하지 않는다. 인계 진입점은 CLAUDE.md 및 docs/SESSION_HANDOFF_INDEX.md에도 연결했다.
`;
const hf=R+'/docs/session-handoffs/2026-11-08/CLAUDE_HANDOFF_KO.md';fs.writeFileSync(hf,handoff);
const idx=R+'/docs/SESSION_HANDOFF_INDEX.md';backup(idx);let s=fs.readFileSync(idx,'utf8');if(!s.includes('## 2026-11-08 Codex → Claude 최신 인수인계'))s=s.replace('# JO9 통합 대화 인계','# JO9 통합 대화 인계\n\n## 2026-11-08 Codex → Claude 최신 인수인계\n\n[현재 기준·완료·미완료·검증·다음 작업](session-handoffs/2026-11-08/CLAUDE_HANDOFF_KO.md). 사용자 커밋·푸시/Claude 전환 지시. QSP60f8bc40…, 실제 효과음·목표/초상/DB·각본 출력·두 도구 초기 구조 정리까지 반영. WORK 기준 원장4356개 대조/소스7개 차이 정리. 사운드 정리 취소·거주지 BGM 진단만·조수 헌신 결정 대기를 구분. Full/배포ZIP 미변경.');fs.writeFileSync(idx,s);
const claude=R+'/CLAUDE.md';backup(claude);s=fs.readFileSync(claude,'utf8');const entry='<!-- JO9 MOD START CODEX_TO_CLAUDE_HANDOFF_20261108 -->\n## 2026-11-08 최신 인수인계\n\n사용자 지시로 Codex 사용량 충전 동안 Claude가 이어받는다. 먼저 [최신 인수인계](docs/session-handoffs/2026-11-08/CLAUDE_HANDOFF_KO.md)와 AGENTS.md를 읽는다. 현재 실행 기준은 WORK와 assets/runtime/2.4.1/jack.qsp이며, 아래의 옛 source/ 기준보다 최신 WORK 정책이 우선한다. Full은 별도 지시 없이 동기화하지 않는다.\n<!-- JO9 MOD END CODEX_TO_CLAUDE_HANDOFF_20261108 -->\n\n';if(!s.includes('CODEX_TO_CLAUDE_HANDOFF_20261108'))s=s.replace('# JO9 로컬 모딩 — Claude 작업 규칙','# JO9 로컬 모딩 — Claude 작업 규칙\n\n'+entry);fs.writeFileSync(claude,s);
fs.copyFileSync(__filename,O+'/prepare.cjs');console.log(JSON.stringify({synced:sync.length,qspHash,handoff:hf}));
