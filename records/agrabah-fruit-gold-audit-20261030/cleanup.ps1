$ErrorActionPreference='Stop'
$auditRoot='G:\Codex\tmp\agrabah-fruit-gold-audit-20261030'
$prepared=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'prepared.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$nativeResult=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'native-results.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if(-not $nativeResult.pass -or $nativeResult.nativeCases -ne 6){throw 'Native audit incomplete'}
if([IO.Path]::GetFullPath($auditRoot) -ne 'G:\Codex\tmp\agrabah-fruit-gold-audit-20261030'){throw 'Unexpected audit root'}
foreach($p in @('G:\Codex','G:\Codex\tmp')){if((Get-Item -LiteralPath $p -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Reparse ancestor'}}
function Assert-Hash([string]$file,[string]$expected){if((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected){throw ('Protected file changed: '+$file)}}
Assert-Hash 'G:\somi\Jack O Nine Tails v2.4_work\game\jack.qsp' $prepared.qsp
Assert-Hash $prepared.sourceSave $prepared.saveHash
$script:removedFiles=0;$script:removedBytes=0;$script:unlinked=0
$allowedLinks=@((Join-Path $auditRoot 'content'),(Join-Path $auditRoot 'css'),(Join-Path $auditRoot 'fonts'))
function Remove-AuditTree([string]$target){
    $entry=Get-Item -LiteralPath $target -Force
    if($entry.Attributes -band [IO.FileAttributes]::ReparsePoint){
        if($target -notin $allowedLinks){throw ('Unexpected link: '+$target)}
        [IO.Directory]::Delete($target,$false)
        $script:unlinked++
        return
    }
    if($entry.PSIsContainer){
        foreach($child in Get-ChildItem -LiteralPath $target -Force){Remove-AuditTree $child.FullName}
        Remove-Item -LiteralPath $target -Force
    }else{
        $script:removedFiles++;$script:removedBytes+=$entry.Length
        Remove-Item -LiteralPath $target -Force
    }
}
Remove-AuditTree $auditRoot
if(Test-Path -LiteralPath $auditRoot){throw 'Temporary root remains'}
Assert-Hash 'G:\somi\Jack O Nine Tails v2.4_work\game\jack.qsp' $prepared.qsp
Assert-Hash $prepared.sourceSave $prepared.saveHash
$result=@{pass=$true;root=$auditRoot;removedFiles=$removedFiles;removedBytes=$removedBytes;unlinkedDiagnosticJunctions=$unlinked;sourceSavePreserved=$true;workPreserved=$true;reportsPreserved=$true}
$result|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $PSScriptRoot 'cleanup.json') -Encoding UTF8
$result|ConvertTo-Json -Compress
