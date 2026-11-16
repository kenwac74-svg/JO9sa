$ErrorActionPreference='Stop'
$audioRoot='G:/Codex/tmp/fog-audio-null-20261116'
$results=@()
foreach($mode in @('red','green')){
 $p=Start-Process -FilePath 'G:/somi/Jack O Nine Tails v2.4_work/game/engine/jack.exe' -ArgumentList ('"'+$audioRoot+'/'+$mode+'.qsp"') -WorkingDirectory $audioRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput ($audioRoot+'/'+$mode+'-stdout.log') -RedirectStandardError ($audioRoot+'/'+$mode+'-stderr.log')
 $deadline=(Get-Date).AddSeconds(15)
 $complete=$false
 do{Start-Sleep -Milliseconds 100;$log=if(Test-Path -LiteralPath ($audioRoot+'/'+$mode+'-stderr.log')){Get-Content -LiteralPath ($audioRoot+'/'+$mode+'-stderr.log') -Raw}else{''};if($log -match ('JO9_QA_AUDIONULL_'+$mode+'_COMPLETE')){$complete=$true;break};if($p.HasExited){break}}while((Get-Date) -lt $deadline)
 $p.Refresh();$terminated=$p.HasExited;$code=if($terminated){$p.ExitCode}else{$null}
 $results+=[pscustomobject]@{mode=$mode;marker=$complete;exited=$terminated;exitCode=$code}
 if(-not $terminated){Stop-Process -Id $p.Id -ErrorAction SilentlyContinue}
}
$results|ConvertTo-Json|Set-Content -LiteralPath ($audioRoot+'/results.json') -Encoding utf8
$results|Format-Table
