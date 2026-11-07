# 새 PC 인계 · 2.4.1 2차 패치 이후

## 게임 기준

- 이미 인계된 2.4.1 본편과 2차 누적 패치의 최종 r4를 새 PC의 WORK 기준으로 삼는다. 최종 r4는 엘사(2616) 이미지 교체가 포함된 판이다. 배포 원래 파일명은 `JO9_2.4.1_Patch_20261105_r4.zip`이며, 집 PC 보관본 이름은 `JO9_2.4.1_Patch_20261105_2차.zip`이다.
- 최종 r4 ZIP SHA-256 `97bea1265012a50823f3a635d7fe16054c56984ddc6d3e528892a2f4c113f74c`.
- 최종 `game/jack.qsp` SHA-256 `6ebda9981bf6bc56de46929474de64157969fd324bba8e8be181e002dad1cc7e`. 집 PC WORK와 저장소 [QSP 스냅샷](../../../assets/runtime/2.4.1/jack.qsp)의 바이트가 일치한다. 풀어 놓은 최종 r4의 게임 파일 1,967개도 WORK와 전부 해시가 일치한다.
- [런타임 원장](../../../assets/runtime-source-2.4.1.json)에 경로와 SHA-256이 있다. `repositoryPath`는 Git 경로, `sourceBundle`과 `bundlePath`는 인계된 본편 또는 r4 내부 경로다. 이미지 808장은 r4, 추가 초상 3장은 본편에서 가져온다. 이전 2017 분리 시도에서 남은 네 그림은 현재 변경 범위 밖이다.
- 이미 r4가 적용된 WORK라면 QSP 해시를 확인하고 바로 사용한다. `mods/`는 변경 이력이므로 과거 패치를 다시 적용할 필요가 없다. 새 PC에 사용자 편집분이 이미 있다면 해당 WORK를 먼저 백업하고 비교한다.
- 실제 화면 확인은 게임 폴더의 `Jack-o-nine-tails.exe`로 한다. 후작 의뢰의 길거리 목표 복귀와 엘사 전신은 최종 r4 기록에 따라 확인한다. 전체 플레이 재검증은 별도다. [후작 의뢰 수정](../../../records/donatien-goals-fix-20261105/REPORT_KO.md) · [r4 최종 이미지](../../../records/r4-elsa-image-20261105/REPORT_KO.md) · [수동 TC](../../../records/independent-qa-r3-20261105/QA_RESULT_KO.md)

## 새 PC에서 모드툴 열기

1. 저장소 `main`을 clone 또는 pull한다. PowerShell, Node.js 20 이상, Python 3을 준비한다.
2. [모드툴 통합 실행기](../../../tools/local-workspace/Open-Modding-Tools.cmd)를 실행한다. 처음에는 `jack.qsp`가 있는 새 PC의 WORK `game`과 비교용 순정 `game`을 각각 지정한다. PC별 경로는 로컬 설정에 저장한다. 기존 작업 목록이 있는 PC는 [상태 병합 절차](../../modding/WORKSPACE_SYNC_20261009.md)를 따른다.
3. 실행기가 출력한 로컬 주소에서 대사 편집실, 이미지 패치리스트, 이미지 워크숍, 이미지 폴더 비교를 연다. 이미지 패치리스트는 `/catalog`, 캐릭터 목록은 `/catalog?girls=1`이다. 번호 단위 상태 태그·고정 작업 번호·개인 이미지 패치 이력은 함께 보존했다. 캐릭터 등록 JSON을 바꾼 뒤에는 [캐릭터 목록의 인벤토리](../../../tools/girls-image-checklist/README_KO.md)를 재생성한다. 인물 상태 편집기는 [별도 실행기](../../../tools/state-editor/Start-StateEditor.ps1)를 사용한다. 새 PC에서 저장소용 게임 설정이 아직 없다면 `[{ "id": "work", "label": "WORK", "path": "D:/게임/WORK/game/jack.qsp" }]` 형식의 로컬 JSON을 만들어 `-Targets`로 지정한다.

