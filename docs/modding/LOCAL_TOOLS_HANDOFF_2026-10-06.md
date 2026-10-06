# 다른 PC에서 이미지 체크리스트·대사 편집실 이어가기 (2026-10-06)

## 가장 짧은 실행 방법
1. Google 클라우드에서 현재 플레이 게임과 순정 비교용 게임을 내려받는다. 플레이 game 폴더에는 jack.qsp와 content/pic이 있어야 한다. 순정은 별도 위치에 두고 수정하지 않는다.
2. 이 저장소를 clone/pull한다. 두 도구 소스는 tools/text-workshop, 체크리스트 생성·연결 도구는 tools/imgmg에 있다.
3. tools/local-workspace/Open-JO9-Tools.cmd를 더블클릭한다. 처음 한 번 플레이 game 폴더와 순정 game 폴더를 선택한다. 드라이브 문자가 G가 아니어도 된다.
4. Codex에 포함된 Node.js를 자동 탐색한다. 없으면 Node.js 22 LTS를 한 번 설치한다. npm 설치는 필요 없다.
5. 대사 편집실 http://127.0.0.1:3813/ 와 이미지 체크리스트 http://127.0.0.1:3813/catalog 가 열린다. Codex 오른쪽 브라우저에서도 이 주소를 열면 된다. PIC는 서버가 읽으므로 브라우저 폴더 권한 팝업이 필요 없다.
6. API 키는 각 도구의 설정에서 한 번 입력한다. 모델 선택은 이미지/대사에서 독립적이다. 선택 모델과 대사 제공자·캐릭터 ID는 키 없이 보존했다. Kindroid는 대사 편집실만 지원한다.

이 실행기는 레지스트리·시작 프로그램·게임 실행 파일을 변경하지 않는다. Codex 자동 시작 연결은 PC에 종속되므로 기본 실행기에 포함하지 않았다. 필요한 PC에서는 사용자 승인 후 연결한다.

## 포함한 것 / 별도로 가져올 것
- 현재 최신 체크리스트 화면, 분류·작업 번호, 완료/보관/재활용/삭제 예정 등 체크 상태, 진행 메타데이터를 catalog-seed에 보존했다. 이미지 파일 자체는 포함하지 않았다.
- 첫 실행 시 catalog-seed를 local-workspace/catalog로 복사한다. 이후 실행이나 git pull은 현재 PC의 체크 상태를 덮어쓰지 않는다.
- 대사 검색·분기 흐름·장면 이미지·직접 QSP 반영·편집 툴바·이모지·변경 기록과 AI 연결 코드를 함께 보존했다. 이모지 PNG는 게임 실행에 필요한 도구 자산으로 포함했다.
- 실제 수정 대사와 게임 적용 이미지는 Google 클라우드의 최신 플레이 폴더로 전달한다. Git 도구만 가져와서는 수정된 jack.qsp를 복원할 수 없다.
- 현재 PC에서 옮길 때는 local-workspace/catalog도 따로 동기화한다. 기존 설치를 쓴다면 IMGMG의 catalog_status.js, catalog_work_ids.json, image_work/progress.json을 대응 위치로 옮긴다. HTML과 catalog_*.js도 최신본으로 함께 옮기면 UI/목록이 동일하다.
- runtime/backups의 대사 변경 이력은 필요할 때만 별도로 옮긴다. 서버 PID·로그·브리지 토큰·API 설정 파일은 옮기지 않는다. Windows 보호 저장 키는 다른 PC/사용자에게 이식되지 않는다.
- 처음 실행할 서버 포트가 사용 중이면 해당 프로그램을 임의 종료하지 않는다. PowerShell에서 Start-JO9-Tools.ps1 -Port 3814로 다른 포트를 사용할 수 있다.
- 위치를 다시 설정할 때 Start-JO9-Tools.ps1 -Configure를 실행한다. 실행 중인 서버가 다른 게임을 사용한다면 자동 종료/전환하지 않는다.

