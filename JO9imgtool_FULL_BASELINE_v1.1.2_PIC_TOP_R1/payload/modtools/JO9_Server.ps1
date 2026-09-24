param([int]$Port = 0)

$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$Runtime = Join-Path $Root 'runtime'
$Workshop = Join-Path $Root 'place\JO9_Place_Workshop.html'
$GameDir = Split-Path -Parent $Root
$PicRoot = [IO.Path]::GetFullPath((Join-Path $GameDir 'content\pic'))
$Context = Join-Path $Runtime 'context.json'
$PidFile = Join-Path $Runtime 'server.pid'
$PortFile = Join-Path $Runtime 'port.txt'
$ConfigFile = Join-Path $Root 'config.json'
$LogFile = Join-Path $Runtime 'server.log'

New-Item -ItemType Directory -Force -Path $Runtime | Out-Null

function Load-ServerConfig {
    $r = @{
        idleTimeoutSeconds = 90
        startupGraceSeconds = 30
        logMaxKB = 512
    }
    try {
        if(Test-Path -LiteralPath $ConfigFile){
            $c = Get-Content -LiteralPath $ConfigFile -Raw | ConvertFrom-Json
            if($c.server.idleTimeoutSeconds){$r.idleTimeoutSeconds=[int]$c.server.idleTimeoutSeconds}
            if($c.server.startupGraceSeconds){$r.startupGraceSeconds=[int]$c.server.startupGraceSeconds}
            if($c.logs.maxKilobytes){$r.logMaxKB=[int]$c.logs.maxKilobytes}
        }
    } catch {}
    return $r
}
$Cfg = Load-ServerConfig

function Rotate-Log {
    try {
        if(Test-Path -LiteralPath $LogFile){
            $max=[int64]$Cfg.logMaxKB*1024
            if((Get-Item -LiteralPath $LogFile).Length -gt $max){
                $old=$LogFile+'.1'
                Remove-Item -LiteralPath $old -Force -ErrorAction SilentlyContinue
                Move-Item -LiteralPath $LogFile -Destination $old -Force
            }
        }
    } catch {}
}
Rotate-Log

function Log([string]$Text){
    try {
        Add-Content -LiteralPath $LogFile -Value ("$(Get-Date -Format 'HH:mm:ss.fff')  "+$Text) -Encoding UTF8
    } catch {}
}

function Write-Response {
    param(
        [System.Net.Sockets.NetworkStream]$Stream,
        [int]$Status = 200,
        [string]$Type = 'text/plain; charset=utf-8',
        [byte[]]$Body = @()
    )
    $reason = if ($Status -eq 200) {'OK'} elseif ($Status -eq 404) {'Not Found'} else {'Error'}
    $head = "HTTP/1.1 $Status $reason`r`nContent-Type: $Type`r`nContent-Length: $($Body.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
    $hb = [Text.Encoding]::ASCII.GetBytes($head)
    $Stream.Write($hb,0,$hb.Length)
    if ($Body.Length) { $Stream.Write($Body,0,$Body.Length) }
    $Stream.Flush()
}

function Json-Bytes($Object) {
    [Text.Encoding]::UTF8.GetBytes(($Object | ConvertTo-Json -Compress -Depth 8))
}

function Query-Value([string]$Target,[string]$Name) {
    try {
        $i=$Target.IndexOf('?')
        if($i -lt 0){return ''}
        $q=$Target.Substring($i+1)
        foreach($part in $q.Split('&')){
            if(-not $part){continue}
            $kv=$part.Split('=',2)
            $k=[Uri]::UnescapeDataString($kv[0].Replace('+',' '))
            if($k -eq $Name){
                if($kv.Count -lt 2){return ''}
                return [Uri]::UnescapeDataString($kv[1].Replace('+',' '))
            }
        }
    } catch {}
    return ''
}

