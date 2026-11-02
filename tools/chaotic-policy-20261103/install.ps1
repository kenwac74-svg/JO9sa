$ErrorActionPreference = 'Stop'
$chaoticRepo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$chaoticRestore = Get-Content -LiteralPath (Join-Path $chaoticRepo 'backups\before-chaotic-policy-20261103\RESTORE.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$chaoticProof = Get-Content -LiteralPath (Join-Path $chaoticRepo 'records\chaotic-policy-20261103\verification.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$chaoticCandidate = Join-Path $chaoticRepo 'tmp\chaotic-policy-20261103\candidate\jack.qsp'
function Get-ChaoticHash([string]$File) { (Get-FileHash -LiteralPath $File -Algorithm SHA256).Hash.ToLowerInvariant() }
if (-not $chaoticProof.nativePass -or -not $chaoticProof.officialPatchReplayByteEqual -or -not $chaoticProof.idempotencePass -or $chaoticProof.physicalDecisionPending) { throw 'Verification or approval incomplete.' }
if ((Get-ChaoticHash $chaoticRestore.qspTarget) -ne $chaoticProof.beforeSha256) { throw 'WORK QSP changed after backup; stopped without writing.' }
if ((Get-ChaoticHash $chaoticRestore.qspBackup) -ne $chaoticProof.beforeSha256) { throw 'Backup mismatch; stopped without writing.' }
if ((Get-ChaoticHash $chaoticCandidate) -ne $chaoticProof.afterSha256) { throw 'Candidate mismatch; stopped without writing.' }
try {
    [IO.File]::WriteAllBytes($chaoticRestore.qspTarget, [IO.File]::ReadAllBytes($chaoticCandidate))
    if ((Get-ChaoticHash $chaoticRestore.qspTarget) -ne $chaoticProof.afterSha256) { throw 'Installed QSP mismatch.' }
} catch {
    [IO.File]::WriteAllBytes($chaoticRestore.qspTarget, [IO.File]::ReadAllBytes($chaoticRestore.qspBackup))
    throw
}
$chaoticResult = [ordered]@{
    installedAt = (Get-Date).ToString('o')
    target = $chaoticRestore.qspTarget
    backup = $chaoticRestore.qspBackup
    beforeSha256 = $chaoticProof.beforeSha256
    afterSha256 = Get-ChaoticHash $chaoticRestore.qspTarget
    nativeAssertions = $chaoticProof.nativeAssertions
    nativePass = $true
    officialPatchReplayByteEqual = $true
    idempotencePass = $true
    scope = 'Only jo9_chaotic eligibility: approved priority/fallback, protected physical traits and metabolism exception. Other locations, removal cleanup, prices, images, translations and personal saves unchanged.'
}
$chaoticResult | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $chaoticRepo 'records\chaotic-policy-20261103\install.json') -Encoding UTF8
$chaoticResult | ConvertTo-Json -Depth 4
