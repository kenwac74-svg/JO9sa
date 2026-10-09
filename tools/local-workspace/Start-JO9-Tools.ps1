param([string]$GameDir='', [string]$OriginalDir='', [string]$CatalogDir='', [string]$RuntimeDir='', [string]$ConfigFile='', [string]$NodePath='', [int]$Port=3813, [switch]$NoBrowser, [switch]$Configure)
$ErrorActionPreference='Stop'

function Normalize-ToolPath([string]$Value) {
 if (!$Value) {return ''}
 return [IO.Path]::GetFullPath($Value.Replace('/', '\')).TrimEnd('\').ToLowerInvariant()
}
function Read-ToolCommand([string]$CommandLine) {
 return @([regex]::Matches($CommandLine, '"([^"]*)"|(\S+)') | ForEach-Object {
  if ($_.Groups[1].Success) {$_.Groups[1].Value} else {$_.Groups[2].Value}
 })
}
function Tool-Argument($Tokens,[string]$Name) {
 for ($i=0; $i -lt $Tokens.Count-1; $i++) {if ($Tokens[$i] -eq $Name) {return $Tokens[$i+1]}}
 return ''
}
function Select-Folder($title) {
 Add-Type -AssemblyName System.Windows.Forms
 $dialog=New-Object System.Windows.Forms.FolderBrowserDialog
 try {
  $dialog.Description=$title
  if ($dialog.ShowDialog() -ne 'OK') {throw 'Folder selection cancelled.'}
  return $dialog.SelectedPath
 } finally {$dialog.Dispose()}
}
function Test-EditorProcess($Process,[string]$Server,[string]$Game,[string]$Original,[string]$Catalog,[string]$Runtime) {
 if (!$Process -or !$Process.CommandLine) {return $false}
 $tokens=Read-ToolCommand $Process.CommandLine
 if (!$tokens -or $tokens.Count -lt 2 -or (Normalize-ToolPath $tokens[1]) -ne (Normalize-ToolPath $Server)) {return $false}
 return ((Normalize-ToolPath (Tool-Argument $tokens '--game-dir')) -eq (Normalize-ToolPath $Game)) -and
  ((Normalize-ToolPath (Tool-Argument $tokens '--original-dir')) -eq (Normalize-ToolPath $Original)) -and
  ((Normalize-ToolPath (Tool-Argument $tokens '--catalog-dir')) -eq (Normalize-ToolPath $Catalog)) -and
  ((Normalize-ToolPath (Tool-Argument $tokens '--runtime')) -eq (Normalize-ToolPath $Runtime))
}
function Get-EditorCodeChanges([string]$From,[string]$To) {
 # User settings, keys, history, runtime and existing assets are not deployment files.
 return @(Get-ChildItem -LiteralPath $From -File | Where-Object {
  ($_.Extension -in @('.cjs','.js','.py','.ps1') -or $_.Name -in @('index.html','journal-keywords.json','Open-JO9-Text.cmd')) -and
  $_.Name -notmatch '(?i)(\.test\.|^test\.|\.test$)'
 } | Where-Object {
  $dest=Join-Path $To $_.Name
  !(Test-Path -LiteralPath $dest) -or (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $dest -Algorithm SHA256).Hash
 })
}
function Get-WorkspaceVersion {
 $repo=Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
 if ((Test-Path -LiteralPath (Join-Path $repo '.git')) -and (Get-Command git -ErrorAction SilentlyContinue)) {
  $line=& git -c ('safe.directory='+$repo.Replace('\','/')) -C $repo log -1 '--format=%H %ct' 2>$null
  if ($LASTEXITCODE -eq 0 -and [string]$line -match '^([0-9a-f]{40}) (\d+)$') {return @{revision=$Matches[1];committedAt=[long]$Matches[2]}}
 }
 $stamp=Join-Path $PSScriptRoot '.jo9-tool-version.json'
 if (Test-Path -LiteralPath $stamp) {return Get-Content -LiteralPath $stamp -Raw -Encoding UTF8 | ConvertFrom-Json}
 return $null
}
function Assert-EditorVersion($SourceVersion,[string]$InstalledVersion,[bool]$Changed) {
 if (!$Changed -or !(Test-Path -LiteralPath $InstalledVersion)) {return}
 $previous=Get-Content -LiteralPath $InstalledVersion -Raw -Encoding UTF8 | ConvertFrom-Json
 if (!$SourceVersion -or ![long]$SourceVersion.committedAt) {throw 'Cannot verify this tool package version. Existing installed code was not overwritten.'}
 if ([long]$SourceVersion.committedAt -lt [long]$previous.committedAt) {throw 'This tool package is older than the installed version. Downgrade was blocked.'}
 if ([long]$SourceVersion.committedAt -eq [long]$previous.committedAt -and [string]$SourceVersion.revision -ne [string]$previous.revision) {throw 'Tool revisions conflict at the same version date. Existing code was not overwritten.'}
}
function Get-EditorState([string]$Ready,[string]$Server,[string]$Game,[string]$Original,[string]$Catalog,[string]$Runtime) {
 if (!(Test-Path -LiteralPath $Ready)) {return $null}
 try {$state=Get-Content -LiteralPath $Ready -Raw -Encoding UTF8 | ConvertFrom-Json} catch {throw 'Invalid editor server.json; inspect the runtime before starting another server.'}
 $process=Get-CimInstance Win32_Process -Filter ('ProcessId='+[int]$state.pid) -ErrorAction SilentlyContinue
 if (!$process) {Remove-Item -LiteralPath $Ready -Force;return $null}
 if (!(Test-EditorProcess $process $Server $Game $Original $Catalog $Runtime) -or
  (Normalize-ToolPath $state.target) -ne (Normalize-ToolPath (Join-Path $Game 'jack.qsp'))) {
  throw 'The recorded server uses different code or folders. It was not stopped. Correct the configuration or close that server first.'
 }
 $uri=[uri]$state.url
 if ($uri.Scheme -ne 'http' -or $uri.Host -ne '127.0.0.1' -or $uri.AbsolutePath -ne '/') {throw 'Invalid local editor URL.'}
 $listeners=@(Get-NetTCPConnection -LocalPort $uri.Port -State Listen -ErrorAction SilentlyContinue)
 if (!$listeners -or @($listeners | Where-Object {$_.OwningProcess -ne [int]$state.pid}).Count) {throw 'The editor port does not belong to the recorded process.'}
 try {$response=Invoke-WebRequest -UseBasicParsing -Uri $state.url -TimeoutSec 3;if ($response.StatusCode -ne 200) {throw 'Not ready'}} catch {throw 'The existing editor server is not responding. It was not duplicated or stopped.'}
 return $state
}
function Start-ConfiguredEditor {
 $configFile=if ($ConfigFile) {[IO.Path]::GetFullPath($ConfigFile)} else {Join-Path $PSScriptRoot 'local.config.json'}
 $config=@{}
 if ((Test-Path -LiteralPath $configFile) -and !$Configure) {
  $config=Get-Content -LiteralPath $configFile -Raw -Encoding UTF8 | ConvertFrom-Json
  if (!$GameDir) {$GameDir=$config.game}
  if (!$OriginalDir) {$OriginalDir=$config.original}
  if (!$CatalogDir) {$CatalogDir=$config.catalog}
  if (!$RuntimeDir) {$RuntimeDir=$config.runtime}
 }
 if (!$GameDir) {$GameDir=Select-Folder 'Select PLAY game folder containing jack.qsp'}
 if (!$OriginalDir) {$OriginalDir=Select-Folder 'Select VANILLA game folder (read-only comparison)'}
 $GameDir=(Resolve-Path -LiteralPath $GameDir).Path
 $OriginalDir=(Resolve-Path -LiteralPath $OriginalDir).Path
 if (!(Test-Path -LiteralPath (Join-Path $GameDir 'jack.qsp'))) {throw 'PLAY folder must contain jack.qsp.'}
 if (!(Test-Path -LiteralPath (Join-Path $GameDir 'content\pic'))) {throw 'PLAY folder must contain content\pic.'}
 if (!(Test-Path -LiteralPath (Join-Path $OriginalDir 'content\pic'))) {throw 'VANILLA folder must contain content\pic.'}
 if ((Normalize-ToolPath $GameDir) -eq (Normalize-ToolPath $OriginalDir)) {throw 'PLAY and VANILLA must be separate folders.'}
 $installed=Join-Path $GameDir 'modtools\text-workshop'
 if (!$CatalogDir) {$CatalogDir=Join-Path $PSScriptRoot 'catalog'}
 if (!$RuntimeDir) {$RuntimeDir=Join-Path $installed 'runtime'}
 $CatalogDir=[IO.Path]::GetFullPath($CatalogDir)
 $RuntimeDir=[IO.Path]::GetFullPath($RuntimeDir)
 foreach ($destination in @($installed,$CatalogDir,$RuntimeDir)) {
  $normalized=Normalize-ToolPath $destination
  $vanilla=Normalize-ToolPath $OriginalDir
  if ($normalized -eq $vanilla -or $normalized.StartsWith($vanilla+'\')) {throw 'Tool folders must not be inside the read-only VANILLA folder.'}
 }
 if (!$NodePath) {
  $bundled=Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
  if (Test-Path -LiteralPath $bundled) {$NodePath=$bundled} else {
   $nodeCommand=Get-Command node -ErrorAction SilentlyContinue
   if (!$nodeCommand) {throw 'Install Node.js 22 LTS or use Codex bundled Node.js, then run again.'}
   $NodePath=$nodeCommand.Source
  }
 }
 if ([int](& $NodePath -p 'parseInt(process.versions.node)') -lt 20) {throw 'Node.js 20 or newer is required.'}
 New-Item -ItemType Directory -Path $installed,$CatalogDir,$RuntimeDir -Force | Out-Null
 if (!(Test-Path -LiteralPath (Join-Path $CatalogDir 'catalog_merge_vs_original.html'))) {
  Copy-Item -Path (Join-Path $PSScriptRoot 'catalog-seed\*') -Destination $CatalogDir -Recurse
  New-Item -ItemType Directory -Path (Join-Path $CatalogDir 'image_work') -Force | Out-Null
  if (!(Test-Path -LiteralPath (Join-Path $CatalogDir 'image_work\progress.json')) -and (Test-Path -LiteralPath (Join-Path $CatalogDir 'progress.json'))) {
   Move-Item -LiteralPath (Join-Path $CatalogDir 'progress.json') -Destination (Join-Path $CatalogDir 'image_work\progress.json')
  }
  $taskPython=Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
  if (!(Test-Path -LiteralPath $taskPython)) {$taskPython=(Get-Command python -ErrorAction Stop).Source}
  & $taskPython (Join-Path $PSScriptRoot 'sync-workspace-state.py') --source (Join-Path $PSScriptRoot 'catalog-seed') --catalog $CatalogDir --game $GameDir --original $OriginalDir | Out-Host
  if ($LASTEXITCODE -ne 0) {throw 'Workspace state restore failed.'}
 }
 # Persist every folder together; later launches must not silently switch state stores.
 @{game=$GameDir;original=$OriginalDir;catalog=$CatalogDir;runtime=$RuntimeDir;workspace=$config.workspace;workspaceId=$config.workspaceId} | ConvertTo-Json | Set-Content -LiteralPath $configFile -Encoding UTF8
 foreach ($name in 'grok-settings.json','dialogue-ai-settings.json') {
  $destination=Join-Path $RuntimeDir $name
  $seed=Join-Path $PSScriptRoot ('settings-seed\'+$name)
  # Portable packs omit machine preferences; the server supplies defaults until configured.
  if (!(Test-Path -LiteralPath $destination) -and (Test-Path -LiteralPath $seed)) {Copy-Item -LiteralPath $seed -Destination $destination}
 }
 $codeRoot=Join-Path (Split-Path -Parent $PSScriptRoot) 'text-workshop'
 $server=Join-Path $installed 'server.cjs'
 $ready=Join-Path $RuntimeDir 'server.json'
 $state=Get-EditorState $ready $server $GameDir $OriginalDir $CatalogDir $RuntimeDir
 $changes=Get-EditorCodeChanges $codeRoot $installed
 $version=Get-WorkspaceVersion
 $versionFile=Join-Path $installed '.jo9-tool-version.json'
 Assert-EditorVersion $version $versionFile ($changes.Count -gt 0)
 if ($state -and $changes.Count) {
  # Identity and listener ownership were checked above. Never stop an arbitrary port owner.
  Stop-Process -Id ([int]$state.pid) -Force -ErrorAction Stop
  Wait-Process -Id ([int]$state.pid) -Timeout 10 -ErrorAction SilentlyContinue
  $stopped=$false
  for ($attempt=0;$attempt -lt 30;$attempt++) {
   if (!(Get-CimInstance Win32_Process -Filter ('ProcessId='+[int]$state.pid) -ErrorAction SilentlyContinue)) {$stopped=$true;break}
   Start-Sleep -Milliseconds 100
  }
  if (!$stopped) {throw 'The editor did not stop; code deployment was cancelled.'}
  Remove-Item -LiteralPath $ready -Force -ErrorAction SilentlyContinue
  $state=$null
 }
 if (!$state -and $Port -ne 0 -and @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue).Count) {
  throw "Port $Port already belongs to another server. It was not stopped and no duplicate server was launched."
 }
 foreach ($file in $changes) {Copy-Item -LiteralPath $file.FullName -Destination (Join-Path $installed $file.Name) -Force}
 if ($version) {$version | ConvertTo-Json | Set-Content -LiteralPath $versionFile -Encoding UTF8}
 @{launcher=(Join-Path $PSScriptRoot 'Start-JO9-Tools.ps1');config=$configFile} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $installed 'workspace-launcher.json') -Encoding UTF8
 # Add missing game-visible emoji assets, while preserving player assets.
 $emojiSource=Join-Path $codeRoot 'assets\dialogue-emoji'
 $emojiTarget=Join-Path $GameDir 'content\pic\ui\dialogue_emoji'
 if (Test-Path -LiteralPath $emojiSource) {
  New-Item -ItemType Directory -Path $emojiTarget -Force | Out-Null
  Get-ChildItem -LiteralPath $emojiSource -Filter '*.png' -File | ForEach-Object {
   $dest=Join-Path $emojiTarget $_.Name
   if (!(Test-Path -LiteralPath $dest)) {Copy-Item -LiteralPath $_.FullName -Destination $dest}
  }
 }
 if ($state) {return [string]$state.url}
 $argsText='"'+$server+'" --game-dir "'+$GameDir+'" --original-dir "'+$OriginalDir+'" --catalog-dir "'+$CatalogDir+'" --runtime "'+$RuntimeDir+'" --port '+$Port
 $started=Start-Process -FilePath $NodePath -ArgumentList $argsText -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $RuntimeDir 'server.log') -RedirectStandardError (Join-Path $RuntimeDir 'error.log')
 for ($i=0;$i -lt 100;$i++) {
  if (Test-Path -LiteralPath $ready) {
   $state=Get-EditorState $ready $server $GameDir $OriginalDir $CatalogDir $RuntimeDir
   if ($state -and [int]$state.pid -eq $started.Id) {return [string]$state.url}
   throw 'Unexpected editor readiness record; no other process was stopped.'
  }
  $started.Refresh()
  if ($started.HasExited) {throw (Get-Content -LiteralPath (Join-Path $RuntimeDir 'error.log') -Raw)}
  Start-Sleep -Milliseconds 100
 }
 throw 'Startup timed out. See the configured runtime/error.log.'
}

# Serialize launch requests for the same PLAY folder, including copied launchers.
$mutexGame=$GameDir
$mutexConfig=if ($ConfigFile) {$ConfigFile} else {Join-Path $PSScriptRoot 'local.config.json'}
if (!$mutexGame -and (Test-Path -LiteralPath $mutexConfig)) {
 try {$mutexGame=(Get-Content -LiteralPath $mutexConfig -Raw -Encoding UTF8 | ConvertFrom-Json).game} catch {}
}
$mutexBasis=if ($mutexGame) {Normalize-ToolPath $mutexGame} else {Normalize-ToolPath $PSScriptRoot}
$mutexKey=[BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($mutexBasis))).Replace('-','')
$mutex=New-Object Threading.Mutex($false,('Local\JO9Workspace_'+$mutexKey))
$locked=$false
try {
 try {$locked=$mutex.WaitOne(30000)} catch [Threading.AbandonedMutexException] {$locked=$true}
 if (!$locked) {throw 'Another workspace launch is still running.'}
 $toolUrl=Start-ConfiguredEditor
 Write-Output $toolUrl
 if (!$NoBrowser) {Start-Process $toolUrl;Start-Process ($toolUrl+'catalog')}
} finally {if ($locked) {$mutex.ReleaseMutex()};$mutex.Dispose()}
