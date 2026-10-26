$ErrorActionPreference = 'Stop'
$taskRecord = 'G:\somi\JO9sa\records\trait-overview-ui-20261025'
$taskGame = [IO.Path]::GetFullPath('G:\somi\Jack O Nine Tails v2.4_work\game').TrimEnd('\')
$taskResult = Get-Content -LiteralPath (Join-Path $taskRecord 'application-result.json') -Raw | ConvertFrom-Json
$taskVerification = Get-Content -LiteralPath (Join-Path $taskRecord 'final-verification.json') -Raw | ConvertFrom-Json
if ($taskVerification.status -ne 'PASS') { throw 'Final verification is required before cleanup.' }
if ((Get-FileHash -LiteralPath (Join-Path $taskGame 'jack.qsp') -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskResult.after) { throw 'WORK drifted after installation.' }
if (-not (Test-Path -LiteralPath (Join-Path $taskRecord 'before.qsp.gz') -PathType Leaf)) { throw 'Compressed baseline is missing.' }
$taskRoots = @('G:\Codex\tmp\jo9-trait-overview-20261025', 'G:\Codex\tmp\jo9-trait-overview-release-20261025')
$taskChecked = @()
foreach ($taskRoot in $taskRoots) {
    $taskAbsolute = [IO.Path]::GetFullPath($taskRoot).TrimEnd('\')
    if ($taskAbsolute -ne $taskRoot -or (Split-Path -Parent $taskAbsolute) -ne 'G:\Codex\tmp') { throw "Unexpected cleanup scope: $taskAbsolute" }
    if (-not (Test-Path -LiteralPath $taskAbsolute)) { continue }
    $taskQueue = New-Object 'System.Collections.Generic.Queue[string]'
    $taskQueue.Enqueue($taskAbsolute)
    $taskFiles = 0
    $taskBytes = [long]0
    while ($taskQueue.Count -gt 0) {
        $taskDirectory = $taskQueue.Dequeue()
        $taskDirItem = Get-Item -LiteralPath $taskDirectory -Force
        if (($taskDirItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Reparse point not allowed: $taskDirectory" }
        foreach ($taskChild in Get-ChildItem -LiteralPath $taskDirectory -Force) {
            if (($taskChild.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Reparse point not allowed: $($taskChild.FullName)" }
            if ($taskChild.PSIsContainer) { $taskQueue.Enqueue($taskChild.FullName) }
            else { $taskFiles++; $taskBytes += $taskChild.Length }
        }
    }
    $taskChecked += [pscustomobject]@{ path = $taskAbsolute; files = $taskFiles; bytes = $taskBytes; noReparsePoints = $true }
}
$taskBackups = @($taskResult.temporaryDuplicateBackups)
foreach ($taskBackup in $taskBackups) {
    $taskBackupAbsolute = [IO.Path]::GetFullPath($taskBackup)
    if ((Split-Path -Parent $taskBackupAbsolute) -ne $taskGame -or (Split-Path -Leaf $taskBackupAbsolute) -notmatch '^jack\.qsp\.bak_20261025_\d{6}$') { throw "Unexpected backup path: $taskBackupAbsolute" }
    if ((Get-FileHash -LiteralPath $taskBackupAbsolute -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskResult.before) { throw 'Duplicate backup differs from retained compressed baseline.' }
}
foreach ($taskItem in $taskChecked) { Remove-Item -LiteralPath $taskItem.path -Recurse -Force; if (Test-Path -LiteralPath $taskItem.path) { throw 'Temporary root remains.' } }
foreach ($taskBackup in $taskBackups) { Remove-Item -LiteralPath $taskBackup -Force }
$taskResult.temporaryDuplicateBackups = @()
$taskResult | Add-Member -NotePropertyName temporaryDuplicateBackupsRemoved -NotePropertyValue $true -Force
$taskResult | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath (Join-Path $taskRecord 'application-result.json') -Encoding UTF8
[pscustomobject]@{ status = 'PASS'; checkedTemporaryRoots = $taskChecked; duplicateRawBackupsRemoved = $taskBackups; retained = @('before.qsp.gz','patch.json','scripts','MANUAL_KO.md','verification reports','HTML/log/PNG evidence'); originalSavesRemoved = 0; FullChanged = $false } | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath (Join-Path $taskRecord 'cleanup-result.json') -Encoding UTF8
Copy-Item -LiteralPath $PSCommandPath -Destination (Join-Path $taskRecord 'scripts\cleanup.ps1') -Force
Write-Output 'PASS: task temporary copies removed; compressed baseline, records, scripts, and original saves retained.'
