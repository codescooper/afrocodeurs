#!/usr/bin/env pwsh
# Lanceur PowerShell du runner de projet — délègue à scripts/run.mjs (Node).
# Usage : .\run.ps1 <commande>   (voir .\run.ps1 help)
node (Join-Path $PSScriptRoot "scripts/run.mjs") @args
exit $LASTEXITCODE
