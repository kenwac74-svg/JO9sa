$ErrorActionPreference='Stop'
$choiceGame='G:\somi\Jack O Nine Tails v2.4_work\game'
$choiceServer=Join-Path $choiceGame 'modtools\text-workshop\server.cjs'
$choiceRuntime=Join-Path $choiceGame 'modtools\text-workshop\runtime'
$choiceReady=Join-Path $choiceRuntime 'server.json'
$choiceState=Get-Content -LiteralPath $choiceReady -Raw -Encoding UTF8 | ConvertFrom-Json
$choiceServerPid=[int]$choiceState.pid
$choiceProc=Get-CimInstance Win32_Process -Filter ('ProcessId='+$choiceServerPid)
if (!$choiceProc -or !$choiceProc.CommandLine -or !$choiceProc.ExecutablePath.EndsWith('\node.exe',[StringComparison]::OrdinalIgnoreCase)) {throw 'Recorded editor is not an identified Node process.'}
$choiceTokens=@([regex]::Matches($choiceProc.CommandLine,'"([^"]*)"|(\S+)') | ForEach-Object {if ($_.Groups[1].Success) {$_.Groups[1].Value} else {$_.Groups[2].Value}})
if ($choiceTokens.Count -lt 4 -or ![IO.Path]::GetFullPath($choiceTokens[1]).Equals([IO.Path]::GetFullPath($choiceServer),[StringComparison]::OrdinalIgnoreCase)) {throw 'Recorded process uses different server code.'}
$choiceGameAt=[array]::IndexOf($choiceTokens,'--game-dir')
$choiceRuntimeAt=[array]::IndexOf($choiceTokens,'--runtime')
if ($choiceGameAt -lt 0 -or $choiceRuntimeAt -lt 0 -or ![IO.Path]::GetFullPath($choiceTokens[$choiceGameAt+1]).Equals([IO.Path]::GetFullPath($choiceGame),[StringComparison]::OrdinalIgnoreCase) -or ![IO.Path]::GetFullPath($choiceTokens[$choiceRuntimeAt+1]).Equals([IO.Path]::GetFullPath($choiceRuntime),[StringComparison]::OrdinalIgnoreCase)) {throw 'Editor folders do not match the requested workspace.'}
$choiceUri=[uri]$choiceState.url
if ($choiceUri.Host -ne '127.0.0.1' -or $choiceUri.Port -ne 3813) {throw 'Unexpected editor URL.'}
$choiceListeners=@(Get-NetTCPConnection -LocalPort 3813 -ErrorAction SilentlyContinue | Where-Object {$_.State -eq 'Listen' -or ($_.RemoteAddress -eq '0.0.0.0' -and $_.RemotePort -eq 0)})
if (@($choiceListeners | Where-Object {$_.OwningProcess -ne $choiceServerPid}).Count) {throw 'Editor port has a different owner; nothing was stopped.'}
$choiceNodePrefix=[regex]::Match($choiceProc.CommandLine,'^\s*(?:"[^"]+"|\S+)\s*')
$choiceArgsText=$choiceProc.CommandLine.Substring($choiceNodePrefix.Length)
$choiceArgsText=[regex]::Replace($choiceArgsText,'--port\s+\d+','--port 3813')
$env:JO9_MODDING_HUB_ORIGIN='http://127.0.0.1:7689'
Stop-Process -Id $choiceServerPid -Force
Wait-Process -Id $choiceServerPid -Timeout 10 -ErrorAction SilentlyContinue
$choiceStarted=Start-Process -FilePath $choiceProc.ExecutablePath -ArgumentList $choiceArgsText -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $choiceRuntime 'choice-feature-server.log') -RedirectStandardError (Join-Path $choiceRuntime 'choice-feature-error.log')
for ($choiceAttempt=0;$choiceAttempt -lt 50;$choiceAttempt++) {
 Start-Sleep -Milliseconds 200
 if (Test-Path -LiteralPath $choiceReady) {
  $choiceNext=Get-Content -LiteralPath $choiceReady -Raw -Encoding UTF8 | ConvertFrom-Json
  if ([int]$choiceNext.pid -eq $choiceStarted.Id) {
   $choiceResponse=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3813/?workspace=1' -TimeoutSec 5
   if ($choiceResponse.StatusCode -eq 200 -and $choiceResponse.Content.Contains('choiceAdditionBox')) {
    @{restarted=$true;pid=$choiceStarted.Id;port=3813;choiceForm=$true;frameParent='http://127.0.0.1:7689'} | ConvertTo-Json -Compress
    exit 0
   }
  }
 }
 $choiceStarted.Refresh()
 if ($choiceStarted.HasExited) {throw (Get-Content -LiteralPath (Join-Path $choiceRuntime 'choice-feature-error.log') -Raw)}
}
throw 'Editor readiness not observed; inspect choice-feature-error.log.'
