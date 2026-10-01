# 새 PC에서 JO9 모딩 환경(Claude Code, VS Code 확장)을 준비하는 스크립트
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot

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

Write-Host '완료. 터미널에서 claude를 실행해 로그인하세요(계정 로그인만 직접 해야 합니다).'
