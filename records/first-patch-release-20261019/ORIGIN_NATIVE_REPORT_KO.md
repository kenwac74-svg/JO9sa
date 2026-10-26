# 통합 후보 배경 대사 실제 엔진 검사

QSP 5.7.0 DLL과 기존 `outputs/combat-trait-innate-20261019/native-run.ps1`을 32비트 PowerShell에서 재사용했다. 대상은 통합 후보 `91db7a7b7a7205586e126b6d530c6efcef03e0f0da1c3a0be2dfca2ca4a12588`이며 최종 결과는 **PASS**이다. 실패 0, 엔진 오류 0이다.

| 검사 | 실제 실행 범위 | 결과 |
|---|---|---:|
| 저장 배경 152키 → 표시 그룹 | 후보의 실제 `#static_txt`, 실제 `$voice_native_stored`; `$voice_native`만 그룹 인자 반환 stub | 152/152 |
| 원래 대사 조합 | 세계 medieval3·가족 businessman·직업 academy, 각 어조 1/2/3에서 기존 helper를 3회씩 실행 | 27/27 |
| 세 표현 선택·출력 | reserved/direct/hesitant 각각의 실제 선택 이력과 해당 조각이 반환문에 포함되는지 확인 | 27/27 |
| 실제 말투 판정 | 직업 maid/farmer/brigand로 실제 `$voice_profile`의 plain_1/2/3 확인 | 9/9 |

152키 입력은 Work `81a41985…`와 후보 사이에서 저장 식별문 152개가 모두 동일함을 먼저 확인한 뒤 실제 배열 값을 사용했다. 원문 전체를 진단 파일이나 stdout에 복제하지 않았다. routing 검사의 stub은 `$voice_native` 한 변수에만 잠시 적용하고 원본을 복원했다. 이어지는 27회 검사는 실제 `$voice_native`, actor/profile/picker/이력 처리와 후보 조각 데이터를 그대로 사용했다. 후보 함수나 데이터, 선택 후보를 진단용으로 수정하지 않았다. 별칭만의 7경우 검사는 독립 검토자의 `../review-independent.json`에 별도로 기록한다.

QSP 실행 블록은 56개, 최대 4,484자이다. `result.json`은 요약, `manifest.json`은 범위, `stdout.log`는 최종 실행 로그, `code.json`은 CRLF 진단 코드다. 재현은 Node로 `build.cjs` 실행 후 `C:/Windows/SysWOW64/WindowsPowerShell/v1.0/powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File run.ps1` 순서다.

게임·저장소·세이브에는 쓰지 않았다. 변경되는 것은 별도 DLL 런타임 메모리의 QA 변수와 기존 대화 선택 이력뿐이며 종료 시 폐기된다. 실제 저장 파일 로드·공식 클라이언트 UI·slave1 관계 대화까지 실행한 검사로 해석하지 않는다. 그 범위는 통합자의 기존 세이브/클라이언트 검사와 결합해야 한다.
