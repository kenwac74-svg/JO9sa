$ErrorActionPreference='Stop'
$rangeRoot='G:\somi\Jack O Nine Tails v2.4_work\game\modtools\text-workshop'
$rangeReady=Join-Path $rangeRoot 'runtime\server.json'
$rangeState=Get-Content -LiteralPath $rangeReady -Raw -Encoding UTF8 | ConvertFrom-Json
$rangeProcess=Get-CimInstance Win32_Process -Filter ('ProcessId='+[int]$rangeState.pid)
$rangeScript=Join-Path $rangeRoot 'server.cjs'
if (!$rangeProcess -or !$rangeProcess.CommandLine.Replace('/','\').Contains($rangeScript)) {throw 'Editor process identity differs; restart cancelled.'}
$rangeTarget='G:\somi\Jack O Nine Tails v2.4_work\game\jack.qsp'
if ([string]$rangeState.target -ine $rangeTarget) {throw 'Editor target differs; restart cancelled.'}
$rangeArgs=[regex]::Replace([string]$rangeProcess.CommandLine,'^\s*(?:"[^"]+"|\S+)\s*','')
$rangeOldPid=[int]$rangeState.pid
Stop-Process -Id $rangeOldPid -ErrorAction Stop
Wait-Process -Id $rangeOldPid -Timeout 10 -ErrorAction SilentlyContinue
$rangeStarted=Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList $rangeArgs -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $rangeRoot 'runtime\range-server.log') -RedirectStandardError (Join-Path $rangeRoot 'runtime\range-error.log')
for ($rangeAttempt=0;$rangeAttempt -lt 80;$rangeAttempt++) {
 if (Test-Path -LiteralPath $rangeReady) {
  $rangeNew=Get-Content -LiteralPath $rangeReady -Raw -Encoding UTF8 | ConvertFrom-Json
  if ([int]$rangeNew.pid -eq $rangeStarted.Id) {
   $rangePage=Invoke-WebRequest ([string]$rangeNew.url) -UseBasicParsing -TimeoutSec 3
   if (!$rangePage.Content.Contains('script-range.js')) {throw 'New editor page does not include range UI.'}
   Write-Output ([string]$rangeNew.url)
   exit 0
  }
 }
 $rangeStarted.Refresh();if ($rangeStarted.HasExited) {throw 'Editor stopped before readiness; see range-error.log.'}
 Start-Sleep -Milliseconds 100
}
throw 'Editor restart timeout.'
