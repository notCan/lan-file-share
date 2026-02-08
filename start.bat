@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title LAN Dosya Paylaşım (CTRL+C ile kapat)

cd /d "%~dp0"

echo.
echo ================================
echo   LAN Dosya Paylaşım Başlatılıyor
echo ================================
echo.

if not exist "node_modules" (
    echo Bağımlılıklar yükleniyor...
    call npm install
    echo.
)

if not exist ".env" (
    echo .env dosyası bulunamadı. .env.example kopyalanıyor...
    copy .env.example .env
    echo .env oluşturuldu. Kullanıcı adı ve şifrenizi .env içinde düzenleyip tekrar çalıştırın.
    pause
    exit /b
)

echo IP adresi bulunuyor...
echo.

set IP=
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr "IPv4"') do (
    if not defined IP (
        set IP=%%A
    )
)
set IP=!IP: =!

for /f "delims=" %%P in ('node -e "require('dotenv').config();console.log(process.env.PORT||3000)"') do set PORT=%%P
set PORT=!PORT: =!

set QR_URL=http://!IP!:!PORT!

echo ================================
echo   Diğer cihazda aç:
echo   http://!IP!:!PORT!
echo ================================
echo.
echo QR KOD (telefonla okut):
echo.

node -e "require('qrcode-terminal').generate('!QR_URL!', { small: true });"

echo.
echo ================================
echo   Sunucu çalışıyor...
echo   Kapatmak için CTRL + C
echo ================================
echo.

node server.js

echo.
echo ================================
echo   Sunucu durduruldu
echo   Pencereyi kapatmak için bir tuşa basın
echo ================================
pause
