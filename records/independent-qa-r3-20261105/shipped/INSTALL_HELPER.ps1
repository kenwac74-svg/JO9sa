[CmdletBinding()]
param([string]$TargetRoot, [switch]$NonInteractive)

Set-StrictMode -Version 2
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$ExpectedManifestSha256 = 'cf1d5210fcc9baea45a7eff82fb261ce8482e5b0ae51d2ef9f6cd91a88187700'
$scriptRootFull = [IO.Path]::GetFullPath($PSScriptRoot)
$jsonStage = $null
$jsonRollback = $null
$targetJson = $null
$targetGame = $null
$runtimeRollback = $null
$runtimeChanges = @()
$oldJsonMoved = $false
$newJsonActive = $false
$completed = $false

function Join-Under([string]$Base, [string]$Relative) {
    if ([string]::IsNullOrWhiteSpace($Relative) -or $Relative -match '[\\:<>"|?*\x00-\x1F]') { throw '잘못된 파일 경로입니다.' }
    if ([IO.Path]::IsPathRooted($Relative)) { throw '절대 경로는 허용하지 않습니다.' }
    foreach ($piece in $Relative.Split('/')) {
        if (-not $piece -or $piece -eq '.' -or $piece -eq '..' -or $piece.EndsWith('.') -or $piece.EndsWith(' ')) { throw '잘못된 상대 경로입니다.' }
        if ($piece -match '^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)') { throw '예약된 파일 이름입니다.' }
    }
    $baseFull = [IO.Path]::GetFullPath($Base).TrimEnd('\')
    $full = [IO.Path]::GetFullPath((Join-Path $baseFull $Relative.Replace('/', '\')))
    if (-not $full.StartsWith($baseFull + '\', [StringComparison]::OrdinalIgnoreCase)) { throw '파일 경로가 설치 범위를 벗어납니다.' }
    return $full
}

function Assert-NoLinkAncestors([string]$Path) {
    $cursor = [IO.Path]::GetFullPath($Path)
    while ($cursor) {
        if (Test-Path -LiteralPath $cursor) {
            $item = Get-Item -LiteralPath $cursor -Force
            if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw ('링크/정션 경로는 자동 설치할 수 없습니다: ' + $cursor) }
        }
        $parent = [IO.Path]::GetDirectoryName($cursor)
        if ($parent -eq $cursor) { break }
        $cursor = $parent
    }
}

function Assert-NoLinkTree([string]$Root) {
    if (-not (Test-Path -LiteralPath $Root)) { return }
    Assert-NoLinkAncestors $Root
    $pending = New-Object 'System.Collections.Generic.Stack[string]'
    $pending.Push($Root)
    while ($pending.Count -gt 0) {
        $dir = $pending.Pop()
        foreach ($item in Get-ChildItem -LiteralPath $dir -Force) {
            if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw ('링크/정션 항목은 자동 교체할 수 없습니다: ' + $item.FullName) }
            if ($item.PSIsContainer) { $pending.Push($item.FullName) }
        }
    }
}

function Remove-TaskTree([string]$Root, [string]$GameRoot) {
    $full = [IO.Path]::GetFullPath($Root)
    $gameFull = [IO.Path]::GetFullPath($GameRoot).TrimEnd('\')
    if ([IO.Path]::GetDirectoryName($full) -ne $gameFull -or [IO.Path]::GetFileName($full) -notmatch '^(json|runtime)\.__jo9_(stage|rollback)_[0-9a-f]{32}$') { throw '임시 폴더 정리 범위가 잘못됐습니다.' }
    if (Test-Path -LiteralPath $full) {
        Assert-NoLinkTree $full
        Remove-Item -LiteralPath $full -Recurse -Force
    }
}

function File-Hash([string]$Path) {
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Ensure-Directory([string]$Path) {
    Assert-NoLinkAncestors $Path
    [IO.Directory]::CreateDirectory($Path) | Out-Null
}

function Is-GameRoot([string]$Root) {
    if (-not $Root) { return $false }
    return ((Test-Path -LiteralPath (Join-Path $Root 'Jack-o-nine-tails.exe') -PathType Leaf) -and (Test-Path -LiteralPath (Join-Path $Root 'game/jack.qsp') -PathType Leaf))
}

try {
    if (-not $TargetRoot) {
        foreach ($candidate in @($scriptRootFull, [IO.Path]::GetDirectoryName($scriptRootFull))) {
            if (Is-GameRoot $candidate) { $TargetRoot = $candidate; break }
        }
    }
    if (-not $TargetRoot) {
        if ($NonInteractive) { throw '설치할 기존 게임 폴더를 지정해야 합니다.' }
        Add-Type -AssemblyName System.Windows.Forms
        $dialog = New-Object Windows.Forms.FolderBrowserDialog
        $dialog.Description = '기존 2.4.1 게임의 Jack-o-nine-tails.exe가 있는 폴더를 선택하세요.'
        $dialog.ShowNewFolderButton = $false
        try {
            if ($dialog.ShowDialog() -ne [Windows.Forms.DialogResult]::OK) { Write-Host '설치를 취소했습니다.'; exit 2 }
            $TargetRoot = $dialog.SelectedPath
        } finally { $dialog.Dispose() }
    }
    $TargetRoot = [IO.Path]::GetFullPath($TargetRoot).TrimEnd('\')
    if ($TargetRoot -eq [IO.Path]::GetPathRoot($TargetRoot).TrimEnd('\') -or -not (Is-GameRoot $TargetRoot)) { throw '기존 게임 EXE와 game/jack.qsp가 있는 폴더를 선택하세요.' }
    Assert-NoLinkAncestors $TargetRoot
    $targetGame = Join-Under $TargetRoot 'game'
    $targetJson = Join-Under $targetGame 'json'
    if ((Test-Path -LiteralPath $targetJson) -and -not (Test-Path -LiteralPath $targetJson -PathType Container)) { throw 'game/json 경로가 폴더가 아닙니다.' }
    if ($scriptRootFull.StartsWith($targetJson + '\', [StringComparison]::OrdinalIgnoreCase) -or $scriptRootFull.Equals($targetJson, [StringComparison]::OrdinalIgnoreCase)) { throw '패치 압축은 game/json 폴더 밖에 풀어 주세요.' }
    Assert-NoLinkTree $targetJson
    foreach ($process in @(Get-Process -Name 'Jack-o-nine-tails','jack' -ErrorAction SilentlyContinue)) {
        $processPath = $null
        try { $processPath = $process.Path } catch { }
        if ($processPath -and $processPath.StartsWith($TargetRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw '게임을 완전히 종료한 뒤 다시 설치하세요.' }
    }

    $manifestPath = Join-Under $scriptRootFull 'PATCH_MANIFEST.json'
    Assert-NoLinkAncestors $manifestPath
    if ((File-Hash $manifestPath) -ne $ExpectedManifestSha256) { throw '패치 파일 목록이 손상되었거나 바뀌었습니다. ZIP을 다시 풀어 주세요.' }
    $manifest = [IO.File]::ReadAllText($manifestPath, [Text.Encoding]::UTF8) | ConvertFrom-Json
    if ($manifest.schema -ne 1 -or @($manifest.files).Count -lt 3) { throw '패치 명세 형식이 잘못됐습니다.' }
    $seen = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
    $entries = @()
    foreach ($file in $manifest.files) {
        $rel = [string]$file.path
        $source = Join-Under $scriptRootFull $rel
        if (-not $seen.Add($rel)) { throw '패치에 중복 파일 경로가 있습니다.' }
        $kind = [string]$file.kind
        $valid = ($kind -eq 'qsp' -and $rel -ceq 'game/jack.qsp') -or ($kind -eq 'json' -and $rel -cmatch '^game/json/.+\.json$') -or ($kind -eq 'image' -and $rel -cmatch '^game/content/pic/.+\.png$')
        if (-not $valid -or ([string]$file.sha256) -notmatch '^[0-9a-fA-F]{64}$' -or [long]$file.bytes -lt 0) { throw '허용되지 않는 패치 파일 항목입니다.' }
        Assert-NoLinkAncestors $source
        if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw ('패치 파일이 없습니다: ' + $rel) }
        $info = Get-Item -LiteralPath $source
        if ($info.Length -ne [long]$file.bytes -or (File-Hash $source) -ne ([string]$file.sha256).ToLowerInvariant()) { throw ('패치 파일이 손상되었거나 바뀌었습니다: ' + $rel) }
        $dest = Join-Under $TargetRoot $rel
        Assert-NoLinkAncestors $dest
        if ((Test-Path -LiteralPath $dest) -and -not (Test-Path -LiteralPath $dest -PathType Leaf)) { throw ('파일 대신 폴더가 있습니다: ' + $rel) }
        $entries += [PSCustomObject]@{path=$rel; source=$source; destination=$dest; kind=$kind; bytes=[long]$file.bytes; sha256=([string]$file.sha256).ToLowerInvariant()}
    }
    if (@($entries | Where-Object { $_.kind -eq 'qsp' }).Count -ne 1 -or @($entries | Where-Object { $_.kind -eq 'json' }).Count -eq 0 -or @($entries | Where-Object { $_.kind -eq 'image' }).Count -eq 0) { throw '필수 패치 구성요소가 빠졌습니다.' }
    # Check existing output files before any writes, including exclusive game locks.
    foreach ($entry in $entries | Where-Object { $_.kind -ne 'json' }) {
        if (Test-Path -LiteralPath $entry.destination -PathType Leaf) {
            $stream = [IO.File]::Open($entry.destination, [IO.FileMode]::Open, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
            $stream.Dispose()
        }
    }
    Write-Host ('설치 대상: ' + $TargetRoot)
    Write-Host '패치 파일 검증 완료. JSON 전체를 새 데이터로 교체합니다.'
    $id = [Guid]::NewGuid().ToString('N')
    $jsonStage = Join-Under $targetGame ('json.__jo9_stage_' + $id)
    $jsonRollback = Join-Under $targetGame ('json.__jo9_rollback_' + $id)
    $runtimeRollback = Join-Under $targetGame ('runtime.__jo9_rollback_' + $id)
    if ((Test-Path -LiteralPath $jsonStage) -or (Test-Path -LiteralPath $jsonRollback) -or (Test-Path -LiteralPath $runtimeRollback)) { throw '임시 작업 폴더가 이미 있습니다.' }
    Ensure-Directory $jsonStage
    $jsonEntries = @($entries | Where-Object { $_.kind -eq 'json' })
    foreach ($entry in $jsonEntries) {
        $relative = $entry.path.Substring('game/json/'.Length)
        $to = Join-Under $jsonStage $relative
        Ensure-Directory ([IO.Path]::GetDirectoryName($to))
        Copy-Item -LiteralPath $entry.source -Destination $to
        if ((File-Hash $to) -ne $entry.sha256) { throw 'JSON 임시 복사 검증에 실패했습니다.' }
    }
    # This engine may keep optional player configuration here; do not distribute it.
    $savedConfig = Join-Under $targetJson 'save_config.json'
    $stagedConfig = Join-Under $jsonStage 'save_config.json'
    if ((Test-Path -LiteralPath $savedConfig -PathType Leaf) -and -not (Test-Path -LiteralPath $stagedConfig)) {
        Assert-NoLinkAncestors $savedConfig
        Copy-Item -LiteralPath $savedConfig -Destination $stagedConfig
        if ((File-Hash $savedConfig) -ne (File-Hash $stagedConfig)) { throw '기존 설정 보존에 실패했습니다.' }
    }
    foreach ($entry in $entries | Where-Object { $_.kind -ne 'json' }) {
        if (-not $entry.source.Equals($entry.destination, [StringComparison]::OrdinalIgnoreCase)) {
            $beforePath = $null
            $beforeHash = $null
            if (Test-Path -LiteralPath $entry.destination -PathType Leaf) {
                $beforePath = Join-Under $runtimeRollback $entry.path.Substring('game/'.Length)
                Ensure-Directory ([IO.Path]::GetDirectoryName($beforePath))
                $beforeHash = File-Hash $entry.destination
                Copy-Item -LiteralPath $entry.destination -Destination $beforePath
                if ((File-Hash $beforePath) -ne $beforeHash) { throw '설치 전 파일 보관 확인에 실패했습니다.' }
            }
            $runtimeChanges += [PSCustomObject]@{destination=$entry.destination; beforePath=$beforePath; beforeHash=$beforeHash}
            Ensure-Directory ([IO.Path]::GetDirectoryName($entry.destination))
            Copy-Item -LiteralPath $entry.source -Destination $entry.destination -Force
        }
        if ((File-Hash $entry.destination) -ne $entry.sha256) { throw ('설치 파일 확인에 실패했습니다: ' + $entry.path) }
    }
    if (Test-Path -LiteralPath $targetJson) {
        Assert-NoLinkTree $targetJson
        [IO.Directory]::Move($targetJson, $jsonRollback)
        $oldJsonMoved = $true
    }
    [IO.Directory]::Move($jsonStage, $targetJson)
    $newJsonActive = $true
    foreach ($entry in $jsonEntries) {
        if ((File-Hash $entry.destination) -ne $entry.sha256) { throw '설치된 JSON 확인에 실패했습니다.' }
    }
    $completed = $true
    if ($oldJsonMoved) {
        try { Remove-TaskTree $jsonRollback $targetGame } catch { Write-Host ('설치는 완료됐지만 임시 폴더 정리가 필요합니다: ' + $jsonRollback) }
    }
    if ($runtimeRollback -and (Test-Path -LiteralPath $runtimeRollback)) {
        try { Remove-TaskTree $runtimeRollback $targetGame } catch { Write-Host ('설치는 완료됐지만 임시 폴더 정리가 필요합니다: ' + $runtimeRollback) }
    }
    Write-Host ('설치 완료: ' + $entries.Count + '개 파일, JSON ' + $jsonEntries.Count + '개') -ForegroundColor Green
    Write-Host '기존 게임 EXE로 실행하세요. 세이브 폴더는 변경하지 않았습니다.'
    Write-Output 'JO9_INSTALL_OK'
    exit 0
} catch {
    $errorText = $_.Exception.Message
    if (-not $completed) {
        $runtimeRestored = $true
        for ($i = $runtimeChanges.Count - 1; $i -ge 0; $i--) {
            $change = $runtimeChanges[$i]
            try {
                Assert-NoLinkAncestors $change.destination
                if ($change.beforePath) {
                    Copy-Item -LiteralPath $change.beforePath -Destination $change.destination -Force
                    if ((File-Hash $change.destination) -ne $change.beforeHash) { throw '복원 해시 불일치' }
                } elseif (Test-Path -LiteralPath $change.destination) {
                    Remove-Item -LiteralPath $change.destination -Force
                }
            } catch {
                $runtimeRestored = $false
                Write-Host ('파일 복원 확인이 필요합니다: ' + $change.destination) -ForegroundColor Red
            }
        }
        if ($runtimeRestored -and $runtimeRollback -and (Test-Path -LiteralPath $runtimeRollback)) {
            try { Remove-TaskTree $runtimeRollback $targetGame } catch { Write-Host ('임시 복원 자료: ' + $runtimeRollback) }
        }
        try {
            if ($newJsonActive -and (Test-Path -LiteralPath $targetJson)) {
                $failedJson = Join-Under $targetGame ('json.__jo9_stage_' + [Guid]::NewGuid().ToString('N'))
                [IO.Directory]::Move($targetJson, $failedJson)
                Remove-TaskTree $failedJson $targetGame
            }
            if ($oldJsonMoved -and (Test-Path -LiteralPath $jsonRollback) -and -not (Test-Path -LiteralPath $targetJson)) { [IO.Directory]::Move($jsonRollback, $targetJson) }
        } catch { Write-Host ('JSON 복구 확인이 필요합니다: ' + $_.Exception.Message) -ForegroundColor Red }
    }
    Write-Host ('설치하지 못했습니다: ' + $errorText) -ForegroundColor Red
    Write-Host '게임을 실행하지 말고 원인을 확인한 뒤 다시 설치하거나 수동 방식을 사용하세요.'
    exit 1
} finally {
    if ($jsonStage -and $targetGame -and (Test-Path -LiteralPath $jsonStage)) {
        try { Remove-TaskTree $jsonStage $targetGame } catch { Write-Host ('임시 폴더 확인: ' + $jsonStage) }
    }
}
