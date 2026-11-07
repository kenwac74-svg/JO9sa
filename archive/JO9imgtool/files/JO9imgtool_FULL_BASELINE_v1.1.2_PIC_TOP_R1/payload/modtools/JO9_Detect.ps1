param()

$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$GameDir = Split-Path -Parent $Root
$Runtime = Join-Path $Root 'runtime'
$ContextFile = Join-Path $Runtime 'context.json'
$LogFile = Join-Path $Runtime 'detect.log'
$ViewerFile = Join-Path $Runtime 'viewer_hwnd.txt'
$FilterFile = Join-Path $Root 'filters.json'
$ServerScript = Join-Path $Root 'JO9_Server.ps1'
$ToolFile = Join-Path $Root 'place\JO9_Place_Workshop.html'
$ConfigFile = Join-Path $Root 'config.json'
$PortFile = Join-Path $Runtime 'port.txt'
$script:CurrentPort = 0

New-Item -ItemType Directory -Force -Path $Runtime | Out-Null

function Load-ToolConfig {
    $r = @{
        retryCount = 2
        retryDelayMilliseconds = 220
        showFailurePopup = $true
        showHtmlKeySequence = @('ALT','RIGHT','RIGHT','DOWN','DOWN','ENTER')
        startupWaitMilliseconds = 5000
        logMaxKB = 512
    }
    try {
        if(Test-Path -LiteralPath $ConfigFile){
            $c=Get-Content -LiteralPath $ConfigFile -Raw | ConvertFrom-Json
            if($c.detect.retryCount){$r.retryCount=[int]$c.detect.retryCount}
            if($c.detect.retryDelayMilliseconds){$r.retryDelayMilliseconds=[int]$c.detect.retryDelayMilliseconds}
            if($null -ne $c.detect.showFailurePopup){$r.showFailurePopup=[bool]$c.detect.showFailurePopup}
            if($c.detect.showHtmlKeySequence){$r.showHtmlKeySequence=@($c.detect.showHtmlKeySequence | ForEach-Object {[string]$_})}
            if($c.server.startupWaitMilliseconds){$r.startupWaitMilliseconds=[int]$c.server.startupWaitMilliseconds}
            if($c.logs.maxKilobytes){$r.logMaxKB=[int]$c.logs.maxKilobytes}
        }
    } catch {}
    return $r
}

$ToolConfig = Load-ToolConfig

function Rotate-DetectLog {
    try {
        if(Test-Path -LiteralPath $LogFile){
            $max=[int64]$ToolConfig.logMaxKB*1024
            if((Get-Item -LiteralPath $LogFile).Length -gt $max){
                $old=$LogFile+'.1'
                Remove-Item -LiteralPath $old -Force -ErrorAction SilentlyContinue
                Move-Item -LiteralPath $LogFile -Destination $old -Force
            }
        }
    } catch {}
}
Rotate-DetectLog

function Log([string]$Text) {
    try {
        $stamp = [DateTime]::Now.ToString('HH:mm:ss.fff')
        Add-Content -LiteralPath $LogFile -Value "$stamp  $Text" -Encoding UTF8
    } catch {}
}

function Write-Context([hashtable]$Data) {
    $Data.version = 17
    $Data.updated = [DateTime]::UtcNow.ToString('o')
    $Tmp = $ContextFile + '.tmp'
    $Json = $Data | ConvertTo-Json -Depth 8
    [IO.File]::WriteAllText($Tmp,$Json,[Text.UTF8Encoding]::new($false))
    Move-Item -LiteralPath $Tmp -Destination $ContextFile -Force
}

function Read-ServerPort {
    try {
        if(Test-Path -LiteralPath $PortFile){
            $t=(Get-Content -LiteralPath $PortFile -Raw).Trim()
            if($t -match '^\d+$'){
                $p=[int]$t
                if($p -ge 1 -and $p -le 65535){return $p}
            }
        }
    } catch {}
    return 0
}

