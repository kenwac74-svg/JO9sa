param([string]$Source,[long]$Viewer)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName Accessibility
$tokens=$null;$errors=$null
$ast=[System.Management.Automation.Language.Parser]::ParseFile($Source,[ref]$tokens,[ref]$errors)
if($errors.Count){throw 'Detector parse failed'}
$commands=$ast.FindAll({param($a) $a -is [System.Management.Automation.Language.CommandAst] -and $a.GetCommandName() -eq 'Add-Type' -and @($a.CommandElements | Where-Object {$_.Value -like '*class JO9Win32*'}).Count -gt 0},$true)
if($commands.Count -ne 1){throw 'Expected one native helper definition'}
Invoke-Expression $commands[0].Extent.Text
foreach($name in @('Is-HTML','Read-ViewerByUIA')){
 $f=$ast.FindAll({param($a) $a -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $a.Name -eq $name},$true)
 if($f.Count -ne 1){throw ('Missing function '+$name)}
 Invoke-Expression $f[0].Extent.Text
}
$text=Read-ViewerByUIA ([IntPtr]$Viewer)
$valid=Is-HTML $text
@{test='Actual Qt QTextEdit root HTML is readable without keyboard or clipboard';source=$Source;viewer=$Viewer;length=$text.Length;pass=$valid}|ConvertTo-Json -Compress
if(!$valid){exit 1}
