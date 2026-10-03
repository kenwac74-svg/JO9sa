@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-JO9-Text.ps1"
if errorlevel 1 pause
