# 사용자 이미지 작업물만 모아 이미지 교체 팩(ZIP)과 비교 카탈로그 2종을 만든다.
# - 구성: newimgpack\pic\** + UIpatch\pic\SNKmod\**(trash와 trash 중복 제외, SNKmod 단계를 빼고 원본 폴더 위치로)
# - ZIP 구조: game\content\pic\... + game\<카탈로그>.html + README.txt (게임 폴더에 풀어 덮어쓰기)
# - ZIP 안 카탈로그: 이 팩 이미지는 경로로 읽고, 설치하면 대체되는 원본 2.3·올걸팩 그림만 썸네일로 넣는다.
# - 웹 게시용 카탈로그: 모든 그림을 썸네일로 넣은 단일 HTML.
param(
    [Parameter(Mandatory = $true)][int]$Version,
    [string]$Root = '',
    [string]$OriginalPic = 'G:\somi\JO9O\game\content\pic',
    [string]$PrevRef = 'origin/newimgadd',
    [int]$ThumbWidth = 320,
    [int]$Quality = 72
)
$ErrorActionPreference = 'Stop'
if (-not $Root) { $Root = Split-Path -Parent $PSScriptRoot }
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$aiPic = Join-Path $Root 'ai_girl_pack\game\content\pic'
$outRoot = Join-Path $Root 'imagepack'
$outDir = Join-Path $outRoot "v$Version"
$zipPath = Join-Path $outRoot "JO9_NewImg_Pack_v$Version.zip"
$webPath = Join-Path $outRoot "JO9_NewImg_Compare_v$Version.html"
$catName = "JO9_NewImg_Pack_v${Version}_catalog.html"
if (Test-Path -LiteralPath $outDir) { throw "이미 있습니다(지우거나 다른 버전 번호를 쓰세요): $outDir" }

