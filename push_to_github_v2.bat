@echo off
echo ==========================================
echo Conectando ao GitHub (Modo Direto)
echo ==========================================

:: Caminho exato do Git que encontramos
set "GIT_CMD=C:\Program Files\Git\cmd\git.exe"

if not exist "%GIT_CMD%" (
    echo [ERRO] O arquivo do Git nao foi encontrado em:
    echo %GIT_CMD%
    echo Por favor, instale o Git em https://git-scm.com/download/win
    pause
    exit /b
)

echo [INFO] Usando Git encontrado no sistema...

:: Configura usuario global se necessario
"%GIT_CMD%" config user.email >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [CONFIGURACAO] Precisamos configurar seu nome/email do Git.
    set /p GIT_NAME="Digite seu Nome de Usuario Git: "
    set /p GIT_EMAIL="Digite seu Email Git: "
    "%GIT_CMD%" config --global user.name "%GIT_NAME%"
    "%GIT_CMD%" config --global user.email "%GIT_EMAIL%"
)

:: Inicializa repositorio se necessario
if not exist ".git" (
    echo [INFO] Inicializando repositorio...
    "%GIT_CMD%" init
)

:: URL do Repositorio
echo.
echo Para continuar, voce precisa da URL do seu repositorio no GitHub.
echo Exemplo: https://github.com/SEU-USUARIO/vivajovem-sistema.git
echo.
set /p REPO_URL="Cole a URL do seu repositorio aqui e aperte Enter: "

if "%REPO_URL%"=="" (
    echo [ERRO] URL nao pode ser vazia.
    pause
    exit /b
)

:: Adiciona arquivos e commit
echo [INFO] Preparando arquivos...
"%GIT_CMD%" add .
"%GIT_CMD%" commit -m "feat: release v1.0.0" >nul 2>&1

:: Configura remoto
echo [INFO] Configurando remoto 'origin'...
"%GIT_CMD%" remote remove origin >nul 2>&1
"%GIT_CMD%" remote add origin %REPO_URL%

:: Push
echo [INFO] Renomeando branch para main...
"%GIT_CMD%" branch -M main

echo [INFO] Enviando arquivos para o GitHub...
echo (Uma janela pode abrir pedindo login/senha)
"%GIT_CMD%" push -u origin main --tags

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao enviar.
    echo.
    echo DICA: Se o repositorio nao estava vazio (criou com README?), tente rodar este comando:
    echo "%GIT_CMD%" pull origin main --allow-unrelated-histories
) else (
    echo.
    echo [SUCESSO] Codigo enviado com sucesso!
)

echo.
echo Pressione qualquer tecla para sair...
pause >nul
