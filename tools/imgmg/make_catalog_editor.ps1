# JO9_Place_Workshop.html(이미지 교체기)을 체크리스트 카탈로그에 넣을 수 있는 단일 스크립트(catalog_editor.js)로 묶는다.
# - CSS는 #wsdialog 아래로 범위를 좁히고, 화면은 <dialog id="wsdialog">로 주입한다.
# - 교체기 코드는 하나의 함수 범위에 넣어 카탈로그의 전역 이름(S, render, esc 등)과 겹치지 않게 한다.
# - 카탈로그는 window.JO9WS.open([대상])으로 교체기를 열고, 교체가 끝나면 'jo9ws-applied' 이벤트를 받는다.
param(
    [string]$Workshop = 'G:\somi\JO9\game\modtools\place\JO9_Place_Workshop.html',
    [string]$Out = (Join-Path (Split-Path -Parent $PSScriptRoot) 'catalog_editor.js'),
    [string]$PlayUrl = 'file:///G:/somi/JO9/game/'
)
$ErrorActionPreference = 'Stop'
$html = [IO.File]::ReadAllText($Workshop, [Text.Encoding]::UTF8).Replace("`r`n", "`n")

# ---- CSS 범위 좁히기 ----
function Scope-Selectors([string]$sel) {
    $parts = New-Object System.Collections.ArrayList; $depth = 0; $cur = ''
    foreach ($ch in $sel.ToCharArray()) {
        if ($ch -eq '(') { $depth++ } elseif ($ch -eq ')') { $depth-- }
        if ($ch -eq ',' -and $depth -eq 0) { [void]$parts.Add($cur); $cur = '' } else { $cur += $ch }
    }
    [void]$parts.Add($cur)
    ($parts | ForEach-Object {
        $s = $_.Trim()
        if ($s -eq '') { return }
        if ($s -match '^(:root|html|body)(.*)$') { '#wsdialog' + $Matches[2] }
        else { '#wsdialog ' + $s }
    }) -join ','
}
function Scope-Css([string]$css) {
    $out = New-Object Text.StringBuilder; $i = 0
    while ($i -lt $css.Length) {
        $open = $css.IndexOf('{', $i); if ($open -lt 0) { [void]$out.Append($css.Substring($i)); break }
        $prelude = $css.Substring($i, $open - $i)
        # 블록 끝 찾기
        $depth = 0; $j = $open
        for (; $j -lt $css.Length; $j++) { if ($css[$j] -eq '{') { $depth++ } elseif ($css[$j] -eq '}') { $depth--; if ($depth -eq 0) { break } } }
        $body = $css.Substring($open + 1, $j - $open - 1)
        $p = $prelude.Trim()
        if ($p.StartsWith('@media') -or $p.StartsWith('@supports')) { [void]$out.Append($p + '{' + (Scope-Css $body) + '}') }
        elseif ($p.StartsWith('@')) { [void]$out.Append($p + '{' + $body + '}') }
        else { $c = [regex]::Replace($p, '/\*[\s\S]*?\*/', '').Trim(); if ($c) { [void]$out.Append((Scope-Selectors $c) + '{' + $body + '}') } }
        $i = $j + 1
    }
    $out.ToString()
}
$css = ([regex]::Matches($html, '<style>([\s\S]*?)</style>') | ForEach-Object { $_.Groups[1].Value }) -join "`n"
$scoped = Scope-Css $css
$scoped += "`n#wsdialog{width:min(1320px,97vw);height:94vh;max-height:94vh;padding:0;border:1px solid #556;border-radius:10px;overflow:auto}#wsdialog::backdrop{background:#000a}#wsdialog .wsbar{position:sticky;top:0;z-index:20;display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 16px;background:#2a3129;border-bottom:1px solid #414b42}#wsdialog .wsbar b{color:#f0d9a6}"

# ---- 화면(마크업) ----
$a = $html.IndexOf('<header>'); $b = $html.IndexOf('<script>', $a)
$markup = $html.Substring($a, $b - $a)
$markup = $markup.Replace('<p>게임을 하면서 지금 보고 있는 이미지 리소스를 골라 바로 교체합니다.</p>', '<p>체크리스트에서 고른 그림을 새 이미지로 교체합니다. 처음 한 번 <b>PIC 폴더 등록</b>에서 플레이 폴더의 <code>game\content\pic</code>을 고르세요.</p>')
$markup = $markup.Replace('게임에서 Other → Image Workshop을 실행하면 현재 화면 이미지가 여기에 나타납니다.', '체크리스트 카드의 「🖼 교체」를 누르면 그 그림이 여기에 나타납니다.')
$markup = $markup.Replace('<div class="eyebrow">1 · CURRENT SCREEN RESOURCES</div>', '<div class="eyebrow">1 · 체크리스트에서 고른 그림</div>')
$dialogHtml = '<dialog id="wsdialog"><div class="wsbar"><b>🖼 이미지 교체 (체크리스트 연동 · JO9 Place Workshop 1.1.3)</b><button id="wsclose">닫기</button></div>' + $markup + '</dialog>'

