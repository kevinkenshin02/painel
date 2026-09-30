@echo off
rem Atualiza o Painel Tanaka com a versao mais nova do GitHub. Feche o Painel antes.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\atualizar.ps1"
echo.
pause
