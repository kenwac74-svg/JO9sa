@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Save-JO9-Work.ps1" -Push
if errorlevel 1 pause
