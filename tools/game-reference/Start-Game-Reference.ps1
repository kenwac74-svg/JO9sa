param([switch]$NoBrowser)
$ErrorActionPreference='Stop'
$referenceRoot=[IO.Path]::GetFullPath($PSScriptRoot)
$referenceServer=Join-Path $referenceRoot 'serve.cjs'
$referenceRuntime=Join-Path $referenceRoot 'runtime'
$referenceReady=Join-Path $referenceRuntime 'server.json'
$referenceHash=[BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($referenceRoot.ToLowerInvariant()))).Replace('-','')
$referenceMutex=New-Object Threading.Mutex($false,('Local\JO9GameReference_'+$referenceHash))
$referenceLocked=$false
try {
 try {$referenceLocked=$referenceMutex.WaitOne(10000)} catch [Threading.AbandonedMutexException] {$referenceLocked=$true}
 if (!$referenceLocked) {throw 'Reference tool launch is already running.'}
 $referenceUrl=''
 if (Test-Path -LiteralPath $referenceReady) {
  $referenceInfo=Get-Content -LiteralPath $referenceReady -Raw -Encoding UTF8 | ConvertFrom-Json
  $referenceProcess=Get-CimInstance Win32_Process -Filter ('ProcessId='+[int]$referenceInfo.pid) -ErrorAction SilentlyContinue
  if ($referenceProcess) {
   if ([string]$referenceInfo.root -ine $referenceRoot -or !$referenceProcess.CommandLine.Replace('/','\').Contains($referenceServer)) {throw 'Reference runtime owner differs; no process was stopped.'}
   $referenceHealth=Invoke-RestMethod ([string]$referenceInfo.url+'api/status') -TimeoutSec 3
   if ($referenceHealth.app -ne 'jo9-game-reference' -or [int]$referenceHealth.pid -ne [int]$referenceInfo.pid) {throw 'Reference server identity mismatch.'}
   $referenceUrl=[string]$referenceInfo.url
  }
 }
 if (!$referenceUrl) {
  New-Item -ItemType Directory -Path $referenceRuntime -Force | Out-Null
  if (Test-Path -LiteralPath $referenceReady) {Remove-Item -LiteralPath $referenceReady -Force}
  $referenceNode=(Get-Command node.exe -ErrorAction Stop).Source
  $referenceArgs='"'+$referenceServer+'" 0 --ready "'+$referenceReady+'"'
  $referenceStarted=Start-Process -FilePath $referenceNode -ArgumentList $referenceArgs -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $referenceRuntime 'server.log') -RedirectStandardError (Join-Path $referenceRuntime 'error.log')
  for ($referenceAttempt=0;$referenceAttempt -lt 60;$referenceAttempt++) {
   if (Test-Path -LiteralPath $referenceReady) {
    $referenceInfo=Get-Content -LiteralPath $referenceReady -Raw -Encoding UTF8 | ConvertFrom-Json
    if ([int]$referenceInfo.pid -ne $referenceStarted.Id) {throw 'Unexpected reference server process.'}
    $referenceHealth=Invoke-RestMethod ([string]$referenceInfo.url+'api/status') -TimeoutSec 3
    if ($referenceHealth.app -eq 'jo9-game-reference' -and [int]$referenceHealth.pid -eq $referenceStarted.Id) {$referenceUrl=[string]$referenceInfo.url;break}
   }
   $referenceStarted.Refresh();if ($referenceStarted.HasExited) {throw 'Reference server exited. See runtime/error.log.'}
   Start-Sleep -Milliseconds 100
  }
  if (!$referenceUrl) {throw 'Reference server startup timed out.'}
 }
 Write-Output $referenceUrl
 if (!$NoBrowser) {Start-Process $referenceUrl}
} finally {if ($referenceLocked) {$referenceMutex.ReleaseMutex()};$referenceMutex.Dispose()}
