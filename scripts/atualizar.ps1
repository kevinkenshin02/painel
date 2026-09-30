# Atualiza o Painel Tanaka com a versao mais nova do GitHub (rodar pelo ATUALIZAR.bat, com o Painel fechado).
# Faz backup do banco antes de tudo. Sem acentos de proposito (PowerShell do Windows).
$ErrorActionPreference = "Stop"
$raiz = Split-Path $PSScriptRoot -Parent
Set-Location $raiz

function Passo($t) { Write-Host ""; Write-Host "== $t" -ForegroundColor Yellow }
function Parar($t) { Write-Host ""; Write-Host "PAROU: $t" -ForegroundColor Red; exit 1 }
function Rodar($cmd) {
  cmd /c $cmd
  if ($LASTEXITCODE -ne 0) { Parar "o comando '$cmd' falhou (veja a mensagem acima). O backup do banco foi feito antes." }
}

$aberto = Get-CimInstance Win32_Process -Filter "Name='electron.exe'" | Where-Object { $_.CommandLine -like "*$raiz*" }
if ($aberto) { Parar "o Painel esta aberto. Feche o Painel e rode de novo." }

Passo "Backup do banco antes de atualizar"
if (Test-Path "dev.db") { Rodar "node scripts/backup.mjs" } else { Write-Host "Sem dev.db ainda: nada para guardar." }

Passo "Baixando a versao nova do GitHub"
Rodar "git pull --ff-only"

Passo "Atualizando as bibliotecas"
Rodar "npm install"

Passo "Atualizando o banco de dados (so aplica o que for novo; os dados ficam)"
Rodar "npx prisma generate --config prisma7.config.ts"
Rodar "npx prisma migrate deploy --config prisma7.config.ts"

Passo "Montando o Painel (build)"
Rodar "npm run build"

Write-Host ""
Write-Host "PRONTO! Painel atualizado." -ForegroundColor Green
$r = Read-Host "Abrir o Painel agora? (S/N)"
if ($r -match '^[sS]') { Start-Process wscript.exe -ArgumentList ('"' + (Join-Path $raiz "electron\abrir-painel.vbs") + '"') }
