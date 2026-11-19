@REM 질문 메뉴 원고로 게임에 넣을 데이터(question_build_data.json)를 다시 뽑는 실행 파일. 더블클릭한다
@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0.."
set "PY=python"
where py >nul 2>nul && set "PY=py -3"
%PY% tools\question_build_data.py assets\runtime\2.4.1\jack.qsp docs\dialogue-rules\handoff\build
echo.
if errorlevel 1 (echo 실패했습니다. 위 메시지를 확인하세요.) else (echo 데이터를 다시 뽑았습니다.)
pause
