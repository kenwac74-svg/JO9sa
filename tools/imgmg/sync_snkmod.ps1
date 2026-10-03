# 게임 폴더의 SNKmod 이미지를 IMGMG(UIpatch 원본 폴더, merge_work)에 동기화하고,
# original_map.json에 적힌 대응대로 원본 경로 이미지(newimgpack, merge_work)도 맞춘다.
# 기본은 차이만 보고한다. -Apply를 주면 복사한다(덮어쓰는 파일은 _backup에 날짜별로 보관).
param(
    [string]$Root = (Split-Path -Parent $PSScriptRoot),
    [string]$GamePic = 'G:\somi\JO9\game\content\pic',
    [switch]$Apply
)
$ErrorActionPreference = 'Stop'
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupRoot = Join-Path $Root "_backup\$stamp"
$plan = New-Object System.Collections.ArrayList

function Get-Sha($p) { (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash }

# 원본(src)과 대상(dst)이 다르면 계획에 넣는다.
function Add-Plan($src, $dst, $why) {
    if (Test-Path -LiteralPath $dst) {
        if ((Get-Item -LiteralPath $dst).Length -eq (Get-Item -LiteralPath $src).Length -and (Get-Sha $dst) -eq (Get-Sha $src)) { return }
        $kind = '갱신'
    } else { $kind = '추가' }
    [void]$plan.Add([pscustomobject]@{ Kind = $kind; Why = $why; Src = $src; Dst = $dst })
}

# 1) SNKmod: 게임 → UIpatch\pic\SNKmod, merge_work\game\content\pic\SNKmod
$gameSnk = Join-Path $GamePic 'SNKmod'
$targets = @((Join-Path $Root 'UIpatch\pic\SNKmod'), (Join-Path $Root 'merge_work\game\content\pic\SNKmod'))
foreach ($f in Get-ChildItem -LiteralPath $gameSnk -Recurse -File) {
    $rel = $f.FullName.Substring($gameSnk.Length + 1)
    foreach ($t in $targets) { Add-Plan $f.FullName (Join-Path $t $rel) 'SNKmod' }
}
# 대상에만 있는 SNKmod 파일은 지우지 않고 보고만 한다.
$extra = foreach ($t in $targets) {
    Get-ChildItem -LiteralPath $t -Recurse -File | Where-Object { -not (Test-Path -LiteralPath (Join-Path $gameSnk $_.FullName.Substring($t.Length + 1))) } | ForEach-Object { $_.FullName }
}

# 2) 원본 경로 배치: original_map.json { "원본 경로(content\pic 기준)": "SNKmod 경로(content\pic 기준)" }
$mapPath = Join-Path $PSScriptRoot 'original_map.json'
if (Test-Path -LiteralPath $mapPath) {
    $map = Get-Content -LiteralPath $mapPath -Raw -Encoding UTF8 | ConvertFrom-Json
    foreach ($p in $map.PSObject.Properties) {
        $src = Join-Path $GamePic $p.Value
        if (-not (Test-Path -LiteralPath $src)) { Write-Warning "대응 원본 없음: $($p.Value)"; continue }
        Add-Plan $src (Join-Path $Root "newimgpack\pic\$($p.Name)") "원본경로 ← $($p.Value)"
        Add-Plan $src (Join-Path $Root "merge_work\game\content\pic\$($p.Name)") "원본경로 ← $($p.Value)"
    }
}

if ($plan.Count -eq 0) { Write-Host '동기화할 차이 없음.' }
else { $plan | Sort-Object Dst | Format-Table Kind, Why, @{ n = 'Dst'; e = { $_.Dst.Substring($Root.Length + 1) } } -AutoSize | Out-String -Width 250 | Write-Host }
if ($extra) { Write-Host "대상에만 있는 SNKmod 파일(지우지 않음) $(@($extra).Count)개:"; $extra | ForEach-Object { Write-Host "  $_" } }
if (-not $Apply) { Write-Host "보고만 했습니다. 적용하려면 -Apply"; exit 0 }

foreach ($x in $plan) {
    if ($x.Kind -eq '갱신') {
        $b = Join-Path $backupRoot $x.Dst.Substring($Root.Length + 1)
        New-Item -ItemType Directory -Force (Split-Path $b) | Out-Null
        Copy-Item -LiteralPath $x.Dst -Destination $b
    }
    New-Item -ItemType Directory -Force (Split-Path $x.Dst) | Out-Null
    Copy-Item -LiteralPath $x.Src -Destination $x.Dst -Force
    if ((Get-Sha $x.Dst) -ne (Get-Sha $x.Src)) { throw "복사 검증 실패: $($x.Dst)" }
}
Write-Host "적용 $($plan.Count)건. 갱신 전 파일 백업: $(if (Test-Path $backupRoot) { $backupRoot } else { '없음' })"
