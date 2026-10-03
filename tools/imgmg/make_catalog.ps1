# 플레이 폴더(JO9\game: 올걸팩 + 사용자 이미지 + UI 패치가 모두 적용된 곳)와 원본(JO9O\game)을 같은 경로끼리 비교해
# 작업 체크리스트 카탈로그(.hta/.html)를 만든다. 체크 상태는 catalog_status.js에 따로 저장되므로 다시 만들어도 유지된다.
param(
    [string]$Root = (Split-Path -Parent $PSScriptRoot),
    [string]$Play = 'G:\somi\JO9\game',
    [string]$Original = 'G:\somi\JO9O\game'
)
$ErrorActionPreference = 'Stop'
$M = $Play
# 목록에서 뺄 폴더(이미지 도구 백업 등)
$skipDirs = @('content\pic\__jo9_imagebackups\')

function Get-Index($base) {
    $h = @{}
    foreach ($s in 'content\pic', 'json') {
        $b = Join-Path $base $s
        if (-not (Test-Path -LiteralPath $b)) { continue }
        foreach ($f in Get-ChildItem -LiteralPath $b -Recurse -File) {
            $rel = $f.FullName.Substring($base.Length + 1)
            $skip = $false; foreach ($d in $skipDirs) { if ($rel.ToLower().StartsWith($d.ToLower())) { $skip = $true } }
            if (-not $skip) { $h[$rel.ToLower()] = $f }
        }
    }
    $h
}
# 인디패치 데이터(노예별 설정): 이 번호의 json\slaves\<번호>.json은 인디패치 출처로 본다.
$indiIds = @{}
$indiDir = Join-Path (Split-Path $Play) 'individuality_patch_data'
if (Test-Path -LiteralPath $indiDir) { Get-ChildItem -LiteralPath $indiDir -Directory | Where-Object { $_.Name -match '^\d+$' } | ForEach-Object { $indiIds[$_.Name] = 1 } }
function Get-Sha($p) { (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash }
# 출처: 같은 경로에 같은 내용이 있는 작업 폴더. 없으면 기타.
function Get-Src($rel, $f) {
    $r = $rel
    if ($r.StartsWith('content\pic\SNKmod\')) {
        $u = Join-Path $Root ('UIpatch\pic\SNKmod\' + $r.Substring(19)); if ((Test-Path -LiteralPath $u) -and (Get-Item -LiteralPath $u).Length -eq $f.Length) { return 'ui' }
        return 'etc'
    }
    $cands = @()
    if ($r.StartsWith('content\pic\')) {
        $p = $r.Substring(12)
        $cands += , @('new', (Join-Path $Root "newimgpack\pic\$p"))
        $cands += , @('ui', (Join-Path $Root "UIpatch\pic\SNKmod\$p"))
    }
    $cands += , @('ai', (Join-Path $Root "ai_girl_pack\game\$r"))
    $h = $null
    foreach ($c in $cands) {
        if ((Test-Path -LiteralPath $c[1]) -and (Get-Item -LiteralPath $c[1]).Length -eq $f.Length) {
            if (-not $h) { $h = Get-Sha $f.FullName }
            if ((Get-Sha $c[1]) -eq $h) { return $c[0] }
        }
    }
    if ($r -match '^json\\slaves\\(\d+)\.json$' -and $indiIds.ContainsKey($Matches[1])) { return 'indi' }
    # 인디패치(개성 패치)는 설치기가 이미지를 내려받아 로컬 목록이 없다. girls 아래의 나머지는 인디패치로 추정한다.
    if ($r.StartsWith('content\pic\girls\')) { return 'indi' }
    'etc'
}

$P = Get-Index $Play
$Q = Get-Index $Original
$data = New-Object System.Collections.ArrayList
foreach ($k in $P.Keys) {
    $f = $P[$k]; $rel = $f.FullName.Substring($Play.Length + 1)
    if ($Q.ContainsKey($k)) {
        $o = $Q[$k]
        if ($o.Length -eq $f.Length -and (Get-Sha $o.FullName) -eq (Get-Sha $f.FullName)) { [void]$data.Add(@($rel, 'o', 'orig', $f.Length, $o.Length)); continue }
        [void]$data.Add(@($rel, 'r', (Get-Src $rel $f), $f.Length, $o.Length))
    } else {
        [void]$data.Add(@($rel, 'a', (Get-Src $rel $f), $f.Length, 0))
    }
}
foreach ($k in $Q.Keys) { if (-not $P.ContainsKey($k)) { $o = $Q[$k]; [void]$data.Add(@($o.FullName.Substring($Original.Length + 1), 'd', 'orig', 0, $o.Length)) } }
# 가로·세로(PNG·GIF는 헤더만 읽음). 가로나 세로가 400 이상이면 큰 그림, 아니면 UI·포트레이트로 보고 기본 목록에서 숨긴다.
Add-Type -AssemblyName System.Drawing
function Get-Dim($path) {
    $fs = [IO.File]::OpenRead($path)
    try {
        $b = New-Object byte[] 26; [void]$fs.Read($b, 0, 26)
        $v = [int[]]$b; if ($v[0] -eq 0x89 -and $v[1] -eq 0x50) { return @((($v[16] -shl 24) -bor ($v[17] -shl 16) -bor ($v[18] -shl 8) -bor $v[19]), (($v[20] -shl 24) -bor ($v[21] -shl 16) -bor ($v[22] -shl 8) -bor $v[23])) }
        if ($v[0] -eq 0x47 -and $v[1] -eq 0x49) { return @(($v[6] -bor ($v[7] -shl 8)), ($v[8] -bor ($v[9] -shl 8))) }
        if ($b[0] -eq 0xFF -and $b[1] -eq 0xD8) { $fs.Position = 0; $i = [Drawing.Image]::FromStream($fs, $false, $false); try { return @($i.Width, $i.Height) } finally { $i.Dispose() } }
    } catch { } finally { $fs.Dispose() }
    @(0, 0)
}
$imgExt = '\.(png|jpe?g|gif|bmp|webp)$'
# 위에서 배열에 더한 것은 복사본이라, 새 배열로 다시 만든다.
$data2 = New-Object System.Collections.ArrayList
foreach ($x in $data) {
    $w = 0; $h = 0
    if ($x[0] -match $imgExt) { $src = if ($x[1] -eq 'd') { Join-Path $Original $x[0] } else { Join-Path $Play $x[0] }; $d = Get-Dim $src; $w = $d[0]; $h = $d[1] }
    [void]$data2.Add(@($x[0], $x[1], $x[2], $x[3], $x[4], $w, $h, ''))
}
$data = $data2
function Is-Small($x) { ($x[0] -match $imgExt) -and $x[5] -gt 0 -and [Math]::Max($x[5], $x[6]) -lt 400 }
# 짝: 이름에서 _gray·_sepia·_ava를 뺀 줄기가 같은 큰 그림에 붙인다(같은 폴더 우선, 다음 girls\full·characters·bg·mob·scene 순).
function Get-Stem($rel) {
    $n = [IO.Path]::GetFileNameWithoutExtension($rel).ToLower()
    $n = $n -replace '_(gray|grey|sepia)$', ''
    $n = $n -replace '_ava(?=(_\d+)?$)', ''
    $n
}
$big = @{}
foreach ($x in $data) { if (($x[0] -match $imgExt) -and -not (Is-Small $x)) { $k = Get-Stem $x[0]; if (-not $big[$k]) { $big[$k] = New-Object System.Collections.ArrayList }; [void]$big[$k].Add($x[0]) } }
$pref = @('content\pic\girls\full\', 'content\pic\characters\', 'content\pic\bg\', 'content\pic\mob\', 'content\pic\scene\')
$paired = 0
foreach ($x in $data) {
    if (-not (Is-Small $x)) { continue }
    $c = $big[(Get-Stem $x[0])]; if (-not $c) { continue }
    $dir = [IO.Path]::GetDirectoryName($x[0]).ToLower()
    $best = $c | Where-Object { [IO.Path]::GetDirectoryName($_).ToLower() -eq $dir } | Select-Object -First 1
    if (-not $best) { foreach ($p in $pref) { $best = $c | Where-Object { $_.ToLower().StartsWith($p) } | Select-Object -First 1; if ($best) { break } } }
    if (-not $best) { $best = $c[0] }
    $x[7] = $best; $paired++
}
$smallN = @($data | Where-Object { Is-Small $_ }).Count
$json = ConvertTo-Json @($data) -Compress -Depth 3
$stats = ($data | Group-Object { $_[1] } | ForEach-Object { "$($_.Name)=$($_.Count)" }) -join ', '
$srcStats = ($data | Where-Object { $_[1] -eq 'r' -or $_[1] -eq 'a' } | Group-Object { $_[2] } | ForEach-Object { "$($_.Name)=$($_.Count)" }) -join ', '


$html = @"
<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta http-equiv="x-ua-compatible" content="ie=edge"><meta name="viewport" content="width=device-width,initial-scale=1">
<hta:application id="app" applicationname="IMGMG_checklist" windowstate="maximize" />
<title>이미지 패치 체크리스트</title>
<style>
:root{--bg:#f6f6f4;--card:#fff;--fg:#1d1d1b;--mute:#6b6b66;--line:#ddd;--hl:#fff3d6}
@media (prefers-color-scheme:dark){:root{--bg:#18181a;--card:#222225;--fg:#ececea;--mute:#9a9a96;--line:#38383c;--hl:#3a3220}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.45 "Malgun Gothic",system-ui,sans-serif}
#side{position:fixed;top:0;left:0;bottom:0;width:300px;overflow:auto;background:var(--card);border-right:1px solid var(--line);padding:12px 8px}
#main{margin-left:300px;padding:14px 16px}
@media (max-width:800px){#side{position:static;width:auto;max-height:40vh;border-right:0;border-bottom:1px solid var(--line)}#main{margin-left:0}}
h1{font-size:19px;margin:0 0 4px}.sub{color:var(--mute);font-size:12px;margin:0 0 10px}
.tree ul{list-style:none;margin:0;padding-left:14px}.tree>ul{padding-left:0}
.tree li{margin:1px 0}
.tw{display:inline-block;width:16px;text-align:center;cursor:pointer;color:var(--mute)}
.fn{cursor:pointer;padding:1px 4px;border-radius:4px}.fn:hover{background:var(--bg)}.fn.sel{background:var(--hl);font-weight:700}
.fc{color:var(--mute);font-size:11px}
.bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px;background:var(--card);padding:8px 10px;border-radius:8px}
select,input,button{font:inherit;font-size:13px;padding:4px 8px;border:1px solid var(--line);background:var(--bg);color:var(--fg);border-radius:6px}
button{cursor:pointer}#q{width:180px}
.sum{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.chip{font-size:12px;padding:2px 8px;border-radius:10px;border:1px solid var(--line);background:var(--card);cursor:pointer}
.chip b{margin-left:4px}
.fh{margin:16px 0 6px;font-weight:700;font-size:13px;color:var(--mute);border-bottom:1px solid var(--line);padding-bottom:3px}
.row{background:var(--card);border-radius:8px;padding:10px;margin-bottom:10px;border-left:5px solid var(--line)}
.hd{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px}
.tag{font-size:11px;font-weight:700;padding:1px 6px;border-radius:4px;color:#fff}
.t-r{background:#c0612b}.t-a{background:#2b8a4a}.t-s{background:#888}.t-o{background:#4f6f7f}.p-orig{background:#777}.p-etc{background:#5a5a5a}.p-indi{background:#8a6d1f}.t-d{background:#8a3b3b}.conf{color:#2b8a4a;font-weight:700}.p-ai{background:#a0522d}.p-new{background:#2b6fc0}.p-ui{background:#7a4fc0}
.rel{font-weight:600;word-break:break-all}
.sts{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}
.sb{font-size:12px;padding:2px 8px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--fg);cursor:pointer}
.sb.on{color:#fff;font-weight:700}
.pair{display:flex;gap:10px;flex-wrap:wrap}.side{flex:1 1 280px;max-width:420px}
.lab{font-size:12px;color:var(--mute);margin-bottom:4px}
.side img{width:100%;display:block;border-radius:4px}
.meta{font-size:12px;color:var(--mute);margin-top:4px;word-break:break-all}
a.open{color:inherit;font-weight:600;cursor:pointer}
.none{color:var(--mute);padding:30px 0;text-align:center;border:1px dashed var(--line);border-radius:4px}
.kids{margin-top:10px;border-top:1px dashed var(--line);padding-top:8px;display:flex;flex-direction:column;gap:8px}.kid{border-left:4px solid var(--line);padding-left:8px}.kid .side{flex:0 1 200px;max-width:220px}.kid .side img{max-height:160px;width:auto;max-width:100%}.kid .hd{margin-bottom:4px}.pager{display:flex;gap:6px;align-items:center;margin:10px 0;flex-wrap:wrap}
#save{font-size:12px;color:var(--mute)}
</style></head><body>
<div id="side"><div class="sub" style="margin:0 4px 8px"><b>폴더</b> · 이름 옆 숫자는 완료/전체</div><div class="tree" id="tree"></div></div>
<div id="main">
<h1>이미지 패치 작업 체크리스트</h1>
<p class="sub">플레이 폴더 <code>$($Play -replace '\\','\')</code>(순정 + 올걸팩 + 인디패치 + 사용자 이미지·UI 패치) × 순정 원본 <code>$($Original -replace '\\','\')</code>, 같은 경로끼리 비교. 생성 $(Get-Date -Format 'yyyy-MM-dd HH:mm').
비교: <b>교체</b> 원본을 다른 내용으로 덮어씀 · <b>추가</b> 원본에 없는 새 파일 · <b>동일</b> 원본과 같음 · <b>작업내역 없는 원본</b> 올걸팩·뉴이미지·UI패치 어디서도 손대지 않은 원본(원본 폴더 연결). 상태 버튼과 태그에 마우스를 올리면 뜻이 나옵니다. <b>완료만</b> 체크된 항목이 <b>확정</b>(2.4 패치 반영 결정)입니다.
상태는 여러 개 동시에 체크할 수 있고, 다시 누르면 해제. 아무것도 없으면 검토중. 파일명을 누르면 폴더가 열립니다(.hta는 탐색기에서 파일 선택).</p>
<div class="sum" id="sum"></div>
<div class="bar">
 <label><input type="checkbox" id="sub" checked> 하위 폴더 포함</label> <label title="가로·세로 모두 400px 미만인 그림(UI 아이콘·포트레이트 등). 큰 그림과 짝인 것은 끄더라도 그 큰 그림 카드 안에 함께 보입니다."><input type="checkbox" id="small"> UI·포트레이트 보기</label>
 <label>작업상태 <select id="fs"></select></label>
 <label>비교 <select id="st"><option value="">전체</option><option value="r">교체</option><option value="a">추가</option><option value="s">동일</option><option value="o">작업내역 없는 원본</option><option value="d">플레이에 없음</option></select></label>
 <label>출처 <select id="src"><option value="">전체</option><option value="ai">올걸팩</option><option value="new">뉴이미지</option><option value="ui">UI패치</option><option value="orig">원본</option><option value="indi">인디패치(추정)</option><option value="etc">기타</option></select></label>
 <input id="q" placeholder="경로 검색">
 <label>쪽당 <select id="per"><option>30</option><option selected>60</option><option>120</option></select></label>
</div>
<div class="bar">
 <span id="cnt"></span>
 <label>현재 목록 전체에 <select id="bulk"></select></label><select id="bmode"><option value="add">추가</option><option value="del">해제</option></select><button onclick="bulkSet()">일괄 적용</button>
 <button onclick="exportStatus()">상태 파일 내보내기</button>
 <span id="save"></span>
</div>
<div class="pager" id="pg1"></div>
<div id="list"></div>
<div class="pager" id="pg2"></div>
</div>
<script src="catalog_status.js"></script>
<script>
var D=$json;
var MR='$($M -replace '\\','\\')', OR='$($Original -replace '\\','\\')';
var CMP={'r':'교체','a':'추가','s':'동일','o':'작업내역 없는 원본','d':'플레이에 없음'}, SRC={'ai':'올걸팩','new':'뉴이미지','ui':'UI패치','orig':'원본','indi':'인디패치(추정)','etc':'기타'};
var CMPT={'r':'플레이 폴더가 원본을 다른 그림·데이터로 덮어씀','a':'원본에 없는 새 파일','s':'원본과 같음','o':'플레이 폴더의 파일이 원본과 내용까지 같음(작업내역 없음)','d':'원본에는 있으나 플레이 폴더에 없음'};
// 저장 코드(done, branch, spare 등)는 그대로 두고 표시 이름과 뜻만 바꾼다(기존 체크 유지).
var STS=[['done','완료','#2b8a4a','작업을 했다는 뜻. 완료만 체크돼 있으면 「확정」 = 2.4 패치에 반영하기로 결정된 이미지.'],
 ['ore','원본re','#2b6fc0','원본을 바탕으로 재작업해 볼 이미지. 완료와 함께 체크되면 일단 완료로 보지만, 나중에 재작업해서 교체할 수 있음.'],
 ['mre','머지re','#c0612b','플레이 폴더 그림(올걸팩·뉴이미지 등, 머지본)을 바탕으로 재작업해 볼 이미지. 완료와 함께 체크되면 일단 완료로 보지만, 나중에 재작업해서 교체할 수 있음.'],
 ['branch','재활용','#7a4fc0','원래 용도가 아닌 다른 장면에 연결하거나 편집용 소스로 쓰는 등, 어쨌든 필요한 이미지. 보관 대상.'],
 ['spare','보관','#8a6d1f','원본과 플레이 폴더 그림(머지본) 둘 다 특색이 있어 따로 보관. 추후 [원본스타일]·[올걸팩스타일]·[SNK스타일] 전환 기능에서 게임 QSP가 경로를 연결해 줄 대상(물리적 위치는 그대로).'],
 ['wip','작업중','#d14a8a','현재 진행 중인 이미지.'],['todo','작업필요','#5a5a5a','아직 착수 전이지만 인지하고 있는 이미지.']];
function isConf(rel){var a=S[rel];return !!(a&&a.length==1&&a[0]=='done');}
var STN={};for(var i=0;i<STS.length;i++)STN[STS[i][0]]=STS[i];
var S={}, curDir='', page=0, view=[], isHta=false, saveTimer=null;
function el(id){return document.getElementById(id);}
function url(p){var s=p.replace(/\\/g,'/').split('/'),o=[];for(var i=0;i<s.length;i++)o.push(i==0?s[i]:encodeURIComponent(s[i]));return 'file:///'+o.join('/');}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function kb(n){return Math.round(n/1024).toLocaleString()+' KB';}
function isImg(r){return /\.(png|jpe?g|gif|webp|bmp)$/i.test(r);}
function dirOf(r){var i=r.lastIndexOf('\\');return i<0?'':r.substring(0,i);}
function leaf(r){return r.substring(r.lastIndexOf('\\')+1);}
function sortKey(r){return (dirOf(r).replace(/\\/g,'\u0002')+'\u0001'+leaf(r)).toLowerCase();}
function openFolder(p){try{var sh=new ActiveXObject('WScript.Shell');sh.Run('explorer.exe /select,"'+p+'"');return false;}catch(e){return true;}}

// ---- 상태 저장: .hta는 catalog_status.js 파일, 브라우저는 localStorage ----
function statusPath(){var p=decodeURIComponent(location.pathname).replace(/\//g,'\\');if(p.charAt(0)=='\\')p=p.substring(1);return p.substring(0,p.lastIndexOf('\\'))+'\\catalog_status.js';}
function jstr(s){return '"'+String(s).replace(/[\\"]/g,'\\$&').replace(/[\u0000-\u001f\u0080-\uffff]/g,function(c){return '\\u'+('000'+c.charCodeAt(0).toString(16)).slice(-4);})+'"';}
function asciiJson(o){var a=[];for(var k in o.items)if(o.items.hasOwnProperty(k)){var v=[],x=o.items[k];for(var j=0;j<x.length;j++)v.push(jstr(x[j]));a.push(jstr(k)+':['+v.join(',')+']');}return '{"savedAt":'+o.savedAt+',"items":{'+a.join(',')+'}}';}
function fileText(){return '// IMGMG 체크리스트 상태. 카탈로그가 자동으로 고친다.\nwindow.CATALOG_STATUS='+asciiJson({savedAt:new Date().getTime(),items:S})+';\n';}
function loadStatus(){
  var f=window.CATALOG_STATUS||null, l=null;
  try{isHta=!!new ActiveXObject('Scripting.FileSystemObject');}catch(e){isHta=false;}
  if(!isHta){try{l=JSON.parse(localStorage.getItem('imgmg_status')||'null');}catch(e){}}
  var pick=f; if(l&&(!f||l.savedAt>f.savedAt))pick=l;
  var raw=(pick&&pick.items)||{};S={};
  // 예전 단일 선택 형식("done")은 목록(["done"])으로 바꿔 그대로 유지한다.
  for(var k in raw){if(!raw.hasOwnProperty(k))continue;var v=raw[k],a=[];if(typeof v=='string')v=[v];
    for(var j=0;j<STS.length;j++)for(var m=0;m<v.length;m++)if(v[m]==STS[j][0])a.push(v[m]);if(a.length)S[k]=a;}
  el('save').innerHTML=isHta?'자동 저장: catalog_status.js':'자동 저장: 이 브라우저(내보내기로 파일 저장)';
}
function saveNow(){
  if(isHta){try{var txt=fileText().replace(/[^\x00-\x7f]/g,''),fso=new ActiveXObject('Scripting.FileSystemObject'),t=fso.CreateTextFile(statusPath(),true,false);try{t.Write(txt);}finally{t.Close();}el('save').innerHTML='저장됨 '+new Date().toLocaleTimeString();}catch(e){el('save').innerHTML='<b style="color:#c00">저장 실패: '+esc(e.message)+'</b>';}}
  else{try{localStorage.setItem('imgmg_status',JSON.stringify({savedAt:new Date().getTime(),items:S}));el('save').innerHTML='브라우저에 저장됨 '+new Date().toLocaleTimeString();}catch(e){el('save').innerHTML='<b style="color:#c00">브라우저 저장 실패, 내보내기를 쓰세요</b>';}}
}
function saveSoon(){clearTimeout(saveTimer);saveTimer=setTimeout(saveNow,400);}
function exportStatus(){
  if(isHta){saveNow();alert('저장했습니다: '+statusPath());return;}
  var b=new Blob([fileText()],{type:'text/javascript'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='catalog_status.js';document.body.appendChild(a);a.click();a.parentNode.removeChild(a);
  alert('받은 catalog_status.js를 카탈로그와 같은 폴더에 덮어쓰면 .hta와 다른 브라우저에서도 같은 상태가 보입니다.');
}

// ---- 폴더 트리 ----
var T={name:'game',path:'',kids:{},n:0,done:0,open:true};
function buildTree(){
  for(var i=0;i<D.length;i++){var parts=dirOf(D[i][0]).split('\\'),node=T,p='';node.n++;
    for(var j=0;j<parts.length;j++){if(!parts[j])continue;p=p?p+'\\'+parts[j]:parts[j];
      if(!node.kids[parts[j]])node.kids[parts[j]]={name:parts[j],path:p,kids:{},n:0,done:0,open:j<2};node=node.kids[parts[j]];node.n++;}}
}
function tallyDone(){var c={};for(var i=0;i<D.length;i++)if(has(D[i][0],'done')){var d=dirOf(D[i][0]);c[d]=(c[d]||0)+1;}
  (function walk(n){n.done=c[n.path]||0;for(var k in n.kids)n.done+=walk(n.kids[k]);return n.done;})(T);}
function treeHtml(n){
  var ks=[];for(var k in n.kids)ks.push(k);ks.sort(function(a,b){a=a.toLowerCase();b=b.toLowerCase();return a<b?-1:a>b?1:0;});
  var h='<li><span class="tw" onclick="tog(\''+js(n.path)+'\')">'+(ks.length?(n.open?'▾':'▸'):'')+'</span><span class="fn'+(n.path==curDir?' sel':'')+'" onclick="pick(\''+js(n.path)+'\')">'+esc(n.name)+'</span> <span class="fc">'+n.done+'/'+n.n+'</span>';
  if(ks.length&&n.open){h+='<ul>';for(var i=0;i<ks.length;i++)h+=treeHtml(n.kids[ks[i]]);h+='</ul>';}
  return h+'</li>';
}
function js(s){return s.replace(/\\/g,'\\\\').replace(/'/g,"\\'");}
function findNode(p){if(!p)return T;var parts=p.split('\\'),n=T;for(var i=0;i<parts.length;i++){n=n.kids[parts[i]];if(!n)return T;}return n;}
function drawTree(){tallyDone();el('tree').innerHTML='<ul>'+treeHtml(T)+'</ul>';}
function tog(p){var n=findNode(p);n.open=!n.open;drawTree();}
function pick(p){curDir=p;var parts=p?p.split('\\'):[],n=T;n.open=true;for(var i=0;i<parts.length;i++){n=n.kids[parts[i]];n.open=true;}drawTree();filter();}

// ---- 목록 ----
function side(lab,root,rel,len,orig){
  if(orig&&!len)return '<div class="side"><div class="lab">'+lab+'</div><div class="none">원본에 없음</div></div>';
  var full=root+'\\'+rel, dir=dirOf(full);
  var img=isImg(rel)?'<a href="'+url(full)+'" target="_blank"><img src="'+url(full)+'" onload="var m=this.parentNode.parentNode.getElementsByTagName(\'span\')[0];if(m)m.innerHTML=this.naturalWidth+\'×\'+this.naturalHeight+\' · \'"></a>':'';
  return '<div class="side"><div class="lab">'+lab+'</div>'+img+'<div class="meta"><span></span>'+kb(len)+' · <a class="open" href="'+url(dir)+'" onclick="return openFolder(\''+js(full)+'\')">'+esc(leaf(rel))+'</a></div></div>';
}
function has(rel,s){var a=S[rel];if(!a)return false;for(var i=0;i<a.length;i++)if(a[i]==s)return true;return false;}
var R=[],KIDS={},IDX={};function isSmall(d){return isImg(d[0])&&d[5]>0&&Math.max(d[5],d[6])<400;}
function stsHtml(i){var rel=R[i][0],cur=S[rel],h='';
  for(var k=0;k<STS.length;k++){var s=STS[k],on=has(rel,s[0]);h+='<button class="sb'+(on?' on':'')+'" title="'+s[3]+'" style="'+(on?'background:'+s[2]+';border-color:'+s[2]:'')+'" onclick="setSt('+i+',\''+s[0]+'\')">'+(on?'☑ ':'☐ ')+s[1]+'</button>';}
  var st=!cur?'<span title="아무 상태도 체크되지 않음">검토중</span>':isConf(rel)?'<span class="conf" title="완료만 체크됨: 2.4 패치 반영 확정">✔ 확정</span>':has(rel,'done')?'<span title="완료와 다른 상태가 함께 체크됨: 일단 완료로 보지만 확정은 아님">완료(재작업 여지)</span>':'';
  return h+'<span class="sub" style="margin:0 0 0 6px;align-self:center">'+st+'</span>';}
function rowColor(rel){var a=S[rel];return a?STN[a[0]][2]:'var(--line)';}
function render(){
  var per=+el('per').value,n=view.length,pages=Math.max(1,Math.ceil(n/per));if(page>=pages)page=pages-1;
  var h=[],end=Math.min(n,(page+1)*per),last=null;
  R=[];
  for(var vi=page*per;vi<end;vi++){var d=view[vi],dd=dirOf(d[0]),i=R.length;R.push(d);
    if(dd!==last){h.push('<div class="fh">📁 '+esc(dd||'(최상위)')+'</div>');last=dd;}
    h.push(rowHtml(d,i,false));}
  el('list').innerHTML=h.join('')||'<p class="sub">해당 항목 없음</p>';
  var nk=0;for(var q=0;q<R.length;q++)if(R[q][7])nk++;
  el('cnt').innerHTML='<b>'+n.toLocaleString()+'</b>건'+(nk?' (+ 짝 그림 '+nk+')':'')+' (전체 '+D.length.toLocaleString()+')';
  var p='<button onclick="go(-1)">이전</button> <span>'+(page+1)+' / '+pages+' 쪽</span> <button onclick="go(1)">다음</button> <span class="sub" style="margin:0">'+esc(curDir||'전체')+'</span>';
  el('pg1').innerHTML=p;el('pg2').innerHTML=p;
}
function rowHtml(d,i,kid){
    var kids='';if(!kid&&KIDS[d[0]]){var ks=KIDS[d[0]],a=[];for(var k=0;k<ks.length;k++){var j=R.length;R.push(ks[k]);a.push(rowHtml(ks[k],j,true));}kids='<div class="kids"><div class="sub" style="margin:0">짝 그림(UI·포트레이트) '+ks.length+'</div>'+a.join('')+'</div>';}
    return '<div class="'+(kid?'kid':'row')+'" id="r'+i+'" style="border-left-color:'+rowColor(d[0])+'"><div class="hd"><span class="tag t-'+d[1]+'" title="'+CMPT[d[1]]+'">'+CMP[d[1]]+'</span><span class="tag p-'+d[2]+'" title="출처">'+SRC[d[2]]+'</span><span class="rel">'+esc(leaf(d[0]))+'</span></div>'+
      '<div class="sts" id="s'+i+'">'+stsHtml(i)+'</div><div class="pair">'+side('원본 (JO9O)',OR,d[0],d[4],true)+(d[1]=='o'?'<div class="side"><div class="lab">플레이 (JO9)</div><div class="none">작업내역 없는 원본<br>(플레이 폴더 = 원본 그대로)</div></div>':d[1]=='d'?'<div class="side"><div class="lab">플레이 (JO9)</div><div class="none">플레이 폴더에 없음</div></div>':side('플레이 (JO9)',MR,d[0],d[3],false))+'</div>'+kids+'</div>';
}
function setSt(i,s){var rel=R[i][0];if(has(rel,s))unmark(rel,s);else mark(rel,s);
  el('s'+i).innerHTML=stsHtml(i);el('r'+i).style.borderLeftColor=rowColor(rel);saveSoon();summary();drawTree();
  if(el('fs').value)setTimeout(filterKeepPage,300);}
function go(d){page+=d;if(page<0)page=0;render();window.scrollTo(0,0);}
function match(d,fs,nd){var st=el('st').value,src=el('src').value,q=el('q').value.toLowerCase(),dd=dirOf(d[0]);
  if(curDir&&!nd){if(el('sub').checked){if(dd!=curDir&&dd.indexOf(curDir+'\\')!=0)return false;}else if(dd!=curDir)return false;}
  if(st&&d[1]!=st)return false;if(src&&d[2]!=src)return false;if(q&&d[0].toLowerCase().indexOf(q)<0)return false;
  if(fs){if(fs=='none'){if(S[d[0]])return false;}else if(fs=='conf'){if(!isConf(d[0]))return false;}else if(!has(d[0],fs))return false;}return true;}
function filterKeepPage(){var p=page;filter();page=p;render();}
function filter(){var fs=el('fs').value,sm=el('small').checked;view=[];
  for(var i=0;i<D.length;i++){var d=D[i];
    if(d[7]&&IDX[d[7]])continue; // 짝이 있는 작은 그림은 큰 그림 카드 안에서
    if(isSmall(d)&&!sm)continue;
    var ok=match(d,fs);if(!ok&&KIDS[d[0]]){var ks=KIDS[d[0]];for(var k=0;k<ks.length;k++)if(match(ks[k],fs,true)){ok=true;break;}}
    if(ok)view.push(d);}
  page=0;render();summary();}
function summary(){var c={none:0},v={none:0},i,s;for(i=0;i<STS.length;i++){c[STS[i][0]]=0;v[STS[i][0]]=0;}
  for(i=0;i<D.length;i++){s=S[D[i][0]];if(!s)c.none++;else for(var j=0;j<s.length;j++)c[s[j]]++;}
  var h='';for(i=0;i<STS.length;i++){var t=STS[i];h+='<span class="chip" title="'+t[3]+'" style="border-color:'+t[2]+'" onclick="el(\'fs\').value=\''+t[0]+'\';filter()">'+t[1]+'<b>'+c[t[0]]+'</b></span>';}
  var cf=0;for(i=0;i<D.length;i++)if(isConf(D[i][0]))cf++;
  h+='<span class="chip" title="완료만 체크된 항목 = 2.4 패치 반영 확정" style="border-color:#2b8a4a" onclick="el(\'fs\').value=\'conf\';filter()">✔ 확정<b>'+cf+'</b></span><span class="chip" title="아무 상태도 체크되지 않은 항목" onclick="el(\'fs\').value=\'none\';filter()">검토중<b>'+c.none+'</b></span><span class="chip" onclick="el(\'fs\').value=\'\';filter()">전체<b>'+D.length+'</b></span>';
  el('sum').innerHTML=h;}
// 상태는 STS 순서로 정렬해 둔다(첫 상태 색이 왼쪽 띠 색).
function mark(rel,s){var a=S[rel]||[],o=[];for(var j=0;j<STS.length;j++){var k=STS[j][0];if(k==s)o.push(k);else for(var m=0;m<a.length;m++)if(a[m]==k)o.push(k);}S[rel]=o;}
function unmark(rel,s){var a=S[rel]||[],o=[];for(var m=0;m<a.length;m++)if(a[m]!=s)o.push(a[m]);if(o.length)S[rel]=o;else delete S[rel];}
function bulkSet(){var s=el('bulk').value,md=el('bmode').value,n=view.length;if(!n)return;
  var what=s?'「'+STN[s][1]+'」 '+(md=='add'?'추가':'해제'):'모든 체크 해제(검토중)';
  if(!confirm('현재 목록 '+n+'건(카드 안의 짝 그림 포함)에 '+what+' 할까요?'))return;
  var all=[];for(var i=0;i<n;i++){all.push(view[i][0]);var ks=KIDS[view[i][0]];if(ks)for(var k=0;k<ks.length;k++)all.push(ks[k][0]);}
  for(i=0;i<all.length;i++){var r=all[i];if(!s)delete S[r];else if(md=='add')mark(r,s);else unmark(r,s);}saveNow();drawTree();filterKeepPage();}

(function(){
  D.sort(function(a,b){a=sortKey(a[0]);b=sortKey(b[0]);return a<b?-1:a>b?1:0;});
  IDX={};for(var x=0;x<D.length;x++)IDX[D[x][0]]=1;
  for(x=0;x<D.length;x++){var pr=D[x][7];if(pr&&IDX[pr]){if(!KIDS[pr])KIDS[pr]=[];KIDS[pr].push(D[x]);}}
  var o='<option value="">전체</option>';for(var i=0;i<STS.length;i++)o+='<option value="'+STS[i][0]+'">'+STS[i][1]+'</option>';o+='<option value="conf">✔ 확정(완료만)</option><option value="none">검토중(미체크)</option>';el('fs').innerHTML=o;
  var b='';for(i=0;i<STS.length;i++)b+='<option value="'+STS[i][0]+'">'+STS[i][1]+'</option>';b+='<option value="">모든 체크 해제</option>';el('bulk').innerHTML=b;
  loadStatus();buildTree();drawTree();
  var ids=['st','src','per','fs','sub','small'];for(var k=0;k<ids.length;k++)el(ids[k]).onchange=filter;
  var t;el('q').onkeyup=function(){clearTimeout(t);t=setTimeout(filter,250);};
  filter();
})();
</script></body></html>
"@
$utf8 = New-Object Text.UTF8Encoding $true
foreach ($ext in 'html', 'hta') { [IO.File]::WriteAllText((Join-Path $Root "catalog_merge_vs_original.$ext"), $html, $utf8) }
$sp = Join-Path $Root 'catalog_status.js'
if (-not (Test-Path -LiteralPath $sp)) { [IO.File]::WriteAllText($sp, "window.CATALOG_STATUS={`"savedAt`":0,`"items`":{}};`r`n", [Text.Encoding]::ASCII) }
"항목 $($data.Count): $stats / 출처(교체·추가) $srcStats / UI·포트레이트(400px 미만) $smallN, 그중 큰 그림과 짝 $paired"