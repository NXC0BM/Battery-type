$ErrorActionPreference='Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$renderRoot=Join-Path (Get-Location) 'submission\qa\background-final'
Copy-Item -LiteralPath 'submission\РПЗ_ЛР8_готово.docx' -Destination (Join-Path $renderRoot 'report.docx') -Force
Copy-Item -LiteralPath 'submission\Исправлено_ЛР8_готово.docx' -Destination (Join-Path $renderRoot 'corrections.docx') -Force
Copy-Item -LiteralPath 'submission\Расчёт_116_пользователей_ЛР8.docx' -Destination (Join-Path $renderRoot 'calculation.docx') -Force
$renderProcess=Start-Process -FilePath 'C:\Web\document-renderer\portable\program\soffice.com' -ArgumentList @('-env:UserInstallation=file:///C:/Web/document-renderer/profile-background-final','--headless','--norestore','--convert-to','pdf:writer_pdf_Export','--outdir',$renderRoot,(Join-Path $renderRoot 'report.docx'),(Join-Path $renderRoot 'corrections.docx'),(Join-Path $renderRoot 'calculation.docx')) -WindowStyle Hidden -RedirectStandardOutput (Join-Path $renderRoot 'render.log') -RedirectStandardError (Join-Path $renderRoot 'render-error.log') -Wait -PassThru
if($renderProcess.ExitCode){throw "Document renderer exit code: $($renderProcess.ExitCode)"}
Get-Item (Join-Path $renderRoot 'report.pdf'),(Join-Path $renderRoot 'corrections.pdf'),(Join-Path $renderRoot 'calculation.pdf') | Select-Object Name,Length,LastWriteTime
