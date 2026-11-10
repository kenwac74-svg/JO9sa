# 업무·장부 효과음 3개 WAV 변환·연결

2026-11-10 사용자 승인: 세 효과음을 WAV로 바꾸고 게임에 연결한다. 사운드 파일은 올리지 않는다.

## 적용 결과

현재 WORK content/snd에 bad_secen.wav, great-success.wav, ledger.wav를 설치했다. 모두 PCM signed 16-bit little-endian / 44,100Hz다. 원본과 채널 수를 유지했다(bad_secen 2채널, 나머지 1채널). MP3 원본을 디코딩한 PCM 데이터와 WAV의 PCM 해시가 같으며 음량·필터·길이를 변경하지 않았다. 원본 MP3는 보존했다.

- jo9_duty_text 보고: 빈손/부상은 bad_secen.wav, 초대박은 great-success.wav. 겹치면 기존대로 빈손/부상 우선.
- main_screen 10일 장부: ledger.wav. 기존 장부 열기 조건, sound_on와 sound_volume을 유지했다.

최신 WORK 51085e56449b7e78ba894ba1e4bf85aec11b7c644b408dcc9914024f80b3240a를 기준으로 수정했다. 결과는 d566d3e9edcc5fcb47c02a350ea1640340ee316777fbbcd87718aa786357d161다. 293개 location 중 위 두 본문만 바뀌었고, 직전에 사용자가 저장한 대사를 포함한 다른 필드는 바이트 그대로다.

## 구조·입출력·의존성과 제거 영향

mods/2026-11-10_duty_ledger_sfx_wav.json은 위 두 PLAY 문장의 확장자와 provenance 주석만 수정한다. tools/apply_mods.ps1이 대상 QSP와 이 패치만 든 폴더를 받아 백업·왕복 검증 후 적용한다. 재적용은 쓰지 않는다. 기존 업무 보고/장부 호출자와 게임 변수는 추가하거나 바꾸지 않았다. WAV를 지우면 해당 효과음은 재생되지 않는다. 복구 시 원본 MP3와 현재 후속 변경을 대조하고 두 PLAY 경로를 되돌려야 한다.

task.cjs의 prepare는 최신 WORK 읽기·복구본·후보/패치/진단 생성, convert는 로컬 FFmpeg 변환·원본 대비 검증, probes는 진단 재생성, install은 검사 통과 및 최신 WORK 해시 일치를 확인한 뒤 로컬 WAV·QSP·추적 소스를 갱신한다. verify는 실제 설치 파일·영향 범위·PCM 해시를 다시 확인한다. 입력이 준비 시점과 다르면 설치를 중단하므로 기존 WORK를 덮어쓰지 않는다. 재현은 prepared.json의 이전 기준과 원본 MP3가 필요하다.

assets/runtime/2.4.1/jack.qsp 및 runtime-source-2.4.1.json을 최신 WORK와 맞췄다. 로컬 assets/content/snd에도 WAV 사본이 있으나 기존 .gitignore의 음원 제외 규칙이 적용된다. Git 추적에는 재생 코드·경로·해시만 남는다. 추적 음원 0개이며 커밋·푸시·업로드·Full 동기화는 하지 않았다.

## 검증

- FFprobe: 세 파일 실제 PCM WAV, 16bit/44.1kHz, 채널 보존. FFmpeg 전체 디코딩과 원본 대비 PCM 해시 일치.
- QSP 왕복·줄바꿈·주석 경계 정상, 293개 location 유지. 공식 적용기의 정확 재생 및 재적용 무변경 확인.
- 실제 FastQSP 엔진: 업무 12조건 + 장부 2조건의 음소거/우선순위/경로/볼륨 보존, 세 WAV PLAY 호출 총 4개 진단 완료. 호출 검사는 음량 0의 격리 진단이며 실제 청취나 정상 세이브 플레이를 대신하지 않는다.
- 기존 MP3 경로의 WAV 요구 검사는 실패했고, 수정 뒤 통과했다. 진단 실패 뒤 완료 메시지가 찍히지 않도록 실패 플래그와 14조건 실행 수를 확인했다.
- initial 진단 두 기록도 보존: 처음 도우미는 실패 메시지 뒤 완료 마커를 먼저 읽어 오판했고, 한 진단 파일명에 밑줄이 있어 실행기 검증에서 거부됐다. 진단 자체를 보완한 최종 native-before.json/native-after.json 및 각 엔진 로그를 기준으로 한다.

설치·해시·변환·엔진 결과는 prepared.json, converted.json, installed.json, verification.json, native-after.json을 따른다. FFmpeg는 기존 검증 도구 G:/Codex/tools/ffmpeg-9.0.2를 재사용했다.

## 복구·임시자료

이전 최신 WORK는 G:/somi/JO9_work_backups/duty-wav-20261110-51085e56449b/work-before.qsp에 보존했다. 갱신 전 추적 스냅샷은 source-before.qsp.gz, 원장은 runtime-source-before.json이다. 실제 적용기의 백업 위치는 apply.log에 있다. 후속 수동 수정이 있으면 무조건 이전 QSP를 덮어쓰지 말고 이번 두 줄만 대조한다.

G:/Codex/tmp/jo9-duty-sfx-wav-20261110의 시험 QSP·패치 재생본·변환 중간 WAV·복제 WAV·로그는 검증 후 정리했다. 원본 MP3, 최종 WORK/로컬 assets WAV, 복구본·재현 코드·보고서는 보존한다.
