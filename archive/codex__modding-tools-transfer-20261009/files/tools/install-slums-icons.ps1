# 주거 구역 및 바이커 차고의 새 컬러 아이콘과 QSP 연결을 설치한다.
param([Parameter(Mandatory=$true)][string]$Game)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$qsp = Join-Path $Game 'jack.qsp'
$mod = Join-Path $repo 'mods/2026-10-14_slums_colour_icons.json'
$assets = Join-Path $repo 'assets/mod-icons/2026-10-14-slums'
$taskMods = Join-Path ([IO.Path]::GetTempPath()) ('jo9-slums-icons-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $taskMods | Out-Null
try {
    Copy-Item -LiteralPath $mod -Destination (Join-Path $taskMods 'mod.json')
    & (Join-Path $repo 'tools/apply_mods.ps1') -Qsp $qsp -ModsDir $taskMods -DryRun
    foreach ($name in @('jo9_slum_residential.png','jo9_biker_garage.png')) {
        $src = Join-Path $assets $name
        $dst = Join-Path $Game ('content/pic/ui overhaul/' + $name)
        if (Test-Path -LiteralPath $dst) {
            if ((Get-FileHash -LiteralPath $dst).Hash -ne (Get-FileHash -LiteralPath $src).Hash) {
                Copy-Item -LiteralPath $dst -Destination ($dst + '.bak_' + (Get-Date -Format 'yyyyMMdd_HHmmss'))
            }
        }
        Copy-Item -LiteralPath $src -Destination $dst -Force
    }
    & (Join-Path $repo 'tools/apply_mods.ps1') -Qsp $qsp -ModsDir $taskMods
} finally {
    # Only known files created above are removed; no recursive deletion.
    Remove-Item -LiteralPath (Join-Path $taskMods 'mod.json') -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $taskMods -ErrorAction SilentlyContinue
}
