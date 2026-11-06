param(
    [string]$TempRoot = 'G:/Codex/tmp/jo9-independent-qa-r2-20261105/installer',
    [string]$OutRoot = $PSScriptRoot,
    [string]$ZipPath = 'G:/somi/JO9_2.4.1_Patch_20261105_r2/JO9_2.4.1_Patch_20261105_r2.zip',
    [string[]]$Only,
    [switch]$UseCandidateHelper
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$utf8 = New-Object Text.UTF8Encoding($false)
$utf8bom = New-Object Text.UTF8Encoding($true)
$results = New-Object 'System.Collections.Generic.List[object]'
$winps = Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0/powershell.exe'
$modulePath = Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0/Modules'
$env:PSModulePath = $modulePath
$allowedRoot='G:\Codex\tmp\jo9-independent-qa-r2-20261105\installer'
$resolvedTemp=[IO.Path]::GetFullPath($TempRoot).TrimEnd('\')
if ($resolvedTemp -ne $allowedRoot -and $resolvedTemp -ne ($allowedRoot+'\candidate-helper')) { throw 'Unexpected fixture scope' }
$Only = @($Only -split ',' | Where-Object { $_ })
if ((Test-Path -LiteralPath $TempRoot) -and -not $Only.Count) { throw 'Fixture root already exists; preserve evidence and choose a clean run.' }
[IO.Directory]::CreateDirectory($TempRoot) | Out-Null
[IO.Directory]::CreateDirectory($OutRoot) | Out-Null
function Put([string]$Path,[string]$Text) {
    [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($Path)) | Out-Null
    [IO.File]::WriteAllText($Path,$Text,$utf8)
}
function FileDigest([string]$Path) { (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() }
function Snapshot([string]$Root) {
    $map = @{}
    Get-ChildItem -LiteralPath $Root -Recurse -Force -File | ForEach-Object { $map[$_.FullName.Substring($Root.Length).Replace('\','/')] = FileDigest $_.FullName }
    return $map
}
function Same($A,$B) {
    if($A.Count -ne $B.Count){return $false}
    foreach($k in $A.Keys){ if(-not $B.ContainsKey($k) -or $A[$k] -ne $B[$k]){ return $false } }
    return $true
}
function Check([bool]$Value,[string]$Message) { if(-not $Value){throw $Message} }
function Run-Child([string]$File,[string]$Arguments,[string]$Id,[string]$WorkingDirectory) {
    $si=New-Object Diagnostics.ProcessStartInfo
    $si.FileName=$File; $si.Arguments=$Arguments; $si.UseShellExecute=$false
    if($WorkingDirectory){$si.WorkingDirectory=$WorkingDirectory}
    $si.CreateNoWindow=$true; $si.RedirectStandardOutput=$true; $si.RedirectStandardError=$true; $si.RedirectStandardInput=$true
    if($File -eq $env:ComSpec){$si.StandardOutputEncoding=[Text.Encoding]::UTF8;$si.StandardErrorEncoding=[Text.Encoding]::UTF8}
    $si.EnvironmentVariables['PSModulePath']=$modulePath
    $si.EnvironmentVariables['JO9_QA_MARK']='EXPANDED'
    $p=New-Object Diagnostics.Process; $p.StartInfo=$si
    $watch=[Diagnostics.Stopwatch]::StartNew()
    $p.Start() | Out-Null; $p.StandardInput.Close()
    $outTask=$p.StandardOutput.ReadToEndAsync(); $errTask=$p.StandardError.ReadToEndAsync()
    if(-not $p.WaitForExit(120000)){ $p.Kill(); throw 'Installer child timed out' }
    $stdout=$outTask.Result; $stderr=$errTask.Result; $code=$p.ExitCode
    $log = 'EXECUTABLE: '+$File+"`r`nARGUMENTS: "+$Arguments+"`r`nPSModulePath (child only): "+$modulePath+"`r`nEXIT: "+$code+"`r`nELAPSED_MS: "+$watch.ElapsedMilliseconds+"`r`nSTDOUT:`r`n"+$stdout+"`r`nSTDERR:`r`n"+$stderr
    [IO.File]::WriteAllText((Join-Path $OutRoot ($Id+'.log')),$log,$utf8)
    $p.Dispose()
    return [pscustomobject]@{code=$code;stdout=$stdout;stderr=$stderr;elapsedMs=$watch.ElapsedMilliseconds}
}
function Run-Helper([string]$Patch,[string]$Target,[string]$Id) {
    $args='-NoLogo -NoProfile -STA -ExecutionPolicy Bypass -File "'+(Join-Path $Patch 'INSTALL_HELPER.ps1')+'" -NonInteractive'
    if($Target){ $args+=' -TargetRoot "'+$Target+'"' }
    return Run-Child $winps $args $Id
}
function Record([string]$Id,[string]$Name,[scriptblock]$Body) {
    if($Only.Count -and $Id -notin $Only){return}
    $watch=[Diagnostics.Stopwatch]::StartNew()
    try { $evidence=& $Body; $r=[pscustomobject]@{id=$Id;name=$Name;result='PASS';evidence=$evidence;elapsedMs=$watch.ElapsedMilliseconds} }
    catch { $r=[pscustomobject]@{id=$Id;name=$Name;result='FAIL';error=$_.Exception.Message;elapsedMs=$watch.ElapsedMilliseconds} }
    $results.Add($r); $r | ConvertTo-Json -Compress -Depth 6 | Write-Output
    [IO.File]::WriteAllText((Join-Path $OutRoot 'results.json'),($results | ConvertTo-Json -Depth 8),$utf8)
}
function Target([string]$Name) {
    $t=Join-Path $TempRoot $Name
    Put (Join-Path $t 'Jack-o-nine-tails.exe') 'NOT EXECUTABLE: QA marker only'
    Put (Join-Path $t 'game/jack.qsp') 'OLD QSP'
    Put (Join-Path $t 'game/json/obsolete.json') '{"old":true}'
    Put (Join-Path $t 'game/json/nested/obsolete.json') '{"oldNested":true}'
    Put (Join-Path $t 'game/json/save_config.json') '{"userConfig":"retain"}'
    Put (Join-Path $t 'saves/player.sav') 'USER SAVE ROOT'
    Put (Join-Path $t 'game/saves/player.sav') 'USER SAVE GAME'
    Put (Join-Path $t 'game/player.ini') 'USER INI'
    Put (Join-Path $t 'game/player.xml') 'USER XML'
    Put (Join-Path $t 'config.ini') 'ROOT INI'
    Put (Join-Path $t 'config.xml') 'ROOT XML'
    Put (Join-Path $t 'game/content/pic/unrelated.png') 'OLD UNRELATED IMAGE'
    return $t
}
$z=[IO.Compression.ZipFile]::OpenRead($ZipPath)
try {
    $shipped=@{}
    foreach($name in @('INSTALL.cmd','INSTALL_HELPER.ps1','PATCH_MANIFEST.json')) {
        $stream=$z.GetEntry($name).Open(); $reader=New-Object IO.StreamReader($stream,[Text.Encoding]::UTF8)
        $shipped[$name]=$reader.ReadToEnd();$reader.Dispose()
    }
} finally {$z.Dispose()}
$zipBefore=FileDigest $ZipPath
if($UseCandidateHelper){$shipped['INSTALL_HELPER.ps1']=[IO.File]::ReadAllText((Join-Path $PSScriptRoot 'CANDIDATE_INSTALL_HELPER.ps1'),[Text.Encoding]::UTF8)}
$miniManifest= [ordered]@{schema=1;gameVersion='2.4.1';patchRevision='independent-mini-fixture';jsonMode='replace-complete';files=@()}
$miniFiles=[ordered]@{'game/jack.qsp'='NEW QSP';'game/json/current.json'='{"new":true}';'game/json/nested/current.json'='{"nested":true}';'game/content/pic/new.png'='NEW IMAGE'}
function Mini([string]$Name) {
    $patch=Join-Path $TempRoot $Name
    $m=[ordered]@{schema=1;gameVersion='2.4.1';patchRevision='independent-mini-fixture';jsonMode='replace-complete';files=@()}
    foreach($key in $miniFiles.Keys){
        $file=Join-Path $patch $key; Put $file $miniFiles[$key]
        $kind=if($key.EndsWith('.qsp')){'qsp'}elseif($key.EndsWith('.json')){'json'}else{'image'}
        $m.files += [ordered]@{path=$key;bytes=(Get-Item -LiteralPath $file).Length;sha256=(FileDigest $file);kind=$kind}
    }
    Put (Join-Path $patch 'PATCH_MANIFEST.json') ($m|ConvertTo-Json -Depth 6)
    $manifestHash=FileDigest (Join-Path $patch 'PATCH_MANIFEST.json')
    $helper=$shipped['INSTALL_HELPER.ps1'].Replace('d1155fab23c41efc2f078956179674f5a375b94b872f61cf4bff4d0f52776382',$manifestHash)
    [IO.File]::WriteAllText((Join-Path $patch 'INSTALL_HELPER.ps1'),$helper,$utf8bom)
    Put (Join-Path $patch 'INSTALL.cmd') $shipped['INSTALL.cmd']
    return $patch
}
function Assert-Installed([string]$T,$Before,[int]$JsonCount) {
    Check (-not(Test-Path -LiteralPath (Join-Path $T 'game/json/obsolete.json'))) 'Obsolete JSON remains'
    Check (-not(Test-Path -LiteralPath (Join-Path $T 'game/json/nested/obsolete.json'))) 'Obsolete nested JSON remains'
    Check (@(Get-ChildItem -LiteralPath (Join-Path $T 'game/json') -Recurse -File).Count -eq ($JsonCount+1)) 'JSON count differs from payload plus save_config'
    foreach($rel in @('/saves/player.sav','/game/saves/player.sav','/game/player.ini','/game/player.xml','/config.ini','/config.xml','/Jack-o-nine-tails.exe','/game/content/pic/unrelated.png','/game/json/save_config.json')) {
        Check ((FileDigest (Join-Path $T $rel.TrimStart('/'))) -eq $Before[$rel]) ('Protected content changed: '+$rel)
    }
    Check (@(Get-ChildItem -LiteralPath (Join-Path $T 'game') -Force | Where-Object Name -match '\.__jo9_').Count -eq 0) 'Installer temporary folder remains'
}
$executionPolicyBefore = & $winps -NoProfile -Command 'Get-ExecutionPolicy -List | ConvertTo-Json -Compress'
Record 'IQ01' 'Mini happy path: Korean spaces and shell punctuation' {
    $p=Mini 'patch 한글 & (괄호) !JO9_QA_MARK!';$t=Target '게임 한글 공백 & (경로) !JO9_QA_MARK!';$b=Snapshot $t
    $r=Run-Helper $p $t 'IQ01';Check ($r.code -eq 0 -and $r.stdout.Contains('JO9_INSTALL_OK')) 'Install failed'
    Assert-Installed $t $b 2
    foreach($key in $miniFiles.Keys){Check ((FileDigest (Join-Path $t $key)) -eq (FileDigest (Join-Path $p $key))) ('Payload mismatch '+$key)}
    'Exact helper logic; only manifest SHA constant substituted for four-file mini fixture; protected files preserved.'
}
Record 'IQ02' 'Repeat same mini install' {
    $p=Join-Path $TempRoot 'patch 한글 & (괄호) !JO9_QA_MARK!';$t=Join-Path $TempRoot '게임 한글 공백 & (경로) !JO9_QA_MARK!';$b=Snapshot $t
    $r=Run-Helper $p $t 'IQ02';Check ($r.code -eq 0) 'Repeat failed'; Check (Same $b (Snapshot $t)) 'Repeat changed target bytes'
    'Second install exit 0; all target file hashes unchanged.'
}
Record 'IQ03' 'Corrupt source rejected before target mutation' {
    $p=Mini 'payload-corrupt';$t=Target 'target-corrupt';$b=Snapshot $t; Put (Join-Path $p 'game/content/pic/new.png') 'CORRUPT'
    $r=Run-Helper $p $t 'IQ03';Check ($r.code -eq 1 -and $r.stdout.Contains('game/content/pic/new.png')) 'Missing corruption rejection';Check (Same $b (Snapshot $t)) 'Corruption failure changed target'
    'Exit 1 names corrupt relative path; entire target byte map unchanged.'
}
Record 'IQ04' 'Missing payload rejected before target mutation' {
    $p=Mini 'payload-missing';$t=Target 'target-missing';$b=Snapshot $t;Remove-Item -LiteralPath (Join-Path $p 'game/json/current.json')
    $r=Run-Helper $p $t 'IQ04';Check ($r.code -eq 1 -and $r.stdout.Contains('game/json/current.json')) 'Missing path not reported';Check (Same $b (Snapshot $t)) 'Missing source failure changed target'
    'Exit 1 names missing relative path; entire target byte map unchanged.'
}
Record 'IQ05' 'Locked destination rejected at preflight' {
    $p=Mini 'payload-lock';$t=Target 'target-lock';Put (Join-Path $t 'game/content/pic/new.png') 'OLD IMAGE';$b=Snapshot $t
    $lock=[IO.File]::Open((Join-Path $t 'game/content/pic/new.png'),[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::None)
    try{$r=Run-Helper $p $t 'IQ05'}finally{$lock.Dispose()}
    Check ($r.code -eq 1) 'Locked destination accepted';Check (Same $b (Snapshot $t)) 'Locked destination failure changed target'
    'Exit 1; exclusive lock does not mutate target.'
}
Record 'IQ06' 'Permission failure after QSP copy restores runtime and old JSON' {
    $p=Mini 'payload-write-denied';$t=Target 'target-write-denied';$b=Snapshot $t
    $dir=Join-Path $t 'game/content/pic';$acl=Get-Acl -LiteralPath $dir;$sid=[Security.Principal.WindowsIdentity]::GetCurrent().User
    $deny=New-Object Security.AccessControl.FileSystemAccessRule($sid,[Security.AccessControl.FileSystemRights]::CreateFiles,[Security.AccessControl.AccessControlType]::Deny)
    $modified=Get-Acl -LiteralPath $dir;$modified.AddAccessRule($deny);Set-Acl -LiteralPath $dir -AclObject $modified
    try{$r=Run-Helper $p $t 'IQ06'}finally{Set-Acl -LiteralPath $dir -AclObject $acl}
    Check ($r.code -eq 1) 'Write denial did not fail';Check ($r.stdout.Contains('JSON')) 'Did not reach validated staging branch';Check (Same $b (Snapshot $t)) 'Permission rollback changed file bytes'
    Check (@(Get-ChildItem -LiteralPath (Join-Path $t 'game') -Force | Where-Object Name -match '\.__jo9_').Count -eq 0) 'Rollback artifacts remain'
    'Deny CreateFiles on image directory; QSP restored to OLD QSP, JSON unchanged, stage/rollback removed.'
}
Record 'IQ07' 'Old JSON rename failure restores copied runtime' {
    $p=Mini 'payload-json-denied';$t=Target 'target-json-denied-v3';$b=Snapshot $t
    $dir=Join-Path $t 'game/json';$acl=Get-Acl -LiteralPath $dir;$sid=[Security.Principal.WindowsIdentity]::GetCurrent().User
    $deny=New-Object Security.AccessControl.FileSystemAccessRule($sid,[Security.AccessControl.FileSystemRights]::Delete,[Security.AccessControl.AccessControlType]::Deny)
    $modified=Get-Acl -LiteralPath $dir;$modified.AddAccessRule($deny);Set-Acl -LiteralPath $dir -AclObject $modified
    $parent=Join-Path $t 'game';$parentAcl=Get-Acl -LiteralPath $parent;$modifiedParent=Get-Acl -LiteralPath $parent
    $parentDeny=New-Object Security.AccessControl.FileSystemAccessRule($sid,[Security.AccessControl.FileSystemRights]::DeleteSubdirectoriesAndFiles,[Security.AccessControl.AccessControlType]::Deny)
    $modifiedParent.AddAccessRule($parentDeny);Set-Acl -LiteralPath $parent -AclObject $modifiedParent
    try{$r=Run-Helper $p $t 'IQ07'}finally{Set-Acl -LiteralPath $dir -AclObject $acl;Set-Acl -LiteralPath $parent -AclObject $parentAcl}
    $after=Snapshot $t
    [IO.File]::WriteAllText((Join-Path $OutRoot 'IQ07-before-after.json'),(@{before=$b;after=$after}|ConvertTo-Json -Depth 6),$utf8)
    Check ($r.code -eq 1) 'JSON rename denial did not fail';Check (Same $b (Snapshot $t)) 'JSON-switch rollback changed bytes'
    Check (@(Get-ChildItem -LiteralPath (Join-Path $t 'game') -Force | Where-Object Name -match '\.__jo9_').Count -eq 0) 'Rollback artifacts remain'
    'Deny Delete on old json and DeleteSubdirectoriesAndFiles on parent game; old QSP/JSON restored and new runtime image removed.'
}
Record 'IQ08' 'CMD in-place install with spaces & parentheses and exclamation, delayed expansion OFF' {
    $t=Target 'cmd 한글 & (괄호) !JO9_QA_MARK!';$p=Mini 'cmd-staging-off'
    Get-ChildItem -LiteralPath $p -Force | Copy-Item -Destination $t -Recurse -Force
    $b=Snapshot $t;$args='/d /v:off /s /c INSTALL.cmd'
    $r=Run-Child $env:ComSpec $args 'IQ08' $t;Check ($r.code -eq 0 -and $r.stdout.Contains('JO9_INSTALL_OK')) 'CMD wrapper failed'
    Assert-Installed $t $b 2
    'Exact shipped CMD; in-place mini helper installs via parent/script-root autodetection, stdin closed without key automation.'
}
Record 'IQ09' 'CMD in-place install with exclamation, delayed expansion ON' {
    $t=Target 'cmd on 한글 & (괄호) !JO9_QA_MARK!';$p=Mini 'cmd-staging-on'
    Get-ChildItem -LiteralPath $p -Force | Copy-Item -Destination $t -Recurse -Force
    $b=Snapshot $t;$args='/d /v:on /s /c INSTALL.cmd'
    $r=Run-Child $env:ComSpec $args 'IQ09' $t;Check ($r.code -eq 0 -and $r.stdout.Contains('JO9_INSTALL_OK')) ('CMD /V:ON failed exit='+$r.code+'; unchanged='+(Same $b (Snapshot $t)))
    Assert-Installed $t $b 2
    'Inherited delayed expansion handled.'
}
Record 'IQ10' 'Missing helper/manifest CMD extraction guidance' {
    $p=Join-Path $TempRoot 'incomplete extracted patch';Put (Join-Path $p 'INSTALL.cmd') $shipped['INSTALL.cmd']
    $r=Run-Child $env:ComSpec ('/d /v:off /s /c ""'+(Join-Path $p 'INSTALL.cmd')+'""') 'IQ10'
    Check ($r.code -eq 1) 'Missing helper unexpectedly accepted';Check ($r.stdout.Contains('ZIP') -and $r.stdout.Contains('풀어')) 'Extraction guidance absent'
    'Exit 1; full extraction guidance printed; stdin closed.'
}
Record 'IQ11' 'No NonInteractive target rejection' {
    $p=Mini 'no-target-patch';$r=Run-Helper $p '' 'IQ11';Check ($r.code -eq 1) 'Missing target accepted';Check (-not $r.stdout.Contains('JO9_INSTALL_OK')) 'Unexpected install success'
    'Exit 1; no folder picker invoked under NonInteractive.'
}
Record 'IQ12' 'Unmodified shipped helper and actual full payload' {
    $p=Join-Path $TempRoot 'actual-full-payload';[IO.Compression.ZipFile]::ExtractToDirectory($ZipPath,$p)
    $helperBefore=FileDigest (Join-Path $p 'INSTALL_HELPER.ps1');$t=Target 'actual full target 한글 & (설치) !';$b=Snapshot $t
    $r=Run-Helper $p $t 'IQ12';Check ($r.code -eq 0 -and $r.stdout.Contains('JO9_INSTALL_OK')) 'Full payload installation failed'
    Assert-Installed $t $b 1158
    $manifest=[IO.File]::ReadAllText((Join-Path $p 'PATCH_MANIFEST.json'),[Text.Encoding]::UTF8)|ConvertFrom-Json
    foreach($f in $manifest.files){Check ((FileDigest (Join-Path $t $f.path)) -eq $f.sha256) ('Full target payload hash mismatch '+$f.path)}
    Check ((FileDigest (Join-Path $p 'INSTALL_HELPER.ps1')) -eq $helperBefore) 'Shipped helper changed'
    '1966 manifest payload files installed and hash verified; 1158 JSON + preserved save_config; obsolete JSON removed; saves/INI/XML preserved.'
}
Record 'IQ13' 'ExecutionPolicy scope remains unchanged' {
    $after=& $winps -NoProfile -Command 'Get-ExecutionPolicy -List | ConvertTo-Json -Compress'
    Check (($executionPolicyBefore -join "`n") -eq ($after -join "`n")) 'Persistent ExecutionPolicy list changed'
    [IO.File]::WriteAllText((Join-Path $OutRoot 'execution-policy-before-after.json'),(@{before=$executionPolicyBefore;after=$after}|ConvertTo-Json -Depth 5),$utf8)
    'Fresh child Get-ExecutionPolicy -List before/after identical; helper has no Set-ExecutionPolicy.'
}
Record 'IQ14' 'Original ZIP hash remains unchanged' {Check ((FileDigest $ZipPath) -eq $zipBefore) 'Original ZIP changed';$zipBefore}
Record 'IQ15' 'CMD delayed expansion ON control without exclamation' {
    $t=Target 'cmd on control 한글 & (괄호)';$p=Mini 'cmd-staging-control'
    Get-ChildItem -LiteralPath $p -Force | Copy-Item -Destination $t -Recurse -Force
    $b=Snapshot $t;$r=Run-Child $env:ComSpec '/d /v:on /s /c INSTALL.cmd' 'IQ15' $t
    Check ($r.code -eq 0 -and $r.stdout.Contains('JO9_INSTALL_OK')) 'Delayed expansion control failed';Assert-Installed $t $b 2
    'Control passes under /V:ON without ! in script-root path; same shipped CMD and mini payload logic.'
}
Record 'IQ16' 'Unreadable source file rejects before writes' {
    $p=Mini 'payload-read-denied';$t=Target 'target-read-denied';$b=Snapshot $t
    $file=Join-Path $p 'game/content/pic/new.png';$acl=Get-Acl -LiteralPath $file;$sid=[Security.Principal.WindowsIdentity]::GetCurrent().User
    $deny=New-Object Security.AccessControl.FileSystemAccessRule($sid,[Security.AccessControl.FileSystemRights]::ReadData,[Security.AccessControl.AccessControlType]::Deny)
    $modified=Get-Acl -LiteralPath $file;$modified.AddAccessRule($deny);Set-Acl -LiteralPath $file -AclObject $modified
    try{$r=Run-Helper $p $t 'IQ16'}finally{Set-Acl -LiteralPath $file -AclObject $acl}
    Check ($r.code -eq 1) 'Read denial unexpectedly accepted';Check (Same $b (Snapshot $t)) 'Read denial changed target'
    'Deny ReadData on source PNG; exit 1 and target byte map unchanged.'
}
Record 'IQ17' 'Unreadable player config fails staging without mutation' {
    $p=Mini 'payload-config-denied';$t=Target 'target-config-denied';$b=Snapshot $t
    $file=Join-Path $t 'game/json/save_config.json';$acl=Get-Acl -LiteralPath $file;$sid=[Security.Principal.WindowsIdentity]::GetCurrent().User
    $deny=New-Object Security.AccessControl.FileSystemAccessRule($sid,[Security.AccessControl.FileSystemRights]::ReadData,[Security.AccessControl.AccessControlType]::Deny)
    $modified=Get-Acl -LiteralPath $file;$modified.AddAccessRule($deny);Set-Acl -LiteralPath $file -AclObject $modified
    try{$r=Run-Helper $p $t 'IQ17'}finally{Set-Acl -LiteralPath $file -AclObject $acl}
    Check ($r.code -eq 1) 'Config read denial unexpectedly accepted';Check (Same $b (Snapshot $t)) 'Config read denial changed target'
    Check (@(Get-ChildItem -LiteralPath (Join-Path $t 'game') -Force | Where-Object Name -match '\.__jo9_').Count -eq 0) 'JSON stage remains after config error'
    'Deny ReadData on save_config; stage cleaned and entire old target preserved.'
}
Record 'IQ18' 'Candidate CMD with delayed expansion ON and special characters' {
    $t=Target 'candidate on 한글 & (괄호) !JO9_QA_MARK!';$p=Mini 'candidate-on-staging'
    Get-ChildItem -LiteralPath $p -Force | Copy-Item -Destination $t -Recurse -Force
    $candidate=$shipped['INSTALL.cmd'].Replace("setlocal`r", "setlocal EnableExtensions DisableDelayedExpansion`r")
    Put (Join-Path $t 'INSTALL.cmd') $candidate
    $b=Snapshot $t;$r=Run-Child $env:ComSpec '/d /v:on /s /c INSTALL.cmd' 'IQ18' $t
    Check ($r.code -eq 0 -and $r.stdout.Contains('JO9_INSTALL_OK')) 'Candidate /V:ON failed';Assert-Installed $t $b 2
    'Candidate CMD only changes setlocal to setlocal EnableExtensions DisableDelayedExpansion; /V:ON and special script-root pass.'
}
Record 'IQ19' 'Candidate CMD with delayed expansion OFF and special characters' {
    $t=Target 'candidate off 한글 & (괄호) !JO9_QA_MARK!';$p=Mini 'candidate-off-staging'
    Get-ChildItem -LiteralPath $p -Force | Copy-Item -Destination $t -Recurse -Force
    $candidate=$shipped['INSTALL.cmd'].Replace("setlocal`r", "setlocal EnableExtensions DisableDelayedExpansion`r")
    Put (Join-Path $t 'INSTALL.cmd') $candidate
    $b=Snapshot $t;$r=Run-Child $env:ComSpec '/d /v:off /s /c INSTALL.cmd' 'IQ19' $t
    Check ($r.code -eq 0 -and $r.stdout.Contains('JO9_INSTALL_OK')) 'Candidate /V:OFF failed';Assert-Installed $t $b 2
    'Same one-line candidate passes /V:OFF and special script-root.'
}
Record 'IQ20' 'Second independent JSON move ACL fixture restores old tree' {
    $p=Mini 'second-json-acl-payload';$t=Target 'second-json-acl-target';$b=Snapshot $t
    $dir=Join-Path $t 'game/json';$acl=Get-Acl -LiteralPath $dir;$sid=[Security.Principal.WindowsIdentity]::GetCurrent().User
    $deny=New-Object Security.AccessControl.FileSystemAccessRule($sid,[Security.AccessControl.FileSystemRights]::Delete,[Security.AccessControl.AccessControlType]::Deny)
    $modified=Get-Acl -LiteralPath $dir;$modified.AddAccessRule($deny);Set-Acl -LiteralPath $dir -AclObject $modified
    $parent=Join-Path $t 'game';$parentAcl=Get-Acl -LiteralPath $parent;$modifiedParent=Get-Acl -LiteralPath $parent
    $parentDeny=New-Object Security.AccessControl.FileSystemAccessRule($sid,[Security.AccessControl.FileSystemRights]::DeleteSubdirectoriesAndFiles,[Security.AccessControl.AccessControlType]::Deny)
    $modifiedParent.AddAccessRule($parentDeny);Set-Acl -LiteralPath $parent -AclObject $modifiedParent
    try{$r=Run-Helper $p $t 'IQ20'}finally{Set-Acl -LiteralPath $dir -AclObject $acl;Set-Acl -LiteralPath $parent -AclObject $parentAcl}
    $after=Snapshot $t;[IO.File]::WriteAllText((Join-Path $OutRoot 'IQ20-before-after.json'),(@{before=$b;after=$after}|ConvertTo-Json -Depth 6),$utf8)
    Check ($r.code -eq 1) 'JSON rename denial did not fail';Check (Same $b $after) 'Second JSON ACL rollback changed target bytes'
    Check (@(Get-ChildItem -LiteralPath (Join-Path $t 'game') -Force | Where-Object Name -match '\.__jo9_').Count -eq 0) 'Second ACL rollback artifacts remain'
    'Second distinct fixture; rename denied atomically, old JSON and runtime byte map unchanged, no temporary folders remain.'
}
Record 'IQ21' 'Candidate helper and actual full payload' {
    $p=Join-Path $TempRoot 'candidate-actual-full-payload';[IO.Compression.ZipFile]::ExtractToDirectory($ZipPath,$p)
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'CANDIDATE_INSTALL_HELPER.ps1') -Destination (Join-Path $p 'INSTALL_HELPER.ps1') -Force
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'candidate/INSTALL.cmd') -Destination (Join-Path $p 'INSTALL.cmd') -Force
    $helperBefore=FileDigest (Join-Path $p 'INSTALL_HELPER.ps1');$t=Target 'candidate full target 한글 & (설치) !';$b=Snapshot $t
    $r=Run-Helper $p $t 'IQ21';Check ($r.code -eq 0 -and $r.stdout.Contains('JO9_INSTALL_OK')) 'Candidate full payload installation failed'
    Assert-Installed $t $b 1158
    $manifest=[IO.File]::ReadAllText((Join-Path $p 'PATCH_MANIFEST.json'),[Text.Encoding]::UTF8)|ConvertFrom-Json
    foreach($f in $manifest.files){Check ((FileDigest (Join-Path $t $f.path)) -eq $f.sha256) ('Candidate full payload hash mismatch '+$f.path)}
    Check ((FileDigest (Join-Path $p 'INSTALL_HELPER.ps1')) -eq $helperBefore) 'Candidate helper changed'
    'Actual frozen 1966-file payload with four-line helper candidate; all installed hashes verified, JSON replaced, save_config/sav/INI/XML preserved.'
}
$summary=[pscustomobject]@{tests=$results.Count;passed=@($results|Where-Object result -eq 'PASS').Count;failed=@($results|Where-Object result -eq 'FAIL').Count;zipSHA256=$zipBefore;tempRoot=$TempRoot;scope='Game EXE and nativejack.exe never launched. Mini fixtures substitute only the helper manifest SHA constant; IQ12 uses exact shipped helper and payload.'}
[IO.File]::WriteAllText((Join-Path $OutRoot 'summary.json'),($summary|ConvertTo-Json -Depth 5),$utf8)
$summary|ConvertTo-Json -Compress
