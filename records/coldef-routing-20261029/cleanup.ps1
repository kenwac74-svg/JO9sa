$ErrorActionPreference='Stop'
$taskRecord='G:/somi/JO9sa/records/coldef-routing-20261029'
$workspaceRecord='C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/output/coldef-routing-20261029'
$taskRoots=@('G:/Codex/tmp/coldef-routing-20261029','G:/Codex/tmp/coldef-routing-finalgate-20261029','G:/Codex/tmp/coldef-routing-finalgate-gold-20261029','G:/Codex/tmp/coldef-routing-baseline-control-20261029') | ForEach-Object {[IO.Path]::GetFullPath($_)}
$script:removedBytes=0L
$script:removedFiles=0
$script:removedLinks=0
function Remove-TaskNode([string]$literal){
 $absolute=[IO.Path]::GetFullPath($literal)
 $inside=$false
 foreach($allowed in $taskRoots){if($absolute.Equals($allowed,[StringComparison]::OrdinalIgnoreCase) -or $absolute.StartsWith($allowed+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){$inside=$true;break}}
 if(-not $inside){throw ('Cleanup target outside exact task roots: '+$absolute)}
 $node=Get-Item -LiteralPath $absolute -Force
 if($node.Attributes -band [IO.FileAttributes]::ReparsePoint){
  if($node.PSIsContainer){[IO.Directory]::Delete($absolute)}else{Remove-Item -LiteralPath $absolute -Force}
  $script:removedLinks++;return
 }
 if($node.PSIsContainer){foreach($child in Get-ChildItem -LiteralPath $absolute -Force){Remove-TaskNode $child.FullName};[IO.Directory]::Delete($absolute)}
 else{$script:removedBytes+=$node.Length;$script:removedFiles++;Remove-Item -LiteralPath $absolute -Force}
}
$installed=Get-Content -LiteralPath ($taskRecord+'/installation.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if($installed.status -ne 'INSTALLED' -or $installed.officialGate -ne 'PASS'){throw 'Installation must be verified first'}
if((Get-FileHash -LiteralPath 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp' -Algorithm SHA256).Hash.ToLower() -ne $installed.after){throw 'Current QSP changed'}
$gate='G:/Codex/tmp/coldef-routing-finalgate-gold-20261029/run-t7myQN'
$clientLogs=$taskRecord+'/client-logs'
New-Item -ItemType Directory -Path $clientLogs -Force | Out-Null
foreach($file in Get-ChildItem -LiteralPath ($gate+'/client') -File -Filter '*-stderr.log'){Copy-Item -LiteralPath $file.FullName -Destination (Join-Path $clientLogs $file.Name)}
Copy-Item -LiteralPath ($gate+'/client/client-results.json') -Destination ($taskRecord+'/client-results.json')
foreach($name in @('baseline-control-cache-stderr.log','baseline-control-newgame-stderr.log')){Copy-Item -LiteralPath (Join-Path $workspaceRecord $name) -Destination (Join-Path $taskRecord $name)}
foreach($taskRoot in $taskRoots){if(Test-Path -LiteralPath $taskRoot){Remove-TaskNode $taskRoot}}
$result=[ordered]@{removedBytes=$script:removedBytes;removedFiles=$script:removedFiles;removedJunctionsOnly=$script:removedLinks;roots=$taskRoots;allRootsAbsent=(@($taskRoots|Where-Object{Test-Path -LiteralPath $_}).Count -eq 0);preserved='original compressed QSP, patch, source scripts, official/native/independent reports and core engine logs'}
$result | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath ($taskRecord+'/cleanup.json') -Encoding UTF8
$installed.temporaryCleanupPending=$false
$installed | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath ($taskRecord+'/installation.json') -Encoding UTF8
Copy-Item -LiteralPath ($taskRecord+'/cleanup.json') -Destination ($workspaceRecord+'/cleanup.json')
Copy-Item -LiteralPath ($taskRecord+'/installation.json') -Destination ($workspaceRecord+'/installation.json')
$result | ConvertTo-Json -Depth 4
