$ErrorActionPreference='Stop'
$source=Split-Path -Parent $PSScriptRoot
$project='C:\Users\Ken Choung\Documents\Codex\2026-10-06\task\JO9sa'
$game='C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex\game'
$runtime=Join-Path $project 'tools\local-workspace\runtime'
$backup=Join-Path $runtime ('original-sync-install\'+(Get-Date -Format 'yyyyMMdd_HHmmss'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
$pairs=@(
 @('tools\text-workshop\server.cjs',"$project\tools\text-workshop\server.cjs"),
 @('tools\text-workshop\server.cjs',"$game\modtools\text-workshop\server.cjs"),
 @('tools\cut-addition\original-cuts.cjs',"$project\tools\text-workshop\original-cuts.cjs"),
 @('tools\cut-addition\original-cuts.cjs',"$game\modtools\text-workshop\original-cuts.cjs"),
 @('tools\cut-addition\original-cuts.cjs',"$project\tools\cut-addition\original-cuts.cjs"),
 @('tools\cut-addition\catalog_cuts.js',"$project\tools\local-workspace\catalog\catalog_cuts.js"),
 @('tools\cut-addition\catalog_cuts.js',"$project\tools\local-workspace\catalog-seed\catalog_cuts.js"),
 @('tools\cut-addition\catalog_cuts.js',"$project\tools\cut-addition\catalog_cuts.js"),
 @('tools\cut-addition\catalog_workshop.js',"$project\tools\local-workspace\catalog\catalog_workshop.js"),
 @('tools\cut-addition\catalog_workshop.js',"$project\tools\local-workspace\catalog-seed\catalog_workshop.js"),
 @('tools\cut-addition\catalog_workshop.js',"$project\tools\cut-addition\catalog_workshop.js")
)
$state=Get-Content -LiteralPath "$runtime\server.json" -Raw | ConvertFrom-Json
$process=Get-CimInstance Win32_Process -Filter "ProcessId=$($state.pid)"
if(!$process -or !$process.CommandLine.Contains("$project\tools\text-workshop\server.cjs") -or $state.target -ne "$game\jack.qsp"){throw '실행 중인 모딩 도구 확인 실패'}
$index=0
foreach($pair in $pairs){$from=Join-Path $source $pair[0];$to=$pair[1];if(Test-Path -LiteralPath $to){Copy-Item -LiteralPath $to -Destination (Join-Path $backup ("$index-"+[IO.Path]::GetFileName($to)))};Copy-Item -LiteralPath $from -Destination $to -Force;if((Get-FileHash -LiteralPath $from).Hash -ne (Get-FileHash -LiteralPath $to).Hash){throw '설치 파일 검증 실패'};$index++}
Stop-Process -Id $state.pid
& "$project\tools\local-workspace\Start-JO9-Tools.ps1" -NoBrowser
Write-Output "설치 완료. 백업: $backup"
