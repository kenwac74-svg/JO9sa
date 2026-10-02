# 새 PC에서 JO9 모딩 환경(git, Claude Code, VS Code 확장, 사용자가 지정한 게임 경로 설정)을 준비하는 스크립트
param(
    # 게임 설치 폴더(Jack-o-nine-tails.exe가 있는 폴더). 비우면 폴더 선택 창이 뜬다.
    [string]$GameRoot = '',
    # Claude Code 설치와 VS Code 확장 설치를 건너뛰고 게임 경로만 설정한다.
    [switch]$GameOnly
)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot

if (-not $GameOnly) {
    # 1. git 확인
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Warning 'git이 없습니다. https://git-scm.com 에서 설치한 뒤 다시 실행하세요.'
        exit 1
    }

    # 2. Claude Code 설치와 PATH
    $bin = Join-Path $env:USERPROFILE '.local\bin'
    $exe = Join-Path $bin 'claude.exe'
    if (-not (Get-Command claude -ErrorAction SilentlyContinue) -and -not (Test-Path $exe)) {
        Write-Host 'Claude Code를 설치합니다.'
        Invoke-RestMethod https://claude.ai/install.ps1 | Invoke-Expression
    }
    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    if ($userPath -notlike "*$bin*") {
        [Environment]::SetEnvironmentVariable('Path', "$userPath;$bin", 'User')
        Write-Host "사용자 PATH에 $bin 을 추가했습니다. 터미널을 새로 열어야 반영됩니다."
    }

    # 3. VS Code 확장
    if (Get-Command code -ErrorAction SilentlyContinue) {
        $rec = Get-Content (Join-Path $repo '.vscode\extensions.json') -Raw | ConvertFrom-Json
        foreach ($id in $rec.recommendations) { code --install-extension $id | Out-Null }
        Write-Host 'VS Code 확장을 설치했습니다.'
    } else {
        Write-Warning 'code 명령이 없어 VS Code 확장은 건너뜁니다. 확장 탭에서 직접 설치하세요.'
    }

    # 3-1. 이미지 편집 UI용 Node 패키지(선택)
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        Push-Location $repo
        try { npm install --no-audit --no-fund | Out-Null; Write-Host '이미지 편집 UI용 Node 패키지를 설치했습니다.' } finally { Pop-Location }
    } else {
        Write-Warning 'Node.js가 없어 이미지 편집 UI 준비는 건너뜁니다. 쓰려면 https://nodejs.org 에서 LTS를 설치한 뒤 다시 실행하세요.'
    }
}

# 4. 게임 경로(사용자가 직접 지정)
if ([string]::IsNullOrWhiteSpace($GameRoot)) {
    Add-Type -AssemblyName System.Windows.Forms
    $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $dialog.Description = 'Jack-o-nine-tails 2.3.2.5 Korean 게임 설치 폴더(Jack-o-nine-tails.exe가 있는 폴더)를 선택하세요.'
    try {
        if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
            Write-Warning '게임 폴더를 선택하지 않아 경로 설정을 건너뜁니다. 나중에 -GameRoot로 다시 실행하세요.'
            exit 1
        }
        $GameRoot = $dialog.SelectedPath
    } finally {
        $dialog.Dispose()
    }
}
$GameRoot = [IO.Path]::GetFullPath($GameRoot.Trim().Trim('"'))
$gameExe = Join-Path $GameRoot 'Jack-o-nine-tails.exe'
$gameQsp = Join-Path $GameRoot 'game\jack.qsp'
$engineExe = Join-Path $GameRoot 'game\engine\jack.exe'
foreach ($file in @($gameExe, $gameQsp, $engineExe)) {
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { throw "필수 게임 파일을 찾을 수 없습니다: $file" }
}
$configPath = Join-Path $repo 'local.config.json'
[ordered]@{
    GameRoot    = $GameRoot
    GameExe     = $gameExe
    GameQsp     = $gameQsp
    EngineExe   = $engineExe
    WindowTitle = 'Jack-o-nine-tails'
    ProcessName = 'jack'
} | ConvertTo-Json | Set-Content -LiteralPath $configPath -Encoding UTF8
Write-Host "게임 파일 확인 완료: $GameRoot"
Write-Host "로컬 설정 저장(git 제외): $configPath"

Write-Host ''
Write-Host '다음 단계:'
Write-Host '  이미지 설치: dist\JO9_mod_assets.zip을 두고 powershell -ExecutionPolicy Bypass -File tools\mod_assets.ps1 -Install'
Write-Host '  패치 적용: powershell -ExecutionPolicy Bypass -File tools\apply_mods.ps1'
Write-Host '  화면 확인: powershell -ExecutionPolicy Bypass -File tools\launch_and_capture.ps1'
Write-Host '  터미널에서 claude를 실행해 로그인하세요(계정 로그인만 직접 해야 합니다).'
