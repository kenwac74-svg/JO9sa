$ErrorActionPreference='Stop'
$rec='G:/somi/JO9sa/records/dealer-economy-20261024'
$plan=Get-Content -LiteralPath ($rec+'/cleanup-plan.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$target=[IO.Path]::GetFullPath($plan.tempRoot)
$expected=[IO.Path]::GetFullPath('G:/Codex/tmp/jo9-dealer-economy-20261024')
if($target -ne $expected -or $target -notlike 'G:\Codex\tmp\jo9-dealer-economy-*'){throw 'Unexpected temp root'}
function Check-NoLinks([string]$Path){
 $item=Get-Item -LiteralPath $Path -Force
 if(($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0){throw ('Reparse point: '+$Path)}
 if($item.PSIsContainer){foreach($child in Get-ChildItem -LiteralPath $Path -Force){Check-NoLinks $child.FullName}}
}
if(Test-Path -LiteralPath $target){Check-NoLinks $target}
foreach($file in $plan.backups){
 $path=[IO.Path]::GetFullPath($file.path)
 if((Split-Path -Parent $path) -ne [IO.Path]::GetFullPath($plan.gameRoot) -or (Split-Path -Leaf $path) -notmatch '^jack\.qsp\.bak_\d{8}_\d{6}$'){throw 'Unexpected backup path'}
 if((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLower() -ne $file.sha256){throw 'Backup changed'}
 Check-NoLinks $path
}
foreach($file in $plan.recordTransient){
 $path=[IO.Path]::GetFullPath($file)
 if(-not $path.StartsWith([IO.Path]::GetFullPath($rec)+[IO.Path]::DirectorySeparatorChar)){throw 'Unexpected record path'}
 Check-NoLinks $path
}
foreach($file in $plan.backups){Remove-Item -LiteralPath $file.path -Force}
foreach($file in $plan.recordTransient){Remove-Item -LiteralPath $file -Force}
if(Test-Path -LiteralPath $target){Remove-Item -LiteralPath $target -Recurse -Force}
if(Test-Path -LiteralPath $target){throw 'Temporary root remains'}
[ordered]@{status='PASS';tempRootAbsent=$true;verifiedDuplicateBackupsRemoved=@($plan.backups).Count;transientRecordsRemoved=@($plan.recordTransient).Count;reparsePointsFollowed=$false} | ConvertTo-Json | Set-Content -LiteralPath ($rec+'/cleanup.json') -Encoding UTF8
Write-Output 'Scoped temporary cleanup PASS'
