@REM 풍부화 DB(enrich-db.json)로 게임에 넣을 사건 데이터(enrich_build_data.json)와 검토표를 다시 뽑는 실행 파일. 더블클릭한다
@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0.."
set "PY=python"
where py >nul 2>nul && set "PY=py -3"
%PY% tools\enrich_build_data.py
if errorlevel 1 goto fail
%PY% tools\enrich_db_html.py
if errorlevel 1 goto fail
echo.
echo 사건 데이터와 검토표를 다시 뽑았습니다.
pause
exit /b 0
:fail
echo.
echo 실패했습니다. 위 메시지를 확인하세요.
pause
exit /b 1
