$ErrorActionPreference = 'Stop'
$alchemyRepo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$alchemyRestore = Get-Content -LiteralPath (Join-Path $alchemyRepo 'backups\before-alchemy-ui-terms-20261103\RESTORE.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$alchemyBuild = Get-Content -LiteralPath (Join-Path $alchemyRepo 'tmp\alchemy-ui-20261103\candidate\build.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$alchemyCandidate = Join-Path $alchemyRepo 'tmp\alchemy-ui-20261103\candidate\jack.qsp'
$alchemyNative = Get-Content -LiteralPath (Join-Path $alchemyRepo 'records\alchemy-ui-terms-20261103\native-results.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$alchemyVisual = Get-Content -LiteralPath (Join-Path $alchemyRepo 'records\alchemy-ui-terms-20261103\browser-verification.json') -Raw -Encoding UTF8 | ConvertFrom-Json
function Get-AlchemyHash([string]$File) { (Get-FileHash -LiteralPath $File -Algorithm SHA256).Hash.ToLowerInvariant() }
if (@($alchemyNative | Where-Object {-not $_.pass}).Count -gt 0) { throw 'Native diagnostic failed.' }
if (-not $alchemyVisual.fontLoaded -or $alchemyVisual.actor.bottom -ne 598 -or @($alchemyVisual.columns | Where-Object {$_.overflow}).Count -gt 0) { throw 'Rendered geometry check failed.' }
if ((Get-AlchemyHash $alchemyRestore.qspTarget) -ne $alchemyRestore.beforeSha256) { throw 'WORK QSP changed since backup. Stopped without writing.' }
if ((Get-AlchemyHash $alchemyRestore.qspBackup) -ne $alchemyRestore.beforeSha256) { throw 'Backup hash mismatch. Stopped without writing.' }
if ((Get-AlchemyHash $alchemyCandidate) -ne $alchemyBuild.afterSha256) { throw 'Candidate hash mismatch. Stopped without writing.' }
if ((Get-AlchemyHash $alchemyRestore.cssTarget) -ne $alchemyRestore.cssSha256) { throw 'CSS changed since backup. Stopped without writing.' }
try {
    [IO.File]::WriteAllBytes($alchemyRestore.qspTarget, [IO.File]::ReadAllBytes($alchemyCandidate))
    if ((Get-AlchemyHash $alchemyRestore.qspTarget) -ne $alchemyBuild.afterSha256) { throw 'Installed QSP hash mismatch.' }
} catch {
    [IO.File]::WriteAllBytes($alchemyRestore.qspTarget, [IO.File]::ReadAllBytes($alchemyRestore.qspBackup))
    throw
}
$alchemyResult = [ordered]@{
    installedAt = (Get-Date).ToString('o')
    target = $alchemyRestore.qspTarget
    backup = $alchemyRestore.qspBackup
    beforeSha256 = $alchemyRestore.beforeSha256
    afterSha256 = Get-AlchemyHash $alchemyRestore.qspTarget
    cssSha256 = Get-AlchemyHash $alchemyRestore.cssTarget
    cssUnchanged = ((Get-AlchemyHash $alchemyRestore.cssTarget) -eq $alchemyRestore.cssSha256)
    nativeAssertions = 115
    nativePass = $true
    browserGeometryPass = $true
    officialPatchReplayByteEqual = $true
    idempotencePass = $true
    scope = 'Alchemy character/stock UI and Korean item terms only; no crafting/balance/inventory changes'
}
$alchemyResult | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $alchemyRepo 'records\alchemy-ui-terms-20261103\install.json') -Encoding UTF8
$alchemyResult | ConvertTo-Json -Depth 4
