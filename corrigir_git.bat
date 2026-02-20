@echo off
set "GIT_CMD=C:\Program Files\Git\cmd\git.exe"
echo ==========================================
echo   CORRECAO DE GIT - VIVA JOVEM
echo ==========================================
echo.

:: 1. Configurar Identidade (Obrigatorio para o Git funcionar)
echo Precisamos saber quem esta enviando o codigo.
echo.
set /p GIT_NAME="Digite seu Nome (ex: Rene): "
set /p GIT_EMAIL="Digite seu Email: "

"%GIT_CMD%" config --global user.name "%GIT_NAME%"
"%GIT_CMD%" config --global user.email "%GIT_EMAIL%"

:: 2. Tentar Commitar novamente (mostrando erro se houver)
echo.
echo [Tentando criar o commit...]
"%GIT_CMD%" add .
"%GIT_CMD%" commit -m "feat: release v1.0.0 (correcao)"

:: 3. Verificar Branch
echo.
echo [Verificando branch...]
"%GIT_CMD%" branch -M main

:: 4. Enviar
echo.
echo [Enviando para o GitHub...]
"%GIT_CMD%" push -u origin main --tags

echo.
echo ==========================================
if %errorlevel% neq 0 (
    echo [ERRO] Ainda deu erro. Tire um print dessa tela e me mostre.
) else (
    echo [SUCESSO] Resolvido! Codigo enviado.
)
echo ==========================================
pause
