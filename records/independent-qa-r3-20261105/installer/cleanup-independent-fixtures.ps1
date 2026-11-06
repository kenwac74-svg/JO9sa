param([string]$TempRoot='G:/Codex/tmp/jo9-independent-qa-r2-20261105/installer')
$ErrorActionPreference='Stop'
$expected='G:\Codex\tmp\jo9-independent-qa-r2-20261105\installer'
$full=[IO.Path]::GetFullPath($TempRoot).TrimEnd('\')
if($full -ne $expected){throw 'Unexpected cleanup scope'}
$cursor=$full
while($cursor){
    if(Test-Path -LiteralPath $cursor){
        $item=Get-Item -LiteralPath $cursor -Force
        if($item.Attributes -band [IO.FileAttributes]::ReparsePoint){throw ('Link ancestor: '+$cursor)}
    }
    $cursor=[IO.Path]::GetDirectoryName($cursor)
}
$pending=New-Object 'System.Collections.Generic.Stack[string]'
$pending.Push($full);$files=0L;$bytes=0L;$dirs=0L
while($pending.Count){
    $dir=$pending.Pop();$dirs++
    foreach($item in Get-ChildItem -LiteralPath $dir -Force){
        if(-not $item.FullName.StartsWith($expected+'\',[StringComparison]::OrdinalIgnoreCase)){throw 'Child outside cleanup root'}
        if($item.Attributes -band [IO.FileAttributes]::ReparsePoint){throw ('Link child: '+$item.FullName)}
        if($item.PSIsContainer){$pending.Push($item.FullName)}else{
            $files++;$bytes+=$item.Length
            if($item.Extension -eq '.exe' -and [IO.File]::ReadAllText($item.FullName) -ne 'NOT EXECUTABLE: QA marker only'){throw 'Unexpected executable in fixture root'}
        }
    }
}
Remove-Item -LiteralPath $full -Recurse -Force
if(Test-Path -LiteralPath $full){throw 'Fixture root still exists'}
$result=[ordered]@{absoluteRoot=$full;verifiedNoReparsePoints=$true;verifiedAllExeFilesAreTextMarkers=$true;removedFiles=$files;removedDirectories=$dirs;removedBytes=$bytes;existsAfter=$false;preserved='Reports, logs, hash metadata, candidates and reproduction scripts in workspace; original ZIP and game folders untouched.'}
$output=Join-Path $PSScriptRoot 'cleanup-result.json'
[IO.File]::WriteAllText($output,($result|ConvertTo-Json -Depth 4),(New-Object Text.UTF8Encoding($false)))
$result|ConvertTo-Json -Compress
