$ErrorActionPreference = 'Stop'
$workspace = Split-Path -Parent $PSScriptRoot
$project = 'C:\Users\Ken Choung\Documents\Codex\2026-10-06\task\JO9sa'
$game = 'C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex\game'
$target = Join-Path $game 'jack.qsp'
$record = Join-Path $workspace 'tmp\image-cycle\mods\2026-10-08_persistent_image_cycle.json'
$mod = Get-Content -LiteralPath $record -Raw -Encoding UTF8 | ConvertFrom-Json
$before = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant()
if ($before -ne $mod.before_sha256) { throw '현재 게임이 검증 후보의 기준과 다릅니다. 적용하지 않았습니다.' }
$stage = Join-Path $workspace 'tmp\image-cycle-validated\mods'
New-Item -ItemType Directory -Path $stage -Force | Out-Null
Copy-Item -LiteralPath $record -Destination (Join-Path $stage '2026-10-08_persistent_image_cycle.json')
& (Join-Path $workspace 'tools\apply_mods.ps1') -Qsp $target -ModsDir $stage
$after = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant()
if ($after -ne $mod.after_sha256) { throw '적용 후 해시가 수정 후보와 다릅니다.' }
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
foreach ($dir in @((Join-Path $project 'tools\text-workshop'), (Join-Path $game 'modtools\text-workshop'))) {
 foreach ($name in @('image-cuts.cjs','check-image-cycle-syntax.cjs')) {
  $destination = Join-Path $dir $name
  if (Test-Path -LiteralPath $destination) { Copy-Item -LiteralPath $destination -Destination ($destination + '.bak_' + $stamp) }
  Copy-Item -LiteralPath (Join-Path $workspace ('tools\cut-addition\' + $name)) -Destination $destination
 }
}
foreach ($dir in @($workspace,$project)) {
 Copy-Item -LiteralPath $record -Destination (Join-Path $dir 'mods\2026-10-08_persistent_image_cycle.json')
}
foreach ($name in @('prepare-image-cycle.cjs','prepare-image-cycle-test.cjs','check-image-cycle-syntax.cjs')) {
 Copy-Item -LiteralPath (Join-Path $workspace ('tools\' + $name)) -Destination (Join-Path $project ('tools\' + $name))
}
Copy-Item -LiteralPath (Join-Path $workspace 'docs\IMAGE_CYCLE_FIX_20261008.md') -Destination (Join-Path $project 'docs\IMAGE_CYCLE_FIX_20261008.md')
Write-Output ('Applied verified image cycle: ' + $before + ' -> ' + $after)
