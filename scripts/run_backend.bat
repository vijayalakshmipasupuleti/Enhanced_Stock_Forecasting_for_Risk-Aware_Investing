@echo off
echo Starting Backend Server on Port 8081...
cd /d "%~dp0.."
call venv\Scripts\activate.bat
echo Environment activated. Starting Uvicorn...
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8081
pause
