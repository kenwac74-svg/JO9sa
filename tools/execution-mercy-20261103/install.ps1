$ErrorActionPreference = 'Stop'
$executionRepo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$executionRestore = Get-Content -LiteralPath (Join-Path $executionRepo 'backups\before-execution-mercy-20261103\RESTORE.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$executionProof = Get-Content -LiteralPath (Join-Path $executionRepo 'records\execution-mercy-20261103\verification.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$executionCandidate = Join-Path $executionRepo 'tmp\execution-mercy-20261103\candidate\jack.qsp'
function Get-ExecutionHash([string]$File) { (Get-FileHash -LiteralPath $File -Algorithm SHA256).Hash.ToLowerInvariant() }
if (-not $executionProof.nativePass -or -not $executionProof.officialPatchReplayByteEqual -or -not $executionProof.idempotencePass) { throw 'Verification incomplete.' }
if ((Get-ExecutionHash $executionRestore.qspTarget) -ne $executionProof.beforeSha256) { throw 'WORK changed after backup; stopped without writing.' }
if ((Get-ExecutionHash $executionRestore.qspBackup) -ne $executionProof.beforeSha256) { throw 'Backup mismatch; stopped without writing.' }
if ((Get-ExecutionHash $executionCandidate) -ne $executionProof.afterSha256) { throw 'Candidate mismatch; stopped without writing.' }
try {
    [IO.File]::WriteAllBytes($executionRestore.qspTarget, [IO.File]::ReadAllBytes($executionCandidate))
    if ((Get-ExecutionHash $executionRestore.qspTarget) -ne $executionProof.afterSha256) { throw 'Installed QSP mismatch.' }
} catch {
    [IO.File]::WriteAllBytes($executionRestore.qspTarget, [IO.File]::ReadAllBytes($executionRestore.qspBackup))
    throw
}
$executionResult = [ordered]@{
    installedAt = (Get-Date).ToString('o')
    target = $executionRestore.qspTarget
    backup = $executionRestore.qspBackup
    beforeSha256 = $executionProof.beforeSha256
    afterSha256 = Get-ExecutionHash $executionRestore.qspTarget
    nativeAssertions = $executionProof.nativeAssertions
    nativePass = $true
    officialPatchReplayByteEqual = $true
    idempotencePass = $true
    scope = 'One guarded -1 point call on execution completion. Banishment, confirmation, score helper and every other QSP field unchanged.'
}
$executionResult | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $executionRepo 'records\execution-mercy-20261103\install.json') -Encoding UTF8
$executionResult | ConvertTo-Json -Depth 4
