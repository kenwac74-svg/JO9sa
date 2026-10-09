$ErrorActionPreference='Stop'
$source=Split-Path -Parent $PSScriptRoot
$project='C:\Users\Ken Choung\Documents\Codex\2026-10-06\task\JO9sa'
$game='C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex\game'
$runtime=Join-Path $project 'tools\local-workspace\runtime'
$state=Get-Content -LiteralPath "$runtime\server.json" -Raw | ConvertFrom-Json
$process=Get-CimInstance Win32_Process -Filter "ProcessId=$($state.pid)"
if(!$process -or !$process.CommandLine.Contains("$project\tools\text-workshop\server.cjs") -or $state.target -ne "$game\jack.qsp"){throw '실행 중인 대사 편집기 확인 실패'}
$before=(Get-FileHash -LiteralPath "$game\jack.qsp").Hash
$expected=@{'server.cjs'='D803972F71943661BE67275C9FA0DA7A493A949FF393D7BFEF295FEE1B148650';'index.html'='AF0DE1C915213674AA8A77B758ED76413DC1985226340F5D4F4AA966A570FDED'}
foreach($name in $expected.Keys){if((Get-FileHash -LiteralPath "$project\tools\text-workshop\$name").Hash -ne $expected[$name]){throw "다른 작업에서 편집기가 변경되었습니다: $name"}}
$backup=Join-Path $runtime ('dialogue-add-install\'+(Get-Date -Format 'yyyyMMdd_HHmmss'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
$manifest=@();$index=0
foreach($target in @("$project\tools\text-workshop","$game\modtools\text-workshop")){
 foreach($name in @('addition.cjs','addition-pages.cjs','server.cjs','index.html')){
  $from=Join-Path $source "tools\text-workshop\$name";$to=Join-Path $target $name
  $saved=$null
  if(Test-Path -LiteralPath $to){$saved=Join-Path $backup "$index-$name";Copy-Item -LiteralPath $to -Destination $saved}
  $manifest+=@{target=$to;backup=$saved;source=$from}
  Copy-Item -LiteralPath $from -Destination $to -Force
  if((Get-FileHash -LiteralPath $from).Hash -ne (Get-FileHash -LiteralPath $to).Hash){throw '설치 검증 실패'}
  $index++
 }
}
$manifest | ConvertTo-Json | Set-Content -LiteralPath "$backup\manifest.json" -Encoding UTF8
Stop-Process -Id $state.pid
& "$project\tools\local-workspace\Start-JO9-Tools.ps1" -NoBrowser
if((Get-FileHash -LiteralPath "$game\jack.qsp").Hash -ne $before){throw '게임 파일 변경 감지'}
Write-Output "대사 추가 기능 설치 완료. 게임 QSP 변경 없음. 백업: $backup"
