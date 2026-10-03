# Text Workshop을 설치·제거하고 Image Workshop v1.1.2 PIC_TOP_R1에 최소 연동 3곳을 붙이는 설치기
param(
    [ValidateSet('Install', 'Remove', 'Check')][string]$Action = 'Check',
    [string]$GameRoot = $PSScriptRoot,
    [switch]$Yes
)
$ErrorActionPreference = 'Stop'
$Marker = 'JO9_TEXT_WORKSHOP_HOOK'
$ModTools = Join-Path $GameRoot 'game\modtools'
$TextDir = Join-Path $ModTools 'text'
$HookBackup = Join-Path $TextDir 'hook_backup'
$HooksJson = Join-Path $HookBackup 'hooks.json'
$Payload = Join-Path $PSScriptRoot 'payload\modtools\text'

# 기준본(v1.1.2 PIC_TOP_R1 및 확인된 변형본)의 SHA-256. 이 값들과 다르면 연동을 붙이지 않는다.
$Targets = @(
    @{ Name = 'Detect'; Rel = 'JO9_Detect.ps1'; Shas = @('0045852F0F10415969DE15821C3CB39101F743B0245AD1B0010C8CC81445CBCC') },
    @{ Name = 'Server'; Rel = 'JO9_Server.ps1'; Shas = @('4E92D9D0ADD479C2C720E196731F55D21D795D743AFDFE35A1C6F394350361CD') },
    @{ Name = 'Html'; Rel = 'place\JO9_Place_Workshop.html'; Shas = @('E196E4B403816D7ECB68C793CE2917297263E36C4468CE6CAA485C1DBD00214D', '6A5C7A3851718165C9C3751E3A1E9997304777972C75D377586F0BE903F978CC') }  # 두 번째는 '연동형 경로복구 1.1.3' 변형본
)
$ProgramFiles = @('JO9_Text_Server.ps1', 'JO9_Text_Workshop.html', 'tw_core.js')

