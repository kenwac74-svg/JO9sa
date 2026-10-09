param([string]$Package,[string]$Game='C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex\game')
$ErrorActionPreference='Stop'
if(-not $Package){$Package=$PSScriptRoot}
$v=Get-Content -LiteralPath (Join-Path $Package 'validation.json') -Raw | ConvertFrom-Json
foreach($check in @(@('jack.qsp',$v.qspBefore),@('css\base.css',$v.cssBefore))){
 if((Get-FileHash -LiteralPath (Join-Path $Game $check[0])).Hash.ToLower() -ne $check[1]){throw "기준 파일이 바뀌었습니다: $($check[0]). 덮어쓰지 않습니다."}
}
$backup=Join-Path $Game ('ui-backups\dark-gold-'+(Get-Date -Format 'yyyyMMdd_HHmmss'))
New-Item -ItemType Directory -Path (Join-Path $backup 'css') -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $Game 'jack.qsp') -Destination (Join-Path $backup 'jack.qsp')
Copy-Item -LiteralPath (Join-Path $Game 'css\base.css') -Destination (Join-Path $backup 'css\base.css')
Copy-Item -LiteralPath (Join-Path $Game 'css\mainScreen.css') -Destination (Join-Path $backup 'css\mainScreen.css')
Copy-Item -LiteralPath (Join-Path $Package 'validation.json') -Destination (Join-Path $backup 'validation.json')
$assetTarget=Join-Path $Game $v.asset
if(Test-Path -LiteralPath $assetTarget){throw '스킨 폴더가 이미 있습니다. 중복 설치를 중단합니다.'}
try {
 New-Item -ItemType Directory -Path $assetTarget -Force | Out-Null
 foreach($name in @('bg_main.png','card.png','menu.png')){
  $src=Join-Path (Join-Path (Join-Path $Package 'game') $v.asset) $name
  $dest=Join-Path $assetTarget $name
  Copy-Item -LiteralPath $src -Destination $dest
  if((Get-FileHash -LiteralPath $src).Hash -ne (Get-FileHash -LiteralPath $dest).Hash){throw '이미지 복사 검증 실패'}
 }
 Copy-Item -LiteralPath (Join-Path $Package 'game\css\base.css') -Destination (Join-Path $Game 'css\base.css') -Force
 Copy-Item -LiteralPath (Join-Path $Package 'game\jack.qsp') -Destination (Join-Path $Game 'jack.qsp') -Force
 if((Get-FileHash -LiteralPath (Join-Path $Game 'jack.qsp')).Hash.ToLower() -ne $v.qspAfter){throw 'QSP 복사 검증 실패'}
 if((Get-FileHash -LiteralPath (Join-Path $Game 'css\base.css')).Hash.ToLower() -ne $v.cssAfter){throw 'CSS 복사 검증 실패'}
} catch {
 Copy-Item -LiteralPath (Join-Path $backup 'jack.qsp') -Destination (Join-Path $Game 'jack.qsp') -Force
 Copy-Item -LiteralPath (Join-Path $backup 'css\base.css') -Destination (Join-Path $Game 'css\base.css') -Force
 throw
}
@{game=$Game;backup=$backup;qspAfter=$v.qspAfter;cssAfter=$v.cssAfter} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $Package 'installed.json') -Encoding utf8
Write-Output "적용 완료. 백업: $backup"
