# 새 장면 리소스와 올걸팩(플레이 폴더)이 같은 이름·다른 내용으로 겹치는 장면 그림 중,
# 계열(행위_머리색_길이_나이)마다 대표 1개를 골라 행위별로 고르게 N개를 뽑아 비교 카탈로그(단일 HTML)를 만든다.
# 'loli' 표기 계열은 넣지 않는다.
param(
    [string]$NewDir = 'K:\doing\JONT2.3kor_scene\game\content\pic\girls\sex_scenes',
    [string]$PlayDir = 'G:\somi\JO9\game\content\pic\girls\sex_scenes',
    [string]$AiDir = 'G:\somi\IMGMG\ai_girl_pack\game\content\pic\girls\sex_scenes',
    [string]$Out = 'G:\somi\IMGMG\scene_compare_sample100.html',
    [int]$Count = 100,
    [int]$ThumbWidth = 320,
    [int]$Quality = 72
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$ai = @{}; Get-ChildItem -LiteralPath $AiDir -File | ForEach-Object { $ai[$_.Name.ToLower()] = 1 }
$over = foreach ($f in Get-ChildItem -LiteralPath $NewDir -File) {
    $p = Join-Path $PlayDir $f.Name
    if (-not $ai.ContainsKey($f.Name.ToLower()) -or -not (Test-Path -LiteralPath $p)) { continue }
    if ((Get-Item -LiteralPath $p).Length -eq $f.Length) { continue }
    $base = [IO.Path]::GetFileNameWithoutExtension($f.Name)
    $num = 0; $series = $base
    if ($base -match '^(.*)_(\d+)$') { $series = $Matches[1]; $num = [int]$Matches[2] }
    if ($series -match '(^|[_~])loli([_~]|$)') { continue }
    [pscustomobject]@{ Name = $f.Name; New = $f.FullName; Play = $p; Series = $series; Num = $num; Act = ($series -split '_')[0] }
}
$reps = $over | Group-Object Series | ForEach-Object { $_.Group | Sort-Object Num | Select-Object -First 1 }
"겹침(loli 제외) {0}개, 계열 {1}개" -f @($over).Count, @($reps).Count

# 행위별 라운드로빈으로 고르게 뽑기(재현 가능하도록 이름순)
$byAct = $reps | Group-Object Act | Sort-Object Name
$queues = @{}; foreach ($g in $byAct) { $queues[$g.Name] = New-Object System.Collections.Queue (, @($g.Group | Sort-Object Series)) }
$pick = New-Object System.Collections.ArrayList
while ($pick.Count -lt $Count -and ($queues.Values | Where-Object { $_.Count -gt 0 })) {
    foreach ($g in $byAct) { if ($pick.Count -ge $Count) { break }; $q = $queues[$g.Name]; if ($q.Count) { [void]$pick.Add($q.Dequeue()) } }
}

function Get-Thumb($path) {
    $img = [Drawing.Image]::FromFile($path)
    try {
        $w = $img.Width; $h = $img.Height
        $tw = [Math]::Min($ThumbWidth, $w); $th = [int][Math]::Round($h * $tw / $w)
        $bmp = New-Object Drawing.Bitmap $tw, $th
        $g = [Drawing.Graphics]::FromImage($bmp); $g.Clear([Drawing.Color]::FromArgb(42, 42, 42))
        $g.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.DrawImage($img, 0, 0, $tw, $th); $g.Dispose()
        $enc = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
        $ps = New-Object Drawing.Imaging.EncoderParameters 1
        $ps.Param[0] = New-Object Drawing.Imaging.EncoderParameter ([Drawing.Imaging.Encoder]::Quality), ([long]$Quality)
        $ms = New-Object IO.MemoryStream; $bmp.Save($ms, $enc, $ps); $bmp.Dispose()
        @{ Uri = 'data:image/jpeg;base64,' + [Convert]::ToBase64String($ms.ToArray()); W = $w; H = $h }
    } finally { $img.Dispose() }
}
function Size-Text($n) { if ($n -ge 1MB) { '{0:N1} MB' -f ($n / 1MB) } else { '{0:N0} KB' -f ($n / 1KB) } }
function Enc($s) { [Net.WebUtility]::HtmlEncode($s) }

$cards = foreach ($x in ($pick | Sort-Object Act, Series)) {
    $a = Get-Thumb $x.Play; $n = Get-Thumb $x.New
    $al = (Get-Item -LiteralPath $x.Play).Length; $nl = (Get-Item -LiteralPath $x.New).Length
    "<article class='card'><header><code>$(Enc $x.Name)</code><span class='s'>계열 $(Enc $x.Series)</span></header><div class='pair'>" +
    "<figure><img loading='lazy' alt='올걸팩' src='$($a.Uri)'><figcaption><b class='a'>올걸팩 (현재 플레이)</b> $($a.W)×$($a.H) · $(Size-Text $al)</figcaption></figure>" +
    "<figure><img loading='lazy' alt='새 장면 리소스' src='$($n.Uri)'><figcaption><b class='n'>새 장면 리소스</b> $($n.W)×$($n.H) · $(Size-Text $nl)</figcaption></figure></div></article>"
}
$acts = ($pick | Group-Object Act | Sort-Object Name | ForEach-Object { "$($_.Name) $($_.Count)" }) -join ' · '
$html = @"
<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>장면 리소스 샘플 비교</title>
<style>
:root{--bg:#f6f5f2;--card:#fff;--ink:#1d1d1b;--muted:#6b6a66;--line:#e2e0da;--a:#a0522d;--n:#2f6fdf;--img:#2a2a2a}
@media (prefers-color-scheme:dark){:root{--bg:#161615;--card:#1f1f1e;--ink:#ecebe7;--muted:#a09e98;--line:#34332f;--a:#e0956a;--n:#7aa7ff;--img:#0e0e0e}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,"Malgun Gothic",sans-serif}
.wrap{max-width:1100px;margin:0 auto;padding:24px 16px 64px}h1{font-size:21px;margin:0 0 6px}.lead{color:var(--muted);margin:0 0 12px}
.grid{display:grid;gap:12px}.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px}
.card header{display:flex;flex-wrap:wrap;gap:8px;align-items:baseline;margin-bottom:8px}.card code{font-size:13px}.s{font-size:12px;color:var(--muted)}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media (max-width:640px){.pair{grid-template-columns:1fr}}
figure{margin:0}figure img{width:100%;display:block;border-radius:6px;background:var(--img)}
figcaption{font-size:12px;color:var(--muted);margin-top:4px}b.a{color:var(--a)}b.n{color:var(--n)}
</style></head><body><div class="wrap">
<h1>새 장면 리소스 × 올걸팩 — 샘플 $($pick.Count)개</h1>
<p class="lead">``K:\doing\JONT2.3kor_scene``을 설치하면 덮어써지는 올걸팩 장면 그림(같은 이름·다른 내용) 중, 계열(행위_머리색_길이_나이)마다 대표 1개(가장 낮은 번호)를 골라 행위별로 고르게 뽑았습니다. 'loli' 표기 계열은 넣지 않았습니다. 썸네일은 가로 ${ThumbWidth}px JPEG입니다.</p>
<p class="lead" style="font-size:13px">행위별: $acts</p>
<div class="grid">
$($cards -join "`n")
</div></div></body></html>
"@
[IO.File]::WriteAllText($Out, $html, (New-Object Text.UTF8Encoding $true))
"샘플 {0}개 → {1} ({2:N1} MB)" -f $pick.Count, $Out, ((Get-Item $Out).Length / 1MB)
