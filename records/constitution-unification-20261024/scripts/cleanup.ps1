$ErrorActionPreference = 'Stop'
$taskRecord = 'G:\somi\JO9sa\records\constitution-unification-20261024'
$taskGame = 'G:\somi\Jack O Nine Tails v2.4_work\game'
$taskPatch = Get-Content -LiteralPath ($taskRecord + '\patch.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if ((Get-FileHash -LiteralPath ($taskGame + '\jack.qsp') -Algorithm SHA256).Hash -ne $taskPatch.after_sha256) { throw 'WORK drift' }
if (-not (Test-Path -LiteralPath ($taskRecord + '\before.qsp.gz'))) { throw 'Recovery absent' }
$taskRecovery = [IO.File]::OpenRead($taskRecord + '\before.qsp.gz')
try {
  $taskGzip = New-Object IO.Compression.GZipStream($taskRecovery, [IO.Compression.CompressionMode]::Decompress)
  try {
    $taskHasher = [Security.Cryptography.SHA256]::Create()
    try { $taskRecoveryHash = [BitConverter]::ToString($taskHasher.ComputeHash($taskGzip)).Replace('-', '').ToLowerInvariant() }
    finally { $taskHasher.Dispose() }
  } finally { $taskGzip.Dispose() }
} finally { $taskRecovery.Dispose() }
if ($taskRecoveryHash -ne $taskPatch.before_sha256) { throw 'Compressed recovery mismatch' }
$removed = @()
$taskRoots = @('G:\Codex\tmp\jo9-constitution-unification-20261024', 'G:\Codex\tmp\jo9-constitution-unification-release-20261024')
foreach ($target in $taskRoots) {
  $resolved = [IO.Path]::GetFullPath($target)
  if ($resolved -ne $target -or -not $resolved.StartsWith('G:\Codex\tmp\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Target outside task temporary space' }
  if (-not (Test-Path -LiteralPath $resolved)) { throw 'Expected task root absent' }
  $rootItem = Get-Item -LiteralPath $resolved -Force
  if ($rootItem.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Reparse root' }
  $stack = New-Object 'System.Collections.Generic.Stack[string]'
  $stack.Push($resolved)
  $fileCount = 0
  [long]$byteCount = 0
  while ($stack.Count -gt 0) {
    $dir = $stack.Pop()
    foreach ($item in Get-ChildItem -LiteralPath $dir -Force) {
      if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw ('Refuse reparse member: ' + $item.FullName) }
      if ($item.PSIsContainer) { $stack.Push($item.FullName) } else { $fileCount++; $byteCount += $item.Length }
    }
  }
  $removed += [pscustomobject]@{path=$resolved; files=$fileCount; bytes=$byteCount; reparsePoints=0}
}
$backupFiles = @()
$createdBackups = Get-Content -LiteralPath ($taskRecord + '\install-backups.json') -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($backup in $createdBackups) {
  $resolved = [IO.Path]::GetFullPath($backup)
  if ([IO.Path]::GetDirectoryName($resolved) -ne $taskGame -or [IO.Path]::GetFileName($resolved) -notmatch '^jack\.qsp\.bak_') { throw 'Unexpected backup path' }
  $item = Get-Item -LiteralPath $resolved -Force
  if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Reparse backup' }
  if ((Get-FileHash -LiteralPath $resolved -Algorithm SHA256).Hash -ne $taskPatch.before_sha256) { throw 'Backup does not match compressed recovery' }
  $backupFiles += $resolved
}
foreach ($entry in $removed) { Remove-Item -LiteralPath $entry.path -Recurse -Force }
foreach ($backup in $backupFiles) { Remove-Item -LiteralPath $backup -Force }
foreach ($entry in $removed) { if (Test-Path -LiteralPath $entry.path) { throw 'Temporary root survived' } }
$result = [ordered]@{status='PASS'; removedTemporaryRoots=$removed; removedDuplicateInstallBackups=$backupFiles; recovery='before.qsp.gz'; recoveryHash=$taskRecoveryHash; coreReportsAndReproductionScriptsRetained=$true; originalUserSavesRemoved=$false}
$result | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath ($taskRecord + '\cleanup.json') -Encoding UTF8
$result | ConvertTo-Json -Depth 6
