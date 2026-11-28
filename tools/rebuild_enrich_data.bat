@REM 풍부화 사건 데이터와 검토표 다시 뽑기(더블클릭) - launcher (ASCII only)
@echo off
cd /d "%~dp0.."
set "PY=python"
where py >nul 2>nul && set "PY=py -3"
%PY% tools\dialogue_tools.py rebuild-enrich %*
echo.
pause
