param([string]$GameDir='', [string]$OriginalDir='', [string]$NodePath='', [int]$Port=3813, [switch]$NoBrowser, [switch]$Configure)
$ErrorActionPreference='Stop'
$configFile=Join-Path $PSScriptRoot 'local.config.json'
if ((Test-Path -LiteralPath $configFile) -and !$Configure) {
 $config=Get-Content -LiteralPath $configFile -Raw | ConvertFrom-Json
 if (!$GameDir) {$GameDir=$config.game}
 if (!$OriginalDir) {$OriginalDir=$config.original}
}
function Select-Folder($title) {
 Add-Type -AssemblyName System.Windows.Forms
 $dialog=New-Object System.Windows.Forms.FolderBrowserDialog
 $dialog.Description=$title
 if ($dialog.ShowDialog() -ne 'OK') {throw 'Folder selection cancelled.'}
 $result=$dialog.SelectedPath; $dialog.Dispose(); return $result
}
if (!$GameDir) {$GameDir=Select-Folder 'Select PLAY game folder containing jack.qsp'}
if (!$OriginalDir) {$OriginalDir=Select-Folder 'Select VANILLA game folder (read-only comparison)'}
$GameDir=(Resolve-Path -LiteralPath $GameDir).Path
$OriginalDir=(Resolve-Path -LiteralPath $OriginalDir).Path
if (!(Test-Path -LiteralPath (Join-Path $GameDir 'jack.qsp'))) {throw 'PLAY folder must contain jack.qsp.'}
if (!(Test-Path -LiteralPath (Join-Path $GameDir 'content\pic'))) {throw 'PLAY folder must contain content\pic.'}
if (!(Test-Path -LiteralPath (Join-Path $OriginalDir 'content\pic'))) {throw 'VANILLA folder must contain content\pic.'}
if ($GameDir -eq $OriginalDir) {throw 'PLAY and VANILLA must be separate folders.'}
if (!$NodePath) {
 $bundled=Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
 if (Test-Path -LiteralPath $bundled) {$NodePath=$bundled} else {
  $nodeCommand=Get-Command node -ErrorAction SilentlyContinue
  if (!$nodeCommand) {throw 'Install Node.js 22 LTS or use Codex bundled Node.js, then run again.'}
  $NodePath=$nodeCommand.Source
 }
}
if ([int](& $NodePath -p 'parseInt(process.versions.node)') -lt 20) {throw 'Node.js 20 or newer is required.'}
$catalog=Join-Path $PSScriptRoot 'catalog'
$runtime=Join-Path $PSScriptRoot 'runtime'
$source=Join-Path (Split-Path -Parent $PSScriptRoot) 'text-workshop\server.cjs'
New-Item -ItemType Directory -Path $catalog,$runtime -Force | Out-Null
if (!(Test-Path -LiteralPath (Join-Path $catalog 'catalog_merge_vs_original.html'))) {
 Copy-Item -Path (Join-Path $PSScriptRoot 'catalog-seed\*') -Destination $catalog
 New-Item -ItemType Directory -Path (Join-Path $catalog 'image_work') -Force | Out-Null
 Move-Item -LiteralPath (Join-Path $catalog 'progress.json') -Destination (Join-Path $catalog 'image_work\progress.json')
}
@{game=$GameDir;original=$OriginalDir} | ConvertTo-Json | Set-Content -LiteralPath $configFile -Encoding UTF8
foreach ($name in 'grok-settings.json','dialogue-ai-settings.json') {
 $destination=Join-Path $runtime $name
 if (!(Test-Path -LiteralPath $destination)) {Copy-Item -LiteralPath (Join-Path $PSScriptRoot ('settings-seed\'+$name)) -Destination $destination}
}
# Supply game-visible emoji assets without replacing existing player assets.
$emojiSource=Join-Path (Split-Path -Parent $PSScriptRoot) 'text-workshop\assets\dialogue-emoji'
$emojiTarget=Join-Path $GameDir 'content\pic\ui\dialogue_emoji'
New-Item -ItemType Directory -Path $emojiTarget -Force | Out-Null
Get-ChildItem -LiteralPath $emojiSource -Filter '*.png' -File | ForEach-Object {
 $dest=Join-Path $emojiTarget $_.Name
 if (!(Test-Path -LiteralPath $dest)) {Copy-Item -LiteralPath $_.FullName -Destination $dest}
}
$ready=Join-Path $runtime 'server.json'
if (Test-Path -LiteralPath $ready) {
 $old=Get-Content -LiteralPath $ready -Raw | ConvertFrom-Json
 $process=Get-CimInstance Win32_Process -Filter "ProcessId=$($old.pid)" -ErrorAction SilentlyContinue
 if ($process -and $process.CommandLine.Contains($source) -and $old.target -eq (Join-Path $GameDir 'jack.qsp')) {
  Write-Output $old.url
  if (!$NoBrowser) {Start-Process $old.url; Start-Process ($old.url+'catalog')}
  exit
 }
 if ($process -and $process.CommandLine.Contains($source)) {throw 'Existing tools use another game folder. Close that tools server before switching.'}
 Remove-Item -LiteralPath $ready
}
$argsText='"'+$source+'" --game-dir "'+$GameDir+'" --original-dir "'+$OriginalDir+'" --catalog-dir "'+$catalog+'" --runtime "'+$runtime+'" --port '+$Port
$started=Start-Process -FilePath $NodePath -ArgumentList $argsText -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtime 'server.log') -RedirectStandardError (Join-Path $runtime 'error.log')
for ($i=0;$i -lt 100;$i++) {
 if (Test-Path -LiteralPath $ready) {
  $state=Get-Content -LiteralPath $ready -Raw | ConvertFrom-Json
  Write-Output $state.url
  if (!$NoBrowser) {Start-Process $state.url; Start-Process ($state.url+'catalog')}
  exit
 }
 if ($started.HasExited) {throw (Get-Content -LiteralPath (Join-Path $runtime 'error.log') -Raw)}
 Start-Sleep -Milliseconds 100
}
throw 'Startup timed out. See runtime\error.log.'
