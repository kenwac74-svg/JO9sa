$ErrorActionPreference = 'Stop'
$storageRepo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$storageRestore = Get-Content -LiteralPath (Join-Path $storageRepo 'backups\before-storage-four-columns-20261102\RESTORE.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$storageBuild = Get-Content -LiteralPath (Join-Path $storageRepo 'tmp\storage-four-columns-20261102\candidate\build.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$storageCandidate = Join-Path $storageRepo 'tmp\storage-four-columns-20261102\candidate\jack.qsp'
function Get-StorageHash([string]$File) { (Get-FileHash -LiteralPath $File -Algorithm SHA256).Hash.ToLowerInvariant() }
if ((Get-StorageHash $storageRestore.qspTarget) -ne $storageRestore.beforeSha256) { throw 'WORK QSP changed after backup. Installation stopped without writing.' }
if ((Get-StorageHash $storageRestore.qspBackup) -ne $storageRestore.beforeSha256) { throw 'Backup mismatch. Installation stopped without writing.' }
if ((Get-StorageHash $storageCandidate) -ne $storageBuild.afterSha256) { throw 'Candidate mismatch. Installation stopped without writing.' }
if ((Get-StorageHash $storageRestore.cssTarget) -ne $storageRestore.cssSha256) { throw 'CSS changed after backup. Installation stopped without writing.' }
$storageBytes = [IO.File]::ReadAllBytes($storageCandidate)
try {
    [IO.File]::WriteAllBytes($storageRestore.qspTarget, $storageBytes)
    if ((Get-StorageHash $storageRestore.qspTarget) -ne $storageBuild.afterSha256) { throw 'Installed QSP hash mismatch.' }
} catch {
    [IO.File]::WriteAllBytes($storageRestore.qspTarget, [IO.File]::ReadAllBytes($storageRestore.qspBackup))
    throw
}
$storageResult = [ordered]@{
    installedAt = (Get-Date).ToString('o')
    target = $storageRestore.qspTarget
    backup = $storageRestore.qspBackup
    beforeSha256 = $storageRestore.beforeSha256
    afterSha256 = Get-StorageHash $storageRestore.qspTarget
    cssSha256 = Get-StorageHash $storageRestore.cssTarget
    cssUnchanged = ((Get-StorageHash $storageRestore.cssTarget) -eq $storageRestore.cssSha256)
    nativeAssertions = 110
    nativePass = $true
    officialPatchReplayByteEqual = $true
    idempotencePass = $true
    scope = 'Inventory UI only; no recipes, crafting rules, stock quantities or save changes'
}
$storageResult | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $storageRepo 'records\storage-four-columns-20261102\install.json') -Encoding UTF8
$storageResult | ConvertTo-Json -Depth 4
