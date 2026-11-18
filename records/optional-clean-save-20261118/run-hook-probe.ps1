$ErrorActionPreference='Stop'
$probeRoot='G:\Codex\tmp\save-autoclean-20261118\hook'
$probeProcess=$null
try {
 $probeProcess=Start-Process -FilePath 'G:\somi\Jack O Nine Tails v2.4_work\game\engine\jack.exe' -ArgumentList ('"'+(Join-Path $probeRoot 'hook.qsp')+'"') -WorkingDirectory $probeRoot -WindowStyle Hidden -PassThru -RedirectStandardError (Join-Path $probeRoot 'stderr.log') -RedirectStandardOutput (Join-Path $probeRoot 'stdout.log')
 $probeDeadline=(Get-Date).AddSeconds(10)
 do {
  Start-Sleep -Milliseconds 250
  $probeLog=if(Test-Path -LiteralPath (Join-Path $probeRoot 'stderr.log')){Get-Content -LiteralPath (Join-Path $probeRoot 'stderr.log') -Raw -Encoding UTF8}else{''}
  if($probeLog -match 'JO9_HOOK_DONE' -or $probeProcess.HasExited){break}
 }while((Get-Date)-lt $probeDeadline)
 Write-Output $probeLog
 if($probeLog -notmatch 'JO9_HOOK_DONE_1_0'){exit 1}
}finally{if($null-ne $probeProcess){Stop-Process -Id $probeProcess.Id -ErrorAction SilentlyContinue}}
