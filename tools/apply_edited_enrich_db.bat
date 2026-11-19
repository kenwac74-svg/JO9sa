@REM 풍부화 enrich-db.json을 끌어다 놓으면 덮어쓰고 데이터 다시 뽑기 - launcher (ASCII only)
@echo off
cd /d "%~dp0.."
set "PY=python"
where py >nul 2>nul && set "PY=py -3"
%PY% tools\dialogue_tools.py apply-enrich %*
echo.
pause
