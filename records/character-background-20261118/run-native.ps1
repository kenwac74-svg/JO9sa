param([switch]$Red)
$ErrorActionPreference='Stop'
$taskRoot='G:\Codex\tmp\character-background-20261118'
$taskName=if($Red){'before'}else{'candidate-native'}
$taskProcess=$null
try {
 $taskFixture=Join-Path $taskRoot ($taskName+'.qsp')
 $taskLog=Join-Path $taskRoot ($taskName+'-stderr.log')
 $taskProcess=Start-Process -FilePath 'G:\somi\Jack O Nine Tails v2.4_work\game\engine\jack.exe' -ArgumentList ('"'+$taskFixture+'"') -WorkingDirectory $taskRoot -WindowStyle Hidden -PassThru -RedirectStandardError $taskLog -RedirectStandardOutput (Join-Path $taskRoot ($taskName+'-stdout.log'))
 $taskDeadline=(Get-Date).AddSeconds(12)
 do {
  Start-Sleep -Milliseconds 250
  $taskText=if(Test-Path -LiteralPath $taskLog){Get-Content -LiteralPath $taskLog -Raw -Encoding UTF8}else{''}
  if($taskText -match 'JO9_BG_' -or $taskText -match 'Error:|error:' -or $taskProcess.HasExited){break}
 } while((Get-Date) -lt $taskDeadline)
 $ok=if($Red){$taskText -match 'JO9_BG_FAIL_generation'}else{$taskText -match 'JO9_BG_FINAL_PASS_' -and $taskText -notmatch 'JO9_BG_FAIL_'}
 [pscustomobject]@{phase=$taskName;pass=$ok;log=$taskLog} | ConvertTo-Json -Compress
 if(-not $ok){Write-Output $taskText;exit 1}
} finally {if($null -ne $taskProcess){Stop-Process -Id $taskProcess.Id -ErrorAction SilentlyContinue}}
