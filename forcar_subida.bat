@echo off
set "GIT_CMD=C:\Program Files\Git\cmd\git.exe"

echo ========================================================
echo   FORCAR ENVIO V1.0.0 (Sobrepor GitHub)
echo ========================================================
echo.
echo O GitHub reclamos que tem arquivos diferentes do seu computador.
echo (Provavelmente um README.md ou .gitignore automatico)
echo.
echo Como e a primeira vez e seu computador e a versao principal:
echo VAMOS FORCAR O ENVIO PARA O GITHUB FICAR IGUAL AO SEU PC.
echo.
pause

echo [Forcando envio...]
"%GIT_CMD%" push -u origin main --tags --force

echo.
echo ========================================================
if %errorlevel% neq 0 (
    echo [ERRO] Falha total. Verifique sua senha/permissao.
) else (
    echo [SUCESSO] Resolvido! O GitHub agora esta igual ao seu PC.
)
echo ========================================================
pause
