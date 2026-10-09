$ErrorActionPreference='Stop'
$workspace=Split-Path -Parent $PSScriptRoot
$stage=Join-Path $workspace 'tmp\dialogue-nav-alignment'
$project='C:\Users\Ken Choung\Documents\Codex\2026-10-06\task\JO9sa'
$game='C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex\game'
$v=Get-Content -LiteralPath "$stage\validation.json" -Raw | ConvertFrom-Json
if((Get-FileHash -LiteralPath "$game\css\base.css").Hash.ToLower() -ne $v.cssBefore){throw '스타일이 준비 이후 변경되었습니다.'}
if((Get-FileHash -LiteralPath "$game\jack.qsp").Hash.ToLower() -ne $v.qspUnchanged){throw '게임 코드가 준비 이후 변경되었습니다.'}
$backup=Join-Path $project ('tools\local-workspace\runtime\dialogue-nav-backups\'+(Get-Date -Format 'yyyyMMdd_HHmmss'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item -LiteralPath "$game\css\base.css" -Destination "$backup\base.css"
try {
 Copy-Item -LiteralPath "$stage\base.css" -Destination "$game\css\base.css" -Force
 if((Get-FileHash -LiteralPath "$game\css\base.css").Hash.ToLower() -ne $v.cssAfter){throw '스타일 복사 검증 실패'}
 if((Get-FileHash -LiteralPath "$game\jack.qsp").Hash.ToLower() -ne $v.qspUnchanged){throw '게임 코드 보존 검증 실패'}
 Copy-Item -LiteralPath "$stage\navigation.css" -Destination "$project\tools\dialogue-navigation.css" -Force
 Copy-Item -LiteralPath "$stage\validation.json" -Destination "$backup\validation.json"
} catch {
 Copy-Item -LiteralPath "$backup\base.css" -Destination "$game\css\base.css" -Force
 throw
}
Write-Output "대사 화살표 정렬 적용 완료. 게임 코드와 클릭 동작 보존. 백업: $backup"
