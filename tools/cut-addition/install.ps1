$ErrorActionPreference='Stop'
$project='C:\Users\Ken Choung\Documents\Codex\2026-10-06\task\JO9sa'
$game='C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex\game'
$stage=$PSScriptRoot
$stamp=Get-Date -Format 'yyyyMMdd_HHmmss'
function Install-File($name,$destination){
 if(Test-Path -LiteralPath $destination){Copy-Item -LiteralPath $destination -Destination ($destination+'.bak_'+$stamp)}
 Copy-Item -LiteralPath (Join-Path $stage $name) -Destination $destination
}
foreach($dir in @((Join-Path $project 'tools\text-workshop'),(Join-Path $game 'modtools\text-workshop'))){
 foreach($name in @('server.cjs','image-cuts.cjs','check-image-cycle-syntax.cjs','apply_mods.ps1')){Install-File $name (Join-Path $dir $name)}
}
foreach($dir in @((Join-Path $project 'tools\local-workspace\catalog'),(Join-Path $project 'tools\local-workspace\catalog-seed'),(Join-Path $project 'tools\imgmg'))){
 Install-File 'catalog_cuts.js' (Join-Path $dir 'catalog_cuts.js')
}
Install-File 'JO9_Place_Workshop.html' (Join-Path $game 'modtools\place\JO9_Place_Workshop.html')
$old=Join-Path $game 'content\pic\characters\Tsyuansu_2.png'
$new=Join-Path $game 'content\pic\characters\Tsyuansu (2).png'
if((Test-Path -LiteralPath $old) -and !(Test-Path -LiteralPath $new)){
 if((Get-FileHash -LiteralPath $old).Hash -ne '3D040C1BC587F4287C28476DA5AEB4C3E5423248BF22BC70CA22B116A8A49668'){throw '주안수 B컷 내용이 바뀌었습니다.'}
 Move-Item -LiteralPath $old -Destination $new
}
foreach($base in @($project,(Split-Path (Split-Path $stage -Parent) -Parent))){
 $resource=Join-Path $base 'resources\new\content\pic\characters\Tsyuansu_2.png'
 if(Test-Path -LiteralPath $resource){Move-Item -LiteralPath $resource -Destination (Join-Path (Split-Path $resource -Parent) 'Tsyuansu (2).png')}
}
Write-Output ('Installed cut UI/API. Backups: .bak_'+$stamp)
