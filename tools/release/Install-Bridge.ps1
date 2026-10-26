[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$GameDirectory,[switch]$DryRun)
$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false)
$OutputEncoding=[Console]::OutputEncoding
# JO9 MOD START KOREAN_PATCH_BRIDGE | 2026-10-19_korean_patch_launcher
# Pass typed path parameters to the same packaged core; this bridge never evaluates path text as code.
$global:LASTEXITCODE=0
try {
 & (Join-Path $PSScriptRoot 'Install-Patch.ps1') -GameDirectory $GameDirectory -DryRun:$DryRun -ErrorAction Stop
 if($LASTEXITCODE -ne 0){[Console]::Error.WriteLine('Installer exit code: '+$LASTEXITCODE);exit $LASTEXITCODE}
 exit 0
} catch {
 [Console]::Error.WriteLine($_.Exception.Message)
 exit 1
}
# JO9 MOD END KOREAN_PATCH_BRIDGE
