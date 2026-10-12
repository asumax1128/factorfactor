@echo off
cd /d "%~dp0"
where py >nul 2>nul
if not errorlevel 1 (
  py -3 start.py --lan
) else (
  python start.py --lan
)
echo.
echo Server stopped. If Python is missing, install Python 3.10 or later from python.org.
pause
