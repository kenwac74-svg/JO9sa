$ErrorActionPreference='Stop'
$roleHere=$PSScriptRoot
$roleConfig=Get-Content -LiteralPath (Join-Path $roleHere 'path.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$roleInstalled=Get-Content -LiteralPath (Join-Path $roleHere 'installation.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$roleVerified=Get-Content -LiteralPath (Join-Path $roleHere 'verification.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if(-not $roleVerified.pass -or $roleInstalled.status -ne 'INSTALLED_AND_LIVE_VERIFIED'){throw 'Final verification required'}
$roleRoots=@('G:\Codex\tmp\mistress-mob-role-copy-20261030','G:\Codex\tmp\mistress-mob-role-copy-release-20261030')
foreach($p in @('G:\Codex','G:\Codex\tmp')){if((Get-Item -LiteralPath $p -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Reparse ancestor'}}
function Assert-RoleHash([string]$p,[string]$expected){if((Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected){throw ('Protected input changed: '+$p)}}
function Assert-RoleInputs{
 Assert-RoleHash $roleInstalled.workQsp $roleInstalled.after
 Assert-RoleHash $roleInstalled.backup $roleInstalled.before
 Assert-RoleHash $roleConfig.stateSave $roleConfig.saveSha256
 foreach($m in $roleConfig.mappings){Assert-RoleHash (Join-Path $roleConfig.game $m.source) $m.sha256;Assert-RoleHash (Join-Path $roleConfig.game $m.target) $m.sha256}
}
Assert-RoleInputs
$script:roleCount=0;$script:roleBytes=0
function Remove-RoleTree([string]$p){
 $abs=[IO.Path]::GetFullPath($p)
 if(-not ($roleRoots | Where-Object {$abs -eq $_ -or $abs.StartsWith($_+'\',[StringComparison]::OrdinalIgnoreCase)})){throw 'Outside task roots'}
 $entry=Get-Item -LiteralPath $abs -Force
 if($entry.Attributes -band [IO.FileAttributes]::ReparsePoint){throw ('Unexpected link: '+$abs)}
 if($entry.PSIsContainer){foreach($child in Get-ChildItem -LiteralPath $abs -Force){Remove-RoleTree $child.FullName};Remove-Item -LiteralPath $abs -Force}
 else{$script:roleCount++;$script:roleBytes+=$entry.Length;Remove-Item -LiteralPath $abs -Force}
}
foreach($root in $roleRoots){if([IO.Path]::GetFullPath($root) -ne $root){throw 'Noncanonical temporary path'};Remove-RoleTree $root}
Assert-RoleInputs
$result=@{pass=$true;removedFiles=$roleCount;freedBytes=$roleBytes;roots=$roleRoots;sourceCharacterFilesPreserved=$true;newMobFilesPreserved=$true;workAndBackupPreserved=$true;sourceSavePreserved=$true}
$result|ConvertTo-Json -Depth 4|Set-Content -LiteralPath (Join-Path $roleHere 'cleanup.json') -Encoding UTF8
$result|ConvertTo-Json -Compress
