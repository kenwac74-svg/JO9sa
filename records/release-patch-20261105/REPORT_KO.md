# 2.4.1 추가 패치 — 2026-11-05 최종 납품

펠리시티2572 교체까지 포함한 현재 WORK를 기존2.4.1용 수동 덮어쓰기 패치 ZIP으로 제작했습니다. 전체게임이나 설치기는 포함하지 않습니다.

- ZIP: `G:/somi/JO9_2.4.1_Patch_20261105/JO9_2.4.1_Patch_20261105_Manual.zip`
- 192,969,738 bytes, 946항목(런타임942: PNG807/JSON134/QSP1, 한영HTML2/설치안내2). 이미지807주소는 변경779와 필수호환KEEP28이며 새 그림807종을 뜻하지 않습니다.
- SHA-256: `555a373675acb4dc4657a874ec2ca9b56d2102253a8280a3be5c928dff757ac1`
- 기존2.4.1에 game폴더를 합친 뒤 새 이름이 들어온 것을 확인하고 옛JSON25파일명만 수동정리합니다. 세이브·개인설정·Full·이전ZIP·원본JO9O는 수정하지 않았습니다.

## 확인

최종QSP 구조/줄·주석경계, 기준→현재 정확재생/재적용멱등성, 인물JSON등록, 실제FastQSP9경로PASS. ZIP전항목CRC·SHA-256·재추출내용일치, 출시JSON+패치+정리25의결과가현재WORK1158JSON과동일하고숫자ID중복0. 이미지807의PNG해독/검증PASS. 추가독립포장검토17항목PASS.

WORK에서빠져있던추적235파일을보완하고이미지원장104주소(기존변경81+호환KEEP23)를최신화했습니다. 카탈로그기존48메타정보수정·누락33주소추가, 사용자태그보존. 실제게임EXE에서의기존저장/외형/전체분기플레이는미실행으로사용자확인대기이며PLAYTEST_KO.txt에5개TC를담았습니다. 한영자급형HTML은각10미리보기를내장하고헤드리스브라우저로표시·가로넘침없음을확인했으며출력도직접보았습니다.

설치·삭제·백업·게임실행스크립트를동봉하지않았습니다. 기존2.4.1의게임실행EXE를사용합니다. 모드툴·작업후보원화4장·백업·미승인기획·세이브는패치에포함하지않았습니다. 저장소커밋/푸시는하지않았습니다.

검증상세: package-result.json, package-review.json, json-overlay-verification.json, image-validation.json, qa-game/RESULT_KO.md. 재현: stage-and-track.cjs, build-package.py 및inventory/build-package-inventory.cjs.
