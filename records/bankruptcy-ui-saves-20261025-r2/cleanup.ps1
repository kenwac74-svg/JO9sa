$ErrorActionPreference = 'Stop'
$taskRoot = 'G:\Codex\tmp\bankruptcy-ui-saves-20261025-r2'
$artifactRoot = 'C:\Users\User\.codex\.chatgpt-projects\g-p-6aad063c991081918e27b6675f290be7\artifacts\bankruptcy-ui-saves-20261025-r2'
$recordRoot = 'G:\somi\JO9sa\records\bankruptcy-ui-saves-20261025-r2'
$taskItem = Get-Item -LiteralPath $taskRoot
if ($taskItem.FullName -cne $taskRoot -or ($taskItem.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Unexpected temporary root' }
$running = @(Get-CimInstance Win32_Process -Filter "Name = 'jack.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine.Replace('\','/').Contains('/bankruptcy-ui-saves-20261025-r2/') })
if ($running.Count) { throw 'Task game processes must be closed through their own windows first' }
$stack = [System.Collections.Generic.Stack[string]]::new()
$stack.Push($taskRoot)
$links = @()
while ($stack.Count) {
    $dir = $stack.Pop()
    foreach ($item in Get-ChildItem -LiteralPath $dir -Force) {
        if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
            $parentName = Split-Path -Leaf (Split-Path -Parent $item.FullName)
            if ($parentName -notin @('factory','verify') -or $item.Name -notin @('content','css','fonts')) { throw "Unexpected link: $($item.FullName)" }
            $links += $item.FullName
        } elseif ($item.PSIsContainer) { $stack.Push($item.FullName) }
    }
}
if ($links.Count -ne 6) { throw 'Expected six temporary resource junctions' }
foreach ($link in $links) {
    if (-not $link.StartsWith($taskRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Link outside task scope' }
    [IO.Directory]::Delete($link, $false)
}
if (-not (Test-Path -LiteralPath 'G:\somi\Jack O Nine Tails v2.4_work\game\content')) { throw 'Original content must remain' }
Remove-Item -LiteralPath $taskRoot -Recurse -Force
if (Test-Path -LiteralPath $taskRoot) { throw 'Temporary folder remains' }
$report = @{ status = 'CLEAN'; removedTemporaryRoot = $taskRoot; junctionsUnlinkedWithoutTraversal = $links; nativeEvidence = 'Three exact verified compressed deltas retained'; productionCodeRemoved = $false; originalSavesRemoved = $false }
$json = $report | ConvertTo-Json -Depth 4
[IO.File]::WriteAllText((Join-Path $artifactRoot 'cleanup.json'), $json, [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $recordRoot 'cleanup.json'), $json, [Text.UTF8Encoding]::new($false))
Write-Output 'Temporary copies removed; final saves, ZIP, records and original files retained.'
