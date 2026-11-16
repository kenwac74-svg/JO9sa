# 2.4.2 Full 야간 사전 점검 보고

2026-11-13. **승인 범위 반영·독립 점검 완료 / 배포 준비는 계속 미완료.** 사용자 지시대로 미승인 기능은 적용하지 않고 답변 대기 없이 조사·검증·문서를 진행했다.

현재 WORK/추적QSP/runtime원장: `348e5e27990db9d01a6490b433cb3a396993337f24d8df3625e24da04e6f110a`.

## 완료한 승인 작업

- R03-9 키키모라 선호8종 최저4/5를 반영했다. 실제 엔진75검사와18사례 가격/평가 보존 확인, 공식 재생·멱등·역검증을 통과했다. [기록](<G:/somi/JO9sa/records/release-r03i-kikimora-preferences-20261113/REPORT_KO.md>)
- 확정된2.4.2 Full에 맞춰 게임 버전 표시11곳을 교정했다. 문구/구조/재생/멱등/역검증 완료이며 화면·엔진 재실행은 하지 않았다. 새 기능/세이브 필드는 없다. [R10-1 기록](<G:/somi/JO9sa/records/release-version-display-242-20261113/REPORT_KO.md>)
- 최초 사전감사본2ad5be48에서 승인 모드11개/편집객체32개를 **격리 복사본에 공식 재생한 결과가 현재 WORK와 동일**했다. 역적용도 최초 기준본과 바이트 일치했다. R02~R03 각 당시 실제 엔진 단언 합계527은 이력이며, 최신 전체 게임 회귀나 출고 PASS로 합산하지 않는다. [재생 근거](<G:/somi/JO9sa/records/release-night-preflight-20261113/approved-chain.json>)

## 새로 확인하고 보류한 기능

- R04: 문의3건(anes/ermelinda/noemi)의 목표 조회가 실제 엔진에서0이었다. 기존 의뢰 대조는1이었다. 9고객의 문의·납품 입구도 소스로 대응시켰다. 전체 납품/대기/메뉴 경로를 모두 테스트한 것은 아니다. 제안은 문의 이력용 전역 배열1개를 추가하고 기존 대기 카운터를 쓰는 방식이며 미반영이다.
- R05: 일반11직업이 반말 프로필3을 받는 것을 실제 엔진에서 확인했다. 지정8명 유지와 일반 하녀1/농부2 대조도 확인했다. 일반 직업 강제만 제거하고 알려진 옛 콜백을 갱신하는 제안은 미반영이다.
- 위 관찰은 버전문구 교정 전24614a24에서 했다. 관련4본문이 현재348e5e27과 동일함을 확인했으며 전체 엔진 재검사로 표현하지 않는다. [관찰결과](<G:/somi/JO9sa/records/release-night-preflight-20261113/native-probe-results.json>) · [현행 적용성](<G:/somi/JO9sa/records/release-night-preflight-20261113/probe-applicability.json>)

## 리소스·배포 입력

- 수동 JSON 차이는17→19개다. Diane/Snezhana의 최신 이미지16개가 추가로 확인됐다. JSON1157개 문법오류/숫자ID중복0이며 수동 변경 JSON의 물리적 이미지 참조 부재0이다.
- 부분원장 밖 신규·크기변경 이미지 후보117개, 수동 변경 JSON 참조60개를 보존 후보로 기록했다. 서로 겹치므로 합산하지 않는다. 옛9경로는 지원/퇴역 결정 전 그대로 두었다.
- 호환36관계는 기록해시와 일치했다. 음원136개 형식과 등록61개 존재·크기·SHA가 맞았다. 재생/루프/청감은 별도다. 소리 정리·바이너리 업로드는 하지 않았다.
- game전체47587파일은 개인자료·백업까지 포함한다. 최종 Full 파일수/크기나 완성된 배포 manifest가 아니다. [리소스 상세](<G:/somi/JO9sa/records/release-night-preflight-20261113/RESOURCE_REVIEW_KO.md>)
- 새 README·배포구성 초안과 짧은 실제EXE 확인표를 작성했다. 기존2.4.1설치기/개인 도구상태를 새 Full에 그대로 복사하지 않는 입력안을 정리했다. [배포구성](<G:/somi/JO9sa/records/release-night-preflight-20261113/DISTRIBUTION_DRAFT_KO.md>) · [실제화면 확인표](<G:/somi/JO9sa/records/release-night-preflight-20261113/VISUAL_QA_KO.md>)

