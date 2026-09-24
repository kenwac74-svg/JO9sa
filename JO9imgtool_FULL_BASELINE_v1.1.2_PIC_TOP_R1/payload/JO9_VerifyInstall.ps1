param(
 [Parameter(Mandatory=$true)][string]$GameRoot,
 [Parameter(Mandatory=$true)][string]$Manifest
)
$ErrorActionPreference='Stop'
$items=Get-Content -LiteralPath $Manifest -Raw | ConvertFrom-Json
foreach($x in $items){
 $p=Join-Path $GameRoot ([string]$x.destination)
 if(-not(Test-Path -LiteralPath $p)){Write-Error ("Missing: "+$p);exit 2}
 $h=(Get-FileHash -Algorithm SHA256 -LiteralPath $p).Hash
 if($h -ne [string]$x.sha256){Write-Error ("Hash mismatch: "+$p);exit 3}
}
exit 0
