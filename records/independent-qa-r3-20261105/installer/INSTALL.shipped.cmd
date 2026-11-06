@echo off
setlocal
chcp 65001 >nul
title JO9 2.4.1 Patch
if not exist "%~dp0INSTALL_HELPER.ps1" goto missing
if not exist "%~dp0PATCH_MANIFEST.json" goto missing
powershell.exe -NoLogo -NoProfile -STA -ExecutionPolicy Bypass -File "%~dp0INSTALL_HELPER.ps1"
set "JO9_INSTALL_EXIT=%errorlevel%"
echo.
if "%JO9_INSTALL_EXIT%"=="0" (echo 설치가 끝났습니다.) else (echo 설치가 완료되지 않았습니다. 위 메시지를 확인하세요.)
pause
exit /b %JO9_INSTALL_EXIT%
:missing
echo ZIP 안에서 직접 실행하지 말고 압축 전체를 먼저 풀어 주세요.
pause
exit /b 1
