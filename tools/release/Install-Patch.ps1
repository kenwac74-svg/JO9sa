[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $true)][string]$GameDirectory,
    [string]$BackupDirectory = '',
    [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2
# JO9 MOD START RELEASE_PATCH_INSTALLER | 2026-10-18_release_patch_installer
# This installer uses only the recipient files and this package. It never reads JO9O or another game installation.
function Normalize-Relative([string]$Relative) {
    if ([string]::IsNullOrWhiteSpace($Relative) -or [IO.Path]::IsPathRooted($Relative) -or $Relative.Contains(':')) { throw "Unsafe path: $Relative" }
    $parts = @($Relative.Replace('\', '/').Split('/'))
    foreach ($part in $parts) {
        if (-not $part -or $part -eq '.' -or $part -eq '..' -or $part.TrimEnd(' ', '.') -ne $part -or $part.IndexOfAny([IO.Path]::GetInvalidFileNameChars()) -ge 0 -or $part -match '^(?i:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)') { throw "Unsafe path segment: $Relative" }
    }
    return ($parts -join '/')
}
function Is-Within([string]$Root, [string]$Path) {
    $prefix = $Root.TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar
    return $Path.Equals($Root, [StringComparison]::OrdinalIgnoreCase) -or $Path.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)
}
function Assert-NoReparse([string]$Path) {
    $cursor = [IO.Path]::GetFullPath($Path)
    while ($cursor) {
        $item = Get-Item -LiteralPath $cursor -Force -ErrorAction SilentlyContinue
        if ($item) {
            if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Reparse/junction/symbolic link path refused: $cursor" }
            if ($cursor -ne $Path -and -not $item.PSIsContainer) { throw "A parent path is a file: $cursor" }
        }
        $parent = Split-Path -Parent $cursor
        if ($parent -eq $cursor) { break }
        $cursor = $parent
    }
}
function Resolve-Safe([string]$Root, [string]$Relative) {
    $normalized = Normalize-Relative $Relative
    $full = [IO.Path]::GetFullPath((Join-Path $Root $normalized.Replace('/', [IO.Path]::DirectorySeparatorChar)))
    if (-not (Is-Within $Root $full)) { throw "Path escaped its root: $Relative" }
    Assert-NoReparse $full
    return $full
}
function File-Hash([string]$Path) {
    $stream = [IO.File]::OpenRead($Path)
    $algorithm = [Security.Cryptography.SHA256]::Create()
    try { return [BitConverter]::ToString($algorithm.ComputeHash($stream)).Replace('-', '').ToLowerInvariant() }
    finally { $algorithm.Dispose(); $stream.Dispose() }
}
function Assert-File([string]$Path, [string]$Purpose) {
    Assert-NoReparse $Path
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw "Missing required $Purpose file: $Path" }
}
function Assert-Unchanged([string]$Path, [bool]$Existed, [string]$Hash) {
    Assert-NoReparse $Path
    if ($Existed) { Assert-File $Path 'recipient'; if ((File-Hash $Path) -ne $Hash) { throw "Recipient changed after preflight: $Path" } }
    elseif (Test-Path -LiteralPath $Path) { throw "Recipient path appeared after preflight: $Path" }
}
function Ensure-Parent([string]$Path) {
    Assert-NoReparse $Path
    [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($Path)) | Out-Null
    Assert-NoReparse $Path
}

$packageRoot = [IO.Path]::GetFullPath($PSScriptRoot)
$gameRoot = [IO.Path]::GetFullPath($GameDirectory).TrimEnd('\', '/')
Assert-NoReparse $packageRoot
Assert-NoReparse $gameRoot
if (-not (Test-Path -LiteralPath $gameRoot -PathType Container)) { throw "GameDirectory must be the existing folder containing jack.qsp: $gameRoot" }
Assert-File (Resolve-Safe $gameRoot 'jack.qsp') 'game jack.qsp'
$manifestFile = Resolve-Safe $packageRoot 'BUILD_MANIFEST.json'
$mapFile = Resolve-Safe $packageRoot 'original-map.json'
Assert-File $manifestFile 'BUILD_MANIFEST.json'
Assert-File $mapFile 'original-map.json'
$manifest = Get-Content -LiteralPath $manifestFile -Raw -Encoding UTF8 | ConvertFrom-Json
$mapping = Get-Content -LiteralPath $mapFile -Raw -Encoding UTF8 | ConvertFrom-Json
if (-not $manifest.PSObject.Properties['files'] -or @($manifest.files).Count -eq 0) { throw 'Manifest files must contain the game payload.' }
if (-not $mapping.PSObject.Properties['mappings']) { throw 'original-map.json must contain mappings.' }

# Complete read-only preflight. No backup/log/directory is created until every input is accepted.
$payload = New-Object 'Collections.Generic.List[object]'
$payloadByRelative = @{}
foreach ($entry in @($manifest.files)) {
    foreach ($required in @('path', 'sha256', 'bytes')) { if (-not $entry.PSObject.Properties[$required]) { throw "Manifest entry missing $required" } }
    $packageRelative = Normalize-Relative ([string]$entry.path)
    if (-not $packageRelative.StartsWith('game/', [StringComparison]::OrdinalIgnoreCase)) { throw "Manifest path must begin game/: $packageRelative" }
    $relative = $packageRelative.Substring(5)
    if ($payloadByRelative.ContainsKey($relative)) { throw "Duplicate manifest path: $relative" }
    if ($relative -match '(?i)(^|/)slaves/.*\.json$|(^|/)slave_index\.json$') { throw "External NPC slaves JSON/index cannot be installed: $relative" }
    if ($relative.StartsWith('content/jo9o_original_cuts/', [StringComparison]::OrdinalIgnoreCase)) { throw "Package must not contain original art: $relative" }
    if ([string]$entry.sha256 -notmatch '^[a-fA-F0-9]{64}$' -or [string]$entry.bytes -notmatch '^\d+$') { throw "Invalid SHA/bytes in manifest: $relative" }
    $sourcePath = Resolve-Safe $packageRoot $packageRelative
    $destination = Resolve-Safe $gameRoot $relative
    if ($sourcePath.Equals($destination, [StringComparison]::OrdinalIgnoreCase)) { throw 'Extract the patch separately; package payload and recipient game must be different paths.' }
    Assert-File $sourcePath 'payload'
    $hash = ([string]$entry.sha256).ToLowerInvariant()
    if ((Get-Item -LiteralPath $sourcePath).Length -ne [int64]$entry.bytes -or (File-Hash $sourcePath) -ne $hash) { throw "Payload SHA/hash or size mismatch: $packageRelative" }
    $existed = Test-Path -LiteralPath $destination -PathType Leaf
    if ((Test-Path -LiteralPath $destination) -and -not $existed) { throw "Payload destination is not a file: $destination" }
    $oldHash = if ($existed) { File-Hash $destination } else { '' }
    $changed = -not $existed -or $oldHash -ne $hash
    if ($existed -and $changed -and ((Get-Item -LiteralPath $destination).Attributes -band [IO.FileAttributes]::ReadOnly)) { throw "Recipient is read-only: $destination" }
    $row = [pscustomobject]@{ relative=$relative; source=$sourcePath; destination=$destination; sha256=$hash; bytes=[int64]$entry.bytes; existed=[bool]$existed; oldSha256=$oldHash; changed=[bool]$changed; backedUp=$false; completed=$false }
    $payload.Add($row)
    $payloadByRelative[$relative] = $row
}
$prerequisiteFile = Resolve-Safe $packageRoot 'prerequisites.json'
if (Test-Path -LiteralPath $prerequisiteFile) {
    Assert-File $prerequisiteFile 'prerequisites.json'
    $prerequisites = Get-Content -LiteralPath $prerequisiteFile -Raw -Encoding UTF8 | ConvertFrom-Json
    if (-not $prerequisites.PSObject.Properties['files']) { throw 'prerequisites.json requires files.' }
    foreach ($entry in @($prerequisites.files)) {
        if (-not $entry.PSObject.Properties['path'] -or -not $entry.PSObject.Properties['requiredPresence'] -or $entry.requiredPresence -isnot [bool]) { throw 'Prerequisite entry requires path and boolean requiredPresence.' }
        $relative = Normalize-Relative ([string]$entry.path)
        if (-not $relative.StartsWith('content/pic/', [StringComparison]::OrdinalIgnoreCase)) { throw "Prerequisite path must be game-relative content/pic/: $relative" }
        $requiredFile = Resolve-Safe $gameRoot $relative
        if ($entry.requiredPresence) { Assert-File $requiredFile 'external prerequisite (install the required external pack first)' }
    }
}
$groups = @{}
$mappingCount = 0
foreach ($record in @($mapping.mappings)) {
    if (-not $record.PSObject.Properties['source'] -or -not $record.PSObject.Properties['target']) { throw 'Mapping record requires source and target paths.' }
    $sourceRelative = Normalize-Relative ([string]$record.source)
    $targetRelative = Normalize-Relative ([string]$record.target)
    if (-not $sourceRelative.StartsWith('content/pic/', [StringComparison]::OrdinalIgnoreCase) -or -not $targetRelative.StartsWith('content/jo9o_original_cuts/', [StringComparison]::OrdinalIgnoreCase)) { throw "Invalid original-map path: $sourceRelative -> $targetRelative" }
    $mappingCount++
    if (-not $groups.ContainsKey($targetRelative)) { $groups[$targetRelative] = New-Object 'Collections.Generic.List[string]' }
    if (-not $groups[$targetRelative].Contains($sourceRelative)) { $groups[$targetRelative].Add($sourceRelative) }
}
$originals = New-Object 'Collections.Generic.List[object]'
$originalByRelative = @{}
foreach ($targetRelative in @($groups.Keys | Sort-Object)) {
    $destination = Resolve-Safe $gameRoot $targetRelative
    $existed = Test-Path -LiteralPath $destination -PathType Leaf
    if ((Test-Path -LiteralPath $destination) -and -not $existed) { throw "Original target is not a file: $destination" }
    $sourcePath = ''; $sourceHash = if ($existed) { File-Hash $destination } else { '' }
    if (-not $existed) {
        foreach ($sourceRelative in $groups[$targetRelative]) {
            $current = Resolve-Safe $gameRoot $sourceRelative
            Assert-File $current 'original source (restore the pre-patch original before installation)'
            $currentHash = File-Hash $current
            if ($payloadByRelative.ContainsKey($sourceRelative) -and $payloadByRelative[$sourceRelative].sha256 -eq $currentHash) { throw "Original unavailable: $sourceRelative already matches the personal patch image. Restore its pre-patch original before installing, or restore your saved artificial original: $targetRelative" }
            if ($sourceHash -and $sourceHash -ne $currentHash) { throw "Conflicting/different source art for the same original target: $targetRelative" }
            $sourcePath = $current; $sourceHash = $currentHash
        }
    }
    $row = [pscustomobject]@{ relative=$targetRelative; destination=$destination; source=$sourcePath; sha256=$sourceHash; existed=[bool]$existed; created=$false }
    $originals.Add($row)
    $originalByRelative[$targetRelative] = $row
}
$resources = New-Object 'Collections.Generic.List[object]'
$resourceGroups = @{}
$resourceFile = Resolve-Safe $packageRoot 'resource-map.json'
if (Test-Path -LiteralPath $resourceFile) {
    Assert-File $resourceFile 'resource-map.json'
    $resourceMap = Get-Content -LiteralPath $resourceFile -Raw -Encoding UTF8 | ConvertFrom-Json
    if (-not $resourceMap.PSObject.Properties['mappings']) { throw 'resource-map.json requires mappings.' }
    foreach ($record in @($resourceMap.mappings)) {
        if (-not $record.PSObject.Properties['source'] -or -not $record.PSObject.Properties['target']) { throw 'Resource mapping requires source and target.' }
        $sourceRelative = Normalize-Relative ([string]$record.source)
        $targetRelative = Normalize-Relative ([string]$record.target)
        if (-not $sourceRelative.StartsWith('content/pic/', [StringComparison]::OrdinalIgnoreCase) -or -not $targetRelative.StartsWith('content/pic/', [StringComparison]::OrdinalIgnoreCase)) { throw 'Resource mapping paths must be game-relative content/pic/ images.' }
        if ($payloadByRelative.ContainsKey($targetRelative)) { throw "Resource target conflicts with personal payload: $targetRelative" }
        if (-not $resourceGroups.ContainsKey($targetRelative)) { $resourceGroups[$targetRelative] = New-Object 'Collections.Generic.List[string]' }
        if (-not $resourceGroups[$targetRelative].Contains($sourceRelative)) { $resourceGroups[$targetRelative].Add($sourceRelative) }
    }
    foreach ($targetRelative in @($resourceGroups.Keys | Sort-Object)) {
        $destination = Resolve-Safe $gameRoot $targetRelative
        $existed = Test-Path -LiteralPath $destination -PathType Leaf
        if ((Test-Path -LiteralPath $destination) -and -not $existed) { throw "Resource target is not a file: $destination" }
        $sourcePath = ''; $sourceHash = ''
        if (-not $existed) {
            foreach ($sourceRelative in $resourceGroups[$targetRelative]) {
                $current = Resolve-Safe $gameRoot $sourceRelative
                Assert-File $current 'receiver resource source (install the required base/external pack first)'
                $currentHash = File-Hash $current
                if ($sourceHash -and $sourceHash -ne $currentHash) { throw "Conflicting source art for resource target: $targetRelative" }
                $sourcePath = $current; $sourceHash = $currentHash
            }
        }
        $resources.Add([pscustomobject]@{ relative=$targetRelative; destination=$destination; source=$sourcePath; sha256=$sourceHash; existed=[bool]$existed; created=$false })
    }
}
# JO9 MOD START RELEASE_PATCH_INSTALLER_WINDOWS_ORIGINAL_B | 2026-10-18_windows_original_b
# A mirror may read only one original-map target, including an original planned above.
# It creates the physical (2) image after originals and before personal payload writes.
$originalMirrors = New-Object 'Collections.Generic.List[object]'
$mirrorFile = Resolve-Safe $packageRoot 'original-mirror-map.json'
if (Test-Path -LiteralPath $mirrorFile) {
    Assert-File $mirrorFile 'original-mirror-map.json'
    $mirrorMap = Get-Content -LiteralPath $mirrorFile -Raw -Encoding UTF8 | ConvertFrom-Json
    if (-not $mirrorMap.PSObject.Properties['mappings']) { throw 'original-mirror-map.json requires mappings.' }
    $mirrorGroups = @{}
    foreach ($record in @($mirrorMap.mappings)) {
        if (-not $record.PSObject.Properties['source'] -or -not $record.PSObject.Properties['target']) { throw 'Original mirror mapping requires source and target.' }
        $sourceRelative = Normalize-Relative ([string]$record.source)
        $targetRelative = Normalize-Relative ([string]$record.target)
        if (-not $originalByRelative.ContainsKey($sourceRelative)) { throw "Original mirror source must be declared in original-map.json: $sourceRelative" }
        if (-not $targetRelative.StartsWith('content/pic/', [StringComparison]::OrdinalIgnoreCase) -or $targetRelative -notmatch '(?i) \(2\)\.(png|jpe?g|gif|webp|bmp)$') { throw "Original mirror target must be a physical content/pic/ (2) image: $targetRelative" }
        if ($payloadByRelative.ContainsKey($targetRelative) -or $resourceGroups.ContainsKey($targetRelative)) { throw "Original mirror target conflicts with payload or resource map: $targetRelative" }
        if ($mirrorGroups.ContainsKey($targetRelative) -and $mirrorGroups[$targetRelative] -ne $sourceRelative) { throw "Conflicting original mirror sources for target: $targetRelative" }
        $mirrorGroups[$targetRelative] = $sourceRelative
    }
    foreach ($targetRelative in @($mirrorGroups.Keys | Sort-Object)) {
        $original = $originalByRelative[$mirrorGroups[$targetRelative]]
        $destination = Resolve-Safe $gameRoot $targetRelative
        $existed = Test-Path -LiteralPath $destination -PathType Leaf
        if ((Test-Path -LiteralPath $destination) -and -not $existed) { throw "Original mirror target is not a file: $destination" }
        if ($existed -and (File-Hash $destination) -ne $original.sha256) { throw "Conflicting/different existing physical (2) original mirror; preserve and review this file before retrying: $targetRelative" }
        $originalMirrors.Add([pscustomobject]@{ relative=$targetRelative; destination=$destination; source=$original.destination; sha256=$original.sha256; existed=[bool]$existed; created=$false })
    }
}
# JO9 MOD END RELEASE_PATCH_INSTALLER_WINDOWS_ORIGINAL_B
$installRoot = [IO.Path]::GetDirectoryName($gameRoot)
if (-not [IO.Path]::GetDirectoryName($installRoot)) { $installRoot = $gameRoot }
$backupParent = if ($BackupDirectory) { [IO.Path]::GetFullPath($BackupDirectory) } else { Join-Path ([IO.Path]::GetDirectoryName($installRoot)) 'JO9_patch_backups' }
Assert-NoReparse $backupParent
if (Is-Within $installRoot $backupParent) { throw 'BackupDirectory must be outside the recipient installation folder.' }
$changes = @($payload | Where-Object { $_.changed })
$newOriginals = @($originals | Where-Object { -not $_.existed })
$newResources = @($resources | Where-Object { -not $_.existed })
$newOriginalMirrors = @($originalMirrors | Where-Object { -not $_.existed })
$summary = [ordered]@{ status=''; mappingRecords=$mappingCount; originalTargets=$originals.Count; originalsCopied=$newOriginals.Count; originalMirrorTargets=$originalMirrors.Count; originalMirrorsCopied=$newOriginalMirrors.Count; resourceTargets=$resources.Count; resourcesCopied=$newResources.Count; payloadFiles=$payload.Count; payloadChanged=$changes.Count; backupDirectory=$null }
if ($DryRun -or -not $PSCmdlet.ShouldProcess($gameRoot, 'Preserve recipient originals, back up and install the verified patch')) { $summary.status='DRY_RUN'; $summary | ConvertTo-Json -Compress; return }
if ($changes.Count -eq 0 -and $newOriginals.Count -eq 0 -and $newResources.Count -eq 0 -and $newOriginalMirrors.Count -eq 0) { $summary.status='ALREADY_INSTALLED'; $summary | ConvertTo-Json -Compress; return }

$stamp = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ') + '_' + [Guid]::NewGuid().ToString('N').Substring(0, 8)
$backupRoot = Join-Path $backupParent $stamp
Assert-NoReparse $backupRoot
if (Test-Path -LiteralPath $backupRoot) { throw 'Backup directory already exists; retry with a new timestamp.' }
[IO.Directory]::CreateDirectory($backupRoot) | Out-Null
$journalPath = Join-Path $backupRoot 'rollback.json'
$journal = [ordered]@{ schema=1; status='PREPARED'; gameDirectory=$gameRoot; packageDirectory=$packageRoot; createdAt=[DateTime]::UtcNow.ToString('o'); files=@($changes); originals=$originals.ToArray(); resources=$resources.ToArray(); originalMirrors=$originalMirrors.ToArray(); rollback='Check every planned files entry, including completed=false: an interrupted copy can partially change a destination before completion is recorded. Copy available files/<relative> backups over corresponding game files after reviewing current hashes. Existing originals/resources/mirrors were preserved. Planned new files can also exist partially with completed/created=false; restoring prior absence requires separate reviewed removal. This installer never deletes or moves files.' }
function Save-Journal { [IO.File]::WriteAllText($journalPath, (ConvertTo-Json -InputObject $journal -Depth 8), [Text.UTF8Encoding]::new($false)) }
Save-Journal
$summary.backupDirectory = $backupRoot
try {
    # Back up every overwritten file before any recipient file is changed.
    foreach ($row in $changes) {
        Assert-Unchanged $row.destination $row.existed $row.oldSha256
        if ($row.existed) {
            $backup = Resolve-Safe $backupRoot ('files/' + $row.relative)
            Ensure-Parent $backup
            [IO.File]::Copy($row.destination, $backup, $false)
            if ((File-Hash $backup) -ne $row.oldSha256) { throw "Backup hash mismatch: $($row.relative)" }
            $row.backedUp = $true; Save-Journal
        }
    }
    # Copy verified recipient resource aliases without replacing existing targets.
    foreach ($row in $newResources) {
        Assert-Unchanged $row.destination $false ''
        Assert-Unchanged $row.source $true $row.sha256
        Ensure-Parent $row.destination
        [IO.File]::Copy($row.source, $row.destination, $false)
        if ((File-Hash $row.destination) -ne $row.sha256) { throw "Resource copy hash mismatch: $($row.relative)" }
        $row.created = $true; Save-Journal
    }
    # Save all originals before the first payload overwrite.
    foreach ($row in $newOriginals) {
        Assert-Unchanged $row.destination $false ''
        Assert-Unchanged $row.source $true $row.sha256
        Ensure-Parent $row.destination
        [IO.File]::Copy($row.source, $row.destination, $false)
        if ((File-Hash $row.destination) -ne $row.sha256) { throw "Original preservation hash mismatch: $($row.relative)" }
        $row.created = $true; Save-Journal
    }
    # JO9 MOD START RELEASE_PATCH_INSTALLER_WINDOWS_ORIGINAL_B_COPY | 2026-10-18_windows_original_b
    foreach ($row in $newOriginalMirrors) {
        Assert-Unchanged $row.destination $false ''
        Assert-Unchanged $row.source $true $row.sha256
        Ensure-Parent $row.destination
        [IO.File]::Copy($row.source, $row.destination, $false)
        if ((File-Hash $row.destination) -ne $row.sha256) { throw "Original mirror copy hash mismatch: $($row.relative)" }
        $row.created = $true; Save-Journal
    }
    foreach ($row in $originalMirrors) {
        Assert-Unchanged $row.source $true $row.sha256
        Assert-Unchanged $row.destination $true $row.sha256
    }
    # JO9 MOD END RELEASE_PATCH_INSTALLER_WINDOWS_ORIGINAL_B_COPY
    foreach ($row in $changes) {
        Assert-Unchanged $row.destination $row.existed $row.oldSha256
        Assert-File $row.source 'payload'
        if ((Get-Item -LiteralPath $row.source).Length -ne $row.bytes -or (File-Hash $row.source) -ne $row.sha256) { throw "Payload changed after preflight: $($row.relative)" }
        Ensure-Parent $row.destination
        [IO.File]::Copy($row.source, $row.destination, $row.existed)
        if ((File-Hash $row.destination) -ne $row.sha256) { throw "Installed hash mismatch: $($row.relative)" }
        $row.completed = $true; Save-Journal
    }
    $journal.status = 'COMPLETE'; Save-Journal
    $summary.status = 'INSTALLED'; $summary | ConvertTo-Json -Compress
} catch {
    $journal.status = 'PARTIAL_RESTORE_REQUIRED'; Save-Journal
    throw "Installation stopped after preflight; retain backup and rollback.json at $backupRoot. $($_.Exception.Message)"
}
# JO9 MOD END RELEASE_PATCH_INSTALLER
