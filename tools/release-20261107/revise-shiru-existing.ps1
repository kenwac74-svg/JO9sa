param(
    [Parameter(Mandatory=$true)][string]$Original,
    [Parameter(Mandatory=$true)][string]$Qsp,
    [Parameter(Mandatory=$true)][string]$Patch,
    [Parameter(Mandatory=$true)][string]$Output,
    [string]$NotesDirectory
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
Add-Type -AssemblyName System.IO.Compression.FileSystem

$baseZipHash = '30801fcd8fc59ab6b511560852ddac4ed2883c273d69e01e017e16084edaa974'
$baseQspHash = '59f5d13fb6846b340db804ffb58de39f5df573c3bd936b7153247610241ff94e'
$qspPath = 'game/jack.qsp'
$manifestPath = 'PATCH_MANIFEST.json'
$installerPath = 'INSTALL_HELPER.ps1'
$notes = @()
if ($NotesDirectory) { $notes = @('RELEASE_NOTES_KO.html', 'RELEASE_NOTES_EN.html') }
$modified = @($qspPath, $manifestPath, $installerPath) + $notes
$critical = @('game/json/slaves/1448_Shiru.json', 'INSTALL.cmd', 'release-notes-media/easy-mode-delivery.png',
    'release-notes-media/shiru-secretary.png', 'release-notes-media/pelageya-secretary.png')
if (!$NotesDirectory) { $critical += @('RELEASE_NOTES_KO.html', 'RELEASE_NOTES_EN.html') }
$utf8 = [Text.UTF8Encoding]::new($false, $true)

function Read-EntryBytes($entry) {
    if ($null -eq $entry) { throw 'Missing ZIP entry.' }
    $stream = $entry.Open()
    $buffer = [IO.MemoryStream]::new()
    try { $stream.CopyTo($buffer); return ,$buffer.ToArray() }
    finally { $buffer.Dispose(); $stream.Dispose() }
}
function Hash-Bytes([byte[]]$bytes) {
    $sha = [Security.Cryptography.SHA256]::Create()
    try { return [BitConverter]::ToString($sha.ComputeHash($bytes)).Replace('-', '').ToLowerInvariant() }
    finally { $sha.Dispose() }
}
function Hash-Entry($entry) {
    if ($null -eq $entry) { throw 'Missing ZIP entry.' }
    $stream = $entry.Open()
    $sha = [Security.Cryptography.SHA256]::Create()
    try { return [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-', '').ToLowerInvariant() }
    finally { $sha.Dispose(); $stream.Dispose() }
}
function Replace-One([string]$text, [string]$old, [string]$new, [string]$label) {
    if ([regex]::Matches($text, [regex]::Escape($old)).Count -ne 1) { throw "Expected one match: $label" }
    return $text.Replace($old, $new)
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
if ((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant() -ne $baseZipHash) {
    throw 'Unexpected r1 archive hash.'
}
$candidate = [IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $Qsp).Path)
$qspHash = Hash-Bytes $candidate
$noteBytes = @{}
foreach ($name in $notes) {
    $noteBytes[$name] = [IO.File]::ReadAllBytes((Resolve-Path -LiteralPath (Join-Path $NotesDirectory $name)).Path)
}
$patchRecord = Get-Content -LiteralPath $Patch -Raw -Encoding UTF8 | ConvertFrom-Json
if ($patchRecord.before_sha256 -cne $baseQspHash -or $patchRecord.after_sha256 -cne $qspHash -or
    @($patchRecord.edits).Count -eq 0 -or
    @($patchRecord.edits | Where-Object { $_.location -cne '$ongload' -or $_.field -cne 'body' }).Count -gt 0) {
    throw 'The candidate must match the approved on-load-only migration patch.'
}
$before = [IO.Compression.ZipFile]::OpenRead($source)
$stage = $destination + '.' + [Guid]::NewGuid().ToString('N') + '.tmp'
try {
    if ((Hash-Entry ($before.GetEntry($qspPath))) -cne $baseQspHash) { throw 'The r1 QSP does not match the approved baseline.' }
    $manifestBytes = Read-EntryBytes ($before.GetEntry($manifestPath))
    $manifestHash = Hash-Bytes $manifestBytes
    $manifestText = $utf8.GetString($manifestBytes)
    $manifest = $manifestText | ConvertFrom-Json
    if ($manifest.schema -ne 1 -or $manifest.patchRevision -cne '2026-11-07-update3-r1') { throw 'Unexpected r1 manifest format.' }
    $rows = @($manifest.files | Where-Object path -ceq $qspPath)
    if ($rows.Count -ne 1 -or $rows[0].sha256 -cne $baseQspHash -or $rows[0].kind -cne 'qsp') {
        throw 'Unexpected QSP manifest row.'
    }
    $manifestText = Replace-One $manifestText $baseQspHash $qspHash 'QSP digest'
    $bytePattern = [regex]::Escape('"path": "' + $qspPath + '"') + ',\r?\n\s*"bytes": ' + $rows[0].bytes + '(?=,)'
    $byteRows = [regex]::Matches($manifestText, $bytePattern)
    if ($byteRows.Count -ne 1) { throw 'Expected one QSP byte-count row.' }
    $oldByteRow = $byteRows[0].Value
    $newByteRow = $oldByteRow.Substring(0, $oldByteRow.Length - $rows[0].bytes.ToString().Length) + $candidate.Length
    $manifestText = Replace-One $manifestText $oldByteRow $newByteRow 'QSP bytes'
    $manifestText = Replace-One $manifestText '"patchRevision": "2026-11-07-update3-r1"' '"patchRevision": "2026-11-07-update3-r2"' 'revision'
    $newManifest = $utf8.GetBytes($manifestText)
    $newManifestHash = Hash-Bytes $newManifest
    $newRow = @(($manifestText | ConvertFrom-Json).files | Where-Object path -ceq $qspPath)
    if ($newRow[0].bytes -ne $candidate.Length -or $newRow[0].sha256 -cne $qspHash) { throw 'Revised manifest QSP row mismatch.' }
    $helperText = $utf8.GetString((Read-EntryBytes ($before.GetEntry($installerPath))))
    $pinPattern = '$ExpectedManifestSha256 = ''{0}'''
    $helperText = Replace-One $helperText ($pinPattern -f $manifestHash) ($pinPattern -f $newManifestHash) 'installer manifest pin'
    $newHelper = $utf8.GetBytes($helperText)

    [IO.File]::Copy($source, $stage)
    $update = [IO.Compression.ZipFile]::Open($stage, [IO.Compression.ZipArchiveMode]::Update)
    try {
        Write-EntryBytes $update $qspPath $candidate
        Write-EntryBytes $update $manifestPath $newManifest
        Write-EntryBytes $update $installerPath $newHelper
        foreach ($name in $notes) { Write-EntryBytes $update $name $noteBytes[$name] }
    } finally { $update.Dispose() }

    $after = [IO.Compression.ZipFile]::OpenRead($stage)
    try {
        $seen = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
        foreach ($entry in $after.Entries) { if (!$seen.Add($entry.FullName)) { throw "Duplicate ZIP entry: $($entry.FullName)" } }
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
            if ((Hash-Entry ($before.GetEntry($name))) -cne (Hash-Entry ($after.GetEntry($name)))) { throw "Critical digest changed: $name" }
        }
        foreach ($name in $notes) {
            if ((Hash-Entry ($after.GetEntry($name))) -cne (Hash-Bytes $noteBytes[$name])) { throw "Revised note digest mismatch: $name" }
        }
        if ((Hash-Entry ($after.GetEntry($qspPath))) -cne $qspHash -or
            (Hash-Entry ($after.GetEntry($manifestPath))) -cne $newManifestHash -or
            (Hash-Entry ($after.GetEntry($installerPath))) -cne (Hash-Bytes $newHelper)) { throw 'Updated entry digest mismatch.' }
        $entryCount = $after.Entries.Count
    } finally { $after.Dispose() }
    $archiveHash = (Get-FileHash -LiteralPath $stage -Algorithm SHA256).Hash.ToLowerInvariant()
    [IO.File]::Move($stage, $destination)
    [IO.File]::WriteAllText($sidecar, $archiveHash + '  ' + [IO.Path]::GetFileName($destination) + [Environment]::NewLine)
    [pscustomobject]@{status='PASS'; archive=$destination; bytes=(Get-Item -LiteralPath $destination).Length;
        sha256=$archiveHash; qspSha256=$qspHash; manifestSha256=$newManifestHash;
        verifiedUnchangedEntries=$entryCount - $modified.Count; updated=$modified} | ConvertTo-Json
} finally {
    $before.Dispose()
    if (Test-Path -LiteralPath $stage -PathType Leaf) { Remove-Item -LiteralPath $stage }
}
