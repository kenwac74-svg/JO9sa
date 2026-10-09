# The standalone editor entry point delegates to the single workspace launcher.
param([string]$GameDir='', [string]$OriginalDir='', [string]$CatalogDir='', [string]$RuntimeDir='', [string]$ConfigFile='', [string]$NodePath='', [int]$Port=3813, [switch]$NoBrowser, [string]$WorkspaceLauncher='')
$ErrorActionPreference='Stop'
if (!$WorkspaceLauncher) {
 # In a repository checkout the launcher is alongside text-workshop.
 $candidate=Join-Path (Split-Path -Parent $PSScriptRoot) 'local-workspace\Start-JO9-Tools.ps1'
 if (Test-Path -LiteralPath $candidate) {$WorkspaceLauncher=$candidate}
}
if (!$WorkspaceLauncher) {
 # Installed tools keep only the launcher location, never API keys or another state store.
 $pointer=Join-Path $PSScriptRoot 'workspace-launcher.json'
 if (Test-Path -LiteralPath $pointer) {
  $location=Get-Content -LiteralPath $pointer -Raw -Encoding UTF8 | ConvertFrom-Json
  if (Test-Path -LiteralPath $location.launcher) {$WorkspaceLauncher=[string]$location.launcher;if (!$ConfigFile -and $location.config) {$ConfigFile=[string]$location.config}}
 }
}
if (!$WorkspaceLauncher -or !(Test-Path -LiteralPath $WorkspaceLauncher)) {throw 'Canonical workspace launcher not found. Run Start-JO9-Tools.ps1 from the workspace folder first.'}
$arguments=@{NoBrowser=$NoBrowser;Port=$Port}
foreach ($name in @('GameDir','OriginalDir','CatalogDir','RuntimeDir','ConfigFile','NodePath')) {
 $value=Get-Variable -Name $name -ValueOnly
 if ($value) {$arguments[$name]=$value}
}
& $WorkspaceLauncher @arguments
