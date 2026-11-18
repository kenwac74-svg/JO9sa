$ErrorActionPreference='Stop'
$probeRoot='G:\Codex\tmp\save-autoclean-20261118\native'
$probeProcess=$null
try {
 $probeLogPath=Join-Path $probeRoot 'stderr.log'
 $probeProcess=Start-Process -FilePath 'G:\somi\Jack O Nine Tails v2.4_work\game\engine\jack.exe' -ArgumentList ('"'+(Join-Path $probeRoot 'native.qsp')+'"') -WorkingDirectory $probeRoot -WindowStyle Hidden -PassThru -RedirectStandardError $probeLogPath -RedirectStandardOutput (Join-Path $probeRoot 'stdout.log')
 $probeDeadline=(Get-Date).AddSeconds(28)
 do {
  Start-Sleep -Milliseconds 100
  $probeLog=if(Test-Path -LiteralPath $probeLogPath){Get-Content -LiteralPath $probeLogPath -Raw -Encoding UTF8}else{''}
  if($probeLog-match 'JO9_CLEAN_FINAL|JO9_CLEAN_FAIL' -or $probeProcess.HasExited){break}
 }while((Get-Date)-lt $probeDeadline)
 $ok=($probeLog-match 'JO9_CLEAN_FINAL_PASS_' -and $probeLog-notmatch 'JO9_CLEAN_FAIL')
 [pscustomobject]@{passed=$ok;log=$probeLogPath} | ConvertTo-Json -Compress
 if(-not $ok){Write-Output $probeLog;exit 1}
}finally{if($null-ne $probeProcess){Stop-Process -Id $probeProcess.Id -ErrorAction SilentlyContinue}}
