@echo off
setlocal
cd /d "%~dp0"
start "" /min powershell.exe -Sta -NoProfile -ExecutionPolicy Bypass -File "%~dp0JO9_Detect.ps1"
exit /b 0
