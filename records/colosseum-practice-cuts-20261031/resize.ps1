$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$plan = Get-Content -LiteralPath 'G:/Codex/tmp/colosseum-practice-cuts-20261031/prepared.json' -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($row in $plan.files) {
    if (Test-Path -LiteralPath $row.staged) { throw "Staged image exists: $($row.staged)" }
    if ($row.sourceWidth -eq 795 -and $row.sourceHeight -eq 596) {
        Copy-Item -LiteralPath $row.source -Destination $row.staged
        continue
    }
    $sourceImage = [Drawing.Image]::FromFile($row.source)
    $resizedImage = New-Object Drawing.Bitmap 795,596
    $canvas = [Drawing.Graphics]::FromImage($resizedImage)
    $attributes = New-Object Drawing.Imaging.ImageAttributes
    try {
        $canvas.CompositingMode = [Drawing.Drawing2D.CompositingMode]::SourceCopy
        $canvas.CompositingQuality = [Drawing.Drawing2D.CompositingQuality]::HighQuality
        $canvas.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $canvas.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $attributes.SetWrapMode([Drawing.Drawing2D.WrapMode]::TileFlipXY)
        $rect = New-Object Drawing.Rectangle 0,0,795,596
        $canvas.DrawImage($sourceImage, $rect, 0, 0, $sourceImage.Width, $sourceImage.Height, [Drawing.GraphicsUnit]::Pixel, $attributes)
        $resizedImage.Save($row.staged, [Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $attributes.Dispose()
        $canvas.Dispose()
        $resizedImage.Dispose()
        $sourceImage.Dispose()
    }
}
Write-Output 'Four supplied images staged at 795x596; originals retained.'
