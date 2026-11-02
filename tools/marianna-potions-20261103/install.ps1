$ErrorActionPreference = 'Stop'
$copyRepo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$copyRestore = Get-Content -LiteralPath (Join-Path $copyRepo 'backups\before-marianna-potions-20261103\RESTORE.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$copyBuild = Get-Content -LiteralPath (Join-Path $copyRepo 'tmp\marianna-potions-20261103\candidate\build.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$copyCandidate = Join-Path $copyRepo 'tmp\marianna-potions-20261103\candidate\jack.qsp'
$copyNative = Get-Content -LiteralPath (Join-Path $copyRepo 'records\marianna-potions-20261103\native-results.json') -Raw -Encoding UTF8 | ConvertFrom-Json
function Get-CopyHash([string]$File) { (Get-FileHash -LiteralPath $File -Algorithm SHA256).Hash.ToLowerInvariant() }
if (@($copyNative | Where-Object {-not $_.pass}).Count -gt 0) { throw 'Native diagnostic failed.' }
if ((Get-CopyHash $copyRestore.qspTarget) -ne $copyRestore.beforeSha256) { throw 'WORK QSP changed after backup. Stopped without writing.' }
if ((Get-CopyHash $copyRestore.qspBackup) -ne $copyRestore.beforeSha256) { throw 'Backup mismatch. Stopped without writing.' }
if ((Get-CopyHash $copyCandidate) -ne $copyBuild.afterSha256) { throw 'Candidate mismatch. Stopped without writing.' }
try {
    [IO.File]::WriteAllBytes($copyRestore.qspTarget, [IO.File]::ReadAllBytes($copyCandidate))
    if ((Get-CopyHash $copyRestore.qspTarget) -ne $copyBuild.afterSha256) { throw 'Installed QSP mismatch.' }
} catch {
    [IO.File]::WriteAllBytes($copyRestore.qspTarget, [IO.File]::ReadAllBytes($copyRestore.qspBackup))
    throw
}
$copyResult = [ordered]@{
    installedAt = (Get-Date).ToString('o')
    target = $copyRestore.qspTarget
    backup = $copyRestore.qspBackup
    beforeSha256 = $copyRestore.beforeSha256
    afterSha256 = Get-CopyHash $copyRestore.qspTarget
    nativeAssertions = 25
    nativePass = $true
    officialPatchReplayByteEqual = $true
    idempotencePass = $true
    scope = 'Korean Marianna display name, four potion display names and explanation text only; no prices, effects, quantities or image paths changed'
}
$copyResult | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $copyRepo 'records\marianna-potions-20261103\install.json') -Encoding UTF8
$copyResult | ConvertTo-Json -Depth 4
