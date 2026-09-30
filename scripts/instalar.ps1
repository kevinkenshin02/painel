# Instala o Painel Tanaka neste computador (rodar pelo INSTALAR.bat, na pasta do Painel).
# Sem acentos de proposito: o PowerShell do Windows le .ps1 sem BOM como ANSI.
param([switch]$SemAtalho)
$ErrorActionPreference = "Stop"
$raiz = Split-Path $PSScriptRoot -Parent
Set-Location $raiz

function Passo($t) { Write-Host ""; Write-Host "== $t" -ForegroundColor Yellow }
function Parar($t) { Write-Host ""; Write-Host "PAROU: $t" -ForegroundColor Red; exit 1 }
function Rodar($cmd) {
  cmd /c $cmd
  if ($LASTEXITCODE -ne 0) { Parar "o comando '$cmd' falhou (veja a mensagem acima)." }
}

Passo "Conferindo o que precisa"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Parar "o Node.js nao esta instalado. Baixe o 'LTS' em https://nodejs.org, instale e rode de novo." }
Write-Host ("Node " + (node -v))
if (-not (Test-Path ".env")) { Parar "falta o arquivo .env nesta pasta. Copie o .env do outro computador (pen drive) para: $raiz" }

$aberto = Get-CimInstance Win32_Process -Filter "Name='electron.exe'" | Where-Object { $_.CommandLine -like "*$raiz*" }
if ($aberto) { Parar "o Painel esta aberto. Feche o Painel e rode de novo." }

if (-not (Test-Path "dev.db")) {
  Write-Host ""
  Write-Host "Nao achei o banco de dados (dev.db) nesta pasta." -ForegroundColor Cyan
  Write-Host "Para trazer os clientes, OS, caixa e estoque do outro computador, copie o dev.db para: $raiz"
  $r = Read-Host "Criar um banco VAZIO agora? (S = sim / N = parar para copiar o dev.db)"
  if ($r -notmatch '^[sS]') { Parar "copie o dev.db para esta pasta e rode o INSTALAR de novo." }
}

Passo "Instalando as bibliotecas (pode levar alguns minutos)"
Rodar "npm install"
if (-not (Test-Path "node_modules\electron\dist\electron.exe")) { Parar "o Electron (a janela do Painel) nao foi baixado. Confira a internet e rode de novo." }

Passo "Preparando o banco de dados"
Rodar "npx prisma generate --config prisma7.config.ts"
Rodar "npx prisma migrate deploy --config prisma7.config.ts"

Passo "Montando o Painel (build)"
Rodar "npm run build"

if ($SemAtalho) { Write-Host ""; Write-Host "PRONTO (sem atalho)." -ForegroundColor Green; exit 0 }

Passo "Criando o atalho na area de trabalho"
$desktop = [Environment]::GetFolderPath("Desktop")
$ws = New-Object -ComObject WScript.Shell
$lnk = $ws.CreateShortcut((Join-Path $desktop "Painel Tanaka.lnk"))
$lnk.TargetPath = Join-Path $raiz "electron\abrir-painel.vbs"
$lnk.WorkingDirectory = $raiz
$lnk.IconLocation = (Join-Path $raiz "electron\icone-painel-v3.ico") + ",0"
$lnk.Description = "Abrir o Painel Tanaka"
$lnk.Save()
Write-Host "Atalho 'Painel Tanaka' criado em $desktop"

Write-Host ""
Write-Host "PRONTO! Abra o Painel pelo atalho 'Painel Tanaka' na area de trabalho." -ForegroundColor Green
$r = Read-Host "Abrir agora? (S/N)"
if ($r -match '^[sS]') { Start-Process wscript.exe -ArgumentList ('"' + (Join-Path $raiz "electron\abrir-painel.vbs") + '"') }
