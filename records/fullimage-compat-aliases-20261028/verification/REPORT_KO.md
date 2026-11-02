# fullimage PNG 호환 별칭 — 독립 자산 검증

사전·사후 독립 검증을 모두 통과했다. 새 별칭23개 전부 승인된 각 JSON의 `indpack_title` 원본과 전체 바이트·SHA256이 같고, PNG 정상 디코딩 및 경로 접근도 확인했다. 실제 별도 파일이며 하드링크가 아니다. 이 검증 스크립트는 게임 폴더에 쓰지 않았다.

사전 검증에서 이전 감사의 23대상이 모두 아직 없었고, 각 JSON의 현재 `indpack_title` 원본은 정상 PNG였다. 파일명 ID와 fullimage/title 양 경로의 ID가 23개 모두 일치했다.

`preflight.json`에 대상 부재, JSON SHA256, 원본 경로·SHA256·바이트·치수, 같은 ID의 기존 root 후보 SHA256 및 중복 여부를 각23행으로 기록했다. PNG23개 모두 Pillow `verify()`와 전체 디코딩 `load()`를 통과했다. 모두795×596이며 원본 바이트 합계는4,213,447이다. WORK QSP는 `e620353d0db6374ae293c6919d511966c31e2bb68ebd1763bb5a956bec069ba0`였다.

1064 title 원본과 기존 `1064_blond_long_young.png`는 SHA256 `0045daf37839353afcd4a05b94cf3a6c68e724eb589131d0ff894eefe4a5e273`, 241,946바이트로 완전히 같다. 전체23개 중20개 title은 같은 ID의 기존 root 후보와도 바이트가 같았다. 1132·2057·2118의 title과 기존 root 후보는 다르며, 승인된 복사 출처는 각 JSON의 title이다. 이 차이도 사전 기록에 보존했다.

적용 뒤 `verify.py post`로 대상23개를 전부 검증했다. 모두 실존하고 전체 바이트·SHA256·795×596 PNG 디코딩이 원본과 일치하며 합계4,213,447바이트다. 각23개 원본/title·JSON 및 기록한 기존 root 후보와 QSP의 해시가 사전 기록 그대로다. 1064 별칭·title·기존 blond 파일은 셋 모두 같은 바이트다. 세부 결과는 `postflight.json`에23행으로 보존했다.

중복 원장 `G:/somi/JO9sa/assets/compatibility-aliases/2026-10-28_fullimage.json`과 설치 기록 `G:/somi/JO9sa/records/fullimage-compat-aliases-20261028/installation.json`의 각23행을 독립 결과와 대조했다. source/compatibility 경로, SHA256, 바이트, JSON 해시가 모두 일치하고 설치 기록의 원장 해시도 맞았다. 의도적인 중복이라는 원장 표시도 확인했다.

이번 독립 검증은 자산 바이트와 위에서 명시한 보호 파일을 확인했다. 루트가 검사한 다른 보호 파일78개 전체를 재검사한 것으로 확대하지 않는다. QSP/JSON/SAV 수정과 개인 GUI 재현 및 native 게임 전체 검사는 이번 범위에 포함하지 않았다. 진단 QSP나 게임 복제본을 만들지 않았으므로 정리할 임시 게임 사본도 없다.
