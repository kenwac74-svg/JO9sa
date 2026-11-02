param([Parameter(Mandatory=$true)][string]$Engine,[Parameter(Mandatory=$true)][string]$Plan,[ValidateRange(1,60)][int]$TimeoutSeconds=30)
$ErrorActionPreference='Stop'
$probeRoot=Split-Path -Parent ([IO.Path]::GetFullPath($Plan))
$probePlan=ConvertFrom-Json -InputObject ([IO.File]::ReadAllText($Plan))
$probeResults=@()
foreach($probe in $probePlan){
 $probeProcess=$null
 $probeStart=Get-Date
 $probeResult=[ordered]@{name=$probe.name;checkpoint=$probe.checkpoint;pass=$false;reason='';marker='';durationMs=0;overflow=$false}
 try{
  if($probe.name -notmatch '^[a-z-]+$'){throw 'Invalid diagnostic plan'}
  if((Split-Path -Parent ([IO.Path]::GetFullPath($probe.file))) -ne $probeRoot){throw 'Fixture must be inside diagnostic directory'}
  $probeStderr=Join-Path $probeRoot ($probe.name+'-stderr.log')
  $probeStdout=Join-Path $probeRoot ($probe.name+'-stdout.log')
  $probeProcess=Start-Process -FilePath $Engine -ArgumentList ('"'+$probe.file+'"') -WorkingDirectory $probeRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput $probeStdout -RedirectStandardError $probeStderr
  $probeDeadline=(Get-Date).AddSeconds($TimeoutSeconds)
  $probePattern='showMessage\(\), str:\s*"('+[regex]::Escape($probe.marker)+'[^"\r\n]*)"'
  do{
   Start-Sleep -Milliseconds 250
   $probeLog=if(Test-Path -LiteralPath $probeStderr){Get-Content -LiteralPath $probeStderr -Raw -Encoding UTF8}else{''}
   if($probeLog -match $probePattern){$probeResult.marker=[uri]::UnescapeDataString($Matches[1]);break}
   if($probeLog -match 'showMessage\(\), str:.*FAIL_'){$probeResult.reason='Diagnostic assertion failed';break}
   if($probeProcess.HasExited){$probeResult.reason='Engine exited before completion';break}
  }while((Get-Date) -lt $probeDeadline)
  if(-not $probeResult.marker -and -not $probeResult.reason){$probeResult.reason='Completion marker timeout'}
 }catch{$probeResult.reason=$_.Exception.Message}
 finally{
  if($null -ne $probeProcess){Stop-Process -Id $probeProcess.Id -ErrorAction SilentlyContinue}
  $probeResult.durationMs=[int]((Get-Date)-$probeStart).TotalMilliseconds
  # Detailed case-specific states and DOM bounds are asserted by analyze-results.cjs.
  $probeResult.pass=[bool]$probeResult.marker
  $probeResults += [pscustomobject]$probeResult
  Write-Output ($probe.name+': marker='+[bool]$probeResult.marker+' '+$probeResult.reason)
 }
}
ConvertTo-Json -InputObject @($probeResults) -Depth 4 | Set-Content -LiteralPath (Join-Path $probeRoot 'client-results.json') -Encoding UTF8
if(@($probeResults | Where-Object {-not $_.pass}).Count -gt 0){exit 1}
