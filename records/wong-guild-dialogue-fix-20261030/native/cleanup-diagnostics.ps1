$ErrorActionPreference='Stop'
$qaRoot=[IO.Path]::GetFullPath('G:/Codex/tmp/jo9-wong-fix-20261030/native-regression')
if($qaRoot -ne 'G:\Codex\tmp\jo9-wong-fix-20261030\native-regression'){throw 'Unexpected diagnostic root'}
if(-not (Test-Path -LiteralPath $qaRoot)){throw 'Diagnostic root not found'}
$qaGame=[IO.Path]::GetFullPath('G:/somi/Jack O Nine Tails v2.4_work/game')
$qaCases=@('illness-one','illness-three','parasite-first-one','parasite-first-three','both-first-one','parasite-repeat-fatal')
$qaExpectedTop=@('config.xml','css','fonts','content','json','save','FastQSP.ini','plan.json','plan-fatal-probe.json','plan-fatal-boundary.json','runner.ps1','client-results.json')
foreach($qaName in $qaCases){$qaExpectedTop+=@(($qaName+'.qsp'),($qaName+'-stderr.log'),($qaName+'-stdout.log'))}
foreach($qaItem in (Get-ChildItem -LiteralPath $qaRoot -Force)){if($qaItem.Name -notin $qaExpectedTop){throw ('Unexpected diagnostic child: '+$qaItem.FullName)}}
$qaEmptySave=Join-Path $qaRoot 'save'
if((Test-Path -LiteralPath $qaEmptySave) -and @(Get-ChildItem -LiteralPath $qaEmptySave -Force).Count -gt 0){throw 'Native engine save directory is not empty'}
$qaBytes=0L
foreach($qaName in $qaCases){$qaItem=Get-Item -LiteralPath (Join-Path $qaRoot ($qaName+'.qsp'));if($qaItem.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'QSP unexpectedly reparse point'};$qaBytes+=$qaItem.Length}
foreach($qaName in @('content','json')){
 $qaLink=Join-Path $qaRoot $qaName;$qaItem=Get-Item -LiteralPath $qaLink -Force
 if(-not ($qaItem.Attributes -band [IO.FileAttributes]::ReparsePoint)){throw ('Not a junction: '+$qaLink)}
 $qaTarget=[IO.Path]::GetFullPath([string](@($qaItem.Target)[0]));if($qaTarget -ne (Join-Path $qaGame $qaName)){throw ('Unexpected junction target: '+$qaTarget)}
 [IO.Directory]::Delete($qaLink)
}
if(@(Get-ChildItem -LiteralPath $qaRoot -Recurse -Force | Where-Object {$_.Attributes -band [IO.FileAttributes]::ReparsePoint}).Count -gt 0){throw 'Unexpected remaining reparse point'}
Remove-Item -LiteralPath $qaRoot -Recurse -Force
if(Test-Path -LiteralPath $qaRoot){throw 'Diagnostic root remains'}
if(-not (Test-Path -LiteralPath (Join-Path $qaGame 'content')) -or -not (Test-Path -LiteralPath (Join-Path $qaGame 'json'))){throw 'Resource target missing'}
Write-Output ('CLEANED diagnostic QSP bytes='+$qaBytes+'; junction targets preserved')
