# 순정 잭오나 2.3 ZIP(또는 풀어 둔 game 폴더)에서 content/pic·css·json 파일의 경로·크기·SHA-256 목록을 만든다
param(
    [Parameter(Mandatory=$true)][string]$Source,
    [string]$Out = 'vanilla_manifest.json'
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$sha = [Security.Cryptography.SHA256]::Create()
function HexOf([byte[]]$h) { return [BitConverter]::ToString($h).Replace('-', '').ToLowerInvariant() }
function Wanted([string]$rel) { return $rel -match '^(content/pic/|css/|json/|jack\.qsp$)' }
$items = New-Object Collections.Generic.List[object]
$Source = [IO.Path]::GetFullPath($Source)

if ([IO.File]::Exists($Source) -and $Source.ToLowerInvariant().EndsWith('.zip')) {
    $zip = [IO.Compression.ZipFile]::OpenRead($Source)
    try {
        # game 폴더 위치를 jack.qsp로 찾는다 (ZIP 안의 최상위 폴더 이름과 무관하게).
        $qsp = $zip.Entries | Where-Object { $_.FullName.Replace('\', '/') -match '(^|/)jack\.qsp$' } | Sort-Object { $_.FullName.Length } | Select-Object -First 1
        if ($null -eq $qsp) { throw 'ZIP 안에서 jack.qsp를 찾지 못했습니다.' }
        $prefix = $qsp.FullName.Replace('\', '/').Substring(0, $qsp.FullName.Length - 'jack.qsp'.Length)
        foreach ($e in $zip.Entries) {
            $name = $e.FullName.Replace('\', '/')
            if (-not $name.StartsWith($prefix) -or $name.EndsWith('/')) { continue }
            $rel = $name.Substring($prefix.Length)
            if (-not (Wanted $rel)) { continue }
            $s = $e.Open(); try { $h = HexOf ($sha.ComputeHash($s)) } finally { $s.Dispose() }
            $items.Add([pscustomobject]@{ Rel = $rel; Bytes = $e.Length; Sha256 = $h })
        }
    } finally { $zip.Dispose() }
} elseif ([IO.Directory]::Exists($Source)) {
    $root = $Source
    if (-not [IO.File]::Exists((Join-Path $root 'jack.qsp')) -and [IO.File]::Exists((Join-Path $root 'game/jack.qsp'))) { $root = Join-Path $root 'game' }
    if (-not [IO.File]::Exists((Join-Path $root 'jack.qsp'))) { throw 'jack.qsp가 있는 game 폴더를 지정하세요.' }
    $root = [IO.Path]::GetFullPath($root).TrimEnd([IO.Path]::DirectorySeparatorChar)
    foreach ($f in Get-ChildItem -LiteralPath $root -Recurse -File -Force) {
        $rel = $f.FullName.Substring($root.Length + 1).Replace('\', '/')
        if (-not (Wanted $rel)) { continue }
        $s = [IO.File]::OpenRead($f.FullName); try { $h = HexOf ($sha.ComputeHash($s)) } finally { $s.Dispose() }
        $items.Add([pscustomobject]@{ Rel = $rel; Bytes = $f.Length; Sha256 = $h })
    }
} else { throw ('ZIP 파일이나 폴더가 아닙니다: ' + $Source) }

$result = [pscustomobject]@{ Source = [IO.Path]::GetFileName($Source); Created = (Get-Date).ToString('s'); Count = $items.Count; Files = @($items | Sort-Object Rel) }
[IO.File]::WriteAllText([IO.Path]::GetFullPath($Out), ($result | ConvertTo-Json -Depth 4), (New-Object Text.UTF8Encoding($false)))
Write-Host ('완료: ' + $items.Count + '개 파일 → ' + [IO.Path]::GetFullPath($Out))
