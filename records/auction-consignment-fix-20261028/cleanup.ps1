$ErrorActionPreference = 'Stop'
$stageRoot = [IO.Path]::GetFullPath('G:\Codex\tmp\jo9-farid-storage-20261028')
$gateRoot = [IO.Path]::GetFullPath('G:\Codex\tmp\jo9-farid-gate-20261028\run-mIQr4n')
$recordRoot = 'G:\somi\JO9sa\records\auction-consignment-fix-20261028'
$expected = '972d1b7a8719c9b44e6aca4bfaf5a6f73908240762ce65061a7d298d0aa82679'
$gameQsp = 'G:\somi\Jack O Nine Tails v2.4_work\game\jack.qsp'
if ((Get-FileHash -LiteralPath $gameQsp -Algorithm SHA256).Hash.ToLower() -ne $expected) { throw 'Installed WORK hash changed.' }
$gate = Get-Content -LiteralPath ($gateRoot + '\report.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if ($gate.verdict -ne 'PASS') { throw 'Gate not PASS.' }
function Get-BoundedFiles([string]$root) {
    $item = Get-Item -LiteralPath $root -Force
    if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Reparse root: $root" }
    if ($item.FullName -ine $root) { throw "Resolved root mismatch: $root" }
    $pending = New-Object 'System.Collections.Generic.Stack[string]'
    $pending.Push($root)
    while ($pending.Count -gt 0) {
        foreach ($child in Get-ChildItem -LiteralPath $pending.Pop() -Force) {
            if (($child.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { continue }
            if (-not $child.FullName.StartsWith($root + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Out of boundary.' }
            if ($child.PSIsContainer) { $pending.Push($child.FullName) } else { $child }
        }
    }
}
$gateFiles = @(Get-BoundedFiles $gateRoot)
$stageFiles = @(Get-BoundedFiles $stageRoot)
$deletions = New-Object 'System.Collections.Generic.List[object]'
$jsonRoot = $gateRoot + '\client\json'
foreach ($file in $gateFiles) {
    $remove = $false
    if ($file.Extension -ieq '.qsp') { $remove = $true }
    if ($file.Extension -ieq '.json' -and $file.FullName.StartsWith($jsonRoot + '\', [StringComparison]::OrdinalIgnoreCase)) {
        $relative = $file.FullName.Substring($jsonRoot.Length + 1)
        $source = Join-Path 'G:\somi\Jack O Nine Tails v2.4_work\game\json' $relative
        if ((Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash) { throw "Clone differs: $relative" }
        $remove = $true
    }
    if ($file.FullName -ieq ($gateRoot + '\client\config.xml') -or $file.FullName -ieq ($gateRoot + '\client\FastQSP.ini')) { $remove = $true }
    if ($remove) { $deletions.Add([PSCustomObject]@{ path=$file.FullName; bytes=$file.Length; sha256=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLower() }) }
}
foreach ($file in $stageFiles) {
    if ($file.FullName -ieq ($stageRoot + '\candidate.qsp')) {
        if ((Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLower() -ne $expected) { throw 'Candidate changed.' }
        $deletions.Add([PSCustomObject]@{ path=$file.FullName; bytes=$file.Length; sha256=$expected })
    }
}
# Preserve all backups, baseline, reports, logs, plans and any save files.
$keep = @($gateFiles + $stageFiles | Where-Object { $_.Extension -ieq '.sav' -or $_.Name -like '*.bak_*' -or $_.Name -eq 'baseline.qsp' } | ForEach-Object { [PSCustomObject]@{path=$_.FullName; sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLower()} })
@($deletions.ToArray()) | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath ($recordRoot + '\cleanup-plan.json') -Encoding UTF8
foreach ($file in $deletions) {
    $absolute = [IO.Path]::GetFullPath($file.path)
    if (-not $absolute.StartsWith($stageRoot + '\', [StringComparison]::OrdinalIgnoreCase) -and -not $absolute.StartsWith($gateRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Deletion outside task roots.' }
    if ($absolute.EndsWith('.sav', [StringComparison]::OrdinalIgnoreCase) -or $absolute.Contains('.bak_') -or $absolute -ieq ($stageRoot + '\baseline.qsp')) { throw 'Protected deletion.' }
    Remove-Item -LiteralPath $absolute -Force
}
$keepAfter = @($keep | ForEach-Object { [PSCustomObject]@{path=$_.path; sha256=$_.sha256; unchanged=((Get-FileHash -LiteralPath $_.path -Algorithm SHA256).Hash.ToLower() -eq $_.sha256)} })
if (@($keepAfter | Where-Object { -not $_.unchanged }).Count -gt 0) { throw 'Protected temporary artifact changed.' }
$report = [ordered]@{status='PASS'; roots=@($stageRoot,$gateRoot); prior_attempt='Deletion and protected-file checks completed, then generic List report serialization failed. Final audit rerun after ToArray correction; original deletion count and exact bytes were not persisted and are not claimed.'; deleted_in_final_audit=$deletions.Count; bytes_freed_in_final_audit=($deletions.ToArray() | Measure-Object bytes -Sum).Sum; deleted_in_final_audit_list=@($deletions.ToArray()); preserved=$keepAfter; skipped_reparse=$true; remaining_files=@((Get-BoundedFiles $stageRoot) + (Get-BoundedFiles $gateRoot) | Select-Object -ExpandProperty FullName)}
$report | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath ($recordRoot + '\cleanup.json') -Encoding UTF8
Write-Output ('CLEANUP PASS files=' + $deletions.Count + ' bytes=' + $report.bytes_freed)
