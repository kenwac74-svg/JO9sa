# 명기 착정 성공·전용 대사·안전일 아이콘 — 2026-10-16

사용자 최종 지시: 안개괴물 착정에서 발견을 차단하는 변경은 취소한다. 기존 발견 로직은 그대로 두고, 현재 명기 상태인 인물이 실제 착정을 진행하면 숙련도와 관계없이 채취 성공으로 처리한다. 전용 대사는 작성하지 않고 정확히 `%명기착정성공`으로 둔다. 이전 확인한 안전일 아이콘 연결도 함께 고친다.

## 적용 범위

- 상태 `virginity = 4` 또는 기존 `sub_tentacles > tentacle_size`이면 수집 성공. 일반 상태는 기존 엄격한 `>` 판정을 유지한다.
- `interaction` 수동 노예·조수와 공용 교육 3곳, `next_day` 일과 수집 6곳, `end_day_screen` 결과 6곳: 성공 조건 총 15곳.
- 전용 대사 9곳: interaction 3곳, end_day_screen 6곳. 명기 분기에서만 `%명기착정성공`을 대입하며, 기존 일반 성공·실패 대사는 보존한다.
- 기존 세이브의 교육 캐시가 옛 분기를 재사용하지 않도록 interaction 진입 시 기존 code_defined 키 `interaction_lesson_tentacles`를 갱신한다. 새 게임 변수는 추가하지 않는다.
- sjm_UI_UIadds의 노예·조수 안전일 이미지 2곳을 기존 승인 파일 `content/pic/ui/Fer_PregS.png`로 연결한다. 새 이미지를 생성하거나 옛 파일을 덮어쓰지 않았다.

## 유지한 범위

발견 자격·확률·이력 및 명령 거절 판정은 변경하지 않았다. 기술 성장 임계값, 자원량 계산, 에너지·피해·경험치·수집 카운터 대입도 보존했다. 숙련도 0인 명기의 수집 카운터 증가량도 원래 숙련도 기반 수식을 따른다. 성공 여부만 확장했으며 별도 배수나 수량 보정을 만들지 않았다.

## 검증

- 새 검사는 원본에서 기능 미구현으로 실패하는 것을 먼저 확인했다.
- 두 대상 각각 8개 검사 통과: 15개 실제 판정식을 상태·숙련도·크기 조합으로 검증, 9개 문구의 대사 인식, 캐시 갱신, 원본 보존.
- 기존 QSP 적용 도구·대사 코어·상태 레지스트리 관련 회귀 37개 통과. 두 실제 설치본 재검사 16개 통과.
- 컨테이너 왕복과 26개 edit 전체 역치환 후 원본 바이트 일치 확인. 변경된 본문은 interaction/next_day/end_day_screen/sjm_UI_UIadds 4개뿐이다.
- 독립 검토에서 추가 조치사항 없음. 게임 클라이언트를 실행하거나 실제 플레이 화면을 검증하지는 않았다.
- 대사 편집기 또는 QGen에서 `%명기착정성공`을 검색하면 9개 편집 위치를 찾을 수 있다.

## 대상과 백업

- work: G:\somi\Jack O Nine Tails v2.4_work\game\jack.qsp
  - 적용 전: dc9668a474213ddbb349ddac821e2a96fc4c912cb4bc23b57aaff41ea2be98ec
  - 적용 후: c037516a65b2f24606f2b9171d6e1292c32c7d38fcd0b2804dc430829a064795
  - 백업: G:\somi\Jack O Nine Tails v2.4_work\game\jack.qsp.bak_meiki_milking_20261016_055503276Z
- full: G:\somi\Jack O Nine Tails v2.4 Kor_Full\game\jack.qsp
  - 적용 전: 3d8fd3c0439b187b7afc220f9c6d12b06e9837561e1442ffb820a75a51006b9b
  - 적용 후: 1e3ef5e1a8ebf434168bdb0b337d128380744ac94ab2799c6ff9b0e4fca5ef65
  - 백업: G:\somi\Jack O Nine Tails v2.4 Kor_Full\game\jack.qsp.bak_meiki_milking_20261016_055503276Z

플레이 파일은 적용 직전 최신 사용자 저장본에서 패치했다. Work를 Full로 복사하지 않았으며 각 설치본의 원래 차이를 보존했다. QGen에 이전 파일을 열어 둔 상태라면 저장 전에 갱신된 jack.qsp를 다시 열어야 한다.

패치: mods/2026-10-16_meiki_tentacle_success_safe_icon.json
검증: docs/qa/2026-10-16_meiki-tentacle-success-safe-icon.json
