@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo JO9 image tool - starting...
echo Folder: "%CD%"
if not exist "launch_tool.py" goto missing_launcher
where py >nul 2>nul
if errorlevel 1 goto use_python
echo Checking Python launcher...
py -3 -c "import sys; print(sys.executable)"
if errorlevel 1 goto use_python
py -3 -X utf8 -u "launch_tool.py" add_scene.py
goto finished
:use_python
echo Checking python command...
where python >nul 2>nul
if errorlevel 1 goto missing_python
python -X utf8 -u "launch_tool.py" add_scene.py
goto finished
:missing_launcher
echo Missing launch_tool.py. Extract the complete updated ZIP.
goto finished
:missing_python
echo Python 3 was not found. Install Python and enable Add Python to PATH.
:finished
echo.
echo If the window did not open, send startup.log or the console text.
pause
