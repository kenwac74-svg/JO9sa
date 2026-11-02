# root가 관찰을 끝내고 해당 QA 창을 닫은 다음에만 실행한다.
$ErrorActionPreference='Stop'
$fixturePath=[IO.Path]::GetFullPath('G:/Codex/tmp/jo9-ui-focus-repaint-20261028/baseline')
if($fixturePath -ne 'G:\Codex\tmp\jo9-ui-focus-repaint-20261028\baseline'){throw '정리 범위 불일치'}
if(-not(Test-Path -LiteralPath $fixturePath)){Write-Output '이미 정리됨';exit}
$fixtureItem=Get-Item -LiteralPath $fixturePath -Force
if($fixtureItem.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'fixture 루트가 링크임; 정리 중단'}
$allowedFiles=@('focus-baseline.qsp','config.xml','icon.ico','FastQSP.ini','qa_blank.svg')
$allowedLinks=@('content','css','fonts','json')
foreach($entry in Get-ChildItem -LiteralPath $fixturePath -Force){
 if($allowedLinks -contains $entry.Name){
  if(-not($entry.Attributes -band [IO.FileAttributes]::ReparsePoint)){throw "예상하지 않은 실제 폴더 보존: $($entry.Name)"}
 }elseif($allowedFiles -contains $entry.Name){if($entry.PSIsContainer){throw '파일 위치에 폴더가 있음'}}
 elseif($entry.Name -eq 'save' -and $entry.PSIsContainer){
  if($entry.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'save 링크 보존'}
  if(@(Get-ChildItem -LiteralPath $entry.FullName -Force).Count -ne 0){throw '생성된 세이브 보존을 위해 정리 중단'}
 }else{throw "확인하지 않은 생성물 보존: $($entry.Name)"}
}
foreach($name in $allowedLinks){$link=Join-Path $fixturePath $name;if(Test-Path -LiteralPath $link){[IO.Directory]::Delete($link,$false)}}
foreach($name in $allowedFiles){$file=Join-Path $fixturePath $name;if(Test-Path -LiteralPath $file){Remove-Item -LiteralPath $file}}
$savePath=Join-Path $fixturePath 'save';if(Test-Path -LiteralPath $savePath){[IO.Directory]::Delete($savePath,$false)}
[IO.Directory]::Delete($fixturePath,$false)
Write-Output 'QA 파일과 junction 자체만 정리 완료'
