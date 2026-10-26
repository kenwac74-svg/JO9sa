param([Parameter(Mandatory=$true)][string]$OutputExe)
$ErrorActionPreference='Stop'
$target=[IO.Path]::GetFullPath($OutputExe)
if(Test-Path -LiteralPath $target){throw 'Output already exists; choose a new output path.'}
$compiler=Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
if(-not(Test-Path -LiteralPath $compiler)){$compiler=Join-Path $env:WINDIR 'Microsoft.NET/Framework/v4.0.30319/csc.exe'}
if(-not(Test-Path -LiteralPath $compiler)){throw '.NET Framework C# compiler was not found.'}
$source=Join-Path $PSScriptRoot 'Installer.cs'
$manifest=Join-Path $PSScriptRoot 'installer.manifest'
[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($target)) | Out-Null
$compilerArguments=@('/nologo','/target:winexe','/platform:anycpu','/optimize+','/utf8output','/reference:System.Windows.Forms.dll','/reference:System.Drawing.dll','/reference:System.Web.Extensions.dll',('/win32manifest:'+$manifest),('/out:'+$target),$source)
& $compiler @compilerArguments
if($LASTEXITCODE -ne 0){throw 'Installer compilation failed.'}
Get-FileHash -LiteralPath $target -Algorithm SHA256
