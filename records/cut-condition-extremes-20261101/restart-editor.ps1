$ErrorActionPreference = 'Stop'
$jo9EditorState = Get-Content -LiteralPath 'G:/somi/Jack O Nine Tails v2.4_work/game/modtools/text-workshop/runtime/server.json' -Raw | ConvertFrom-Json
$jo9EditorProc = Get-CimInstance Win32_Process -Filter "ProcessId = $($jo9EditorState.pid)"
$jo9ServerFile = 'G:\somi\Jack O Nine Tails v2.4_work\game\modtools\text-workshop\server.cjs'
if (-not $jo9EditorProc -or -not $jo9EditorProc.CommandLine.Contains($jo9ServerFile)) { throw 'The expected WORK editor process was not found.' }
$jo9NodeFile = $jo9EditorProc.ExecutablePath
Stop-Process -Id $jo9EditorProc.ProcessId
$jo9EditorArgs = @(
 '"G:\somi\Jack O Nine Tails v2.4_work\game\modtools\text-workshop\server.cjs"',
 '--game-dir', '"G:\somi\Jack O Nine Tails v2.4_work\game"',
 '--original-dir', '"G:\somi\JO9O\game"',
 '--catalog-dir', '"G:\somi\Jack O Nine Tails v2.4_work\game\modtools\catalog"',
 '--runtime', '"G:\somi\Jack O Nine Tails v2.4_work\game\modtools\text-workshop\runtime"',
 '--port', '3813'
)
$jo9StartedEditor = Start-Process -FilePath $jo9NodeFile -ArgumentList $jo9EditorArgs -WorkingDirectory 'G:/somi/Jack O Nine Tails v2.4_work/game/modtools/text-workshop' -WindowStyle Hidden -PassThru
Write-Output "WORK editor restarted: PID $($jo9StartedEditor.Id), port 3813"
