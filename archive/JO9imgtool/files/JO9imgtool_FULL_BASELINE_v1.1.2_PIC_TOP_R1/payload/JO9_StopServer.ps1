param([Parameter(Mandatory=$true)][string]$GameRoot)
$ErrorActionPreference='SilentlyContinue'
$me=$PID
$root=([IO.Path]::GetFullPath($GameRoot)).ToLowerInvariant()
$pidfile=Join-Path $GameRoot 'game\modtools\runtime\server.pid'

function Is-JO9ServerProcess([int]$Id){
    try{
        $p=Get-CimInstance Win32_Process -Filter ("ProcessId="+$Id)
        if($null -eq $p){return $false}
        if($p.Name -notmatch '^powershell(\.exe)?$'){return $false}
        $c=([string]$p.CommandLine).ToLowerInvariant()
        return $c.Contains('jo9_server.ps1') -and $c.Contains($root)
    }catch{return $false}
}

if(Test-Path -LiteralPath $pidfile){
    $t=(Get-Content -LiteralPath $pidfile -Raw).Trim()
    if($t -match '^\d+$'){
        $id=[int]$t
        if(Is-JO9ServerProcess $id){
            Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
        }
    }
}

Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
    $_.ProcessId -ne $me -and
    $_.Name -match '^powershell(\.exe)?$' -and
    $_.CommandLine -and
    $_.CommandLine.ToLowerInvariant().Contains('jo9_server.ps1') -and
    $_.CommandLine.ToLowerInvariant().Contains($root)
} | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Milliseconds 350
exit 0
