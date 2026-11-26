param(
    [Parameter(Mandatory=$true)][string]$GameRoot
)

$ErrorActionPreference='Stop'
$StockHash='fc70f16821a7827ffeb95a6b77eb55b5bf0bc05e4d761c459eb6e8e29affbecc'
$PatchHash='b9b23c4399b822a334bfeb7d2fcd7984b9b5b71d68e3879129f63df3a54699f3'

$Root=[IO.Path]::GetFullPath($GameRoot).TrimEnd('\')
$RootExe=Join-Path $Root 'Jack-o-nine-tails.exe'
$Engine=Join-Path $Root 'game\engine\jack.exe'
$Manifest=Join-Path $PSScriptRoot 'install_manifest.json'
$Pre=Join-Path $PSScriptRoot 'JO9_PreInstall.ps1'
$StopServer=Join-Path $PSScriptRoot 'JO9_StopServer.ps1'

if(-not(Test-Path -LiteralPath $RootExe)){throw 'JO9 게임 루트에서 실행해 주세요. Jack-o-nine-tails.exe가 없습니다.'}
if(-not(Test-Path -LiteralPath $Engine)){throw 'game\engine\jack.exe가 없습니다.'}
if(-not(Test-Path -LiteralPath $Manifest)){throw 'install_manifest.json이 없습니다.'}

$items=Get-Content -LiteralPath $Manifest -Raw | ConvertFrom-Json
$currentHash=(Get-FileHash -Algorithm SHA256 -LiteralPath $Engine).Hash.ToLowerInvariant()

Write-Host ''
Write-Host '================================================'
Write-Host 'JO9 Image Workshop - Patch Install / Update'
Write-Host '================================================'
Write-Host ''
Write-Host '변경하는 파일 목록 >'
foreach($x in $items){
    Write-Host ('  - '+[string]$x.destination)
}
Write-Host ''

$unknownEngine=($currentHash -ne $StockHash -and $currentHash -ne $PatchHash)
$existingVersion=Join-Path $Root 'game\modtools\VERSION.txt'

if($currentHash -eq $StockHash){
    Write-Host '[확인] Jack-o-nine-tails 2.3 순정 engine\jack.exe'
}
elseif($currentHash -eq $PatchHash){
    Write-Host '[확인] 기존 JO9 Image Workshop 패치 엔진. 업데이트 설치로 처리합니다.'
}
else{
    Write-Host '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
    Write-Host '2.3 버전 순정파일이 아닙니다.'
    Write-Host '다른 모드와 충돌하지 않는지 점검하세요.'
    Write-Host ('현재 jack.exe SHA256: '+$currentHash)
    Write-Host '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
    Write-Host ''
}

if(Test-Path -LiteralPath $existingVersion){
    try{
        $v=(Get-Content -LiteralPath $existingVersion -Raw).Trim()
        if($v){Write-Host ('기존 game\modtools VERSION: '+$v)}
    }catch{}
}

Write-Host ''
if($unknownEngine){
    $answer=Read-Host '그래도 진행하시겠습니까? 계속하려면 YES 입력'
}else{
    $answer=Read-Host '패치 설치/업데이트를 진행하시겠습니까? 계속하려면 YES 입력'
}
if($answer -cne 'YES'){
    Write-Host '취소했습니다.'
    exit 0
}

# Stop only this game's active processes/helper; do NOT restore stock first.
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $Pre -GameRoot $Root
if($LASTEXITCODE -ne 0){throw '게임 종료 확인 실패'}

& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $StopServer -GameRoot $Root
if($LASTEXITCODE -ne 0){throw '워크샵 서버 종료 실패'}

# Ensure directories. Never delete the whole game\modtools tree.
New-Item -ItemType Directory -Force -Path (Join-Path $Root 'game\modtools') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $Root 'game\modtools\place') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $Root 'game\modtools\runtime') | Out-Null

# Copy exactly the manifest-listed files.
foreach($x in $items){
    $src=Join-Path $PSScriptRoot ([string]$x.source)
    $dst=Join-Path $Root ([string]$x.destination)
    if(-not(Test-Path -LiteralPath $src)){throw ('패키지 파일 없음: '+$src)}
    $parent=Split-Path -Parent $dst
    if(-not(Test-Path -LiteralPath $parent)){
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }
    Copy-Item -LiteralPath $src -Destination $dst -Force -ErrorAction Stop
}

# Verify exactly what was installed.
$failed=@()
foreach($x in $items){
    $dst=Join-Path $Root ([string]$x.destination)
    if(-not(Test-Path -LiteralPath $dst)){
        $failed += ('파일 없음: '+[string]$x.destination)
        continue
    }
    $h=(Get-FileHash -Algorithm SHA256 -LiteralPath $dst).Hash.ToUpperInvariant()
    if($h -ne [string]$x.sha256){
        $failed += ('SHA256 불일치: '+[string]$x.destination)
    }
}
if($failed.Count){
    $failed | ForEach-Object {Write-Host ('[FAILED] '+$_)}
    throw '설치 검증 실패'
}

Write-Host ''
Write-Host '[OK] JO9 Image Workshop 패치 설치/업데이트 완료.'
Write-Host '순정 복구를 선행하지 않았습니다.'
Write-Host '목록에 표시된 파일만 변경했습니다.'
exit 0
