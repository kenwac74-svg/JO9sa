param([string]$GameDir='G:\somi\JO9\game', [string]$NodePath='', [switch]$NoBrowser)
$ErrorActionPreference='Stop'
if (!$NodePath) {
    $bundled=Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
    if (Test-Path -LiteralPath $bundled) {$NodePath=$bundled} else {$NodePath=(Get-Command node -ErrorAction Stop).Source}
}
$runtime=Join-Path $PSScriptRoot 'runtime'
New-Item -ItemType Directory -Path $runtime -Force | Out-Null
$ready=Join-Path $runtime 'server.json'
if (Test-Path -LiteralPath $ready) {
    $old=Get-Content -LiteralPath $ready -Raw | ConvertFrom-Json
    try {$active=Get-Process -Id $old.pid -ErrorAction Stop} catch {$active=$null}
    if ($active -and $active.ProcessName -eq 'node') {Write-Output $old.url; if (!$NoBrowser) {Start-Process $old.url}; exit}
    Remove-Item -LiteralPath $ready
}
$arguments='"'+(Join-Path $PSScriptRoot 'server.cjs')+'" --game-dir "'+$GameDir+'" --runtime "'+$runtime+'"'
$process=Start-Process -FilePath $NodePath -ArgumentList $arguments -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtime 'server.log') -RedirectStandardError (Join-Path $runtime 'error.log')
for ($i=0; $i -lt 100; $i++) {
    if (Test-Path -LiteralPath $ready) {$state=Get-Content -LiteralPath $ready -Raw | ConvertFrom-Json;Write-Output $state.url;if (!$NoBrowser) {Start-Process $state.url};exit}
    if ($process.HasExited) {throw (Get-Content -LiteralPath (Join-Path $runtime 'error.log') -Raw)}
    Start-Sleep -Milliseconds 100
}
throw '서버 시작 시간이 초과되었습니다. runtime\error.log를 확인하세요.'
