$ErrorActionPreference='Stop'
$gameRoot='G:\somi\Jack O Nine Tails v2.4_work\game'
$recordRoot='G:\somi\JO9sa\records\mob-portrait-edge-fix-20261030'
$temporaryRoot='G:\Codex\tmp\mob-portrait-edge-fix-20261030'
$registeredRoot=Join-Path $PSScriptRoot 'source-alignment\registered-rgba'
$receipt=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'installation.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$manifest=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'manifest.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$alignment=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'source-alignment\progress.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if($receipt.status -ne 'VERIFIED'){throw 'Installation is not verified'}
if([IO.Path]::GetFullPath($temporaryRoot) -ne 'G:\Codex\tmp\mob-portrait-edge-fix-20261030'){throw 'Unexpected temporary root'}
if([IO.Path]::GetFullPath($registeredRoot) -ne 'C:\Users\User\.codex\.chatgpt-projects\g-p-6aad063c991081918e27b6675f290be7\output\mob-portrait-edge-fix-20261030\source-alignment\registered-rgba'){throw 'Unexpected crop root'}
function Assert-PlainTree([string]$dir){
    $item=Get-Item -LiteralPath $dir -Force
    if($item.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Unexpected reparse target'}
    foreach($entry in Get-ChildItem -LiteralPath $dir -Force){
        if($entry.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Unexpected reparse entry'}
        if($entry.PSIsContainer){Assert-PlainTree $entry.FullName}
    }
}
function Assert-Hash([string]$file,[string]$expected){if((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected){throw ('Hash mismatch: '+$file)}}
foreach($f in $receipt.files){
    Assert-Hash (Join-Path $gameRoot $f.path) $f.after
    Assert-Hash $f.beforePath $f.before
    foreach($key in @('alphaPath','changeBandPath','protectedCorePath')){
        $source=$f.$key
        $bucket=Split-Path -Path (Split-Path -Path $source -Parent) -Leaf
        $kept=Join-Path (Join-Path (Join-Path $recordRoot 'masks') $bucket) (Split-Path -Path $source -Leaf)
        Assert-Hash $kept (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant()
    }
}
Assert-Hash (Join-Path $gameRoot 'jack.qsp') $manifest.qspBefore
Assert-Hash $manifest.sourceImage $manifest.sourceSha256
if($alignment.completed -ne 27){throw 'Incomplete crop record'}
if(@(Get-ChildItem -LiteralPath $registeredRoot -File).Count -ne 27){throw 'Unexpected crop files'}
foreach($f in $alignment.results){Assert-Hash $f.source $f.sourceSha256;Assert-Hash $f.registeredPath $f.registeredSha256}
foreach($parent in @('G:\Codex','G:\Codex\tmp',$PSScriptRoot,(Join-Path $PSScriptRoot 'source-alignment'))){if((Get-Item -LiteralPath $parent -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Reparse ancestor'}}
$removedFiles=0;$removedBytes=0
foreach($target in @($temporaryRoot,$registeredRoot)){
    Assert-PlainTree $target
    $items=@(Get-ChildItem -LiteralPath $target -Recurse -File -Force)
    $removedFiles+=$items.Count;$removedBytes+=($items|Measure-Object -Property Length -Sum).Sum
    Remove-Item -LiteralPath $target -Recurse -Force
    if(Test-Path -LiteralPath $target){throw 'Temporary target remains'}
}
$result=@{pass=$true;roots=@($temporaryRoot,$registeredRoot);removedFiles=$removedFiles;removedBytes=$removedBytes;permanentMasks=90;sourceOriginalsPreserved=$true;workPreserved=$true;uniqueBackupsPreserved=$true}
$result|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $PSScriptRoot 'cleanup.json') -Encoding UTF8
$result|ConvertTo-Json -Compress
