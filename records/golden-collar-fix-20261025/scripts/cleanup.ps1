$ErrorActionPreference='Stop'
$gcRecord='G:\somi\JO9sa\records\golden-collar-fix-20261025'
$gcInstall=Get-Content -LiteralPath (Join-Path $gcRecord 'installed.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$gcExpected='a70bd177d8e7ade58243578b2f04745ff00cec3884d26d3b924dfffc8a8d007a'
if ((Get-FileHash -LiteralPath 'G:\somi\Jack O Nine Tails v2.4_work\game\jack.qsp' -Algorithm SHA256).Hash.ToLower() -ne $gcExpected) { throw 'WORK hash changed; stop cleanup' }
$gcAllowed=@('G:\Codex\tmp\jo9-golden-collar-fix-20261025','G:\Codex\tmp\jo9-gc-release-20261025')
$gcEntries=@()
foreach($gcTarget in $gcAllowed){
 $gcResolved=(Resolve-Path -LiteralPath $gcTarget).Path
 if($gcResolved -cne $gcTarget -or -not $gcResolved.StartsWith('G:\Codex\tmp\',[StringComparison]::OrdinalIgnoreCase)){throw 'Unexpected absolute target'}
 $gcAll=@(Get-Item -LiteralPath $gcResolved -Force)+@(Get-ChildItem -LiteralPath $gcResolved -Force -Recurse)
 if(@($gcAll | Where-Object {($_.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0}).Count -gt 0){throw 'Reparse point present; stop cleanup'}
 $gcEntries += [pscustomobject]@{path=$gcResolved;files=@($gcAll | Where-Object {-not $_.PSIsContainer}).Count;bytes=($gcAll | Where-Object {-not $_.PSIsContainer} | Measure-Object Length -Sum).Sum}
}
$gcBackups=@()
foreach($gcName in $gcInstall.newGameFolderFiles){
 if($gcName -notlike 'jack.qsp.bak*'){throw 'Unexpected game-folder output; stop cleanup'}
 $gcBackup=Join-Path 'G:\somi\Jack O Nine Tails v2.4_work\game' $gcName
 $gcItem=Get-Item -LiteralPath $gcBackup -Force
 if($gcItem.PSIsContainer -or ($gcItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0){throw 'Unexpected backup type'}
 if((Get-FileHash -LiteralPath $gcBackup -Algorithm SHA256).Hash.ToLower() -notin @($gcInstall.before,$gcInstall.intermediate)){throw 'Backup mismatch'}
 $gcBackups += $gcBackup
}
# The compressed unique recovery copy has already been decompressed and hash-verified by install.cjs.
if(-not(Test-Path -LiteralPath (Join-Path $gcRecord 'before.qsp.gz') -PathType Leaf)){throw 'Recovery copy missing'}
foreach($gcEntry in $gcEntries){Remove-Item -LiteralPath $gcEntry.path -Recurse -Force}
foreach($gcBackup in $gcBackups){Remove-Item -LiteralPath $gcBackup -Force}
@{status='CLEANED_VERIFIED_TASK_OUTPUTS_ONLY';removedTemporaryRoots=$gcEntries;removedRedundantInstallerBackups=$gcBackups;recovery='before.qsp.gz';protectedOriginalSaves='unchanged'} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $gcRecord 'cleanup.json') -Encoding UTF8
Write-Output 'Task diagnostic copies removed; reports, scripts, patch and verified compressed baseline retained.'
