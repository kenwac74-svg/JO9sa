# mods\*.json 패치 기록을 jack.qsp에 edit 단위로 왕복 검증·백업과 함께 멱등 적용하는 스크립트(Python 불필요)
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

# edit 단위로 멱등 적용한다. 해시는 참고로만 출력하고 막지 않는다(여러 세션이 따로 만든 mods를 순서와 무관하게 적용하기 위해).
# 왕복 검증: 읽고 수정 없이 다시 쓴 결과가 원본과 바이트 동일해야 한다.
$lines = [Jo9Qsp]::Split($raw)
if (-not [Jo9Qsp]::Same([Jo9Qsp]::Join($lines), $raw)) { throw '왕복 검증 실패: 수정 없이 다시 쓴 결과가 원본과 다릅니다. 쓰지 않았습니다.' }
$index = Get-LocationIndex $lines
Write-Host "왕복 검증 통과 (location $($index.Count)개)"

$offset = @{ 'desc' = 1; 'body' = 2 }
$changed = 0
foreach ($mod in $mods) {
    if ($mod.before_sha256 -and $hash -eq $mod.before_sha256.ToUpper()) { Write-Host "[참고] $($mod.id): 현재 해시가 기록된 적용 전 해시와 같음" }
    foreach ($e in $mod.edits) {
        $where = "[$($mod.id)] $($e.location).$($e.field)"
        if (-not $index.ContainsKey($e.location)) { throw "$where location을 찾지 못했습니다. 쓰지 않았습니다." }
        if (-not $offset.ContainsKey($e.field)) { throw "$where 지원하지 않는 field입니다(desc, body만 가능). 쓰지 않았습니다." }
        $li = $index[$e.location] + $offset[$e.field]
        $text = [Jo9Qsp]::Shift($lines[$li], 5)
        $want = [int]$e.count
        $nOld = [Jo9Qsp]::Count($text, $e.old)
        $nNew = [Jo9Qsp]::Count($text, $e.new)
        # new가 old를 품으면 적용 후에도 old가 남으므로 new를 먼저 본다. 그 밖에는 old를 먼저 본다.
        $applied = $nNew -eq $want -and ($nOld -eq 0 -or $e.new.Contains($e.old))
        $pending = $nOld -eq $want -and -not ($e.new.Contains($e.old) -and $nNew -eq $want)
        if ($pending) {
            $lines[$li] = [Jo9Qsp]::Shift($text.Replace($e.old, $e.new), -5)
            $changed++
            Write-Host "[적용] $where $nOld 곳 치환"
        } elseif ($applied) {
            Write-Host "[건너뜀] $where 이미 적용됨"
        } else {
            throw "$where old $nOld 번, new $nNew 번 나왔습니다(기대 $want). 적용 상태를 판단할 수 없어 중단합니다. 쓰지 않았습니다."
        }
    }
    $hash = [Jo9Qsp]::Sha256([Jo9Qsp]::Join($lines))
    if ($mod.after_sha256 -and $hash -eq $mod.after_sha256.ToUpper()) { Write-Host "[참고] $($mod.id): 기록된 적용 후 해시와 같음" }
}

if ($changed -eq 0) { Write-Host "모든 edit가 이미 적용돼 있습니다. 쓰지 않았습니다. SHA-256: $hash"; exit 0 }
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
