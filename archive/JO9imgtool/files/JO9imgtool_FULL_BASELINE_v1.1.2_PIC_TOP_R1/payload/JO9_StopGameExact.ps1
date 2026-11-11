param(
    [Parameter(Mandatory=$true)][string]$GameRoot,
    [int]$WaitSeconds = 8
)

$ErrorActionPreference='SilentlyContinue'
$root=[IO.Path]::GetFullPath($GameRoot).TrimEnd('\')
$engine=[IO.Path]::GetFullPath((Join-Path $root 'game\engine\jack.exe'))
$launcher=[IO.Path]::GetFullPath((Join-Path $root 'Jack-o-nine-tails.exe'))

function SamePath([string]$A,[string]$B){
    try {
        return [IO.Path]::GetFullPath($A).Equals([IO.Path]::GetFullPath($B),[StringComparison]::OrdinalIgnoreCase)
    } catch { return $false }
}

$targets=@()
foreach($p in Get-Process -ErrorAction SilentlyContinue){
    try{
        $path=$p.Path
        if($path -and ((SamePath $path $engine) -or (SamePath $path $launcher))){
            $targets += $p
        }
    }catch{}
}

# Ask visible processes to close first.
foreach($p in $targets){
    try{
        if($p.MainWindowHandle -ne 0){
            $null=$p.CloseMainWindow()
        }
    }catch{}
}

$deadline=(Get-Date).AddSeconds([Math]::Max(1,$WaitSeconds))
do{
    Start-Sleep -Milliseconds 250
    $alive=@()
    foreach($p in $targets){
        try{
            if(Get-Process -Id $p.Id -ErrorAction SilentlyContinue){$alive += $p}
        }catch{}
    }
    if(-not $alive.Count){break}
}while((Get-Date) -lt $deadline)

# For an explicit uninstall/restore request, force-kill only the exact JO9 executables.
foreach($p in $alive){
    try{Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue}catch{}
}
Start-Sleep -Milliseconds 400

# Verify exact JO9 executable paths are no longer running.
foreach($p in Get-Process -ErrorAction SilentlyContinue){
    try{
        $path=$p.Path
        if($path -and ((SamePath $path $engine) -or (SamePath $path $launcher))){
            Write-Host ("[FAILED] Still running: "+$path)
            exit 2
        }
    }catch{}
}
exit 0
