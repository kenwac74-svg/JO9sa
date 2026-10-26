$ErrorActionPreference='Stop'
$recordDir='G:\somi\JO9sa\records\argon-selective-followup-20261021'
$taskTemp=[IO.Path]::GetFullPath('G:\Codex\tmp\argon-selective-followup-20261021')
$expectedTask=[IO.Path]::GetFullPath('G:\Codex\tmp\argon-selective-followup-20261021')
if (-not [StringComparer]::OrdinalIgnoreCase.Equals($taskTemp,$expectedTask)) { throw 'Unexpected temporary target' }
if (-not [StringComparer]::OrdinalIgnoreCase.Equals([IO.Path]::GetDirectoryName($taskTemp),[IO.Path]::GetFullPath('G:\Codex\tmp'))) { throw 'Unexpected parent' }
$app=Get-Content -LiteralPath (Join-Path $recordDir 'application.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$recovery=Get-Content -LiteralPath (Join-Path $recordDir 'inputs-and-recovery.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if ((Get-FileHash -LiteralPath $app.work -Algorithm SHA256).Hash.ToLowerInvariant() -ne $app.after) { throw 'Installed Work hash drift' }
if ((Get-FileHash -LiteralPath $recovery.backup -Algorithm SHA256).Hash.ToLowerInvariant() -ne $recovery.backup_sha256) { throw 'Recovery ZIP hash drift' }
if (-not $recovery.entry_verified) { throw 'Recovery entry not verified' }
$bytesToFree=[int64]0
$filesToRemove=0
if (Test-Path -LiteralPath $taskTemp) {
 $top=Get-Item -LiteralPath $taskTemp -Force
 if ($top.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Temporary root is a reparse point' }
 $todo=New-Object 'System.Collections.Generic.Stack[System.IO.DirectoryInfo]'
 $todo.Push([IO.DirectoryInfo]$top)
 while ($todo.Count -gt 0) {
  $dir=$todo.Pop()
  foreach ($item in $dir.GetFileSystemInfos()) {
   if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw ('Reparse point found; no deletion: '+$item.FullName) }
   if ($item.Attributes -band [IO.FileAttributes]::Directory) { $todo.Push([IO.DirectoryInfo]$item) }
   else { $bytesToFree += ([IO.FileInfo]$item).Length; $filesToRemove++ }
  }
 }
 Remove-Item -LiteralPath $taskTemp -Recurse -Force
}
$removedBackups=@()
$workDirectory=[IO.Path]::GetDirectoryName([IO.Path]::GetFullPath($app.work))
foreach ($entry in $app.temporaryApplyBackups) {
 $backupFile=[IO.Path]::GetFullPath([string]$entry)
 if (-not [StringComparer]::OrdinalIgnoreCase.Equals([IO.Path]::GetDirectoryName($backupFile),$workDirectory)) { throw 'Backup path outside expected Work directory' }
 if (-not [IO.Path]::GetFileName($backupFile).StartsWith('jack.qsp.bak_',[StringComparison]::Ordinal)) { throw 'Unexpected backup filename' }
 if (Test-Path -LiteralPath $backupFile) {
  $info=Get-Item -LiteralPath $backupFile -Force
  if ($info.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Backup is reparse point' }
  if ((Get-FileHash -LiteralPath $backupFile -Algorithm SHA256).Hash.ToLowerInvariant() -ne $app.before) { throw 'Temporary backup differs from verified compressed recovery' }
  $bytesToFree += $info.Length
  Remove-Item -LiteralPath $backupFile -Force
  $removedBackups += $backupFile
 }
}
if (Test-Path -LiteralPath $taskTemp) { throw 'Temporary directory remains' }
$result=[ordered]@{status='CLEANED';temporaryRoot=$taskTemp;pathAndReparseChecks='PASS';temporaryFilesRemoved=$filesToRemove;temporaryApplyBackupsRemoved=$removedBackups;bytesFreed=$bytesToFree;verifiedRecoveryZipRetained=$recovery.backup;workSha256=$app.after;diagnosticQspCopiesRemaining=0}
$result | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $recordDir 'cleanup.json') -Encoding UTF8
$result | ConvertTo-Json -Depth 5
