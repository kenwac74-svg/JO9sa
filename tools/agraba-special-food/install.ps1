param(
  [Parameter(Mandatory=$true)][string]$Candidate,
  [Parameter(Mandatory=$true)][string]$Manifest
)
$ErrorActionPreference = 'Stop'
$game = [IO.Path]::GetFullPath('C:\MOVE\Jack O Nine Tails v2.4.1_Kor_Full\game')
$target = Join-Path $game 'jack.qsp'
$launcher = Join-Path (Split-Path -Parent $game) 'Jack-o-nine-tails.exe'
$engine = Join-Path $game 'engine\jack.exe'
$patch = Get-Content -LiteralPath $Manifest -Raw -Encoding UTF8 | ConvertFrom-Json
if ($patch.id -ne 'AGRABA_SPECIAL_FOOD_20261107' -or $patch.mode -ne 'complete') {
  throw 'The installer requires the complete Agraba patch manifest.'
}

function Hash-Qsp($file) {
  (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant()
}
function Confirm-GameClosed {
  $running = @(Get-CimInstance Win32_Process -Filter "Name = 'jack.exe' OR Name = 'Jack-o-nine-tails.exe'" |
    Where-Object { -not $_.ExecutablePath -or $_.ExecutablePath -in @($engine, $launcher) })
  if ($running.Count -gt 0) { throw 'The game is still running. Save and close it before applying the patch.' }
}
function Confirm-Target {
  if ((Hash-Qsp $target) -ne $patch.before_sha256) {
    throw 'The live QSP changed after the patch was built. Rebase before installing.'
  }
}

if ((Hash-Qsp $Candidate) -ne $patch.after_sha256) { throw 'Candidate hash mismatch.' }
Confirm-GameClosed
Confirm-Target
$suffix = [Guid]::NewGuid().ToString('N').Substring(0, 8)
$backupDir = Join-Path $game ('_backup_before_agraba_' + (Get-Date -Format 'yyyyMMdd_HHmmss') + '_' + $suffix)
$backup = Join-Path $backupDir 'jack.qsp'
$stage = Join-Path $game ('.jack.agraba.' + $suffix + '.tmp')
New-Item -ItemType Directory -Path $backupDir | Out-Null
try {
  [IO.File]::Copy([IO.Path]::GetFullPath($Candidate), $stage)
  if ((Hash-Qsp $stage) -ne $patch.after_sha256) { throw 'Staged QSP hash mismatch.' }
  Confirm-GameClosed
  Confirm-Target
  [IO.File]::Replace($stage, $target, $backup)
  $installed = Hash-Qsp $target
  $previous = Hash-Qsp $backup
  if ($installed -ne $patch.after_sha256 -or $previous -ne $patch.before_sha256) {
    throw "Post-install verification failed. Prior QSP: $backup"
  }
  [pscustomobject]@{ target=$target; installed_sha256=$installed; backup=$backup; previous_sha256=$previous } | ConvertTo-Json
} finally {
  if (Test-Path -LiteralPath $stage -PathType Leaf) { Remove-Item -LiteralPath $stage }
}
