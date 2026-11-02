$ErrorActionPreference='Stop'
$root='G:/somi/Jack O Nine Tails v2.4 Kor_Full'
$cwd='G:/Codex/tmp/full-prezip-20261101-launcher'
$engine=[IO.Path]::GetFullPath((Join-Path $root 'game/engine/jack.exe'))
$entry=[IO.Path]::GetFullPath((Join-Path $root '게임 실행.cmd'))
$before=@(Get-CimInstance Win32_Process -Filter "Name='jack.exe'" | Select-Object -ExpandProperty ProcessId)
$parent=$null;$owned=@();$result=[ordered]@{entry=$entry;cwd=$cwd;pass=$false}
try {
 $parent=Start-Process -FilePath $env:ComSpec -ArgumentList ('/d /c ""'+$entry+'""') -WorkingDirectory $cwd -WindowStyle Hidden -PassThru
 $deadline=(Get-Date).AddSeconds(25)
 do {
  $owned=@(Get-CimInstance Win32_Process -Filter "Name='jack.exe'" | Where-Object {$_.ProcessId -notin $before -and $_.ExecutablePath -ieq $engine -and $_.ParentProcessId -eq $parent.Id})
  if ($owned.Count) {break};Start-Sleep -Milliseconds 250
 } while((Get-Date) -lt $deadline)
 if ($owned.Count -ne 1) {throw 'One owned Full engine required'}
 $child=$owned[0]
 $deadline=(Get-Date).AddSeconds(20)
 do {$native=Get-Process -Id $child.ProcessId -ErrorAction Stop;if($native.MainWindowTitle -like 'Jack-o-nine-tails*'){break};Start-Sleep -Milliseconds 300}while((Get-Date) -lt $deadline)
 $result.child=[ordered]@{pid=$child.ProcessId;parentPid=$child.ParentProcessId;executable=$child.ExecutablePath;commandLine=$child.CommandLine;windowTitle=$native.MainWindowTitle;responding=$native.Responding}
 if ($child.CommandLine -notmatch 'Kor_Full[\\/]game[\\/]jack.qsp' -or $native.MainWindowTitle -notlike 'Jack-o-nine-tails*' -or !$native.Responding) {throw 'Full game not loaded'}
 $result.pass=$true
} catch {$result.error=$_.Exception.Message}
finally {
 foreach ($child in $owned) {$still=Get-CimInstance Win32_Process -Filter ('ProcessId='+$child.ProcessId) -ErrorAction SilentlyContinue;if($still -and $still.ExecutablePath -ieq $engine -and $parent -and $still.ParentProcessId -eq $parent.Id){Stop-Process -Id $still.ProcessId -Force -ErrorAction SilentlyContinue}}
 if($parent){Stop-Process -Id $parent.Id -Force -ErrorAction SilentlyContinue}
}
$result | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath 'C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/output/full-prezip-20261101/portable-launcher-verification.json' -Encoding utf8
$result | ConvertTo-Json -Depth 6
if(!$result.pass){exit 1}
