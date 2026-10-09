param([Parameter(Mandatory=$true)][string]$WorkspaceRoot,[switch]$Once)
$ErrorActionPreference='Stop'
$WorkspaceRoot=[IO.Path]::GetFullPath($WorkspaceRoot)
$manifest=Get-Content -LiteralPath (Join-Path $WorkspaceRoot 'manifest.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if ([string]$manifest.workspaceId -notmatch '^[A-Za-z0-9_-]{1,80}$') {throw 'Invalid workspace ID.'}
$machine=Join-Path (Join-Path $env:LOCALAPPDATA 'JO9WORK') $manifest.workspaceId
$configFile=Join-Path $machine 'local.config.json'
$launcher=Join-Path $WorkspaceRoot 'tools\local-workspace\Start-Shared-JO9.ps1'
$mutex=New-Object Threading.Mutex($false,('Local\JO9CodexShared_'+$manifest.workspaceId))
if (!$mutex.WaitOne(0)) {$mutex.Dispose();return}
function Ensure-SharedTools {
 $app=@(Get-Process -Name ChatGPT -ErrorAction SilentlyContinue | Where-Object {$_.Path -match '\\OpenAI\.Codex_[^\\]+\\app\\ChatGPT\.exe$'})
 if (!$app.Count) {return}
 if (!(Test-Path -LiteralPath $configFile)) {return} # First folder selection is interactive through Start-JO9.cmd.
 $config=Get-Content -LiteralPath $configFile -Raw -Encoding UTF8 | ConvertFrom-Json
 $serverReady=$false
 try {$response=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3813/' -TimeoutSec 2;$serverReady=$response.StatusCode -eq 200} catch {}
 $watcherReady=$false
 $marker=Join-Path $config.runtime 'shared-sync-process.json'
 if (Test-Path -LiteralPath $marker) {
  try {
   $saved=Get-Content -LiteralPath $marker -Raw -Encoding UTF8 | ConvertFrom-Json
   $process=Get-CimInstance Win32_Process -Filter ('ProcessId='+[int]$saved.pid) -ErrorAction SilentlyContinue
   $expected=Join-Path $WorkspaceRoot 'tools\local-workspace\watch-shared-work.py'
   $watcherReady=$process -and $process.CommandLine.Contains($expected)
  } catch {}
 }
 if ($serverReady -and $watcherReady) {return}
 & $launcher -WorkspaceRoot $WorkspaceRoot -NoBrowser | Out-Null
}
try {
 do {
  try {Ensure-SharedTools} catch {
   New-Item -ItemType Directory -Path $machine -Force | Out-Null
   Add-Content -LiteralPath (Join-Path $machine 'autostart.log') -Value ((Get-Date).ToString('o')+' '+$_.Exception.Message) -Encoding UTF8
  }
  if ($Once) {break}
  Start-Sleep -Seconds 10
 } while ($true)
} finally {$mutex.ReleaseMutex();$mutex.Dispose()}
