# Text Workshop 전용 로컬 서버. jack.qsp 읽기, 해시 확인, 백업, 교체, 검증, 롤백, 기록만 담당한다.
param([int]$Port = 0)

$ErrorActionPreference = 'Stop'
$TextDir = $PSScriptRoot
$ModTools = Split-Path -Parent $TextDir
$GameDir = Split-Path -Parent $ModTools
$QspFile = Join-Path $GameDir 'jack.qsp'
$Runtime = Join-Path $TextDir 'runtime'
$BackupRoot = Join-Path $TextDir 'backups'
$HistoryFile = Join-Path $TextDir 'history.json'
$ScreenFile = Join-Path $Runtime 'screen.html'
$PidFile = Join-Path $Runtime 'server.pid'
$PortFile = Join-Path $Runtime 'port.txt'
$LogFile = Join-Path $Runtime 'server.log'
$IdleTimeoutSeconds = 90
$StartupGraceSeconds = 30
$MaxBodyBytes = 64MB

New-Item -ItemType Directory -Force -Path $Runtime | Out-Null
New-Item -ItemType Directory -Force -Path $BackupRoot | Out-Null

function Log([string]$Text) {
    try { Add-Content -LiteralPath $LogFile -Value ("$(Get-Date -Format 'HH:mm:ss.fff')  " + $Text) -Encoding UTF8 } catch {}
}

function Sha256File([string]$Path) {
    $sha = [Security.Cryptography.SHA256]::Create()
    $fs = [IO.File]::Open($Path, 'Open', 'Read', 'ReadWrite')
    try { return ([BitConverter]::ToString($sha.ComputeHash($fs)) -replace '-', '').ToLowerInvariant() }
    finally { $fs.Dispose(); $sha.Dispose() }
}
function Sha256Bytes([byte[]]$Bytes) {
    $sha = [Security.Cryptography.SHA256]::Create()
    try { return ([BitConverter]::ToString($sha.ComputeHash($Bytes)) -replace '-', '').ToLowerInvariant() }
    finally { $sha.Dispose() }
}

function Write-Response {
    param($Stream, [int]$Status = 200, [string]$Type = 'application/json; charset=utf-8', [byte[]]$Body = @(), [hashtable]$Extra = @{})
    $reason = switch ($Status) { 200 {'OK'} 400 {'Bad Request'} 404 {'Not Found'} 409 {'Conflict'} default {'Error'} }
    $head = "HTTP/1.1 $Status $reason`r`nContent-Type: $Type`r`nContent-Length: $($Body.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n"
    foreach ($k in $Extra.Keys) { $head += "${k}: $($Extra[$k])`r`n" }
    $head += "`r`n"
    $hb = [Text.Encoding]::ASCII.GetBytes($head)
    $Stream.Write($hb, 0, $hb.Length)
    # 큰 응답(jack.qsp 약 17MB)은 나눠 쓰고, 송신 종료 후 상대가 닫을 때까지 기다린다.
    # 바로 Close하면 Windows에서 남은 데이터가 버려져 응답이 잘린다.
    $off = 0
    while ($off -lt $Body.Length) {
        $n = [Math]::Min(65536, $Body.Length - $off)
        $Stream.Write($Body, $off, $n)
        $off += $n
    }
    $Stream.Flush()
    try {
        $script:CurClient.Client.Shutdown([Net.Sockets.SocketShutdown]::Send)
        $script:CurClient.ReceiveTimeout = 5000
        $drain = New-Object byte[] 1024
        while ($Stream.Read($drain, 0, 1024) -gt 0) {}
    } catch {}
}
function Json-Bytes($Object) { [Text.Encoding]::UTF8.GetBytes(($Object | ConvertTo-Json -Compress -Depth 8)) }
function Send-Json($Stream, [int]$Status, $Object) { Write-Response -Stream $Stream -Status $Status -Body (Json-Bytes $Object) }

