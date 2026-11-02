$ErrorActionPreference='Stop'
$d15Rec='G:/somi/JO9sa/records/ui-focus-repaint-20261028'
$d15Tmp=[IO.Path]::GetFullPath('G:/Codex/tmp/jo9-ui-focus-repaint-20261028')
$d15Base=[IO.Path]::GetFullPath('G:/Codex/tmp/jo9-ui-focus-repaint-20261028/baseline')
if($d15Tmp -ne 'G:\Codex\tmp\jo9-ui-focus-repaint-20261028' -or $d15Base -ne 'G:\Codex\tmp\jo9-ui-focus-repaint-20261028\baseline'){throw 'Absolute cleanup boundary mismatch'}
foreach($d15Path in @($d15Tmp,$d15Base)){if((Get-Item -LiteralPath $d15Path -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Cleanup root is a reparse point'}}
$d15Live=@(Get-CimInstance Win32_Process -Filter "Name = 'jack.exe'")
foreach($d15P in $d15Live){if($d15P.CommandLine.Replace('\','/').ToLowerInvariant().Contains('g:/codex/tmp/jo9-ui-focus-repaint-20261028/')){throw 'Fixture is still in use; preserve all'}}
$d15M=Get-Content -LiteralPath (Join-Path $d15Rec 'pre-cleanup-manifest.json') -Raw -Encoding utf8 | ConvertFrom-Json
$d15FileNames=@('focus-baseline.qsp','config.xml','icon.ico','FastQSP.ini','qa_blank.svg')
$d15LinkNames=@('content','css','fonts','json')
$d15LogNames=@('launch-stderr.txt','launch-stdout.txt')
foreach($d15Entry in Get-ChildItem -LiteralPath $d15Base -Force){
 if($d15Entry.Name -in $d15LinkNames){if(-not($d15Entry.Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Expected junction is a real directory'}}
 elseif($d15Entry.Name -in ($d15FileNames+$d15LogNames)){if($d15Entry.PSIsContainer -or ($d15Entry.Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Expected plain file mismatch'}}
 elseif($d15Entry.Name -eq 'save'){if(-not $d15Entry.PSIsContainer -or ($d15Entry.Attributes -band [IO.FileAttributes]::ReparsePoint) -or @(Get-ChildItem -LiteralPath $d15Entry.FullName -Force).Count -ne 0){throw 'Unknown or saved content; preserve and stop'}}
 else{throw ('Unknown output; preserve and stop: '+$d15Entry.FullName)}
}
foreach($d15F in $d15M.preserved){if((Get-FileHash -LiteralPath $d15F.destination -Algorithm SHA256).Hash.ToLowerInvariant() -ne $d15F.sha256){throw 'Preserved evidence changed'}}
foreach($d15F in $d15M.protectedInputs){if((Get-FileHash -LiteralPath $d15F.path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $d15F.sha256){throw 'Protected input changed before cleanup'}}
foreach($d15F in $d15M.deleteReproducibleFiles){if($d15F.name -notin $d15FileNames -or [IO.Path]::GetFullPath($d15F.path) -ne (Join-Path $d15Base $d15F.name)){throw 'File deletion target outside exact whitelist'};if((Get-FileHash -LiteralPath $d15F.path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $d15F.sha256){throw 'Diagnostic file changed'}}
foreach($d15J in $d15M.junctions){
 $d15Leaf=Split-Path -Leaf $d15J.path
 if($d15Leaf -notin $d15LinkNames -or [IO.Path]::GetFullPath($d15J.path) -ne (Join-Path $d15Base $d15Leaf)){throw 'Link deletion target outside exact whitelist'}
 $d15Item=Get-Item -LiteralPath $d15J.path -Force
 if(-not($d15Item.Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Junction changed into real folder'}
 if([IO.Path]::GetFullPath(@($d15Item.Target)[0]).ToLowerInvariant() -ne [IO.Path]::GetFullPath($d15J.target).ToLowerInvariant()){throw 'Junction target changed'}
}
$d15DeletedLinks=@();foreach($d15J in $d15M.junctions){[IO.Directory]::Delete($d15J.path,$false);$d15DeletedLinks += $d15J}
foreach($d15F in $d15M.deleteReproducibleFiles){Remove-Item -LiteralPath $d15F.path -Force}
$d15Save=Join-Path $d15Base 'save';if(Test-Path -LiteralPath $d15Save){[IO.Directory]::Delete($d15Save,$false)}
$d15After=@();foreach($d15F in $d15M.protectedInputs){$d15Hash=(Get-FileHash -LiteralPath $d15F.path -Algorithm SHA256).Hash.ToLowerInvariant();if($d15Hash -ne $d15F.sha256){throw 'Protected input changed after cleanup'};$d15After += [pscustomobject]@{path=$d15F.path;sha256=$d15Hash;unchanged=$true}}
$d15Remaining=@(Get-ChildItem -LiteralPath $d15Base -Force | ForEach-Object {if($_.Name -notin $d15LogNames -or $_.PSIsContainer){throw 'Unexpected output retained; investigate'};[pscustomobject]@{name=$_.Name;path=$_.FullName;bytes=$_.Length;sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()}})
$d15Report=[pscustomobject]@{Status='CLEANED_D15_UNRESOLVED';RemovedFiles=$d15M.deleteReproducibleFiles;RemovedBytes=($d15M.deleteReproducibleFiles|Measure-Object bytes -Sum).Sum;RemovedJunctions=$d15DeletedLinks;JunctionTargetsTraversedForDeletion=$false;RemovedSaveDirectoryWasEmpty=$true;RetainedTemporaryLogs=$d15Remaining;ProtectedInputsAfter=$d15After;OtherProcessesStopped=0;NewGameRuns=0;RuntimeProductChanges=0;OriginalCleanupScriptExecuted=$false;ActualCleanupException=$false}
$d15Report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $d15Rec 'cleanup-result.json') -Encoding utf8
[pscustomobject]@{RemovedFiles=$d15M.deleteReproducibleFiles.Count;RemovedBytes=$d15Report.RemovedBytes;RemovedJunctions=$d15DeletedLinks.Count;RetainedTemporaryLogs=$d15Remaining.Count;ProtectedHashesVerified=$d15After.Count;D15Resolved=$false;RuntimeChanges=0}|ConvertTo-Json
