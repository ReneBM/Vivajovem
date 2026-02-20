@echo off
echo INICIANDO SCRIPT DE PUSH...
echo Se voce esta vendo isso, o script abriu corretamente.
echo.

:: Caminho HARDCODED do Git (baseado no que encontramos antes)
set "GIT_CMD=C:\Program Files\Git\cmd\git.exe"

if not exist "%GIT_CMD%" (
    echo [ERRO FATAL] O Git nao foi encontrado em: "%GIT_CMD%"
    echo Baixe e instale o Git: https://git-scm.com/download/win
    pause
    exit /b
)

echo [SUCESSO] Git encontrado!
echo.

:: 1. Inicializar
if not exist ".git" (
    echo [INFO] Inicializando repositorio...
    "%GIT_CMD%" init
)

:: 2. Obter URL
echo Cole a URL do seu repositorio GitHub abaixo e aperte ENTER:
echo (Exemplo: https://github.com/SEU-NOME/SEU-REPO.git)
echo.
set /p REPO_URL="URL > "

if "%REPO_URL%"=="" (
    echo [ERRO] URL invalida.
    pause
    exit /b
)

:: 3. Executar comandos
echo.
echo Adicionando arquivos...
"%GIT_CMD%" add .

echo Criando commit...
"%GIT_CMD%" commit -m "feat: release v1.0.0" >nul 2>&1

echo Configurando branch main...
"%GIT_CMD%" branch -M main

echo Configurando remoto...
"%GIT_CMD%" remote remove origin >nul 2>&1
"%GIT_CMD%" remote add origin %REPO_URL%

echo ENVIANDO PARA O GITHUB...
echo (Se uma janela pedir senha, faca login nela)
"%GIT_CMD%" push -u origin main --tags

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] O envio falhou.
    echo Tente rodar manualmente: git pull origin main --allow-unrelated-histories
) else (
    echo.
    echo [SUCESSO] Tudo certo!
)

echo.
echo FIM DO SCRIPT.
pause
