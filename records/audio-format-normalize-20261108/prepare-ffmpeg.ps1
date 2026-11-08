$ErrorActionPreference='Stop'
$audioTemp='G:/Codex/tmp/audio-format-normalize-20261108'
$audioTool='G:/Codex/tools/ffmpeg-9.0.2'
$audioArchive=Join-Path $audioTemp 'ffmpeg-9.0.2-essentials_build.7z'
$audioExpected='4705843ccaaf54257c16ad90f3e952ece33c17df964ecf7bfdbb0f49c7171077'
New-Item -ItemType Directory -Path $audioTemp,$audioTool -Force | Out-Null
if(-not (Test-Path -LiteralPath $audioArchive)){
 Invoke-WebRequest -Uri 'https://www.gyan.dev/ffmpeg/builds/packages/ffmpeg-9.0.2-essentials_build.7z' -OutFile $audioArchive
}
$audioActual=(Get-FileHash -LiteralPath $audioArchive -Algorithm SHA256).Hash.ToLowerInvariant()
if($audioActual -ne $audioExpected){throw 'FFmpeg archive checksum mismatch'}
$audioEntries=@(& tar -tf $audioArchive)
if($LASTEXITCODE -ne 0){throw 'Cannot inspect FFmpeg archive'}
$audioMembers=@($audioEntries | Where-Object {$_ -match '/bin/(ffmpeg|ffprobe)\.exe$' -or $_ -match '/LICENSE$'})
if(@($audioMembers | Where-Object {$_ -match '/bin/.*\.exe$'}).Count -ne 2){throw 'Unexpected FFmpeg archive members'}
foreach($audioMember in $audioMembers){
 if($audioMember -match '(^/|(^|/)\.\.(/|$)|:)'){throw 'Unsafe FFmpeg archive path'}
 $audioName=Split-Path -Leaf $audioMember
 $audioExtract=Join-Path $audioTemp 'ffmpeg-extract'
 New-Item -ItemType Directory -Path $audioExtract -Force | Out-Null
 & tar -xf $audioArchive -C $audioExtract $audioMember
 if($LASTEXITCODE -ne 0){throw 'Cannot extract FFmpeg member'}
 $audioSource=Join-Path $audioExtract $audioMember
 Copy-Item -LiteralPath $audioSource -Destination (Join-Path $audioTool $audioName) -Force
}
$audioInstall=[ordered]@{source='https://ffmpeg.org/download.html';build='https://www.gyan.dev/ffmpeg/builds/';archiveSha256=$audioActual;files=@()}
foreach($audioName in @('ffmpeg.exe','ffprobe.exe','LICENSE')){
 $audioPath=Join-Path $audioTool $audioName
 if(Test-Path -LiteralPath $audioPath){$audioInstall.files+=@{name=$audioName;sha256=(Get-FileHash -LiteralPath $audioPath -Algorithm SHA256).Hash.ToLowerInvariant()}}
}
[IO.File]::WriteAllText((Join-Path $audioTool 'install.json'),($audioInstall | ConvertTo-Json -Depth 5),[Text.UTF8Encoding]::new($false))
& (Join-Path $audioTool 'ffmpeg.exe') -version | Select-Object -First 1
if($LASTEXITCODE -ne 0){throw 'FFmpeg version check failed'}
