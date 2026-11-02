$ErrorActionPreference='Stop'
$mobHere=$PSScriptRoot
$mobConfig=Get-Content -LiteralPath (Join-Path $mobHere 'path.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$mobInstalled=Get-Content -LiteralPath (Join-Path $mobHere 'installation.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$mobVerified=Get-Content -LiteralPath (Join-Path $mobHere 'verification.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if(-not $mobVerified.pass -or $mobInstalled.status -ne 'INSTALLED_AND_VERIFIED'){throw 'Final verification required'}
$mobRoots=@('G:\Codex\tmp\mob-weapon-message-fix-20261030','G:\Codex\tmp\mob-weapon-message-release-20261030')
foreach($p in @('G:\Codex','G:\Codex\tmp')){if((Get-Item -LiteralPath $p -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Reparse ancestor'}}
function Assert-MobHash([string]$p,[string]$expected){if((Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected){throw ('Protected input changed: '+$p)}}
function Assert-MobInputs{
 Assert-MobHash $mobInstalled.workQsp $mobInstalled.after
 Assert-MobHash $mobInstalled.backup $mobInstalled.before
 Assert-MobHash $mobConfig.stateSave $mobConfig.saveSha256
 if(-not (Test-Path -LiteralPath (Join-Path $mobHere 'REPORT_KO.md')) -or -not (Test-Path -LiteralPath (Join-Path $mobHere 'release-check/report.json'))){throw 'Retained reports required'}
}
Assert-MobInputs
$script:mobCount=0;$script:mobBytes=0
function Remove-MobTempTree([string]$p){
 $abs=[IO.Path]::GetFullPath($p)
 if(-not ($mobRoots | Where-Object {$abs -eq $_ -or $abs.StartsWith($_+'\',[StringComparison]::OrdinalIgnoreCase)})){throw 'Outside task roots'}
 $entry=Get-Item -LiteralPath $abs -Force
 if($entry.Attributes -band [IO.FileAttributes]::ReparsePoint){throw ('Unexpected link: '+$abs)}
 if($entry.PSIsContainer){foreach($child in Get-ChildItem -LiteralPath $abs -Force){Remove-MobTempTree $child.FullName};Remove-Item -LiteralPath $abs -Force}
 else{$script:mobCount++;$script:mobBytes+=$entry.Length;Remove-Item -LiteralPath $abs -Force}
}
foreach($root in $mobRoots){if([IO.Path]::GetFullPath($root) -ne $root){throw 'Noncanonical temporary path'};if(Test-Path -LiteralPath $root){Remove-MobTempTree $root}}
Assert-MobInputs
$result=@{pass=$true;removedFiles=$mobCount;freedBytes=$mobBytes;roots=$mobRoots;workAndBackupPreserved=$true;sourceSavePreserved=$true}
$result|ConvertTo-Json -Depth 4|Set-Content -LiteralPath (Join-Path $mobHere 'cleanup.json') -Encoding UTF8
$result|ConvertTo-Json -Compress
