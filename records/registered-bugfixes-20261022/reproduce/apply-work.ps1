$ErrorActionPreference='Stop'
$taskRoot='G:\Codex\tmp\jo9-bugfixes-20261022'
$repoRoot='G:\somi\JO9sa'
$workRoot='G:\somi\Jack O Nine Tails v2.4_work\game'
$manifest=Get-Content -LiteralPath (Join-Path $taskRoot 'manifest.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$modPath=Join-Path $taskRoot 'mods\2026-10-22_registered_bugfixes.json'
$qspPath=Join-Path $workRoot 'jack.qsp'
$gate=Get-Content -LiteralPath (Join-Path $taskRoot 'release-validation.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if($gate.verdict -ne 'PASS'){throw 'Final release gate must PASS before applying WORK'}
$gateWorld=$gate.checks | Where-Object name -eq 'world-structure-and-line-endings'
if($gateWorld.detail.sha256 -ne $manifest.candidate.sha256){throw 'Release gate is not for current candidate'}
$hashOf={param($p) (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()}
if((& $hashOf $qspPath) -ne $manifest.before.sha256){throw 'WORK changed; do not overwrite manual edits'}
foreach($css in $manifest.css.files){if((& $hashOf $css.file) -ne $css.sha256Before){throw "CSS changed: $($css.file)"}}
$saveBefore=@(Get-ChildItem -LiteralPath (Join-Path $workRoot 'save') -Filter '*.sav' -File | ForEach-Object { [pscustomobject]@{file=$_.FullName;sha256=(& $hashOf $_.FullName)} })
$fullBefore=@($manifest.protected | Where-Object {$_.file -like '*Kor_Full*'})
foreach($p in $fullBefore){if((& $hashOf $p.file) -ne $p.sha256){throw "Protected Full changed: $($p.file)"}}
$oldBackups=@(Get-ChildItem -LiteralPath $workRoot -Filter 'jack.qsp.bak_*' -File | ForEach-Object FullName)
& (Join-Path $repoRoot 'tools\apply_mods.ps1') -Qsp $qspPath -ModsDir (Join-Path $taskRoot 'mods')
if(-not $?){throw 'apply_mods failed'}
if((& $hashOf $qspPath) -ne $manifest.candidate.sha256){throw 'Installed QSP differs from verified candidate'}
foreach($css in $manifest.css.files){
 $candidate=Join-Path $taskRoot $css.candidate
 if((& $hashOf $candidate) -ne $css.sha256After){throw 'CSS candidate hash mismatch'}
 [IO.File]::WriteAllBytes($css.file,[IO.File]::ReadAllBytes($candidate))
 if((& $hashOf $css.file) -ne $css.sha256After){throw 'Installed CSS hash mismatch'}
}
$manifestPath=Join-Path $repoRoot 'assets\css-2.4\manifest.json'
$cssManifest=Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$cssManifest.files.'base.css'=$manifest.css.files[0].sha256After
$entry=[pscustomobject]@{id='MILK_COOPERATIVE_SIGN_OVERLAP_20261022';scope='WORK and tracked CSS only; Full unchanged';baseCssBefore=$manifest.css.files[0].sha256Before;baseCssAfter=$manifest.css.files[0].sha256After;report='records/registered-bugfixes-20261022/MANUAL_KO.md'}
$cssManifest.updates=@($cssManifest.updates)+$entry
[IO.File]::WriteAllText($manifestPath,($cssManifest | ConvertTo-Json -Depth 30),[Text.UTF8Encoding]::new($false))
Copy-Item -LiteralPath $modPath -Destination (Join-Path $repoRoot 'mods\2026-10-22_registered_bugfixes.json')
$changedSaves=@($saveBefore | Where-Object {(& $hashOf $_.file) -ne $_.sha256})
$changedFull=@($fullBefore | Where-Object {(& $hashOf $_.file) -ne $_.sha256})
if($changedFull.Count){throw 'Full unexpectedly changed'}
$newBackups=@(Get-ChildItem -LiteralPath $workRoot -Filter 'jack.qsp.bak_*' -File | Where-Object {$oldBackups -notcontains $_.FullName} | ForEach-Object FullName)
$result=[pscustomobject]@{qsp=$qspPath;before=$manifest.before.sha256;after=(& $hashOf $qspPath);css=$manifest.css.files;saveFiles=$saveBefore.Count;saveHashesUnchanged=($changedSaves.Count -eq 0);changedSaves=$changedSaves;fullUnchanged=$true;newBackups=$newBackups;commitPushPerformed=$false;packagingPerformed=$false}
[IO.File]::WriteAllText((Join-Path $taskRoot 'installed.json'),($result | ConvertTo-Json -Depth 15),[Text.UTF8Encoding]::new($false))
if($changedSaves.Count){throw 'Save files changed concurrently; inspect installed.json, never restore or overwrite them automatically'}
$result | ConvertTo-Json -Depth 10
