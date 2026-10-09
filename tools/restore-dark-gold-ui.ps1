param([string]$Backup,[string]$Game='C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex\game')
$ErrorActionPreference='Stop'
if(-not $Backup){throw '복구할 백업 폴더를 -Backup 으로 지정하세요.'}
$v=Get-Content -LiteralPath (Join-Path $Backup 'validation.json') -Raw | ConvertFrom-Json
if((Get-FileHash -LiteralPath (Join-Path $Game 'jack.qsp')).Hash.ToLower() -ne $v.qspAfter){throw '적용 이후 QSP가 변경되었습니다. 후속 작업을 보호하기 위해 복구를 중단합니다.'}
if((Get-FileHash -LiteralPath (Join-Path $Game 'css\base.css')).Hash.ToLower() -ne $v.cssAfter){throw '적용 이후 CSS가 변경되었습니다. 후속 작업을 보호하기 위해 복구를 중단합니다.'}
foreach($entry in @(@('jack.qsp',$v.qspBefore),@('css\base.css',$v.cssBefore))){if((Get-FileHash -LiteralPath (Join-Path $Backup $entry[0])).Hash.ToLower() -ne $entry[1]){throw '백업 검증 실패'}}
Copy-Item -LiteralPath (Join-Path $Backup 'jack.qsp') -Destination (Join-Path $Game 'jack.qsp') -Force
Copy-Item -LiteralPath (Join-Path $Backup 'css\base.css') -Destination (Join-Path $Game 'css\base.css') -Force
Write-Output '적용 전 QSP와 UI 스타일 복구 완료.'
