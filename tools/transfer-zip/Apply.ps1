# 사용자가 선택한 플레이 폴더에 작업 ZIP을 적용한다. 실행 파일 교체와 백업은 하지 않는다.
param([string]$GameDir='', [string]$OriginalDir='', [string]$ToolsDir='', [switch]$VerifyOnly)
$ErrorActionPreference='Stop'
Set-StrictMode -Version 2
$root=$PSScriptRoot
$manifest=Get-Content -LiteralPath (Join-Path $root 'MANIFEST.json') -Raw -Encoding UTF8 | ConvertFrom-Json
function Select-GameFolder([string]$label) {
 Add-Type -AssemblyName System.Windows.Forms
 $dialog=New-Object System.Windows.Forms.FolderBrowserDialog
 $dialog.Description=$label
 if($dialog.ShowDialog() -ne 'OK'){throw '폴더 선택을 취소했습니다.'}
 $result=$dialog.SelectedPath;$dialog.Dispose();return $result
}
function Game-Folder([string]$folder) {
 $resolved=(Resolve-Path -LiteralPath $folder).Path.TrimEnd('\')
 if(!(Test-Path -LiteralPath (Join-Path $resolved 'jack.qsp')) -and (Test-Path -LiteralPath (Join-Path $resolved 'game\jack.qsp'))){$resolved=Join-Path $resolved 'game'}
 if(!(Test-Path -LiteralPath (Join-Path $resolved 'jack.qsp')) -or !(Test-Path -LiteralPath (Join-Path $resolved 'content\pic'))){throw 'jack.qsp와 content\pic이 있는 game 폴더를 선택하세요.'}
 return $resolved
}
function Safe-Path([string]$base,[string]$rel) {
 if($rel -match '(^[\/]|:|(^|[\/])\.\.?([\/]|$))'){throw ('잘못된 상대 경로: '+$rel)}
 $baseFull=[IO.Path]::GetFullPath($base).TrimEnd('\')
 $full=[IO.Path]::GetFullPath((Join-Path $baseFull $rel.Replace('/','\')))
 if(!$full.StartsWith($baseFull+'\',[StringComparison]::OrdinalIgnoreCase)){throw '대상 폴더 밖의 경로입니다.'}
 # 기존 junction을 통해 다른 폴더로 쓰는 것을 막는다.
 $cursor=Split-Path -Parent $full
 while($cursor -and $cursor.StartsWith($baseFull,[StringComparison]::OrdinalIgnoreCase)){
  if((Test-Path -LiteralPath $cursor) -and ((Get-Item -LiteralPath $cursor -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw ('대상 경로의 연결 폴더를 확인하세요: '+$cursor)}
  if($cursor -eq $baseFull){break};$cursor=Split-Path -Parent $cursor
 }
 return $full
}
function Same-Hash([string]$file,[string]$expected) {
 if(!(Test-Path -LiteralPath $file -PathType Leaf)){return $false}
 $stream=[IO.File]::OpenRead($file);$hasher=[Security.Cryptography.SHA256]::Create()
 try{$value=[BitConverter]::ToString($hasher.ComputeHash($stream)).Replace('-','').ToLowerInvariant();return $value -eq $expected}
 finally{$stream.Dispose();$hasher.Dispose()}
}
if(!$GameDir){$GameDir=Select-GameFolder '작업을 적용할 플레이 게임 폴더'}
if(!$OriginalDir){$OriginalDir=Select-GameFolder '원본 B컷을 연결할 순정 비교 게임 폴더 (수정하지 않음)'}
$GameDir=Game-Folder $GameDir;$OriginalDir=Game-Folder $OriginalDir
if($GameDir -eq $OriginalDir -or $GameDir.StartsWith($OriginalDir+'\',[StringComparison]::OrdinalIgnoreCase) -or $OriginalDir.StartsWith($GameDir+'\',[StringComparison]::OrdinalIgnoreCase)){throw '플레이와 순정 폴더는 서로 분리해야 합니다.'}
if(!$ToolsDir){$ToolsDir=Join-Path (Split-Path -Parent $GameDir) 'JO9-작업도구'}
$ToolsDir=[IO.Path]::GetFullPath($ToolsDir).TrimEnd('\')
if($ToolsDir -eq $root -or $ToolsDir.StartsWith($root+'\',[StringComparison]::OrdinalIgnoreCase) -or $root.StartsWith($ToolsDir+'\',[StringComparison]::OrdinalIgnoreCase)){throw '도구 설치 위치는 압축 해제 폴더와 분리하세요.'}
if($ToolsDir -eq $GameDir -or $ToolsDir -eq $OriginalDir -or $ToolsDir.StartsWith($GameDir+'\',[StringComparison]::OrdinalIgnoreCase) -or $ToolsDir.StartsWith($OriginalDir+'\',[StringComparison]::OrdinalIgnoreCase) -or $OriginalDir.StartsWith($ToolsDir+'\',[StringComparison]::OrdinalIgnoreCase)){throw '도구 설치 위치는 게임과 순정 폴더 밖이어야 합니다.'}
$running=@()
try{$running=@(Get-CimInstance Win32_Process -ErrorAction Stop | Where-Object { ($_.Name -eq 'jack.exe' -and $_.ExecutablePath -and $_.ExecutablePath.StartsWith($GameDir+'\',[StringComparison]::OrdinalIgnoreCase)) -or ($_.Name -eq 'node.exe' -and $_.CommandLine -and $_.CommandLine.Contains($GameDir)) })}
catch{$running=@(Get-Process -Name jack -ErrorAction SilentlyContinue | Where-Object { $_.Path -and $_.Path.StartsWith($GameDir+'\',[StringComparison]::OrdinalIgnoreCase) })}
if($running.Count){throw '적용할 게임과 그 게임의 모딩 도구를 종료한 후 실행하세요.'}
# 쓰기 전에 모든 압축 해제 파일을 확인한다. 파일 목록 밖의 EXE/DLL은 취급하지 않는다.
foreach($file in $manifest.files){
 if($file.path -match '(?i)\.(exe|dll|msi|qsp\.bak)$'){throw '허용되지 않은 실행/백업 파일이 목록에 있습니다.'}
 $source=Safe-Path $root $file.path
 if(!(Same-Hash $source $file.sha256)){throw ('패치 파일 검사 실패: '+$file.path)}
}
$originalManifest=Get-Content -LiteralPath (Join-Path $root 'game\modtools\image-original-cuts.json') -Raw -Encoding UTF8 | ConvertFrom-Json
foreach($property in $originalManifest.originals.PSObject.Properties){
 $entry=$property.Value;$source=Safe-Path $OriginalDir $entry.source
 if(!(Same-Hash $source $entry.sourceSha)){throw ('순정 B컷 파일이 이 작업본과 다릅니다: '+$entry.source)}
 $physical=Safe-Path $GameDir ('content/pic/'+$entry.alias)
 if(Test-Path -LiteralPath $physical){throw ('원본 B컷 자리의 기존 파일을 확인하세요: '+$entry.alias)}
}
$link=Join-Path $GameDir 'content\jo9o_original_cuts'
$originalPic=Join-Path $OriginalDir 'content\pic'
if(Test-Path -LiteralPath $link){
 $item=Get-Item -LiteralPath $link -Force
 if(!($item.Attributes -band [IO.FileAttributes]::ReparsePoint)){throw '원본 B컷 연결 자리에 일반 폴더가 있습니다.'}
 $oldTarget=[string](@($item.Target)[0])
 if([IO.Path]::GetFullPath($oldTarget).TrimEnd('\') -ne [IO.Path]::GetFullPath($originalPic).TrimEnd('\')){throw '기존 원본 B컷 연결이 다른 순정 폴더를 가리킵니다.'}
}
foreach($file in $manifest.files){
 if($file.path.StartsWith('game/')){$null=Safe-Path $GameDir $file.path.Substring(5)}
 elseif($file.path.StartsWith('JO9-tools/')){$null=Safe-Path $ToolsDir $file.path.Substring(10)}
}
if($VerifyOnly){Write-Output ('검사 통과: '+$manifest.workImageCount+'개 작업 이미지, EXE 교체 없음, 쓰기 없음');exit 0}
foreach($file in $manifest.files){
 $destination=$null
 if($file.path.StartsWith('game/')){$destination=Safe-Path $GameDir $file.path.Substring(5)}
 elseif($file.path.StartsWith('JO9-tools/')){$destination=Safe-Path $ToolsDir $file.path.Substring(10)}
 if($destination){
  # 새 PC의 유효한 AI 키는 유지한다. ZIP에는 키가 제거된 설정만 있다.
  if($file.role -eq 'ai-settings' -and (Test-Path -LiteralPath $destination)){continue}
  New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
  Copy-Item -LiteralPath (Join-Path $root $file.path.Replace('/','\')) -Destination $destination -Force
  if(!(Same-Hash $destination $file.sha256)){throw ('복사 검증 실패: '+$file.path)}
 }
}
if(!(Test-Path -LiteralPath $link)){New-Item -ItemType Junction -Path $link -Target $originalPic | Out-Null}
$originalManifest.sourceRoot=$OriginalDir
$plainUtf8=New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText((Join-Path $GameDir 'modtools\image-original-cuts.json'),($originalManifest | ConvertTo-Json -Depth 30),$plainUtf8)
$localWorkspace=Join-Path $ToolsDir 'tools\local-workspace'
@{game=$GameDir;original=$OriginalDir} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $localWorkspace 'local.config.json') -Encoding UTF8
$tracking=Join-Path $localWorkspace 'catalog\image_work\personal-patch'
$settings=Get-Content -LiteralPath (Join-Path $tracking 'settings.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$settings.game=$GameDir;$settings.catalogRoot=Join-Path $localWorkspace 'catalog'
[IO.File]::WriteAllText((Join-Path $tracking 'settings.json'),($settings | ConvertTo-Json -Depth 10),$plainUtf8)
$objects=Join-Path $tracking 'objects';New-Item -ItemType Directory -Path $objects -Force | Out-Null
foreach($image in $manifest.workImages){
 $object=Join-Path $objects $image.sha256
 if(!(Test-Path -LiteralPath $object)){Copy-Item -LiteralPath (Safe-Path $GameDir ('content/pic/'+$image.path)) -Destination $object}
 if(!(Same-Hash $object $image.sha256)){throw '개인 작업 추적 파일 검사 실패'}
}
# 같은 도구를 게임의 기존 호출 경로에도 배치한다.
$installedEditor=Join-Path $GameDir 'modtools\text-workshop'
New-Item -ItemType Directory -Path $installedEditor -Force | Out-Null
Copy-Item -Path (Join-Path $ToolsDir 'tools\text-workshop\*') -Destination $installedEditor -Recurse -Force
Copy-Item -LiteralPath (Join-Path $ToolsDir 'tools\local-workspace\Open-Modding-Tools.cmd') -Destination (Join-Path (Split-Path -Parent $GameDir) '모딩 도구 열기.cmd') -Force
$entry=Join-Path (Split-Path -Parent $GameDir) '모딩 도구 열기.cmd'
$command='@echo off' + "`r`n" + '@chcp 65001 >nul' + "`r`n" + 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "'+(Join-Path $ToolsDir 'tools\local-workspace\Open-Modding-Tools.ps1')+'"' + "`r`n" + 'if errorlevel 1 pause' + "`r`n"
[IO.File]::WriteAllText($entry,$command,$plainUtf8)
Write-Output ('적용 완료. 게임: '+$GameDir)
Write-Output ('모딩 도구: '+$ToolsDir)
Write-Output 'EXE 교체 없음. 설치 백업 생성 없음. 기존 세이브는 복사하거나 덮어쓰지 않았습니다.'
