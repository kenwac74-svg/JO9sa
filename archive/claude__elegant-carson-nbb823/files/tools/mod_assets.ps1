# mods가 쓰는 게임 폴더 파일(이미지 등)을 zip으로 묶거나(-Pack) 다른 PC 게임 폴더에 설치·점검(-Install/-Check)하는 스크립트
param(
    # 이 PC 게임 폴더에서 파일을 모아 zip과 manifest를 만든다.
    [switch]$Pack,
    # zip의 파일을 게임 폴더에 설치한다. 내용이 다른 기존 파일은 날짜 붙여 백업한 뒤 덮어쓴다.
    [switch]$Install,
    # 게임 폴더에 필요한 파일이 manifest와 같은지 확인만 한다.
    [switch]$Check,
    # -Pack 출력 또는 -Install 입력 zip. 비우면 dist\JO9_mod_assets.zip
    [string]$Zip = '',
    # 게임 폴더. 비우면 local.config.json의 GameRoot
    [string]$GameRoot = ''
)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $repo 'mods_assets\manifest.json'
$extraPath = Join-Path $repo 'mods_assets\extra.txt'
if ([string]::IsNullOrWhiteSpace($Zip)) { $Zip = Join-Path $repo 'dist\JO9_mod_assets.zip' }
if (@($Pack, $Install, $Check | Where-Object { $_ }).Count -ne 1) { throw '-Pack, -Install, -Check 중 하나만 지정하세요.' }

if ([string]::IsNullOrWhiteSpace($GameRoot)) {
    $configPath = Join-Path $repo 'local.config.json'
    if (-not (Test-Path -LiteralPath $configPath)) { throw "게임 폴더를 -GameRoot로 주거나 먼저 tools\setup_pc.ps1을 실행하세요: $configPath" }
    $GameRoot = (Get-Content -LiteralPath $configPath -Raw -Encoding UTF8 | ConvertFrom-Json).GameRoot
}
$gameDir = Join-Path $GameRoot 'game'
if (-not (Test-Path -LiteralPath (Join-Path $gameDir 'jack.qsp'))) { throw "게임 폴더가 아닙니다(game\jack.qsp 없음): $GameRoot" }

