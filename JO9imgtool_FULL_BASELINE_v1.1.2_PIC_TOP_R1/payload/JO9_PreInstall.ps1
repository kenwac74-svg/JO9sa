param([Parameter(Mandatory=$true)][string]$GameRoot)
$ErrorActionPreference='Stop'
function N([string]$p){if([string]::IsNullOrWhiteSpace($p)){return ''};try{return ([IO.Path]::GetFullPath($p)).TrimEnd('\').ToLowerInvariant()}catch{return $p.TrimEnd('\').ToLowerInvariant()}}
$target=N (Join-Path $GameRoot 'game\engine\jack.exe')
$matches=@()
Get-CimInstance Win32_Process -Filter "Name='jack.exe'" -ErrorAction SilentlyContinue | ForEach-Object {
 $path=N $_.ExecutablePath
 if($path -and $path -eq $target){
  try{$gp=Get-Process -Id $_.ProcessId -ErrorAction Stop;$matches += [pscustomobject]@{Id=[int]$_.ProcessId;Handle=[int64]$gp.MainWindowHandle}}catch{}
 }
}
foreach($p in $matches){
 $gp=Get-Process -Id $p.Id -ErrorAction SilentlyContinue;if(-not $gp){continue}
 if($gp.MainWindowHandle -eq 0){Stop-Process -Id $p.Id -Force -ErrorAction Stop;continue}
 [void]$gp.CloseMainWindow()
 $end=[DateTime]::UtcNow.AddSeconds(6)
 while([DateTime]::UtcNow -lt $end){Start-Sleep -Milliseconds 250;if(-not(Get-Process -Id $p.Id -ErrorAction SilentlyContinue)){break}}
 if(Get-Process -Id $p.Id -ErrorAction SilentlyContinue){Write-Error 'JO9 is still open.';exit 20}
}
exit 0
