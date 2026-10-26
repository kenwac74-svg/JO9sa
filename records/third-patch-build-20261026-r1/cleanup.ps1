$ErrorActionPreference = 'Stop'
$recordDir = 'G:\somi\JO9sa\records\third-patch-build-20261026-r1'
$outputDir = 'G:\somi\JO9_2.4_ThirdPatch_20261026_r1'
$workGame = 'G:\somi\Jack O Nine Tails v2.4_work\game'
$final = Get-Content -LiteralPath (Join-Path $recordDir 'FINAL_RESULT.json') -Raw | ConvertFrom-Json
$prior = Get-Content -LiteralPath 'G:\somi\JO9sa\records\third-patch-prebuild-20261026\FINAL_REPORT.json' -Raw | ConvertFrom-Json
if ($final.status -ne 'READY_FOR_DISTRIBUTION' -or $final.engineVerdict -ne 'PASS' -or $final.independentReview -ne 'PASS') { throw 'Release gates are incomplete.' }
foreach ($name in @('release-validation.json','independent-review.json','PATCH_IMAGE_MANIFEST.json','build.py','finalize.py','client-results.json')) {
    if (-not (Test-Path -LiteralPath (Join-Path $recordDir $name) -PathType Leaf)) { throw "Missing durable evidence: $name" }
}
function Assert-Protected {
    $checks = @(
        @{ Path = (Join-Path $workGame 'jack.qsp'); Hash = $final.qspSha256 },
        @{ Path = 'G:\somi\Jack O Nine Tails v2.4 Kor_Full\game\jack.qsp'; Hash = $prior.fullQsp },
        @{ Path = (Join-Path $workGame 'save\JO9_GOLD_AP_CHECK_20261026.sav'); Hash = $prior.existingGoldTestSave }
    )
    foreach ($check in $checks) {
        if ((Get-FileHash -LiteralPath $check.Path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $check.Hash) { throw "Protected file differs: $($check.Path)" }
    }
}
Assert-Protected
foreach ($kind in @('core','personal','indie')) {
    $artifact = $final.artifacts.$kind
    $item = Get-Item -LiteralPath $artifact.archive
    if ($item.Length -ne $artifact.bytes) { throw "Archive size differs: $kind" }
}
$roots = @('G:\Codex\tmp\third-patch-approved-followups-20261026','G:\Codex\tmp\third-patch-followups-release-20261026','G:\Codex\tmp\third-patch-build-20261026-r1','G:\Codex\tmp\third-patch-release-20261026-r1')
$stats = [ordered]@{ filesRemoved = 0; directoriesRemoved = 0; linksUnlinked = @() }
function Remove-CheckedNode([string]$Node, [string]$Root) {
    $absolute = [IO.Path]::GetFullPath($Node)
    if ($absolute -ne $Root -and -not $absolute.StartsWith($Root + '\', [StringComparison]::OrdinalIgnoreCase)) { throw "Outside cleanup root: $absolute" }
    $item = Get-Item -LiteralPath $absolute -Force
    if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
        $stats.linksUnlinked += $absolute
        if ($item.PSIsContainer) { [IO.Directory]::Delete($absolute, $false) } else { [IO.File]::Delete($absolute) }
        return
    }
    if ($item.PSIsContainer) {
        foreach ($child in @(Get-ChildItem -LiteralPath $absolute -Force)) { Remove-CheckedNode $child.FullName $Root }
        [IO.Directory]::Delete($absolute, $false)
        $stats.directoriesRemoved++
    } else {
        [IO.File]::Delete($absolute)
        $stats.filesRemoved++
    }
}
foreach ($root in $roots) {
    if (-not (Test-Path -LiteralPath $root)) { continue }
    $resolved = (Resolve-Path -LiteralPath $root).ProviderPath.TrimEnd('\')
    if ($resolved -ne $root -or -not $resolved.StartsWith('G:\Codex\tmp\', [StringComparison]::OrdinalIgnoreCase)) { throw "Unexpected cleanup root: $resolved" }
    if (((Get-Item -LiteralPath $resolved -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Cleanup root is a link: $resolved" }
    Remove-CheckedNode $resolved $resolved
}
Assert-Protected
Copy-Item -LiteralPath $PSCommandPath -Destination (Join-Path $recordDir 'cleanup.ps1')
$result = [ordered]@{
    status = 'TEMPORARY_DIAGNOSTICS_REMOVED'
    completedAt = (Get-Date).ToString('o')
    roots = @($roots | ForEach-Object { @{ path = $_; absent = -not (Test-Path -LiteralPath $_) } })
    stats = $stats
    protectedWorkFullAndSaveHashesMatch = $true
    archivesPresent = @('core','personal','indie' | ForEach-Object { @{ kind = $_; path = $final.artifacts.$_.archive; present = Test-Path -LiteralPath $final.artifacts.$_.archive } })
}
$result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $recordDir 'cleanup.json') -Encoding utf8
$result | ConvertTo-Json -Depth 8

