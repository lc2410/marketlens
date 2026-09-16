@echo off
cd /d "%~dp0"

set "DIVIDER========================================="

echo %DIVIDER%
echo 1. Starting Local Oracle Database
echo %DIVIDER%
docker compose down -v
docker compose up -d

echo.
echo %DIVIDER%
echo 2. Waiting for Oracle to boot (~60-90s)...
echo %DIVIDER%
:LOOP
docker logs marketlens-oracle-local 2>&1 | find "DATABASE IS READY TO USE!" >nul
if errorlevel 1 (
    timeout /t 5 /nobreak >nul
    goto LOOP
)
echo [OK] Database is fully booted!

echo.
echo %DIVIDER%
echo 3. Creating ADMIN User
echo %DIVIDER%
python database/scripts/create_db_admin_user.py

echo.
echo %DIVIDER%
echo 4. Testing Connection
echo %DIVIDER%
python database/scripts/db_connection_test.py

echo.
echo %DIVIDER%
echo 5. Populating Database with Market Data
echo %DIVIDER%
python database/scripts/update_db.py

echo.
echo [OK] Local Environment Setup Complete!
pause

