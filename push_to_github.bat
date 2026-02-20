@echo off
echo ==========================================
echo Conectando ao GitHub...
echo ==========================================

:: Verifica se o Git esta iniciado
if not exist ".git" (
    echo [ERRO] Repositorio nao inicializado.
    echo Por favor, rode o arquivo 'setup_git.bat' primeiro.
    pause
    exit /b
)

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

echo.
echo [INFO] Configurando remoto 'origin'...
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%

echo [INFO] Renomeando branch para main...
git branch -M main

echo [INFO] Enviando arquivos para o GitHub...
git push -u origin main --tags

echo.
echo ==========================================
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao enviar. Verifique se a URL esta correta e se voce tem permissao.
) else (
    echo [SUCESSO] Codigo enviado com sucesso!
)
echo ==========================================
pause
