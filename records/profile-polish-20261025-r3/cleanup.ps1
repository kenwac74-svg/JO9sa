$ErrorActionPreference = 'Stop'
$taskRoots = @('G:\Codex\tmp\profile-polish-20261025-r3','G:\Codex\tmp\profile-polish-release-20261025-r3')
$artifactRoot = 'C:\Users\User\.codex\.chatgpt-projects\g-p-6aad063c991081918e27b6675f290be7\artifacts\profile-polish-20261025-r3'
$recordRoot = 'G:\somi\JO9sa\records\profile-polish-20261025-r3'
$running = @(Get-CimInstance Win32_Process -Filter "Name = 'jack.exe'" | Where-Object { $_.CommandLine -and ($_.CommandLine.Replace('\','/').Contains('/profile-polish-20261025-r3/') -or $_.CommandLine.Replace('\','/').Contains('/profile-polish-release-20261025-r3/')) })
if ($running.Count) { throw 'A task-only diagnostic game is still running; no deletion performed' }
$unlinked = @()
foreach ($taskRoot in $taskRoots) {
    $rootItem = Get-Item -LiteralPath $taskRoot
    if ($rootItem.FullName -cne $taskRoot -or ($rootItem.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Unexpected temporary root' }
    $stack = [System.Collections.Generic.Stack[string]]::new()
    $stack.Push($taskRoot)
    $links = @()
    while ($stack.Count) {
        foreach ($item in Get-ChildItem -LiteralPath $stack.Pop() -Force) {
            if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { $links += $item.FullName }
            elseif ($item.PSIsContainer) { $stack.Push($item.FullName) }
        }
    }
    foreach ($link in $links) {
        if (-not $link.StartsWith($taskRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Link outside task scope' }
        [IO.Directory]::Delete($link, $false)
        $unlinked += $link
    }
    Remove-Item -LiteralPath $taskRoot -Recurse -Force
    if (Test-Path -LiteralPath $taskRoot) { throw 'Temporary directory remains' }
}
$report = @{ status = 'CLEAN'; removedTemporaryRoots = $taskRoots; resourceLinksUnlinkedWithoutTraversal = $unlinked.Count; retained = @('WORK runtime','original saves','pre-change backup','patch and reproducible checks','verification reports and metrics'); userGameProcessesStopped = $false }
$json = $report | ConvertTo-Json -Depth 4
[IO.File]::WriteAllText((Join-Path $artifactRoot 'cleanup.json'), $json, [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $recordRoot 'cleanup.json'), $json, [Text.UTF8Encoding]::new($false))
Write-Output 'Only scoped temporary diagnostics removed.'
