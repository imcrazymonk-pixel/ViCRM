@echo off
chcp 866 >nul
title ViCRM Launcher
setlocal EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
set "LOGS_DIR=%SCRIPT_DIR%logs"
set "PYTHON_CMD=python"

where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Python not found in PATH!
    echo Install Python 3.8+ from https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Node.js not found in PATH!
    echo Install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

:MENU
cls
echo.
echo +========================================+
echo         ViCRM - Launcher
echo +========================================+
echo.
echo   1. Start ViCRM (Backend + Frontend)
echo   2. Start Backend only
echo   3. Start Frontend only
echo   4. Open logs folder
echo   5. Exit
echo.
echo ==========================================
set /p CHOICE=Select action (1-5): 

if "%CHOICE%"=="1" goto START_ALL
if "%CHOICE%"=="2" goto START_BACKEND
if "%CHOICE%"=="3" goto START_FRONTEND
if "%CHOICE%"=="4" goto OPEN_LOGS
if "%CHOICE%"=="5" goto EXIT
goto MENU

:START_ALL
cls
echo.
echo +========================================+
echo   Starting ViCRM...
echo +========================================+
echo.
echo [0/3] Clearing Python cache...
if exist "%SCRIPT_DIR%backend\__pycache__" rmdir /s /q "%SCRIPT_DIR%backend\__pycache__"
if exist "%SCRIPT_DIR%backend\services\__pycache__" rmdir /s /q "%SCRIPT_DIR%backend\services\__pycache__"
if exist "%SCRIPT_DIR%backend\routers\__pycache__" rmdir /s /q "%SCRIPT_DIR%backend\routers\__pycache__"
echo [1/3] Starting backend (FastAPI:8002)...
start "ViCRM Backend" cmd /k "cd /d %SCRIPT_DIR%backend && echo Backend running on http://localhost:8002 && %PYTHON_CMD% main.py"
timeout /t 3 /nobreak >nul
echo [2/3] Starting frontend (Vite:5173)...
start "ViCRM Frontend" cmd /k "cd /d %SCRIPT_DIR%frontend && echo Frontend running on http://localhost:5173 && npm run dev"
echo.
echo +========================================+
echo   Done!
echo +========================================+
echo.
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8002
echo.
echo   Close console windows to stop services
echo.
pause
goto MENU

:START_BACKEND
cls
echo.
echo +========================================+
echo   Starting backend...
echo +========================================+
echo.
echo   Port: 8002
echo   Log:  logs\backend.log
echo.
echo   Press Ctrl+C to stop
echo.
cd /d "%SCRIPT_DIR%backend"
%PYTHON_CMD% main.py
goto MENU

:START_FRONTEND
cls
echo.
echo +========================================+
echo   Starting frontend...
echo +========================================+
echo.
echo   Port: 5173
echo   Log:  logs\frontend.log
echo.
echo   Press Ctrl+C to stop
echo.
cd /d "%SCRIPT_DIR%frontend"
npm run dev
goto MENU

:OPEN_LOGS
if exist "%LOGS_DIR%" (
    explorer "%LOGS_DIR%"
    echo.
    echo [OK] Logs folder opened: %LOGS_DIR%
) else (
    echo.
    echo [WARN] Logs folder does not exist yet
    echo   Start services to create logs
)
timeout /t 2 /nobreak >nul
goto MENU

:EXIT
cls
echo.
echo +========================================+
echo   ViCRM closed
echo +========================================+
echo.
timeout /t 2 /nobreak >nul
exit /b 0