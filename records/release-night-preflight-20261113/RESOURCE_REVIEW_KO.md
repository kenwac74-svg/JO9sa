# WORK 리소스 갱신 점검

현재 QSP: `348e5e27990db9d01a6490b433cb3a396993337f24d8df3625e24da04e6f110a`. 읽기 전용 점검이며 파일 이동·삭제·수동 JSON 덮어쓰기·음원 복사·최종 원장 동결을 하지 않았다.

| 항목 | 현재 확인 | 남은 일 |
|---|---|---|
| WORK/game 메타데이터 | 47,587파일 | 개인자료/캐시까지 포함한 수치이며 배포 파일 수가 아님 |
| JSON | 1157개 파싱, 문법오류0, 숫자 파일ID 중복0 | 인게임 생성/개인SAV 전체 확인과 구분 |
| 수동 JSON 차이 | 소스와19개+WORK전용2339_yagisuna1개 | WORK 보존 후보 검토, 옛2339.json 동시배포 금지 |
| 미등록 이미지 후보 | 최초101개 모두 존재, 새 후보117개 | Diane/Snezhana16개 추가 확인. 동일크기 전수변경 검사는 아님 |
| 수동 JSON 원장 밖 참조 | 60개, 실제파일 모두 존재 | 본편대비 신규46/변경12/동일2, 최종 입력에 연결 |
| 부분원장5304 | 부재9, 크기차이29 | 19JSON+9초상+1UI 차이, 승인 교체/퇴역 대조 |
| 지정 호환관계 | 36관계가 기록 해시와 일치 | 2071의 용도별 차이는 기록대로 유지, 옛15호환 전체를 증명한 결과는 아님 |
| 음원 | 37MP3·99WAV, WAV 모두 PCM tag1 | 실제 재생·루프·전체 전투 청감은 미확인 |
| 등록 음원 | 61개 존재·크기·SHA 일치 | 음원 바이너리 Git 업로드0, 정리/이동0 |

## 누락처럼 보이는 참조 구분

JSON 리터럴 부재210개 중4개는 미사용 템플릿,206개는 복장 주소의 기본 전신 대체파일이 존재하는 경우다. `jo9_seed_role_images`의 대체 조회 경로와 함께 분류했다. **210개의 새 실행 오류로 판정하거나 파일을 자동 복원하지 않는다.** 실제 각 인물 화면은 별도 육안 확인 대상이다.

원장 부재9개는 아래와 같다. 현재 올바른 새 그림이 있어도 옛 저장 주소 지원을 별도로 결정해야 하므로 지금 퇴역시키지 않는다.

- content/pic/girls/1207_green_long_young_sepia.png
- content/pic/girls/1212_blue_long_young_sepia.png
- content/pic/girls/face0177_black_short_loli.png
- content/pic/girls/face0222_blond_long_loli_sepia.png
- json/slaves/2339.json
- content/pic/girls/full/2341_brown_short_milf.png
- content/pic/girls/full/cloth/2341_brown_short_milf.png
- content/pic/girls/full/mistress/2341_brown_short_milf.png
- content/pic/girls/full/secretary/2341_brown_short_milf.png

## 원본 음악 보존 확인

원본 JO9O의 `content/snd/chinatown.wav`와 WORK의 `content/snd/chinatown.mp3`를 확인했다. 별도 `china.*`·`town.*` 파일은 두 폴더에서 찾지 못했다. 원본을 변경하지 않았고, 사운드 정리 취소 지시를 유지한다.

## 입력 후보와 개인자료

- other-review: 343파일, 526,348,772바이트
- private-authoring: 3,127파일, 2,254,414,241바이트
- runtime-images: 41,546파일, 15,597,629,602바이트
- personal-cache-backup: 639파일, 4,663,456,040바이트
- runtime-audio: 136파일, 218,152,358바이트
- engine: 70파일, 93,090,575바이트
- runtime-json: 1,177파일, 2,844,288바이트
- optional-modtools: 549파일, 394,778,872바이트

이 분류는 포장 검토 후보이며 최종 Full 용량/명세가 아니다. `__JO9_ImageBackups`269개는 런타임 후보에서 제외해 개인 백업으로 분류했지만 실제 파일은 그대로 두었다. 이미지 편집 원본·직접 제작자료·유일 복구본을 삭제하지 않는다.

[상세 데이터](<G:/somi/JO9sa/records/release-night-preflight-20261113/asset-refresh.json>) · [반영하지 않은 보존 후보](<G:/somi/JO9sa/records/release-night-preflight-20261113/work-resource-candidates.json>)


## 음원 호출 문자열 추가 확인

QSP에서 literal 음원경로107개를 대조했다. 물리 파일이 없는32경로 중31개는 옛 WAV를 새 MP3로 변환하는 **입력 비교 문자열**이다. 나머지 city.mp3는 옛 음악 정의/변환 결과에 남아 있고 원본 JO9O에도 city 파일은 없다. 현행 소스의 직접 topLay=city 대입은 찾지 못했으며 도시 콜백은 옛 city 상태를 거주지 재생목록으로 교체한다. 전체 옛세이브 캐시 경로·실제 청감까지 검증한 것은 아니다. city 파일을 임의 생성하거나 코드를 변경하지 않았다. [상세 분류](<G:/somi/JO9sa/records/release-night-preflight-20261113/audio-source-classification.json>)
