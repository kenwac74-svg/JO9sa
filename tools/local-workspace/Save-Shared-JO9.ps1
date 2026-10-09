param([string]$WorkspaceRoot='', [string]$MachineRoot='', [string]$PythonPath='')
$ErrorActionPreference='Stop'
# Resolve the same machine-local folders without starting servers or a watcher.
$shared=& (Join-Path $PSScriptRoot 'Start-Shared-JO9.ps1') -WorkspaceRoot $WorkspaceRoot -MachineRoot $MachineRoot -PythonPath $PythonPath -ConfigurationOnly
if (!$shared -or !$shared.workspace) {throw 'Shared workspace configuration was not resolved.'}
$exporter=Join-Path $PSScriptRoot 'export-shared-work.py'
if (!(Test-Path -LiteralPath $exporter)) {throw 'export-shared-work.py is missing.'}
& $shared.python $exporter --repo $shared.workspace --game $shared.game --original $shared.original --catalog $shared.catalog --runtime $shared.runtime --destination $shared.workspace
if ($LASTEXITCODE -ne 0) {throw 'Shared workspace save failed. Check the export report; the tools remain running.'}
