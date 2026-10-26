@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0Remove-Old-Dona-Json.ps1" %*
set "cleanup_result=%errorlevel%"
echo.
pause
exit /b %cleanup_result%
