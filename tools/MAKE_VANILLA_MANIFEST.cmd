@echo off
rem Drag the vanilla Jack O Nine Tails v2.3 ZIP (or game folder) onto this file.
if "%~1"=="" (echo Drag the vanilla ZIP or game folder onto this file.& pause & exit /b 1)
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "%~dp0make_vanilla_manifest.ps1" -Source "%~1" -Out "%~dp0vanilla_manifest.json"
pause
