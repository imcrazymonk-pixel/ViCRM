@echo off
echo === Очистка кэша frontend ===
cd /d c:\Users\Andre\Desktop\VPN\Bu_v2\frontend

echo Остановка frontend...
taskkill /F /FI "WINDOWTITLE eq npm*" /IM node.exe 2>nul

echo Очистка кэша Vite...
if exist node_modules\.vite rmdir /s /q node_modules\.vite
if exist dist rmdir /s /q dist

echo Готово!
echo.
echo Теперь запустите frontend заново:
echo   cd c:\Users\Andre\Desktop\VPN\Bu_v2\frontend
echo   npm run dev
echo.
pause
