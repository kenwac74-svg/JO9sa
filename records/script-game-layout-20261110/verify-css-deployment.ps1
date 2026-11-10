param([string]$Launcher='G:/somi/JO9sa/tools/local-workspace/Start-JO9-Tools.ps1')
$ErrorActionPreference='Stop'
$tokens=$null;$errors=$null
$ast=[Management.Automation.Language.Parser]::ParseFile($Launcher,[ref]$tokens,[ref]$errors)
if($errors.Count){throw 'Launcher syntax error'}
$fn=$ast.Find({param($item) $item -is [Management.Automation.Language.FunctionDefinitionAst] -and $item.Name -eq 'Get-EditorCodeChanges'},$true)
Invoke-Expression $fn.Extent.Text
$tempRoot=[IO.Path]::GetTempPath();$root=Join-Path $tempRoot ('jo9-css-deploy-'+[guid]::NewGuid().ToString('N'))
try {
 New-Item -ItemType Directory -Path "$root/source","$root/installed" -Force | Out-Null
 Set-Content -LiteralPath "$root/source/workshop.css" -Value 'color: black'
 Set-Content -LiteralPath "$root/source/secret-settings.json" -Value 'keep settings'
 $files=@(Get-EditorCodeChanges "$root/source" "$root/installed")
 if($files.Count -ne 1 -or $files[0].Name -ne 'workshop.css'){throw 'Changed workshop CSS must be selected without settings.'}
 Copy-Item -LiteralPath "$root/source/workshop.css" -Destination "$root/installed/workshop.css"
 if(@(Get-EditorCodeChanges "$root/source" "$root/installed").Count -ne 0){throw 'Unchanged CSS must not restart the server.'}
 Write-Output 'PASS: changed CSS deploys; settings and unchanged CSS do not.'
} finally {
 $resolved=[IO.Path]::GetFullPath($root)
 if(!$resolved.StartsWith([IO.Path]::GetFullPath($tempRoot),[StringComparison]::OrdinalIgnoreCase) -or (Split-Path $resolved -Leaf) -notlike 'jo9-css-deploy-*'){throw 'Unexpected fixture cleanup path'}
 if(Test-Path -LiteralPath $resolved){Remove-Item -LiteralPath $resolved -Recurse -Force}
}