function Safe-Asset-Path([string]$Rel) {
    if([string]::IsNullOrWhiteSpace($Rel)){return $null}
    $p=$Rel.Replace('/','\').TrimStart('\')
    if($p -match '(^|\\)\.\.(\\|$)'){return $null}
    if($p -notmatch '(?i)^content\\pic\\'){return $null}
    try {
        $full=[IO.Path]::GetFullPath((Join-Path $GameDir $p))
        $prefix=$PicRoot.TrimEnd('\')+'\'
        if(-not $full.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)){return $null}
        return $full
    } catch { return $null }
}

$Listener = New-Object System.Net.Sockets.TcpListener([Net.IPAddress]::Loopback,$Port)
$Listener.Start()
$ActualPort = [int]$Listener.LocalEndpoint.Port

Set-Content -LiteralPath $PidFile -Value $PID -Encoding ASCII
Set-Content -LiteralPath $PortFile -Value $ActualPort -Encoding ASCII
Log ("Server started PID=$PID port=$ActualPort")

$script:LastPoll = [DateTime]::MinValue
$StartedAt = [DateTime]::UtcNow

try {
    while ($true) {
        $now=[DateTime]::UtcNow
        if($script:LastPoll -eq [DateTime]::MinValue){
            if(($now-$StartedAt).TotalSeconds -gt [int]$Cfg.startupGraceSeconds){
                Log 'No browser heartbeat during startup grace; exiting'
                break
            }
        } elseif(($now-$script:LastPoll).TotalSeconds -gt [int]$Cfg.idleTimeoutSeconds) {
            Log 'Browser heartbeat timed out; exiting'
            break
        }

        if (-not $Listener.Pending()) {
            Start-Sleep -Milliseconds 50
            continue
        }

        $Client = $null
        $Stream = $null
        try {
            $Client = $Listener.AcceptTcpClient()
            $Stream = $Client.GetStream()
            $Reader = New-Object IO.StreamReader($Stream,[Text.Encoding]::ASCII,$false,4096,$true)
            $Line = $Reader.ReadLine()
            if (-not $Line) { continue }

            while ($true) {
                $HeaderLine = $Reader.ReadLine()
                if ([string]::IsNullOrEmpty($HeaderLine)) { break }
            }

            $Parts = $Line.Split(' ')
            $Target = if ($Parts.Count -ge 2) {$Parts[1]} else {'/'}
            $Path = ($Target -split '\?')[0]

            if ($Path -eq '/' -or $Path -eq '/JO9_Place_Workshop.html') {
                if (Test-Path -LiteralPath $Workshop) {
                    Write-Response -Stream $Stream -Type 'text/html; charset=utf-8' -Body ([IO.File]::ReadAllBytes($Workshop))
                } else {
                    Write-Response -Stream $Stream -Status 404
                }
            }
            elseif ($Path -eq '/api/context') {
                $script:LastPoll = [DateTime]::UtcNow
                if (Test-Path -LiteralPath $Context) {
                    Write-Response -Stream $Stream -Type 'application/json; charset=utf-8' -Body ([IO.File]::ReadAllBytes($Context))
                } else {
                    Write-Response -Stream $Stream -Type 'application/json; charset=utf-8' -Body (Json-Bytes @{status='waiting';updated=''})
                }
            }
            elseif ($Path -eq '/api/asset') {
                $rel = Query-Value $Target 'path'
                $full = Safe-Asset-Path $rel
                if ($full -and (Test-Path -LiteralPath $full)) {
                    $ext=[IO.Path]::GetExtension($full).ToLowerInvariant()
                    $type=switch($ext){
                        '.png' {'image/png'}
                        '.jpg' {'image/jpeg'}
                        '.jpeg' {'image/jpeg'}
                        '.webp' {'image/webp'}
                        '.gif' {'image/gif'}
                        default {'application/octet-stream'}
                    }
                    Write-Response -Stream $Stream -Type $type -Body ([IO.File]::ReadAllBytes($full))
                } else {
                    Write-Response -Stream $Stream -Status 404
                }
            }
            elseif ($Path -eq '/api/open-path') {
                $rel = Query-Value $Target 'path'
                $full = Safe-Asset-Path $rel
                if ($full -and (Test-Path -LiteralPath $full)) {
                    try {
                        $psi = New-Object System.Diagnostics.ProcessStartInfo
                        $psi.FileName = (Join-Path $env:WINDIR 'explorer.exe')
                        $psi.Arguments = '/select,"' + $full + '"'
                        $psi.UseShellExecute = $true
                        [System.Diagnostics.Process]::Start($psi) | Out-Null
                        Write-Response -Stream $Stream -Type 'application/json; charset=utf-8' -Body (Json-Bytes @{ok=$true;path=$full})
                    } catch {
                        Write-Response -Stream $Stream -Status 500 -Type 'application/json; charset=utf-8' -Body (Json-Bytes @{ok=$false;error=$_.Exception.Message})
                    }
                } else {
                    Write-Response -Stream $Stream -Status 404 -Type 'application/json; charset=utf-8' -Body (Json-Bytes @{ok=$false;error='File not found or invalid path'})
                }
            }
            elseif ($Path -eq '/api/status') {
                $Age = if ($script:LastPoll -eq [DateTime]::MinValue) {999999} else {([DateTime]::UtcNow - $script:LastPoll).TotalSeconds}
                Write-Response -Stream $Stream -Type 'application/json; charset=utf-8' -Body (Json-Bytes @{
                    alive=$true
                    clientActive=($Age -lt 5)
                    clientAge=[Math]::Round($Age,2)
                    pid=$PID
                    port=$ActualPort
                })
            }
            else {
                Write-Response -Stream $Stream -Status 404
            }
        }
        catch {
            Log ("Request error: "+$_.Exception.Message)
        }
        finally {
            try { if ($Stream) {$Stream.Dispose()} } catch {}
            try { if ($Client) {$Client.Close()} } catch {}
        }
    }
}
finally {
    try {$Listener.Stop()} catch {}
    try {
        if(Test-Path -LiteralPath $PidFile){
            $p=(Get-Content -LiteralPath $PidFile -Raw).Trim()
            if($p -eq [string]$PID){Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue}
        }
    } catch {}
    try {
        if(Test-Path -LiteralPath $PortFile){
            $p=(Get-Content -LiteralPath $PortFile -Raw).Trim()
            if($p -eq [string]$ActualPort){Remove-Item -LiteralPath $PortFile -Force -ErrorAction SilentlyContinue}
        }
    } catch {}
    Log 'Server stopped'
}
