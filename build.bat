@echo off
chcp 65001 >nul
cd /d "%~dp0"
title LAN Dosya Paylaşım - EXE Derleme

echo.
echo ================================
echo   LAN Dosya Paylaşım - EXE Derleme
echo ================================
echo.

if not exist "node_modules" (
    echo [1/3] Bağımlılıklar yükleniyor...
    call npm install
    echo.
) else (
    echo [1/3] pkg kontrol ediliyor...
    call npm install
    echo.
)

echo [2/3] EXE derleniyor (birkaç dakika sürebilir)...
call npm run build
if %errorLevel% neq 0 (
    echo.
    echo [HATA] Derleme basarisiz.
    goto :end
)
echo.

echo [3/3] dist klasörüne ornek .env, config ve start-exe.bat kopyalaniyor...
if not exist "dist\.env" copy .env.example "dist\.env" >nul 2>&1
if not exist "dist\config.json" copy config.json "dist\config.json" >nul 2>&1
if not exist "dist\shared" mkdir "dist\shared" 2>nul
copy /y "%~dp0start-exe.bat" "dist\start-exe.bat" >nul 2>&1

echo.
echo ================================
echo   Derleme tamamlandi.
echo   EXE: dist\lan-file-share.exe
echo ================================
echo.
echo Kullanim: dist klasorunu istediginiz yere kopyalayin.
echo   - lan-file-share.exe
echo   - .env (giris ve port ayarlari)
echo   - config.json (paylasim klasoru)
echo   - shared\ (paylasilacak dosyalar)
echo.
echo EXE'yi calistirmak icin: dist\start-exe.bat  veya  dist\lan-file-share.exe
echo (.env ve config.json exe ile ayni klasorde olmali.)
echo.

:end
echo Cikis icin bir tusa basin...
pause >nul
