$ErrorActionPreference='Stop'
$workspace=Split-Path -Parent $PSScriptRoot
$project='C:\Users\Ken Choung\Documents\Codex\2026-10-06\task\JO9sa'
$game='C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex\game'
$stage=Join-Path $PSScriptRoot 'cut-addition'
$runtime=Join-Path $project 'tools\local-workspace\runtime'
$node='C:\Users\Ken Choung\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$stamp=Get-Date -Format 'yyyyMMdd_HHmmss'
$backup=Join-Path $runtime ('original-cut-install-backups\'+$stamp)
if((Get-FileHash -LiteralPath (Join-Path $game 'jack.qsp')).Hash -ne '9ED938684D9750E5903BE572BDDB55A16CF74F919F2F8B6B9744A102C09F1D7D'){throw 'Validated game hash has changed.'}
$ready=Join-Path $runtime 'server.json'
if(Test-Path -LiteralPath $ready){
 $state=Get-Content -LiteralPath $ready -Raw | ConvertFrom-Json
 $running=Get-CimInstance Win32_Process -Filter "ProcessId=$($state.pid)" -ErrorAction SilentlyContinue
 $expectedSource=Join-Path $project 'tools\text-workshop\server.cjs'
 if($running){if(!$running.CommandLine.Contains($expectedSource) -or $state.target -ne (Join-Path $game 'jack.qsp')){throw 'Server identity does not match this project.'};Stop-Process -Id $state.pid}
}
function Install-File($name,$destination,$label){
 if(Test-Path -LiteralPath $destination){$prior=Join-Path $backup ($label+'\'+$name);New-Item -ItemType Directory -Path (Split-Path -Parent $prior) -Force | Out-Null;Copy-Item -LiteralPath $destination -Destination $prior}
 Copy-Item -LiteralPath (Join-Path $stage $name) -Destination $destination
}
foreach($item in @(@{dir=(Join-Path $project 'tools\text-workshop');label='project-server'},@{dir=(Join-Path $game 'modtools\text-workshop');label='game-server'})){
 foreach($name in @('server.cjs','image-cuts.cjs','original-cuts.cjs','pic-local.cjs')){Install-File $name (Join-Path $item.dir $name) $item.label}
}
foreach($item in @(@{dir=(Join-Path $project 'tools\local-workspace\catalog');label='live-catalog'},@{dir=(Join-Path $project 'tools\local-workspace\catalog-seed');label='catalog-seed'},@{dir=(Join-Path $project 'tools\imgmg');label='imgmg'})){
 foreach($name in @('catalog_cuts.js','catalog_workshop.js')){Install-File $name (Join-Path $item.dir $name) $item.label}
 $html=Join-Path $item.dir 'catalog_merge_vs_original.html'
 if(Test-Path -LiteralPath $html){$copy=Join-Path $backup ($item.label+'\catalog_merge_vs_original.html');Copy-Item -LiteralPath $html -Destination $copy; $text=[IO.File]::ReadAllText($html);$text=$text.Replace('원본과 플레이 폴더 그림(머지본) 둘 다 특색이 있어 따로 보관. 추후 [원본스타일]·[올걸팩스타일]·[SNK스타일] 전환 기능에서 게임 QSP가 경로를 연결해 줄 대상(물리적 위치는 그대로).','JO9O 원본을 B컷 경로로 연결합니다. A와 원본 파일은 유지하며, 새 컷은 C부터 추가합니다. 원본이 없으면 B번호만 예약합니다.');[IO.File]::WriteAllText($html,$text,(New-Object Text.UTF8Encoding($false)))}
}
try{
 & $node (Join-Path $PSScriptRoot 'apply-original-cut-rule.cjs')
 if($LASTEXITCODE -ne 0){throw 'Original B-cut bulk registration failed.'}
}finally{
 & (Join-Path $project 'tools\local-workspace\Start-JO9-Tools.ps1') -NoBrowser
}
Write-Output ('Original-cut rule installed. Tool backup: '+$backup)