function Server-Status([int]$ServerPort) {
    if($ServerPort -le 0){return $null}
    try {
        Invoke-RestMethod -Uri ("http://127.0.0.1:$ServerPort/api/status?t=" + [DateTime]::UtcNow.Ticks) -TimeoutSec 1
    } catch { $null }
}

function Ensure-Server {
    $p=Read-ServerPort
    if($p -gt 0){
        $s=Server-Status $p
        if($s -and $s.alive){
            $script:CurrentPort=$p
            return $s
        }
    }

    try {Remove-Item -LiteralPath $PortFile -Force -ErrorAction SilentlyContinue} catch {}

    Log 'Starting workshop server on a dynamic loopback port'
    Start-Process -FilePath 'powershell.exe' -WindowStyle Hidden -ArgumentList @(
        '-NoProfile','-ExecutionPolicy','Bypass',
        '-File',"`"$ServerScript`"",
        '-Port','0'
    ) | Out-Null

    $limit=[Math]::Max(1000,[int]$ToolConfig.startupWaitMilliseconds)
    $elapsed=0
    while($elapsed -lt $limit){
        Start-Sleep -Milliseconds 100
        $elapsed+=100
        $p=Read-ServerPort
        if($p -gt 0){
            $s=Server-Status $p
            if($s -and $s.alive){
                $script:CurrentPort=$p
                Log ("Workshop server is alive on port "+$p)
                return $s
            }
        }
    }
    Log 'Workshop server failed to start'
    return $null
}

function Open-Tool-OneShot([hashtable]$Context) {
    $q = New-Object System.Collections.Generic.List[string]
    function Q([string]$k,[string]$v) {
        if ($null -eq $v) {$v=''}
        $q.Add(([Uri]::EscapeDataString($k)+'='+[Uri]::EscapeDataString([string]$v)))
    }
    Q 'mode' 'place'
    Q 'status' $Context.status
    Q 'place' $Context.place
    Q 'bg' $Context.bg.key
    Q 'bgPath' $Context.bg.path
    Q 'bgFile' $Context.bg.file
    Q 'bgSize' ([string]$Context.bg.size)
    Q 'bgWidth' ([string]$Context.bg.width)
    Q 'bgHeight' ([string]$Context.bg.height)
    Q 'npc' $Context.npc.key
    Q 'npcPath' $Context.npc.path
    Q 'npcFile' $Context.npc.file
    Q 'npcSize' ([string]$Context.npc.size)
    Q 'npcWidth' ([string]$Context.npc.width)
    Q 'npcHeight' ([string]$Context.npc.height)
    if ($Context.error) { Q 'detectError' $Context.error }
    $u = ([Uri]::new($ToolFile)).AbsoluteUri + '?' + ($q -join '&')
    Start-Process $u
}

function Show-Tool([hashtable]$Context) {
    $s = Ensure-Server
    if ($s -and $s.alive -and $script:CurrentPort -gt 0) {
        $BaseUrl = "http://127.0.0.1:$($script:CurrentPort)/"
        if (-not $s.clientActive) {
            Log 'No active workshop page; opening one browser page'
            Start-Process $BaseUrl
        } else {
            Log 'Existing workshop page active; context only'
        }
    } else {
        Log 'Persistent server unavailable; one-shot fallback'
        try {
            Open-Tool-OneShot $Context
        } catch {
            try {
                [System.Windows.Forms.MessageBox]::Show(
                    'JO9 Image Workshop을 열지 못했습니다. detect.log를 확인하세요.',
                    'JO9 Image Workshop'
                ) | Out-Null
            } catch {}
        }
    }
}

function Asset-Info([string]$Rel) {
    $r = @{path=$Rel;key='';file='';size=0;width=0;height=0}
    if ([string]::IsNullOrWhiteSpace($Rel)) { return $r }

    $r.file = [IO.Path]::GetFileName($Rel)
    $r.key = [IO.Path]::GetFileNameWithoutExtension($Rel)
    $Full = Join-Path $GameDir ($Rel -replace '/', '\')

    if (Test-Path -LiteralPath $Full) {
        try {$r.size=[int64](Get-Item -LiteralPath $Full).Length} catch {}
        try {
            Add-Type -AssemblyName System.Drawing -ErrorAction SilentlyContinue
            $Img=[System.Drawing.Image]::FromFile($Full)
            try {$r.width=$Img.Width;$r.height=$Img.Height} finally {$Img.Dispose()}
        } catch {}
    }
    return $r
}

function Normalize([string]$s) {
    if ([string]::IsNullOrWhiteSpace($s)) { return '' }
    $p=$s -replace '\\','/'
    $m=[regex]::Match($p,'(?i)(content/pic/.+)$')
    if ($m.Success) { return ($m.Groups[1].Value -replace '[?#].*$','') }
    return ''
}

function Fail([string]$Message) {
    Log ("FAIL: " + $Message)
    $ctx=@{
        status='detect_failed';error=$Message;place=''
        bg=@{path='';key='';file='';size=0;width=0;height=0}
        npc=@{path='';key='';file='';size=0;width=0;height=0}
        resources=@()
        hiddenFolders=@(Load-HiddenFolders)
        hiddenFilePatterns=@(Load-HiddenFilePatterns)
    }
    Write-Context $ctx
    if($ToolConfig.showFailurePopup){
        try {
            [System.Windows.Forms.MessageBox]::Show(
                $Message,
                'JO9 Image Workshop - 감지 오류',
                [System.Windows.Forms.MessageBoxButtons]::OK,
                [System.Windows.Forms.MessageBoxIcon]::Warning
            ) | Out-Null
        } catch {}
    }
    Show-Tool $ctx
    exit 0
}

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

Add-Type @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public static class JO9Win32 {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

    [DllImport("user32.dll")]
    public static extern bool IsWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter,
        int X, int Y, int cx, int cy, uint uFlags);

    [DllImport("user32.dll")]
    public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

    public const uint KEYEVENTF_KEYUP = 0x0002;
    public const uint SWP_NOSIZE = 0x0001;
    public const uint SWP_NOZORDER = 0x0004;
    public const uint SWP_NOACTIVATE = 0x0010;

    public static IntPtr[] ProcessWindows(uint pid) {
        var list = new List<IntPtr>();
        EnumWindows((h, l) => {
            uint p;
            GetWindowThreadProcessId(h, out p);
            if (p == pid && IsWindow(h)) list.Add(h);
            return true;
        }, IntPtr.Zero);
        return list.ToArray();
    }

    public static void Key(byte vk) {
        keybd_event(vk,0,0,UIntPtr.Zero);
        System.Threading.Thread.Sleep(35);
        keybd_event(vk,0,KEYEVENTF_KEYUP,UIntPtr.Zero);
        System.Threading.Thread.Sleep(55);
    }

    public static void CtrlKey(byte vk) {
        keybd_event(0x11,0,0,UIntPtr.Zero);
        System.Threading.Thread.Sleep(25);
        Key(vk);
        keybd_event(0x11,0,KEYEVENTF_KEYUP,UIntPtr.Zero);
        System.Threading.Thread.Sleep(80);
    }
}
'@

function Invoke-ShowHtml {
    $map=@{
        'ALT'=0x12
        'RIGHT'=0x27
        'DOWN'=0x28
        'LEFT'=0x25
        'UP'=0x26
        'ENTER'=0x0D
        'ESC'=0x1B
    }
    foreach($name in @($ToolConfig.showHtmlKeySequence)){
        $k=([string]$name).Trim().ToUpperInvariant()
        if($map.ContainsKey($k)){
            [JO9Win32]::Key([byte]$map[$k])
        } else {
            Log ("Unknown key in config: "+$k)
        }
    }
    Log ('Show html key sequence sent: '+(@($ToolConfig.showHtmlKeySequence) -join ','))
}

function Read-ViewerByUIA([IntPtr]$Hwnd) {
    try {
        if (-not [JO9Win32]::IsWindow($Hwnd)) { return '' }
        $ae=[System.Windows.Automation.AutomationElement]::FromHandle($Hwnd)
        if ($null -eq $ae) { return '' }

        $docCond=New-Object System.Windows.Automation.OrCondition(
            (New-Object System.Windows.Automation.PropertyCondition(
                [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
                [System.Windows.Automation.ControlType]::Document
            )),
            (New-Object System.Windows.Automation.PropertyCondition(
                [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
                [System.Windows.Automation.ControlType]::Edit
            ))
        )

        $el=$ae.FindFirst([System.Windows.Automation.TreeScope]::Descendants,$docCond)
        if ($null -eq $el) { return '' }

        $tp=$el.GetCurrentPattern([System.Windows.Automation.TextPattern]::Pattern)
        if ($null -eq $tp) { return '' }

        return $tp.DocumentRange.GetText(-1)
    } catch {
        return ''
    }
}

function Read-ViewerByClipboard([IntPtr]$Hwnd) {
    try {
        if (-not [JO9Win32]::IsWindow($Hwnd)) { return '' }
        [JO9Win32]::SetForegroundWindow($Hwnd) | Out-Null
        Start-Sleep -Milliseconds 80
        [System.Windows.Forms.Clipboard]::Clear()
        [JO9Win32]::CtrlKey(0x41)
        [JO9Win32]::CtrlKey(0x43)
        Start-Sleep -Milliseconds 100
        return [System.Windows.Forms.Clipboard]::GetText()
    } catch {
        return ''
    }
}

function Is-HTML([string]$Text) {
    return (-not [string]::IsNullOrWhiteSpace($Text)) -and
           ($Text -match '(?is)<head|<body|content/pic/')
}

function Close-Viewer-Normally([IntPtr]$Hwnd) {
    try {
        if ([JO9Win32]::IsWindow($Hwnd)) {
            [JO9Win32]::PostMessage($Hwnd,0x0010,[IntPtr]::Zero,[IntPtr]::Zero) | Out-Null
            Start-Sleep -Milliseconds 80
        }
    } catch {}
}


function Load-HiddenFolders {
    $result = @('ui','buttons')
    try {
        if (Test-Path -LiteralPath $FilterFile) {
            $cfg = Get-Content -LiteralPath $FilterFile -Raw | ConvertFrom-Json
            if ($cfg.hiddenFolders) {
                $result = @($cfg.hiddenFolders | ForEach-Object { ([string]$_).Trim().ToLowerInvariant() } | Where-Object { $_ })
            }
        }
    } catch {}
    return @($result)
}

function Load-HiddenFilePatterns {
    $result = @('money_counter*.png','menu_button*.png','menu_buttons*.png','padding*.png','hurt_*.png','A_P1*.png')
    try {
        if (Test-Path -LiteralPath $FilterFile) {
            $cfg = Get-Content -LiteralPath $FilterFile -Raw | ConvertFrom-Json
            if ($cfg.hiddenFilePatterns) {
                $result = @($cfg.hiddenFilePatterns | ForEach-Object { ([string]$_).Trim() } | Where-Object { $_ })
            }
        }
    } catch {}
    return @($result)
}

function Top-Pic-Folder([string]$Path) {
    if ([string]::IsNullOrWhiteSpace($Path)) { return '' }
    $p = $Path -replace '\\','/'
    $m = [regex]::Match($p,'(?i)^content/pic/(.+)$')
    if (-not $m.Success) { return '' }
    $rel = $m.Groups[1].Value
    if ($rel -notmatch '/') { return 'pic root' }
    return ($rel -split '/')[0]
}

$Mutex = New-Object Threading.Mutex($false,'Local\JO9_PlaceWorkshop_Detect')
$LockTaken = $false

try {
    $LockTaken = $Mutex.WaitOne(0)
    if (-not $LockTaken) { exit 0 }

    Log '--- Detect start ---'

    $Candidates = @(Get-Process -Name 'jack' -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowHandle -ne 0})
    if (-not $Candidates.Count) {
        $Candidates = @(Get-Process -ErrorAction SilentlyContinue | Where-Object {
            $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -like 'Jack-o-nine-tails*'
        })
    }
    if (-not $Candidates.Count) { Fail 'JO9 game window not found' }

    $Proc = $Candidates |
        Sort-Object @{Expression={if($_.MainWindowTitle -like 'Jack-o-nine-tails*'){0}else{1}}} |
        Select-Object -First 1

    $PidTarget=[uint32]$Proc.Id
    $MainHwnd=[IntPtr]$Proc.MainWindowHandle
    Log ("Game PID="+$PidTarget+" HWND="+$MainHwnd)

    # Invoke original Other -> Show html.
    # Exact keys are externalized in config.json.
    [JO9Win32]::SetForegroundWindow($MainHwnd) | Out-Null
    Start-Sleep -Milliseconds 140
    Invoke-ShowHtml

    # Reuse the static QTextEdit HWND if known.
    $Html=''
    $Viewer=[IntPtr]::Zero

    if (Test-Path -LiteralPath $ViewerFile) {
        try {
            $raw=(Get-Content -LiteralPath $ViewerFile -Raw).Trim()
            if ($raw -match '^\d+$') {
                $saved=[IntPtr]([int64]$raw)
                if ([JO9Win32]::IsWindow($saved)) {
                    $pidCheck=[uint32]0
                    [void][JO9Win32]::GetWindowThreadProcessId($saved,[ref]$pidCheck)
                    if ($pidCheck -eq $PidTarget) {
                        Log ("Trying cached viewer HWND="+$saved)
                        Start-Sleep -Milliseconds 120
                        $Text=Read-ViewerByUIA $saved
                        if (Is-HTML $Text) {
                            $Viewer=$saved
                            $Html=$Text
                            Log 'Cached viewer read by UIA'
                        } else {
                            $Text=Read-ViewerByClipboard $saved
                            if (Is-HTML $Text) {
                                $Viewer=$saved
                                $Html=$Text
                                Log 'Cached viewer read by clipboard fallback'
                            }
                        }
                    }
                }
            }
        } catch {}
    }

    # If cache fails, scan all secondary windows.
    if (-not $Html) {
        for ($Try=0; $Try -lt 45 -and -not $Html; $Try++) {
            Start-Sleep -Milliseconds 80
            $Wins=[JO9Win32]::ProcessWindows($PidTarget)

            foreach ($w in $Wins) {
                if ($w -eq $MainHwnd) { continue }

                $Text=Read-ViewerByUIA $w
                if (Is-HTML $Text) {
                    $Viewer=$w
                    $Html=$Text
                    Log ("Viewer found by UIA HWND="+$w)
                    break
                }

                if ([JO9Win32]::IsWindowVisible($w)) {
                    $Text=Read-ViewerByClipboard $w
                    if (Is-HTML $Text) {
                        $Viewer=$w
                        $Html=$Text
                        Log ("Viewer found by clipboard HWND="+$w)
                        break
                    }
                }
            }
        }
    }

    if (-not $Html -and [int]$ToolConfig.retryCount -gt 1) {
        for($Retry=2; $Retry -le [int]$ToolConfig.retryCount -and -not $Html; $Retry++){
            Log ("Viewer read retry "+$Retry+"/"+$ToolConfig.retryCount)
            Start-Sleep -Milliseconds ([int]$ToolConfig.retryDelayMilliseconds)
            [JO9Win32]::SetForegroundWindow($MainHwnd) | Out-Null
            Start-Sleep -Milliseconds 100
            Invoke-ShowHtml

            for ($Try=0; $Try -lt 35 -and -not $Html; $Try++) {
                Start-Sleep -Milliseconds 80
                $Wins=[JO9Win32]::ProcessWindows($PidTarget)
                foreach ($w in $Wins) {
                    if ($w -eq $MainHwnd) { continue }
                    $Text=Read-ViewerByUIA $w
                    if (Is-HTML $Text) {
                        $Viewer=$w
                        $Html=$Text
                        Log ("Retry found viewer by UIA HWND="+$w)
                        break
                    }
                    if ([JO9Win32]::IsWindowVisible($w)) {
                        $Text=Read-ViewerByClipboard $w
                        if (Is-HTML $Text) {
                            $Viewer=$w
                            $Html=$Text
                            Log ("Retry found viewer by clipboard HWND="+$w)
                            break
                        }
                    }
                }
            }
        }
    }

    if (-not $Html) {
        Fail 'Show html was invoked, but the reused QTextEdit could not be read'
    }

    Log ("HTML captured, chars="+$Html.Length)

    # Save static QTextEdit handle for the next detection.
    try {
        Set-Content -LiteralPath $ViewerFile -Value ([int64]$Viewer) -Encoding ASCII
    } catch {}

    # Keep the static QTextEdit alive, but move it far off-screen.
    # showHtml() will update the SAME QTextEdit on later detections.
    Close-Viewer-Normally $Viewer
    try {[JO9Win32]::SetForegroundWindow($MainHwnd) | Out-Null} catch {}

    $RawMatches=[regex]::Matches(
        $Html,
        '(?i)content[\\/]+pic[\\/]+[^"''<>\)\r\n]+?\.(?:png|jpg|jpeg|webp|gif)'
    )

    Log ("Raw resource refs="+$RawMatches.Count)
    $HiddenFolders = @(Load-HiddenFolders)
    $HiddenFilePatterns = @(Load-HiddenFilePatterns)

    # Keep ALL detected resources. Display filtering belongs to the HTML UI,
    # so "모든 이미지 보기" can reveal everything without re-detecting.
    $Seen = @{}
    $Resources = @()

    foreach ($rm in $RawMatches) {
        $p = Normalize ([string]$rm.Value)
        if (-not $p) { continue }

        $dedupe = $p.ToLowerInvariant()
        if ($Seen.ContainsKey($dedupe)) { continue }
        $Seen[$dedupe] = $true

        $info = Asset-Info $p
        $full = ''
        try { $full = [IO.Path]::GetFullPath((Join-Path $GameDir ($p -replace '/', '\'))) } catch {}

        $Resources += [pscustomobject]@{
            path = [string]$info.path
            key = [string]$info.key
            file = [string]$info.file
            folder = [string](Top-Pic-Folder $p)
            size = [int64]$info.size
            width = [int]$info.width
            height = [int]$info.height
            fullPath = [string]$full
        }
    }
    Log ("All detected resources="+$Resources.Count)

    $BgPath=''
    $NpcPath=''
    foreach ($r in $Resources) {
        if ($r.path -match '(?i)^content/pic/bg/[^/]+\.(png|jpg|jpeg|webp|gif)$') {$BgPath=$r.path}
        if ($r.path -match '(?i)^content/pic/characters/[^/]+\.(png|jpg|jpeg|webp|gif)$') {$NpcPath=$r.path}
    }
    if (-not $NpcPath) {
        foreach ($r in $Resources) {
            if ($r.path -match '(?i)^content/pic/girls/full/[^/]+\.(png|jpg|jpeg|webp|gif)$') {$NpcPath=$r.path}
        }
    }

    $Bg=Asset-Info $BgPath
    $Npc=Asset-Info $NpcPath
    $Status=if($Resources.Count -gt 0){'ok'}else{'no_resources'}
    $Ctx=@{
        status=$Status
        error=''
        place=''
        bg=$Bg
        npc=$Npc
        resources=@($Resources)
        hiddenFolders=@($HiddenFolders)
        hiddenFilePatterns=@($HiddenFilePatterns)
    }

    Write-Context $Ctx
    Log ("Detected resources="+$Resources.Count+" hiddenFolders="+($HiddenFolders -join ','))
    Show-Tool $Ctx
    Log '--- Detect complete ---' 
}
catch {
    try {
        Log ("EXCEPTION TYPE: "+$_.Exception.GetType().FullName)
        Log ("EXCEPTION: "+$_.Exception.Message)
        if ($_.InvocationInfo) {
            Log ("POSITION: "+$_.InvocationInfo.PositionMessage.Replace("`r"," ").Replace("`n"," "))
        }
        Fail $_.Exception.Message
    } catch {}
}
finally {
    try {if($LockTaken){$Mutex.ReleaseMutex()}} catch {}
    try {$Mutex.Dispose()} catch {}
}
exit 0
