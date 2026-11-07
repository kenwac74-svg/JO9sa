param(
    [Parameter(Mandatory=$true)][string]$Archive,
    [Parameter(Mandatory=$true)][string]$Scratch
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
Add-Type -AssemblyName System.IO.Compression.FileSystem
$scratchRoot = [IO.Path]::GetFullPath($Scratch)
if (Test-Path -LiteralPath $scratchRoot) { throw 'Use a new, disposable installer test directory.' }
$extracted = Join-Path $scratchRoot 'patch'
$testRoot = Join-Path $scratchRoot 'fake 2.4.1 game'
$game = Join-Path $testRoot 'game'
foreach ($dir in @($extracted, $game, (Join-Path $game 'json/slaves'), (Join-Path $game 'save'), (Join-Path $game 'modtools'))) {
    [void][IO.Directory]::CreateDirectory($dir)
}
[IO.Compression.ZipFile]::ExtractToDirectory([IO.Path]::GetFullPath($Archive), $extracted)
[IO.File]::WriteAllText((Join-Path $testRoot 'Jack-o-nine-tails.exe'), 'fake launcher to detect replacement')
[IO.File]::WriteAllText((Join-Path $testRoot 'FastQSP.ini'), 'existing player ini')
[IO.File]::WriteAllText((Join-Path $game 'jack.qsp'), 'existing game qsp')
[IO.File]::WriteAllText((Join-Path $game 'save/keep.sav'), 'existing save')
[IO.File]::WriteAllText((Join-Path $game 'json/save_config.json'), '{"test":"preserve"}')
[IO.File]::WriteAllText((Join-Path $game 'json/slaves/3008.json'), '{"test":"retired name"}')
[IO.File]::WriteAllText((Join-Path $game 'modtools/JO9_Detect.ps1'), 'old workshop file')

& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $extracted 'INSTALL_HELPER.ps1') -TargetRoot $testRoot -NonInteractive
if ($LASTEXITCODE -ne 0) { throw "Installer returned $LASTEXITCODE." }

$manifest = Get-Content -LiteralPath (Join-Path $extracted 'PATCH_MANIFEST.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$samples = @('game/jack.qsp','game/content/pic/characters/fabrika (2).png',
    'game/json/slaves/1448_Shiru.json','game/json/slaves/2577_pelageya.json',
    'game/modtools/JO9_Detect.ps1','game/modtools/runtime-bundle/node.exe')
foreach ($rel in $samples) {
    $expected = @($manifest.files | Where-Object path -ceq $rel)
    $actual = (Get-FileHash -LiteralPath (Join-Path $testRoot $rel) -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($expected.Count -ne 1 -or $actual -ne $expected[0].sha256) { throw "Installed payload mismatch: $rel" }
}
$preserved = [ordered]@{
    'Jack-o-nine-tails.exe'='fake launcher to detect replacement'
    'FastQSP.ini'='existing player ini'
    'game/save/keep.sav'='existing save'
    'game/json/save_config.json'='{"test":"preserve"}'
}
foreach ($entry in $preserved.GetEnumerator()) {
    if ([IO.File]::ReadAllText((Join-Path $testRoot $entry.Key)) -cne $entry.Value) { throw "Modified preserved file: $($entry.Key)" }
}
if (Test-Path -LiteralPath (Join-Path $game 'json/slaves/3008.json')) { throw 'Old renamed JSON was not removed.' }
if (@(Get-ChildItem -LiteralPath $game -Directory | Where-Object Name -like '*.__jo9_*').Count) { throw 'Installer staging folders remain.' }
[pscustomobject]@{status='PASS'; payloadSamples=$samples.Count; preservedFiles=$preserved.Count;
    oldRenamedJsonRemoved=$true; workshopRestored=$true; temporaryFoldersCleared=$true} | ConvertTo-Json
