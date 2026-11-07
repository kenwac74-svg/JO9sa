param(
    [Parameter(Mandatory=$true)][string]$Original,
    [Parameter(Mandatory=$true)][string]$Seed,
    [Parameter(Mandatory=$true)][string]$Output
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
Add-Type -AssemblyName System.IO.Compression.FileSystem

$baseHash = 'db7fe3d2037b072d98644875dc24926baa1364b06d4e129c532527ef111606ac'
$qspHash = '59f5d13fb6846b340db804ffb58de39f5df573c3bd936b7153247610241ff94e'
$seedPath = 'game/json/slaves/1448_Shiru.json'
$manifestPath = 'PATCH_MANIFEST.json'
$installerPath = 'INSTALL_HELPER.ps1'
$modified = @($seedPath, $manifestPath, $installerPath)
$critical = @('game/jack.qsp', 'INSTALL.cmd', 'RELEASE_NOTES_KO.html', 'RELEASE_NOTES_EN.html',
    'release-notes-media/easy-mode-delivery.png', 'release-notes-media/shiru-secretary.png',
    'release-notes-media/pelageya-secretary.png')
$utf8 = [Text.UTF8Encoding]::new($false, $true)

function Read-EntryBytes($entry) {
    if ($null -eq $entry) { throw 'ZIP entry is missing.' }
    $stream = $entry.Open()
    $buffer = [IO.MemoryStream]::new()
    try {
        $stream.CopyTo($buffer)
        return ,$buffer.ToArray()
    } finally { $buffer.Dispose(); $stream.Dispose() }
}

function Hash-Bytes([byte[]]$bytes) {
    return [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes)).ToLowerInvariant()
}

function Hash-Entry($entry) {
    if ($null -eq $entry) { throw 'ZIP entry is missing.' }
    $stream = $entry.Open()
    try { return [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($stream)).ToLowerInvariant() }
    finally { $stream.Dispose() }
}

function Replace-One([string]$inputText, [string]$old, [string]$new, [string]$label) {
    if ([regex]::Matches($inputText, [regex]::Escape($old)).Count -ne 1) { throw "Expected one match: $label" }
    return $inputText.Replace($old, $new)
}

function Write-EntryBytes($archive, [string]$name, [byte[]]$bytes) {
    $old = $archive.GetEntry($name)
    if ($null -eq $old) { throw "Missing entry: $name" }
    $timestamp = $old.LastWriteTime
    $attributes = $old.ExternalAttributes
    $old.Delete()
    $entry = $archive.CreateEntry($name, [IO.Compression.CompressionLevel]::Optimal)
    $entry.LastWriteTime = $timestamp
    $entry.ExternalAttributes = $attributes
    $stream = $entry.Open()
    try { $stream.Write($bytes, 0, $bytes.Length) } finally { $stream.Dispose() }
}

