param([Parameter(Mandatory=$true)][string]$GameDir)
$ErrorActionPreference='Stop'
$repo=Split-Path -Parent $PSScriptRoot
$game=[IO.Path]::GetFullPath($GameDir)
$qsp=Join-Path $game 'jack.qsp'
$css=Join-Path $game 'css\base.css'
$frameFile=Join-Path $PSScriptRoot 'ui\single-grimdark-frame.css'
$mod=Join-Path $repo 'mods\2026-10-14_single_grimdark_cg_slots.json'
foreach($file in @($qsp,$css,$frameFile,$mod,(Join-Path $game 'content\pic\ui\grimdark\bg_main.png'))){if(!(Test-Path -LiteralPath $file -PathType Leaf)){throw "Missing file: $file"}}
$before=[IO.File]::ReadAllBytes($css)
$frame=[IO.File]::ReadAllBytes($frameFile)
$read=[Text.Encoding]::UTF8.GetString($before)
$installed=$read.Contains('JO9_SINGLE_GRIMDARK_UI_20261014_BEGIN')
$frameBlock=[Text.Encoding]::ASCII.GetString($frame).Trim([char[]]"`r`n")
$plain=[Text.Encoding]::ASCII.GetString($before)
$beginMarker='/* JO9_SINGLE_GRIMDARK_UI_20261014_BEGIN */'
$endMarker='/* JO9_SINGLE_GRIMDARK_UI_20261014_END */'
$begin=$plain.IndexOf($beginMarker,[StringComparison]::Ordinal)
$end=if($begin -ge 0){$plain.IndexOf($endMarker,$begin,[StringComparison]::Ordinal)}else{-1}
$needsCss=$true
if($installed -and $end -ge $begin){$needsCss=($plain.Substring($begin,$end+$endMarker.Length-$begin) -cne $frameBlock)}
if($installed -and ($begin -lt 0 -or $end -lt $begin)){throw 'Incomplete frame block; no changes were applied.'}
$temp=Join-Path ([IO.Path]::GetTempPath()) ('jo9-single-ui-'+[Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $temp | Out-Null
try {
 Copy-Item -LiteralPath $mod -Destination (Join-Path $temp (Split-Path $mod -Leaf))
 & (Join-Path $PSScriptRoot 'apply_mods.ps1') -Qsp $qsp -ModsDir $temp -DryRun
 & (Join-Path $PSScriptRoot 'apply_mods.ps1') -Qsp $qsp -ModsDir $temp
 if($needsCss){
  $stamp=(Get-Date).ToString('yyyyMMdd_HHmmss')
  $backup=$css+'.bak_singleui_'+$stamp
  [IO.File]::WriteAllBytes($backup,$before)
  if((Get-FileHash -LiteralPath $css).Hash -ne (Get-FileHash -LiteralPath $backup).Hash){throw 'CSS changed during patch; restore point retained.'}
  if($installed){
   $cutEnd=$end+$endMarker.Length
   $block=[Text.Encoding]::ASCII.GetBytes($frameBlock)
   $after=New-Object byte[] ($begin+$block.Length+$before.Length-$cutEnd)
   [Array]::Copy($before,0,$after,0,$begin)
   [Array]::Copy($block,0,$after,$begin,$block.Length)
   [Array]::Copy($before,$cutEnd,$after,$begin+$block.Length,$before.Length-$cutEnd)
  }else{
   $after=New-Object byte[] ($before.Length+$frame.Length)
   [Array]::Copy($before,0,$after,0,$before.Length)
   [Array]::Copy($frame,0,$after,$before.Length,$frame.Length)
  }
  $candidate=$css+'.singleui.tmp'
  if(Test-Path -LiteralPath $candidate){throw 'A previous CSS candidate exists; check it before retrying.'}
  [IO.File]::WriteAllBytes($candidate,$after)
  Move-Item -LiteralPath $candidate -Destination $css -Force
  Write-Output ('CSS backup: '+$backup)
 }else{Write-Output 'CSS frame already installed.'}
 Get-FileHash -LiteralPath $qsp,$css -Algorithm SHA256 | Select-Object Path,Hash
}finally{
 $copied=Join-Path $temp (Split-Path $mod -Leaf)
 if(Test-Path -LiteralPath $copied){Remove-Item -LiteralPath $copied}
 Remove-Item -LiteralPath $temp
}
