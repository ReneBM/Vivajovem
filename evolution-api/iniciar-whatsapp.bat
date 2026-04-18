@echo off
title VivaJovem - WhatsApp Services
echo.
echo ╔══════════════════════════════════════════════╗
echo ║  VivaJovem - Iniciando servicos WhatsApp    ║
echo ╚══════════════════════════════════════════════╝
echo.

echo [1/2] Iniciando Evolution API na porta 8085...
start "Evolution API" cmd /k "cd /d c:\Lideranca\evolution-api && npm start"

echo [2/2] Iniciando Scheduler de Agendamentos...
timeout /t 5 /nobreak > nul
start "WhatsApp Scheduler" cmd /k "cd /d c:\Lideranca\evolution-api && node scheduler.js"

echo.
echo ✅ Servicos iniciados em janelas separadas!
echo    - Evolution API: http://localhost:8085
echo    - Scheduler: Verificando agendamentos a cada 30s
echo.
echo Feche esta janela quando quiser. Os servicos continuam rodando.
pause
