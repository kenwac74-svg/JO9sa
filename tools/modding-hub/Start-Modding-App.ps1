param([string]$StudioRoot='', [hashtable]$ToolUrls=@{})
$ErrorActionPreference='Stop'
$hubDir=$PSScriptRoot
$browserUrl=(& (Join-Path $hubDir 'Start-Modding-Hub.ps1') -StudioRoot $StudioRoot -ToolUrls $ToolUrls -NoBrowser | Select-Object -Last 1)
$runtimeDir=Join-Path $hubDir 'runtime'
$browserState=Get-Content -LiteralPath (Join-Path $runtimeDir 'server.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$readyFile=Join-Path $runtimeDir 'app.json'
$script=Join-Path $hubDir 'app_launcher.py'
if (Test-Path -LiteralPath $readyFile) {
 $old=Get-Content -LiteralPath $readyFile -Raw -Encoding UTF8 | ConvertFrom-Json
 $owned=Get-CimInstance Win32_Process -Filter ('ProcessId='+[int]$old.pid) -ErrorAction SilentlyContinue
 if ($owned) {
  if (!$owned.CommandLine.Replace('/','\').Contains($script.Replace('/','\'))) {throw '전용 창 기록의 프로세스가 다릅니다. 다른 프로그램은 종료하지 않았습니다.'}
  if ($old.build -ne $browserState.build -or [string]$old.studioRoot -ine [string]$browserState.studioRoot) {throw '이전 버전의 전용 창이 열려 있습니다. 편집 중인 내용을 저장하고 그 창을 닫은 뒤 다시 실행하세요.'}
  $health=Invoke-RestMethod ([string]$old.url+'workspace/config') -TimeoutSec 3
  if ($health.app -ne 'jo9-modding-hub' -or $health.build -ne $old.build) {throw '기존 전용 창이 응답하지 않습니다. 중복 창을 실행하지 않았습니다.'}
  $shell=New-Object -ComObject WScript.Shell
  $null=$shell.AppActivate([int]$old.pid)
  Write-Output $old.url
  exit 0
 }
}
$python=(Get-Command py.exe -ErrorAction SilentlyContinue).Source
$pythonArgs=@('-3')
if (!$python) {$python=(Get-Command python.exe -ErrorAction Stop).Source;$pythonArgs=@()}
& $python @pythonArgs -c 'import webview' 2>$null
if ($LASTEXITCODE -ne 0) {throw '전용 창에는 pywebview가 필요합니다. py -3 -m pip install pywebview 후 다시 실행하거나 브라우저 실행을 사용하세요.'}
# pythonw keeps the launcher console out of the way while showing the actual app.
# Hiding this process also hides its first WebView2 window on Windows.
$interpreter=(& $python @pythonArgs -c 'import sys;print(sys.executable)' | Select-Object -Last 1)
$pythonw=Join-Path (Split-Path -Parent $interpreter) 'pythonw.exe'
if (Test-Path -LiteralPath $pythonw) {$python=$pythonw;$pythonArgs=@()}
$env:PYTHONIOENCODING='utf-8'
$repoRoot=[IO.Path]::GetFullPath((Join-Path $hubDir '../..'))
$env:JO9_REPO_ROOT=$repoRoot
$backend=[IO.Path]::GetFullPath((Join-Path $browserState.studioRoot '../character-image-adder'))
if (Test-Path -LiteralPath (Join-Path $backend 'add_character.py')) {$env:JO9_IMAGE_TOOL=$backend}
$arguments=$pythonArgs+@('-u',('"'+$script+'"'),'--studio',('"'+$browserState.studioRoot+'"'),'--repo',('"'+$repoRoot+'"'),'--urls',('"'+(Join-Path $runtimeDir 'tool-urls.json')+'"'),'--ready',('"'+$readyFile+'"'))
$process=Start-Process -FilePath $python -ArgumentList $arguments -WorkingDirectory $hubDir -WindowStyle Normal -PassThru -RedirectStandardOutput (Join-Path $runtimeDir 'app.stdout.log') -RedirectStandardError (Join-Path $runtimeDir 'app.stderr.log')
for ($attempt=0;$attempt -lt 100;$attempt++) {
 if (Test-Path -LiteralPath $readyFile) {
  $state=Get-Content -LiteralPath $readyFile -Raw -Encoding UTF8 | ConvertFrom-Json
  if ([string]$state.build -eq [string]$browserState.build) {
   try {$health=Invoke-RestMethod ([string]$state.url+'workspace/config') -TimeoutSec 2} catch {$health=$null}
   if ($health -and $health.build -eq $state.build) {Write-Output $state.url;exit 0}
  }
 }
 $process.Refresh()
 if ($process.HasExited) {throw (Get-Content -LiteralPath (Join-Path $runtimeDir 'app.stderr.log') -Raw -Encoding UTF8)}
 Start-Sleep -Milliseconds 200
}
throw '전용 창 시작 시간을 초과했습니다. runtime/app.stderr.log를 확인하세요.'
