param(
    [switch]$Push
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$RemoteUrl = 'https://github.com/ArnoldSSJ/pool_desk.git'

function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$GitArgs)
    & git -C $ProjectRoot @GitArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Falló git $($GitArgs -join ' ') (código $LASTEXITCODE)."
    }
}

foreach ($RequiredPath in @('app\index.html', 'app\assets\js\app.js', 'main.cjs', 'preload.cjs', 'package.json', 'package-lock.json')) {
    if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot $RequiredPath))) {
        throw "No se encontró el archivo requerido: $RequiredPath"
    }
}

& git --version | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw 'Instala Git para Windows y vuelve a ejecutar este script.'
}

$insideRepo = & git -C $ProjectRoot rev-parse --is-inside-work-tree 2>$null
if ($LASTEXITCODE -ne 0 -or $insideRepo -ne 'true') {
    Invoke-Git init -b main
}

$currentRemote = & git -C $ProjectRoot remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) {
    if ($currentRemote.TrimEnd('/') -ne $RemoteUrl.TrimEnd('/')) {
        throw "El remoto origin ya apunta a '$currentRemote'. No lo cambié para proteger tu configuración."
    }
} else {
    Invoke-Git remote add origin $RemoteUrl
}

$currentBranch = & git -C $ProjectRoot branch --show-current
if ($LASTEXITCODE -ne 0) {
    throw 'No se pudo determinar la rama Git actual.'
}
if ($currentBranch -ne 'main') {
    Invoke-Git branch -M main
}

Invoke-Git add -- app main.cjs preload.cjs package.json package-lock.json README.md LEEME.md .gitignore SUBIR_A_GITHUB.md subir-a-github.ps1

& git -C $ProjectRoot diff --cached --quiet
$diffExit = $LASTEXITCODE
if ($diffExit -eq 1) {
    Invoke-Git commit -m 'PoolDesk BETA 1.10: recuperar y preparar fuente'
} elseif ($diffExit -ne 0) {
    throw 'No se pudo revisar el índice de Git.'
} else {
    Write-Host 'No hay cambios nuevos para guardar.'
}

Write-Host "Proyecto listo en: $ProjectRoot"
Write-Host "Remoto: $RemoteUrl"
Write-Host 'Revisa los cambios con: git status'
if ($Push) {
    Invoke-Git push -u origin main
} else {
    Write-Host 'Para publicarlo, ejecuta: git push -u origin main'
    Write-Host 'O vuelve a correr este script con -Push para preparar y publicar en un solo paso.'
}
