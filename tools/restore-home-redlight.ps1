param([switch]$Apply)
$ErrorActionPreference='Stop'
$taskRoot=Split-Path -Parent $PSScriptRoot
$taskProject='C:\Users\Ken Choung\Documents\Codex\2026-10-06\task\JO9sa'
$taskQsp='C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex\game\jack.qsp'
$taskAudit=Get-Content -LiteralPath (Join-Path $taskRoot 'tmp\redlight-recovery-audit\audit.json') -Raw | ConvertFrom-Json
$taskMods=Join-Path $taskRoot 'tmp\redlight-apply-mods'
if((Get-FileHash -LiteralPath $taskQsp).Hash -ne $taskAudit.before.ToUpper()){throw 'Game changed since the recovery audit.'}
New-Item -ItemType Directory -Path $taskMods -Force | Out-Null
foreach($taskName in $taskAudit.files){Copy-Item -LiteralPath (Join-Path $taskProject ('mods\'+$taskName)) -Destination (Join-Path $taskMods $taskName)}
if(@(Get-ChildItem -LiteralPath $taskMods -Filter '*.json' -File).Count -ne 9){throw 'Expected only nine redlight mods.'}
$taskPatcher=Join-Path $taskProject 'tools\apply_mods.ps1'
if(!$Apply){& $taskPatcher -Qsp $taskQsp -ModsDir $taskMods -DryRun;exit}
& $taskPatcher -Qsp $taskQsp -ModsDir $taskMods
if((Get-FileHash -LiteralPath $taskQsp).Hash -ne $taskAudit.after.ToUpper()){throw 'Written game differs from the verified candidate.'}
$taskCandidate=Join-Path $taskRoot 'tmp\redlight-recovery-audit\candidate.qsp'
if(![Jo9Qsp]::Same([IO.File]::ReadAllBytes($taskQsp),[IO.File]::ReadAllBytes($taskCandidate))){throw 'Candidate byte comparison failed.'}
Copy-Item -LiteralPath (Join-Path $taskRoot 'tmp\redlight-recovery-audit\audit.json') -Destination (Join-Path $taskProject 'tools\local-workspace\runtime\redlight-recovery-report.json')
Write-Output ('Verified home redlight restoration: '+$taskAudit.after)
