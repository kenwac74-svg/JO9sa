# 개인실 업무·안개 BGM 수정 — 2026-11-14

사용자 승인: 우선수정 고쳐.

- 외근 gear 판정에 back_wpn을 추가했다. 오른손·왼손·등뒤 중 가장 높은 기존무기등급을 사용한다. 플람베르그4·화룡왕지팡이5 등급표/갑옷/기술조건은 그대로다. 입장검사와 같은 gear를 쓰는 외근수확에 모두 반영된다.
- 기존 duty QSP의 inline style을 css/base.css로 이동하고 QSP는 업무명 span과 상태태그를 분리해 출력한다. 패널폭426px 안에 아이콘·명칭·상태영역을 확보했다. 툴팁은 게임좌표left330/top120,width460/maxheight620으로 고정해 화면위로 벗어나는 구조를 제거했다. 문장과 불가사유는 HTML개행 엔티티로 출력하고 CSS pre-line으로 처리한다. 실제사용자화면은미확인.
- 안개진입 fight_master.mp3는 music_volume과 event_sound=0을 사용한다. 효과음0/음악73에서도73으로 선택되고, 음악0/효과음81에서는0이다. 기존세이브의 fogs_options[2]와 display_options 모든페이지는 알려진fight_master코드만 WAV→MP3/배경음량으로 보정한다. 현재저장된 직접재생이 fight_master인 경우에도 event_sound를0으로 바꾼다. 보유음량값·거주지BGM설계·일반효과음은 변경하지 않는다.

검사: 변경전 실제엔진 gear/audio 두 실패를 재현. 변경후 gear/audio/cache/panel4프로브PASS.4개방·3무기슬롯·등급·갑옷/기술최저조건·효과음음소거·배경음음소거·슬래시/역슬래시/WAV/MP3/띄어쓰기8캐시조합·반복보정동일·다른페이지·무관문구보존·도움말출력 확인. 공식STATIC_PASS(구조/마커/CRLF/등록부/정확재생/재적용/입력보존). 전체출고9경로/실제SAV UI불러오기/청음/화면육안검증과 구분한다.

적용: WORK jack.qsp 및 css/base.css, 추적 assets/runtime/2.4.1/jack.qsp와 assets/css-2.4/base.css, 두런타임원장만 동기화. 변경전QSP/CSS는 gzip바이트왕복검증 보존. 음원·Full·배포ZIP·커밋·푸시 변경 없음. 다음 누적 패치에는 QSP와CSS 모두필요하며 앞선728JSON 신규등록도 포함해야 한다.

현재QSP b1ffec4bb5a288debce7f766e94dd0ad9b197cbc76e77cbeb2c132b3d6cbc4ca
CSS a78557e29fe382601aa4e6d726537b590e5ad2825af6b5a77aefab912cf28f85

수동확인: WORK를재실행하고 개인실업무명/긴도움말을확인한다. 갑옷+등뒤플람베르그,체력/전투A에서 외근선택이되어야한다. 음악음량을올리고효과음0인상태로안개진입음악이들리는지확인한다.

입출력/의존: jo9_room_duty gear는 roomN장비문자열을읽어 jo9_rd_ga/gw를반환상태로쓴다. panel은label/help/why를HTML로출력하고base.css에의존한다. jo9_audio_formats fog_cache는코드문자열을받아알려진경로/음량부분만교체한문자열을반환한다. 로드분기에서호출하며구매/전투를재실행하지않는다. 제거시inline스타일이없는QSP와CSS를따로되돌리지말고동시에대조복원해야한다. 이후QSP수정이있으면전체백업덮어쓰기를하지말고 mods의10개수정만검토한다.
