param([string]$GameDir='', [string]$OriginalDir='', [string]$CatalogDir='', [string]$RuntimeDir='', [string]$ConfigFile='', [string]$NodePath='', [int]$Port=0, [switch]$NoBrowser, [string]$WorkspaceLauncher='')
$ErrorActionPreference='Stop'
# Release entry point: all defaults belong to the extracted package.
$toolRoot=Split-Path -Parent $PSScriptRoot
if (!$GameDir) {$GameDir=Split-Path -Parent $toolRoot}
$GameDir=(Resolve-Path -LiteralPath $GameDir).Path
if (!(Test-Path -LiteralPath (Join-Path $GameDir 'jack.qsp'))) {throw 'jack.qsp is missing from this game folder.'}
if (!$CatalogDir) {$CatalogDir=Join-Path $toolRoot 'catalog'}
if (!$RuntimeDir) {$RuntimeDir=Join-Path $PSScriptRoot 'runtime'}
if (!$NodePath) {$NodePath=Join-Path $toolRoot 'runtime-bundle\node.exe'}
$server=Join-Path $PSScriptRoot 'server.cjs'
$readyFile=Join-Path $RuntimeDir 'server.json'
$target=[IO.Path]::GetFullPath((Join-Path $GameDir 'jack.qsp'))
$originalPic=Join-Path $GameDir 'content\jo9o_original_cuts'
if (!(Test-Path -LiteralPath $NodePath)) {throw 'The bundled WORKSHOP Node runtime is missing.'}
if (!(Test-Path -LiteralPath $server)) {throw 'The WORKSHOP server is missing.'}
if (!(Test-Path -LiteralPath (Join-Path $CatalogDir 'catalog_merge_vs_original.html'))) {throw 'The bundled WORKSHOP catalog is missing.'}
New-Item -ItemType Directory -Path $RuntimeDir,$CatalogDir,$originalPic -Force | Out-Null

function Read-CommandTokens([string]$value) {
 return @([regex]::Matches($value,'"([^"]*)"|(\S+)') | ForEach-Object {if ($_.Groups[1].Success) {$_.Groups[1].Value} else {$_.Groups[2].Value}})
}
function Read-EditorReady {
 if (!(Test-Path -LiteralPath $readyFile)) {return $null}
 try {
  $state=Get-Content -LiteralPath $readyFile -Raw -Encoding UTF8 | ConvertFrom-Json
  if ([IO.Path]::GetFullPath($state.target) -ne $target) {return $null}
  $uri=[Uri]$state.url
  if ($uri.Scheme -ne 'http' -or $uri.Host -ne '127.0.0.1' -or $uri.AbsolutePath -ne '/') {return $null}
  $process=Get-CimInstance Win32_Process -Filter ('ProcessId='+[int]$state.pid) -ErrorAction SilentlyContinue
  if (!$process) {return $null}
  $tokens=Read-CommandTokens $process.CommandLine
  if ($tokens.Count -lt 2 -or [IO.Path]::GetFullPath($tokens[1]) -ne [IO.Path]::GetFullPath($server)) {return $null}
  $response=Invoke-RestMethod ($state.url+'api/workshop/ready') -TimeoutSec 2
  if (!$response.alive -or [int]$response.pid -ne [int]$state.pid -or [IO.Path]::GetFullPath($response.target) -ne $target) {return $null}
  return $state
 } catch {return $null}
}
function Ensure-ImageServer {
 $imageRuntime=Join-Path $toolRoot 'runtime'
 $imageScript=Join-Path $toolRoot 'JO9_Server.ps1'
 New-Item -ItemType Directory -Path $imageRuntime -Force | Out-Null
 $portFile=Join-Path $imageRuntime 'port.txt'
 $pidFile=Join-Path $imageRuntime 'server.pid'
 try {
  $imagePort=[int](Get-Content -LiteralPath $portFile -Raw)
  $imagePid=[int](Get-Content -LiteralPath $pidFile -Raw)
  $process=Get-CimInstance Win32_Process -Filter ('ProcessId='+$imagePid) -ErrorAction SilentlyContinue
  $tokens=Read-CommandTokens $process.CommandLine
  $fileIndex=[Array]::IndexOf($tokens,'-File')
  if ($fileIndex -ge 0 -and $tokens.Count -gt ($fileIndex+1) -and [IO.Path]::GetFullPath($tokens[$fileIndex+1]) -eq [IO.Path]::GetFullPath($imageScript)) {
   $response=Invoke-RestMethod ('http://127.0.0.1:'+ $imagePort + '/api/status') -TimeoutSec 2
   if ($response.alive -and [int]$response.pid -eq $imagePid -and [int]$response.port -eq $imagePort) {return}
  }
 } catch {}
 # These are only this package's disposable registrations. Existing processes stay alive.
 foreach ($file in @($portFile,$pidFile)) {Remove-Item -LiteralPath $file -Force -ErrorAction SilentlyContinue}
 $imageProcess=Start-Process -FilePath 'powershell.exe' -WindowStyle Hidden -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',('"'+$imageScript+'"'),'-Port','0') -PassThru
 for ($i=0;$i -lt 100;$i++) {
  try {
   $imagePort=[int](Get-Content -LiteralPath $portFile -Raw)
   $imagePid=[int](Get-Content -LiteralPath $pidFile -Raw)
   if ($imagePid -eq $imageProcess.Id) {
    $response=Invoke-RestMethod ('http://127.0.0.1:'+ $imagePort + '/api/status') -TimeoutSec 1
    if ($response.alive -and [int]$response.pid -eq $imagePid) {return}
   }
  } catch {}
  $imageProcess.Refresh()
  if ($imageProcess.HasExited) {throw 'The bundled image WORKSHOP server exited during startup.'}
  Start-Sleep -Milliseconds 100
 }
 throw 'The bundled image WORKSHOP server did not become ready.'
}

