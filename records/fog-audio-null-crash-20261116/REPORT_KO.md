# 승리 썸업 크래시 수정

2026-11-16. 실제 사용자 덤프2개는 동일한 Qt5Multimedia.dll RVA0x157d0 QMediaPlayer::state+0, ECX0, 읽기주소8의 C0000005다.

새 quicksave는 실제 승리 직전 phase2이며 성기사+보병2명. 썸업은 정상 종료 경로에서 도시 BGM으로 복귀한다. 세이브 music_now와 music[fight]에는 존재하지 않는 girls/scene/Alexia/music 경로가 남았다. 이를 CLOSE한 뒤 spires.mp3를 only로 재생하면 native audio목록의 null 항목을 state()로 읽어 종료된다. spires.mp3 자체가 손상됐다는 결론은 아니다.

최소 네이티브 시험: 잘못된 곡 PLAY→CLOSE→spires exclusive PLAY는 실제 종료코드 -1073741819(C0000005). 같은 시험에서 CLOSE만 빼면 완료표식 통과. 초기시험에서 PLAY등록 없이 CLOSE만 사용한 경우는 재현되지 않아 실제 저장의 재생등록 조건을 포함했다.

수정은 jo9_residence_bgm의 play 분기에서 중복 CLOSE 한 줄만 제거. 기존 PLAY only가 다른 트랙을 정지시키므로 음악 선택·볼륨·보상·전리품·생사 분기를 바꾸지 않는다. 새 저장값 없음. WORK/스냅샷/매니페스트 동기화. c398999185f052802f15d35b7f74cbb9a4fb1812328fe50ca4c130a0367010a7 → bd2b711ac672796529747dfdd4fabb741960216f13cc3902a8932768b7825a18. 선언형 패치 2026-11-16_bgm_null_audio_crash.

사용: 게임을 완전히 종료·재실행해 새 QSP를 읽고 해당 quicksave를 불러 썸업을 확인. 이미 native 목록이 오염된 프로세스에는 QSP재로드만으로 충분하지 않을 수 있다. 실제 전체 승리 화면의 최종 수동 확인은 사용자가 한다. 로드속도/UI 검사로 대체하지 않는다.

제한: 모든 native null lookup을 고친 엔진 재빌드는 아니다. 다른 잘못된 named CLOSE 호출은 별도 위험으로 남는다. 잘못된 음악 경로 출처는 JSON3024_Alexia의 이미지용 music 키가 전투 BGM의 내부 인덱스3024를 덮어쓴 충돌임을 확인했다. 해당 저장구조/JSON이름변경은 이번 한줄 크래시 수정에 섞지 않았다.

엔진 근거: https://gitgud.io/jack-o-nine-tails/engine-base/-/raw/master/gui/audiostream.cpp (exclusive play의 null검사 없는 state), https://gitgud.io/jack-o-nine-tails/engine-base/-/raw/master/gui/fastqspwindow.cpp (stopAudio의 map[] 조회). Qt 내 정확한 심볼만 확정했으며 jack.exe의 근접 export명은 스택 함수명으로 확정하지 않는다.

배포폴더/ZIP/커밋푸시는 변경하지 않았다. 복구시 후속 사용자 편집을 고려해 패치블록만 역검토하고 before전체를 무조건 덮지 않는다.
