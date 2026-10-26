@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-Image-Folder-Review.ps1"
if errorlevel 1 pause
