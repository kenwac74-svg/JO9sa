$ErrorActionPreference = 'Stop'
$stage = [IO.Path]::GetFullPath('G:\Codex\tmp\jo9-revelio-traits-stage-20261028')
$gate = [IO.Path]::GetFullPath('G:\Codex\tmp\jo9-revelio-traits-gate-20261028\run-x7T7eo')
$record = 'G:\somi\JO9sa\records\revelio-new-traits-20261028'
$expected = '3fbdb2cca0e3eb2d4a70c2f9b442f2fb39bb756f1aefe6217cf8c10668f1106c'
if ((Get-FileHash -LiteralPath 'G:\somi\Jack O Nine Tails v2.4_work\game\jack.qsp' -Algorithm SHA256).Hash.ToLower() -ne $expected) { throw 'WORK differs.' }
if ((Get-Content -LiteralPath ($gate + '\report.json') -Raw -Encoding UTF8 | ConvertFrom-Json).verdict -ne 'PASS') { throw 'Gate is not PASS.' }
function Get-BoundedFiles([string]$root) {
    $item = Get-Item -LiteralPath $root -Force
    if ($item.FullName -ine $root -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Invalid task root.' }
    $stack = New-Object 'System.Collections.Generic.Stack[string]'
    $stack.Push($root)
    while ($stack.Count -gt 0) {
        foreach ($child in Get-ChildItem -LiteralPath $stack.Pop() -Force) {
            if (($child.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { continue }
            if (-not $child.FullName.StartsWith($root + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Outside task root.' }
            if ($child.PSIsContainer) { $stack.Push($child.FullName) } else { $child }
        }
    }
}
$gateFiles = @(Get-BoundedFiles $gate)
$stageFiles = @(Get-BoundedFiles $stage)
$delete = @()
$cloneRoot = $gate + '\client\json'
foreach ($file in $gateFiles) {
    $remove = $file.Extension -ieq '.qsp'
    if ($file.Extension -ieq '.json' -and $file.FullName.StartsWith($cloneRoot + '\', [StringComparison]::OrdinalIgnoreCase)) {
        $source = Join-Path 'G:\somi\Jack O Nine Tails v2.4_work\game\json' $file.FullName.Substring($cloneRoot.Length + 1)
        if ((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash) { throw 'JSON clone differs.' }
        $remove = $true
    }
    if ($file.FullName -ieq ($gate + '\client\config.xml') -or $file.FullName -ieq ($gate + '\client\FastQSP.ini')) { $remove = $true }
    if ($remove) { $delete += [PSCustomObject]@{path=$file.FullName; bytes=$file.Length; sha256=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLower()} }
}
foreach ($file in $stageFiles) {
    if ($file.FullName -ieq ($stage + '\candidate.qsp')) {
        if ((Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLower() -ne $expected) { throw 'Candidate differs.' }
        $delete += [PSCustomObject]@{path=$file.FullName; bytes=$file.Length; sha256=$expected}
    }
}
$keep = @($gateFiles + $stageFiles | Where-Object { $_.Extension -ieq '.sav' -or $_.Name -like '*.bak_*' -or $_.Name -eq 'baseline.qsp' } | ForEach-Object { [PSCustomObject]@{path=$_.FullName; sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLower()} })
# Persist the exact plan before any deletion. Preserve all saves and backups.
$delete | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath ($record + '\cleanup-plan.json') -Encoding UTF8
foreach ($file in $delete) {
    $absolute = [IO.Path]::GetFullPath($file.path)
    if (-not $absolute.StartsWith($stage + '\', [StringComparison]::OrdinalIgnoreCase) -and -not $absolute.StartsWith($gate + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Outside deletion scope.' }
    if ($absolute.Contains('.bak_') -or $absolute.EndsWith('.sav', [StringComparison]::OrdinalIgnoreCase) -or $absolute -ieq ($stage + '\baseline.qsp')) { throw 'Protected deletion.' }
    Remove-Item -LiteralPath $absolute -Force
}
$preserved = @($keep | ForEach-Object { [PSCustomObject]@{path=$_.path; sha256=$_.sha256; unchanged=((Get-FileHash -LiteralPath $_.path -Algorithm SHA256).Hash.ToLower() -eq $_.sha256)} })
if (@($preserved | Where-Object { -not $_.unchanged }).Count -gt 0) { throw 'Protected artifact changed.' }
$remaining = @((Get-BoundedFiles $stage) + (Get-BoundedFiles $gate) | Select-Object -ExpandProperty FullName)
$result = [ordered]@{status='PASS'; roots=@($stage,$gate); deleted_files=$delete.Count; bytes_freed=($delete | Measure-Object bytes -Sum).Sum; deleted=$delete; preserved=$preserved; skipped_reparse=$true; remaining_files=$remaining}
$result | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath ($record + '\cleanup.json') -Encoding UTF8
Write-Output ('CLEANUP PASS files=' + $delete.Count + ' bytes=' + $result.bytes_freed)
