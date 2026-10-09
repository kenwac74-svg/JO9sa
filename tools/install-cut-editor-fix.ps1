param([string]$Source = (Split-Path -Parent $PSScriptRoot))
$ErrorActionPreference = 'Stop'
$jo9Project = 'C:\Users\Ken Choung\Documents\Codex\2026-10-06\task\JO9sa'
$jo9Game = 'C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex\game'
$stage = Join-Path $Source 'tmp\image-cycle-tooltip'
$validation = Get-Content -LiteralPath (Join-Path $stage 'validation.json') -Raw | ConvertFrom-Json
if ((Get-FileHash -LiteralPath "$jo9Game\jack.qsp").Hash.ToLower() -ne $validation.qspBefore) { throw '게임 코드가 준비 이후 변경되었습니다. 다시 검증하세요.' }
if ((Get-FileHash -LiteralPath "$jo9Game\css\base.css").Hash.ToLower() -ne $validation.cssBefore) { throw '게임 스타일이 준비 이후 변경되었습니다. 다시 검증하세요.' }
$backup = Join-Path $jo9Project ('tools\local-workspace\runtime\cut-editor-backups\' + (Get-Date -Format 'yyyyMMdd_HHmmss'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
$copies = @(
 @('tools\cut-addition\catalog_editor.js', "$jo9Project\tools\local-workspace\catalog\catalog_editor.js"),
 @('tools\cut-addition\catalog_editor.js', "$jo9Project\tools\local-workspace\catalog-seed\catalog_editor.js"),
 @('tools\cut-addition\JO9_Place_Workshop.html', "$jo9Game\modtools\place\JO9_Place_Workshop.html"),
 @('tools\text-workshop\image-cuts.cjs', "$jo9Project\tools\text-workshop\image-cuts.cjs"),
 @('tools\text-workshop\image-cuts.cjs', "$jo9Game\modtools\text-workshop\image-cuts.cjs"),
 @('tools\text-workshop\image-cuts.cjs', "$jo9Project\tools\cut-addition\image-cuts.cjs"),
 @('tools\cut-addition\workshop-cut-editor.js', "$jo9Project\tools\cut-addition\workshop-cut-editor.js"),
 @('tools\cut-addition\workshop-cut-editor.test.cjs', "$jo9Project\tools\cut-addition\workshop-cut-editor.test.cjs"),
 @('tools\cut-addition\JO9_Place_Workshop.html', "$jo9Project\tools\cut-addition\JO9_Place_Workshop.html"),
 @('tools\cut-addition\catalog_editor.js', "$jo9Project\tools\cut-addition\catalog_editor.js"),
 @('tools\text-workshop\cut-family.test.cjs', "$jo9Project\tools\text-workshop\cut-family.test.cjs"),
 @('tools\prepare-image-cycle.cjs', "$jo9Project\tools\prepare-image-cycle.cjs")
)
$i = 0
foreach ($pair in $copies) {
 $from = Join-Path $Source $pair[0]; $to = $pair[1]
 if (Test-Path -LiteralPath $to) { Copy-Item -LiteralPath $to -Destination (Join-Path $backup ("$i-" + [IO.Path]::GetFileName($to))) }
 Copy-Item -LiteralPath $from -Destination $to -Force
 if ((Get-FileHash -LiteralPath $from).Hash -ne (Get-FileHash -LiteralPath $to).Hash) { throw "복사 확인 실패: $to" }
 $i++
}
Copy-Item -LiteralPath "$jo9Game\jack.qsp" -Destination "$backup\jack.qsp"
Copy-Item -LiteralPath "$jo9Game\css\base.css" -Destination "$backup\base.css"
& (Join-Path $Source 'tools\apply_mods.ps1') -Qsp "$jo9Game\jack.qsp" -ModsDir $stage
if ((Get-FileHash -LiteralPath "$jo9Game\jack.qsp").Hash.ToLower() -ne $validation.qspAfter) { throw '게임 코드 적용 확인 실패' }
Copy-Item -LiteralPath (Join-Path $stage 'base.css') -Destination "$jo9Game\css\base.css" -Force
if ((Get-FileHash -LiteralPath "$jo9Game\css\base.css").Hash.ToLower() -ne $validation.cssAfter) { throw '스타일 적용 확인 실패' }
Copy-Item -LiteralPath (Join-Path $stage '2026-10-08_image_cycle_tooltip_right.json') -Destination "$jo9Project\mods\2026-10-08_image_cycle_tooltip_right.json" -Force
$persistent = "$jo9Project\mods\2026-10-08_persistent_image_cycle.json"
Copy-Item -LiteralPath $persistent -Destination "$backup\persistent-image-cycle.json"
$record = Get-Content -LiteralPath $persistent -Raw | ConvertFrom-Json
$old = '<a class="tooltip-bottom" tooltip-data="이미지 전환" title="이미지 전환" href="EXEC: gs'
$new = '<a class="tooltip-right" tooltip-data="이미지 전환" title="이미지 전환" style="display:block;position:relative;width:26px;height:26px;" href="EXEC: gs'
$edit = $record.edits | Where-Object location -eq 'interior_change'
if (-not $edit.new.Contains($old)) { throw '영구 패치 버튼을 찾지 못했습니다.' }
$edit.new = $edit.new.Replace($old,$new); $record.after_sha256 = $validation.qspAfter
[IO.File]::WriteAllText($persistent, ($record | ConvertTo-Json -Depth 30), [Text.UTF8Encoding]::new($false))
Copy-Item -LiteralPath $persistent -Destination (Join-Path $Source 'mods\2026-10-08_persistent_image_cycle.json') -Force
Write-Output "설치와 파일 검증 완료. 백업: $backup"