function Query-Value([string]$Target, [string]$Name) {
    $i = $Target.IndexOf('?')
    if ($i -lt 0) { return '' }
    foreach ($part in $Target.Substring($i + 1).Split('&')) {
        if (-not $part) { continue }
        $kv = $part.Split('=', 2)
        if ([Uri]::UnescapeDataString($kv[0].Replace('+', ' ')) -eq $Name) {
            if ($kv.Count -lt 2) { return '' }
            return [Uri]::UnescapeDataString($kv[1].Replace('+', ' '))
        }
    }
    return ''
}

# 요청 헤더를 바이트 단위로 읽는다(본문이 버퍼에 먹히지 않게 StreamReader를 쓰지 않는다).
function Read-Request($In) {
    $sb = New-Object Text.StringBuilder
    while ($true) {
        $b = $In.ReadByte()
        if ($b -lt 0) { return $null }
        [void]$sb.Append([char]$b)
        $n = $sb.Length
        if ($b -eq 10 -and $n -ge 4 -and $sb[$n - 2] -eq [char]13 -and $sb[$n - 3] -eq [char]10 -and $sb[$n - 4] -eq [char]13) { break }
        if ($sb.Length -gt 262144) { throw 'header too large' }
    }
    $lines = $sb.ToString().Split("`r`n", [StringSplitOptions]::RemoveEmptyEntries)
    $req = @{ Method = ''; Target = '/'; Headers = @{} }
    $p = $lines[0].Split(' ')
    $req.Method = $p[0]
    if ($p.Count -ge 2) { $req.Target = $p[1] }
    for ($i = 1; $i -lt $lines.Count; $i++) {
        $c = $lines[$i].IndexOf(':')
        if ($c -gt 0) { $req.Headers[$lines[$i].Substring(0, $c).Trim().ToLowerInvariant()] = $lines[$i].Substring($c + 1).Trim() }
    }
    return $req
}
function Read-Body($In, $Req) {
    $len = 0
    if ($Req.Headers.ContainsKey('content-length')) { $len = [int]$Req.Headers['content-length'] }
    if ($len -le 0 -or $len -gt $MaxBodyBytes) { throw "invalid content-length $len" }
    $buf = New-Object byte[] $len
    $got = 0
    while ($got -lt $len) {
        $n = $In.Read($buf, $got, $len - $got)
        if ($n -le 0) { throw 'body truncated' }
        $got += $n
    }
    return $buf
}

# ---- 기록 ------------------------------------------------------------------
function Load-History {
    if (-not (Test-Path -LiteralPath $HistoryFile)) { return @() }
    try {
        $raw = [IO.File]::ReadAllText($HistoryFile, [Text.Encoding]::UTF8)
        if ([string]::IsNullOrWhiteSpace($raw)) { return @() }
        # Windows PowerShell 5.1은 JSON 배열을 한 개체로 돌려줘 이중 배열이 되므로 평탄화한다.
        $out = @()
        foreach ($a in @(ConvertFrom-Json -InputObject $raw)) { $out += $a }
        return $out
    } catch { Log ("history read failed: " + $_.Exception.Message); return @() }
}
function Save-History($List) {
    $arr = @($List)
    $json = if ($arr.Count -eq 0) { '[]' } else { ConvertTo-Json -InputObject $arr -Depth 8 }
    $tmp = $HistoryFile + '.tmp'
    [IO.File]::WriteAllText($tmp, $json, (New-Object Text.UTF8Encoding($false)))
    Move-Item -LiteralPath $tmp -Destination $HistoryFile -Force
}

