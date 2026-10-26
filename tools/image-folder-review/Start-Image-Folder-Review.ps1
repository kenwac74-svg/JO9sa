param(
    [string]$DataDir = 'G:\somi\IMGMG\folder-review',
    [int]$Port = 11332,
    [string]$PythonPath,
    [switch]$NoOpen
)
$ErrorActionPreference = 'Stop'
$candidates = @()
if ($PythonPath) { $candidates += $PythonPath }
$candidates += (Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe')
$systemPython = Get-Command python.exe -ErrorAction SilentlyContinue
if ($systemPython) { $candidates += $systemPython.Source }
$runtimePython = $candidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
if (-not $runtimePython) { throw 'Python 3.12 이상과 Pillow가 필요합니다. -PythonPath로 python.exe를 지정할 수 있습니다.' }
& $runtimePython -c 'import sys; import PIL; assert sys.version_info >= (3,12), "Python 3.12 or later required"'
if ($LASTEXITCODE -ne 0) { throw 'Python 3.12 이상과 Pillow 설치를 확인해 주세요.' }
Push-Location -LiteralPath $PSScriptRoot
try {
    $launchArgs = @('-X','utf8','-m','folder_review.launcher','--data-dir',$DataDir,'--port',[string]$Port)
    if ($NoOpen) { $launchArgs += '--no-open' }
    & $runtimePython @launchArgs
    if ($LASTEXITCODE -ne 0) { throw '이미지 폴더 비교 서버를 시작하지 못했습니다.' }
} finally { Pop-Location }
