# 선언형 명기 패치의 실제 적용 도구 호환성과 멱등성을 쓰기 없이 검증한다.
param([string]$Baseline='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',[string]$Candidate='G:/Codex/tmp/hover-meiki-fix-20261021/meiki/meiki-candidate.qsp')
$ErrorActionPreference='Stop'
$taskRoot=[IO.Path]::GetFullPath('G:/Codex/tmp/hover-meiki-fix-20261021/meiki')
$taskMods=Join-Path $taskRoot 'applycheck-mod'
if(Test-Path -LiteralPath $taskMods){throw 'Diagnostic staging directory already exists'}
New-Item -ItemType Directory -Path $taskMods | Out-Null
try {
 Copy-Item -LiteralPath (Join-Path $taskRoot 'meiki-room-role-routing.json') -Destination (Join-Path $taskMods 'meiki-room-role-routing.json')
 foreach($taskPair in @(@('before',$Baseline),@('after',$Candidate))){
  $taskLog=Join-Path $taskRoot ('apply-dryrun-'+$taskPair[0]+'.log')
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'G:/somi/JO9sa/tools/apply_mods.ps1' -Qsp $taskPair[1] -ModsDir $taskMods -DryRun *>&1 | Out-File -LiteralPath $taskLog -Encoding utf8
  if($LASTEXITCODE -ne 0){throw ('apply_mods dry-run failed: '+$taskPair[0])}
 }
} finally {
 $taskResolved=[IO.Path]::GetFullPath($taskMods)
 if($taskResolved -ne (Join-Path $taskRoot 'applycheck-mod')){throw 'Unexpected staging path'}
 if(Test-Path -LiteralPath $taskMods){
  $taskItem=Get-Item -LiteralPath $taskMods
  if($taskItem.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Refuse staging link cleanup'}
  $taskCopy=Join-Path $taskMods 'meiki-room-role-routing.json'
  if(Test-Path -LiteralPath $taskCopy){Remove-Item -LiteralPath $taskCopy}
  Remove-Item -LiteralPath $taskMods
 }
}
Write-Output 'Exact patch DryRun and idempotence PASS'