# ---- 적용 ------------------------------------------------------------------
function Do-Apply($Stream, $Req, [byte[]]$Body) {
    $baseSha = ([string]$Req.Headers['x-tw-base']).ToLowerInvariant()
    $afterSha = ([string]$Req.Headers['x-tw-after']).ToLowerInvariant()
    if ($baseSha -notmatch '^[0-9a-f]{64}$' -or $afterSha -notmatch '^[0-9a-f]{64}$') {
        Send-Json $Stream 400 @{ ok = $false; error = 'bad_headers'; message = '해시 헤더가 올바르지 않습니다.' }; return
    }
    $meta = $null
    try {
        $metaJson = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String([string]$Req.Headers['x-tw-meta']))
        $meta = ConvertFrom-Json -InputObject $metaJson
    } catch {
        Send-Json $Stream 400 @{ ok = $false; error = 'bad_meta'; message = '변경 내역을 읽을 수 없습니다.' }; return
    }
    if (-not (Test-Path -LiteralPath $QspFile)) {
        Send-Json $Stream 404 @{ ok = $false; error = 'no_qsp'; message = 'jack.qsp를 찾을 수 없습니다.' }; return
    }
    # 적용 직전 원본 해시 재확인
    $cur = Sha256File $QspFile
    if ($cur -ne $baseSha) {
        Log "apply refused: source changed cur=$cur base=$baseSha"
        Send-Json $Stream 409 @{ ok = $false; error = 'source_changed'; message = '원본 소스가 Workshop을 연 이후 변경되었습니다. 안전을 위해 적용을 중단했습니다.' }; return
    }
    if ((Sha256Bytes $Body) -ne $afterSha) {
        Send-Json $Stream 400 @{ ok = $false; error = 'body_hash'; message = '전송된 데이터의 해시가 일치하지 않습니다.' }; return
    }

    $id = (Get-Date -Format 'yyyyMMdd_HHmmss') + '_' + ([Guid]::NewGuid().ToString('N').Substring(0, 6))
    $bdir = Join-Path $BackupRoot $id
    $bfile = Join-Path $bdir 'jack.qsp'
    $tmp = $QspFile + '.tw_tmp'
    $restored = $false
    try {
        New-Item -ItemType Directory -Force -Path $bdir | Out-Null
        [IO.File]::Copy($QspFile, $bfile, $false)
        if ((Sha256File $bfile) -ne $baseSha) { throw '백업 검증 실패' }

        [IO.File]::WriteAllBytes($tmp, $Body)
        if ((Sha256File $tmp) -ne $afterSha) { throw '임시 파일 검증 실패' }
        [IO.File]::Copy($tmp, $QspFile, $true)
        Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
        if ((Sha256File $QspFile) -ne $afterSha) { throw '저장 결과 검증 실패' }
    } catch {
        $err = $_.Exception.Message
        Log ("apply failed: $err; restoring")
        try { Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue } catch {}
        try {
            if ((Test-Path -LiteralPath $bfile) -and ((Sha256File $QspFile) -ne $baseSha)) {
                [IO.File]::Copy($bfile, $QspFile, $true)
            }
            $restored = ((Sha256File $QspFile) -eq $baseSha)
        } catch { Log ("restore failed: " + $_.Exception.Message) }
        Send-Json $Stream 500 @{ ok = $false; error = 'apply_failed'; detail = $err; restored = $restored
            message = $(if ($restored) { "수정 실패: 원본 상태로 자동 복구했습니다. 게임 파일은 수정 전 상태입니다. ($err)" } else { "수정 실패이며 자동 복구도 확인하지 못했습니다. 백업: $bfile ($err)" }) }
        return
    }

    $entry = [ordered]@{
        id = $id
        time = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
        label = [string]$meta.label
        baseSha = $baseSha
        afterSha = $afterSha
        backup = "backups/$id/jack.qsp"
        status = 'applied'
        entries = @($meta.entries)
    }
    $warn = ''
    try { $h = @(Load-History); $h += [pscustomobject]$entry; Save-History $h } catch { $warn = '기록 저장 실패: ' + $_.Exception.Message; Log $warn }
    Log "applied id=$id entries=$(@($meta.entries).Count)"
    Send-Json $Stream 200 @{ ok = $true; id = $id; afterSha = $afterSha; warning = $warn }
}

