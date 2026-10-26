$ErrorActionPreference='Stop'
$gcTarget='G:\Codex\tmp\jo9-collar-runtime-20261025'
$gcRec='G:\somi\JO9sa\records\collar-runtime-test-20261025'
$gcResult=Get-Content -LiteralPath (Join-Path $gcRec 'result.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if($gcResult.status -ne 'PASS' -or $gcResult.guiDiskLoadCases -ne 4 -or $gcResult.nativeFullDayCases -ne 4){throw 'Final test evidence missing'}
$gcResolved=(Resolve-Path -LiteralPath $gcTarget).Path
if($gcResolved -cne $gcTarget -or -not $gcResolved.StartsWith('G:\Codex\tmp\',[StringComparison]::OrdinalIgnoreCase)){throw 'Unexpected absolute target'}
$gcAll=@(Get-Item -LiteralPath $gcResolved -Force)+@(Get-ChildItem -LiteralPath $gcResolved -Recurse -Force)
if(@($gcAll | Where-Object {($_.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0}).Count -gt 0){throw 'Reparse point present; do not follow it'}
$gcInputs=Get-Content -LiteralPath (Join-Path $gcRec 'input-hashes.json') -Raw -Encoding UTF8 | ConvertFrom-Json
foreach($gcFile in $gcInputs){if((Get-FileHash -LiteralPath $gcFile.path -Algorithm SHA256).Hash.ToLower() -ne $gcFile.sha256){throw ('Protected input changed: '+$gcFile.path)}}
$gcCount=@($gcAll | Where-Object {-not $_.PSIsContainer}).Count
$gcBytes=($gcAll | Where-Object {-not $_.PSIsContainer} | Measure-Object Length -Sum).Sum
Remove-Item -LiteralPath $gcResolved -Recurse -Force
@{status='CLEANED_TASK_DIAGNOSTICS_ONLY';absoluteTarget=$gcResolved;files=$gcCount;bytes=$gcBytes;protectedInputs=$gcInputs.Count;originalSavesPreserved=84} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $gcRec 'cleanup.json') -Encoding UTF8
Write-Output 'Verified test copies removed; original saves, WORK, reports and reproduction scripts retained.'
