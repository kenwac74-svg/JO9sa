# local.config.json의 게임을 실행(이미 켜져 있으면 재사용)하고 게임 창을 캡처하는 스크립트
param(
	[string]$Out = (Join-Path (Split-Path -Parent $PSScriptRoot) 'compare\jo9_game_window.png'),
	[int]$StartupTimeoutSeconds = 30
)
$ErrorActionPreference = 'Stop'
$configPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'local.config.json'
if (-not (Test-Path -LiteralPath $configPath)) {
	throw "로컬 설정이 없습니다. 먼저 tools\setup_pc.ps1을 실행하세요: $configPath"
}
$config = Get-Content -LiteralPath $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
if (-not (Test-Path -LiteralPath $config.GameExe)) { throw "게임 실행 파일이 없습니다: $($config.GameExe)" }

$process = Get-Process -Name $config.ProcessName -ErrorAction SilentlyContinue |
	Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -like "*$($config.WindowTitle)*" } |
	Select-Object -First 1
if (-not $process) {
	$process = Start-Process -FilePath $config.GameExe -WorkingDirectory $config.GameRoot -PassThru -WindowStyle Normal
}
$deadline = (Get-Date).AddSeconds($StartupTimeoutSeconds)
do {
	$gameProcess = Get-Process -Name $config.ProcessName -ErrorAction SilentlyContinue |
		Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -like "*$($config.WindowTitle)*" } |
		Select-Object -First 1
	if ($gameProcess) { break }
	Start-Sleep -Milliseconds 250
} while ((Get-Date) -lt $deadline)
if (-not $gameProcess) { throw "게임 창을 ${StartupTimeoutSeconds}초 안에 찾지 못했습니다. 실행 프로세스: $($config.ProcessName)" }

$outDirectory = Split-Path -Parent $Out
if ($outDirectory -and -not (Test-Path -LiteralPath $outDirectory)) {
	New-Item -ItemType Directory -Path $outDirectory -Force | Out-Null
}
& (Join-Path $PSScriptRoot 'screenshot.ps1') -Out $Out -Title $config.WindowTitle -ProcessName $config.ProcessName
Write-Host "PID=$($gameProcess.Id)"
Write-Host "SHOT=$Out"
