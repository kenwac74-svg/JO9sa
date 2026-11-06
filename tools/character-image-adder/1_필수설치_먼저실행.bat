@echo off
cd /d "%~dp0"
echo Installing required Python libraries...
echo   Pillow (required) + rembg, onnxruntime (optional: auto background removal)
echo.
python -m pip install --upgrade pillow rembg onnxruntime || py -m pip install --upgrade pillow rembg onnxruntime
echo.
echo Done. Now run the Korean .bat files to launch the tools.
pause