$sha=[Security.Cryptography.SHA256]::Create()
try {$key=[BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($GameDir.ToLowerInvariant()))).Replace('-','')} finally {$sha.Dispose()}
$mutex=New-Object Threading.Mutex($false,('Local\JO9PortableWorkshop_'+$key))
$locked=$false
try {
 try {$locked=$mutex.WaitOne(30000)} catch [Threading.AbandonedMutexException] {$locked=$true}
 if (!$locked) {throw 'Another launch of this WORKSHOP is still running.'}
 Ensure-ImageServer
 $state=Read-EditorReady
 if (!$state) {
  Remove-Item -LiteralPath $readyFile -Force -ErrorAction SilentlyContinue
  # Port zero asks Windows for a free loopback port; another installed copy is never reused.
  $arguments='"'+$server+'" --game-dir "'+$GameDir+'" --original-dir "'+$GameDir+'" --original-pic-dir "'+$originalPic+'" --catalog-dir "'+$CatalogDir+'" --runtime "'+$RuntimeDir+'" --port 0'
  $started=Start-Process -FilePath $NodePath -ArgumentList $arguments -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $RuntimeDir 'server.log') -RedirectStandardError (Join-Path $RuntimeDir 'error.log')
  for ($i=0;$i -lt 150;$i++) {
   $state=Read-EditorReady
   if ($state -and [int]$state.pid -eq $started.Id) {break}
   $started.Refresh()
   if ($started.HasExited) {throw ('The bundled WORKSHOP server exited. See '+(Join-Path $RuntimeDir 'error.log'))}
   Start-Sleep -Milliseconds 100
  }
  if (!$state -or [int]$state.pid -ne $started.Id) {throw 'The bundled WORKSHOP server did not become ready.'}
 }
 $url=[string]$state.url+'workshop'
 Write-Output $url
 if (!$NoBrowser) {Start-Process $url}
} finally {if ($locked) {$mutex.ReleaseMutex()};$mutex.Dispose()}
