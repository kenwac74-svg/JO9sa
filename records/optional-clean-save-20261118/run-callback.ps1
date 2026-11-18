$ErrorActionPreference='Stop'
$probeRoot='G:\Codex\tmp\save-autoclean-20261118\callback'
$probeProcess=$null
try {
 $probeProcess=Start-Process -FilePath 'G:\somi\Jack O Nine Tails v2.4_work\game\engine\jack.exe' -ArgumentList ('"'+(Join-Path $probeRoot 'probe.qsp')+'"') -WorkingDirectory $probeRoot -WindowStyle Hidden -PassThru -RedirectStandardError (Join-Path $probeRoot 'stderr.log') -RedirectStandardOutput (Join-Path $probeRoot 'stdout.log')
 $probeDeadline=(Get-Date).AddSeconds(8)
 do {Start-Sleep -Milliseconds 100;$probeLog=if(Test-Path -LiteralPath (Join-Path $probeRoot 'stderr.log')){Get-Content -LiteralPath (Join-Path $probeRoot 'stderr.log') -Raw -Encoding UTF8}else{''}}while($probeLog-notmatch 'JO9_CALLBACK_' -and (Get-Date)-lt $probeDeadline -and -not $probeProcess.HasExited)
 $ok=($probeLog-match 'JO9_CALLBACK_FINAL_PASS_4')
 [pscustomobject]@{passed=$ok;assertions=4} | ConvertTo-Json -Compress
 if(-not $ok){Write-Output $probeLog;exit 1}
}finally{if($null-ne $probeProcess){Stop-Process -Id $probeProcess.Id -ErrorAction SilentlyContinue}}
