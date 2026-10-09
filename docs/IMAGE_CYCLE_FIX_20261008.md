2026-10-08 이미지 전환 장애 수정 및 검증

장애 코드의 주석 `! Remove the previous layer's switch...`에 홀수 작은따옴표가 있었다. 실제 엔진 계열의 QSP 5.7.0 전처리 코드에서는 주석을 분리하기 전에 따옴표를 묶는다. 그 결과 주석 이후의 END까지 같은 논리 줄에 흡수됐으며 jo9_html IF를 실행할 때 QSP_ERR_ENDNOTFOUND가 발생한다. 작은따옴표를 제거해 수정했다. FUNC/$FUNC, LOCAL, INSTR/MID/STRFIND 인자 수는 이 엔진에서 지원되며 이 결함의 원인이 아니다.

근거: tmp/engine-validation-research/source/engine-base-master-9bb0276be5f94f94f911fab0daeb225cc3c559ec/qsp/codetools.cpp의 qspProcessPreformattedStrings, statements.cpp의 qspSearchEnd 및 실행 전 END 확인. tools/check-image-cycle-syntax.cjs는 해당 전처리 동작을 포팅한 정적 검사다. 실제 엔진 실행을 대체하지 않는다.

준비한 수정:

- 주석의 홀수 작은따옴표 제거. 패치 생성 및 추가 컷 등록 전 따옴표/END 검사 추가.
- Windows 복사 이름만 추가 컷으로 묶음: 원본.png, 원본 (2).png, 원본 (3).png. 기존 원본_2.png 단계 파일은 독립 원본으로 유지하며 원본_2 (2).png도 추가 가능.
- 방 안 캐릭터 오버레이 5개, 별도 배경 출력 8개, display_fullimage 공통 출력에도 최상위 이미지 처리를 적용.
- 버튼을 각 이미지 컨테이너 안의 오른쪽 위에 배치. 기존 집 방 전환 아이콘과 이미지 전환 툴팁 사용.
- 이전 배경의 선택을 유지하고, 버튼은 최상위 이미지에만 표시. 이미지 경로별 선택 배열은 게임 엔진의 일반 세이브 변수 저장 대상.

실제 엔진 시험:

tmp/image-cycle-manual-test에 원본 런처와 game/engine 구조를 복사했다. content는 원본의 이미지 참조이며 css/fonts/json은 별도 복사다. 원본 save/locations/jack.qproj는 연결하지 않았다. 시험 CWD와 FastQSP.ini도 별도이며 종료 자동 저장은 끈다. 따라서 시험의 QSP 생성·세이브 위치는 원본 게임과 분리된다. 게임 실행은 사용자 수동으로 진행한다(활성 저장소 AGENTS.md 5번 및 CLAUDE.md).

- 첫 분리 시험의 직접 engine 실행은 0xc0000142로 시작되지 않았다. 복사 파일은 원본과 해시 일치하며 VC 런타임 누락 근거는 없다. 원본 런처와 폴더 구조로 보완한 후 사용자가 PASS 화면을 확인했다. 실패 DLL 자체는 특정하지 못했다.
- 진단 화면은 실제 QSP 엔진에서 A/B 경로, 최상위 이미지 전환, 선택 배경 유지, 재방문 유지, 기존 집 방 전환을 검사한다. 사용자가 `PASS 화면이 뜸`이라고 확인했다.
- 사용자에게 진단 화면의 정상 시작 화면 확인 링크를 요청한 뒤 `나온다`라는 답변으로 시작 메뉴 정상 표시를 확인했다. 실제 저장·로드 후 컷 유지와 모든 이벤트 화면은 아직 별도 플레이 검증 전이다.

정적·도구 검증:

- 장애 fixture가 MISSING_END로 실패하고 주석 수정 fixture가 통과한다. 검사기 자체 시험 14개 통과.
- 변경 location에서 기존 기준 대비 새 정적 오류가 없다. 기존 게임의 일부 인라인 구조는 이 최소 검사기의 범위 밖이므로 기존 진단과 비교한다.
- 추가 컷 저장 시험: B/C/10 이상 자동 번호, 경로/데이터 검증, 원본 변경 충돌, QSP 왕복과 선언형 패치, 체크리스트 추가, 실패 시 신규 컷 회수 통과. `_2` 단계 파일의 독립 Windows 복사 컷도 검증.

적용 순서:

1. 사용자 수동 시험에서 PASS와 정상 시작 메뉴를 확인한다.
2. 현재 게임 SHA가 복구본 9970deba8a7cdbb57f3900e7dd1857638cdf09ad09b5428a7e4bfdbcb97f8f97인지 확인한다.
3. tmp/image-cycle/mods의 수정 선언형 패치를 tools/apply_mods.ps1로 백업·왕복 검증과 함께 적용한다. 전체 qsrc 재빌드나 기존 mods 전체 재적용은 하지 않는다.
4. 수정 모듈과 검사기를 활성 저장소·게임 설치본에 동기화한다. 3813 서버 재시작 후 추가 컷 info를 읽기 전용으로 확인한다.
5. 본 게임의 주안수 컷 전환·재방문 및 저장/로드를 사용자가 확인한다. 세이브와 기존 이미지는 보존한다.

수정 후보 SHA: 9ed938684d9750e5903be572bddb55a16cf74f919f2f8b6b9744a102c09f1d7d (182 edits, 41 locations). 시험 PASS 때 사용된 진단 SHA는 169732ca63de8aa3cf1ec7498afdd2f89f6e7b84f78fbe6371eece5fe3e31474이며, 동일 helper에 시험용 배경 그룹과 진단 Start를 추가한 파일이다. 이후 최종 후보에는 display_fullimage 반환 처리 한 곳을 보완했으므로 진단 파일과 전체 바이트가 같다는 의미는 아니다.

적용 완료: tools/apply-validated-image-cycle.ps1을 통해 본 게임에 적용했다. 적용 후 SHA는 위 후보와 동일하다. 적용 전 백업은 game/jack.qsp.bak_20261008_063833. 수정 canonical mod를 활성 저장소와 worktree에 저장했으며 장애 버전 .json.disabled도 보존했다. 수정 image-cuts.cjs와 검사기를 활성 tools/text-workshop 및 게임 modtools/text-workshop에 동기화했고 3813 서버만 재시작했다. Origin 5269의 읽기 전용 추가 컷 API가 200 및 characters/Tsyuansu (3).png를 반환해 저장 기능 활성화를 확인했다. 원본 이미지·B컷·기존 세이브 파일은 변경하지 않았다.
