param(
    [Parameter(Mandatory=$true)][string]$Overlay,
    [Parameter(Mandatory=$true)][string]$Output,
    [Parameter(Mandatory=$true)][string]$Mirror,
    [string]$BaseZip = 'C:/MOVE/JO9_2.4.1_Patch_20261105_2차.zip',
    [string]$WorkshopZip = 'build/JO9_2.4.1_WORKSHOP_Fix_20261104.zip',
    [string]$Work = 'C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full'
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
Add-Type -AssemblyName System.IO.Compression.FileSystem
$baseQspHash = '6ebda9981bf6bc56de46929474de64157969fd324bba8e8be181e002dad1cc7e'
$baseManifestHash = '2de2b2094d0c118166255ea8b12061a7ddd7dc2ab0ed6b77be1905ecda0b1dc3'
$workshopZipHash = 'cbd3ab17b8dec300db17a0794926fed81c90d98341607d22d5dd930885e82db6'
$workQspHash = '46e972bf98bc74cd79176312683e398bf7ae639bc7edeecadfcb6efd9a8f54b9'
$releaseDocuments = @('INSTALL_KO.txt','INSTALL_EN.txt','RELEASE_NOTES_KO.html','RELEASE_NOTES_EN.html',
    'release-notes-media/easy-mode-delivery.png','release-notes-media/shiru-secretary.png','release-notes-media/pelageya-secretary.png')
$utf8 = [Text.UTF8Encoding]::new($false)
$outputPath = [IO.Path]::GetFullPath($Output)
$mirrorRoot = [IO.Path]::GetFullPath($Mirror)
$workRoot = [IO.Path]::GetFullPath($Work).TrimEnd('\')
if (Test-Path -LiteralPath $outputPath) { throw "Output already exists: $outputPath" }
if ($outputPath.StartsWith($workRoot + '\', [StringComparison]::OrdinalIgnoreCase) -or
    $mirrorRoot.StartsWith($workRoot + '\', [StringComparison]::OrdinalIgnoreCase) -or
    $mirrorRoot -eq $workRoot) { throw 'Build outside the live game.' }
if (Test-Path -LiteralPath (Join-Path $mirrorRoot 'game')) { throw 'Use an empty extraction mirror.' }
[void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($outputPath))

function Hash-Stream([IO.Stream]$stream) {
    $sha = [Security.Cryptography.SHA256]::Create()
    try { return [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-', '').ToLowerInvariant() }
    finally { $sha.Dispose() }
}
function Read-Entry([IO.Compression.ZipArchive]$archive, [string]$name) {
    $entry = $archive.GetEntry($name)
    if ($null -eq $entry) { throw "Archive entry missing: $name" }
    $stream = $entry.Open()
    $reader = [IO.StreamReader]::new($stream, $utf8, $true)
    try { return $reader.ReadToEnd() } finally { $reader.Dispose() }
}
function Hash-Entry([IO.Compression.ZipArchiveEntry]$entry) {
    $stream = $entry.Open()
    try { return Hash-Stream $stream } finally { $stream.Dispose() }
}
function Copy-Entry([IO.Stream]$source, [IO.Compression.ZipArchive]$archive, [string]$name, [IO.Compression.CompressionLevel]$level) {
    $entry = $archive.CreateEntry($name, $level)
    $entry.LastWriteTime = [DateTimeOffset]::new(2026, 11, 7, 0, 0, 0, [TimeSpan]::Zero)
    $target = $entry.Open()
    try { $source.CopyTo($target) } finally { $target.Dispose() }
}
function Add-Bytes([byte[]]$bytes, [IO.Compression.ZipArchive]$archive, [string]$name) {
    $memory = [IO.MemoryStream]::new($bytes, $false)
    try { Copy-Entry $memory $archive $name Optimal } finally { $memory.Dispose() }
}
function Confirm-Row($row) {
    $rel = [string]$row.path
    if ($rel -match '\\|:|(^|/)\.\.?(?:/|$)|//' -or
        $row.sha256 -notmatch '^[0-9a-fA-F]{64}$' -or [long]$row.bytes -lt 0) {
        throw "Invalid manifest entry: $rel"
    }
    if (!(($row.kind -eq 'qsp' -and $rel -ceq 'game/jack.qsp') -or
          ($row.kind -eq 'json' -and $rel -cmatch '^game/json/.+\.json$') -or
          ($row.kind -eq 'image' -and $rel -cmatch '^game/content/pic/.+\.png$') -or
          ($row.kind -eq 'workshop' -and $rel -cmatch '^game/modtools/.+$'))) {
        throw "Invalid payload type: $rel"
    }
}

$base = [IO.Compression.ZipFile]::OpenRead($BaseZip)
$workshop = $null
$target = $null
$rows = [Collections.Generic.Dictionary[string,object]]::new([StringComparer]::OrdinalIgnoreCase)
$updates = [Collections.Generic.Dictionary[string,string]]::new([StringComparer]::OrdinalIgnoreCase)
$added = 0
try {
    if ((Hash-Entry $base.GetEntry('PATCH_MANIFEST.json')) -ne $baseManifestHash) { throw 'Unexpected r4 manifest.' }
    $r4 = Read-Entry $base 'PATCH_MANIFEST.json' | ConvertFrom-Json
    foreach ($row in $r4.files) {
        Confirm-Row $row
        $entry = $base.GetEntry($row.path)
        if ($null -eq $entry -or $entry.Length -ne $row.bytes) { throw "Missing r4 payload: $($row.path)" }
        $rows.Add($row.path, $row)
    }
    if ($rows.Count -ne 1967 -or $rows['game/jack.qsp'].sha256 -ne $baseQspHash -or
        (Hash-Entry $base.GetEntry('game/jack.qsp')) -ne $baseQspHash) { throw 'Unexpected r4 game baseline.' }

    foreach ($item in (Get-Content -LiteralPath $Overlay -Raw -Encoding UTF8 | ConvertFrom-Json)) {
        $rel = [string]$item.path
        if ($rel -match '\\|:|(^|/)\.\.?(?:/|$)|//') { throw "Invalid overlay: $rel" }
        $kind = switch -Regex ($rel) {
            '^game/jack\.qsp$' { 'qsp'; break }
            '^game/json/.+\.json$' { 'json'; break }
            '^game/content/pic/.+\.png$' { 'image'; break }
            default { throw "Unsupported overlay: $rel" }
        }
        $source = [IO.Path]::GetFullPath((Join-Path $workRoot $rel))
        if (!$source.StartsWith($workRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw "Outside WORK: $rel" }
        $info = Get-Item -LiteralPath $source
        if ($info.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Linked overlay: $rel" }
        $sha = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($sha -ne $item.sha) { throw "WORK overlay hash changed: $rel" }
        $row = [pscustomobject][ordered]@{path=$rel; bytes=$info.Length; sha256=$sha; kind=$kind}
        Confirm-Row $row
        if (!$rows.ContainsKey($rel)) { $added++ }
        elseif ($rows[$rel].path -cne $rel) { throw "Overlay would change filename case: $rel" }
        $updates.Add($rel, $source)
        $rows[$rel] = $row
    }
    if (!$updates.ContainsKey('game/jack.qsp') -or $rows['game/jack.qsp'].sha256 -ne $workQspHash) {
        throw 'Expected current WORK QSP was not staged.'
    }
    if ((Get-FileHash -LiteralPath $WorkshopZip -Algorithm SHA256).Hash.ToLowerInvariant() -ne $workshopZipHash) {
        throw 'The previously released WORKSHOP repair archive has changed.'
    }
    $workshop = [IO.Compression.ZipFile]::OpenRead($WorkshopZip)
    $workshopManifest = Read-Entry $workshop 'WORKSHOP_MANIFEST.json' | ConvertFrom-Json
    if (@($workshopManifest.files).Count -ne 419) { throw 'Unexpected WORKSHOP manifest.' }
    foreach ($item in $workshopManifest.files) {
        $row = [pscustomobject][ordered]@{path=$item.path; bytes=$item.bytes; sha256=$item.sha256; kind='workshop'}
        Confirm-Row $row
        $entry = $workshop.GetEntry($row.path)
        if ($null -eq $entry -or $entry.Length -ne $row.bytes) { throw "Missing published WORKSHOP file: $($row.path)" }
        $rows.Add($row.path, $row)
    }

    $orderedRows = @($rows.Values | Sort-Object -Property path)
    $manifest = [ordered]@{schema=1; gameVersion='2.4.1'; patchRevision='2026-11-07-update3-r2'; jsonMode='replace-complete'; files=$orderedRows}
    $manifestBytes = $utf8.GetBytes(($manifest | ConvertTo-Json -Depth 7) + "`n")
    $manifestStream = [IO.MemoryStream]::new($manifestBytes, $false)
    try { $manifestHash = Hash-Stream $manifestStream } finally { $manifestStream.Dispose() }
    $helper = Read-Entry $base 'INSTALL_HELPER.ps1'
    if ([regex]::Matches($helper, [regex]::Escape($baseManifestHash)).Count -ne 1) { throw 'Unexpected previous installer.' }
    $helper = $helper.Replace($baseManifestHash, $manifestHash)
    $oldAllowlist = '($kind -eq ''image'' -and $rel -cmatch ''^game/content/pic/.+\.png$'')'
    if ([regex]::Matches($helper, [regex]::Escape($oldAllowlist)).Count -ne 1) { throw 'Unexpected installer allowlist.' }
    $helper = $helper.Replace($oldAllowlist, $oldAllowlist + ' -or ($kind -eq ''workshop'' -and $rel -cmatch ''^game/modtools/.+$'')')
    $helperBytes = [Text.Encoding]::UTF8.GetPreamble() + $utf8.GetBytes($helper)

    $target = [IO.Compression.ZipFile]::Open($outputPath, [IO.Compression.ZipArchiveMode]::Create, $utf8)
    foreach ($row in $orderedRows) {
        $level = if ($row.path.EndsWith('.png', [StringComparison]::OrdinalIgnoreCase)) { [IO.Compression.CompressionLevel]::NoCompression } else { [IO.Compression.CompressionLevel]::Optimal }
        $stream = if ($updates.ContainsKey($row.path)) { [IO.File]::OpenRead($updates[$row.path]) }
                  elseif ($row.kind -eq 'workshop') { $workshop.GetEntry($row.path).Open() }
                  else { $base.GetEntry($row.path).Open() }
        try { Copy-Entry $stream $target $row.path $level } finally { $stream.Dispose() }
    }
    Add-Bytes $manifestBytes $target 'PATCH_MANIFEST.json'
    Add-Bytes $helperBytes $target 'INSTALL_HELPER.ps1'
    $cmd = $base.GetEntry('INSTALL.cmd').Open()
    try { Copy-Entry $cmd $target 'INSTALL.cmd' Optimal } finally { $cmd.Dispose() }
    foreach ($name in $releaseDocuments) {
        Add-Bytes ([IO.File]::ReadAllBytes((Join-Path $PSScriptRoot $name))) $target $name
    }
} finally {
    if ($null -ne $target) { $target.Dispose() }
    if ($null -ne $workshop) { $workshop.Dispose() }
    $base.Dispose()
}

$result = [IO.Compression.ZipFile]::OpenRead($outputPath)
try {
    $rootFiles = @('PATCH_MANIFEST.json','INSTALL_HELPER.ps1','INSTALL.cmd') + $releaseDocuments
    $seen = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    foreach ($entry in $result.Entries) {
        if (!$seen.Add($entry.FullName)) { throw "Duplicate archive entry: $($entry.FullName)" }
        if (!$rows.ContainsKey($entry.FullName) -and $entry.FullName -cnotin $rootFiles) { throw "Unexpected archive entry: $($entry.FullName)" }
    }
    if ($seen.Count -ne $rows.Count + $rootFiles.Count) { throw 'Archive file count mismatch.' }
    foreach ($row in $orderedRows) {
        $entry = $result.GetEntry($row.path)
        if ($entry.Length -ne $row.bytes -or (Hash-Entry $entry) -ne $row.sha256) {
            throw "Archive payload verification failed: $($row.path)"
        }
    }
    if ((Hash-Entry $result.GetEntry('PATCH_MANIFEST.json')) -ne $manifestHash -or
        !( (Read-Entry $result 'INSTALL_HELPER.ps1').Contains($manifestHash) )) { throw 'Installer manifest verification failed.' }
    foreach ($row in $orderedRows | Where-Object kind -in @('qsp','json')) {
        $path = Join-Path $mirrorRoot $row.path
        [void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($path))
        [IO.Compression.ZipFileExtensions]::ExtractToFile($result.GetEntry($row.path), $path, $false)
    }
} finally { $result.Dispose() }

$verification = [ordered]@{
    archive=$outputPath
    archiveBytes=(Get-Item -LiteralPath $outputPath).Length
    archiveSha256=(Get-FileHash -LiteralPath $outputPath -Algorithm SHA256).Hash.ToLowerInvariant()
    qspSha256=$workQspHash
    manifestSha256=$manifestHash
    baseRuntimeFiles=1967
    added=$added
    replaced=$updates.Count-$added
    json=@($orderedRows | Where-Object kind -eq 'json').Count
    png=@($orderedRows | Where-Object kind -eq 'image').Count
    workshop=@($orderedRows | Where-Object kind -eq 'workshop').Count
    runtimeFiles=$rows.Count
    archiveFiles=$seen.Count
    archivePayloadHashesPassed=$true
}
$verification | ConvertTo-Json
