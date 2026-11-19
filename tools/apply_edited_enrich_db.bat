@REM 검토표에서 저장한 enrich-db.json을 이 파일 위로 끌어다 놓으면 저장소 DB에 덮어쓰고 사건 데이터를 다시 뽑는 실행 파일
@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0.."
if "%~1"=="" (echo 저장한 enrich-db.json 파일을 이 파일 위로 끌어다 놓으세요. & pause & exit /b 1)
if /i not "%~nx1"=="enrich-db.json" (echo enrich-db.json 파일이 아닙니다: %~nx1 & pause & exit /b 1)
copy /y "%~f1" "docs\dialogue-rules\db\enrich-db.json" >nul && echo 덮어씀: enrich-db.json
echo.
call "%~dp0rebuild_enrich_data.bat"
