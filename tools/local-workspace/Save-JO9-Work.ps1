param([string]$GameDir='',[string]$OriginalDir='',[string]$CatalogDir='',[string]$RuntimeDir='',[string]$SharedRoot='',[switch]$Push)
$ErrorActionPreference='Stop'
$repoRoot=Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$config=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'local.config.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if (!$GameDir) {$GameDir=$config.game}
if (!$OriginalDir) {$OriginalDir=$config.original}
if (!$CatalogDir) {if ($config.catalog) {$CatalogDir=$config.catalog} else {$CatalogDir=Join-Path $PSScriptRoot 'catalog'}}
if (!$SharedRoot -and $config.workspace) {$SharedRoot=$config.workspace}
if (!$RuntimeDir) {if ($config.runtime) {$RuntimeDir=$config.runtime} else {$RuntimeDir=Join-Path $PSScriptRoot 'runtime'}}
$taskPython=Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
if (!(Test-Path -LiteralPath $taskPython)) {$taskPython=(Get-Command python -ErrorAction Stop).Source}
& $taskPython (Join-Path $PSScriptRoot 'sync-workspace-state.py') --catalog $CatalogDir --game $GameDir --original $OriginalDir --export-seed (Join-Path $PSScriptRoot 'catalog-seed')
if ($LASTEXITCODE -ne 0) {throw 'Management snapshot failed.'}
foreach($name in 'grok-settings.json','dialogue-ai-settings.json') {
 $file=Join-Path $RuntimeDir $name
 if (Test-Path -LiteralPath $file) {
  $settings=Get-Content -LiteralPath $file -Raw -Encoding UTF8 | ConvertFrom-Json
  @{provider=$settings.provider;model=$settings.model;aiId=$settings.aiId} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $PSScriptRoot ('settings-seed\'+$name)) -Encoding UTF8
 }
}
if ($Push) {
 & git -c "safe.directory=$repoRoot" -C $repoRoot add -- tools/local-workspace tools/text-workshop tools/imgmg tools/image-workshop docs mods records
 if ($LASTEXITCODE -ne 0) {throw 'Git stage failed.'}
 & git -c "safe.directory=$repoRoot" -C $repoRoot diff --cached --quiet
 if ($LASTEXITCODE -eq 1) {
  & git -c "safe.directory=$repoRoot" -C $repoRoot -c user.name=Codex -c user.email=codex@local.invalid commit -m ('Checkpoint complete JO9 workspace '+(Get-Date -Format 'yyyy-MM-dd HH:mm'))
  if ($LASTEXITCODE -ne 0) {throw 'Commit failed.'}
 } elseif ($LASTEXITCODE -ne 0) {throw 'Git diff failed.'}
 & git -c "safe.directory=$repoRoot" -C $repoRoot push origin HEAD
 if ($LASTEXITCODE -ne 0) {throw 'Push failed. Local snapshot is preserved; do not report transfer complete.'}
 $taskLocal=& git -c "safe.directory=$repoRoot" -C $repoRoot rev-parse HEAD
 $taskBranch=& git -c "safe.directory=$repoRoot" -C $repoRoot branch --show-current
 $taskRemote=& git -c "safe.directory=$repoRoot" -C $repoRoot ls-remote origin "refs/heads/$taskBranch"
 if (!$taskRemote.StartsWith($taskLocal)) {throw 'Remote verification failed.'}
 Write-Output ('Remote checkpoint verified: '+$taskBranch+' '+$taskLocal)
} else {Write-Output 'Saved complete management snapshot; Git push was not requested.'}

if ($SharedRoot) {
 & $taskPython (Join-Path $PSScriptRoot 'export-shared-work.py') --repo $repoRoot --game $GameDir --original $OriginalDir --catalog $CatalogDir --runtime $RuntimeDir --destination $SharedRoot
 if ($LASTEXITCODE -ne 0) {throw 'Shared folder checkpoint failed. Do not copy an older workspace as the latest work.'}
 Write-Output ('Shared folder checkpoint saved: '+$SharedRoot)
}
