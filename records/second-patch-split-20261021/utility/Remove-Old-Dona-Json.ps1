#requires -version 5.1
[CmdletBinding()]
param(
    [string]$GameDirectory,
    [Alias('WhatIf')][switch]$DryRun
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2
try { [Console]::OutputEncoding = New-Object Text.UTF8Encoding($false) } catch {}
$deletedCount = 0
$manifestHash = '0b97fff90434e4758705a3e8e82975efd722c6f6e3f835a5a2b64788b087ca42'
# This pinned list is the exact 25-file SEED_NAMESPACE_FIX_20261020 deletion delta.
# No custom manifest, wildcard deletion, game-state change or recursive removal is supported.
function Assert-NoReparse([string]$Path) {
    $cursor = [IO.Path]::GetFullPath($Path)
    while ($cursor) {
        $item = $null
        try { $item = Get-Item -LiteralPath $cursor -Force -ErrorAction Stop }
        catch {
            if ($_.CategoryInfo.Category -ne 'ObjectNotFound') { throw }
        }
        if ($item -and (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0)) {
            throw ('연결 경로(정션/심볼릭 링크)는 사용할 수 없습니다: ' + $cursor)
        }
        $parent = [IO.Directory]::GetParent($cursor)
        if ($null -eq $parent) { break }
        $cursor = $parent.FullName
    }
}
function Safe-Path([string]$Root, [string]$Relative) {
    $full = [IO.Path]::GetFullPath((Join-Path $Root $Relative))
    $prefix = $Root.TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar
    if (-not $full.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw ('게임 폴더 밖 경로를 거부했습니다: ' + $Relative)
    }
    Assert-NoReparse $full
    return $full
}
function Require-File([string]$Path, [string]$Description) {
    $item = Get-Item -LiteralPath $Path -Force -ErrorAction Stop
    if ($item.PSIsContainer) { throw ($Description + '이 파일이 아닙니다: ' + $Path) }
}
function Require-Hash([string]$Path, [string]$Expected, [string]$Description) {
    Require-File $Path $Description
    $stream = [IO.File]::OpenRead($Path)
    $hasher = [Security.Cryptography.SHA256]::Create()
    try { $actual = [BitConverter]::ToString($hasher.ComputeHash($stream)).Replace('-', '').ToLowerInvariant() }
    finally { $stream.Dispose(); $hasher.Dispose() }
    if ($actual -ne $Expected) {
        throw ($Description + '의 내용이 기준과 다릅니다. 파일을 보존하고 중단합니다: ' + $Path)
    }
}
function Resolve-Game([string]$Path) {
    if ([string]::IsNullOrWhiteSpace($Path)) { throw '게임 폴더가 지정되지 않았습니다.' }
    $root = [IO.Path]::GetFullPath($Path.Trim().Trim('"'))
    Assert-NoReparse $root
    $item = Get-Item -LiteralPath $root -Force -ErrorAction Stop
    if (-not $item.PSIsContainer) { throw ('게임 폴더가 아닙니다: ' + $root) }
    Require-File (Safe-Path $root 'jack.qsp') '게임 실행 데이터(jack.qsp)'
    $slaves = Get-Item -LiteralPath (Safe-Path $root 'json/slaves') -Force -ErrorAction Stop
    if (-not $slaves.PSIsContainer) { throw ('json/slaves 폴더가 없습니다: ' + $root) }
    return $root.TrimEnd('\', '/')
}
function Require-Keep([string]$Root, $Row) {
    $path = Safe-Path $Root $Row.keep
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        throw ('정상 번호 파일이 없습니다. 패치를 실제 게임 폴더에 먼저 복사하세요: ' + $Row.keep)
    }
    Require-Hash $path $Row.keep_sha256 '정상 번호 파일'
}
function Choose-Game($Rows) {
    foreach ($candidate in @((Join-Path $PSScriptRoot 'game'), $PSScriptRoot)) {
        try {
            $root = Resolve-Game $candidate
            foreach ($row in $Rows) { Require-Keep $root $row }
            return $root
        } catch {}
    }
    Write-Host '설치된 게임을 자동으로 찾지 못했습니다.'
    Write-Host '패치 전체를 실제 게임 폴더에 복사한 뒤, jack.qsp가 있는 game 폴더를 선택하세요.'
    if ([Environment]::GetCommandLineArgs() -contains '-NonInteractive') {
        throw '자동 선택에 실패했습니다. 실제 game 폴더를 -GameDirectory로 지정해야 합니다.'
    }
    $chosen = $null
    try {
        Add-Type -AssemblyName System.Windows.Forms
        $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
        try {
            $dialog.Description = '설치된 JO9의 game 폴더(jack.qsp와 json/slaves가 있는 폴더)를 선택하세요.'
            $dialog.ShowNewFolderButton = $false
            if ($dialog.ShowDialog() -eq [Windows.Forms.DialogResult]::OK) { $chosen = $dialog.SelectedPath }
            else { throw [OperationCanceledException]::new('폴더 선택을 취소했습니다. 삭제하지 않았습니다.') }
        } finally { $dialog.Dispose() }
    } catch [OperationCanceledException] { throw }
    catch { $chosen = Read-Host '실제 game 폴더의 전체 경로를 입력하세요(빈 입력: 취소)' }
    if ([string]::IsNullOrWhiteSpace($chosen)) { throw '폴더 선택을 취소했습니다. 삭제하지 않았습니다.' }
    return Resolve-Game $chosen
}
try {
    $manifestPath = Join-Path $PSScriptRoot 'dona-json-delete-allowlist.json'
    Assert-NoReparse $manifestPath
    Require-Hash $manifestPath $manifestHash '삭제 목록'
    $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $rows = @($manifest.delete_runtime_files)
    if ($manifest.schema -ne 1 -or $manifest.patchId -ne 'SEED_NAMESPACE_FIX_20261020' -or $rows.Count -ne 25) {
        throw '삭제 목록 형식이 올바르지 않습니다. 배포된 파일을 다시 사용하세요.'
    }
    for ($i = 0; $i -lt 25; $i++) {
        $row = $rows[$i]
        if ($row.file -notmatch '^json/slaves/([0-9]+)_([A-Za-z0-9]+)\.json$') { throw '삭제 목록 경로가 올바르지 않습니다.' }
        $oldId = [int]$Matches[1]; $suffix = $Matches[2]
        if ($oldId -ne (2577 + $i) -or $row.keep -cne ('json/slaves/' + (8877 + $i) + '_' + $suffix + '.json') -or
            $row.only_if_sha256 -notmatch '^[0-9a-f]{64}$' -or $row.keep_sha256 -notmatch '^[0-9a-f]{64}$') {
            throw '삭제 목록의 고정 범위 또는 해시가 올바르지 않습니다.'
        }
    }
    if ($GameDirectory) { $root = Resolve-Game $GameDirectory }
    else { $root = Choose-Game $rows }
    Write-Host ('검사할 게임 폴더: ' + $root)
    $plan = New-Object System.Collections.Generic.List[object]
    $problems = New-Object System.Collections.Generic.List[string]
    # Validate every pair before the first write. A modified old file or bad keep refuses the whole plan.
    foreach ($row in $rows) {
        try {
            $oldPath = Safe-Path $root $row.file
            Require-Keep $root $row
            $old = $null
            try { $old = Get-Item -LiteralPath $oldPath -Force -ErrorAction Stop }
            catch { if ($_.CategoryInfo.Category -ne 'ObjectNotFound') { throw } }
            if ($old) { Require-Hash $oldPath $row.only_if_sha256 '구형 도나 파일' }
            $plan.Add([pscustomobject]@{ Relative=$row.file; Path=$oldPath; Row=$row; Present=($null -ne $old) })
        } catch { $problems.Add($_.Exception.Message) }
    }
    if ($problems.Count -gt 0) {
        throw ("사전 검사에 실패하여 아무 파일도 삭제하지 않았습니다." + [Environment]::NewLine + ($problems -join [Environment]::NewLine))
    }
    $present = @($plan | Where-Object { $_.Present })
    $absentCount = 25 - $present.Count
    Write-Host ('사전 검사 통과: 삭제 대상 ' + $present.Count + '개 / 이미 없음 ' + $absentCount + '개')
    if ($DryRun) {
        foreach ($entry in $present) { Write-Host ('[미리보기] ' + $entry.Relative) }
        Write-Host '미리보기 완료: 파일을 삭제하지 않았습니다.'
        exit 0
    }
    foreach ($entry in $present) {
        # Recheck both hashes and the exact path immediately before literal, nonrecursive deletion.
        Assert-NoReparse $entry.Path
        Require-Hash $entry.Path $entry.Row.only_if_sha256 '삭제 대상'
        Require-Keep $root $entry.Row
        Remove-Item -LiteralPath $entry.Path -ErrorAction Stop
        $deletedCount++
        Write-Host ('[삭제] ' + $entry.Relative)
    }
    Write-Host ('완료: 구형 도나 JSON ' + $deletedCount + '개 삭제 / 이미 없음 ' + $absentCount + '개')
    Write-Host '정상 번호 파일과 같은 번호의 원래 퀘스트 파일은 보존했습니다.'
    exit 0
} catch {
    Write-Host ('정리를 중단했습니다: ' + $_.Exception.Message) -ForegroundColor Red
    if ($deletedCount -gt 0) {
        Write-Host ('중단 전 삭제한 파일: ' + $deletedCount + '개. 권한/잠금 문제를 해결한 뒤 다시 실행할 수 있습니다.')
    }
    exit 1
}

