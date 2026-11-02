$ErrorActionPreference = 'Stop'
$cleanupStats = [ordered]@{removedFiles=0;removedBytes=0;removedQsp=0;removedJson=0;skippedLinks=@();roots=@();backupsPreserved=$true}
$cleanupReportPath = 'C:\Users\User\.codex\.chatgpt-projects\g-p-6aad063c991081918e27b6675f290be7\bug-batch-20261028\cleanup.json'
function Clear-DerivedFiles([string]$directory,[string]$allowedRoot) {
    foreach ($entry in Get-ChildItem -LiteralPath $directory -Force) {
        $entryPath = [IO.Path]::GetFullPath($entry.FullName)
        if (-not $entryPath.StartsWith($allowedRoot + '\',[StringComparison]::OrdinalIgnoreCase)) { throw "Escaped diagnostic root: $entryPath" }
        if (($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { $cleanupStats.skippedLinks += $entryPath; continue }
        if ($entry.PSIsContainer) {
            Clear-DerivedFiles $entryPath $allowedRoot
            if (@(Get-ChildItem -LiteralPath $entryPath -Force).Count -eq 0) { Remove-Item -LiteralPath $entryPath }
            continue
        }
        $relativePath = $entryPath.Substring($allowedRoot.Length+1)
        $derivedQsp = $entry.Extension -ieq '.qsp'
        $copiedJson = $relativePath -match '^[^\\]+\\client\\json\\' -and $entry.Extension -ieq '.json'
        $copiedConfig = $relativePath -match '^[^\\]+\\client\\(FastQSP\.ini|config\.xml)$'
        if ($derivedQsp -or $copiedJson -or $copiedConfig) {
            if ($entry.Name -match '\.bak_' -or $entry.Extension -ieq '.sav') { throw "Protected file selected: $entryPath" }
            $cleanupStats.removedBytes += $entry.Length
            $cleanupStats.removedFiles++
            if ($derivedQsp) { $cleanupStats.removedQsp++ }
            if ($copiedJson) { $cleanupStats.removedJson++ }
            Remove-Item -LiteralPath $entryPath
        }
    }
}
foreach ($diagnosticRoot in @('G:\Codex\tmp\jo9-approved-gate-20261028','G:\Codex\tmp\jo9-approved-gate-current-20261028')) {
    $absoluteRoot = [IO.Path]::GetFullPath($diagnosticRoot)
    if ($absoluteRoot -notmatch '^G:\\Codex\\tmp\\jo9-approved-gate(?:-current)?-20261028$') { throw "Unapproved root: $absoluteRoot" }
    $rootEntry = Get-Item -LiteralPath $absoluteRoot
    if (($rootEntry.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Linked root: $absoluteRoot" }
    $cleanupStats.roots += $absoluteRoot
    Clear-DerivedFiles $absoluteRoot $absoluteRoot
}
$candidatePath = 'G:\Codex\tmp\jo9-approved-rumor-chaotic-20261028\jack.candidate.qsp'
$candidateEntry = Get-Item -LiteralPath $candidatePath
if (($candidateEntry.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Linked candidate' }
$candidateHash = (Get-FileHash -LiteralPath $candidatePath -Algorithm SHA256).Hash
$workHash = (Get-FileHash -LiteralPath 'G:\somi\Jack O Nine Tails v2.4_work\game\jack.qsp' -Algorithm SHA256).Hash
if ($candidateHash -ne 'EFDFF96228E6CD77B59808C22B3391947E1682918480AEA55C89B0A0BB3ADEBB' -or $candidateHash -ne $workHash) { throw 'Candidate is not identical to installed tested WORK' }
$cleanupStats.removedBytes += $candidateEntry.Length
$cleanupStats.removedFiles++
$cleanupStats.removedQsp++
Remove-Item -LiteralPath $candidatePath
$cleanupStats.workHash = $workHash
$cleanupStats.status = 'PASS'
$cleanupJson = $cleanupStats | ConvertTo-Json -Depth 5
[IO.File]::WriteAllText($cleanupReportPath,$cleanupJson,[Text.UTF8Encoding]::new($false))
Copy-Item -LiteralPath $cleanupReportPath -Destination 'G:\somi\JO9sa\records\bug-batch-20261028\cleanup.json'
Write-Output ($cleanupStats | ConvertTo-Json -Compress -Depth 5)
