$ErrorActionPreference='Stop'
$vampRoot='G:/Codex/tmp/vampire-set-20261113'
$vampResults=@()
foreach($vampCase in (Get-Content -LiteralPath ($vampRoot+'/links.json') -Raw -Encoding UTF8 | ConvertFrom-Json)) {
 $vampProcess=$null
 try {
  $vampLogPath=$vampRoot+'/'+$vampCase.name+'-stderr.log'
  $vampProcess=Start-Process -FilePath 'G:/somi/Jack O Nine Tails v2.4_work/game/engine/jack.exe' -ArgumentList ('"'+$vampCase.file+'"') -WorkingDirectory $vampRoot -WindowStyle Hidden -PassThru -RedirectStandardError $vampLogPath -RedirectStandardOutput ($vampRoot+'/'+$vampCase.name+'-stdout.log')
  $vampDeadline=(Get-Date).AddSeconds(12)
  do {
   Start-Sleep -Milliseconds 250
   $vampLog=if(Test-Path -LiteralPath $vampLogPath){[Text.Encoding]::GetEncoding(949).GetString([byte[]](Get-Content -LiteralPath $vampLogPath -Encoding Byte -ReadCount 0))}else{''}
   if($vampLog -match 'showMessage\(\)'){break}
  } while((Get-Date) -lt $vampDeadline -and -not $vampProcess.HasExited)
  $vampOK=$vampLog.Contains($vampCase.expected) -and $vampLog.Contains('showMessage()')
  if($vampCase.menu) {
   foreach($vampLabel in @('[혈액기호증]','[암흑기호증]','[까다로운 입맛]','[건강체질]','[고도 대사량]','[타고난 마법사]')) {$vampOK=$vampOK -and $vampLog.Contains($vampLabel)}
   $vampOK=$vampOK -and ([regex]::Matches($vampLog,'vampire_component').Count -eq 6)
  }
  $vampResults+=@{name=$vampCase.name;pass=$vampOK;expected=$vampCase.expected}
 } finally {if($null -ne $vampProcess){Stop-Process -Id $vampProcess.Id -ErrorAction SilentlyContinue}}
}
$vampResults | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath ($vampRoot+'/link-results.json') -Encoding UTF8
$vampResults | ForEach-Object {Write-Output ($_.name+': '+$_.pass)}
if(@($vampResults | Where-Object {-not $_.pass}).Count -gt 0){exit 1}
