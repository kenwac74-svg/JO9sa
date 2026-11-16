param([ValidateSet('workshop','imageReview')][string]$ToolKey,[string]$GameDir,[string]$CatalogDir,[string]$PythonPath)
$ErrorActionPreference='Stop'
if ($ToolKey -eq 'imageReview') {
 $launcher=Join-Path $PSScriptRoot '..\image-folder-review\Start-Image-Folder-Review.ps1'
 & $launcher -DataDir (Join-Path $CatalogDir 'folder-review') -PythonPath $PythonPath -NoOpen
 exit $LASTEXITCODE
}
$root=Join-Path ([IO.Path]::GetFullPath($GameDir)) 'modtools'
$scriptFile=Join-Path $root 'JO9_Server.ps1'
$runtime=Join-Path $root 'runtime'
if (!(Test-Path -LiteralPath $scriptFile -PathType Leaf)) {throw '이미지 작업실 실행 파일이 없습니다. 모드툴 실행기로 한 번 열어 주세요.'}
New-Item -ItemType Directory -Path $runtime -Force | Out-Null
$lockPath=Join-Path $runtime 'hub-launch.lock'
$lock=$null;$deadline=(Get-Date).AddSeconds(15)
while (!$lock -and (Get-Date) -lt $deadline) {try {$lock=[IO.File]::Open($lockPath,[IO.FileMode]::OpenOrCreate,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None)} catch [IO.IOException] {Start-Sleep -Milliseconds 100}}
if (!$lock) {throw '이미지 작업실이 이미 시작 중입니다. 잠시 후 다시 열어 주세요.'}
try {
 $portFile=Join-Path $runtime 'port.txt';$pidFile=Join-Path $runtime 'server.pid'
 $owned=@(Get-CimInstance Win32_Process -Filter "Name='powershell.exe' OR Name='pwsh.exe'" | Where-Object {
  $tokens=@([regex]::Matches([string]$_.CommandLine,'"([^"]*)"|(\S+)') | ForEach-Object {if ($_.Groups[1].Success) {$_.Groups[1].Value} else {$_.Groups[2].Value}})
  $fileAt=-1
  for ($i=1;$i -lt $tokens.Count;$i++) {if ($tokens[$i] -ieq '-File') {$fileAt=$i;break}}
  if ($fileAt -lt 0 -or $fileAt+1 -ge $tokens.Count) {return $false}
  for ($i=1;$i -lt $fileAt;$i++) {if ($tokens[$i] -match '^[-/](?:c|command|encodedcommand|ec)$') {return $false}}
  try {return [IO.Path]::GetFullPath($tokens[$fileAt+1]).Replace('/','\') -ieq $scriptFile.Replace('/','\')} catch {return $false}
 })
 if ($owned.Count) {
  if (!(Test-Path -LiteralPath $pidFile) -or !(Test-Path -LiteralPath $portFile)) {throw '이미지 작업실이 시작 중입니다. 중복 실행하지 않았습니다.'}
  $recordedPid=[int](Get-Content -LiteralPath $pidFile -Raw);$recordedPort=[int](Get-Content -LiteralPath $portFile -Raw)
  if (@($owned | Where-Object {$_.ProcessId -eq $recordedPid}).Count -ne 1) {throw '이미지 작업실 실행 기록이 일치하지 않습니다. 중복 실행하지 않았습니다.'}
  $url='http://127.0.0.1:'+$recordedPort+'/'
  $status=Invoke-RestMethod ($url+'api/status') -TimeoutSec 2
  if (!$status.alive -or [int]$status.pid -ne $recordedPid -or [int]$status.port -ne $recordedPort) {throw '이미지 작업실 상태가 일치하지 않습니다.'}
  @{app='image-workshop';url=$url;pid=$recordedPid} | ConvertTo-Json -Compress
  exit 0
 }
 $child=Start-Process powershell.exe -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File "'+$scriptFile+'" -Port 0') -WindowStyle Hidden -PassThru
 for ($attempt=0;$attempt -lt 100;$attempt++) {
  if ((Test-Path -LiteralPath $pidFile) -and (Test-Path -LiteralPath $portFile)) {
   $recordedPid=[int](Get-Content -LiteralPath $pidFile -Raw);$recordedPort=[int](Get-Content -LiteralPath $portFile -Raw)
   if ($recordedPid -eq $child.Id) {
    $url='http://127.0.0.1:'+$recordedPort+'/'
    try {$status=Invoke-RestMethod ($url+'api/status') -TimeoutSec 1} catch {$status=$null}
    if ($status.alive -and [int]$status.pid -eq $child.Id -and [int]$status.port -eq $recordedPort) {@{app='image-workshop';url=$url;pid=$child.Id} | ConvertTo-Json -Compress;exit 0}
   }
  }
  $child.Refresh();if ($child.HasExited) {throw '이미지 작업실이 준비되기 전에 종료되었습니다.'}
  Start-Sleep -Milliseconds 100
 }
 throw '이미지 작업실 시작 시간이 초과되었습니다.'
} finally {$lock.Dispose()}
