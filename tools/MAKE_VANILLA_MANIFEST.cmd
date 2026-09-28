@echo off
rem 순정 ZIP을 이 파일 위로 끌어다 놓으면 같은 폴더에 vanilla_manifest.json을 만든다
if "%~1"=="" (echo 순정 ZIP 파일을 이 cmd 파일 위로 끌어다 놓으세요.& pause & exit /b 1)
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "%~dp0make_vanilla_manifest.ps1" -Source "%~1" -Out "%~dp0vanilla_manifest.json"
pause
