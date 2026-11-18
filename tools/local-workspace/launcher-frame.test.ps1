param([string]$LauncherPath=(Join-Path $PSScriptRoot 'Start-JO9-Tools.ps1'))
# Isolated launcher regression: every process/network operation is a fixture.
$ErrorActionPreference='Stop'
$root=Join-Path ([IO.Path]::GetTempPath()) ('jo9-frame-launcher-test-'+[guid]::NewGuid().ToString('N'))
$savedOrigins=$env:JO9_MODDING_HUB_ORIGIN
$node=(Get-Command node -ErrorAction Stop).Source
$global:jo9FrameTest=@{process=$null;starts=0;stops=0;policy="frame-ancestors 'none'";requests=@();readFailure=$false;badStartup=$false}
$checks=New-Object Collections.Generic.List[object]
function Assert-Frame($Value,[string]$Message) {if (!$Value) {throw $Message}}
function Check-Frame([string]$Name,[scriptblock]$Action) {
 try {& $Action;$checks.Add(@{name=$Name;pass=$true})} catch {$checks.Add(@{name=$Name;pass=$false;error=$_.Exception.Message})}
}
function Get-CimInstance {param($ClassName,$Filter,$ErrorAction) return $global:jo9FrameTest.process}
function Get-NetTCPConnection {param($LocalPort,$State,$ErrorAction)
 if ($global:jo9FrameTest.process) {return [pscustomobject]@{OwningProcess=$global:jo9FrameTest.process.ProcessId;State='Listen'}}
}
function Invoke-WebRequest {param([switch]$UseBasicParsing,$Uri,$TimeoutSec)
 $global:jo9FrameTest.requests+=([string]$Uri)
 if ([string]$Uri -like '*/patch-schedule' -and $global:jo9FrameTest.readFailure) {throw 'fixture schedule read failure'}
 return [pscustomobject]@{StatusCode=200;Headers=@{'Content-Security-Policy'=$global:jo9FrameTest.policy}}
}
function Stop-Process {param($Id,[switch]$Force,$ErrorAction)
 Assert-Frame ($global:jo9FrameTest.process -and $global:jo9FrameTest.process.ProcessId -eq $Id) 'Foreign process was stopped.'
 $global:jo9FrameTest.stops++;$global:jo9FrameTest.process=$null
}
function Wait-Process {param($Id,$Timeout,$ErrorAction)}
function Start-Process {param($FilePath,$ArgumentList,$WindowStyle,[switch]$PassThru,$RedirectStandardOutput,$RedirectStandardError)
 Assert-Frame ($FilePath -eq $node) 'Unexpected program start.'
 $global:jo9FrameTest.starts++;$id=1000+$global:jo9FrameTest.starts
 $global:jo9FrameTest.process=[pscustomobject]@{ProcessId=$id;CommandLine='"'+$FilePath+'" '+$ArgumentList}
 if (!$global:jo9FrameTest.badStartup) {$global:jo9FrameTest.policy='default-src ''self''; frame-ancestors http://127.0.0.1:7689 http://127.0.0.1:7719; base-uri ''none'''}
 @{pid=$id;url='http://127.0.0.1:3813/';target=(Join-Path $game 'jack.qsp')} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $runtime 'server.json') -Encoding UTF8
 $value=[pscustomobject]@{Id=$id;HasExited=$false};$value | Add-Member ScriptMethod Refresh {};return $value
}
function Invoke-FrameLauncher {& $launcher -NodePath $node -NoBrowser}
function Assert-ReplacedOnce([string]$Policy) {
 $global:jo9FrameTest.policy=$Policy;$beforeStarts=$global:jo9FrameTest.starts;$beforeStops=$global:jo9FrameTest.stops
 $null=Invoke-FrameLauncher
 Assert-Frame ($global:jo9FrameTest.starts -eq $beforeStarts+1 -and $global:jo9FrameTest.stops -eq $beforeStops+1) 'Incompatible owned server was not replaced exactly once.'
}
try {
 $fixture=Join-Path $root 'tools/local-workspace';$code=Join-Path $root 'tools/text-workshop'
 $game=Join-Path $root 'play/game';$original=Join-Path $root 'vanilla/game';$catalog=Join-Path $root 'catalog';$runtime=Join-Path $game 'modtools/text-workshop/runtime'
 New-Item -ItemType Directory -Path $fixture,$code,$catalog,$runtime,(Join-Path $game 'content/pic'),(Join-Path $original 'content/pic') -Force | Out-Null
 $launcher=Join-Path $fixture 'Start-JO9-Tools.ps1';Copy-Item -LiteralPath $LauncherPath -Destination $launcher
 Set-Content -LiteralPath (Join-Path $game 'jack.qsp') -Value 'fixture QSP' -Encoding UTF8
 Set-Content -LiteralPath (Join-Path $code 'server.cjs') -Value 'unchanged fixture code' -Encoding UTF8
 Set-Content -LiteralPath (Join-Path $catalog 'catalog_merge_vs_original.html') -Value 'existing catalog' -Encoding UTF8
 @{game=$game;original=$original;catalog=$catalog;runtime=$runtime} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $fixture 'local.config.json') -Encoding UTF8
 @{revision=('a'*40);committedAt=1000} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $fixture '.jo9-tool-version.json') -Encoding UTF8
 $preserved=@{}
 foreach ($name in @('patch-schedule.json','progress.json','catalog-selection.json')) {
  $file=Join-Path $catalog $name
  [IO.File]::WriteAllText($file,'{"memo":"keep this exact text","selected":17}',[Text.UTF8Encoding]::new($false))
  $preserved[$file]=(Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash
 }
 $env:JO9_MODDING_HUB_ORIGIN='http://127.0.0.1:7689 http://127.0.0.1:7719'
 Check-Frame 'fresh server accepts explicit hub origins' {
  $url=Invoke-FrameLauncher
  Assert-Frame ($url -eq 'http://127.0.0.1:3813/' -and $global:jo9FrameTest.starts -eq 1 -and $global:jo9FrameTest.stops -eq 0) 'Fresh launch failed.'
 }
 Check-Frame 'compatible existing server is reused' {
  $starts=$global:jo9FrameTest.starts;$stops=$global:jo9FrameTest.stops;$null=Invoke-FrameLauncher
  Assert-Frame ($global:jo9FrameTest.starts -eq $starts -and $global:jo9FrameTest.stops -eq $stops) 'Compatible server was restarted.'
 }
 Check-Frame 'none policy replaces unchanged owned code once' {Assert-ReplacedOnce "frame-ancestors 'none'"}
 Check-Frame 'missing one requested origin replaces server' {Assert-ReplacedOnce 'frame-ancestors http://127.0.0.1:7689'}
 Check-Frame 'origin token must match exactly' {Assert-ReplacedOnce 'frame-ancestors http://127.0.0.1:76890 http://127.0.0.1:7719'}
 Check-Frame 'additional CSP policy cannot deny the hub' {Assert-ReplacedOnce "frame-ancestors http://127.0.0.1:7689 http://127.0.0.1:7719, frame-ancestors 'none'"}
 Check-Frame 'missing explicit frame policy replaces server' {Assert-ReplacedOnce "default-src 'self'"}
 Check-Frame 'header read failure preserves process and address' {
  $global:jo9FrameTest.readFailure=$true;$starts=$global:jo9FrameTest.starts;$stops=$global:jo9FrameTest.stops;$ready=Join-Path $runtime 'server.json';$hash=(Get-FileHash -LiteralPath $ready).Hash;$failed=$false
  try {$null=Invoke-FrameLauncher} catch {$failed=$true} finally {$global:jo9FrameTest.readFailure=$false}
  Assert-Frame ($failed -and $global:jo9FrameTest.starts -eq $starts -and $global:jo9FrameTest.stops -eq $stops -and (Get-FileHash -LiteralPath $ready).Hash -eq $hash) 'Read failure caused reuse/restart or changed server.json.'
 }
 Check-Frame 'invalid configured origins are ignored' {
  $env:JO9_MODDING_HUB_ORIGIN='https://example.com http://127.0.0.1:0 http://127.0.0.1:65536 http://127.0.0.1:7689/path http://127.0.0.1:7689'
  $global:jo9FrameTest.policy='frame-ancestors http://127.0.0.1:7689';$starts=$global:jo9FrameTest.starts;$null=Invoke-FrameLauncher
  Assert-Frame ($global:jo9FrameTest.starts -eq $starts) 'Invalid configured origins were used as required parents.'
 }
 Check-Frame 'standalone launch retains deny policy without hub configuration' {
  $env:JO9_MODDING_HUB_ORIGIN='';$global:jo9FrameTest.policy="frame-ancestors 'none'";$starts=$global:jo9FrameTest.starts;$requests=$global:jo9FrameTest.requests.Count;$null=Invoke-FrameLauncher
  Assert-Frame ($global:jo9FrameTest.starts -eq $starts -and @($global:jo9FrameTest.requests | Select-Object -Skip $requests | Where-Object {$_ -like '*/patch-schedule'}).Count -eq 0) 'Standalone behavior or deny policy changed.'
 }
 Check-Frame 'fresh child with incompatible frame policy is not reported ready' {
  $env:JO9_MODDING_HUB_ORIGIN='http://127.0.0.1:7689 http://127.0.0.1:7719';$global:jo9FrameTest.policy="frame-ancestors 'none'";$global:jo9FrameTest.badStartup=$true;$starts=$global:jo9FrameTest.starts;$stops=$global:jo9FrameTest.stops;$failed=$false
  try {$null=Invoke-FrameLauncher} catch {$failed=$true} finally {$global:jo9FrameTest.badStartup=$false}
  Assert-Frame ($failed -and $global:jo9FrameTest.starts -eq $starts+1 -and $global:jo9FrameTest.stops -eq $stops+1) 'Bad child policy was reported ready or retried repeatedly.'
 }
 Check-Frame 'foreign command remains protected even with incompatible CSP' {
  $command=$global:jo9FrameTest.process.CommandLine;$global:jo9FrameTest.process.CommandLine='other.exe --work';$starts=$global:jo9FrameTest.starts;$stops=$global:jo9FrameTest.stops;$failed=$false
  try {$null=Invoke-FrameLauncher} catch {$failed=$true} finally {$global:jo9FrameTest.process.CommandLine=$command}
  Assert-Frame ($failed -and $global:jo9FrameTest.starts -eq $starts -and $global:jo9FrameTest.stops -eq $stops) 'Foreign command was stopped or duplicated.'
 }
 Check-Frame 'saved schedule notes and selections remain byte identical' {
  foreach ($file in $preserved.Keys) {Assert-Frame ((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -eq $preserved[$file]) ('Changed saved data: '+$file)}
 }
 $checkArray=$checks.ToArray()
 $result=@{status='PASS';passed=@($checkArray | Where-Object {$_.pass}).Count;total=$checkArray.Count;checks=$checkArray;scope='Only fixture processes, HTTP responses and disposable data; no live server restart.'}
 if ($result.passed -ne $result.total) {$result.status='FAIL'}
 $result | ConvertTo-Json -Depth 8
 if ($result.status -ne 'PASS') {exit 1}
} finally {
 $env:JO9_MODDING_HUB_ORIGIN=$savedOrigins
 $absolute=[IO.Path]::GetFullPath($root);$temp=[IO.Path]::GetFullPath([IO.Path]::GetTempPath())
 Assert-Frame ($absolute.StartsWith($temp,[StringComparison]::OrdinalIgnoreCase) -and (Split-Path -Leaf $absolute).StartsWith('jo9-frame-launcher-test-')) 'Unsafe fixture cleanup path.'
 Remove-Item -LiteralPath $absolute -Recurse -Force -ErrorAction SilentlyContinue
}
