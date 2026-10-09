# 경로가 설정된 두 로컬 도구와 사용자가 지정한 외부 모딩 사이트를 연다.
param([switch]$NoBrowser)
$ErrorActionPreference='Stop'
$config=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'local.config.json') -Raw -Encoding UTF8 | ConvertFrom-Json
& (Join-Path $PSScriptRoot 'Start-JO9-Tools.ps1') -GameDir $config.game -OriginalDir $config.original -NoBrowser
if($LASTEXITCODE){throw '대사/체크리스트 도구를 시작하지 못했습니다.'}
$workshop=Join-Path $config.game 'modtools\JO9_Server.ps1'
$reachable=$false
try{$status=Invoke-RestMethod 'http://127.0.0.1:5269/api/status' -TimeoutSec 2;$reachable=($status.alive -eq $true)}catch{}
if(!$reachable){
 Start-Process powershell.exe -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File "'+$workshop+'" -Port 5269') -WindowStyle Hidden | Out-Null
 for($i=0;$i -lt 50;$i++){
  try{$status=Invoke-RestMethod 'http://127.0.0.1:5269/api/status' -TimeoutSec 1;if($status.alive){$reachable=$true;break}}catch{}
  Start-Sleep -Milliseconds 100
 }
 if(!$reachable){throw '이미지 워크샵을 시작하지 못했습니다. 5269 포트를 확인하세요.'}
}
Write-Output '대사 편집기 3813 / 체크리스트 3813/catalog / 이미지 워크샵 5269'
if(!$NoBrowser){
 foreach($url in @('http://127.0.0.1:3813/','http://127.0.0.1:3813/catalog','http://127.0.0.1:5269/','https://huggingface.co/spaces/fancyfeast/joy-caption-beta-one','https://translate.google.co.kr/?sl=en&tl=ko&op=translate','https://www.mage.space/advanced','https://gamma.app/design/01M48RXZSYBT1HBN8BFGAQ09AS?from=designs')){Start-Process $url}
}
