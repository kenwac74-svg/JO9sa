@rem 통계 편집기(노예 뽑기 시뮬레이터 포함)를 로컬 서버로 띄우고 브라우저로 여는 실행기
@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PORT=7689

where py >nul 2>nul && (set PY=py -3) || (set PY=python)
%PY% --version >nul 2>nul || (
  echo Python을 찾지 못했습니다. https://www.python.org 에서 설치한 뒤 다시 실행하세요.
  pause
  exit /b 1
)

rem 이미 서버가 떠 있으면 새로 띄우지 않는다
powershell -NoProfile -Command "try{(Invoke-WebRequest -UseBasicParsing http://127.0.0.1:%PORT%/ -TimeoutSec 2)|Out-Null;exit 0}catch{exit 1}" >nul 2>nul
if errorlevel 1 (
  start "JO9 history-lab server" /min %PY% -m http.server %PORT% --bind 127.0.0.1 --directory dist
  timeout /t 2 /nobreak >nul
)

start "" "http://127.0.0.1:%PORT%/"
echo 편집기를 열었습니다: http://127.0.0.1:%PORT%/
echo 끝내려면 작업 표시줄의 "JO9 history-lab server" 창을 닫으세요.
