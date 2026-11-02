$ErrorActionPreference='Stop'
$fixHere=$PSScriptRoot
$fixInstall=Get-Content -LiteralPath (Join-Path $fixHere 'installation.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$fixVerified=Get-Content -LiteralPath (Join-Path $fixHere 'post-install-verification.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if(-not $fixVerified.pass){throw 'Post-install verification required'}
function Assert-FixHash([string]$file,[string]$hash){if((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant() -ne $hash){throw ('Protected input changed: '+$file)}}
Assert-FixHash $fixInstall.workQsp $fixInstall.after
Assert-FixHash $fixInstall.backup $fixInstall.before
$fixNative='G:\Codex\tmp\agrabah-fruit-menu-fix-20261030'
$fixRelease='G:\Codex\tmp\agrabah-fruit-menu-release-20261030'
$fixRoots=@($fixNative,$fixRelease)
foreach($p in @('G:\Codex','G:\Codex\tmp')){if((Get-Item -LiteralPath $p -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Reparse ancestor'}}
$fixAllowedLinks=@((Join-Path $fixNative 'content'),(Join-Path $fixNative 'css'),(Join-Path $fixNative 'fonts'))
$script:fixRemovedFiles=0;$script:fixRemovedBytes=0;$script:fixUnlinked=0
function Remove-FixTree([string]$target){
 $abs=[IO.Path]::GetFullPath($target)
 if(-not ($fixRoots | Where-Object {$abs -eq $_ -or $abs.StartsWith($_+'\',[StringComparison]::OrdinalIgnoreCase)})){throw ('Outside task roots: '+$abs)}
 $entry=Get-Item -LiteralPath $abs -Force
 if($entry.Attributes -band [IO.FileAttributes]::ReparsePoint){if($abs -notin $fixAllowedLinks){throw ('Unexpected link: '+$abs)};[IO.Directory]::Delete($abs,$false);$script:fixUnlinked++;return}
 if($entry.PSIsContainer){foreach($child in Get-ChildItem -LiteralPath $abs -Force){Remove-FixTree $child.FullName};Remove-Item -LiteralPath $abs -Force}
 else{$script:fixRemovedFiles++;$script:fixRemovedBytes+=$entry.Length;Remove-Item -LiteralPath $abs -Force}
}
foreach($root in $fixRoots){if([IO.Path]::GetFullPath($root) -ne $root){throw 'Noncanonical root'};Remove-FixTree $root;if(Test-Path -LiteralPath $root){throw 'Temporary files remain'}}
Assert-FixHash $fixInstall.workQsp $fixInstall.after
Assert-FixHash $fixInstall.backup $fixInstall.before
$result=@{pass=$true;removedFiles=$fixRemovedFiles;freedBytes=$fixRemovedBytes;unlinkedJunctions=$fixUnlinked;backupPreserved=$true;workPreserved=$true;roots=$fixRoots}
$result|ConvertTo-Json -Depth 4|Set-Content -LiteralPath (Join-Path $fixHere 'cleanup.json') -Encoding UTF8
$result|ConvertTo-Json -Compress