# ---- 1. 구성품 모으기 ----
$items = New-Object System.Collections.ArrayList
$seen = @{}
function Add-Item($rel, $src, $from) {
    $k = $rel.ToLower()
    if ($seen.ContainsKey($k)) { throw "경로 중복: $rel ($from / $($seen[$k]))" }
    $seen[$k] = $from
    [void]$items.Add([pscustomobject]@{ Rel = $rel; Src = $src; From = $from })
}
$np = Join-Path $Root 'newimgpack\pic'
foreach ($f in Get-ChildItem -LiteralPath $np -Recurse -File) { Add-Item $f.FullName.Substring($np.Length + 1) $f.FullName '뉴이미지' }
$snk = Join-Path $Root 'UIpatch\pic\SNKmod'
$trash = Join-Path $snk 'trash'
$skipped = 0
foreach ($f in Get-ChildItem -LiteralPath $snk -Recurse -File) {
    $rel = $f.FullName.Substring($snk.Length + 1)
    if ($rel.StartsWith('trash\') -or $f.Extension -eq '.txt') { $skipped++; continue }
    $t = Join-Path $trash $rel
    if ((Test-Path -LiteralPath $t) -and (Get-FileHash -LiteralPath $t).Hash -eq (Get-FileHash -LiteralPath $f.FullName).Hash) { $skipped++; continue }
    Add-Item $rel $f.FullName 'UI·장면'
}

# 직전 판 목록(이번 판 추가 표시용)
$prev = @{}
try { git -C (Join-Path (Split-Path $Root) 'JO9sa') ls-tree -r --name-only $PrevRef staging/pic 2>$null | ForEach-Object { $prev[$_.Substring(12).Replace('/', '\').ToLower()] = 1 } } catch {}

# ---- 2. 폴더 구성 ----
foreach ($x in $items) {
    $dst = Join-Path $outDir "game\content\pic\$($x.Rel)"
    New-Item -ItemType Directory -Force (Split-Path $dst) | Out-Null
    Copy-Item -LiteralPath $x.Src -Destination $dst
    if ((Get-FileHash -LiteralPath $dst).Hash -ne (Get-FileHash -LiteralPath $x.Src).Hash) { throw "복사 검증 실패: $dst" }
}

# ---- 3. 썸네일 ----
function Get-Thumb($path) {
    $img = [Drawing.Image]::FromFile($path)
    try {
        $w = $img.Width; $h = $img.Height
        $len = (Get-Item -LiteralPath $path).Length
        if ($w -le $ThumbWidth -and $len -le 24KB) {
            return @{ Uri = 'data:image/png;base64,' + [Convert]::ToBase64String([IO.File]::ReadAllBytes($path)); W = $w; H = $h }
        }
        $tw = [Math]::Min($ThumbWidth, $w); $th = [int][Math]::Round($h * $tw / $w)
        $bmp = New-Object Drawing.Bitmap $tw, $th
        $g = [Drawing.Graphics]::FromImage($bmp)
        $g.Clear([Drawing.Color]::FromArgb(42, 42, 42))
        $g.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.DrawImage($img, 0, 0, $tw, $th); $g.Dispose()
        $enc = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
        $ps = New-Object Drawing.Imaging.EncoderParameters 1
        $ps.Param[0] = New-Object Drawing.Imaging.EncoderParameter ([Drawing.Imaging.Encoder]::Quality), ([long]$Quality)
        $ms = New-Object IO.MemoryStream
        $bmp.Save($ms, $enc, $ps); $bmp.Dispose()
        return @{ Uri = 'data:image/jpeg;base64,' + [Convert]::ToBase64String($ms.ToArray()); W = $w; H = $h }
    } finally { $img.Dispose() }
}
function Size-Text($n) { if ($n -ge 1MB) { '{0:N2} MB' -f ($n / 1MB) } else { '{0:N0} KB' -f ($n / 1KB) } }
function Enc($s) { [Net.WebUtility]::HtmlEncode($s) }
function Rel-Url($rel) { (($rel -split '\\') | ForEach-Object { [Uri]::EscapeDataString($_) }) -join '/' }

# 카탈로그에서만 빼는 것(팩에는 들어감): 아이콘·포트레이트, 그리고 원본 자리 대체본과 같은 그림인 새 이름 파일(QSP가 있어야 보이는 시퀀스 등).
function Get-HideReason($rel) {
    $r = $rel.ToLower()
    foreach ($p in 'buttons\', 'ui\', 'ui overhaul\', 'girls\face\', 'master\') { if ($r.StartsWith($p)) { return '아이콘·포트레이트' } }
    if ($r -match '_ava(_\d+)?\.png$') { return '아이콘·포트레이트' }
    return $null
}
$byHash = @{}
foreach ($x in $items) { $x | Add-Member -NotePropertyName Hash -NotePropertyValue (Get-FileHash -LiteralPath $x.Src).Hash; if (-not $byHash[$x.Hash]) { $byHash[$x.Hash] = @() }; $byHash[$x.Hash] += $x }
$hidden = @{}
foreach ($x in $items) {
    $why = Get-HideReason $x.Rel
    if (-not $why -and -not (Test-Path -LiteralPath (Join-Path $OriginalPic $x.Rel))) {
        $twin = @($byHash[$x.Hash] | Where-Object { $_.Rel -ne $x.Rel -and (Test-Path -LiteralPath (Join-Path $OriginalPic $_.Rel)) })
        if ($twin.Count) { $why = "중복($($twin[0].Rel -replace '\\','/')와 같은 그림)" }
        elseif (-not (Test-Path -LiteralPath (Join-Path $aiPic $x.Rel))) { $why = '2.4 전용(QSP 필요, 이미지팩에서는 효과 없음)' }
    }
    if ($why) { $hidden[$x.Rel] = $why }
}
$rows = foreach ($x in ($items | Where-Object { -not $hidden.ContainsKey($_.Rel) } | Sort-Object { $_.Rel.ToLower() })) {
    $op = Join-Path $OriginalPic $x.Rel; $ap = Join-Path $aiPic $x.Rel
    $o = if (Test-Path -LiteralPath $op) { $t = Get-Thumb $op; $t.Len = (Get-Item -LiteralPath $op).Length; $t } else { $null }
    $ai = if (Test-Path -LiteralPath $ap) { $t = Get-Thumb $ap; $t.Len = (Get-Item -LiteralPath $ap).Length; $t } else { $null }
    $n = Get-Thumb $x.Src; $n.Len = (Get-Item -LiteralPath $x.Src).Length
    [pscustomobject]@{ Rel = $x.Rel; From = $x.From; Orig = $o; Ai = $ai; New = $n; IsNew = -not $prev.ContainsKey($x.Rel.ToLower()) }
}

# ---- 4. HTML ----
function Build-Html([bool]$web) {
    $groups = $rows | Group-Object { $i = $_.Rel.LastIndexOf('\'); if ($i -lt 0) { '(pic)' } else { $_.Rel.Substring(0, $i) } } | Sort-Object Name
    $nRep = @($rows | Where-Object { $_.Orig -or $_.Ai }).Count
    $nAi = @($rows | Where-Object { $_.Ai }).Count
    $nAdd = @($rows | Where-Object { $_.IsNew }).Count
    $nav = ($groups | ForEach-Object { "<a href='#g$([Array]::IndexOf(@($groups), $_))'>$(Enc ($_.Name -replace '\\', '/')) <span>$($_.Count)</span></a>" }) -join ''
    $secs = for ($gi = 0; $gi -lt @($groups).Count; $gi++) {
        $grp = @($groups)[$gi]
        $cards = foreach ($r in $grp.Group) {
            function Fig($label, $cls, $t, $src) {
                if (-not $t) { return "<figure class='none'><div class='ph'>$label 없음</div><figcaption><b>$label</b> —</figcaption></figure>" }
                "<figure><img loading='lazy' alt='$label' src='$src'><figcaption><b class='$cls'>$label</b> $($t.W)×$($t.H) · $(Size-Text $t.Len)</figcaption></figure>"
            }
            $newSrc = if ($web) { $r.New.Uri } else { 'content/pic/' + (Rel-Url $r.Rel) }
            $kind = if ($r.Orig -or $r.Ai) { "<span class='tag rep'>교체</span>" } else { "<span class='tag add' title='원본에도 올걸팩에도 없는 새 파일. 지금 게임에서는 쓰이지 않고 2.4·UI 패치에서 쓰임'>새 파일</span>" }
            $badge = if ($r.IsNew) { "<span class='tag v'>v$Version 추가</span>" } else { '' }
            $aiTag = if ($r.Ai) { "<span class='tag ai' title='올걸팩을 깐 경우 올걸팩 그림이 이 그림으로 바뀜'>올걸팩 대체</span>" } else { '' }
            "<article class='card' data-new='$([int]$r.IsNew)'><header><code>game/content/pic/$(Enc ($r.Rel -replace '\\', '/'))</code> $kind$aiTag$badge</header><div class='pair'>" +
            (Fig '원본 2.3' 'o' $r.Orig $r.Orig.Uri) + (Fig '올걸팩' 'a' $r.Ai $r.Ai.Uri) + (Fig '이 팩' 'n' $r.New $newSrc) + '</div></article>'
        }
        "<section id='g$gi'><h2>$(Enc ($grp.Name -replace '\\', '/'))<small>$($grp.Count)개</small></h2><div class='grid'>$($cards -join "`n")</div></section>"
    }
    $how = if ($web) { '미리보기용으로 그림은 가로 ' + $ThumbWidth + 'px 이하 JPEG로 줄였습니다. 팩에 들어가는 실제 파일은 원본 해상도 PNG입니다.' }
           else { "'이 팩' 그림은 설치된 파일(<code>content/pic/…</code>)을 바로 읽습니다. '원본 2.3'·'올걸팩'은 설치하면 덮어써져 사라지므로 썸네일로 넣어 두었습니다." }
    @"
<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>JO9 이미지 교체 팩 v$Version</title>
<style>
:root{--bg:#f6f5f2;--card:#fff;--ink:#1d1d1b;--muted:#6b6a66;--line:#e2e0da;--o:#6b6a66;--a:#a0522d;--n:#2f6fdf;--img:#2a2a2a}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#161615;--card:#1f1f1e;--ink:#ecebe7;--muted:#a09e98;--line:#34332f;--o:#a09e98;--a:#e0956a;--n:#7aa7ff;--img:#0e0e0e}}
:root[data-theme="dark"]{--bg:#161615;--card:#1f1f1e;--ink:#ecebe7;--muted:#a09e98;--line:#34332f;--o:#a09e98;--a:#e0956a;--n:#7aa7ff;--img:#0e0e0e}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,"Segoe UI","Malgun Gothic",sans-serif}
.wrap{max-width:1280px;margin:0 auto;padding:24px 16px 64px}h1{font-size:22px;margin:0 0 4px}.lead{color:var(--muted);margin:0 0 14px}
.meta{display:flex;flex-wrap:wrap;gap:8px 20px;padding:12px 16px;background:var(--card);border:1px solid var(--line);border-radius:10px;margin-bottom:12px;font-size:14px}
nav{position:sticky;top:0;z-index:5;display:flex;flex-wrap:wrap;gap:6px;padding:10px 0;background:var(--bg)}
nav a,.tg{color:var(--ink);text-decoration:none;padding:4px 10px;border:1px solid var(--line);border-radius:999px;background:var(--card);font-size:13px;cursor:pointer}nav a span{color:var(--muted);margin-left:3px}
h2{font-size:18px;margin:26px 0 10px}h2 small{color:var(--muted);font-weight:400;margin-left:8px;font-size:14px}
.grid{display:grid;gap:12px}.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px}
.card header{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px}.card code{font-size:13px;word-break:break-all;margin-right:4px}
.tag{font-size:11px;font-weight:700;padding:1px 7px;border-radius:4px;color:#fff;background:#888}.rep{background:#c0612b}.add{background:#2b8a4a}.ai{background:#a0522d}.v{background:#2f6fdf}
.pair{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}@media (max-width:700px){.pair{grid-template-columns:1fr}}
figure{margin:0}figure img{width:100%;display:block;border-radius:6px;background:var(--img);cursor:zoom-in}
figcaption{font-size:12px;color:var(--muted);margin-top:4px}figcaption b.o{color:var(--o)}figcaption b.a{color:var(--a)}figcaption b.n{color:var(--n)}
.ph{aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;border:1px dashed var(--line);border-radius:6px;color:var(--muted);font-size:13px}
#lb{position:fixed;inset:0;background:rgba(0,0,0,.85);display:none;align-items:center;justify-content:center;flex-direction:column;z-index:20}#lb.on{display:flex}#lb img{max-width:95vw;max-height:88vh}#lb p{color:#ddd;font-size:13px}
body.onlynew .card[data-new="0"]{display:none}
</style></head><body><div class="wrap">
<h1>JO9 이미지 교체 팩 · v$Version</h1>
<p class="lead">사용자가 제작한 이미지만 담은 팩입니다(올걸팩·원본 이미지는 들어 있지 않음). 카드마다 <b>원본 2.3</b> · <b>올걸팩</b>(해당 경로가 있을 때) · <b>이 팩</b> 그림을 나란히 보여 줍니다. 설치하면 왼쪽 두 그림이 오른쪽 그림으로 바뀝니다.</p>
<div class="meta"><span>팩 전체 <b>$($items.Count)</b>개 중 목록 <b>$(@($rows).Count)</b>개 (아이콘·포트레이트 $(@($hidden.Values | Where-Object { $_ -like '아이콘*' }).Count)개, 중복 $(@($hidden.Values | Where-Object { $_ -like '중복*' }).Count)개, 2.4 전용 $(@($hidden.Values | Where-Object { $_ -like '2.4*' }).Count)개는 생략)</span><span>원본·올걸팩 교체 <b>$nRep</b>개 (그중 올걸팩 대체 <b>$nAi</b>개)</span><span>새 파일 <b>$(@($rows).Count - $nRep)</b>개</span><span>v$Version 추가 <b>$nAdd</b>개</span><span>설치: ZIP의 <code>game</code> 폴더를 게임 폴더(Jack-o-nine-tails.exe 있는 곳)에 풀어 덮어쓰기</span><span>QSP·실행 파일 변경 없음</span></div>
<p class="lead" style="font-size:13px">$how '새 파일'은 원본에도 올걸팩에도 없는 이름이라 지금 게임에서는 쓰이지 않고, 2.4·UI 패치에서 쓰입니다. 그림을 누르면 크게 봅니다.</p>
<nav><span class="tg" onclick="document.body.classList.toggle('onlynew')">v$Version 추가만 보기 / 전체</span>$nav</nav>
$($secs -join "`n")
</div>
<div id="lb"><img alt=""><p></p></div>
<script>
var lb=document.getElementById('lb'),li=lb.getElementsByTagName('img')[0],lp=lb.getElementsByTagName('p')[0];
document.addEventListener('click',function(e){var t=e.target;if(t.tagName=='IMG'&&t.parentNode.tagName=='FIGURE'){li.src=t.src;lp.textContent=t.alt+' · '+t.closest('.card').querySelector('code').textContent+' — 누르거나 Esc: 닫기';lb.className='on';}else if(lb.className=='on'&&(t===lb||t===li||t===lp))lb.className='';});
document.addEventListener('keydown',function(e){if(e.key=='Escape')lb.className='';});
</script></body></html>
"@
}

$utf8 = New-Object Text.UTF8Encoding $true
[IO.File]::WriteAllText((Join-Path $outDir "game\$catName"), (Build-Html $false), $utf8)
[IO.File]::WriteAllText($webPath, (Build-Html $true), $utf8)
$readme = @"
JO9 이미지 교체 팩 v$Version

[설치] 이 ZIP의 game 폴더를 게임 폴더(Jack-o-nine-tails.exe가 있는 곳)에 그대로 풀어 덮어쓰세요.
       원본 그림을 덮어쓰므로 필요하면 설치 전에 game\content\pic 을 백업하세요.
[내용] 제작자가 새로 그린 이미지 $($items.Count)개. QSP·실행 파일·세이브는 바꾸지 않습니다.
       '새 파일'(원본에 없는 이름)은 지금 게임에서는 쓰이지 않고 2.4·UI 패치에서 쓰입니다.
[비교] 설치 후 game\$catName 을 브라우저로 열면 원본·올걸팩·이 팩 그림을 비교해 볼 수 있습니다.
"@
[IO.File]::WriteAllText((Join-Path $outDir 'README.txt'), $readme, $utf8)

# ---- 5. ZIP ----
if (Test-Path -LiteralPath $zipPath) { throw "ZIP이 이미 있습니다: $zipPath" }
# 경로 구분자는 '/'로 넣는다(.NET Framework의 CreateFromDirectory는 '\'를 써서 다른 압축 프로그램에서 폴더가 깨질 수 있음).
$zs = [IO.File]::Open($zipPath, [IO.FileMode]::CreateNew)
$za = New-Object IO.Compression.ZipArchive($zs, [IO.Compression.ZipArchiveMode]::Create, $false, [Text.Encoding]::UTF8)
try {
    foreach ($f in Get-ChildItem -LiteralPath $outDir -Recurse -File) {
        $name = $f.FullName.Substring($outDir.Length + 1).Replace('\', '/')
        [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($za, $f.FullName, $name, [IO.Compression.CompressionLevel]::Optimal)
    }
} finally { $za.Dispose(); $zs.Dispose() }

"구성 $($items.Count)개, 목록 $(@($rows).Count)개, 생략 $($hidden.Count)개 (뉴이미지 $(@($items | Where-Object From -eq '뉴이미지').Count), UI·장면 $(@($items | Where-Object From -eq 'UI·장면').Count), trash 등 제외 $skipped)"
"교체 $(@($rows | Where-Object { $_.Orig -or $_.Ai }).Count) (올걸팩 대체 $(@($rows | Where-Object { $_.Ai }).Count)), 새 파일 $(@($rows | Where-Object { -not $_.Orig -and -not $_.Ai }).Count), v$Version 추가 $(@($rows | Where-Object IsNew).Count)"
"ZIP  {0}  {1:N1} MB" -f $zipPath, ((Get-Item $zipPath).Length / 1MB)
"ZIP 안 카탈로그 {0:N1} MB, 웹 카탈로그 {1:N1} MB" -f ((Get-Item (Join-Path $outDir "game\$catName")).Length / 1MB), ((Get-Item $webPath).Length / 1MB)
