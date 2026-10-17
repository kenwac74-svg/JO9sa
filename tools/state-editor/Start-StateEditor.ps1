param([string]$Targets = '', [int]$Port = 0)
$ErrorActionPreference = 'Stop'
$toolDir = $PSScriptRoot
$runtimeDir = Join-Path $toolDir 'runtime'
New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
# JO9 MOD START [state-editor-portable-launch-20261018]
$bundledNode = [IO.Path]::GetFullPath((Join-Path $toolDir '../runtime-bundle/node.exe'))
if (Test-Path -LiteralPath $bundledNode -PathType Leaf) { $nodeExe = $bundledNode } else {
    $nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($nodeCommand) { $nodeExe = $nodeCommand.Source } else {
        $nodeExe = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
        if (-not (Test-Path -LiteralPath $nodeExe -PathType Leaf)) { throw 'Node.js 20 이상이 필요합니다. node.exe를 PATH에 등록하세요.' }
    }
}
if (-not $Targets) {
    $Targets = Join-Path $runtimeDir 'targets.json'
    $repoConfig = Join-Path $toolDir '../../local.config.json'
    if (Test-Path -LiteralPath $repoConfig -PathType Leaf) {
        $local = Get-Content -LiteralPath $repoConfig -Raw -Encoding UTF8 | ConvertFrom-Json
        $workQsp = [IO.Path]::GetFullPath($local.GameQsp)
        $familyDir = Split-Path -Parent ([IO.Path]::GetFullPath($local.GameRoot))
        $fullQsp = Join-Path $familyDir 'Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp'
        $targetList = @(@{ id='work'; label='플레이'; path=$workQsp }, @{ id='full'; label='배포'; path=$fullQsp })
    } else {
        $gameDir = [IO.Path]::GetFullPath((Join-Path $toolDir '../..'))
        $gameQsp = Join-Path $gameDir 'jack.qsp'
        if (-not (Test-Path -LiteralPath $gameQsp -PathType Leaf)) { throw '-Targets로 대상 JSON 경로를 지정하세요.' }
        $targetList = @(@{ id='work'; label='현재 게임'; path=$gameQsp })
    }
    [IO.File]::WriteAllText($Targets, (ConvertTo-Json -InputObject $targetList -Depth 5), [Text.UTF8Encoding]::new($false))
}
# JO9 MOD END [state-editor-portable-launch-20261018]
$Targets = [IO.Path]::GetFullPath($Targets)
$stateFile = Join-Path $runtimeDir 'server.json'
if (Test-Path -LiteralPath $stateFile) {
    try {
        $old = Get-Content -LiteralPath $stateFile -Raw -Encoding UTF8 | ConvertFrom-Json
        $oldProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$([int]$old.pid)" -ErrorAction SilentlyContinue
        $serverPath = Join-Path $toolDir 'server.cjs'
        if ($oldProcess -and $oldProcess.CommandLine.Contains($serverPath) -and $oldProcess.CommandLine.Contains($runtimeDir)) { Stop-Process -Id $old.pid -ErrorAction Stop }
    } catch { Write-Warning '이전 도구 서버의 종료 상태를 확인하지 못했습니다. 새 포트로 실행합니다.' }
}
$server = Join-Path $toolDir 'server.cjs'
$process = Start-Process -FilePath $nodeExe -ArgumentList @(('"' + $server + '"'), '--targets', ('"' + $Targets + '"'), '--runtime', ('"' + $runtimeDir + '"'), '--port', $Port) -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeDir 'server.log') -RedirectStandardError (Join-Path $runtimeDir 'server-error.log')
for ($attempt=0; $attempt -lt 100; $attempt++) {
    if (Test-Path -LiteralPath $stateFile) {
        $state = Get-Content -LiteralPath $stateFile -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($state.pid -eq $process.Id) { Write-Output $state.url; exit 0 }
    }
    if ($process.HasExited) { throw ('서버가 종료되었습니다. 확인: ' + (Join-Path $runtimeDir 'server-error.log')) }
    Start-Sleep -Milliseconds 100
}
throw '서버 시작 시간이 초과되었습니다. runtime/server-error.log를 확인하세요.'
