param([string]$WorkspaceRoot='', [string]$MachineRoot='', [string]$PythonPath='', [switch]$NoBrowser, [switch]$ConfigurationOnly)
$ErrorActionPreference='Stop'
function Normalize-SharedPath([string]$Value) {
 if (!$Value) {return ''}
 return [IO.Path]::GetFullPath($Value.Replace('/','\')).TrimEnd('\').ToLowerInvariant()
}
function Shared-CommandTokens([string]$CommandLine) {
 return @([regex]::Matches($CommandLine,'"([^"]*)"|(\S+)') | ForEach-Object {if ($_.Groups[1].Success) {$_.Groups[1].Value} else {$_.Groups[2].Value}})
}
function Shared-Argument($Tokens,[string]$Name) {
 for ($i=0;$i -lt $Tokens.Count-1;$i++) {if ($Tokens[$i] -eq $Name) {return [string]$Tokens[$i+1]}}
 return ''
}
function Get-SharedContext {
 if (!$WorkspaceRoot) {$WorkspaceRoot=Split-Path -Parent (Split-Path -Parent $PSScriptRoot)}
 $WorkspaceRoot=[IO.Path]::GetFullPath($WorkspaceRoot)
 $manifestFile=Join-Path $WorkspaceRoot 'manifest.json'
 if (!(Test-Path -LiteralPath $manifestFile)) {throw 'Workspace manifest.json is missing. Export the shared workspace before starting it.'}
 $manifest=Get-Content -LiteralPath $manifestFile -Raw -Encoding UTF8 | ConvertFrom-Json
 if (![string]$manifest.workspaceId -or [string]$manifest.workspaceId -notmatch '^[A-Za-z0-9_-]+$') {throw 'Invalid or missing manifest workspaceId.'}
 if (!$MachineRoot) {$MachineRoot=Join-Path (Join-Path $env:LOCALAPPDATA 'JO9WORK') ([string]$manifest.workspaceId)}
 $MachineRoot=[IO.Path]::GetFullPath($MachineRoot)
 $configFile=Join-Path $MachineRoot 'local.config.json'
 $config=$null
 if (Test-Path -LiteralPath $configFile) {$config=Get-Content -LiteralPath $configFile -Raw -Encoding UTF8 | ConvertFrom-Json}
 if (!$config -or ![string]$config.game -or !(Test-Path -LiteralPath (Join-Path $config.game 'jack.qsp')) -or
  (Normalize-SharedPath $config.workspace) -ne (Normalize-SharedPath $WorkspaceRoot)) {
  $restore=Join-Path $PSScriptRoot 'Restore-JO9-Work.ps1'
  if (!(Test-Path -LiteralPath $restore)) {throw 'Restore-JO9-Work.ps1 is missing; machine folder setup cannot continue.'}
  # ConfigureOnly sets paths and metadata; it does not restore personal images or QSP.
  & $restore -WorkspaceRoot $WorkspaceRoot -MachineRoot $MachineRoot -ConfigureOnly | Out-Host
  if (!(Test-Path -LiteralPath $configFile)) {throw 'Machine folder configuration was not saved.'}
  $config=Get-Content -LiteralPath $configFile -Raw -Encoding UTF8 | ConvertFrom-Json
 }
 foreach ($name in @('game','original','catalog','runtime')) {if (![string]$config.$name) {throw ('Machine configuration is missing '+$name)}}
 if ((Normalize-SharedPath $config.game) -eq (Normalize-SharedPath $config.original)) {throw 'PLAY and VANILLA must be separate folders.'}
 if (!$PythonPath) {
  $bundled=Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
  if (Test-Path -LiteralPath $bundled) {$PythonPath=$bundled} else {$PythonPath=(Get-Command python -ErrorAction Stop).Source}
 }
 return [pscustomobject]@{workspace=$WorkspaceRoot;machine=$MachineRoot;configFile=$configFile;game=[string]$config.game;original=[string]$config.original;catalog=[string]$config.catalog;runtime=[string]$config.runtime;python=$PythonPath}
}
function Test-SharedWatcher($Process,$Context,[string]$Script) {
 if (!$Process -or !$Process.CommandLine) {return $false}
 $tokens=Shared-CommandTokens $Process.CommandLine
 if ($tokens.Count -lt 2 -or (Normalize-SharedPath $tokens[1]) -ne (Normalize-SharedPath $Script)) {return $false}
 foreach ($pair in @(@('--repo',$Context.workspace),@('--destination',$Context.workspace),@('--game',$Context.game),@('--original',$Context.original),@('--catalog',$Context.catalog),@('--runtime',$Context.runtime))) {
  if ((Normalize-SharedPath (Shared-Argument $tokens $pair[0])) -ne (Normalize-SharedPath $pair[1])) {return $false}
 }
 return $true
}
function Start-SharedWatcher($Context) {
 $watcher=Join-Path $PSScriptRoot 'watch-shared-work.py'
 if (!(Test-Path -LiteralPath $watcher)) {throw 'watch-shared-work.py is missing.'}
 New-Item -ItemType Directory -Path $Context.runtime -Force | Out-Null
 $marker=Join-Path $Context.runtime 'shared-sync-process.json'
 if (Test-Path -LiteralPath $marker) {
  $previous=Get-Content -LiteralPath $marker -Raw -Encoding UTF8 | ConvertFrom-Json
  $process=Get-CimInstance Win32_Process -Filter ('ProcessId='+[int]$previous.pid) -ErrorAction SilentlyContinue
  if ($process) {
   if (!(Test-SharedWatcher $process $Context $watcher)) {throw 'The recorded shared-sync PID belongs to another command or folders. It was not stopped or duplicated.'}
   return
  }
  Remove-Item -LiteralPath $marker -Force
 }
 # Recover an already running exact watcher if a prior launch missed writing its marker.
 $running=@(Get-CimInstance Win32_Process -Filter "Name='python.exe' OR Name='pythonw.exe' OR Name='python3.exe'")
 foreach ($candidate in $running) {
  $tokens=Shared-CommandTokens ([string]$candidate.CommandLine)
  if ($tokens.Count -ge 2 -and [IO.Path]::GetFileName($tokens[1]) -eq 'watch-shared-work.py' -and
   (Normalize-SharedPath (Shared-Argument $tokens '--runtime')) -eq (Normalize-SharedPath $Context.runtime) -and
   !(Test-SharedWatcher $candidate $Context $watcher)) {throw 'An existing shared-sync watcher uses this runtime with another workspace or source. It was not stopped or duplicated.'}
 }
 $owned=@($running | Where-Object {Test-SharedWatcher $_ $Context $watcher})
 if ($owned.Count -gt 1) {throw 'Multiple matching shared-sync processes exist; no additional watcher was started.'}
 if ($owned.Count -eq 1) {$watcherPid=[int]$owned[0].ProcessId} else {
  $argsText='"'+$watcher+'" --repo "'+$Context.workspace+'" --game "'+$Context.game+'" --original "'+$Context.original+'" --catalog "'+$Context.catalog+'" --runtime "'+$Context.runtime+'" --destination "'+$Context.workspace+'"'
  $started=Start-Process -FilePath $Context.python -ArgumentList $argsText -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $Context.runtime 'shared-sync.stdout.log') -RedirectStandardError (Join-Path $Context.runtime 'shared-sync.stderr.log')
  $watcherPid=$started.Id
 }
 # Status is written separately by the watcher in shared-sync.json.
 @{pid=$watcherPid;script=$watcher;workspace=$Context.workspace;game=$Context.game;catalog=$Context.catalog;runtime=$Context.runtime} | ConvertTo-Json | Set-Content -LiteralPath $marker -Encoding UTF8
}

$shared=Get-SharedContext
if ($ConfigurationOnly) {$shared;return}
$launcher=Join-Path $PSScriptRoot 'Start-JO9-Tools.ps1'
$url=(& $launcher -GameDir $shared.game -OriginalDir $shared.original -CatalogDir $shared.catalog -RuntimeDir $shared.runtime -ConfigFile $shared.configFile -NoBrowser | Select-Object -Last 1)
if (!$url -or [string]$url -notmatch '^http://127\.0\.0\.1:\d+/$') {throw 'Canonical workspace launcher did not return a local URL.'}
# Also install/reuse the image workshop against the same machine-local configuration.
& (Join-Path $PSScriptRoot 'Open-Modding-Tools.ps1') -ConfigFile $shared.configFile -NoBrowser | Out-Host
$mutexKey=[BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes((Normalize-SharedPath $shared.runtime)))).Replace('-','')
$mutex=New-Object Threading.Mutex($false,('Local\JO9SharedSync_'+$mutexKey))
$locked=$false
try {
 try {$locked=$mutex.WaitOne(30000)} catch [Threading.AbandonedMutexException] {$locked=$true}
 if (!$locked) {throw 'Another shared-sync launch is still running.'}
 Start-SharedWatcher $shared
} finally {if ($locked) {$mutex.ReleaseMutex()};$mutex.Dispose()}
Write-Output ([string]$url)
if (!$NoBrowser) {Start-Process ([string]$url);Start-Process ([string]$url+'catalog')}
