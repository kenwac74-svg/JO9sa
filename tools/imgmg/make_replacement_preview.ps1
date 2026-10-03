# 원본 경로 대체 이미지(original_map.json)를 원본 그림과 나란히 보여 주는 설명 페이지를 만든다.
param([string]$Root = (Split-Path -Parent $PSScriptRoot), [string]$Original = 'G:\somi\JO9O\game\content\pic')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
function To-Url($p) { 'file:///' + ((($p -replace '\\', '/') -split '/' | ForEach-Object { [Uri]::EscapeDataString($_) -replace '%3A', ':' }) -join '/') }
function Get-Dim($p) { $i = [Drawing.Image]::FromFile($p); $s = "$($i.Width)x$($i.Height)"; $i.Dispose(); $s }

# 원본 qsp에서 각 파일을 부르는 곳(사용자에게 보여 줄 설명)
$where = @{
    'whore_redlight-112.png' = @('펠라 담당 (남 주인공, 22701) 두 번째 장면', '2.4: 이 분기는 r/s 시퀀스를 직접 부름 → 원본 112는 더 이상 안 쓰임')
    'whore_redlight-113.png' = @('펠라 담당 (남 주인공, 22701) 세 번째 장면', '2.4: 원본 113은 더 이상 안 쓰임')
    'whore_redlight-121.png' = @('길거리 창녀 (남 주인공, 22702) 첫 화면 배경 + 두 번째 장면 / <b>여자 주인공 길거리 분기(227012) 배경</b>', '2.4: 남 주인공 쪽은 t/u 시퀀스를 직접 부름. <b>여자 주인공 분기는 2.4에서도 원본 121을 계속 씀</b> → 대체하면 그 장면까지 바뀜')
    'whore_redlight-122.png' = @('길거리 창녀 (남 주인공, 22702) 세 번째 장면', '2.4: 원본 122는 더 이상 안 쓰임')
    'whore_redlight-212.png' = @('개인 영업녀 (남 주인공, 22703) 두 번째 장면', '2.4: 이 분기는 p 시퀀스를 직접 부름 → 원본 212는 더 이상 안 쓰임')
    'whore_redlight-213.png' = @('개인 영업녀 (남 주인공, 22703) 세 번째 장면', '2.4: 원본 213은 더 이상 안 쓰임')
}
$map = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'original_map.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$rows = foreach ($p in $map.PSObject.Properties) {
    $o = Join-Path $Original $p.Name
    $r = Join-Path $Root "merge_work\game\content\pic\$($p.Name)"
    $leaf = Split-Path $p.Name -Leaf
    $w = $where[$leaf]
    "<section><h2>$leaf</h2><p class='use'>원본 qsp가 부르는 곳: $($w[0])</p><p class='note'>$($w[1])</p><div class='pair'>" +
    "<figure><figcaption>원본 2.3 (JO9O) · $(Get-Dim $o)</figcaption><a href='$(To-Url $o)' target='_blank'><img src='$(To-Url $o)'></a></figure>" +
    "<figure><figcaption>이미지 패치가 덮어쓰는 그림 = $(Split-Path $p.Value -Leaf) · $(Get-Dim $r)</figcaption><a href='$(To-Url $r)' target='_blank'><img src='$(To-Url $r)'></a></figure></div></section>"
}
$html = @"
<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>대체 이미지 설명</title>
<style>
:root{--bg:#f6f6f4;--card:#fff;--fg:#1d1d1b;--mute:#6b6b66;--warn:#b0451f}
@media (prefers-color-scheme:dark){:root{--bg:#18181a;--card:#222225;--fg:#ececea;--mute:#9a9a96;--warn:#f08a5d}}
body{margin:0;padding:16px;background:var(--bg);color:var(--fg);font:15px/1.6 "Malgun Gothic",system-ui,sans-serif;max-width:1100px}
h1{font-size:21px}h2{font-size:17px;margin:0 0 4px}section{background:var(--card);border-radius:10px;padding:14px;margin:14px 0}
.use{margin:0;color:var(--mute)}.note{margin:2px 0 10px;color:var(--warn)}
.pair{display:flex;gap:12px;flex-wrap:wrap}figure{margin:0;flex:1 1 320px}figcaption{font-size:13px;color:var(--mute);margin-bottom:4px}img{width:100%;border-radius:6px;display:block}
.box{background:var(--card);border-radius:10px;padding:12px 16px}
</style></head><body>
<h1>원본 경로 대체 이미지 6개</h1>
<div class="box">
<p><b>이게 뭔가:</b> 홍등가 새 장면 이미지(r/t/p 시퀀스)는 UI 패치의 QSP가 <code>SNKmod\...\whore_redlight-p002.png</code> 같은 <b>새 파일 이름</b>을 직접 부를 때만 보입니다.
이미지 패치만 깐 사람(원본 QSP 그대로)은 게임이 여전히 <b>원본 파일 이름</b>(<code>whore_redlight-212.png</code> 등)을 부르므로, 새 그림을 보여 주려면 <b>원본 파일 자리에 새 그림을 같은 이름으로 덮어쓰는</b> 수밖에 없습니다. 아래 6개가 그렇게 넣어 둔 "대체 이미지"입니다(왼쪽 원본이 오른쪽 그림으로 바뀜).</p>
<p><b>2.4에서는:</b> 2.4는 QSP가 새 파일을 직접 부르므로 이 덮어쓰기가 필요 없습니다. 남 주인공 분기의 원본 그림 5개(112·113·122·212·213)는 아무 데서도 안 쓰이게 되고, <b>121만 여자 주인공 길거리 분기에서 계속 쓰입니다</b>. 그래서 대체 이미지를 2.4에 넣으면 121은 여자 주인공 장면을 엉뚱하게 바꾸고, 나머지 5개는 쓰이지 않는 파일을 덮어쓸 뿐입니다.</p>
<p><b>각 장면 구조:</b> 원본은 [첫 화면 배경] → [두 번째 장면] → [세 번째 장면]. 새 시퀀스는 001 → 002 → 003. 원본의 첫 화면 배경(111·121·211)은 그 분기 첫 화면이라 001에 대응하지만, 121처럼 두 번째 장면과 파일을 같이 쓰거나 다른 분기와 겹치는 경우가 있어 001은 넣지 않았습니다.</p>
</div>
$($rows -join "`n")
</body></html>
"@
$out = Join-Path $Root 'replacement_preview.html'
[IO.File]::WriteAllText($out, $html, (New-Object Text.UTF8Encoding $true))
$out
