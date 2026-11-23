$ErrorActionPreference='Stop'
Set-Location -LiteralPath $PSScriptRoot
if(-not(Test-Path -LiteralPath '.env')){Copy-Item -LiteralPath '.env.example' -Destination '.env'}
docker compose -p battery-type-review -f compose.review.yml up -d --wait
if($LASTEXITCODE){throw 'Запусти Docker Desktop и повтори'}
npm.cmd ci
if($LASTEXITCODE){throw 'npm ci failed'}
node scripts/init-review.cjs
if($LASTEXITCODE){throw 'Database initialization failed'}
node scripts/seed-lab8.cjs
if($LASTEXITCODE){throw 'Seed failed'}
npm.cmd run build
if($LASTEXITCODE){throw 'Backend build failed'}
Write-Host 'API стартует на http://127.0.0.1:53000/api/docs . Оставь эту консоль открытой.'
node dist/main.js