$source = (Resolve-Path -LiteralPath $Original).Path
$destination = [IO.Path]::GetFullPath($Output)
$sidecar = $destination + '.sha256.txt'
if ((Test-Path -LiteralPath $destination) -or (Test-Path -LiteralPath $sidecar) -or $source -eq $destination) {
    throw 'Use a new ZIP path.'
}
if ((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant() -ne $baseHash) {
    throw 'Unexpected release notes r3 archive hash.'
}

$candidate = [IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $Seed).Path)
$seedHash = Hash-Bytes $candidate
$before = [IO.Compression.ZipFile]::OpenRead($source)
$stage = $destination + '.' + [Guid]::NewGuid().ToString('N') + '.tmp'
try {
    $oldSeed = Read-EntryBytes ($before.GetEntry($seedPath))
    $seedText = $utf8.GetString($oldSeed)
    $expectedSeed = Replace-One $seedText '"seed_nymphomania": 1' '"seed_nymphomania": 2' 'Shiru trait'
    $expectedSeed = Replace-One $expectedSeed '"seed_nymphomania_revealed": 0' '"seed_nymphomania_revealed": 2' 'Shiru reveal'
    if ($utf8.GetString($candidate) -cne $expectedSeed) { throw 'Candidate JSON changes more than the two approved Shiru values.' }
    $seedObject = $expectedSeed | ConvertFrom-Json
    if ($seedObject.seed_nymphomania -ne 2 -or $seedObject.seed_nymphomania_revealed -ne 2) {
        throw 'Shiru candidate trait and reveal must both be level 2.'
    }

    $oldManifest = Read-EntryBytes ($before.GetEntry($manifestPath))
    $oldManifestHash = Hash-Bytes $oldManifest
    $manifestText = $utf8.GetString($oldManifest)
    $manifest = $manifestText | ConvertFrom-Json
    if ($manifest.schema -ne 1 -or $manifest.patchRevision -cne '2026-11-07-update3' -or
        $manifest.jsonMode -cne 'replace-complete') { throw 'Unexpected base manifest format.' }
    $rows = @($manifest.files | Where-Object path -ceq $seedPath)
    if ($rows.Count -ne 1 -or $rows[0].kind -cne 'json' -or $rows[0].bytes -ne $oldSeed.Length -or
        $rows[0].sha256 -cne (Hash-Bytes $oldSeed)) { throw 'Original Shiru manifest row does not match.' }
    if ($candidate.Length -ne $oldSeed.Length) { throw 'The two numeric changes must preserve the Shiru file size.' }
    $manifestText = Replace-One $manifestText $rows[0].sha256 $seedHash 'Shiru digest'
    $manifestText = Replace-One $manifestText '"patchRevision": "2026-11-07-update3"' '"patchRevision": "2026-11-07-update3-r1"' 'revision'
    $newManifest = $utf8.GetBytes($manifestText)
    $newManifestHash = Hash-Bytes $newManifest
    $revisedManifest = $manifestText | ConvertFrom-Json
    $revisedRow = @($revisedManifest.files | Where-Object path -ceq $seedPath)
    if ($revisedRow.Count -ne 1 -or $revisedRow[0].bytes -ne $candidate.Length -or
        $revisedRow[0].sha256 -cne $seedHash) { throw 'Updated manifest does not match the candidate JSON.' }

    $helperText = $utf8.GetString((Read-EntryBytes ($before.GetEntry($installerPath))))
    $pinPattern = '$ExpectedManifestSha256 = ''{0}'''
    $helperText = Replace-One $helperText ($pinPattern -f $oldManifestHash) ($pinPattern -f $newManifestHash) 'installer manifest pin'
    $newHelper = $utf8.GetBytes($helperText)

    [IO.File]::Copy($source, $stage)
    $update = [IO.Compression.ZipFile]::Open($stage, [IO.Compression.ZipArchiveMode]::Update)
    try {
        Write-EntryBytes $update $seedPath $candidate
        Write-EntryBytes $update $manifestPath $newManifest
        Write-EntryBytes $update $installerPath $newHelper
    } finally { $update.Dispose() }

    $after = [IO.Compression.ZipFile]::OpenRead($stage)
    try {
        $seen = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
        foreach ($entry in $after.Entries) {
            if (!$seen.Add($entry.FullName)) { throw "Duplicate ZIP entry: $($entry.FullName)" }
        }
        if ($after.Entries.Count -ne $before.Entries.Count) { throw 'ZIP file count changed.' }
        foreach ($entry in $before.Entries) {
            $actual = $after.GetEntry($entry.FullName)
            if ($null -eq $actual) { throw "Missing inherited entry: $($entry.FullName)" }
            if ($entry.FullName -cnotin $modified -and
                ($entry.Length -ne $actual.Length -or $entry.CompressedLength -ne $actual.CompressedLength -or
                    $entry.Crc32 -ne $actual.Crc32 -or $entry.LastWriteTime -ne $actual.LastWriteTime)) {
                throw "Inherited ZIP entry changed: $($entry.FullName)"
            }
        }
        foreach ($name in $critical) {
            if ((Hash-Entry ($before.GetEntry($name))) -cne (Hash-Entry ($after.GetEntry($name)))) {
                throw "Critical file digest changed: $name"
            }
        }
        if ((Hash-Entry ($after.GetEntry('game/jack.qsp'))) -cne $qspHash -or
            (Hash-Entry ($after.GetEntry($seedPath))) -cne $seedHash -or
            (Hash-Entry ($after.GetEntry($manifestPath))) -cne $newManifestHash -or
            (Hash-Entry ($after.GetEntry($installerPath))) -cne (Hash-Bytes $newHelper)) {
            throw 'Changed entry or QSP digest mismatch.'
        }
        $entryCount = $after.Entries.Count
    } finally { $after.Dispose() }

    $archiveHash = (Get-FileHash -LiteralPath $stage -Algorithm SHA256).Hash.ToLowerInvariant()
    [IO.File]::Move($stage, $destination)
    [IO.File]::WriteAllText($sidecar, $archiveHash + '  ' + [IO.Path]::GetFileName($destination) + [Environment]::NewLine)
    [pscustomobject]@{status='PASS'; archive=$destination; bytes=(Get-Item -LiteralPath $destination).Length;
        sha256=$archiveHash; seedSha256=$seedHash; qspSha256=$qspHash; manifestSha256=$newManifestHash;
        verifiedUnchangedEntries=$entryCount - $modified.Count; updated=$modified} | ConvertTo-Json
} finally {
    $before.Dispose()
    if (Test-Path -LiteralPath $stage -PathType Leaf) { Remove-Item -LiteralPath $stage }
}
