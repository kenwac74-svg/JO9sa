$ErrorActionPreference='Stop'
$taskRecord='G:\somi\JO9sa\records\wong-guild-dialogue-fix-20261030'
$installation=Get-Content -LiteralPath (Join-Path $taskRecord 'installation.json') -Raw -Encoding UTF8|ConvertFrom-Json
function Digest([string]$p){return(Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()}
if($installation.status-ne'VERIFIED'){throw 'Validated installation record required before temporary cleanup'}
if((Digest $installation.workQsp)-ne$installation.after-or(Digest $installation.backup)-ne$installation.before-or(Digest $installation.sourceSave)-ne$installation.saveBeforeSha256){throw 'Installed file or unique recovery source drift'}
$allowedRoots=@('G:\Codex\tmp\jo9-wong-fix-20261030','G:\Codex\tmp\jo9-wong-release-20261030')
$script:removedBytes=0L;$script:removedFiles=0;$script:removedLinks=0
function CheckContained([string]$p,[string]$root){
 $full=[IO.Path]::GetFullPath($p)
 if($full-ne$root-and-not$full.StartsWith($root+'\',[StringComparison]::OrdinalIgnoreCase)){throw "Temporary cleanup escaped named root: $full"}
 return $full
}
function DeleteOwnedTree([string]$p,[string]$root){
 $full=CheckContained $p $root
 $item=Get-Item -LiteralPath $full -Force
 if(($item.Attributes-band[IO.FileAttributes]::ReparsePoint)-ne0){
  # Nonrecursive deletion unlinks this diagnostic junction; never enumerate its target.
  if($item.PSIsContainer){[IO.Directory]::Delete($full)}else{[IO.File]::Delete($full)}
  $script:removedLinks++;return
 }
 if($item.PSIsContainer){
  foreach($child in Get-ChildItem -LiteralPath $full -Force){DeleteOwnedTree $child.FullName $root}
  Remove-Item -LiteralPath $full -Force
 }else{
  $script:removedBytes+=$item.Length;$script:removedFiles++
  Remove-Item -LiteralPath $full -Force
 }
}
foreach($named in $allowedRoots){
 $root=[IO.Path]::GetFullPath($named)
 if([IO.Path]::GetDirectoryName($root)-ne'G:\Codex\tmp'){throw 'Unexpected scratch parent'}
 $cursor=$root
 while($cursor){
  if(Test-Path -LiteralPath $cursor){$it=Get-Item -LiteralPath $cursor -Force;if(($it.Attributes-band[IO.FileAttributes]::ReparsePoint)-ne0){throw "Scratch root/ancestor is a reparse point: $cursor"}}
  $next=[IO.Path]::GetDirectoryName($cursor);if($next-eq$cursor){break};$cursor=$next
 }
 if(Test-Path -LiteralPath $root){DeleteOwnedTree $root $root}
}
if((Digest $installation.workQsp)-ne$installation.after-or(Digest $installation.backup)-ne$installation.before-or(Digest $installation.sourceSave)-ne$installation.saveBeforeSha256){throw 'Source preservation failed after cleanup'}
foreach($p in @('G:\somi\Jack O Nine Tails v2.4_work\game\content','G:\somi\Jack O Nine Tails v2.4_work\game\json')){if(-not(Test-Path -LiteralPath $p -PathType Container)){throw 'Runtime resource target missing'}}
$result=@{pass=$true;removedBytes=$script:removedBytes;removedFiles=$script:removedFiles;unlinkedDiagnosticJunctions=$script:removedLinks;roots=$allowedRoots;workQspPreserved=$true;uniqueBackupPreserved=$true;sourceSavePreserved=$true;runtimeResourceTargetsPreserved=$true;nativeAgentCleanupSeparate=$true}
$json=$result|ConvertTo-Json -Depth 5
[IO.File]::WriteAllText((Join-Path $PSScriptRoot 'cleanup.json'),$json,[Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $taskRecord 'cleanup.json'),$json,[Text.UTF8Encoding]::new($false))
Write-Output $json
