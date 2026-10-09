[CmdletBinding(SupportsShouldProcess=$true)]
param([string]$GameDir='', [string]$OriginalDir='', [string]$WorkspaceRoot='', [string]$PythonPath='', [string]$MachineRoot='', [switch]$IncludeGameCheckpoint, [switch]$ConfigureOnly)
$ErrorActionPreference='Stop'
if (!$WorkspaceRoot) {$WorkspaceRoot=Split-Path -Parent (Split-Path -Parent $PSScriptRoot)}

function Full-WorkPath([string]$Value) {return [IO.Path]::GetFullPath($Value).TrimEnd([IO.Path]::DirectorySeparatorChar)}
function Is-InFolder([string]$Value,[string]$Root) {return $Value.Equals($Root,[StringComparison]::OrdinalIgnoreCase) -or $Value.StartsWith($Root+'\',[StringComparison]::OrdinalIgnoreCase)}
function Safe-WorkPath([string]$Root,[string]$Relative) {
 $ancestor=$Root
 while ($ancestor) {
  if (Test-Path -LiteralPath $ancestor) {
   $ancestorItem=Get-Item -LiteralPath $ancestor -Force
   if (($ancestorItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {throw "Linked paths cannot be restored: $ancestor"}
  }
  $parent=[IO.Directory]::GetParent($ancestor)
  $ancestor=if ($parent) {$parent.FullName} else {$null}
 }
 if (!$Relative -or $Relative -match '[\x00-\x1f:]' -or $Relative -match '^[\\/]' -or $Relative.Contains('\')) {throw "Invalid package path: $Relative"}
 $parts=$Relative.Split('/')
 foreach($part in $parts) {if (!$part -or $part -in @('.','..') -or $part.EndsWith('.') -or $part.EndsWith(' ') -or $part -match '[<>"|?*]' -or $part -match '^(?i)(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)') {throw "Invalid package path: $Relative"}}
 $target=Full-WorkPath (Join-Path $Root ($Relative.Replace('/','\')))
 if (!(Is-InFolder $target $Root) -or $target.Equals($Root,[StringComparison]::OrdinalIgnoreCase)) {throw "Path outside target folder: $Relative"}
 $cursor=$Root
 foreach($part in @('')+$parts) {
  if ($part) {$cursor=Join-Path $cursor $part}
  if (Test-Path -LiteralPath $cursor) {
   $item=Get-Item -LiteralPath $cursor -Force
   if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {throw "Linked paths cannot be restored: $cursor"}
  }
 }
 return $target
}
function Pick-WorkFolder([string]$Title) {
 Add-Type -AssemblyName System.Windows.Forms
 $dialog=New-Object System.Windows.Forms.FolderBrowserDialog
 try {$dialog.Description=$Title;if ($dialog.ShowDialog() -ne 'OK') {throw 'Folder selection cancelled.'};return $dialog.SelectedPath} finally {$dialog.Dispose()}
}
function Hash-WorkFile([string]$File) {
 $stream=[IO.File]::OpenRead($File);$algorithm=[Security.Cryptography.SHA256]::Create()
 try {return [BitConverter]::ToString($algorithm.ComputeHash($stream)).Replace('-','').ToLowerInvariant()} finally {$algorithm.Dispose();$stream.Dispose()}
}
function Hash-BoundedStream($Stream,[long]$Expected) {
 $algorithm=[Security.Cryptography.SHA256]::Create();$buffer=New-Object byte[] 65536;$count=0L
 try {
  while (($read=$Stream.Read($buffer,0,[int][Math]::Min($buffer.Length,$Expected-$count+1))) -gt 0) {
   $count+=$read;if ($count -gt $Expected) {throw 'ZIP member exceeds its recorded size.'}
   $null=$algorithm.TransformBlock($buffer,0,$read,$buffer,0)
  }
  if ($count -ne $Expected) {throw 'ZIP member size mismatch.'}
  $null=$algorithm.TransformFinalBlock((New-Object byte[] 0),0,0)
  return [BitConverter]::ToString($algorithm.Hash).Replace('-','').ToLowerInvariant()
 } finally {$algorithm.Dispose()}
}
function Rebase-WorkRecord($Value) {
 if ($Value -is [string]) {return $Value.Replace('@GAME@',$GameDir).Replace('@ORIGINAL@',$OriginalDir).Replace('@RUNTIME@',$editorRuntime).Replace('@REPO@',$WorkspaceRoot).Replace('@CATALOG@',$catalog)}
 if ($Value -is [System.Collections.IDictionary]) {foreach($key in @($Value.Keys)) {$Value[$key]=Rebase-WorkRecord $Value[$key]};return $Value}
 if ($Value -is [array]) {return ,@($Value | ForEach-Object {Rebase-WorkRecord $_})}
 if ($null -ne $Value -and $Value -is [pscustomobject]) {foreach($property in @($Value.PSObject.Properties)) {$property.Value=Rebase-WorkRecord $property.Value}}
 return $Value
}
function Write-WorkJson([string]$File,$Value) {
 New-Item -ItemType Directory -Path (Split-Path -Parent $File) -Force | Out-Null
 $temporary=$File+'.restore-tmp'
 $Value | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $temporary -Encoding UTF8
 Move-Item -LiteralPath $temporary -Destination $File -Force
}

$WorkspaceRoot=Full-WorkPath $WorkspaceRoot
$manifestPath=Safe-WorkPath $WorkspaceRoot 'manifest.json'
if (!(Test-Path -LiteralPath $manifestPath -PathType Leaf)) {throw 'JO9WORK manifest.json was not found. Export the shared workspace first.'}
$manifest=Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
if ($manifest.format -ne 'jo9-shared-work' -or $manifest.version -ne 1 -or !$manifest.files) {throw 'Unsupported JO9WORK manifest.'}
$workspaceId=[string]$manifest.workspaceId
if ($workspaceId -notmatch '^[a-zA-Z0-9_-]{1,80}$') {throw 'A stable manifest.workspaceId is required.'}
if ($ConfigureOnly -and $IncludeGameCheckpoint) {throw 'ConfigureOnly cannot apply a game checkpoint.'}
if (!$MachineRoot) {$MachineRoot=Join-Path $env:LOCALAPPDATA ('JO9WORK\'+$workspaceId)}
$MachineRoot=Full-WorkPath $MachineRoot
$configFile=Safe-WorkPath $MachineRoot 'local.config.json'
if (Test-Path -LiteralPath $configFile) {
 $config=Get-Content -LiteralPath $configFile -Raw -Encoding UTF8 | ConvertFrom-Json
 if (!$GameDir) {$GameDir=$config.game};if (!$OriginalDir) {$OriginalDir=$config.original}
}
if (!$GameDir) {$GameDir=Pick-WorkFolder 'Select PLAY game folder containing jack.qsp'}
if (!$OriginalDir) {$OriginalDir=Pick-WorkFolder 'Select VANILLA game folder (read-only comparison)'}
$GameDir=Full-WorkPath ((Resolve-Path -LiteralPath $GameDir).Path)
$OriginalDir=Full-WorkPath ((Resolve-Path -LiteralPath $OriginalDir).Path)
if (!(Test-Path -LiteralPath (Join-Path $GameDir 'jack.qsp') -PathType Leaf) -or !(Test-Path -LiteralPath (Join-Path $GameDir 'content\pic') -PathType Container)) {throw 'PLAY folder must contain jack.qsp and content/pic.'}
if (!(Test-Path -LiteralPath (Join-Path $OriginalDir 'content\pic') -PathType Container)) {throw 'VANILLA folder must contain content/pic.'}
if ((Is-InFolder $GameDir $OriginalDir) -or (Is-InFolder $OriginalDir $GameDir) -or (Is-InFolder $WorkspaceRoot $OriginalDir) -or (Is-InFolder $MachineRoot $OriginalDir)) {throw 'PLAY, workspace and read-only VANILLA folders must be separate.'}
$null=Safe-WorkPath $GameDir 'jack.qsp'
$null=Safe-WorkPath $OriginalDir 'content/pic'
$catalogSource=[string]$manifest.catalogSnapshot;if (!$catalogSource) {$catalogSource='catalog'}
if ($catalogSource -notin @('catalog','catalog-snapshot')) {throw 'Invalid catalogSnapshot folder.'}
$catalog=Safe-WorkPath $WorkspaceRoot 'runtime/catalog'
$editorRuntime=Safe-WorkPath $MachineRoot 'editor'
$items=@{};$gamePlan=New-Object System.Collections.ArrayList;$localPlan=New-Object System.Collections.ArrayList
$destinations=@{}

# Verify the entire payload before writing any PLAY files. Only explicit image
# prefixes and the opt-in QSP checkpoint may map into the game directory.
foreach($file in $manifest.files) {
 $relative=[string]$file.path
 $source=Safe-WorkPath $WorkspaceRoot $relative
 if ($items.ContainsKey($relative)) {throw "Duplicate manifest entry: $relative"}
 if (!(Test-Path -LiteralPath $source -PathType Leaf) -or [string]$file.sha256 -notmatch '^[a-fA-F0-9]{64}$') {throw "Invalid or missing payload: $relative"}
 if ((Get-Item -LiteralPath $source).Length -ne [long]$file.bytes -or (Hash-WorkFile $source) -ne ([string]$file.sha256).ToLowerInvariant()) {throw "Payload checksum mismatch: $relative"}
 $items[$relative]=$file
 $gameRelative=$null;$localRelative=$null
 if ($relative.StartsWith('personal-images/content/pic/') -and !$ConfigureOnly) {$gameRelative=$relative.Substring('personal-images/'.Length)}
 elseif (($relative.StartsWith('working-images/content/modworkpic/') -or $relative.StartsWith('working-images/content/pic/reserve/jo9mod/')) -and !$ConfigureOnly) {$gameRelative=$relative.Substring('working-images/'.Length)}
 elseif ($relative -eq 'game-checkpoint/jack.qsp' -and $IncludeGameCheckpoint) {$gameRelative='jack.qsp'}
 elseif ($relative -eq 'game-metadata/modtools/image-original-cuts.json' -and !$ConfigureOnly) {$gameRelative='modtools/image-original-cuts.json'}
 elseif ($relative -in @('preferences/workshop/config.json','preferences/workshop/filters.json') -and !$ConfigureOnly) {$gameRelative='modtools/'+[IO.Path]::GetFileName($relative)}
 elseif ($relative.StartsWith($catalogSource+'/')) {$localRelative='runtime/catalog/'+$relative.Substring($catalogSource.Length+1)}
 elseif ($relative.StartsWith('records/dialogue/') -and $relative.EndsWith('.json')) {$localRelative='editor/backups/'+$relative.Substring('records/dialogue/'.Length)}
 elseif ($relative -match '^records/(cut-mods|original-cut-history|cut-history)/(.+\.json)$') {$localRelative='editor/'+$matches[1]+'/'+$matches[2]}
 elseif ($relative.StartsWith('game-metadata/mods/') -and $relative.EndsWith('.json')) {$localRelative='editor/imported-game-mods/'+$relative.Substring('game-metadata/mods/'.Length)}
 if ($gameRelative) {
  if ($relative.StartsWith('personal-images/') -and $gameRelative -notmatch '(?i)\.(png|jpe?g|gif|webp|bmp|avif)$') {throw "Non-image personal payload: $relative"}
  $destination=Safe-WorkPath $GameDir $gameRelative
  if (Test-Path -LiteralPath $destination -PathType Container) {throw "File destination is a directory: $destination"}
  $hash=([string]$file.sha256).ToLowerInvariant()
  if ($destinations.ContainsKey($destination)) {if ($destinations[$destination] -ne $hash) {throw "Conflicting image destinations: $gameRelative"};continue}
  $destinations[$destination]=$hash
  $row=@{source=$source;destination=$destination;relative=$gameRelative;hash=$hash}
  if ($gameRelative.StartsWith('modtools/')) {$row.record=Rebase-WorkRecord (Get-Content -LiteralPath $source -Raw -Encoding UTF8 | ConvertFrom-Json)}
  $null=$gamePlan.Add($row)
 } elseif ($localRelative) {
  $root=if ($localRelative.StartsWith('editor/')) {$MachineRoot} else {$WorkspaceRoot}
  $destination=Safe-WorkPath $root $localRelative
  if (Test-Path -LiteralPath $destination -PathType Container) {throw "File destination is a directory: $destination"}
  $row=@{source=$source;destination=$destination;relative=$localRelative;root=$root;hash=([string]$file.sha256).ToLowerInvariant()}
  if ($localRelative.StartsWith('editor/')) {$row.record=Rebase-WorkRecord (Get-Content -LiteralPath $source -Raw -Encoding UTF8 | ConvertFrom-Json)}
  $null=$localPlan.Add($row)
 }
}
if ($IncludeGameCheckpoint -and !$items.ContainsKey('game-checkpoint/jack.qsp')) {throw 'This workspace has no game checkpoint.'}
foreach($required in @('catalog_merge_vs_original.html','catalog_work_ids.json','catalog_status.js')) {if (!$items.ContainsKey($catalogSource+'/'+$required)) {throw "Missing catalog snapshot: $required"}}
foreach($name in @('grok-settings.json','dialogue-ai-settings.json')) {
 $key='preferences/'+$name
 if (!$items.ContainsKey($key)) {continue}
 $preferences=Get-Content -LiteralPath (Safe-WorkPath $WorkspaceRoot $key) -Raw -Encoding UTF8 | ConvertFrom-Json
 foreach($property in $preferences.PSObject.Properties) {if ($property.Name -notin @('provider','model','aiId') -or ($null -ne $property.Value -and $property.Value -isnot [string])) {throw "Unexpected preference field: $($property.Name)"}}
}
$junction=$null;$needJunction=$false;$createdJunction=$false
if (!$ConfigureOnly -and $items.ContainsKey('game-metadata/modtools/image-original-cuts.json')) {
 $row=@($gamePlan | Where-Object {$_.relative -eq 'modtools/image-original-cuts.json'})[0]
 $metadata=$row.record
 if ($metadata.version -ne 1 -or !$metadata.originals) {throw 'Invalid original-cut registry.'}
 $metadata | Add-Member -NotePropertyName sourceRoot -NotePropertyValue $OriginalDir -Force
 foreach($property in @($metadata.originals.PSObject.Properties)) {
  $entry=$property.Value
  if ([string]$entry.source -notmatch '^content/pic/' -or [string]$entry.target -ne ('content/jo9o_original_cuts/'+([string]$entry.source).Substring('content/pic/'.Length))) {throw 'Invalid original-cut source/target path.'}
  $source=Safe-WorkPath $OriginalDir ([string]$entry.source)
  if (!(Test-Path -LiteralPath $source -PathType Leaf) -or (Hash-WorkFile $source) -ne ([string]$entry.sourceSha).ToLowerInvariant()) {throw "Original-cut comparison file differs: $($entry.source)"}
 }
 if (@($metadata.originals.PSObject.Properties).Count) {
  $null=Safe-WorkPath $GameDir 'content'
  $junction=Join-Path $GameDir 'content\jo9o_original_cuts'
  $expectedTarget=Full-WorkPath (Join-Path $OriginalDir 'content\pic')
  $existing=Get-Item -LiteralPath $junction -Force -ErrorAction SilentlyContinue
  if ($existing) {
   $linkTarget=[string]@($existing.Target)[0]
   if ($existing.LinkType -ne 'Junction' -or !$linkTarget -or (Full-WorkPath $linkTarget.Replace('\??\','')) -ne $expectedTarget) {throw 'Original-cut junction points elsewhere. It was not removed or replaced.'}
  } else {$needJunction=$true}
 }
}
$zipRows=@();$zipFile=$null
if ($items.ContainsKey('records/dialogue-backups.zip') -or $items.ContainsKey('records/dialogue-backups.json')) {
 if (!$items.ContainsKey('records/dialogue-backups.zip') -or !$items.ContainsKey('records/dialogue-backups.json')) {throw 'ZIP backup archive and member manifest must be provided together.'}
 Add-Type -AssemblyName System.IO.Compression
 Add-Type -AssemblyName System.IO.Compression.FileSystem
 $zipFile=Safe-WorkPath $WorkspaceRoot 'records/dialogue-backups.zip'
 $memberManifest=Get-Content -LiteralPath (Safe-WorkPath $WorkspaceRoot 'records/dialogue-backups.json') -Raw -Encoding UTF8 | ConvertFrom-Json
 if ($memberManifest.format -ne 'jo9-dialogue-backups' -or $memberManifest.version -ne 1 -or @($memberManifest.files).Count -gt 10000) {throw 'Unsupported ZIP backup manifest.'}
 $members=@{};$totalBytes=0L
 foreach($member in $memberManifest.files) {
  $name=[string]$member.path
  if ($name -notmatch '^[a-zA-Z0-9][a-zA-Z0-9_.-]*\.qsp$' -or $name.Length -gt 200) {throw 'Invalid ZIP backup member path.'}
  $null=Safe-WorkPath $editorRuntime ('backups/'+$name)
  if ($members.ContainsKey($name) -or [string]$member.sha256 -notmatch '^[a-fA-F0-9]{64}$' -or [long]$member.bytes -lt 0 -or [long]$member.bytes -gt 536870912) {throw 'Invalid ZIP backup member.'}
  $totalBytes+=[long]$member.bytes;if ($totalBytes -gt 8589934592) {throw 'ZIP backup archive exceeds the total size limit.'}
  $members[$name]=$member
 }
 $archive=[IO.Compression.ZipFile]::OpenRead($zipFile)
 try {
  if ($archive.Entries.Count -ne $members.Count) {throw 'ZIP backup members differ from their manifest.'}
  $seen=@{}
  foreach($entry in $archive.Entries) {
   $name=$entry.FullName
   $mode=([long]$entry.ExternalAttributes -shr 16) -band 61440
   if (!$members.ContainsKey($name) -or $seen.ContainsKey($name) -or $name -notmatch '^[a-zA-Z0-9][a-zA-Z0-9_.-]*\.qsp$' -or $mode -notin @(0,32768) -or ($entry.ExternalAttributes -band 1024) -ne 0) {throw 'Unsafe or unexpected ZIP backup member.'}
   $seen[$name]=$true;$member=$members[$name]
   if ($entry.Length -ne [long]$member.bytes) {throw 'ZIP member size differs from its manifest.'}
   $stream=$entry.Open();try {$hash=Hash-BoundedStream $stream ([long]$member.bytes)} finally {$stream.Dispose()}
   if ($hash -ne ([string]$member.sha256).ToLowerInvariant()) {throw 'ZIP member checksum mismatch.'}
   $zipRows+=@{name=$name;bytes=[long]$member.bytes;hash=$hash;destination=(Safe-WorkPath $editorRuntime ('backups/'+$name));relative=('editor/backups/'+$name)}
  }
 } finally {$archive.Dispose()}
}
if (!$PythonPath) {
 $PythonPath=Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
 if (!(Test-Path -LiteralPath $PythonPath)) {$PythonPath=(Get-Command python -ErrorAction Stop).Source}
}
$sync=Safe-WorkPath $WorkspaceRoot 'tools/local-workspace/sync-workspace-state.py'
if (!(Test-Path -LiteralPath $sync -PathType Leaf)) {throw 'The workspace metadata restore helper is missing.'}
if (!$PSCmdlet.ShouldProcess($GameDir,('Restore '+$gamePlan.Count+' personal/work files; QSP checkpoint '+[bool]$IncludeGameCheckpoint))) {return}

$restoreId=Get-Date -Format 'yyyyMMdd_HHmmss_fff';$restoreId+='_'+[guid]::NewGuid().ToString('N').Substring(0,8)
$backupRoot=Safe-WorkPath $WorkspaceRoot ('runtime/restore-backups/'+$restoreId)
New-Item -ItemType Directory -Path $backupRoot,$catalog,$editorRuntime -Force | Out-Null
$applied=New-Object System.Collections.ArrayList;$backupItems=New-Object System.Collections.ArrayList
function Copy-VerifiedWorkFile($Row,[string]$BackupRelative) {
 if ((Test-Path -LiteralPath $Row.destination -PathType Leaf) -and (Hash-WorkFile $Row.destination) -eq $Row.hash) {return}
 $backup=$null
 if (Test-Path -LiteralPath $Row.destination) {
  $backup=Safe-WorkPath $backupRoot $BackupRelative
  New-Item -ItemType Directory -Path (Split-Path -Parent $backup) -Force | Out-Null
  Copy-Item -LiteralPath $Row.destination -Destination $backup
  $null=$backupItems.Add(@{target=$Row.destination;backup=$BackupRelative;sha256=(Hash-WorkFile $backup)})
 }
 $null=$applied.Add(@{destination=$Row.destination;backup=$backup})
 New-Item -ItemType Directory -Path (Split-Path -Parent $Row.destination) -Force | Out-Null
 Copy-Item -LiteralPath $Row.source -Destination $Row.destination -Force
 if ((Hash-WorkFile $Row.destination) -ne $Row.hash) {throw "Restored checksum mismatch: $($Row.relative)"}
}
try {
 if ($needJunction) {
  New-Item -ItemType Junction -Path $junction -Target (Join-Path $OriginalDir 'content\pic') | Out-Null
  $createdJunction=$true
 }
 if ($zipFile) {
  $archive=[IO.Compression.ZipFile]::OpenRead($zipFile)
  try {
   foreach($row in $zipRows) {
    $prepared=Safe-WorkPath $backupRoot ('prepared/'+$row.name)
    New-Item -ItemType Directory -Path (Split-Path -Parent $prepared) -Force | Out-Null
    $input=$archive.GetEntry($row.name).Open();$output=[IO.File]::Create($prepared)
    try {
     $buffer=New-Object byte[] 65536;$written=0L
     while (($read=$input.Read($buffer,0,[int][Math]::Min($buffer.Length,$row.bytes-$written+1))) -gt 0) {
      $written+=$read;if ($written -gt $row.bytes) {throw 'ZIP member exceeds its recorded size while extracting.'}
      $output.Write($buffer,0,$read)
     }
    } finally {$input.Dispose();$output.Dispose()}
    if ((Get-Item -LiteralPath $prepared).Length -ne $row.bytes -or (Hash-WorkFile $prepared) -ne $row.hash) {throw 'Prepared ZIP backup checksum mismatch.'}
    $row.source=$prepared;Copy-VerifiedWorkFile $row ('machine/'+$row.relative)
    # The compressed shared archive and installed undo copy are sufficient.
    # Do not leave a second uncompressed copy of every historical game here.
    $null=Safe-WorkPath $backupRoot ('prepared/'+$row.name)
    Remove-Item -LiteralPath $prepared -Force
   }
  } finally {$archive.Dispose()}
 }
 foreach($row in $gamePlan) {
  $null=Safe-WorkPath $GameDir $row.relative
  if ($row.ContainsKey('record')) {
   $prepared=Safe-WorkPath $backupRoot ('prepared/game/'+$row.relative)
   Write-WorkJson $prepared $row.record;$row.source=$prepared;$row.hash=Hash-WorkFile $prepared
  }
  Copy-VerifiedWorkFile $row ('game/'+$row.relative)
 }
 # Preserve live catalogue state by merging against the portable snapshot.
 foreach($row in $localPlan) {
  if ($row.relative.StartsWith('runtime/catalog/') -and (Test-Path -LiteralPath $row.destination)) {continue}
  if ($row.ContainsKey('record')) {
   $prepared=Safe-WorkPath $backupRoot ('prepared/'+$row.relative)
   Write-WorkJson $prepared $row.record;$row.source=$prepared;$row.hash=Hash-WorkFile $prepared
  }
  Copy-VerifiedWorkFile $row ('workspace/'+$row.relative)
 }
 & $PythonPath $sync --source (Safe-WorkPath $WorkspaceRoot $catalogSource) --catalog $catalog --game $GameDir --original $OriginalDir | Out-Host
 if ($LASTEXITCODE -ne 0) {throw 'Catalogue metadata restore failed.'}
 foreach($name in @('grok-settings.json','dialogue-ai-settings.json')) {
  $key='preferences/'+$name;if (!$items.ContainsKey($key)) {continue}
  $destination=Safe-WorkPath $MachineRoot ('editor/'+$name)
  $row=@{source=(Safe-WorkPath $WorkspaceRoot $key);destination=$destination;relative=('editor/'+$name);hash=([string]$items[$key].sha256).ToLowerInvariant()}
  Copy-VerifiedWorkFile $row ('machine/editor/'+$name)
 }
 Write-WorkJson $configFile @{workspace=$WorkspaceRoot;workspaceId=$workspaceId;game=$GameDir;original=$OriginalDir;catalog=$catalog;runtime=$editorRuntime;restoredAt=(Get-Date).ToString('o');exportId=$manifest.exportId}
 Write-WorkJson (Join-Path $backupRoot 'restore.json') @{exportId=$manifest.exportId;includeGameCheckpoint=[bool]$IncludeGameCheckpoint;game=$GameDir;original=$OriginalDir;files=@($backupItems);copied=@($applied | ForEach-Object {$_.destination})}
 Write-Output ('JO9WORK restored. '+$applied.Count+' changed files; backup: '+$backupRoot)
 Write-Output 'API keys stay on this PC. Enter keys again on a new PC. No server was started.'
} catch {
 $failure=$_
 for($i=$applied.Count-1;$i -ge 0;$i--) {
  $entry=$applied[$i]
  if (!(Is-InFolder $entry.destination $GameDir) -and !(Is-InFolder $entry.destination $MachineRoot) -and !(Is-InFolder $entry.destination $catalog)) {throw 'Unsafe rollback destination.'}
  if ($entry.backup) {Copy-Item -LiteralPath $entry.backup -Destination $entry.destination -Force}
  elseif (Test-Path -LiteralPath $entry.destination -PathType Leaf) {Remove-Item -LiteralPath $entry.destination -Force}
 }
 if ($createdJunction) {
  if ((Full-WorkPath $junction) -ne (Full-WorkPath (Join-Path $GameDir 'content\jo9o_original_cuts'))) {throw 'Unsafe junction rollback target.'}
  # Delete this link only; never recurse through the read-only target.
  [IO.Directory]::Delete($junction)
 }
 throw $failure
}
