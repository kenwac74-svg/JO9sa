param(
    [Parameter(Mandatory=$true)][string]$BaseRoot,
    [Parameter(Mandatory=$true)][string]$PackRoot,
    [Parameter(Mandatory=$true)][string]$ReportPath,
    [switch]$Apply
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2

function Get-RelativePath([string]$Root, [string]$Path) {
    $prefix = [IO.Path]::GetFullPath($Root).TrimEnd('\') + '\'
    return [IO.Path]::GetFullPath($Path).Substring($prefix.Length)
}

function Get-Hash([string]$Path) {
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

foreach ($folder in @($BaseRoot, $PackRoot)) {
    if (-not (Test-Path -LiteralPath $folder -PathType Container)) { throw "Folder not found: $folder" }
}
$BaseRoot = [IO.Path]::GetFullPath($BaseRoot)
$PackRoot = [IO.Path]::GetFullPath($PackRoot)
$index = @{}
$baseSizes = @{}
$packSizes = @{}
$packFiles = @(Get-ChildItem -LiteralPath $PackRoot -File -Recurse -Force | Where-Object {
    ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) -eq 0
})
$packFiles | ForEach-Object { $packSizes[[string]$_.Length] = $true }
$baseFiles = @(Get-ChildItem -LiteralPath $BaseRoot -File -Recurse -Force | Where-Object {
    ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) -eq 0
})
Write-Host "Base files scanned: $($baseFiles.Count)"
foreach ($file in $baseFiles) {
    if (-not $packSizes.ContainsKey([string]$file.Length)) { continue }
    $baseSizes[[string]$file.Length] = $true
    $hash = Get-Hash $file.FullName
    $key = "$($file.Length):$hash"
    if (-not $index.ContainsKey($key)) {
        $index[$key] = [pscustomobject]@{ Path = $file.FullName; WriteUtc = $file.LastWriteTimeUtc.Ticks }
    }
}

$matches = New-Object 'Collections.Generic.List[object]'
Write-Host "Pack files checked: $($packFiles.Count)"
foreach ($file in $packFiles) {
    if (-not $baseSizes.ContainsKey([string]$file.Length)) { continue }
    $key = "$($file.Length):$(Get-Hash $file.FullName)"
    if ($index.ContainsKey($key)) {
        $matches.Add([pscustomobject]@{
            PackPath = Get-RelativePath $PackRoot $file.FullName
            BasePath = Get-RelativePath $BaseRoot $index[$key].Path
            Bytes = $file.Length
            SHA256 = $key.Substring($key.IndexOf(':') + 1)
            PackWriteUtc = $file.LastWriteTimeUtc.Ticks
            BaseWriteUtc = $index[$key].WriteUtc
        })
    }
}

$reportDirectory = Split-Path -Parent $ReportPath
if ($reportDirectory) { [void][IO.Directory]::CreateDirectory($reportDirectory) }
$matches | Export-Csv -LiteralPath $ReportPath -NoTypeInformation -Encoding UTF8
Write-Host "Exact duplicates: $($matches.Count)"
Write-Host "Report: $ReportPath"

if (-not $Apply) {
    Write-Host 'DryRun: no files deleted. Use -Apply to remove exact duplicates.'
    exit 0
}

# Verify candidate metadata has not changed since its content hash was recorded.
foreach ($match in $matches) {
    $packPath = Join-Path $PackRoot $match.PackPath
    $basePath = Join-Path $BaseRoot $match.BasePath
    if (-not [IO.File]::Exists($packPath) -or -not [IO.File]::Exists($basePath)) { throw "Verification target disappeared: $($match.PackPath)" }
    $packItem = Get-Item -LiteralPath $packPath -Force
    $baseItem = Get-Item -LiteralPath $basePath -Force
    if ($packItem.Length -ne $match.Bytes -or $packItem.LastWriteTimeUtc.Ticks -ne $match.PackWriteUtc -or
        $baseItem.Length -ne $match.Bytes -or $baseItem.LastWriteTimeUtc.Ticks -ne $match.BaseWriteUtc) {
        throw "Pre-delete metadata changed; stopped: $($match.PackPath)"
    }
}

foreach ($match in $matches) {
    Remove-Item -LiteralPath (Join-Path $PackRoot $match.PackPath) -Force
}
Write-Host "Deleted: $($matches.Count) files"