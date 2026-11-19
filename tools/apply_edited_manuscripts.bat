@REM 편집기에서 저장한 원고 폴더를 이 파일 위로 끌어다 놓으면 저장소 원고에 덮어쓰고 데이터를 다시 뽑는 실행 파일
@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0.."
if "%~1"=="" (echo 편집기 폴더를 이 파일 위로 끌어다 놓으세요. & pause & exit /b 1)
if not exist "%~1\q1111_manuscript.json" (echo 원고 JSON이 있는 폴더가 아닙니다: %~1 & pause & exit /b 1)
for %%F in ("%~1\q*_manuscript.json") do (copy /y "%%~fF" "docs\dialogue-rules\question-fill\" >nul && echo 덮어씀: %%~nxF)
echo.
call "%~dp0rebuild_question_data.bat"