| 도구 | 새 PC에서 여는 방법 | 작업 흐름 |
|---|---|---|
| 잭오나인 캐릭터·씬 이미지 추가 도구 | [설치 안내](../../../tools/character-image-adder/★먼저읽어주세요%20-%20설치안내.txt)에서 Python·Tkinter·Pillow를 준비하고 같은 폴더의 `캐릭터추가.bat` 또는 `씬추가.bat` 실행 | 기존 캐릭터를 같은 창에서 불러온다. 전신을 고르고 얼굴 영역을 드래그한 뒤 저장한다. 전신 795×596 옵션은 입력 화면의 비율과 중심을 기준으로 최종 규격을 맞춘다. 배경 자동 제거를 사용할 때는 rembg와 실행 환경이 추가로 필요하다. |
| AI 캐릭터 이미지 규격 통일기 | [사용법](../../../tools/character-image-normalizer/README_KR.md)과 `START_WINDOWS.bat`. Python 3.10 이상 | AI 모드의 키는 새 PC에서 직접 입력한다. 모델 출력 비율이 다르면 추가 생성 요청 없이 비율을 유지한 크롭·여백을 선택해 출력한다. 결과 PNG와 내보내기 manifest를 확인한 다음 승인된 파일을 WORK에 반영한다. [비율 복구 기록](../../../tools/character-image-normalizer/docs/RATIO_RECOVERY_20261105.md) |

설치 폴더를 옮긴 뒤 캐릭터 도구에서 WORK를 다시 지정한다. 검은 창에서 시작이 멈추면 도구 폴더의 `startup.log`와 `py -3 --version`을 확인한다. 게임 자체는 위의 EXE로 실행한다. AI 키, 브라우저 세션, 런타임 토큰, 개인 세이브, ZIP 및 로컬 복구본은 각 PC에서 따로 관리한다.

새 PC 확인 범위는 통합 실행기의 실제 로컬 주소, 캐릭터 태그 표시, 복사본에 전신과 얼굴 저장이다. 이번 인계에서는 체크리스트 단위 검사 7건, 규격 통일기 핵심 로직 12판정 및 Python 구문이 통과했다. 규격 통일기의 로컬 HTTP HTML 본문 응답 시험은 5초 제한에서 시간 초과가 발생했다. 새 PC 화면과 실제 Mage 생성은 미확인이다.

## 차기 업데이트에서 이어갈 내용

- [사운드 개선](../../NEXT_PATCH_AUDIO_20261106_KO.md). 포맷 조정과 지역 BGM은 기획 단계다. 기존 BGM을 보존·재배치하고 부족한 자리만 제작한다. 화이트 시티는 vatican.wav부터 확인하며, 승인된 30초 Mage 프롬프트는 제작 필요 시 사용한다. 전투 효과음은 승리·패배·처형·석방·치명타 다섯 종이다. 처형과 리치 등장음은 사용자 지정이다. [몬스터 18종의 1~3초 청취 후보](../../../records/audio-planning-20261106/MONSTER_INTRO_SFX_KO.md)에서 나머지를 고른다. 후보 MP3 34개는 사용자가 들어볼 수 있도록 집 PC 프로젝트의 output/jo9-sound-preview-20261106에 저장했다. 이 청취 폴더는 새 PC로 별도 전송해야 한다. 게임 연결은 미진행이며, 몬스터 음원 3개의 실제 길이 3.03~3.45초는 청취 목록에 표시했다.
- [경매 대사 D17](../../../records/auction-dialogue-deferred-20261105/DECISION_KO.md). 길드 판매 경매와 시장 구매 경매를 나눠 재개한다. 추출 문장과 사용자 제공 Gemini 제안은 같은 폴더의 `source/`에서 확인할 수 있다. Gemini 제안은 부분 검토 상태다.
- [기존 보류 결정](../../../records/deferred-discussions-20261024/index.json). 경매 대사, 미번역 과거 설명 등은 각 결정의 재개 조건을 따른다. 하드 행동력·가격 특성 보정, 거래세와 경로 대체 조회는 이미 r4 기준에 들어간 변경이다. [일괄 적용 기록](../../../records/work-pending-batch-20261105/REPORT_KO.md)
- [누적 패치 원칙](../../PACKAGING_POLICY_20261019.md). 다음 정식 패치를 만들 때도 같은 본편 기준으로 이전 필수 변경을 포함한다. WORK와 추적 소스를 기준으로 이어가며 Kor_Full 설치 확인은 사용자가 관리한다.
