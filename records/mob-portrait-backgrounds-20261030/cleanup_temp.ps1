$ErrorActionPreference = 'Stop'
$taskRoot = 'G:\Codex\tmp\mob-portrait-backgrounds-20261030'
$recordRoot = 'G:\somi\JO9sa\records\mob-portrait-backgrounds-20261030'
$receipt = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'installation.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if ($receipt.status -ne 'VERIFIED') { throw 'Installation is not verified' }
if ([IO.Path]::GetFullPath($taskRoot) -ne 'G:\Codex\tmp\mob-portrait-backgrounds-20261030') { throw 'Unexpected target' }
foreach ($ancestor in @('G:\Codex','G:\Codex\tmp')) {
    if ((Get-Item -LiteralPath $ancestor -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Reparse ancestor' }
}
function Assert-PlainTree([string]$directory) {
    $item = Get-Item -LiteralPath $directory -Force
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Refusing reparse target' }
    foreach ($entry in Get-ChildItem -LiteralPath $directory -Force) {
        if ($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Refusing diagnostic reparse entry' }
        if ($entry.PSIsContainer) { Assert-PlainTree $entry.FullName }
    }
}
foreach ($file in $receipt.files) {
    if ((Get-FileHash -LiteralPath $file.beforePath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $file.before) { throw 'Recovery original mismatch' }
    $work = Join-Path 'G:\somi\Jack O Nine Tails v2.4_work\game' $file.path
    if ((Get-FileHash -LiteralPath $work -Algorithm SHA256).Hash.ToLowerInvariant() -ne $file.after) { throw 'WORK mismatch' }
    if ($file.mask) {
        $keptMask = Join-Path (Join-Path $recordRoot 'masks') ([IO.Path]::GetFileName($file.mask))
        if (-not (Test-Path -LiteralPath $keptMask)) { throw 'Permanent mask missing' }
    }
}
$removedBytes = 0
$removedFiles = 0
if (Test-Path -LiteralPath $taskRoot) {
    Assert-PlainTree $taskRoot
    $all = @(Get-ChildItem -LiteralPath $taskRoot -Recurse -File -Force)
    $removedFiles = $all.Count
    $removedBytes = ($all | Measure-Object -Property Length -Sum).Sum
    Remove-Item -LiteralPath $taskRoot -Recurse -Force
}
if (Test-Path -LiteralPath $taskRoot) { throw 'Temporary target remains' }
$result = @{pass=$true;root=$taskRoot;removedFiles=$removedFiles;removedBytes=$removedBytes;originalsPreserved=$true;workPreserved=$true;permanentMasks=29}
$result | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'cleanup.json') -Encoding UTF8
$result | ConvertTo-Json -Compress