# ---- 롤백 ------------------------------------------------------------------
function Do-Rollback($Stream, [string]$Id) {
    $h = @(Load-History)
    $e = $h | Where-Object { $_.id -eq $Id } | Select-Object -First 1
    if (-not $e) { Send-Json $Stream 404 @{ ok = $false; error = 'no_entry'; message = '해당 작업 기록이 없습니다.' }; return }
    if ($e.status -ne 'applied') { Send-Json $Stream 409 @{ ok = $false; error = 'not_applied'; message = '이미 되돌린 작업입니다.' }; return }
    $bfile = Join-Path $TextDir $e.backup
    if (-not (Test-Path -LiteralPath $bfile)) { Send-Json $Stream 404 @{ ok = $false; error = 'no_backup'; message = '백업 파일이 없습니다.' }; return }
    $cur = Sha256File $QspFile
    if ($cur -ne $e.afterSha) {
        Send-Json $Stream 409 @{ ok = $false; error = 'later_changes'; message = '이 파일에는 이후 다른 변경이 있습니다. 자동 복구를 중단했습니다.' }; return
    }
    if ((Sha256File $bfile) -ne $e.baseSha) {
        Send-Json $Stream 409 @{ ok = $false; error = 'backup_corrupt'; message = '백업 파일의 해시가 기록과 다릅니다. 복구를 중단했습니다.' }; return
    }
    try {
        [IO.File]::Copy($bfile, $QspFile, $true)
        if ((Sha256File $QspFile) -ne $e.baseSha) { throw '복구 결과 검증 실패' }
    } catch {
        $err = $_.Exception.Message
        Log "rollback failed: $err"
        try { [IO.File]::Copy($bfile, $QspFile, $true) } catch {}
        Send-Json $Stream 500 @{ ok = $false; error = 'rollback_failed'; message = "되돌리기 실패: $err" }; return
    }
    foreach ($x in $h) { if ($x.id -eq $Id) { $x.status = 'rolled_back' } }
    $warn = ''
    try { Save-History $h } catch { $warn = '기록 갱신 실패: ' + $_.Exception.Message }
    Log "rolled back id=$Id"
    Send-Json $Stream 200 @{ ok = $true; sha = $e.baseSha; warning = $warn }
}

# ---- 서버 루프 ---------------------------------------------------------------
$Listener = New-Object System.Net.Sockets.TcpListener([Net.IPAddress]::Loopback, $Port)
$Listener.Start()
$ActualPort = [int]$Listener.LocalEndpoint.Port
Set-Content -LiteralPath $PidFile -Value $PID -Encoding ASCII
Set-Content -LiteralPath $PortFile -Value $ActualPort -Encoding ASCII
Log "Server started PID=$PID port=$ActualPort game=$GameDir"

$script:LastPoll = [DateTime]::MinValue
$StartedAt = [DateTime]::UtcNow