function Get-Sha256([string]$path) { (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash }

if ($Pack) {
    # mods의 new 문자열에 나오는 SNKmod 경로(content\pic 기준)와 extra.txt의 경로(game 기준)를 모은다.
    # 뒤 mod가 바꿔 더는 쓰지 않는 경로는 빼도록, 현재 게임 qsp에 실제로 남아 있는 경로만 고른다.
    $qspText = [Text.Encoding]::Unicode.GetString([IO.File]::ReadAllBytes((Join-Path $gameDir 'jack.qsp')))
    $chars = $qspText.ToCharArray()
    for ($i = 0; $i -lt $chars.Length; $i++) { $chars[$i] = [char](([int]$chars[$i] + 5) -band 0xFFFF) }
    $qspText = New-Object string (,$chars)
    $paths = New-Object System.Collections.Generic.List[string]
    foreach ($f in Get-ChildItem -LiteralPath (Join-Path $repo 'mods') -Filter '*.json') {
        $mod = Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
        foreach ($e in $mod.edits) {
            foreach ($m in [regex]::Matches($e.new, "SNKmod\\[^'`"]+")) {
                if (-not $qspText.Contains("'" + $m.Value + "'")) { continue }
                $rel = 'content\pic\' + $m.Value
                # 확장자 없는 경로($special_bg 등)는 엔진이 붙이는 png를 찾는다.
                if (-not [IO.Path]::GetExtension($rel)) { $rel += '.png' }
                if (-not $paths.Contains($rel)) { $paths.Add($rel) }
            }
        }
    }
    if (Test-Path -LiteralPath $extraPath) {
        foreach ($line in Get-Content -LiteralPath $extraPath -Encoding UTF8) {
            $rel = $line.Trim()
            if ($rel -and -not $rel.StartsWith('#') -and -not $paths.Contains($rel)) { $paths.Add($rel) }
        }
    }
    $missing = @($paths | Where-Object { -not (Test-Path -LiteralPath (Join-Path $gameDir $_) -PathType Leaf) })
    if ($missing.Count) { throw "게임 폴더에 없는 파일이 있어 묶지 않았습니다:`n  " + ($missing -join "`n  ") }

    $items = @(foreach ($rel in ($paths | Sort-Object)) {
        $full = Join-Path $gameDir $rel
        [ordered]@{ path = $rel; size = (Get-Item -LiteralPath $full).Length; sha256 = Get-Sha256 $full }
    })
    New-Item -ItemType Directory -Force (Split-Path -Parent $manifestPath) | Out-Null
    [ordered]@{ note = '경로는 <게임폴더>\game 기준. tools\mod_assets.ps1 -Pack이 만든다.'; files = $items } |
        ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $manifestPath -Encoding UTF8

    New-Item -ItemType Directory -Force (Split-Path -Parent $Zip) | Out-Null
    $stage = Join-Path ([IO.Path]::GetTempPath()) ('jo9_assets_' + [guid]::NewGuid().ToString('N'))
    try {
        foreach ($it in $items) {
            $dst = Join-Path $stage $it.path
            New-Item -ItemType Directory -Force (Split-Path -Parent $dst) | Out-Null
            Copy-Item -LiteralPath (Join-Path $gameDir $it.path) -Destination $dst
        }
        Copy-Item -LiteralPath $manifestPath -Destination (Join-Path $stage 'manifest.json')
        if (Test-Path -LiteralPath $Zip) { Remove-Item -LiteralPath $Zip }
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [IO.Compression.ZipFile]::CreateFromDirectory($stage, $Zip)
    } finally {
        if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
    }
    Write-Host "파일 $($items.Count)개를 묶었습니다: $Zip ($([math]::Round((Get-Item -LiteralPath $Zip).Length / 1MB, 1)) MB)"
    Write-Host "manifest 갱신: $manifestPath (git에 커밋한다. zip은 git에 넣지 말고 직접 옮긴다)"
    exit 0
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$src = $null
if ($Install) {
    if (-not (Test-Path -LiteralPath $Zip)) { throw "zip이 없습니다: $Zip  (옛 PC에서 tools\mod_assets.ps1 -Pack으로 만든 파일을 옮겨 오세요)" }
    $src = Join-Path ([IO.Path]::GetTempPath()) ('jo9_assets_' + [guid]::NewGuid().ToString('N'))
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [IO.Compression.ZipFile]::ExtractToDirectory($Zip, $src)
}
try {
    $stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $bad = 0
    foreach ($it in $manifest.files) {
        $dst = Join-Path $gameDir $it.path
        $ok = (Test-Path -LiteralPath $dst -PathType Leaf) -and (Get-Sha256 $dst) -eq $it.sha256
        if ($ok) { Write-Host "[같음] $($it.path)"; continue }
        if ($Check) { Write-Host "[다름/없음] $($it.path)"; $bad++; continue }
        $from = Join-Path $src $it.path
        if (-not (Test-Path -LiteralPath $from) -or (Get-Sha256 $from) -ne $it.sha256) { throw "zip의 파일이 manifest와 다릅니다: $($it.path). 옛 PC에서 -Pack을 다시 하세요." }
        if (Test-Path -LiteralPath $dst) {
            Copy-Item -LiteralPath $dst -Destination "$dst.bak_$stamp"
            Write-Host "[백업] $($it.path).bak_$stamp"
        }
        New-Item -ItemType Directory -Force (Split-Path -Parent $dst) | Out-Null
        Copy-Item -LiteralPath $from -Destination $dst -Force
        Write-Host "[설치] $($it.path)"
    }
    if ($Check -and $bad) { Write-Host "맞지 않는 파일 $bad 개. tools\mod_assets.ps1 -Install로 설치하세요."; exit 1 }
    Write-Host '완료: 필요한 파일이 모두 manifest와 같습니다.'
} finally {
    if ($src -and (Test-Path -LiteralPath $src)) { Remove-Item -LiteralPath $src -Recurse -Force }
}
