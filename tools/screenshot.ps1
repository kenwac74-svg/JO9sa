# 잭오나인 게임 창(없으면 전체 화면)을 PNG로 캡처해 경로를 출력하는 스크립트
param(
    [string]$Out = (Join-Path $env:TEMP 'jo9_shot.png'),
    [string]$Title = 'Jack'
)
Add-Type -AssemblyName System.Drawing
Add-Type @'
using System; using System.Runtime.InteropServices;
public class W {
  [StructLayout(LayoutKind.Sequential)] public struct R { public int L, T, Rt, B; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out R r);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
}
'@
[W]::SetProcessDPIAware() | Out-Null

$p = Get-Process | Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -like "*$Title*" } | Select-Object -First 1
if ($p) {
    $r = New-Object W+R
    [W]::GetWindowRect($p.MainWindowHandle, [ref]$r) | Out-Null
    $x = $r.L; $y = $r.T; $w = $r.Rt - $r.L; $h = $r.B - $r.T
} else {
    $s = [System.Windows.Forms.Screen]::PrimaryScreen
    Add-Type -AssemblyName System.Windows.Forms
    $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $x = $b.X; $y = $b.Y; $w = $b.Width; $h = $b.Height
}
$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($x, $y, 0, 0, $bmp.Size)
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output $Out
