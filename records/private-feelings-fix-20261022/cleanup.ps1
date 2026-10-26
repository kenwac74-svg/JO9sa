$ErrorActionPreference='Stop'
$taskRecord='G:/somi/JO9sa/records/private-feelings-fix-20261022'
$taskFinal=Get-Content -LiteralPath (Join-Path $taskRecord 'FINAL_RESULT.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if($taskFinal.status -ne 'APPLIED_TO_WORK_UNRELEASED' -or $taskFinal.officialReleaseVerdict -ne 'PASS'){throw 'Final evidence missing'}
$taskGame='G:/somi/Jack O Nine Tails v2.4_work/game'
$taskExpected=$taskFinal.afterSha256
if((Get-FileHash -LiteralPath (Join-Path $taskGame 'jack.qsp') -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskExpected){throw 'WORK changed before cleanup'}
if((Get-FileHash -LiteralPath $taskFinal.recovery -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskFinal.beforeSha256){throw 'Unique recovery original not verified'}
$taskTmp='G:/Codex/tmp'
$taskRoots=@('jo9-private-feelings-fix-20261022','jo9-private-feelings-release-20261022','jo9-private-feelings-release-final-20261022','jo9-private-feelings-state-20261022','jo9-private-feelings-timing-20261022')
$taskTotalBytes=0L
foreach($taskName in $taskRoots){
 $taskPath=[IO.Path]::GetFullPath((Join-Path $taskTmp $taskName))
 if([IO.Path]::GetDirectoryName($taskPath).TrimEnd('\') -ne [IO.Path]::GetFullPath($taskTmp).TrimEnd('\') -or [IO.Path]::GetFileName($taskPath) -ne $taskName){throw "Out of task scope: $taskPath"}
 if(-not(Test-Path -LiteralPath $taskPath)){continue}
 $taskItem=Get-Item -LiteralPath $taskPath -Force
 if($taskItem.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Task root is a reparse point'}
 $taskChildren=@(Get-ChildItem -LiteralPath $taskPath -Recurse -Force)
 if(@($taskChildren | Where-Object {$_.Attributes -band [IO.FileAttributes]::ReparsePoint}).Count -gt 0){throw 'Reparse point in disposable task tree'}
 $taskTotalBytes += ($taskChildren | Where-Object {-not $_.PSIsContainer} | Measure-Object Length -Sum).Sum
}
$taskApplyBefore=Get-Content -LiteralPath 'G:/Codex/tmp/jo9-private-feelings-fix-20261022/apply-before.json' -Raw -Encoding UTF8 | ConvertFrom-Json
$taskRemovedBackups=@()
foreach($taskBackup in @(Get-ChildItem -LiteralPath $taskGame -Filter 'jack.qsp.bak_*' -File)){
 if($taskBackup.Name -in @($taskApplyBefore.adjacentBackups)){continue}
 if($taskBackup.DirectoryName -ne [IO.Path]::GetFullPath($taskGame)){throw 'Unexpected backup path'}
 if((Get-FileHash -LiteralPath $taskBackup.FullName -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskFinal.beforeSha256){throw 'Unexpected new backup contents; preserve for review'}
 Remove-Item -LiteralPath $taskBackup.FullName -Force
 $taskRemovedBackups += $taskBackup.Name
}
foreach($taskName in $taskRoots){$taskPath=[IO.Path]::GetFullPath((Join-Path $taskTmp $taskName));if(Test-Path -LiteralPath $taskPath){Remove-Item -LiteralPath $taskPath -Recurse -Force}}
$taskCleanup=[ordered]@{status='PASS';removedDisposableBytes=$taskTotalBytes;removedTaskRoots=$taskRoots;removedDuplicateAdjacentBackups=$taskRemovedBackups;uniqueRecoveryRetained=$taskFinal.recovery;workSha256=$taskExpected;recordRetained=$taskRecord}
$taskCleanup | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $taskRecord 'cleanup.json') -Encoding UTF8
$taskCleanup | ConvertTo-Json -Depth 5
