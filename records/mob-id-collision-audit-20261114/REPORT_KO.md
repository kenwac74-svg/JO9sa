# 모브 일러 번호 중복·별도 등록 조사

기준: 현재 WORK. QSP e6f24e470cc029cbcc0a8ee1637696b2fd263f45ac776448bb057dbc0c2e29ea

- 별도ID등록후보: 728개
- 등록됨: 822개
- 완전중복·제외: 95개
- 초상보완후등록: 1개
- 참조있음·보류: 1개
- 기존분리기록·보류: 1개

같은 파일명 숫자 접두사는 JSON ID 충돌과 다르다. 기본 전신의 출현 여부는 JSON fullimage 정의를 통해 결정된다. 후보는 기존 ID나 파일을 변경하지 않고 새로운 정의로 등록할 대상으로 추린 것이며, 별도 인물 여부를 그림으로 전수 판별한 목록은 아니다.

0033 예시: 33.json은 short를 가리키고 long은 별도 ID 후보다. 후보 전체는 CSV/HTML에 있다. 파일 삭제·이동·JSON 추가·QSP 변경 없음. 새 번호는 미배정이다.

## 한계
- Registration candidates are not discard candidates.
- Filename anatomy/age labels are metadata; images were not visually inspected. Distinct artwork is not visually established.
- No exact 2.2 distribution supplied; JO9O comparison is provenance only, not proof of 2.2 content.
- Personal SAV custom paths were not inspected; future registration must preserve existing IDs and save paths.
- QSP string hits are conservatively held, not asserted executable. Dynamic fullimage supplier uses JSON definitions and current role image resolver; engine pool internals are not exhaustively proven.
- No IDs allocated. New IDs need generation-range and saved registry review at implementation.

최종 검증: HTML 1,648행·후보 CSV 729행 일치. 기본 전신 1,876개 RGBA 픽셀 해시 대조. 추가 제외 1101_blue_long_young→2277_blue_long_milf, 2222_purple_long_milf→2290_purple_long_milf. 2071_blue_short_milf는 기존 2324 등록 기록으로 보류. 시루 1448 옛 경로는 저장 호환 참조가 있어 보류.
