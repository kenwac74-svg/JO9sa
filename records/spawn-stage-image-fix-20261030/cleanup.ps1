$ErrorActionPreference='Stop'
$spawnHere=$PSScriptRoot
$spawnConfig=Get-Content -LiteralPath (Join-Path $spawnHere 'path.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$spawnInstalled=Get-Content -LiteralPath (Join-Path $spawnHere 'installation.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$spawnVerified=Get-Content -LiteralPath (Join-Path $spawnHere 'verification.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if(-not $spawnVerified.pass -or $spawnInstalled.status -ne 'INSTALLED_AND_VERIFIED'){throw 'Final verification required'}
$spawnRoots=@('G:\Codex\tmp\spawn-stage-image-fix-20261030','G:\Codex\tmp\spawn-stage-image-release-20261030','G:\Codex\tmp\spawn-stage-image-release-rebased-20261030','G:\Codex\tmp\spawn-stage-image-release-final-20261030','G:\Codex\tmp\spawn-stage-image-release-approved-20261030')
foreach($p in @('G:\Codex','G:\Codex\tmp')){if((Get-Item -LiteralPath $p -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Reparse ancestor'}}
function Assert-SpawnHash([string]$p,[string]$expected){if((Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected){throw ('Protected input changed: '+$p)}}
function Assert-SpawnInputs{
 Assert-SpawnHash $spawnInstalled.workQsp $spawnInstalled.after
 Assert-SpawnHash $spawnInstalled.backup $spawnInstalled.before
 Assert-SpawnHash $spawnConfig.stateSave $spawnConfig.saveSha256
 foreach($f in $spawnInstalled.protectedFiles){Assert-SpawnHash (Join-Path $spawnConfig.game $f.path) $f.sha256}
 foreach($f in $spawnInstalled.newImages){Assert-SpawnHash (Join-Path $spawnConfig.game $f.path) $f.sha256;Assert-SpawnHash (Join-Path ($spawnConfig.repo+'/resources/new') $f.path) $f.sha256}
 foreach($f in @('REPORT_KO.md','verification.json','browser-verification.json','release-check/report.json')){if(-not(Test-Path -LiteralPath (Join-Path $spawnHere $f))){throw 'Retained report missing'}}
}
Assert-SpawnInputs
$script:spawnCount=0;$script:spawnBytes=0
function Remove-SpawnTempTree([string]$p){
 $abs=[IO.Path]::GetFullPath($p)
 if(-not ($spawnRoots|Where-Object {$abs -eq $_ -or $abs.StartsWith($_+'\',[StringComparison]::OrdinalIgnoreCase)})){throw 'Outside task roots'}
 $entry=Get-Item -LiteralPath $abs -Force
 if($entry.Attributes -band [IO.FileAttributes]::ReparsePoint){throw ('Unexpected link: '+$abs)}
 if($entry.PSIsContainer){foreach($child in Get-ChildItem -LiteralPath $abs -Force){Remove-SpawnTempTree $child.FullName};Remove-Item -LiteralPath $abs -Force}
 else{$script:spawnCount++;$script:spawnBytes+=$entry.Length;Remove-Item -LiteralPath $abs -Force}
}
foreach($root in $spawnRoots){if([IO.Path]::GetFullPath($root) -ne $root){throw 'Noncanonical temporary path'};if(Test-Path -LiteralPath $root){Remove-SpawnTempTree $root}}
Assert-SpawnInputs
$result=@{pass=$true;removedFiles=$spawnCount;freedBytes=$spawnBytes;roots=$spawnRoots;workAndBackupPreserved=$true;userSavePreserved=$true;existingAndNewArtPreserved=$true}
$result|ConvertTo-Json -Depth 4|Set-Content -LiteralPath (Join-Path $spawnHere 'cleanup.json') -Encoding UTF8
$result|ConvertTo-Json -Compress
