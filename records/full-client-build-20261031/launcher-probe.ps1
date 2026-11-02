$ErrorActionPreference='Stop'
$fullRoot='G:/somi/Jack O Nine Tails v2.4 Kor_Full'
$probeRoot='G:/Codex/tmp/full-client-launcher-20261031'
New-Item -ItemType Directory -Path $probeRoot -Force | Out-Null
$enginePath=[IO.Path]::GetFullPath((Join-Path $fullRoot 'game/engine/jack.exe'))
$launcherPath=[IO.Path]::GetFullPath((Join-Path $fullRoot 'Jack-o-nine-tails.exe'))
$results=@()
foreach ($cwd in @($fullRoot,$probeRoot)) {
 $before=@(Get-CimInstance Win32_Process -Filter "Name='jack.exe'" | Select-Object -ExpandProperty ProcessId)
 $parent=$null;$owned=@();$result=[ordered]@{cwd=$cwd;launcher=$launcherPath;pass=$false;child=$null}
 try {
  $parent=Start-Process -FilePath $launcherPath -WorkingDirectory $cwd -WindowStyle Hidden -PassThru
  $deadline=(Get-Date).AddSeconds(25)
  do {
   $owned=@(Get-CimInstance Win32_Process -Filter "Name='jack.exe'" | Where-Object { $_.ProcessId -notin $before -and $_.ExecutablePath -ieq $enginePath -and $_.ParentProcessId -eq $parent.Id })
   if ($owned.Count) {break}
   Start-Sleep -Milliseconds 300
  } while ((Get-Date) -lt $deadline)
  if ($owned.Count -ne 1) {throw 'Expected one Full-owned game engine child'}
  $child=$owned[0]
  $result.child=[ordered]@{pid=$child.ProcessId;parentPid=$child.ParentProcessId;executable=$child.ExecutablePath;commandLine=$child.CommandLine}
  if ($child.CommandLine -notmatch '(?:Kor_Full[\\/]game[\\/]jack.qsp|jack\.qsp)') {throw 'Engine child did not receive QSP argument'}
  $titleDeadline=(Get-Date).AddSeconds(15)
  do {$native=Get-Process -Id $child.ProcessId -ErrorAction Stop;if($native.MainWindowTitle -like 'Jack-o-nine-tails*'){break};Start-Sleep -Milliseconds 300} while((Get-Date) -lt $titleDeadline)
  $result.child=[ordered]@{pid=$child.ProcessId;parentPid=$child.ParentProcessId;executable=$child.ExecutablePath;commandLine=$child.CommandLine;responding=$native.Responding;windowTitle=$native.MainWindowTitle}
  if (!$native.Responding -or $native.MainWindowTitle -notlike 'Jack-o-nine-tails*') {throw 'Engine did not reach the game window title'}
  $result.pass=$true
 } catch {$result.error=$_.Exception.Message}
 finally {
  foreach ($child in $owned) {
   $still=Get-CimInstance Win32_Process -Filter ('ProcessId='+$child.ProcessId) -ErrorAction SilentlyContinue
   if ($still -and $still.ExecutablePath -ieq $enginePath -and $parent -and $still.ParentProcessId -eq $parent.Id) {Stop-Process -Id $still.ProcessId -Force -ErrorAction SilentlyContinue}
  }
  if ($parent) {Stop-Process -Id $parent.Id -Force -ErrorAction SilentlyContinue}
 }
 $results+=[pscustomobject]$result
}
$results | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath 'G:/somi/JO9sa/records/full-client-build-20261031/launcher-verification.json' -Encoding utf8
$results | ConvertTo-Json -Depth 6
if (@($results | Where-Object {!$_.pass}).Count) {exit 1}
