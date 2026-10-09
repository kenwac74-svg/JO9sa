$ErrorActionPreference='Stop'
$workspace=Split-Path -Parent $PSScriptRoot
$stage=Join-Path $workspace 'tmp\cutscene-view-fix'
$project='C:\Users\Ken Choung\Documents\Codex\2026-10-06\task\JO9sa'
$game='C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex\game'
$v=Get-Content -LiteralPath "$stage\validation.json" -Raw | ConvertFrom-Json
if((Get-FileHash -LiteralPath "$game\jack.qsp").Hash.ToLower() -ne $v.qspBefore){throw '게임 코드가 준비 이후 바뀌었습니다.'}
$backup=Join-Path $project ('tools\local-workspace\runtime\cutscene-view-backups\fix_'+(Get-Date -Format 'yyyyMMdd_HHmmss'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
$persistent="$project\mods\2026-10-08_persistent_image_cycle.json"
$generator="$project\tools\prepare-image-cycle.cjs"
Copy-Item -LiteralPath "$game\jack.qsp" -Destination "$backup\jack.qsp"
Copy-Item -LiteralPath $persistent -Destination "$backup\persistent.json"
Copy-Item -LiteralPath $generator -Destination "$backup\prepare-image-cycle.cjs"
try {
 Copy-Item -LiteralPath "$stage\candidate.qsp" -Destination "$game\jack.qsp" -Force
 $record=Get-Content -LiteralPath $persistent -Raw | ConvertFrom-Json
 $edit=$record.edits | Where-Object location -eq 'interior_change'
 $edit.new=[IO.File]::ReadAllText("$stage\handler-prefix.txt");$record.after_sha256=$v.qspAfter
 [IO.File]::WriteAllText($persistent,($record | ConvertTo-Json -Depth 30),[Text.UTF8Encoding]::new($false))
 Copy-Item -LiteralPath "$stage\prepare-image-cycle.cjs" -Destination $generator -Force
 if((Get-FileHash -LiteralPath "$game\jack.qsp").Hash.ToLower() -ne $v.qspAfter){throw '게임 코드 복사 검증 실패'}
 Copy-Item -LiteralPath "$stage\2026-10-08_cutscene_view_ui_fix.json" -Destination "$project\mods\2026-10-08_cutscene_view_ui_fix.json" -Force
} catch {
 Copy-Item -LiteralPath "$backup\jack.qsp" -Destination "$game\jack.qsp" -Force
 Copy-Item -LiteralPath "$backup\persistent.json" -Destination $persistent -Force
 Copy-Item -LiteralPath "$backup\prepare-image-cycle.cjs" -Destination $generator -Force
 throw
}
Write-Output "수정 적용 및 해시 검증 완료. 백업: $backup"
