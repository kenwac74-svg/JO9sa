param([switch]$Red)
$ErrorActionPreference='Stop'
$taskName=if($Red){'before'}else{'candidate'}
$taskRoot='G:\Codex\tmp\assistant-rewards-complete-20261117'
$taskFixture=Join-Path $taskRoot ($taskName+'.qsp')
$taskLog=Join-Path $taskRoot ($taskName+'-stderr.log')
$taskProcess=$null
try {
 $taskProcess=Start-Process -FilePath 'G:\somi\Jack O Nine Tails v2.4_work\game\engine\jack.exe' -ArgumentList ('"'+$taskFixture+'"') -WorkingDirectory $taskRoot -WindowStyle Hidden -PassThru -RedirectStandardError $taskLog -RedirectStandardOutput (Join-Path $taskRoot ($taskName+'-stdout.log'))
 $taskDeadline=(Get-Date).AddSeconds(12)
 do {
  Start-Sleep -Milliseconds 250
  $taskText=if(Test-Path -LiteralPath $taskLog){Get-Content -LiteralPath $taskLog -Raw}else{''}
  if($taskText -match 'JO9_REWARD_FINAL' -or $taskText -match 'error|Error' -or $taskProcess.HasExited){break}
 } while((Get-Date) -lt $taskDeadline)
 Write-Output ('Diagnostic PID: '+$taskProcess.Id)
 Write-Output $taskText
} finally {if($null -ne $taskProcess){Stop-Process -Id $taskProcess.Id -ErrorAction SilentlyContinue}}
