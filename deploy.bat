@echo off
title Deploy CKG Sekolah ke Cloudflare
color 0A
echo ========================================================
echo    DEPLOY PEMBARUAN CKG SEKOLAH KE CLOUDFLARE
echo ========================================================
echo.
echo Sedang menyiapkan deploy ke https://ckgbankot.web.id/ ...
echo.
cd /d "%~dp0"

echo Menjalankan: npx wrangler deploy
echo.
call npx wrangler deploy

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo    BERHASIL! Deploy ke Cloudflare Sukses!
    echo ========================================================
    echo.
    echo Silakan buka browser Anda di https://ckgbankot.web.id/
    echo dan tekan Ctrl + F5 atau Ctrl + Shift + R untuk hard refresh.
    echo.
) else (
    echo.
    echo ========================================================
    echo    DEPLOY MENGALAMI KENDALA
    echo ========================================================
    echo Jika diminta login, ikuti petunjuk login Cloudflare di jendela browser.
    echo.
)

pause
