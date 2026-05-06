@echo off
echo Starting Risk-Aware Stock Forecasting System...
cd /d "%~dp0.."
call venv\Scripts\activate.bat
python main.py
pause
