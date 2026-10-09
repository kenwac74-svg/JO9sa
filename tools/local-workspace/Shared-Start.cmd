@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\local-workspace\Start-Shared-JO9.ps1" -WorkspaceRoot "%~dp0."
if errorlevel 1 pause
