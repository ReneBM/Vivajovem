@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "push_to_github.ps1"
echo.
echo Pressione qualquer tecla para finalizar...
pause >nul
