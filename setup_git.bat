@echo off
echo ==========================================
echo Configurando Repositorio Git v1.0.0
echo ==========================================

:: Verifica se o Git esta instalado
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] O Git nao esta instalado ou nao esta no PATH.
    echo Por favor, instale o Git em https://git-scm.com/download/win
    echo Apos instalar, feche este terminal e abra novamente.
    pause
    exit /b
)

:: Inicializa o repositorio
if not exist ".git" (
    echo [INFO] Inicializando repositorio...
    git init
) else (
    echo [INFO] Repositorio ja existe.
)

:: Adiciona arquivos
echo [INFO] Adicionando arquivos...
git add .

:: Commit
echo [INFO] Criando commit v1.0.0...
git commit -m "feat: release v1.0.0 - Sistema de Lideranca Completo"

:: Tag
echo [INFO] Criando tag v1.0.0...
git tag v1.0.0

echo.
echo ==========================================
echo [SUCESSO] Versao v1.0.0 criada com sucesso!
echo ==========================================
pause
