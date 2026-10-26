# 한국어 간소 패치 실행기

변경 식별자: 2026-10-19_korean_patch_launcher / KOREAN_PATCH_LAUNCHER / KOREAN_PATCH_BRIDGE.

소스: tools/release/gui/Installer.cs, installer.manifest, Build-KoreanInstaller.ps1. 실행 파일과 Install-Bridge.ps1, 기존 Install-Patch.ps1·manifest·맵·game payload를 같은 패치 폴더에 둔다. 브리지는 tools/release/Install-Bridge.ps1이다.

| 부분 | 입력·반환 | 역할·부작용 |
| --- | --- | --- |
| NormalizeGameDirectory | 선택 폴더→jack.qsp가 있는 폴더 | 현재 폴더 우선, 없으면 game 하위 확인. 쓰기 없음 |
| QuoteArgument / SameFolder / Failure | 문자열·경로·오류→값 | Win32 인수 인용·자기 패치 경로 거부·오류 객체. 쓰기 없음 |
| InstallerRunner.Run | 패키지 폴더·대상·검사 여부→InstallResult | 같은 폴더의 브리지를 Windows PowerShell -File로 실행하고 UTF8 출력·종료·상태를 확인. 실제 파일 변경은 기존 코어만 수행 |
| LocalizedError / ToJson | 오류 또는 결과→한국어 안내/JSON | 화면 요약과 기술 원문을 구분. 쓰기 없음 |
| InstallerForm / StartOperation | 사용자 선택·버튼→결과 화면 | 비동기 실행, 설치 중 닫기 억제, 폴더 변경 시 이전 검사 초기화. 설정·대화상태·세이브 저장 없음 |
| Program.Main | 무인수 또는 --check/--install 대상 | 무인수는 한국어 설치창. CLI는 동일runner 결과JSON과 종료코드0성공/1코어실패/2입력·준비실패/3결과형식실패 |
| Install-Bridge.ps1 | GameDirectory·DryRun→코어 요약/종료 | 매개변수 값을 그대로 코어에 전달. 경로 문자열을 코드로 평가하지 않음 |

Windows .NET Framework4.5 이상·Windows PowerShell5.1과 기본 .NET 라이브러리에 의존한다. 설치기에 Node·API·인터넷은 필요하지 않다. Build-KoreanInstaller.ps1 -OutputExe <새출력경로>로 컴파일한다. 빌드가 브리지·payload를 자동 배포하는 것은 아니므로 위 동반 파일을 모두 구성해야 한다.

EXE는UI편의만 제공한다. EXE나브리지만분리하면GUI설치가동작하지않고, 코어·manifest·맵을제거하면검사·원본보존·복구기록이동작하지않는다. 기존PowerShell코어를직접실행하는고급경로는README_INSTALL.txt에있다. 새로생성된파일을자동삭제하는복구기능은추가하지않았다.

PS실행정책은자식프로세스에만지정하며시스템정책·레지스트리·백신설정은수정하지않는다. 실제패배수치·특성·대화·게임세이브에는변경없음. 실행기13개회귀/폴더UI/실제stage·재추출실행PASS. 100%Form렌더를확인했으며150/200%는크기시뮬레이션으로만확인했다. 실제모든DPI·보안제품·사용자게임플레이인증은아니다.
