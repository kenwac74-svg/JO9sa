param(
    [Parameter(Mandatory=$true)][string]$Original,
    [Parameter(Mandatory=$true)][string]$Output
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
Add-Type -AssemblyName System.IO.Compression.FileSystem

$source = (Resolve-Path -LiteralPath $Original).Path
$destination = [IO.Path]::GetFullPath($Output)
$expected = '7400f619dfad22bd90e3f6363cdea26a6d699b9ee9cdbf69aa36a69dc52ddfb4'
$notes = @('RELEASE_NOTES_KO.html', 'RELEASE_NOTES_EN.html')
$media = @('release-notes-media/easy-mode-delivery.png', 'release-notes-media/shiru-secretary.png', 'release-notes-media/pelageya-secretary.png')
if ((Test-Path -LiteralPath $destination) -or $source -eq $destination) { throw 'Use a new ZIP path.' }
if ((Get-FileHash -LiteralPath $source).Hash.ToLowerInvariant() -ne $expected) { throw 'Unexpected base archive.' }

function Hash-Entry($entry) {
    $stream = $entry.Open()
    $sha = [Security.Cryptography.SHA256]::Create()
    try { return [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-', '').ToLowerInvariant() }
    finally { $stream.Dispose(); $sha.Dispose() }
}

$stage = $destination + '.' + [Guid]::NewGuid().ToString('N') + '.tmp'
try {
    [IO.File]::Copy($source, $stage)
    $zip = [IO.Compression.ZipFile]::Open($stage, [IO.Compression.ZipArchiveMode]::Update)
    try {
        foreach ($name in ($notes + $media)) {
            $old = $zip.GetEntry($name)
            if ($name -cin $notes) {
                if ($null -eq $old) { throw "Missing release note: $name" }
                $timestamp = $old.LastWriteTime
                $old.Delete()
                $level = [IO.Compression.CompressionLevel]::Optimal
            } else {
                if ($null -ne $old) { throw "Unexpected media in original ZIP: $name" }
                $timestamp = [DateTimeOffset]::new(2026, 11, 7, 0, 0, 0, [TimeSpan]::Zero)
                $level = [IO.Compression.CompressionLevel]::NoCompression
            }
            $entry = $zip.CreateEntry($name, $level)
            $entry.LastWriteTime = $timestamp
            $stream = $entry.Open()
            try {
                $bytes = [IO.File]::ReadAllBytes((Join-Path $PSScriptRoot $name))
                $stream.Write($bytes, 0, $bytes.Length)
            } finally { $stream.Dispose() }
        }
    } finally { $zip.Dispose() }

    $before = [IO.Compression.ZipFile]::OpenRead($source)
    $after = [IO.Compression.ZipFile]::OpenRead($stage)
    try {
        $left = @(($before.Entries.FullName + $media) | Sort-Object -CaseSensitive)
        $right = @($after.Entries.FullName | Sort-Object -CaseSensitive)
        if ($left.Count -ne $right.Count -or ($left -join '|') -cne ($right -join '|')) { throw 'ZIP paths changed.' }
        foreach ($entry in $before.Entries) {
            $actual = $after.GetEntry($entry.FullName)
            if ($entry.FullName -cin $notes) {
                $noteHash = (Get-FileHash -LiteralPath (Join-Path $PSScriptRoot $entry.FullName)).Hash.ToLowerInvariant()
                if ((Hash-Entry $actual) -ne $noteHash) { throw "Wrong revised note: $($entry.FullName)" }
            } elseif ($entry.Length -ne $actual.Length -or $entry.CompressedLength -ne $actual.CompressedLength -or
                      $entry.Crc32 -ne $actual.Crc32) {
                throw "Non-note entry changed: $($entry.FullName)"
            }
        }
        foreach ($critical in @('game/jack.qsp', 'PATCH_MANIFEST.json', 'INSTALL_HELPER.ps1')) {
            if ((Hash-Entry $before.GetEntry($critical)) -ne (Hash-Entry $after.GetEntry($critical))) { throw "Digest changed: $critical" }
        }
        foreach ($name in $media) {
            $fileHash = (Get-FileHash -LiteralPath (Join-Path $PSScriptRoot $name)).Hash.ToLowerInvariant()
            if ((Hash-Entry $after.GetEntry($name)) -ne $fileHash) { throw "Wrong release note media: $name" }
        }
    } finally { $before.Dispose(); $after.Dispose() }

    Move-Item -LiteralPath $stage -Destination $destination
    $hash = (Get-FileHash -LiteralPath $destination).Hash.ToLowerInvariant()
    [IO.File]::WriteAllText($destination + '.sha256.txt', $hash + '  ' + [IO.Path]::GetFileName($destination) + [Environment]::NewLine)
    [pscustomobject]@{status='PASS'; archive=$destination; bytes=(Get-Item -LiteralPath $destination).Length;
        sha256=$hash; verifiedUnchangedEntries=$left.Count - $notes.Count - $media.Count; updated=$notes; addedMedia=$media} | ConvertTo-Json
} finally {
    if (Test-Path -LiteralPath $stage -PathType Leaf) { Remove-Item -LiteralPath $stage }
}