try {
    while ($true) {
        $now = [DateTime]::UtcNow
        if ($script:LastPoll -eq [DateTime]::MinValue) {
            if (($now - $StartedAt).TotalSeconds -gt $StartupGraceSeconds) { Log 'No browser heartbeat during startup grace; exiting'; break }
        } elseif (($now - $script:LastPoll).TotalSeconds -gt $IdleTimeoutSeconds) { Log 'Browser heartbeat timed out; exiting'; break }

        if (-not $Listener.Pending()) { Start-Sleep -Milliseconds 50; continue }

        $Client = $null; $Stream = $null
        try {
            $Client = $Listener.AcceptTcpClient()
            $script:CurClient = $Client
            $Client.ReceiveTimeout = 30000
            $Client.SendTimeout = 30000
            $Stream = $Client.GetStream()
            $In = New-Object IO.BufferedStream($Stream, 65536)
            $Req = Read-Request $In
            if (-not $Req) { continue }
            $Target = $Req.Target
            $Path = ($Target -split '\?')[0]

            if ($Path -eq '/' -or $Path -eq '/JO9_Text_Workshop.html') {
                Write-Response -Stream $Stream -Type 'text/html; charset=utf-8' -Body ([IO.File]::ReadAllBytes((Join-Path $TextDir 'JO9_Text_Workshop.html')))
            }
            elseif ($Path -eq '/tw_core.js') {
                Write-Response -Stream $Stream -Type 'application/javascript; charset=utf-8' -Body ([IO.File]::ReadAllBytes((Join-Path $TextDir 'tw_core.js')))
            }
            elseif ($Path -eq '/api/ping') {
                $script:LastPoll = [DateTime]::UtcNow
                Send-Json $Stream 200 @{ ok = $true }
            }
            elseif ($Path -eq '/api/status') {
                $Age = if ($script:LastPoll -eq [DateTime]::MinValue) { 999999 } else { ([DateTime]::UtcNow - $script:LastPoll).TotalSeconds }
                Send-Json $Stream 200 @{ alive = $true; clientActive = ($Age -lt 8); port = $ActualPort }
            }
            elseif ($Path -eq '/api/state') {
                $script:LastPoll = [DateTime]::UtcNow
                $has = Test-Path -LiteralPath $QspFile
                $scr = ''
                if (Test-Path -LiteralPath $ScreenFile) { $scr = (Get-Item -LiteralPath $ScreenFile).LastWriteTimeUtc.ToString('o') }
                Send-Json $Stream 200 @{ ok = $true; qspExists = $has; qspSize = $(if ($has) { (Get-Item -LiteralPath $QspFile).Length } else { 0 }); screenUpdated = $scr }
            }
            elseif ($Path -eq '/api/screen') {
                if (Test-Path -LiteralPath $ScreenFile) {
                    Write-Response -Stream $Stream -Type 'text/html; charset=utf-8' -Body ([IO.File]::ReadAllBytes($ScreenFile))
                } else { Write-Response -Stream $Stream -Status 404 -Body (Json-Bytes @{ ok = $false; error = 'no_screen' }) }
            }
            elseif ($Path -eq '/api/qsp') {
                if (Test-Path -LiteralPath $QspFile) {
                    $bytes = [IO.File]::ReadAllBytes($QspFile)
                    Write-Response -Stream $Stream -Type 'application/octet-stream' -Body $bytes -Extra @{ 'X-TW-Sha256' = (Sha256Bytes $bytes) }
                } else { Write-Response -Stream $Stream -Status 404 -Body (Json-Bytes @{ ok = $false; error = 'no_qsp' }) }
            }
            elseif ($Path -eq '/api/history') {
                Send-Json $Stream 200 @{ ok = $true; items = @(Load-History) }
            }
            elseif ($Path -eq '/api/apply' -and $Req.Method -eq 'POST') {
                $Body = Read-Body $In $Req
                Do-Apply $Stream $Req $Body
            }
            elseif ($Path -eq '/api/rollback' -and $Req.Method -eq 'POST') {
                Do-Rollback $Stream (Query-Value $Target 'id')
            }
            else { Write-Response -Stream $Stream -Status 404 }
        }
        catch {
            Log ("Request error: " + $_.Exception.Message)
            try { if ($Stream) { Send-Json $Stream 500 @{ ok = $false; error = 'server_error'; message = '서버 오류: ' + $_.Exception.Message } } } catch {}
        }
        finally {
            try { if ($Stream) { $Stream.Dispose() } } catch {}
            try { if ($Client) { $Client.Close() } } catch {}
        }
    }
}
finally {
    try { $Listener.Stop() } catch {}
    try { if ((Test-Path -LiteralPath $PidFile) -and ((Get-Content -LiteralPath $PidFile -Raw).Trim() -eq [string]$PID)) { Remove-Item -LiteralPath $PidFile -Force } } catch {}
    try { if ((Test-Path -LiteralPath $PortFile) -and ((Get-Content -LiteralPath $PortFile -Raw).Trim() -eq [string]$ActualPort)) { Remove-Item -LiteralPath $PortFile -Force } } catch {}
    Log 'Server stopped'
}