## 작업 규칙과 현재 상태
- JO9O 순정 폴더는 어떤 경우도 수정·삭제 금지. 플레이 폴더가 최신 적용 기준이며 오래된 merge_work를 적용 기준으로 삼지 않는다.
- 별도 SNKmod UI패치로 강제 연결하는 방식보다 원래 게임 이미지 위치에 1:1 교체하는 사용자 정책을 따른다. 잭오나 2.4 통합 작업과 사용자 제작 이미지 ZIP은 구분한다.
- reserve는 미사용 시안/보관 자산이다. 이름·크기만으로 채택/중복을 판정하지 않고 실제 그림과 게임 참조를 확인한다.
- 삭제 예정은 최종 게임 적용본을 유지하고 구버전·시안·중복 정리 대상으로 표시한다. 태그만 붙여서는 파일을 삭제하지 않는다. 순정은 항상 제외한다.
- 이미지 프롬프트 기본 명령은 SDXL 프롬프트 추출이며 원본 화풍을 묘사하지 않는다. 추가 조건은 사용자 입력으로 받는다.
- 롤백·시스템 변경은 승인 후 수행한다. 대사 편집실/체크리스트 서버 재시작은 사용자에게 일괄 승인받았다. 게임 화면 확인과 빠른 플레이 테스트는 사용자에게 맡긴다.
- 2026-10-06 마지막 갱신: 완료 1,349건 최신 이미지 URL 갱신, 도구 백업 218건 목록에서만 제외. 신규/누락 실제 이미지 0건. 물리 이미지 삭제 없음.
- 장면 미리보기는 QSP 정적 분석이다. 세이브 상태를 완전히 실행하는 게임 엔진으로 오인하지 않는다.

## 새 Codex 세션 시작 문구
“JO9sa 저장소의 AGENTS.md와 docs/modding/LOCAL_TOOLS_HANDOFF_2026-10-06.md를 읽고 이미지 체크리스트·대사 편집실 작업을 이어가. tools/local-workspace의 실행기로 내 로컬 게임 경로를 지정해 실행한다. 순정 폴더는 수정하지 말고, 시스템 변경·롤백은 먼저 승인받아. 게임 플레이 확인은 내가 한다.”

## Google Drive에 압축해 옮길 폴더

| 우선순위 | 현재 폴더 | 현재 용량 | 목적 |
|---|---|---|---|
| 필수 | G:/somi/JO9/game/content/pic | 약 10.49 GiB | 실제 적용 이미지 전체. reserve와 ui/dialogue_emoji 포함. 폴더 구조 그대로 이동한다. |
| 필수 | G:/somi/JO9/game/content/modworkpic | 약 0.53 GiB | 진행 중 이미지·시안·passed·cow 등 작업자료. |
| 필수(비교용) | G:/somi/JO9O/game/content/pic | 약 5.82 GiB | 순정 원본 비교. 별도 폴더로 유지하고 절대 덮어쓰지 않는다. 이미 Drive에 동일본이 있으면 재업로드 불필요. |
| 권장(배포 원천 보존) | G:/somi/IMGMG/newimgpack 와 UIpatch | 합계 약 0.05 GiB | 사용자 제작 이미지팩 원천. 최신 플레이 폴더를 대체하는 기준으로 사용하지 않는다. |

이미지만 옮기면 수정 대사는 옮겨지지 않는다. 번거로움을 줄이려면 위 play의 pic을 따로 떼기보다 G:/somi/JO9/game 전체를 JO9_play_current.zip으로 압축하는 방법을 권장한다. 그러면 jack.qsp, config.xml, css, json, modworkpic, snd와 세이브도 함께 보존한다. 순정은 JO9O_original.zip으로 분리한다.

별도 작업관리 ZIP에는 IMGMG의 catalog_merge_vs_original.html, catalog_*.js, catalog_work_ids.json, image_work/progress.json 및 필요한 image_work/history.jsonl을 담는다. tool_backups·backups 전체는 작업 재현 필수자료가 아니며 용량 절약 시 제외할 수 있다. catalog_workshop_config.js는 PC별 토큰으로 서버가 재생성하므로 제외한다.

제외 권장: game/modtools/text-workshop/runtime의 grok-settings.json·dialogue-ai-settings.json(API 보호키), server.json·로그. 필요한 runtime/backups(수정 이력)는 별도 개인 백업으로 보존한다. __JO9_ImageBackups는 되돌리기용 개인 백업이며 필수 실행 이미지가 아니므로 선택 사항이다. 보관·재활용한 reserve는 이번 이동 백업에서 빼지 않는다. IMGMG/merge_work는 오래된 중간본이므로 최신 플레이본으로 취급하지 않는다.

검증: 도구 테스트 34개 통과. G 드라이브가 아닌 임시 게임 폴더를 실행기에 지정하여 편집실·카탈로그 HTTP 200 확인. 실제 게임 플레이 검증은 사용자 담당. 키 형태 검사에서 내보낸 파일의 API 비밀키 발견 0건.
