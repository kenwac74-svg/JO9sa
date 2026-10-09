$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$v=Get-Content -LiteralPath (Join-Path $root 'tmp\retained-ui-latest.json') -Raw | ConvertFrom-Json
$game='C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex\game'
if((Get-FileHash -LiteralPath "$game\jack.qsp").Hash.ToLower() -ne $v.qspBefore){throw '게임 코드 변경 감지'}
if((Get-FileHash -LiteralPath "$game\css\base.css").Hash.ToLower() -ne $v.cssBefore){throw 'UI 스타일 변경 감지'}
$backup=Join-Path $game ('ui-backups\retained-original-'+(Get-Date -Format 'yyyyMMdd_HHmmss'))
New-Item -ItemType Directory -Path "$backup\css" -Force | Out-Null
Copy-Item -LiteralPath "$game\jack.qsp" -Destination "$backup\jack.qsp"
Copy-Item -LiteralPath "$game\css\base.css" -Destination "$backup\css\base.css"
Copy-Item -LiteralPath (Join-Path $v.out 'validation.json') -Destination "$backup\validation.json"
try {
 Copy-Item -LiteralPath (Join-Path $v.out 'game\jack.qsp') -Destination "$game\jack.qsp" -Force
 Copy-Item -LiteralPath (Join-Path $v.out 'game\css\base.css') -Destination "$game\css\base.css" -Force
 if((Get-FileHash -LiteralPath "$game\jack.qsp").Hash.ToLower() -ne $v.qspAfter){throw 'QSP 검증 실패'}
 if((Get-FileHash -LiteralPath "$game\css\base.css").Hash.ToLower() -ne $v.cssAfter){throw 'CSS 검증 실패'}
}catch{
 Copy-Item -LiteralPath "$backup\jack.qsp" -Destination "$game\jack.qsp" -Force
 Copy-Item -LiteralPath "$backup\css\base.css" -Destination "$game\css\base.css" -Force
 throw
}
Write-Output "원래 UI 복원 및 승인 조정 유지 완료. 백업: $backup"
