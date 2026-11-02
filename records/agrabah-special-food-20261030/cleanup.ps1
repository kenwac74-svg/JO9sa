$ErrorActionPreference='Stop'
$agrabaHere=$PSScriptRoot
$agrabaConfig=Get-Content -LiteralPath (Join-Path $agrabaHere 'path.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$agrabaInstalled=Get-Content -LiteralPath (Join-Path $agrabaHere 'installation.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$agrabaVerified=Get-Content -LiteralPath (Join-Path $agrabaHere 'verification.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if(-not $agrabaVerified.pass -or $agrabaInstalled.status -ne 'INSTALLED_AND_VERIFIED'){throw 'Final verification required'}
$agrabaRoots=@('G:\Codex\tmp\agrabah-special-food-20261030','G:\Codex\tmp\agrabah-special-food-release-20261030')
foreach($p in @('G:\Codex','G:\Codex\tmp')){if((Get-Item -LiteralPath $p -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Reparse ancestor'}}
function Assert-AgrabaHash([string]$p,[string]$expected){if((Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected){throw ('Protected input changed: '+$p)}}
function Assert-AgrabaInputs{
 Assert-AgrabaHash $agrabaInstalled.workQsp $agrabaInstalled.after
 Assert-AgrabaHash $agrabaInstalled.backup $agrabaInstalled.before
 Assert-AgrabaHash $agrabaConfig.stateSave $agrabaConfig.saveSha256
 foreach($p in $agrabaInstalled.cssPaths){Assert-AgrabaHash $p $agrabaInstalled.cssAfter}
 foreach($f in @('REPORT_KO.md','css-delta.json','verification.json','browser-verification.json','native-state-results.json','native-html.json','release-check/report.json')){if(-not(Test-Path -LiteralPath (Join-Path $agrabaHere $f))){throw 'Retained report missing'}}
}
Assert-AgrabaInputs
$script:agrabaCount=0;$script:agrabaBytes=0
function Remove-AgrabaTempTree([string]$p){
 $abs=[IO.Path]::GetFullPath($p)
 if(-not ($agrabaRoots|Where-Object {$abs -eq $_ -or $abs.StartsWith($_+'\',[StringComparison]::OrdinalIgnoreCase)})){throw 'Outside task roots'}
 $entry=Get-Item -LiteralPath $abs -Force
 if($entry.Attributes -band [IO.FileAttributes]::ReparsePoint){throw ('Unexpected link: '+$abs)}
 if($entry.PSIsContainer){foreach($child in Get-ChildItem -LiteralPath $abs -Force){Remove-AgrabaTempTree $child.FullName};Remove-Item -LiteralPath $abs -Force}
 else{$script:agrabaCount++;$script:agrabaBytes+=$entry.Length;Remove-Item -LiteralPath $abs -Force}
}
foreach($root in $agrabaRoots){if([IO.Path]::GetFullPath($root) -ne $root){throw 'Noncanonical temporary path'};if(Test-Path -LiteralPath $root){Remove-AgrabaTempTree $root}}
$agrabaStagedCss='C:\Users\User\.codex\.chatgpt-projects\g-p-6aad063c991081918e27b6675f290be7\output\agrabah-special-food-20261030\candidate-base.css'
if(Test-Path -LiteralPath $agrabaStagedCss){Assert-AgrabaHash $agrabaStagedCss $agrabaInstalled.cssAfter;$agrabaCssItem=Get-Item -LiteralPath $agrabaStagedCss -Force;if($agrabaCssItem.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Unexpected staged CSS link'};$script:agrabaCount++;$script:agrabaBytes+=$agrabaCssItem.Length;Remove-Item -LiteralPath $agrabaStagedCss -Force}
Assert-AgrabaInputs
$result=@{pass=$true;removedFiles=$agrabaCount;freedBytes=$agrabaBytes;roots=$agrabaRoots;workAndBackupPreserved=$true;userSavePreserved=$true;cssSourcePreserved=$true}
$result|ConvertTo-Json -Depth 4|Set-Content -LiteralPath (Join-Path $agrabaHere 'cleanup.json') -Encoding UTF8
$result|ConvertTo-Json -Compress
