$ErrorActionPreference='Stop'
$cropHere=$PSScriptRoot
$cropRecord=Get-Content -LiteralPath (Join-Path $cropHere 'installation.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$cropLive=Get-Content -LiteralPath (Join-Path $cropHere 'live-results.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if(-not $cropLive.pass -or $cropRecord.status -ne 'INSTALLED_AND_LIVE_VERIFIED'){throw 'Final verification required'}
$cropRoot='G:\Codex\tmp\mob-portrait-crop-20261030'
if([IO.Path]::GetFullPath($cropRoot) -ne $cropRoot){throw 'Unexpected temporary root'}
foreach($p in @('G:\Codex','G:\Codex\tmp')){if((Get-Item -LiteralPath $p -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Reparse ancestor'}}
function Assert-CropProtected{
 foreach($property in $cropRecord.preserved.PSObject.Properties){if((Get-FileHash -LiteralPath $property.Name -Algorithm SHA256).Hash.ToLowerInvariant() -ne $property.Value){throw ('Protected file changed: '+$property.Name)}}
}
Assert-CropProtected
$script:cropCount=0;$script:cropBytes=0
function Remove-CropTestTree([string]$p){
 $abs=[IO.Path]::GetFullPath($p)
 if($abs -ne $cropRoot -and -not $abs.StartsWith($cropRoot+'\',[StringComparison]::OrdinalIgnoreCase)){throw 'Outside temporary root'}
 $entry=Get-Item -LiteralPath $abs -Force
 if($entry.Attributes -band [IO.FileAttributes]::ReparsePoint){throw ('Unexpected link: '+$abs)}
 if($entry.PSIsContainer){foreach($child in Get-ChildItem -LiteralPath $abs -Force){Remove-CropTestTree $child.FullName};Remove-Item -LiteralPath $abs -Force}
 else{$script:cropCount++;$script:cropBytes+=$entry.Length;Remove-Item -LiteralPath $abs -Force}
}
Remove-CropTestTree $cropRoot
Assert-CropProtected
$result=@{pass=$true;root=$cropRoot;removedFiles=$cropCount;freedBytes=$cropBytes;productionProtected=$true;sourceAndReportsPreserved=$true}
$result|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $cropHere 'cleanup.json') -Encoding UTF8
$result|ConvertTo-Json -Compress
