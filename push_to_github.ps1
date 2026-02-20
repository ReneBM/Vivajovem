[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   CONECTANDO AO GITHUB (PowerShell)      " -ForegroundColor Cyan
Write-Host "=========================================="
Write-Host ""

# 1. Localizar o Git
$gitPath = "C:\Program Files\Git\cmd\git.exe"
$gitCmd = "& '$gitPath'"

if (-not (Test-Path $gitPath)) {
    Write-Host "[AVISO] Git nao encontrado no local padrao." -ForegroundColor Yellow
    if (Get-Command "git" -ErrorAction SilentlyContinue) {
        $gitPath = "git"
        $gitCmd = "git"
        Write-Host "[SUCESSO] Git encontrado no sistema." -ForegroundColor Green
    } else {
        Write-Host "[ERRO] Git nao esta instalado." -ForegroundColor Red
        Write-Host "Por favor, instale em: https://git-scm.com/download/win"
        Read-Host "Pressione Enter para sair"
        exit
    }
}

# 2. Configurar Usuario
try {
    $userEmail = & $gitCmd config user.email
    if (-not $userEmail) {
        Write-Host "Precisamos configurar seu usuario do Git." -ForegroundColor Yellow
        $name = Read-Host "Digite seu Nome"
        $email = Read-Host "Digite seu Email"
        & $gitCmd config --global user.name "$name"
        & $gitCmd config --global user.email "$email"
    }
} catch {
}

# 3. Inicializar Repositorio
if (-not (Test-Path ".git")) {
    Write-Host "Inicializando repositorio..." -ForegroundColor Cyan
    & $gitCmd init
}

# 4. Obter URL
Write-Host ""
Write-Host "Qual a URL do seu repositorio no GitHub?"
Write-Host "Exemplo: https://github.com/SEU-USUARIO/vivajovem-sistema.git" -ForegroundColor DarkGray
$repoUrl = Read-Host "Cole a URL aqui"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "[ERRO] URL nao pode ser vazia." -ForegroundColor Red
    exit
}

# 5. Executar comandos Git
Write-Host ""
Write-Host "[1/5] Adicionando arquivos..." -ForegroundColor Cyan
& $gitCmd add .

Write-Host "[2/5] Criando commit..." -ForegroundColor Cyan
& $gitCmd commit -m "feat: release v1.0.0" *>$null

Write-Host "[3/5] Configurando branch main..." -ForegroundColor Cyan
& $gitCmd branch -M main

Write-Host "[4/5] Configurando remoto..." -ForegroundColor Cyan
& $gitCmd remote remove origin *>$null
& $gitCmd remote add origin $repoUrl

Write-Host "[5/5] Enviando para o GitHub..." -ForegroundColor Cyan
Write-Host "(Uma janela pode abrir pedindo login/senha...)" -ForegroundColor Yellow
& $gitCmd push -u origin main --tags

# Tratamento de erro simplificado
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "   SUCESSO! CODIGO ENVIADO.               " -ForegroundColor Green
    Write-Host "=========================================="
} else {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host "   ERRO AO ENVIAR                         " -ForegroundColor Red
    Write-Host "=========================================="
    Write-Host "Dica: Se ja existiam arquivos no GitHub (como README),"
    Write-Host "tente rodar este comando:"
    Write-Host "git pull origin main --allow-unrelated-histories"
}

Write-Host ""
