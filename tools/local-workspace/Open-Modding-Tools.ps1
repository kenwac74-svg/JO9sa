# Open the canonical workspace tools and the user's external modding sites.
param([switch]$NoBrowser, [string]$ConfigFile='')
$ErrorActionPreference='Stop'
function Normalize-WorkshopPath([string]$Value) {
 if (!$Value) {return ''}
 return [IO.Path]::GetFullPath($Value.Replace('/', '\')).TrimEnd('\').ToLowerInvariant()
}
function Get-WorkshopProcess([string]$Script) {
 return @(Get-CimInstance Win32_Process -Filter "Name='powershell.exe' OR Name='pwsh.exe'" | Where-Object {
  $tokens=@([regex]::Matches([string]$_.CommandLine,'"([^"]*)"|(\S+)') | ForEach-Object {if ($_.Groups[1].Success) {$_.Groups[1].Value} else {$_.Groups[2].Value}})
  $index=-1
  for ($i=1;$i -lt $tokens.Count;$i++) {if ($tokens[$i] -ieq '-File') {$index=$i;break}}
  if ($index -lt 0 -or $index+1 -ge $tokens.Count) {return $false}
  # A -Command body can mention -File; it is not the process's script argument.
  for ($i=1;$i -lt $index;$i++) {
   $option=([string]$tokens[$i]).TrimStart([char[]]'-/').ToLowerInvariant()
   if ($tokens[$i] -match '^[-/]' -and $option) {
    foreach ($mode in @('command','commandwithargs','encodedcommand','encodedarguments','ec','ea')) {
     if ($mode.StartsWith($option,[StringComparison]::OrdinalIgnoreCase)) {return $false}
    }
   }
  }
  $scriptPath=[string]$tokens[$index+1]
  # Resolve only absolute paths; another process may have a different working directory.
  if ($scriptPath -notmatch '^(?:[A-Za-z]:[\\/]|\\\\[^\\]+\\[^\\]+\\)') {return $false}
  try {return (Normalize-WorkshopPath $scriptPath) -eq (Normalize-WorkshopPath $Script)} catch {return $false}
 })
}
function Get-WorkshopUrl([string]$Runtime,[string]$Script) {
 $portFile=Join-Path $Runtime 'port.txt'
 $pidFile=Join-Path $Runtime 'server.pid'
 if (!(Test-Path -LiteralPath $portFile) -or !(Test-Path -LiteralPath $pidFile)) {return ''}
 $workshopPort=0;$workshopPid=0
 if (![int]::TryParse((Get-Content -LiteralPath $portFile -Raw).Trim(),[ref]$workshopPort) -or
  ![int]::TryParse((Get-Content -LiteralPath $pidFile -Raw).Trim(),[ref]$workshopPid) -or $workshopPort -lt 1 -or $workshopPort -gt 65535) {throw 'Invalid workshop runtime records; no duplicate server was launched.'}
 $process=@(Get-WorkshopProcess $Script | Where-Object {$_.ProcessId -eq $workshopPid})
 if (!$process.Count) {
  if (Get-Process -Id $workshopPid -ErrorAction SilentlyContinue) {throw 'Workshop runtime PID belongs to a different process. It was not stopped.'}
  return ''
 }
 $url='http://127.0.0.1:'+$workshopPort+'/'
 try {$status=Invoke-RestMethod ($url+'api/status') -TimeoutSec 2} catch {throw 'The existing workshop is not responding. No duplicate server was launched.'}
 if (!$status.alive -or [int]$status.pid -ne $workshopPid -or [int]$status.port -ne $workshopPort) {throw 'Workshop API and runtime records disagree. No duplicate server was launched.'}
 return $url
}
function Open-ConfiguredTools {
 $localConfig=if ($ConfigFile) {[IO.Path]::GetFullPath($ConfigFile)} else {Join-Path $PSScriptRoot 'local.config.json'}
 $editorUrl=(& (Join-Path $PSScriptRoot 'Start-JO9-Tools.ps1') -ConfigFile $localConfig -NoBrowser | Select-Object -Last 1)
 if (!$editorUrl -or [string]$editorUrl -notmatch '^http://127\.0\.0\.1:\d+/$') {throw 'The editor/checklist launcher did not return a local URL.'}
 # The editor launcher resolves and persists all four folders before this read.
 $config=Get-Content -LiteralPath $localConfig -Raw -Encoding UTF8 | ConvertFrom-Json
 $root=Join-Path $config.game 'modtools'
 $workshop=Join-Path $root 'JO9_Server.ps1'
 $runtime=Join-Path $root 'runtime'
 $workshopUrl=Get-WorkshopUrl $runtime $workshop
 $source=Join-Path (Split-Path -Parent $PSScriptRoot) 'image-workshop'
 $changes=@()
 # Deploy code only. Existing filters/config/runtime and image templates remain intact.
 foreach ($relative in @('JO9_Server.ps1','JO9_Detect.ps1','JO9_Launch.cmd','pixelpure_optimizer.html','VERSION.txt','place\JO9_Place_Workshop.html')) {
  $from=Join-Path $source $relative;$to=Join-Path $root $relative
  if ((Test-Path -LiteralPath $from) -and (!(Test-Path -LiteralPath $to) -or (Get-FileHash -LiteralPath $from -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $to -Algorithm SHA256).Hash)) {$changes+=@{from=$from;to=$to}}
 }
 $sourceVersionFile=Join-Path $root 'text-workshop\.jo9-tool-version.json'
 $installedVersionFile=Join-Path $root '.jo9-tool-version.json'
 $version=$null
 if (Test-Path -LiteralPath $sourceVersionFile) {$version=Get-Content -LiteralPath $sourceVersionFile -Raw -Encoding UTF8 | ConvertFrom-Json}
 if ($changes.Count -and (Test-Path -LiteralPath $installedVersionFile)) {
  $previous=Get-Content -LiteralPath $installedVersionFile -Raw -Encoding UTF8 | ConvertFrom-Json
  if (!$version -or ![long]$version.committedAt) {throw 'Cannot verify workshop package version. Installed code was not overwritten.'}
  if ([long]$version.committedAt -lt [long]$previous.committedAt -or
   ([long]$version.committedAt -eq [long]$previous.committedAt -and [string]$version.revision -ne [string]$previous.revision)) {throw 'Workshop package is older or conflicts with the installed version. Downgrade was blocked.'}
 }
 if ($changes.Count -and $workshopUrl) {
  $owned=Get-WorkshopProcess $workshop
  $recordedPid=[int](Get-Content -LiteralPath (Join-Path $runtime 'server.pid') -Raw)
  if (@($owned | Where-Object {$_.ProcessId -eq $recordedPid}).Count -ne 1) {throw 'Workshop ownership changed; deployment was cancelled.'}
  Stop-Process -Id $recordedPid -Force -ErrorAction Stop
  Wait-Process -Id $recordedPid -Timeout 10 -ErrorAction SilentlyContinue
  $stopped=$false
  for ($attempt=0;$attempt -lt 30;$attempt++) {
   if (!(Get-CimInstance Win32_Process -Filter ('ProcessId='+$recordedPid) -ErrorAction SilentlyContinue)) {$stopped=$true;break}
   Start-Sleep -Milliseconds 100
  }
  if (!$stopped) {throw 'The workshop did not stop; deployment was cancelled.'}
  Remove-Item -LiteralPath (Join-Path $runtime 'server.pid'),(Join-Path $runtime 'port.txt') -Force -ErrorAction SilentlyContinue
  $workshopUrl=''
 }
 if (!$workshopUrl -and @(Get-WorkshopProcess $workshop).Count) {throw 'A workshop process is already starting or has stale runtime records. No second server was launched.'}
 foreach ($change in $changes) {
  New-Item -ItemType Directory -Path (Split-Path -Parent $change.to) -Force | Out-Null
  Copy-Item -LiteralPath $change.from -Destination $change.to -Force
 }
 if ($version) {$version | ConvertTo-Json | Set-Content -LiteralPath $installedVersionFile -Encoding UTF8}
 foreach ($relative in @('config.json','filters.json','button_template.png','mob template.png')) {
  $from=Join-Path $source $relative;$to=Join-Path $root $relative
  if (!(Test-Path -LiteralPath $to) -and (Test-Path -LiteralPath $from)) {Copy-Item -LiteralPath $from -Destination $to}
 }
 if (!$workshopUrl) {
  New-Item -ItemType Directory -Path $runtime -Force | Out-Null
  foreach ($name in @('server.pid','port.txt')) {Remove-Item -LiteralPath (Join-Path $runtime $name) -Force -ErrorAction SilentlyContinue}
  $started=Start-Process powershell.exe -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File "'+$workshop+'" -Port 0') -WindowStyle Hidden -PassThru
  for ($i=0;$i -lt 100;$i++) {
   if ((Test-Path -LiteralPath (Join-Path $runtime 'port.txt')) -and (Test-Path -LiteralPath (Join-Path $runtime 'server.pid'))) {
    $recordedPid=[int](Get-Content -LiteralPath (Join-Path $runtime 'server.pid') -Raw)
    if ($recordedPid -eq $started.Id) {$workshopUrl=Get-WorkshopUrl $runtime $workshop;if ($workshopUrl) {break}}
   }
   $started.Refresh();if ($started.HasExited) {throw 'The workshop exited before becoming ready. Check modtools/runtime/server.log.'}
   Start-Sleep -Milliseconds 100
  }
  if (!$workshopUrl) {throw 'Workshop startup timed out. No additional server was launched.'}
 }
 # JO9 MOD START MOD_TOOLS_IMAGE_REVIEW_20261021
 $reviewLauncher=Join-Path (Split-Path -Parent $PSScriptRoot) 'image-folder-review\Start-Image-Folder-Review.ps1'
 $reviewInfo=(& $reviewLauncher -DataDir (Join-Path $config.catalog 'folder-review') -NoOpen | Select-Object -Last 1) | ConvertFrom-Json
 if ($reviewInfo.app -ne 'image-folder-review' -or [string]$reviewInfo.url -notmatch '^http://127\.0\.0\.1:\d+/$') {throw 'The image folder comparison launcher did not return its verified local URL.'}
 $reviewUrl=[string]$reviewInfo.url
 Write-Output ('Dialogue: '+$editorUrl+' | Checklist: '+$editorUrl+'catalog | Workshop: '+$workshopUrl+' | ImageReview: '+$reviewUrl)
 # JO9 MOD END MOD_TOOLS_IMAGE_REVIEW_20261021
 if (!$NoBrowser) {
  foreach ($url in @($editorUrl,($editorUrl+'catalog'),$workshopUrl,$reviewUrl,'https://huggingface.co/spaces/fancyfeast/joy-caption-beta-one','https://translate.google.co.kr/?sl=en&tl=ko&op=translate','https://www.mage.space/advanced','https://gamma.app/design/01M48RXZSYBT1HBN8BFGAQ09AS?from=designs')) {Start-Process $url}
 }
}

$mutexGame=''
$mutexConfig=if ($ConfigFile) {$ConfigFile} else {Join-Path $PSScriptRoot 'local.config.json'}
if (Test-Path -LiteralPath $mutexConfig) {
 try {$mutexGame=(Get-Content -LiteralPath $mutexConfig -Raw -Encoding UTF8 | ConvertFrom-Json).game} catch {}
}
$mutexBasis=if ($mutexGame) {Normalize-WorkshopPath $mutexGame} else {Normalize-WorkshopPath $PSScriptRoot}
$mutexKey=[BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($mutexBasis))).Replace('-','')
$mutex=New-Object Threading.Mutex($false,('Local\JO9WorkshopLaunch_'+$mutexKey))
$locked=$false
try {
 try {$locked=$mutex.WaitOne(30000)} catch [Threading.AbandonedMutexException] {$locked=$true}
 if (!$locked) {throw 'Another tool launch is still running.'}
 Open-ConfiguredTools
} finally {if ($locked) {$mutex.ReleaseMutex()};$mutex.Dispose()}
