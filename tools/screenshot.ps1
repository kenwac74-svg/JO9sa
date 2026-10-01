# 잭오나인 게임 창을 잠시 맨 앞으로 올려 PNG로 캡처하고 경로를 출력하는 스크립트(창이 없으면 오류)
param(
    [string]$Out = (Join-Path $env:TEMP 'jo9_shot.png'),
    [string]$Title = 'Jack',
    [string]$ProcessName = 'jack'
)
Add-Type -AssemblyName System.Drawing
Add-Type @'
using System; using System.Runtime.InteropServices;
public class W {
  [StructLayout(LayoutKind.Sequential)] public struct R { public int L, T, Rt, B; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out R r);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int cmd);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr insertAfter, int x, int y, int cx, int cy, uint flags);
}
'@
[W]::SetProcessDPIAware() | Out-Null

$p = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue |
    Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -like "*$Title*" } |
    Select-Object -First 1
if (-not $p) { throw "게임 창을 찾지 못했습니다. 프로세스='$ProcessName', 제목='$Title'" }
$flags = 0x0001 -bor 0x0002 -bor 0x0040
$bmp = $null
$g = $null
if (-not [W]::SetWindowPos($p.MainWindowHandle, [IntPtr](-1), 0, 0, 0, 0, $flags)) { throw '게임 창을 캡처 앞으로 가져오지 못했습니다.' }
try {
  if ([W]::IsIconic($p.MainWindowHandle)) { [W]::ShowWindow($p.MainWindowHandle, 9) | Out-Null }
  [W]::SetForegroundWindow($p.MainWindowHandle) | Out-Null
  Start-Sleep -Milliseconds 500
  $r = New-Object W+R
  [W]::GetWindowRect($p.MainWindowHandle, [ref]$r) | Out-Null
  $x = $r.L; $y = $r.T; $w = $r.Rt - $r.L; $h = $r.B - $r.T
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen($x, $y, 0, 0, $bmp.Size)
  $bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
  if ($g) { $g.Dispose() }
  if ($bmp) { $bmp.Dispose() }
  [W]::SetWindowPos($p.MainWindowHandle, [IntPtr](-2), 0, 0, 0, 0, $flags) | Out-Null
}
Write-Output $Out
