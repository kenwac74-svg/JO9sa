param([int]$Port=8790)
$launchMutex=New-Object Threading.Mutex($false,'Local\JO9JontRemakeLaunch')
$held=$false
try {
 try {$held=$launchMutex.WaitOne(15000)} catch [Threading.AbandonedMutexException] {$held=$true}
 if (!$held) {throw '장면 프롬프트 도구가 이미 시작 중입니다.'}
$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$runtime=Join-Path $root 'runtime'
New-Item -ItemType Directory -Path $runtime -Force | Out-Null
$ready=Join-Path $runtime 'server.json'
$script=Join-Path $root 'hub-server.mjs'
$data=New-Object IO.MemoryStream
foreach ($name in @('hub-server.mjs','hub-client.js','remake.mjs','worksheet.html')) {$bytes=[IO.File]::ReadAllBytes((Join-Path $root $name));$data.Write($bytes,0,$bytes.Length)}
$build=([BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($data.ToArray())).Replace('-','').ToLowerInvariant()).Substring(0,16)
$data.Dispose()
if (Test-Path -LiteralPath $ready) {
 $old=Get-Content -LiteralPath $ready -Raw -Encoding UTF8 | ConvertFrom-Json
 $owned=Get-CimInstance Win32_Process -Filter ('ProcessId='+[int]$old.pid) -ErrorAction SilentlyContinue
 if ($owned) {
  if (!$owned.CommandLine.Replace('/','\').Contains($script.Replace('/','\'))) {throw '장면 프롬프트 실행 기록의 프로세스가 다릅니다. 다른 프로그램은 종료하지 않았습니다.'}
  if ($old.build -eq $build) {
   $health=Invoke-RestMethod ([string]$old.url+'api/hub/status') -TimeoutSec 3
   if ($health.app -eq 'jont-remake-hub' -and [int]$health.pid -eq [int]$old.pid -and $health.build -eq $build) {Write-Output $old.url;exit 0}
  }
  $Port=([uri]$old.url).Port
 }
 if ($old.nativePid) {
  $native=Get-CimInstance Win32_Process -Filter ('ProcessId='+[int]$old.nativePid) -ErrorAction SilentlyContinue
  if ($native) {
   if (!$native.CommandLine.Replace('/','\').Contains((Join-Path $root 'remake.mjs').Replace('/','\'))) {throw '기존 작업표 서버의 소유권이 다릅니다. 종료하지 않았습니다.'}
   Stop-Process -Id $old.nativePid -ErrorAction Stop
  }
 }
 if ($owned) {Stop-Process -Id $old.pid -ErrorAction Stop;Wait-Process -Id $old.pid -Timeout 5 -ErrorAction SilentlyContinue}
}
$node=(Get-Command node.exe -ErrorAction Stop).Source
$env:PYTHONIOENCODING='utf-8'
$process=Start-Process -FilePath $node -ArgumentList @(('"'+$script+'"'),'--port',$Port) -WorkingDirectory $root -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtime 'stdout.log') -RedirectStandardError (Join-Path $runtime 'stderr.log')
for ($attempt=0;$attempt -lt 80;$attempt++) {
 if (Test-Path -LiteralPath $ready) {
  $state=Get-Content -LiteralPath $ready -Raw -Encoding UTF8 | ConvertFrom-Json
  if ([int]$state.pid -eq $process.Id -and $state.build -eq $build) {
   try {$health=Invoke-RestMethod ([string]$state.url+'api/hub/status') -TimeoutSec 2} catch {$health=$null}
   if ($health -and [int]$health.pid -eq $process.Id) {Write-Output $state.url;exit 0}
  }
 }
 $process.Refresh();if ($process.HasExited) {throw (Get-Content -LiteralPath (Join-Path $runtime 'stderr.log') -Raw -Encoding UTF8)}
 Start-Sleep -Milliseconds 150
}
throw '장면 프롬프트 도구 시작 시간을 초과했습니다.'

} finally {if ($held) {$launchMutex.ReleaseMutex()};$launchMutex.Dispose()}