function Sha([string]$Path) { (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToUpperInvariant() }
function Say([string]$m) { Write-Host $m }
function Fail([string]$m) { Write-Host ("[중단] " + $m) -ForegroundColor Red; exit 1 }

function Read-Text([string]$Path) {
    $b = [IO.File]::ReadAllBytes($Path)
    $bom = ($b.Length -ge 3 -and $b[0] -eq 0xEF -and $b[1] -eq 0xBB -and $b[2] -eq 0xBF)
    $off = if ($bom) { 3 } else { 0 }
    return @{ Text = [Text.Encoding]::UTF8.GetString($b, $off, $b.Length - $off); Bom = $bom }
}
function Write-Text([string]$Path, [string]$Text, [bool]$Bom) {
    $body = [Text.Encoding]::UTF8.GetBytes($Text)
    $out = if ($Bom) { [byte[]](@(0xEF, 0xBB, 0xBF) + $body) } else { $body }
    [IO.File]::WriteAllBytes($Path, $out)
}
function Insert-At([string]$Text, [string]$Anchor, [string]$Add, [string]$Where) {
    $i = $Text.IndexOf($Anchor)
    if ($i -lt 0 -or $Text.IndexOf($Anchor, $i + 1) -ge 0) { Fail "연동 위치를 정확히 한 곳 찾지 못했습니다: $($Anchor.Substring(0, [Math]::Min(50, $Anchor.Length)))" }
    if ($Where -eq 'after') { return $Text.Insert($i + $Anchor.Length, $Add) }
    if ($Where -eq 'before') { return $Text.Insert($i, $Add) }
    return $Text.Remove($i, $Anchor.Length).Insert($i, $Add)
}

function Hook-Detect([string]$T, [string]$NL) {
    $add = @(
        '    # JO9_TEXT_WORKSHOP_HOOK: 캡처한 화면 HTML을 Text Workshop이 읽을 수 있게 저장',
        '    try {',
        '        $TwRuntime = Join-Path $Root ''text\runtime''',
        '        if (Test-Path -LiteralPath (Join-Path $Root ''text'')) {',
        '            New-Item -ItemType Directory -Force -Path $TwRuntime | Out-Null',
        '            [IO.File]::WriteAllText((Join-Path $TwRuntime ''screen.html''), $Html, [Text.UTF8Encoding]::new($false))',
        '        }',
        '    } catch { Log ("Text Workshop screen save failed: " + $_.Exception.Message) }'
    ) -join $NL
    return Insert-At $T ('    Log ("HTML captured, chars="+$Html.Length)') ($NL + $add) 'after'
}
function Hook-Server([string]$T, [string]$NL) {
    $add = @(
        '            # JO9_TEXT_WORKSHOP_HOOK: Text Workshop 서버를 띄우고 브라우저로 연다',
        '            elseif ($Path -eq ''/api/open-text'') {',
        '                try {',
        '                    $TwScript = Join-Path $Root ''text\JO9_Text_Server.ps1''',
        '                    $TwPortFile = Join-Path $Root ''text\runtime\port.txt''',
        '                    if (-not (Test-Path -LiteralPath $TwScript)) { throw ''Text Workshop이 설치되어 있지 않습니다.'' }',
        '                    $tp = 0; $st = $null',
        '                    for ($try = 0; $try -lt 2 -and -not $st; $try++) {',
        '                        if (Test-Path -LiteralPath $TwPortFile) {',
        '                            $t = (Get-Content -LiteralPath $TwPortFile -Raw).Trim()',
        '                            if ($t -match ''^\d+$'') { $tp = [int]$t; try { $st = Invoke-RestMethod -Uri ("http://127.0.0.1:$tp/api/status") -TimeoutSec 1 } catch { $st = $null } }',
        '                        }',
        '                        if (-not $st -and $try -eq 0) {',
        '                            Remove-Item -LiteralPath $TwPortFile -Force -ErrorAction SilentlyContinue',
        '                            Start-Process -FilePath ''powershell.exe'' -WindowStyle Hidden -ArgumentList @(''-NoProfile'',''-ExecutionPolicy'',''Bypass'',''-File'',"`"$TwScript`"",''-Port'',''0'') | Out-Null',
        '                            for ($w = 0; $w -lt 50 -and -not (Test-Path -LiteralPath $TwPortFile); $w++) { Start-Sleep -Milliseconds 100 }',
        '                        }',
        '                    }',
        '                    if (-not $st) { throw ''Text Workshop 서버를 시작하지 못했습니다.'' }',
        '                    if (-not $st.clientActive) { Start-Process "http://127.0.0.1:$tp/" }',
        '                    Write-Response -Stream $Stream -Type ''application/json; charset=utf-8'' -Body (Json-Bytes @{ok=$true;port=$tp})',
        '                } catch {',
        '                    Write-Response -Stream $Stream -Status 500 -Type ''application/json; charset=utf-8'' -Body (Json-Bytes @{ok=$false;error=$_.Exception.Message})',
        '                }',
        '            }'
    ) -join $NL
    return Insert-At $T ('            elseif ($Path -eq ''/api/status'') {') ($add + $NL) 'before'
}
function Hook-Html([string]$T, [string]$NL) {
    $old = '<span class="badge">인터넷으로 이미지를 보내지 않습니다</span></header>'
    $btn = '<span class="badge">인터넷으로 이미지를 보내지 않습니다</span> <button data-hook="JO9_TEXT_WORKSHOP_HOOK" onclick="fetch(''/api/open-text'').then(function(r){return r.json()}).then(function(j){if(!j.ok)alert(j.error)}).catch(function(){alert(''Text Workshop을 열지 못했습니다. 게임에서 Image Workshop 메뉴로 연 페이지에서만 동작합니다.'')})">텍스트 편집 열기</button></header>'
    return Insert-At $T $old $btn 'replace'
}
$Hooks = @{ Detect = ${function:Hook-Detect}; Server = ${function:Hook-Server}; Html = ${function:Hook-Html} }

function Assert-Game {
    foreach ($t in $Targets) {
        if (-not (Test-Path -LiteralPath (Join-Path $ModTools $t.Rel))) { Fail "Image Workshop 파일이 없습니다: game\modtools\$($t.Rel). 먼저 Image Workshop v1.1.2를 설치하세요." }
    }
}
# Windows PowerShell 5.1에는 -AsHashtable이 없어 직접 해시테이블로 옮긴다.
function Load-Rec {
    $rec = @{}
    if (Test-Path -LiteralPath $HooksJson) {
        $o = Get-Content -LiteralPath $HooksJson -Raw | ConvertFrom-Json
        foreach ($pr in $o.PSObject.Properties) { $rec[$pr.Name] = @{ original = [string]$pr.Value.original; patched = [string]$pr.Value.patched } }
    }
    return $rec
}
function State-Of($t) {
    $p = Join-Path $ModTools $t.Rel
    $r = Read-Text $p
    if ($r.Text.Contains($Marker)) { return 'patched' }
    if ($t.Shas -contains (Sha $p)) { return 'baseline' }
    return 'unknown'
}

switch ($Action) {
    'Check' {
        Assert-Game
        foreach ($t in $Targets) { Say ("{0,-8} {1}" -f $t.Name, (State-Of $t)) }
        Say ('Text Workshop 파일: ' + $(if (Test-Path -LiteralPath (Join-Path $TextDir 'JO9_Text_Server.ps1')) { '설치됨' } else { '없음' }))
    }
    'Install' {
        Assert-Game
        if (-not (Test-Path -LiteralPath (Join-Path $Payload 'JO9_Text_Server.ps1'))) { Fail 'payload\modtools\text 파일이 없습니다. ZIP을 완전히 풀었는지 확인하세요.' }
        $states = @{}
        foreach ($t in $Targets) { $states[$t.Name] = State-Of $t }
        $bad = @($Targets | Where-Object { $states[$_.Name] -eq 'unknown' })
        if ($bad.Count) { Fail ("기준본(v1.1.2 PIC_TOP_R1)과 다른 파일이 있어 연동을 붙이지 않습니다: " + (($bad | ForEach-Object { $_.Rel }) -join ', ') + ". Image Workshop을 먼저 기준본으로 설치/업데이트하세요.") }
        Say '변경 대상:'
        foreach ($t in $Targets) { Say ("  game\modtools\{0}  [{1}]" -f $t.Rel, $states[$t.Name]) }
        Say ('  game\modtools\text\  (Text Workshop 프로그램 ' + $ProgramFiles.Count + '개 복사)')
        Say '게임 파일 jack.qsp는 설치 중에 건드리지 않습니다. 원본 3개는 hook_backup에 보관합니다.'
        if (-not $Yes) { if ((Read-Host '계속하려면 YES 입력') -ne 'YES') { Say '취소했습니다.'; exit 0 } }

        New-Item -ItemType Directory -Force -Path $HookBackup | Out-Null
        $rec = Load-Rec
        foreach ($t in $Targets) {
            $p = Join-Path $ModTools $t.Rel
            if ($states[$t.Name] -eq 'patched') { Say ("  {0}: 이미 연동됨" -f $t.Name); continue }
            $bk = Join-Path $HookBackup ($t.Name + '.orig')
            $srcSha = Sha $p; [IO.File]::Copy($p, $bk, $true)
            if ((Sha $bk) -ne $srcSha) { Fail "백업 검증 실패: $($t.Name)" }
            $r = Read-Text $p
            $nl = if ($r.Text.Contains("`r`n")) { "`r`n" } else { "`n" }
            $new = & $Hooks[$t.Name] $r.Text $nl
            if (-not $new.Contains($Marker)) { Fail "연동 결과 확인 실패: $($t.Name)" }
            Write-Text $p $new $r.Bom
            $rec[$t.Name] = @{ original = $srcSha; patched = (Sha $p) }
            Say ("  {0}: 연동 완료" -f $t.Name)
        }
        ($rec | ConvertTo-Json -Depth 4) | Set-Content -LiteralPath $HooksJson -Encoding UTF8
        New-Item -ItemType Directory -Force -Path $TextDir | Out-Null
        foreach ($f in $ProgramFiles) { Copy-Item -LiteralPath (Join-Path $Payload $f) -Destination (Join-Path $TextDir $f) -Force }
        Say '설치 완료. 게임에서 Other → Image Workshop을 실행한 뒤, 열린 페이지의 [텍스트 편집 열기]를 누르세요.'
        Say '주의: Image Workshop 패치 관리자로 "설치/업데이트"를 다시 실행하면 연동이 덮어써집니다. 그때는 이 설치기를 다시 실행하세요.'
    }
    'Remove' {
        Assert-Game
        if (-not $Yes) { if ((Read-Host 'Text Workshop 연동을 제거하고 Image Workshop 파일을 원상 복구합니다. 계속하려면 YES 입력') -ne 'YES') { Say '취소했습니다.'; exit 0 } }
        $rec = Load-Rec
        foreach ($t in $Targets) {
            $p = Join-Path $ModTools $t.Rel
            $st = State-Of $t
            $bk = Join-Path $HookBackup ($t.Name + '.orig')
            if ($st -ne 'patched') { Say ("  {0}: 연동 상태가 아님({1}), 건드리지 않음" -f $t.Name, $st); continue }
            if (-not (Test-Path -LiteralPath $bk) -or -not ($t.Shas -contains (Sha $bk))) { Say ("  {0}: 백업이 없거나 손상되어 복구하지 못했습니다." -f $t.Name) -ForegroundColor Yellow; continue }
            if ($rec.ContainsKey($t.Name) -and (Sha $p) -ne $rec[$t.Name].patched) { Say ("  {0}: 연동 이후 다른 변경이 있어 자동 복구를 중단했습니다." -f $t.Name) -ForegroundColor Yellow; continue }
            [IO.File]::Copy($bk, $p, $true)
            if ((Sha $p) -ne (Sha $bk)) { Fail "복구 검증 실패: $($t.Name)" }
            Say ("  {0}: 원본으로 복구" -f $t.Name)
        }
        $pidFile = Join-Path $TextDir 'runtime\server.pid'
        if (Test-Path -LiteralPath $pidFile) {
            try { $pp = [int](Get-Content -LiteralPath $pidFile -Raw).Trim(); $pr = Get-Process -Id $pp -ErrorAction SilentlyContinue; if ($pr -and $pr.ProcessName -match 'powershell|pwsh') { Stop-Process -Id $pp -Force } } catch {}
        }
        foreach ($f in $ProgramFiles) { Remove-Item -LiteralPath (Join-Path $TextDir $f) -Force -ErrorAction SilentlyContinue }
        Remove-Item -LiteralPath (Join-Path $TextDir 'runtime') -Recurse -Force -ErrorAction SilentlyContinue
        Say '제거 완료. 텍스트 수정 백업과 기록(text\backups, text\history.json)은 남겨두었습니다.'
        Say '수정한 텍스트를 원래대로 되돌리려면 제거 전에 Text Workshop의 [기록]에서 되돌리세요.'
    }
}
