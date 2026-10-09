# Canonical launchers: isolated fixture tests; no real server, game or settings are changed.
$ErrorActionPreference='Stop'
$root=Join-Path ([IO.Path]::GetTempPath()) ('jo9-launcher-test-'+[guid]::NewGuid().ToString('N'))
$node=Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
if (!(Test-Path -LiteralPath $node)) {$node=(Get-Command node -ErrorAction Stop).Source}
$global:jo9LauncherTest=@{process=$null;workshop=$null;watcher=$null;status=$null;foreignPid=0;starts=0;watchStarts=0;stops=0;conflicting=$false}
function Assert($condition,[string]$message) {if (!$condition) {throw $message}}
function Get-CimInstance {param($ClassName,$Filter,$ErrorAction)
 if ($Filter -like "Name='python*") {return $global:jo9LauncherTest.watcher}
 if ($Filter -like "Name=*") {return $global:jo9LauncherTest.workshop}
 if ($Filter -match '^ProcessId=(\d+)$') {
  $asked=[int]$Matches[1]
  if ($global:jo9LauncherTest.watcher -and $global:jo9LauncherTest.watcher.ProcessId -eq $asked) {return $global:jo9LauncherTest.watcher}
  if ($global:jo9LauncherTest.foreignPid -eq $asked) {return [pscustomobject]@{ProcessId=$asked;CommandLine='other.exe --work'}}
 }
 if ($ClassName -eq 'Win32_Process' -and $global:jo9LauncherTest.process) {return $global:jo9LauncherTest.process}
}
function Get-NetTCPConnection {param($LocalPort,$State,$ErrorAction)
 if ($global:jo9LauncherTest.conflicting) {return [pscustomobject]@{OwningProcess=777}}
 if ($global:jo9LauncherTest.process) {return [pscustomobject]@{OwningProcess=$global:jo9LauncherTest.process.ProcessId}}
}
function Invoke-WebRequest {param([switch]$UseBasicParsing,$Uri,$TimeoutSec)
 return [pscustomobject]@{StatusCode=200}
}
function Get-Process {param($Id,$ErrorAction)
 if ($global:jo9LauncherTest.foreignPid -eq $Id) {return [pscustomobject]@{ProcessId=$Id}}
 if ($global:jo9LauncherTest.process -and $global:jo9LauncherTest.process.ProcessId -eq $Id) {return $global:jo9LauncherTest.process}
}
function Invoke-RestMethod {param($Uri,$TimeoutSec)
 return $global:jo9LauncherTest.status
}
function Stop-Process {param($Id,[switch]$Force,$ErrorAction)
 Assert ($global:jo9LauncherTest.process -and $global:jo9LauncherTest.process.ProcessId -eq $Id) 'Foreign process was stopped.'
 $global:jo9LauncherTest.stops++;$global:jo9LauncherTest.process=$null
}
function Wait-Process {param($Id,$Timeout,$ErrorAction)}
function Start-Process {param($FilePath,$ArgumentList,$WindowStyle,[switch]$PassThru,$RedirectStandardOutput,$RedirectStandardError)
 if ($FilePath -eq 'fixture-python.exe') {
  $global:jo9LauncherTest.watchStarts++
  $global:jo9LauncherTest.watcher=[pscustomobject]@{ProcessId=3001;CommandLine='"fixture-python.exe" '+$ArgumentList}
  return [pscustomobject]@{Id=3001}
 }
 $global:jo9LauncherTest.starts++
 Assert ($FilePath -eq $node) 'Unexpected program start.'
 Assert ($ArgumentList.StartsWith('"'+(Join-Path $game 'modtools\text-workshop\server.cjs')+'"')) 'Source server was launched instead of installed server.'
 $processId=1000+$global:jo9LauncherTest.starts
 $global:jo9LauncherTest.process=[pscustomobject]@{ProcessId=$processId;CommandLine='"'+$FilePath+'" '+$ArgumentList}
 $record=@{pid=$processId;url='http://127.0.0.1:3813/';target=(Join-Path $game 'jack.qsp')}
 $record | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $runtime 'server.json') -Encoding UTF8
 $result=[pscustomobject]@{Id=$processId;HasExited=$false}
 $result | Add-Member ScriptMethod Refresh {}
 return $result
}
try {
 $fixture=Join-Path $root 'tools\local-workspace';$code=Join-Path $root 'tools\text-workshop'
 $game=Join-Path $root 'play\game';$original=Join-Path $root 'vanilla\game'
 $catalog=Join-Path $root 'custom-catalog';$runtime=Join-Path $game 'modtools\text-workshop\runtime'
 New-Item -ItemType Directory -Path $fixture,$code,$catalog,$runtime,(Join-Path $game 'content\pic'),(Join-Path $original 'content\pic'),(Join-Path $fixture 'settings-seed') -Force | Out-Null
 $launcher=Join-Path $fixture 'Start-JO9-Tools.ps1'
 Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'Start-JO9-Tools.ps1') -Destination $launcher
 Set-Content -LiteralPath (Join-Path $game 'jack.qsp') -Value 'fixture QSP' -Encoding UTF8
 Set-Content -LiteralPath (Join-Path $catalog 'catalog_merge_vs_original.html') -Value 'keep catalog' -Encoding UTF8
 Set-Content -LiteralPath (Join-Path $code 'server.cjs') -Value 'version one' -Encoding UTF8
 Set-Content -LiteralPath (Join-Path $code 'fixture.test.cjs') -Value 'do not deploy tests' -Encoding UTF8
 foreach ($name in @('grok-settings.json','dialogue-ai-settings.json')) {
  Set-Content -LiteralPath (Join-Path $fixture ('settings-seed\'+$name)) -Value '{"seed":true}' -Encoding UTF8
  Set-Content -LiteralPath (Join-Path $runtime $name) -Value '{"keep":true}' -Encoding UTF8
 }
 @{game=$game;original=$original;catalog=$catalog;runtime=$runtime} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $fixture 'local.config.json') -Encoding UTF8
 @{revision=('a'*40);committedAt=1000} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $fixture '.jo9-tool-version.json') -Encoding UTF8
 $url=& $launcher -NodePath $node -NoBrowser
 Assert ($url -eq 'http://127.0.0.1:3813/') 'Configured server URL is wrong.'
 $config=Get-Content -LiteralPath (Join-Path $fixture 'local.config.json') -Raw | ConvertFrom-Json
 Assert ($config.catalog -eq $catalog -and $config.runtime -eq $runtime) 'Custom state folders were lost.'
 Assert ((Get-Content -LiteralPath (Join-Path $catalog 'catalog_merge_vs_original.html') -Raw).Trim() -eq 'keep catalog') 'Existing catalog was overwritten.'
 Assert (!(Test-Path -LiteralPath (Join-Path $game 'modtools\text-workshop\fixture.test.cjs'))) 'Tests were deployed.'
 Assert ((Get-Content -LiteralPath (Join-Path $runtime 'grok-settings.json') -Raw).Trim() -eq '{"keep":true}') 'Existing settings were overwritten.'
 Assert ($global:jo9LauncherTest.starts -eq 1 -and $global:jo9LauncherTest.stops -eq 0) 'Initial launch count is wrong.'
 $null=& $launcher -NodePath $node -NoBrowser
 Assert ($global:jo9LauncherTest.starts -eq 1 -and $global:jo9LauncherTest.stops -eq 0) 'Unchanged server was duplicated/restarted.'
 # A fresh portable machine may have neither preference seeds nor stored model settings.
 Remove-Item -LiteralPath (Join-Path $runtime 'dialogue-ai-settings.json'),(Join-Path $fixture 'settings-seed\dialogue-ai-settings.json') -Force
 $null=& $launcher -NodePath $node -NoBrowser
 Assert (!(Test-Path -LiteralPath (Join-Path $runtime 'dialogue-ai-settings.json'))) 'Missing optional preference seed should be handled by server defaults.'
 $privateConfig=Join-Path $root 'machine.config.json'
 @{game=$game;original=$original;catalog=$catalog;runtime=$runtime;workspace=$root;workspaceId='preserve-id'} | ConvertTo-Json | Set-Content -LiteralPath $privateConfig -Encoding UTF8
 $sharedConfigHash=(Get-FileHash -LiteralPath (Join-Path $fixture 'local.config.json')).Hash
 $null=& $launcher -NodePath $node -ConfigFile $privateConfig -NoBrowser
 $privateState=Get-Content -LiteralPath $privateConfig -Raw | ConvertFrom-Json
 Assert ($privateState.workspace -eq $root -and $privateState.workspaceId -eq 'preserve-id') 'Canonical launcher lost private workspace identity.'
 Assert ((Get-FileHash -LiteralPath (Join-Path $fixture 'local.config.json')).Hash -eq $sharedConfigHash) 'Canonical launcher wrote machine paths into shared config.'
 Set-Content -LiteralPath (Join-Path $code 'server.cjs') -Value 'version two' -Encoding UTF8
 $null=& $launcher -NodePath $node -NoBrowser
 Assert ($global:jo9LauncherTest.starts -eq 2 -and $global:jo9LauncherTest.stops -eq 1) 'Changed code did not restart the verified server once.'
 Set-Content -LiteralPath (Join-Path $code 'server.cjs') -Value 'old package' -Encoding UTF8
 @{revision=('b'*40);committedAt=500} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $fixture '.jo9-tool-version.json') -Encoding UTF8
 $blocked=$false
 try {$null=& $launcher -NodePath $node -NoBrowser} catch {$blocked=$_.Exception.Message -like '*Downgrade was blocked*'}
 Assert ($blocked -and $global:jo9LauncherTest.starts -eq 2 -and $global:jo9LauncherTest.stops -eq 1) 'Older source overwrote/restarted the installed version.'
 @{revision=('a'*40);committedAt=1000} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $fixture '.jo9-tool-version.json') -Encoding UTF8
 $global:jo9LauncherTest.process.CommandLine=$global:jo9LauncherTest.process.CommandLine.Replace($catalog,(Join-Path $root 'other-catalog'))
 $blocked=$false
 try {$null=& $launcher -NodePath $node -NoBrowser} catch {$blocked=$_.Exception.Message -like '*different code or folders*'}
 Assert ($blocked -and $global:jo9LauncherTest.starts -eq 2 -and $global:jo9LauncherTest.stops -eq 1) 'A server with different folders was not protected.'
 $global:jo9LauncherTest.process=$null;$global:jo9LauncherTest.conflicting=$true
 $blocked=$false
 try {$null=& $launcher -NodePath $node -NoBrowser} catch {$blocked=$_.Exception.Message -like '*another server*'}
 Assert ($blocked -and $global:jo9LauncherTest.starts -eq 2 -and $global:jo9LauncherTest.stops -eq 1) 'An unrelated port owner was not protected.'
 # Read only workshop helper definitions; never execute the real tool launcher.
 $tokens=$null;$errors=$null
 $openPath=Join-Path $PSScriptRoot 'Open-Modding-Tools.ps1'
 $ast=[Management.Automation.Language.Parser]::ParseFile($openPath,[ref]$tokens,[ref]$errors)
 foreach ($definition in $ast.FindAll({param($item) $item -is [Management.Automation.Language.FunctionDefinitionAst]},$false)) {
  if ($definition.Name -in @('Normalize-WorkshopPath','Get-WorkshopProcess','Get-WorkshopUrl')) {Invoke-Expression $definition.Extent.Text}
 }
 $workshop=Join-Path $game 'modtools\JO9_Server.ps1';$workshopRuntime=Join-Path $game 'modtools\runtime'
 New-Item -ItemType Directory -Path $workshopRuntime -Force | Out-Null
 Set-Content -LiteralPath (Join-Path $workshopRuntime 'server.pid') -Value '2001' -Encoding ASCII
 Set-Content -LiteralPath (Join-Path $workshopRuntime 'port.txt') -Value '12770' -Encoding ASCII
 $global:jo9LauncherTest.workshop=[pscustomobject]@{ProcessId=2001;CommandLine=('powershell.exe -NoProfile -File "'+$workshop.Replace('\','/').ToUpperInvariant()+'" -Port 0')}
 $global:jo9LauncherTest.status=[pscustomobject]@{alive=$true;pid=2001;port=12770}
 Assert ((Get-WorkshopUrl $workshopRuntime $workshop) -eq 'http://127.0.0.1:12770/') 'Workshop did not reuse the dynamic registered port.'
 $global:jo9LauncherTest.status.pid=999
 $blocked=$false
 try {$null=Get-WorkshopUrl $workshopRuntime $workshop} catch {$blocked=$_.Exception.Message -like '*disagree*'}
 Assert $blocked 'Workshop accepted mismatched API PID.'
 $global:jo9LauncherTest.workshop=$null;$global:jo9LauncherTest.foreignPid=2001
 $blocked=$false
 try {$null=Get-WorkshopUrl $workshopRuntime $workshop} catch {$blocked=$_.Exception.Message -like '*different process*'}
 Assert $blocked 'Workshop accepted an unrelated process from stale runtime files.'
 $global:jo9LauncherTest.foreignPid=0
 Assert ((Get-WorkshopUrl $workshopRuntime $workshop) -eq '') 'Dead workshop record was reused.'
 Assert ((Get-Content -LiteralPath $openPath -Raw) -notmatch '\b5269\b') 'Hardcoded workshop server port remains.'
 # Shared configuration and watcher helpers run only against fixture paths/processes.
 $sharedPath=Join-Path $PSScriptRoot 'Start-Shared-JO9.ps1'
 $tokens=$null;$errors=$null
 $ast=[Management.Automation.Language.Parser]::ParseFile($sharedPath,[ref]$tokens,[ref]$errors)
 foreach ($definition in $ast.FindAll({param($item) $item -is [Management.Automation.Language.FunctionDefinitionAst]},$false)) {Invoke-Expression $definition.Extent.Text.Replace('$PSScriptRoot',("'"+$PSScriptRoot.Replace("'","''")+"'"))}
 $WorkspaceRoot=$root;$MachineRoot=Join-Path $root 'machine-local';$PythonPath='fixture-python.exe'
 New-Item -ItemType Directory -Path $MachineRoot -Force | Out-Null
 @{workspaceId='fixture-shared-workspace'} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $WorkspaceRoot 'manifest.json') -Encoding UTF8
 @{workspace=$root;workspaceId='fixture-shared-workspace';game=$game;original=$original;catalog=$catalog;runtime=$runtime} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $MachineRoot 'local.config.json') -Encoding UTF8
 $shared=Get-SharedContext
 Assert ($shared.configFile -eq (Join-Path $MachineRoot 'local.config.json') -and $shared.catalog -eq $catalog -and $shared.runtime -eq $runtime) 'Shared wrapper used a shared/mismatched machine configuration.'
 $watcher=Join-Path $PSScriptRoot 'watch-shared-work.py'
 Assert (Test-Path -LiteralPath $watcher) 'Watcher source must be present for helper tests.'
 Start-SharedWatcher $shared
 Assert ($global:jo9LauncherTest.watchStarts -eq 1 -and (Test-Path -LiteralPath (Join-Path $runtime 'shared-sync-process.json'))) 'Shared watcher did not start with its independent PID marker.'
 Start-SharedWatcher $shared
 Assert ($global:jo9LauncherTest.watchStarts -eq 1) 'Shared watcher was duplicated.'
 $global:jo9LauncherTest.watcher.CommandLine=$global:jo9LauncherTest.watcher.CommandLine.Replace($catalog,(Join-Path $root 'wrong-catalog'))
 $blocked=$false
 try {Start-SharedWatcher $shared} catch {$blocked=$_.Exception.Message -like '*another command or folders*'}
 Assert ($blocked -and $global:jo9LauncherTest.watchStarts -eq 1) 'Mismatched shared watcher was not protected.'
 foreach ($name in @('Start-JO9-Tools.ps1','Open-Modding-Tools.ps1','Start-Shared-JO9.ps1','Save-Shared-JO9.ps1')) {
  $path=Join-Path $PSScriptRoot $name;$tokens=$null;$errors=$null
  $null=[Management.Automation.Language.Parser]::ParseFile($path,[ref]$tokens,[ref]$errors)
  Assert (!$errors) ('Parse failed: '+$name)
  $bytes=[IO.File]::ReadAllBytes($path)
  Assert ($bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191) ('UTF8 BOM missing: '+$name)
 }
 Write-Output 'PASS: custom catalog/runtime, private ConfigFile/workspace identity, installed code, state preservation, server reuse, safe restart, downgrade block, foreign process/port protection, workshop dynamic port/PID validation, shared machine config/watcher identity, PS parsing/BOM.'
} finally {
 $resolved=[IO.Path]::GetFullPath($root)
 Assert ($resolved.StartsWith([IO.Path]::GetFullPath([IO.Path]::GetTempPath()),[StringComparison]::OrdinalIgnoreCase) -and (Split-Path -Leaf $resolved).StartsWith('jo9-launcher-test-')) 'Unsafe fixture cleanup path.'
 Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction SilentlyContinue
}