# ---- 스크립트 ----
$scripts = [regex]::Matches($html, '<script>([\s\S]*?)</script>') | ForEach-Object { $_.Groups[1].Value }
if (@($scripts).Count -ne 5) { throw "스크립트 개수가 예상(5)과 다릅니다: $(@($scripts).Count)" }
$main = $scripts[3]
function Rep([string]$text, [string]$a, [string]$b) { if (-not $text.Contains($a)) { throw "교체기 코드에서 찾지 못함: $($a.Substring(0, [Math]::Min(60, $a.Length)))" }; $text.Replace($a, $b) }
$main = Rep $main "function assetUrl(p){return '/api/asset?path='+encodeURIComponent(p)}" "function assetUrl(p){return PLAY_URL+String(p).split('/').map(encodeURIComponent).join('/')+(BUST[p]?'?t='+BUST[p]:'')}"
$m = [regex]::Match($main, 'async function openInExplorer\(path\)\{[\s\S]*?\n\}\n')
if (-not $m.Success) { throw 'openInExplorer를 찾지 못함' }
$main = $main.Remove($m.Index, $m.Length).Insert($m.Index, "async function openInExplorer(path){window.open(assetUrl(path).replace(/\?t=\d+$/,'').replace(/\/[^\/]*$/,'/'),'_blank')}`n")
$main = Rep $main 'pollJO9Context();setInterval(pollJO9Context,800);' ''

$hooks = @"

// ---- 체크리스트 연동 ----
const _addOrig=add;
add=async function(files){
 await _addOrig(files);
 if(SelectedScreenPaths.size===1){const only=[...SelectedScreenPaths][0];let n=0;for(const s of S.inputs)if(!s.mappedPath){s.mappedPath=only;n++}
  if(n){if(S.root)await rebuild();renderScreenResources();msg('교체 대상 자동 지정: '+only+(S.root?' · 관련 베리에이션을 확인하세요.':' · 먼저 PIC 폴더를 등록하세요.'))}}
};
const _applyOrig=apply;
async function applyAndNotify(){
 await _applyOrig();
 const done=S.rows.filter(r=>r.error==='저장 완료').map(r=>r.target);
 if(done.length){const t=Date.now();for(const p of done)BUST['content/pic/'+p]=t;window.dispatchEvent(new CustomEvent('jo9ws-applied',{detail:done}))}
}
`$('apply').onclick=applyAndNotify;
`$('wsclose').onclick=()=>{if(S.busy)return msg('작업이 끝난 뒤 닫아 주세요.',true);`$('wsdialog').close()};
`$('wsdialog').addEventListener('cancel',e=>{if(S.busy)e.preventDefault()});
window.JO9WS={
 open(list){
  for(const s of S.inputs){try{URL.revokeObjectURL(s.url)}catch(_e){}}S.inputs=[];
  ScreenContext.status='ok';ScreenContext.resources=list;ScreenContext.hiddenFolders=[];ScreenContext.hiddenFilePatterns=[];SelectedScreenPaths.clear();for(const r of list)SelectedScreenPaths.add(r.path);ScreenDetailPath=list[0]?list[0].path:'';
  (S.root?rebuild():Promise.resolve()).then(()=>{renderScreenResources();msg(S.root?'새 이미지를 넣으면 이 그림이 교체 대상으로 자동 지정됩니다.':'먼저 「PIC 폴더 등록」에서 플레이 폴더의 game\\content\\pic을 고르세요.')});
  if(!`$('wsdialog').open)`$('wsdialog').showModal();
 },
 state:S
};
"@

$body = "'use strict';`nconst PLAY_URL=" + (ConvertTo-Json $PlayUrl) + ";const BUST={};`n" + $scripts[2] + "`n" + $main + "`n" + $scripts[4] + "`n" + $hooks
$js = "/* catalog_editor.js — make_catalog_editor.ps1이 JO9_Place_Workshop.html에서 생성. 직접 고치지 말 것. */`n" +
    "(function(){var st=document.createElement('style');st.textContent=" + (ConvertTo-Json $scoped -Compress) + ";document.head.appendChild(st);" +
    "document.body.insertAdjacentHTML('beforeend'," + (ConvertTo-Json $dialogHtml -Compress) + ");})();`n" +
    $scripts[0] + "`n" + $scripts[1] + "`n(function(){`n" + $body + "`n})();`n"
[IO.File]::WriteAllText($Out, $js, (New-Object Text.UTF8Encoding $false))
"catalog_editor.js {0:N0} KB → {1}" -f ((Get-Item $Out).Length / 1KB), $Out
