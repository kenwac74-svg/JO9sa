# 각본 저장·미리보기 수정

## 원인

WORK QSP가 이전 선택 이후60f8bc40…에서ae90d10b…로 바뀌어, 오래된 구간의 저장은 서버에서 거부됐다. 실제 브라우저에서 오류 재현. 종전 미리보기는 생성 단추 없는 접이식 빈칸이고 저장 성공 뒤에만 채웠다. 저장은 브라우저 다운로드만 요청하며 실제 저장 완료/경로는 확인하지 않았다.

## 동작

각본 미리보기는 별도로 내용을 생성하며 파일을 저장하지 않는다. 각본 파일 저장은 같은 경로 탐색/분기 선택을 거쳐 UTF-8 BOM/CRLF TXT를 편집실 runtime/script-exports에 생성하고, 저장된 전체경로와 같은 본문을 열린 미리보기에 표시한다. 파일은 고유ID로 생성하며 기존파일 덮어쓰기 금지. TXT 별도 내려받기로 이전 브라우저 다운로드 기능도 유지한다. 탭 새로고침 시 마지막 결과를 복원한다. QSP 변경 시 구간을 해제하고 재검색/재지정 안내. 기존 게임상태·대사 원문을 수정하지 않는다.

## 검증

회귀5개는 실제 UTF-8파일/경로/충돌방어, 저장 없는 미리보기, 저장본문과 재개방 복원, 구 QSP 실패, 분기 선택 후 작업종류 유지를 검사한다. 기존 구간/각본/공유흐름/정적UI 포함25개 통과. 복원 안내 마지막 수정 후 새5개도 통과. 실제WORK1311의1–2단계 미리보기→저장→새로고침 복원 확인, TXT565자와 DOM미리보기 동일, 콘솔오류0. proof JSON/PNG와 verification.json 참조. 실제 테스트TXT는 경로를 확인할 수 있도록 보존했다(원문 대응JSON도 유지).

## 범위·복구

소스/WORK index.html, script-range.js, server.cjs 및 신규 range-output.cjs만 구현 변경. before.json과 before/<sha>.gz에 직전복구본, verification.json에 적용후해시. 되돌릴 때 이후 사용자수정을 먼저 비교하고 신규모듈 의존성을 함께 복원한다. 서버 변경 복구 시3813 편집실서버만 재시작한다. 독립검사는 node --test range-output.test.cjs script-range.test.cjs script-export.test.cjs workshop-shared-flow.test.cjs workshop-native-layout.test.cjs.

QSP/체크상태는 작업시작 해시 보존, 음원/Full/세이브/커밋푸시 변경 없음. 임시후보사본은 검증 후 정리.
