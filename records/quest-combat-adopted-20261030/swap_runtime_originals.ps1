param([switch]$Execute)
$ErrorActionPreference='Stop'
$plan=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'runtime-swap-plan.json') -Raw -Encoding UTF8|ConvertFrom-Json
$workRoot=[IO.Path]::GetFullPath('G:\somi\Jack O Nine Tails v2.4_work\game')
$archiveRoot=[IO.Path]::GetFullPath('G:\somi\JO9resource\mob_body\quest_originals_20261030')
$localRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'runtime-new-stage'))
$receiptPath=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'runtime-original-swap.json'))
$journalPath=[IO.Path]::GetFullPath($plan.transactionJournal)
$manifestPath=[IO.Path]::GetFullPath($plan.archiveManifestPath)
function Hash([string]$p){return(Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()}
function Within([string]$p,[string]$root){return $p.StartsWith($root.TrimEnd('\')+'\',[StringComparison]::OrdinalIgnoreCase)}
function NoReparse([string]$p){$c=[IO.Path]::GetFullPath($p);while($c){if(Test-Path -LiteralPath $c){$i=Get-Item -LiteralPath $c -Force;if(($i.Attributes-band[IO.FileAttributes]::ReparsePoint)-ne0){throw "Junction/symlink refused: $c"}};$n=[IO.Path]::GetDirectoryName($c);if($n-eq$c){break};$c=$n}}
function WriteJson([string]$path,$obj){[IO.File]::WriteAllText($path,($obj|ConvertTo-Json -Depth 16),[Text.UTF8Encoding]::new($false))}
function SaveReceipt{
 $receipt=@{status='SWAPPED';id=$plan.id;createdUtc=[DateTime]::UtcNow.ToString('o');files=@($plan.files|ForEach-Object{@{path=$_.path;before=$_.before;after=$_.after;archive=$_.archive;originalBytes=$_.beforeBytes;originalSize=$_.beforeSize}});originalsMoved=$true;originalCount=9;transactionJournal=$journalPath;archiveManifest=$manifestPath;catfightArchivePreserved=$true;protectedHashesMatched=$plan.protected.Count}
 WriteJson $receiptPath $receipt
}
if($plan.files.Count-ne9-or@($plan.files.path|Sort-Object -Unique).Count-ne9){throw 'Expected9 unique target files'}
if([IO.Path]::GetFullPath($plan.archiveRoot)-ne$archiveRoot){throw 'Archive root mismatch'}
if(-not(Within $journalPath $archiveRoot)-or-not(Within $manifestPath $archiveRoot)){throw 'Archive metadata outside approved root'}
$afterCount=0
foreach($f in $plan.files){
 $expected=[IO.Path]::GetFullPath((Join-Path $workRoot $f.path));$runtime=[IO.Path]::GetFullPath($f.runtime);$archive=[IO.Path]::GetFullPath($f.archive);$stage=[IO.Path]::GetFullPath($f.localStage);$workStage=[IO.Path]::GetFullPath($f.workStage)
 if($runtime-ne$expected-or-not(Within $runtime (Join-Path $workRoot 'content\pic\mob'))){throw 'Runtime path mismatch'}
 if($f.path.Replace('\','/').ToLowerInvariant()-eq'content/pic/mob/defeated/egeya.png'){throw 'Held Egeya defeat must not be swapped'}
 if($archive-ne[IO.Path]::GetFullPath((Join-Path (Join-Path $archiveRoot 'runtime') $f.path))){throw 'Original destination mismatch'}
 if(-not(Within $stage $localRoot)-or$workStage-ne($runtime+'.jo9-quest-stage-20261030')){throw 'Unexpected stage path'}
 foreach($p in @($runtime,$archive,$stage,$workStage,$f.reviewSource)){NoReparse $p}
 if((Hash $f.reviewSource)-ne$f.after){throw 'Selected review source drift'}
 $h=Hash $runtime
 if($h-eq$f.after){if(-not(Test-Path -LiteralPath $archive)-or(Hash $archive)-ne$f.before){throw 'NEW runtime lacks exact archived original'};$afterCount++}
 elseif($h-ne$f.before){throw "Runtime original drift: $runtime"}
}
foreach($p in $plan.protected){if((Hash $p.path)-ne$p.sha256){throw "Protected file drift: $($p.path)"}}
if($afterCount-eq9){if($Execute){SaveReceipt};Write-Output 'ALREADY_COMPLETE: selectedNEW9 in WORK and exactOLD9 in archive.';return}
if($afterCount-ne0){throw 'Mixed runtime state; inspect prior transaction before running'}
if((Test-Path -LiteralPath $journalPath)-or(Test-Path -LiteralPath $manifestPath)){throw 'Existing transaction/manifest; inspect before retry'}
foreach($f in $plan.files){if((Hash $f.localStage)-ne$f.after){throw 'Local stage missing/drift'};if((Test-Path -LiteralPath $f.workStage)-or(Test-Path -LiteralPath $f.archive)){throw 'Stage/archive collision'}}
Write-Output 'PREFLIGHT PASS: nineOLD/nineNEW exact; archive destinations free; protected29 including fiveportraits/heldEgeya/QSP/IDs/catfight15+3 unchanged; no reparse points.'
if(-not$Execute){return}
[IO.Directory]::CreateDirectory($archiveRoot)|Out-Null
$journal=@{schema='jo9-quest-runtime-original-move/1';id=$plan.id;status='STARTED';createdUtc=[DateTime]::UtcNow.ToString('o');files=$plan.files;actions=@();protected=$plan.protected;originalCount=9;originalBytesNeverResized=$true;trackedAdditionalOriginals=0;metadataInstallerStillRequired=$true}
WriteJson $journalPath $journal
try{
 foreach($f in $plan.files){
  if((Hash $f.runtime)-ne$f.before-or(Hash $f.localStage)-ne$f.after){throw 'Immediate stage/original drift'}
  Move-Item -LiteralPath $f.localStage -Destination $f.workStage
  if((Hash $f.workStage)-ne$f.after){throw 'NEW same-volume stage mismatch'}
  $journal.actions+=@{action='MOVE_NEW_LOCAL_TO_WORK_STAGE';path=$f.path;source=$f.localStage;destination=$f.workStage;sha256=$f.after};WriteJson $journalPath $journal
 }
 foreach($f in $plan.files){
  NoReparse $f.runtime;NoReparse $f.archive;NoReparse $f.workStage
  if((Hash $f.runtime)-ne$f.before-or(Hash $f.workStage)-ne$f.after){throw 'Immediate live swap drift'}
  [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($f.archive))|Out-Null
  Move-Item -LiteralPath $f.runtime -Destination $f.archive
  if((Hash $f.archive)-ne$f.before){throw 'Original archive hash mismatch'}
  $journal.actions+=@{action='MOVE_ORIGINAL_TO_ARCHIVE';path=$f.path;source=$f.runtime;destination=$f.archive;sha256=$f.before;bytes=$f.beforeBytes};WriteJson $journalPath $journal
  Move-Item -LiteralPath $f.workStage -Destination $f.runtime
  if((Hash $f.runtime)-ne$f.after){throw 'Installed NEW hash mismatch'}
  $journal.actions+=@{action='MOVE_NEW_STAGE_TO_RUNTIME';path=$f.path;source=$f.workStage;destination=$f.runtime;sha256=$f.after};WriteJson $journalPath $journal
 }
 foreach($p in $plan.protected){if((Hash $p.path)-ne$p.sha256){throw 'Protected file changed during swap'}}
 foreach($f in $plan.files){if((Hash $f.archive)-ne$f.before-or(Hash $f.runtime)-ne$f.after){throw 'Final original/runtime mismatch'}}
 $archiveManifest=@{schema='jo9-quest-original-source-manifest/1';id=$plan.id;status='ORIGINALS_MOVED_AND_VERIFIED';createdUtc=[DateTime]::UtcNow.ToString('o');uniqueOriginals=9;entries=@($plan.files|ForEach-Object{@{key=$_.key;slot=$_.slot;runtimePath=$_.path;originalSource=$_.runtime;destination=$_.archive;sha256=$_.before;bytes=$_.beforeBytes;size=$_.beforeSize;mode=$_.beforeMode;alphaExtrema=$_.beforeAlphaExtrema;action='MOVED_DURING_APPROVED_RUNTIME_ART_ADOPTION'}});transactionJournal=$journalPath;priorCatfightArchiveChanged=$false;heldEgeyaDefeatExcluded=$true}
 WriteJson $manifestPath $archiveManifest
 $journal.status='NINE_ORIGINALS_MOVED_NINE_NEW_RUNTIME_VERIFIED';$journal.completedUtc=[DateTime]::UtcNow.ToString('o');WriteJson $journalPath $journal
 SaveReceipt
 Write-Output 'SWAPPED: nativeMOVE OLD9 to questarchive, NEW9 to WORK. Receiptfiles9 ready; catalog/mirrors remain for rootinstaller.'
}catch{
 $journal.error=$_.Exception.Message
 foreach($f in @($plan.files)[($plan.files.Count-1)..0]){
  # Recover only paths whose exact hashes prove they belong to this transaction.
  if((Test-Path -LiteralPath $f.archive)-and(Hash $f.archive)-eq$f.before){
   if((Test-Path -LiteralPath $f.runtime)-and(Hash $f.runtime)-eq$f.after-and-not(Test-Path -LiteralPath $f.workStage)){Move-Item -LiteralPath $f.runtime -Destination $f.workStage}
   if(-not(Test-Path -LiteralPath $f.runtime)){Move-Item -LiteralPath $f.archive -Destination $f.runtime}
  }
  if((Test-Path -LiteralPath $f.workStage)-and(Hash $f.workStage)-eq$f.after-and-not(Test-Path -LiteralPath $f.localStage)){Move-Item -LiteralPath $f.workStage -Destination $f.localStage}
 }
 $journal.status='FAILED_INSPECT_TRANSACTION_JOURNAL';WriteJson $journalPath $journal;throw
}
