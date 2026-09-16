@echo off
cd /d "%~dp0"

:: Deactivate any active virtual environment before blowing it away
if defined VIRTUAL_ENV (
    call "%VIRTUAL_ENV%\Scripts\deactivate.bat"
)

:: Remove the existing environment folder if it exists
if exist marketlens-env (
    rmdir /s /q marketlens-env
)

:: Create a fresh virtual environment
python -m venv marketlens-env

:: Activate it and install backend dependencies
call marketlens-env\Scripts\activate.bat
pip install -r backend\requirements.txt

echo.
echo [OK] Environment successfully reset!
pause

