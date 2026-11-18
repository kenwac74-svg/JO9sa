param([string]$StudioRoot='', [hashtable]$ToolUrls=@{}, [int]$Port=7689, [int]$ReplaceStudioPid=0, [switch]$NoBrowser)
$ErrorActionPreference='Stop'
$hubDir=$PSScriptRoot
$runtimeDir=Join-Path $hubDir 'runtime'
New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
$readyFile=Join-Path $runtimeDir 'server.json'
$urlsFile=Join-Path $runtimeDir 'tool-urls.json'
$serverScript=Join-Path $hubDir 'server.py'
$old=$null
if (Test-Path -LiteralPath $readyFile) { $old=Get-Content -LiteralPath $readyFile -Raw -Encoding UTF8 | ConvertFrom-Json }
if (!$StudioRoot -and $old) {$StudioRoot=[string]$old.studioRoot}
if (!$StudioRoot) {
 $candidate=Join-Path $hubDir '../jo9-history-lab'
 if (Test-Path -LiteralPath (Join-Path $candidate 'studio_server.py')) {$StudioRoot=[IO.Path]::GetFullPath($candidate)}
}
if (!$StudioRoot -or !(Test-Path -LiteralPath (Join-Path $StudioRoot 'studio_server.py'))) {throw '클로드 편집기 경로가 필요합니다. -StudioRoot로 기존 jo9-history-lab 폴더를 지정하세요.'}
$StudioRoot=[IO.Path]::GetFullPath($StudioRoot)
if ($ToolUrls.Count) {[IO.File]::WriteAllText($urlsFile,($ToolUrls | ConvertTo-Json -Depth 5),[Text.UTF8Encoding]::new($false))}
if (!(Test-Path -LiteralPath $urlsFile)) {throw '기존 모드툴 주소가 없습니다. Open-Modding-Tools.ps1로 실행하세요.'}
$stream=New-Object IO.MemoryStream
foreach ($name in @('server.py','helper_dashboard.py','helper_dashboard_html.py','helper-dashboard.css','data/slave-status-formulas.html','image_tool_runtime.py','Start-Image-Tool.ps1','tool-runtime.mjs','registry.py','integration.mjs','integration.css','app_launcher.py','embedded-tools.css','workspace.html','workspace-app.mjs','workspace-router.mjs','workspace-menu.json','overrides/workbench.mjs','overrides/trait-editor.mjs','overrides/studio-save.mjs','overrides/studio-db.mjs','overrides/studio-ai.mjs','overrides/studio-look.mjs','overrides/studio-look-geometry.mjs','master_editor.py','master_initials.py','general_dialogue.py','overrides/past-history.mjs','overrides/sim-data.mjs','overrides/coef-view.mjs','overrides/sim-view.mjs','overrides/pillow-talk.mjs','overrides/character-view.mjs','overrides/general-dialogue.mjs','overrides/studio-view.mjs','overrides/studio-role.mjs','game_presentation.py','overrides/game-presentation.mjs','overrides/initial-preview.mjs','runtime_initials.py','runtime-initials.cjs','acquisition-routes-runtime.json','overrides/runtime-initials.mjs','appearance_sharing.py','appearance-sharing.cjs','spawn_warning.py','spawn-policy-registry.json','overrides/spawn-notice.mjs','background_metadata.py','data/background-classifications.json','overrides/background-metadata.mjs','vendor/qsp/wasm-engine.cjs','vendor/qsp/qsp-engine.wasm')) {$block=[IO.File]::ReadAllBytes((Join-Path $hubDir $name));$stream.Write($block,0,$block.Length)}
$build=([BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($stream.ToArray())).Replace('-','').ToLowerInvariant()).Substring(0,16)
$stream.Dispose()
if ($old) {
 $owned=Get-CimInstance Win32_Process -Filter ('ProcessId='+[int]$old.pid) -ErrorAction SilentlyContinue
 if ($owned) {
  if (!$owned.CommandLine.Replace('/','\').Contains($serverScript.Replace('/','\'))) {throw '통합 도구 기록의 프로세스가 다릅니다. 다른 프로그램은 종료하지 않았습니다.'}
  if ($old.build -eq $build -and [string]$old.studioRoot -ieq $StudioRoot -and (!$PSBoundParameters.ContainsKey('Port') -or ([uri]$old.url).Port -eq $Port)) {
   try {$health=Invoke-RestMethod ([string]$old.url+'workspace/config') -TimeoutSec 3} catch {throw '기존 통합 도구가 응답하지 않습니다. 새 서버를 중복 실행하지 않았습니다.'}
   if ($health.app -eq 'jo9-modding-hub' -and $health.build -eq $build) {
    Write-Output $old.url
    if (!$NoBrowser) {Start-Process $old.url}
    exit 0
   }
  }
  if (!$PSBoundParameters.ContainsKey('Port')) {$Port=([uri]$old.url).Port}
  Stop-Process -Id $old.pid -ErrorAction Stop
  Wait-Process -Id $old.pid -Timeout 5 -ErrorAction SilentlyContinue
 }
}
if ($ReplaceStudioPid) {
 $prior=Get-CimInstance Win32_Process -Filter ('ProcessId='+$ReplaceStudioPid) -ErrorAction Stop
 $listeners=@(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Where-Object {$_.OwningProcess -eq $ReplaceStudioPid})
 if (!$prior.CommandLine.Contains('from studio_server import make_server; make_server(') -or !$listeners.Count) {throw '교체 대상이 기존 클로드 편집기와 일치하지 않습니다.'}
 Stop-Process -Id $ReplaceStudioPid -ErrorAction Stop
 Wait-Process -Id $ReplaceStudioPid -Timeout 5 -ErrorAction SilentlyContinue
}
# Reuse the source browser launcher's port range without stopping another program.
$availablePort=0
$busyPorts=@(Get-NetTCPConnection -State Listen -ErrorAction Stop | Select-Object -ExpandProperty LocalPort -Unique)
foreach ($candidatePort in (@($Port)+@(7689..7709) | Select-Object -Unique)) {
 if ($busyPorts -contains $candidatePort) {continue}
 $probe=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,[int]$candidatePort)
 # Match HTTPServer's address reuse after our own server closes (TIME_WAIT).
 $probe.Server.ExclusiveAddressUse=$false
 $probe.Server.SetSocketOption([Net.Sockets.SocketOptionLevel]::Socket,[Net.Sockets.SocketOptionName]::ReuseAddress,$true)
 try {$probe.Start();$availablePort=[int]$candidatePort;break} catch [Net.Sockets.SocketException] {} finally {$probe.Stop()}
}
if (!$availablePort) {throw '7689~7709 포트가 모두 사용 중입니다. 다른 프로그램은 종료하지 않았습니다.'}
if ($availablePort -ne $Port) {Write-Warning ('기본 포트가 사용 중이므로 '+$availablePort+' 포트로 엽니다. 브라우저 설정 저장소는 포트별로 분리됩니다.')}
$Port=$availablePort
$python=(Get-Command py.exe -ErrorAction SilentlyContinue).Source
$pythonArgs=@('-3')
if (!$python) {$python=(Get-Command python.exe -ErrorAction Stop).Source;$pythonArgs=@()}
$env:PYTHONIOENCODING='utf-8'
$repoRoot=[IO.Path]::GetFullPath((Join-Path $hubDir '../..'))
$env:JO9_REPO_ROOT=$repoRoot
$backend=[IO.Path]::GetFullPath((Join-Path $StudioRoot '../character-image-adder'))
if (Test-Path -LiteralPath (Join-Path $backend 'add_character.py')) {$env:JO9_IMAGE_TOOL=$backend}
$arguments=$pythonArgs+@('-u',('"'+$serverScript+'"'),'--studio',('"'+$StudioRoot+'"'),'--repo',('"'+$repoRoot+'"'),'--urls',('"'+$urlsFile+'"'),'--ready',('"'+$readyFile+'"'),'--port',$Port)
$process=Start-Process -FilePath $python -ArgumentList $arguments -WorkingDirectory $hubDir -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeDir 'stdout.log') -RedirectStandardError (Join-Path $runtimeDir 'stderr.log')
for ($attempt=0;$attempt -lt 60;$attempt++) {
 if (Test-Path -LiteralPath $readyFile) {
  $state=Get-Content -LiteralPath $readyFile -Raw -Encoding UTF8 | ConvertFrom-Json
  if ([int]$state.pid -ne 0 -and [string]$state.build -eq $build) {
   try {$health=Invoke-RestMethod ([string]$state.url+'workspace/config') -TimeoutSec 2} catch {$health=$null}
   if ($health -and $health.app -eq 'jo9-modding-hub' -and $health.build -eq $build) {
    Write-Output $state.url
    if (!$NoBrowser) {Start-Process $state.url}
    exit 0
   }
  }
 }
 if ($process.HasExited) {throw (Get-Content -LiteralPath (Join-Path $runtimeDir 'stderr.log') -Raw)}
 Start-Sleep -Milliseconds 200
}
throw '통합 도구 시작 시간을 초과했습니다. runtime/stderr.log를 확인하세요.'
