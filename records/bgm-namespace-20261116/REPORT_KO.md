# 전투·경주 BGM 배열 충돌 수정

기존 music 이름 인덱스3021~3024가 Diana/Hilda/Iris/Alexia JSON music 이미지 값에 덮여 경주·투기장·여성전투는 빈 값, 주인공전투는 이미지 경로가 됐다.

BGM22개를 전용 jo9_bgm_track 정적 목록으로 분리하고 #dynamic 재생·직접 이벤트·오디오형식 변환도 같은 목록을 사용한다. 기존 music 숫자형 이미지 데이터는 수정하지 않는다. 기존 jo9_audio_formats 위치에 tracks 분기를 추가해 새 위치는 만들지 않았으며, 소규모 정적 배열1개가 생긴다. ongload가 목록과 저장된 play_music 코드 참조를 즉시 갱신한다. 신규 초기화는 static_base에서 같은 분기를 사용한다.

네이티브 검사: 같은 내부3021~3024 충돌을 만든 기존코드는4개 BGM 값 실패, 수정코드는 신규정의·기존캐시로드·4개 BGM복구·캐릭터 이미지보존 검사 통과. 전투·경주 4개 음원파일 존재와 QSP 바이트왕복 확인. 실제 소리 청음은 사용자 확인이 필요하다. 앞선 중복 CLOSE 크래시 수정은 유지한다.

입력은 음악유형 topLay, 출력은 기존 music_now와 PLAY. 볼륨·재생플래그·보상은 그대로. 제거시 static_base/dynamic/audio_formats/ongload/직접이벤트 참조를 함께 되돌려야 한다. 원본세이브·음원·JSON·배포·커밋푸시 변경없음.

bd2b711ac672796529747dfdd4fabb741960216f13cc3902a8932768b7825a18 → 48bf08a465414aefeeb0cd25a47853403d54751899f2972225b12e0bc8e2cf8e
