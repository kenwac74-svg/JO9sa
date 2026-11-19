@REM 편집기에서 저장한 원고 폴더나 원고 JSON 파일(여러 개 가능)을 이 파일 위로 끌어다 놓으면 저장소 원고에 덮어쓰고 데이터를 다시 뽑는 실행 파일
@echo off
chcp 65001 >nul
setlocal
set "DST=%~dp0..\docs\dialogue-rules\question-fill"
set "N=0"
if "%~1"=="" (echo 원고 폴더나 원고 JSON 파일을 이 파일 위로 끌어다 놓으세요. & pause & exit /b 1)
:next
if "%~1"=="" goto done
if exist "%~1\*" (
  for %%F in ("%~1\q*_manuscript.json") do call :one "%%~fF"
) else (
  call :one "%~f1"
)
shift
goto next
:one
echo %~nx1| findstr /r /i "^q.*_manuscript\.json$" >nul
if errorlevel 1 (echo 원고 JSON이 아니라 건너뜀: %~nx1 & exit /b 0)
copy /y "%~f1" "%DST%\" >nul
if errorlevel 1 (echo 덮어쓰지 못함: %~nx1 & exit /b 0)
echo 덮어씀: %~nx1
set /a N+=1
exit /b 0
:done
echo.
if "%N%"=="0" (echo 덮어쓴 원고가 없습니다. & pause & exit /b 1)
echo 원고 %N%개를 덮어썼습니다.
call "%~dp0rebuild_question_data.bat"
