# mods\*.json 패치 기록을 jack.qsp에 해시 검증·왕복 검증·백업과 함께 멱등 적용하는 스크립트(Python 불필요)
param(
    # 대상 jack.qsp. 비우면 local.config.json의 GameQsp를 쓴다.
    [string]$Qsp = '',
    # 패치 기록 폴더. 파일 이름 순서로 적용한다.
    [string]$ModsDir = (Join-Path (Split-Path -Parent $PSScriptRoot) 'mods'),
    # 쓰지 않고 검증만 한다.
    [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot

if ([string]::IsNullOrWhiteSpace($Qsp)) {
    $configPath = Join-Path $repo 'local.config.json'
    if (-not (Test-Path -LiteralPath $configPath)) { throw "대상 qsp를 -Qsp로 주거나 먼저 tools\setup_pc.ps1을 실행하세요: $configPath" }
    $Qsp = (Get-Content -LiteralPath $configPath -Raw -Encoding UTF8 | ConvertFrom-Json).GameQsp
}
$Qsp = [IO.Path]::GetFullPath($Qsp)
if (-not (Test-Path -LiteralPath $Qsp -PathType Leaf)) { throw "qsp 파일이 없습니다: $Qsp" }

Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Security.Cryptography;
public static class Jo9Qsp {
    public static string Shift(string s, int d) {
        char[] a = s.ToCharArray();
        for (int i = 0; i < a.Length; i++) a[i] = (char)((a[i] + d) & 0xFFFF);
        return new string(a);
    }
    public static string Sha256(byte[] b) {
        using (var h = SHA256.Create()) return BitConverter.ToString(h.ComputeHash(b)).Replace("-", "");
    }
    public static string[] Split(byte[] raw) {
        return Encoding.Unicode.GetString(raw).Split(new[] { "\r\n" }, StringSplitOptions.None);
    }
    public static byte[] Join(string[] lines) {
        return Encoding.Unicode.GetBytes(string.Join("\r\n", lines));
    }
    public static bool Same(byte[] a, byte[] b) {
        if (a.Length != b.Length) return false;
        for (int i = 0; i < a.Length; i++) if (a[i] != b[i]) return false;
        return true;
    }
    public static int Count(string s, string sub) {
        int n = 0, at = 0;
        while ((at = s.IndexOf(sub, at, StringComparison.Ordinal)) >= 0) { n++; at += sub.Length; }
        return n;
    }
}
'@

# location 이름 → 줄 번호(이름 줄). qsp_dump.py와 같은 형식으로 읽는다.
function Get-LocationIndex([string[]]$lines) {
    if ($lines[0] -cne 'QSPGAME') { throw 'QSPGAME 형식이 아닙니다.' }
    $n = [int][Jo9Qsp]::Shift($lines[3], 5)
    $at = 4
    $index = @{}
    for ($k = 0; $k -lt $n; $k++) {
        $index[[Jo9Qsp]::Shift($lines[$at], 5)] = $at
        $acts = [int][Jo9Qsp]::Shift($lines[$at + 3], 5)
        $at += 4 + $acts * 3
    }
    if ($at -ne $lines.Length - 1 -or $lines[$at] -ne '') { throw 'location 구조를 끝까지 읽지 못했습니다.' }
    return $index
}

$mods = @(Get-ChildItem -LiteralPath $ModsDir -Filter '*.json' | Sort-Object Name |
    ForEach-Object { Get-Content -LiteralPath $_.FullName -Raw -Encoding UTF8 | ConvertFrom-Json })
if ($mods.Count -eq 0) { throw "패치 기록이 없습니다: $ModsDir" }

$raw = [IO.File]::ReadAllBytes($Qsp)
$hash = [Jo9Qsp]::Sha256($raw)
Write-Host "대상: $Qsp"
Write-Host "현재 SHA-256: $hash"

# 어디까지 적용됐는지 해시로 판단한다(멱등).
$start = -1
for ($k = $mods.Count - 1; $k -ge 0; $k--) {
    if ($hash -eq $mods[$k].after_sha256.ToUpper()) { $start = $k + 1; break }
}
if ($start -lt 0) {
    if ($hash -eq $mods[0].before_sha256.ToUpper()) { $start = 0 }
    else { throw "예상하지 못한 해시라 중단합니다. 첫 패치($($mods[0].id))의 적용 전 해시 $($mods[0].before_sha256) 또는 어떤 패치의 적용 후 해시와도 같지 않습니다." }
}
for ($k = 0; $k -lt $start; $k++) { Write-Host "[건너뜀] $($mods[$k].id): 이미 적용됨" }
if ($start -ge $mods.Count) { Write-Host '모든 패치가 이미 적용돼 있습니다. 쓰지 않았습니다.'; exit 0 }

# 왕복 검증: 읽고 수정 없이 다시 쓴 결과가 원본과 바이트 동일해야 한다.
$lines = [Jo9Qsp]::Split($raw)
if (-not [Jo9Qsp]::Same([Jo9Qsp]::Join($lines), $raw)) { throw '왕복 검증 실패: 수정 없이 다시 쓴 결과가 원본과 다릅니다. 쓰지 않았습니다.' }
$index = Get-LocationIndex $lines
Write-Host "왕복 검증 통과 (location $($index.Count)개)"

$offset = @{ 'desc' = 1; 'body' = 2 }
for ($k = $start; $k -lt $mods.Count; $k++) {
    $mod = $mods[$k]
    if ($hash -ne $mod.before_sha256.ToUpper()) { throw "[$($mod.id)] 적용 전 해시가 다릅니다. 기대 $($mod.before_sha256), 실제 $hash" }
    foreach ($e in $mod.edits) {
        if (-not $index.ContainsKey($e.location)) { throw "[$($mod.id)] location을 찾지 못했습니다: $($e.location)" }
        if (-not $offset.ContainsKey($e.field)) { throw "[$($mod.id)] 지원하지 않는 field: $($e.field) (desc, body만 가능)" }
        $li = $index[$e.location] + $offset[$e.field]
        $text = [Jo9Qsp]::Shift($lines[$li], 5)
        $found = [Jo9Qsp]::Count($text, $e.old)
        if ($found -ne [int]$e.count) { throw "[$($mod.id)] $($e.location).$($e.field)에서 old 문자열이 $found 번 나왔습니다(기대 $($e.count)). 쓰지 않았습니다." }
        $lines[$li] = [Jo9Qsp]::Shift($text.Replace($e.old, $e.new), -5)
        Write-Host "[적용] $($mod.id): $($e.location).$($e.field) $found 곳 치환"
    }
    $hash = [Jo9Qsp]::Sha256([Jo9Qsp]::Join($lines))
    if ($hash -ne $mod.after_sha256.ToUpper()) { throw "[$($mod.id)] 적용 후 해시가 다릅니다. 기대 $($mod.after_sha256), 실제 $hash. 쓰지 않았습니다." }
}

if ($DryRun) { Write-Host "DryRun: 검증만 통과했고 쓰지 않았습니다. 결과 SHA-256: $hash"; exit 0 }

$backup = "$Qsp.bak_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item -LiteralPath $Qsp -Destination $backup
if ([Jo9Qsp]::Sha256([IO.File]::ReadAllBytes($backup)) -ne [Jo9Qsp]::Sha256($raw)) { throw "백업 검증 실패: $backup. 쓰지 않았습니다." }
Write-Host "백업: $backup"

[IO.File]::WriteAllBytes($Qsp, [Jo9Qsp]::Join($lines))
$written = [Jo9Qsp]::Sha256([IO.File]::ReadAllBytes($Qsp))
if ($written -ne $hash) {
    Copy-Item -LiteralPath $backup -Destination $Qsp -Force
    throw "쓴 파일의 해시가 다릅니다(기대 $hash, 실제 $written). 백업으로 되돌렸습니다."
}
Write-Host "완료. 적용 후 SHA-256: $written"
