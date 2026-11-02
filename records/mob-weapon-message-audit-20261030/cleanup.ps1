$ErrorActionPreference='Stop'
$auditHere=$PSScriptRoot
$auditResult=Get-Content -LiteralPath (Join-Path $auditHere 'native-results.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$auditPrepared=Get-Content -LiteralPath (Join-Path $auditHere 'native-prepared.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if(-not $auditResult.pass){throw 'Native result not verified'}
$auditRoot='G:\Codex\tmp\mob-weapon-message-audit-20261030'
if([IO.Path]::GetFullPath($auditRoot) -ne $auditRoot){throw 'Unexpected root'}
foreach($p in @('G:\Codex','G:\Codex\tmp')){if((Get-Item -LiteralPath $p -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Reparse ancestor'}}
function Assert-AuditWork{if((Get-FileHash -LiteralPath 'G:\somi\Jack O Nine Tails v2.4_work\game\jack.qsp' -Algorithm SHA256).Hash.ToLowerInvariant() -ne $auditPrepared.workHash){throw 'WORK changed'}}
Assert-AuditWork
$script:auditFiles=0;$script:auditBytes=0
function Remove-AuditNode([string]$p){$abs=[IO.Path]::GetFullPath($p);if($abs -ne $auditRoot -and -not $abs.StartsWith($auditRoot+'\',[StringComparison]::OrdinalIgnoreCase)){throw 'Outside audit root'};$entry=Get-Item -LiteralPath $abs -Force;if($entry.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Unexpected reparse point'};if($entry.PSIsContainer){foreach($child in Get-ChildItem -LiteralPath $abs -Force){Remove-AuditNode $child.FullName};Remove-Item -LiteralPath $abs -Force}else{$script:auditFiles++;$script:auditBytes+=$entry.Length;Remove-Item -LiteralPath $abs -Force}}
Remove-AuditNode $auditRoot
Assert-AuditWork
$result=@{pass=$true;removedFiles=$auditFiles;freedBytes=$auditBytes;root=$auditRoot;workPreserved=$true;reportsPreserved=$true}
$result|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $auditHere 'cleanup.json') -Encoding UTF8
$result|ConvertTo-Json -Compress
