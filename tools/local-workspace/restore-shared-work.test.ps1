$ErrorActionPreference='Stop'
$fixtureRoot=Join-Path ([IO.Path]::GetTempPath()) ('jo9-restore-test-'+[guid]::NewGuid().ToString('N'))
$python=Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
if (!(Test-Path -LiteralPath $python)) {$python=(Get-Command python -ErrorAction Stop).Source}
function Assert-Work($Value,[string]$Message) {if (!$Value) {throw $Message}}
function Put-TestFile([string]$Root,[string]$Relative,[string]$Text) {
 $file=Join-Path $Root $Relative.Replace('/','\');New-Item -ItemType Directory -Path (Split-Path -Parent $file) -Force | Out-Null
 [IO.File]::WriteAllText($file,$Text,[Text.UTF8Encoding]::new($false));return $file
}
function Write-TestManifest($Extra=@()) {
 $files=@($payload | ForEach-Object {$file=Get-Item -LiteralPath (Join-Path $work $_);@{path=$_;sha256=(Get-FileHash -LiteralPath $file.FullName).Hash.ToLowerInvariant();bytes=$file.Length;category='fixture'}})+$Extra
 @{format='jo9-shared-work';version=1;workspaceId='restore-fixture';exportId='fixture';files=$files} | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $work 'manifest.json') -Encoding UTF8
}
function Write-TestBackupZip([switch]$Symlink) {
 Add-Type -AssemblyName System.IO.Compression
 Add-Type -AssemblyName System.IO.Compression.FileSystem
 $zipFile=Join-Path $work 'records\dialogue-backups.zip'
 if (Test-Path -LiteralPath $zipFile) {Remove-Item -LiteralPath $zipFile -Force}
 $archive=[IO.Compression.ZipFile]::Open($zipFile,[IO.Compression.ZipArchiveMode]::Create)
 try {
  $entry=$archive.CreateEntry('2026-fixture.qsp')
  if ($Symlink) {$entry.ExternalAttributes=-1610612736}
  $stream=$entry.Open();$bytes=[Text.Encoding]::UTF8.GetBytes('historical QSP');try {$stream.Write($bytes,0,$bytes.Length)} finally {$stream.Dispose()}
 } finally {$archive.Dispose()}
 $algorithm=[Security.Cryptography.SHA256]::Create();try {$hash=[BitConverter]::ToString($algorithm.ComputeHash([Text.Encoding]::UTF8.GetBytes('historical QSP'))).Replace('-','').ToLowerInvariant()} finally {$algorithm.Dispose()}
 $null=Put-TestFile $work 'records/dialogue-backups.json' (@{format='jo9-dialogue-backups';version=1;files=@(@{path='2026-fixture.qsp';sha256=$hash;bytes=14})} | ConvertTo-Json -Depth 10)
}
try {
 $work=Join-Path $fixtureRoot 'JO9WORK';$game=Join-Path $fixtureRoot 'play';$original=Join-Path $fixtureRoot 'vanilla';$machine=Join-Path $fixtureRoot 'machine'
 $script=Join-Path $work 'tools\local-workspace\Restore-JO9-Work.ps1'
 New-Item -ItemType Directory -Path (Split-Path -Parent $script),(Join-Path $game 'content\pic'),(Join-Path $original 'content\pic') -Force | Out-Null
 Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'Restore-JO9-Work.ps1') -Destination $script
 $null=Put-TestFile $game 'jack.qsp' 'before QSP';$null=Put-TestFile $original 'jack.qsp' 'VANILLA QSP'
 $null=Put-TestFile $game 'content/pic/bg/adopted.png' 'before image';$null=Put-TestFile $original 'content/pic/bg/adopted.png' 'VANILLA IMAGE'
 $payload=@('personal-images/content/pic/bg/adopted.png','working-images/content/modworkpic/draft.png','working-images/content/modworkpic/tool.html','working-images/content/pic/reserve/jo9mod/option.png','working-images/content/pic/reserve/jo9mod/manifest.csv','game-checkpoint/jack.qsp','game-metadata/modtools/image-original-cuts.json','game-metadata/mods/record.json','catalog/catalog_merge_vs_original.html','catalog/catalog_work_ids.json','catalog/catalog_status.js','preferences/dialogue-ai-settings.json','preferences/workshop/config.json','preferences/workshop/filters.json','records/dialogue/2026-fixture.json','records/dialogue-backups.zip','records/dialogue-backups.json','records/cut-mods/mod.json','records/original-cut-history/old/original.json','records/cut-history/cut.json','tools/local-workspace/sync-workspace-state.py')
 foreach($rel in $payload) {$null=Put-TestFile $work $rel ('payload '+$rel)}
 $null=Put-TestFile $work 'preferences/dialogue-ai-settings.json' '{"provider":"kindroid","model":"chosen-model","aiId":"chosen-character"}'
 $null=Put-TestFile $work 'tools/local-workspace/sync-workspace-state.py' 'print("fixture metadata restored")'
 foreach($rel in @('preferences/workshop/config.json','preferences/workshop/filters.json','records/cut-mods/mod.json','records/original-cut-history/old/original.json','records/cut-history/cut.json','game-metadata/mods/record.json')) {$null=Put-TestFile $work $rel '{"target":"@GAME@/jack.qsp","runtime":"@RUNTIME@","repo":"@REPO@","catalog":"@CATALOG@"}'}
 $null=Put-TestFile $work 'records/dialogue/2026-fixture.json' '{"target":"@GAME@/jack.qsp","backup":"@RUNTIME@/backups/2026-fixture.qsp","record":"@RUNTIME@/backups/2026-fixture.json","mod":{"target":"@GAME@/jack.qsp","edits":[]}}'
 $sourceHash=(Get-FileHash -LiteralPath (Join-Path $original 'content\pic\bg\adopted.png')).Hash.ToLowerInvariant()
 $originalMetadata=@{version=1;sourceRoot='@ORIGINAL@';originals=@{'bg/adopted.png'=@{base='bg/adopted.png';alias='bg/adopted (2).png';source='content/pic/bg/adopted.png';target='content/jo9o_original_cuts/bg/adopted.png';sourceSha=$sourceHash}};reservations=@{}}
 $null=Put-TestFile $work 'game-metadata/modtools/image-original-cuts.json' ($originalMetadata | ConvertTo-Json -Depth 10)
 Write-TestBackupZip
 Write-TestManifest
 $arguments=@{WorkspaceRoot=$work;GameDir=$game;OriginalDir=$original;MachineRoot=$machine;PythonPath=$python}
 $beforeOriginal=Get-FileHash -LiteralPath (Join-Path $original 'content\pic\bg\adopted.png')
 $null=& $script @arguments -ConfigureOnly
 Assert-Work ((Get-Content -LiteralPath (Join-Path $game 'jack.qsp') -Raw) -eq 'before QSP') 'ConfigureOnly changed QSP.'
 Assert-Work ((Get-Content -LiteralPath (Join-Path $game 'content\pic\bg\adopted.png') -Raw) -eq 'before image') 'ConfigureOnly changed image.'
 Assert-Work (!(Test-Path -LiteralPath (Join-Path $game 'modtools\image-original-cuts.json'))) 'ConfigureOnly installed game metadata.'
 Assert-Work (!(Test-Path -LiteralPath (Join-Path $game 'content\jo9o_original_cuts'))) 'ConfigureOnly installed original-cut junction.'
 $config=Get-Content -LiteralPath (Join-Path $machine 'local.config.json') -Raw | ConvertFrom-Json
 Assert-Work ($config.game -eq $game -and $config.runtime -eq (Join-Path $machine 'editor')) 'Machine configuration is wrong.'
 Assert-Work ($config.catalog -eq (Join-Path $work 'runtime\catalog')) 'Shared catalogue path is wrong.'
 Assert-Work (Test-Path -LiteralPath (Join-Path $machine 'editor\backups\2026-fixture.json')) 'History metadata was not restored.'
 Assert-Work ((Get-Content -LiteralPath (Join-Path $machine 'editor\backups\2026-fixture.qsp') -Raw) -eq 'historical QSP') 'Undo backup was not restored.'
 $history=Get-Content -LiteralPath (Join-Path $machine 'editor\backups\2026-fixture.json') -Raw | ConvertFrom-Json
 Assert-Work ($history.target -eq ($game+'/jack.qsp') -and $history.backup -eq ((Join-Path $machine 'editor')+'/backups/2026-fixture.qsp')) 'History paths were not rebased.'
 $null=Put-TestFile $machine 'editor/kindroid-key.dpapi' 'private machine key'
 $null=& $script @arguments
 Assert-Work ((Get-Content -LiteralPath (Join-Path $game 'content\pic\bg\adopted.png') -Raw) -eq 'payload personal-images/content/pic/bg/adopted.png') 'Personal image was not restored.'
 Assert-Work (Test-Path -LiteralPath (Join-Path $game 'content\modworkpic\draft.png')) 'Working image was not restored.'
 Assert-Work (Test-Path -LiteralPath (Join-Path $game 'content\pic\reserve\jo9mod\option.png')) 'Reserve image was not restored.'
 Assert-Work (Test-Path -LiteralPath (Join-Path $game 'content\modworkpic\tool.html')) 'Working tool file was not copied as data.'
 Assert-Work (Test-Path -LiteralPath (Join-Path $game 'content\pic\reserve\jo9mod\manifest.csv')) 'Reserve metadata was not copied.'
 $restoredMetadata=Get-Content -LiteralPath (Join-Path $game 'modtools\image-original-cuts.json') -Raw | ConvertFrom-Json
 Assert-Work ($restoredMetadata.sourceRoot -eq $original) 'Original-cut sourceRoot was not rebased.'
 Assert-Work ((Get-Item -LiteralPath (Join-Path $game 'content\jo9o_original_cuts')).LinkType -eq 'Junction') 'Original-cut junction was not created.'
 Assert-Work (Test-Path -LiteralPath (Join-Path $game 'modtools\filters.json')) 'Workshop preferences were not installed.'
 Assert-Work (Test-Path -LiteralPath (Join-Path $machine 'editor\imported-game-mods\record.json')) 'Game mod record was not preserved separately.'
 Assert-Work ((Get-Content -LiteralPath (Join-Path $game 'jack.qsp') -Raw) -eq 'before QSP') 'Default restore changed QSP.'
 Assert-Work (@(Get-ChildItem -LiteralPath (Join-Path $work 'runtime\restore-backups') -Filter 'adopted.png' -File -Recurse | Where-Object {(Get-Content -LiteralPath $_.FullName -Raw) -eq 'before image'}).Count -eq 1) 'Previous image was not backed up.'
 Assert-Work ((Get-Content -LiteralPath (Join-Path $machine 'editor\kindroid-key.dpapi') -Raw) -eq 'private machine key') 'Private API key was changed.'
 $null=& $script @arguments -IncludeGameCheckpoint
 Assert-Work ((Get-Content -LiteralPath (Join-Path $game 'jack.qsp') -Raw) -eq 'payload game-checkpoint/jack.qsp') 'Opt-in QSP checkpoint was not applied.'
 Assert-Work (@(Get-ChildItem -LiteralPath (Join-Path $work 'runtime\restore-backups') -Filter 'jack.qsp' -File -Recurse | Where-Object {(Get-Content -LiteralPath $_.FullName -Raw) -eq 'before QSP'}).Count -eq 1) 'Previous QSP was not backed up.'
 Assert-Work ((Get-FileHash -LiteralPath $beforeOriginal.Path).Hash -eq $beforeOriginal.Hash) 'VANILLA image was modified.'
 Assert-Work ((Get-Content -LiteralPath (Join-Path $original 'jack.qsp') -Raw) -eq 'VANILLA QSP') 'VANILLA QSP was modified.'
 $aliasPath=Join-Path $game 'content\jo9o_original_cuts';$wrongAliasTarget=Join-Path $fixtureRoot 'wrong-original-pic'
 New-Item -ItemType Directory -Path $wrongAliasTarget -Force | Out-Null
 [IO.Directory]::Delete($aliasPath);New-Item -ItemType Junction -Path $aliasPath -Target $wrongAliasTarget | Out-Null
 $blocked=$false;try {$null=& $script @arguments} catch {$blocked=$_.Exception.Message -like '*junction points elsewhere*'}
 Assert-Work $blocked 'A conflicting original-cut junction was silently replaced.'
 Assert-Work ([string]@((Get-Item -LiteralPath $aliasPath).Target)[0] -eq $wrongAliasTarget) 'Conflicting junction was changed.'
 [IO.Directory]::Delete($aliasPath);New-Item -ItemType Junction -Path $aliasPath -Target (Join-Path $original 'content\pic') | Out-Null
 $latest=(Get-FileHash -LiteralPath (Join-Path $game 'content\pic\bg\adopted.png')).Hash
 $null=Put-TestFile $work 'personal-images/content/pic/bg/adopted.png' 'tampered'
 $blocked=$false;try {$null=& $script @arguments} catch {$blocked=$_.Exception.Message -like '*checksum mismatch*'}
 Assert-Work $blocked 'Tampered payload was accepted.'
 Assert-Work ((Get-FileHash -LiteralPath (Join-Path $game 'content\pic\bg\adopted.png')).Hash -eq $latest) 'Preflight failure changed PLAY image.'
 Write-TestManifest @(@{path='../escaped.png';sha256=('a'*64);bytes=1})
 $blocked=$false;try {$null=& $script @arguments} catch {$blocked=$_.Exception.Message -like '*Invalid package path*'}
 Assert-Work $blocked 'Traversal path was accepted.'
 Write-TestManifest
 Write-TestBackupZip -Symlink;Write-TestManifest
 $blocked=$false;try {$null=& $script @arguments} catch {$blocked=$_.Exception.Message -like '*Unsafe or unexpected ZIP*'}
 Assert-Work $blocked 'ZIP symlink member was accepted.'
 Write-TestBackupZip;Write-TestManifest
 $zipManifest=Get-Content -LiteralPath (Join-Path $work 'records\dialogue-backups.json') -Raw | ConvertFrom-Json
 $zipManifest.files[0].bytes=536870913
 $null=Put-TestFile $work 'records/dialogue-backups.json' ($zipManifest | ConvertTo-Json -Depth 10);Write-TestManifest
 $blocked=$false;try {$null=& $script @arguments} catch {$blocked=$_.Exception.Message -like '*Invalid ZIP backup member*'}
 Assert-Work $blocked 'Oversized ZIP member was accepted.'
 Write-TestBackupZip;Write-TestManifest
 $linkPath=Join-Path $game 'content\pic\bg';$savedBg=Join-Path $game 'content\pic\bg-saved'
 Move-Item -LiteralPath $linkPath -Destination $savedBg
 try {
  New-Item -ItemType Junction -Path $linkPath -Target (Join-Path $original 'content\pic\bg') | Out-Null
  $blocked=$false;try {$null=& $script @arguments} catch {$blocked=$_.Exception.Message -like '*Linked paths*'}
  Assert-Work $blocked 'Linked game destination was accepted.'
 } finally {if (Test-Path -LiteralPath $linkPath) {[IO.Directory]::Delete($linkPath)};Move-Item -LiteralPath $savedBg -Destination $linkPath}
 $blocked=$false;try {$null=& $script -WorkspaceRoot $work -GameDir $original -OriginalDir $original -MachineRoot $machine -PythonPath $python} catch {$blocked=$_.Exception.Message -like '*separate*'}
 Assert-Work $blocked 'VANILLA folder could be used as PLAY.'
 $null=Put-TestFile $work 'preferences/dialogue-ai-settings.json' '{"model":"ok","apiKey":"forbidden"}'
 Write-TestManifest
 $blocked=$false;try {$null=& $script @arguments} catch {$blocked=$_.Exception.Message -like '*Unexpected preference field*'}
 Assert-Work $blocked 'Secret preference field was accepted.'
 $null=Put-TestFile $work 'preferences/dialogue-ai-settings.json' '{"model":"ok"}';Write-TestManifest
 $previewMachine=Join-Path $fixtureRoot 'preview-machine'
 $null=& $script -WorkspaceRoot $work -GameDir $game -OriginalDir $original -MachineRoot $previewMachine -PythonPath $python -WhatIf
 Assert-Work (!(Test-Path -LiteralPath $previewMachine)) 'WhatIf wrote machine configuration.'
 $tokens=$null;$parseErrors=$null;$null=[Management.Automation.Language.Parser]::ParseFile($script,[ref]$tokens,[ref]$parseErrors)
 Assert-Work (!$parseErrors) 'Restore script has PowerShell syntax errors.'
 $bytes=[IO.File]::ReadAllBytes($script);Assert-Work ($bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191) 'Restore script has no UTF8 BOM.'
 Write-Output 'PASS: configure-only game preservation, image/work files, game backups/QSP opt-in, ZIP undo history/rebased paths, original-cut junction, workshop preferences, vanilla/key protection, tamper/path/symlink/secret rejection, WhatIf and PS5/BOM.'
} finally {
 $resolved=[IO.Path]::GetFullPath($fixtureRoot)
 Assert-Work ($resolved.StartsWith([IO.Path]::GetFullPath([IO.Path]::GetTempPath()),[StringComparison]::OrdinalIgnoreCase) -and (Split-Path -Leaf $resolved).StartsWith('jo9-restore-test-')) 'Unsafe fixture cleanup path.'
 Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction SilentlyContinue
}
