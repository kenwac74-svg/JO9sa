$ErrorActionPreference = 'Stop'
$recordRoot = 'G:\somi\JO9sa\records\home-handoff-applied-20261027'
$tempRoot = 'G:\Codex\tmp\home-handoff-apply-20261027'
$result = Get-Content -LiteralPath (Join-Path $recordRoot 'FINAL_RESULT.json') -Raw | ConvertFrom-Json
$review = Get-Content -LiteralPath (Join-Path $recordRoot 'independent-review.json') -Raw | ConvertFrom-Json
if ($result.status -ne 'WORK_APPLIED_AND_VERIFIED' -or $review.status -ne 'PASS') { throw 'Application/review is incomplete' }
foreach ($name in @('apply-and-verify.py','protected-before.json','targets-before.json','MANUAL_KO.md','verifier-tests.log','folder-review-tests.log')) {
 if (-not (Test-Path -LiteralPath (Join-Path $recordRoot $name) -PathType Leaf)) { throw "Missing retained evidence: $name" }
}
if (-not (Test-Path -LiteralPath (Join-Path $result.backup 'BACKUP_INDEX.json'))) { throw 'External original backup is missing' }
$resolved = (Resolve-Path -LiteralPath $tempRoot).ProviderPath.TrimEnd('\')
if ($resolved -ne $tempRoot -or -not $resolved.StartsWith('G:\Codex\tmp\', [StringComparison]::OrdinalIgnoreCase)) { throw "Unexpected cleanup root: $resolved" }
if (((Get-Item -LiteralPath $resolved -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Temporary root is a link' }
$stats = @{ files = 0; bytes = [long]0; links = 0; directories = 0 }
function Remove-TaskNode([string]$Node) {
 $absolute = [IO.Path]::GetFullPath($Node)
 if ($absolute -ne $tempRoot -and -not $absolute.StartsWith($tempRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw "Outside task: $absolute" }
 $entry = Get-Item -LiteralPath $absolute -Force
 if (($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
  if ($entry.PSIsContainer) { [IO.Directory]::Delete($absolute, $false) } else { [IO.File]::Delete($absolute) }
  $stats.links++; return
 }
 if ($entry.PSIsContainer) {
  foreach ($child in @(Get-ChildItem -LiteralPath $absolute -Force)) { Remove-TaskNode $child.FullName }
  [IO.Directory]::Delete($absolute, $false); $stats.directories++
 } else { $stats.bytes += $entry.Length; [IO.File]::Delete($absolute); $stats.files++ }
}
Remove-TaskNode $resolved
Copy-Item -LiteralPath $PSCommandPath -Destination (Join-Path $recordRoot 'cleanup.ps1')
$hash = (Get-FileHash -LiteralPath 'G:\somi\Jack O Nine Tails v2.4_work\game\jack.qsp' -Algorithm SHA256).Hash.ToLowerInvariant()
if ($hash -ne $result.qspSha256) { throw 'WORK QSP changed during cleanup' }
@{ status='TEMPORARY_FIXTURES_REMOVED'; tempRoot=$tempRoot; absent=(-not (Test-Path -LiteralPath $tempRoot)); stats=$stats; externalOriginalsPreserved=$result.backup; qspUnchanged=$true } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $recordRoot 'cleanup.json') -Encoding utf8
Get-Content -LiteralPath (Join-Path $recordRoot 'cleanup.json') -Raw
