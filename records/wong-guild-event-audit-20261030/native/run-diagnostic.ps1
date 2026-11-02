param([Parameter(Mandatory=$true)][string]$Engine,[Parameter(Mandatory=$true)][string]$Plan,[ValidateRange(1,60)][int]$TimeoutSeconds=30)
$ErrorActionPreference='Stop'
$probeRoot=Split-Path -Parent ([IO.Path]::GetFullPath($Plan))
$probePlan=ConvertFrom-Json -InputObject ([IO.File]::ReadAllText($Plan))
$probeResults=@()
foreach($probe in $probePlan){
 $probeProcess=$null
 $probeStart=Get-Date
 $probeResult=[ordered]@{name=$probe.name;checkpoint=$probe.checkpoint;pass=$false;reason='';marker='';durationMs=0}
 try{
  if($probe.name -notmatch '^(baseline|candidate)$'){throw 'Invalid diagnostic plan'}
  if((Split-Path -Parent ([IO.Path]::GetFullPath($probe.file))) -ne $probeRoot){throw 'Fixture must be inside diagnostic directory'}
  $probeStderr=Join-Path $probeRoot ($probe.name+'-stderr.log')
  $probeStdout=Join-Path $probeRoot ($probe.name+'-stdout.log')
  $probeProcess=Start-Process -FilePath $Engine -ArgumentList ('"'+$probe.file+'"') -WorkingDirectory $probeRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput $probeStdout -RedirectStandardError $probeStderr
  $probeDeadline=(Get-Date).AddSeconds($TimeoutSeconds)
  $probePattern='showMessage\(\), str:\s*"('+[regex]::Escape($probe.marker)+'[^"\r\n]*)"'
  do{
   Start-Sleep -Milliseconds 250
   $probeLog=if(Test-Path -LiteralPath $probeStderr){Get-Content -LiteralPath $probeStderr -Raw -Encoding UTF8}else{''}
   if($probeLog -match $probePattern){
    $probeResult.marker=[uri]::UnescapeDataString($Matches[1])
    $state=$probeResult.marker -match '\|REP=40\|ILL=0\|PARA=0\|GUARD=1\|NPC=master_vong\|TXT2LEN=3\|EVENTS=1\|'
    if($probe.name -eq 'baseline'){$dom=$probeResult.marker -match '\|DOMLEN=0\|WONG=1\|LINE1=0\|LINE2=0\|CLIENTHEIGHT='}
    else{$dom=$probeResult.marker -match '\|DOMLEN=[1-9][0-9]*\|WONG=1\|LINE1=1\|LINE2=1\|CLIENTHEIGHT='}
    $probeResult.pass=$state -and $dom
    if(-not $probeResult.pass){$probeResult.reason='Native state or DOM expectation failed'}
    break
   }
   if($probeLog -match 'showMessage\(\), str:.*FAIL_'){$probeResult.reason='Diagnostic assertion failed';break}
   if($probeProcess.HasExited){$probeResult.reason='Engine exited before completion';break}
  }while((Get-Date) -lt $probeDeadline)
  if(-not $probeResult.pass -and -not $probeResult.reason){$probeResult.reason='Completion marker timeout'}
 }catch{$probeResult.reason=$_.Exception.Message}
 finally{
  if($null -ne $probeProcess){Stop-Process -Id $probeProcess.Id -ErrorAction SilentlyContinue}
  $probeResult.durationMs=[int]((Get-Date)-$probeStart).TotalMilliseconds
  $probeResults += [pscustomobject]$probeResult
  Write-Output ($probe.name+': '+$probeResult.pass+' '+$probeResult.marker+' '+$probeResult.reason)
 }
}
ConvertTo-Json -InputObject @($probeResults) -Depth 4 | Set-Content -LiteralPath (Join-Path $probeRoot 'client-results.json') -Encoding UTF8
if(@($probeResults | Where-Object {-not $_.pass}).Count -gt 0){exit 1}
