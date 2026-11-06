$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipPath = 'G:/somi/JO9_2.4.1_Patch_20261105_r2/JO9_2.4.1_Patch_20261105_r2.zip'
$expectedZip = 'ff2f3f05097e70e289535d9715cf5b10e812b14f5d16e70dd48f0312db6485db'
$expectedQsp = 'f9abbda0c5881886424709f68986398ff9527328213dfea4fc770eb4a02f2536'
$taskTemp = [System.IO.Path]::GetFullPath('G:/Codex/tmp/jo9-independent-qa-r2-20261105/qsp')
if (-not $taskTemp.StartsWith('G:\Codex\tmp\jo9-independent-qa-r2-20261105\', [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Unexpected task root' }
if ((Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expectedZip) { throw 'ZIP hash differs' }
New-Item -ItemType Directory -Path $taskTemp -Force | Out-Null
$target = Join-Path $taskTemp 'jack.qsp'
if (Test-Path -LiteralPath $target) { throw 'Existing QSP preserved; choose a fresh folder or verify it separately' }
$archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
try {
    $entry = @($archive.Entries | Where-Object { $_.FullName -eq 'game/jack.qsp' })
    if ($entry.Count -ne 1) { throw 'Expected exactly one game/jack.qsp' }
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry[0], $target, $false)
} finally { $archive.Dispose() }
if ((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expectedQsp) { throw 'QSP hash differs' }
Write-Output $target