## 다음 순서

[승인 대기 목록](<G:/somi/JO9sa/records/release-night-preflight-20261113/APPROVAL_QUEUE_KO.md>)의 Q01부터 한 건씩 확인한다. 답변 없는 항목은 미반영으로 남긴다. 코드·리소스가 고정된 뒤 D21을 마지막으로 개발하고 실제 저장 왕복/CRC·출고·압축 검증을 진행한다. [D21 보충](<G:/somi/JO9sa/records/release-night-preflight-20261113/MIGRATION_REFRESH_KO.md>)

## 변경·검증 경계

이번 야간 단계의 게임 변경은 승인 R03-9와 기확정 버전표시R10-1뿐이다. 리소스/수동JSON/음원·개인SAV·기존Kor_Full·기존ZIP은 변경하지 않았다. 새Full/ZIP/이관기/커밋/푸시/공개업로드는 없다. 재생·관찰용 복사본은 결과를 수집한 뒤 자체 경로를 검증해 정리했다. 다른 작업의 임시폴더는 건드리지 않았다.

재생 검증 스크립트가 복수치환2회를1회만 역적용한 오류를 수정하고 다시 검증했다. 게임 공식 재생은 처음부터 현재본과 일치했으며 이 오류로 게임을 변경하지 않았다. [검증 스크립트 교정 기록](<G:/somi/JO9sa/records/release-night-preflight-20261113/chain-harness-correction.json>)

추가 음원 소스 점검: literal107경로의 부재32개를 옛WAV변환입력31개와 잔존city정의1개로 분류했다. 새실행오류32개로 판정하지 않았다. [분류 근거](<G:/somi/JO9sa/records/release-night-preflight-20261113/audio-source-classification.json>)

## 사용자복귀후Q01승인반영

복합요구및직접고지특별보상/분기기준을확정했고,단순전공등급·글로리아납품을제외해9개연결완료. 새배열0·엔진105검사. 야간의목표미등록관찰은이제수정전근거다. 현재WORK `515d7cda23ff5cfc4118d3de277bd2afeacc8052e001f82d30aee7df8c8edaf7`. [최신기록](<G:/somi/JO9sa/records/release-r04-repeat-goals-20261113/REPORT_KO.md>). 남은승인대기5건,Q02부터.

R04최종본은 089c5be52b032298c8d8cd1fedf447906f0ac0cbc23c24d2a24eda28a668d2d4 이며기존문의배열문자열키9항목을사용한다. 최초숫자키중간본대신최종후보로105검사·공식재생/멱등/역검증을완료했다.

## Q02/R05 승인 반영

일반직업반말제거·8명기본·인물속성ON/OFF·정확구캐시갱신을완료했다. 엔진188검사·공식재생/멱등/역검증·독립코드검토,현재WORK `3ada1bd1e28921edc0d3ae930783a405b68cbde4065aaa912362510032a2c4b5`. 남은승인4건Q03부터. [최신기록](<G:/somi/JO9sa/records/release-r05-voice-policy-20261113/REPORT_KO.md>)

## Q03 승인 반영과 수치 협의

키키모라young형전용검사완료·다른고객유지,엔진72검사. 현재WORK `7db751c87928f4f9d65f208c30834092b6e6886b83c4758dd578ed6707cff239`. 원래승인대기Q04~Q06은미반영이며반말수치제안은협의용이다. [수정](<G:/somi/JO9sa/records/release-r03j-kikimora-young-20261113/REPORT_KO.md>) · [제안](<G:/somi/JO9sa/records/release-r05-voice-policy-20261113/THRESHOLD_PROPOSAL_KO.md>)
