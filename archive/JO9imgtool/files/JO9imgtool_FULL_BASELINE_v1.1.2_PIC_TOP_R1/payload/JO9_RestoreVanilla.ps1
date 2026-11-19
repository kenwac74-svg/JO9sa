param(
    [Parameter(Mandatory=$true)][string]$GameRoot,
    [switch]$DryRun
)

$ErrorActionPreference='Stop'
$StockHash='fc70f16821a7827ffeb95a6b77eb55b5bf0bc05e4d761c459eb6e8e29affbecc'
$PatchHash='b9b23c4399b822a334bfeb7d2fcd7984b9b5b71d68e3879129f63df3a54699f3'

$Root=[IO.Path]::GetFullPath($GameRoot).TrimEnd('\')
$RootExe=Join-Path $Root 'Jack-o-nine-tails.exe'
$Engine=Join-Path $Root 'game\engine\jack.exe'
$StockSource=Join-Path $PSScriptRoot 'original_jack.exe'
$StopServer=Join-Path $PSScriptRoot 'JO9_StopServer.ps1'
$StopGame=Join-Path $PSScriptRoot 'JO9_StopGameExact.ps1'

$OwnedFiles=@(
    'game\\modtools\\JO9_Launch.cmd',
    'game\\modtools\\JO9_Detect.ps1',
    'game\\modtools\\JO9_Server.ps1',
    'game\\modtools\\place\\JO9_Place_Workshop.html',
    'game\\modtools\\runtime\\context.json',
    'game\\modtools\\filters.json',
    'game\\modtools\\config.json',
    'game\\modtools\\VERSION.txt'
)

if(-not(Test-Path -LiteralPath $RootExe)){throw 'JO9 게임 루트에서 실행해 주세요.'}
if(-not(Test-Path -LiteralPath $StockSource)){throw 'original_jack.exe가 없습니다.'}

$stockSourceHash=(Get-FileHash -Algorithm SHA256 -LiteralPath $StockSource).Hash.ToLowerInvariant()
if($stockSourceHash -ne $StockHash){throw '패키지 순정 엔진 SHA256 검증 실패'}

$currentHash=''
if(Test-Path -LiteralPath $Engine){
    $currentHash=(Get-FileHash -Algorithm SHA256 -LiteralPath $Engine).Hash.ToLowerInvariant()
}

Write-Host ''
Write-Host '================================================'
Write-Host 'JO9 Image Workshop - 순정 복구'
Write-Host '================================================'
Write-Host ''
Write-Host '변경하는 파일 목록 >'
Write-Host '  - game\engine\jack.exe  (2.3 순정으로 복원)'
foreach($rel in $OwnedFiles){
    Write-Host ('  - '+$rel+'  (JO9 Image Workshop 파일 제거)')
}
Write-Host ''

if($currentHash -and $currentHash -ne $PatchHash -and $currentHash -ne $StockHash){
    Write-Host '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
    Write-Host '현재 jack.exe가 JO9 Image Workshop 패치 엔진도, 2.3 순정 엔진도 아닙니다.'
    Write-Host '순정 복구를 진행하면 다른 엔진 모드 변경사항이 사라질 수 있습니다.'
    Write-Host ('현재 jack.exe SHA256: '+$currentHash)
    Write-Host '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
    Write-Host ''
}

if($DryRun){
    Write-Host '[DRY-RUN] 실제 변경 없음'
    exit 0
}

$answer=Read-Host '순정 복구를 진행하려면 VANILLA 입력'
if($answer -cne 'VANILLA'){
    Write-Host '취소했습니다.'
    exit 0
}

if(Test-Path -LiteralPath $StopServer){
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $StopServer -GameRoot $Root
    if($LASTEXITCODE -ne 0){throw '워크샵 서버 종료 실패'}
}
if(Test-Path -LiteralPath $StopGame){
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $StopGame -GameRoot $Root -WaitSeconds 8
    if($LASTEXITCODE -ne 0){throw 'JO9 실행 프로세스 종료 실패'}
}

# Restore engine to stock with staged hash check.
$engineDir=Split-Path -Parent $Engine
$stage=Join-Path $engineDir 'jack.exe.jo9_stock_stage'
Copy-Item -LiteralPath $StockSource -Destination $stage -Force
$stageHash=(Get-FileHash -Algorithm SHA256 -LiteralPath $stage).Hash.ToLowerInvariant()
if($stageHash -ne $StockHash){
    Remove-Item -LiteralPath $stage -Force -ErrorAction SilentlyContinue
    throw '순정 엔진 임시 복사 검증 실패'
}

if(Test-Path -LiteralPath $Engine){
    Remove-Item -LiteralPath $Engine -Force -ErrorAction Stop
}
Move-Item -LiteralPath $stage -Destination $Engine -Force

$finalHash=(Get-FileHash -Algorithm SHA256 -LiteralPath $Engine).Hash.ToLowerInvariant()
if($finalHash -ne $StockHash){throw '순정 jack.exe 최종 검증 실패'}

# Remove only this patch's owned files.
foreach($rel in $OwnedFiles){
    $p=Join-Path $Root $rel
    if(Test-Path -LiteralPath $p){
        Remove-Item -LiteralPath $p -Force -ErrorAction Stop
    }
}

# Remove our runtime leftovers if present.
foreach($rel in @(
    'game\modtools\runtime\detect.log',
    'game\modtools\runtime\detect.log.1',
    'game\modtools\runtime\server.log',
    'game\modtools\runtime\server.log.1',
    'game\modtools\runtime\viewer_hwnd.txt',
    'game\modtools\runtime\server.pid',
    'game\modtools\runtime\port.txt'
)){
    $p=Join-Path $Root $rel
    if(Test-Path -LiteralPath $p){
        Remove-Item -LiteralPath $p -Force -ErrorAction SilentlyContinue
    }
}

# Only remove directories if empty. Preserve unrelated mod files.
foreach($rel in @('game\modtools\place','game\modtools\runtime','game\modtools')){
    $d=Join-Path $Root $rel
    if(Test-Path -LiteralPath $d){
        $left=@(Get-ChildItem -LiteralPath $d -Force -ErrorAction SilentlyContinue)
        if(-not $left.Count){
            Remove-Item -LiteralPath $d -Force -ErrorAction SilentlyContinue
        }
    }
}

# Final proof.
$proof=(Get-FileHash -Algorithm SHA256 -LiteralPath $Engine).Hash.ToLowerInvariant()
if($proof -ne $StockHash){throw '최종 순정 엔진 검증 실패'}

Write-Host ''
Write-Host '[OK] JO9 Image Workshop 패치 제거 + 2.3 순정 엔진 복구 완료.'
Write-Host '다른 game\modtools 파일은 삭제하지 않았습니다.'
Write-Host 'content\pic / save / jack.qsp는 건드리지 않았습니다.'
exit 0
