@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0payload\JO9_RestoreVanilla.ps1" -GameRoot "%CD%"
echo.
pause
