$ErrorActionPreference='Stop'
$workspace=Split-Path -Parent $PSScriptRoot
$stage=Join-Path $workspace 'tmp\cutscene-view'
$project='C:\Users\Ken Choung\Documents\Codex\2026-10-06\task\JO9sa'
$game='C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex\game'
$v=Get-Content -LiteralPath "$stage\validation.json" -Raw | ConvertFrom-Json
if((Get-FileHash -LiteralPath "$game\jack.qsp").Hash.ToLower() -ne $v.qspBefore){throw '게임 코드가 준비 이후 바뀌었습니다.'}
if((Get-FileHash -LiteralPath "$game\css\base.css").Hash.ToLower() -ne $v.cssBefore){throw '게임 스타일이 준비 이후 바뀌었습니다.'}
$backup=Join-Path $project ('tools\local-workspace\runtime\cutscene-view-backups\'+(Get-Date -Format 'yyyyMMdd_HHmmss'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
$persistent="$project\mods\2026-10-08_persistent_image_cycle.json"
$generator="$project\tools\prepare-image-cycle.cjs"
Copy-Item -LiteralPath "$game\jack.qsp" -Destination "$backup\jack.qsp"
Copy-Item -LiteralPath "$game\css\base.css" -Destination "$backup\base.css"
Copy-Item -LiteralPath $persistent -Destination "$backup\persistent.json"
Copy-Item -LiteralPath $generator -Destination "$backup\prepare-image-cycle.cjs"
try {
 Copy-Item -LiteralPath "$stage\candidate.qsp" -Destination "$game\jack.qsp" -Force
 Copy-Item -LiteralPath "$stage\base.css" -Destination "$game\css\base.css" -Force
 $record=Get-Content -LiteralPath $persistent -Raw | ConvertFrom-Json
 $edit=$record.edits | Where-Object location -eq 'interior_change'
 $edit.new=[IO.File]::ReadAllText("$stage\handler-prefix.txt");$record.after_sha256=$v.qspAfter
 [IO.File]::WriteAllText($persistent,($record | ConvertTo-Json -Depth 30),[Text.UTF8Encoding]::new($false))
 Copy-Item -LiteralPath "$stage\prepare-image-cycle.cjs" -Destination $generator -Force
 if((Get-FileHash -LiteralPath "$game\jack.qsp").Hash.ToLower() -ne $v.qspAfter){throw '게임 코드 복사 검증 실패'}
 if((Get-FileHash -LiteralPath "$game\css\base.css").Hash.ToLower() -ne $v.cssAfter){throw '게임 스타일 복사 검증 실패'}
 Copy-Item -LiteralPath "$stage\2026-10-08_cutscene_only_view.json" -Destination "$project\mods\2026-10-08_cutscene_only_view.json"
} catch {
 Copy-Item -LiteralPath "$backup\jack.qsp" -Destination "$game\jack.qsp" -Force
 Copy-Item -LiteralPath "$backup\base.css" -Destination "$game\css\base.css" -Force
 Copy-Item -LiteralPath "$backup\persistent.json" -Destination $persistent -Force
 Copy-Item -LiteralPath "$backup\prepare-image-cycle.cjs" -Destination $generator -Force
 throw
}
Write-Output "적용 및 해시 검증 완료. 백업: $backup"
