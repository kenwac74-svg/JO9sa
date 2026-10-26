param([string]$Source,[long]$Main,[uint32]$GamePid)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName Accessibility
Add-Type @'
using System;using System.Runtime.InteropServices;
public static class J9ClipboardProbe {
 [DllImport("user32.dll")] public static extern uint GetClipboardSequenceNumber();
}
'@
$tokens=$null;$errors=$null
$ast=[System.Management.Automation.Language.Parser]::ParseFile($Source,[ref]$tokens,[ref]$errors)
if($errors.Count){throw 'Detector parse failed'}
$commands=$ast.FindAll({param($a) $a -is [System.Management.Automation.Language.CommandAst] -and $a.GetCommandName() -eq 'Add-Type' -and @($a.CommandElements | Where-Object {$_.Value -like '*class JO9Win32*'}).Count -gt 0},$true)
Invoke-Expression $commands[0].Extent.Text
$script:events=@()
function Log([string]$Text){$script:events+=$Text}
foreach($name in @('Is-HTML','Read-ViewerByUIA','Invoke-ShowHtml','Close-Viewer-Normally','Read-ViewerByClipboard')){
 $f=$ast.FindAll({param($a) $a -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $a.Name -eq $name},$true)
 if($f.Count -ne 1){throw ('Missing function '+$name)}
 Invoke-Expression $f[0].Extent.Text
}
$before=[J9ClipboardProbe]::GetClipboardSequenceNumber()
$results=@()
for($i=1;$i -le 3;$i++){
 Invoke-ShowHtml ([IntPtr]$Main)
 $html='';$viewer=[IntPtr]::Zero
 for($attempt=0;$attempt -lt 20 -and !$html;$attempt++){
  Start-Sleep -Milliseconds 50
  foreach($h in [JO9Win32]::ProcessWindows($GamePid)){
   if($h -eq [IntPtr]$Main -or ![JO9Win32]::IsWindowVisible($h)){continue}
   $text=Read-ViewerByUIA $h
   if(Is-HTML $text){$html=$text;$viewer=$h;break}
  }
 }
 if(!(Is-HTML $html)){throw ('No current visible HTML viewer in cycle '+$i)}
 if($script:events[-1] -ne 'Show html action invoked by MSAA name'){throw 'Keyboard fallback used unexpectedly'}
 $references=[regex]::Matches($html,'(?i)content[\\/]+pic[\\/]+[^"''<>\)\r\n]+?\.(?:png|jpg|jpeg|webp|gif)').Count
 if($references -le 0){throw 'No image references captured'}
 $results+=@{cycle=$i;viewer=[long]$viewer;htmlLength=$html.Length;resourceReferences=$references;namedMsaaAction=$true}
 if($i -ne 2){Close-Viewer-Normally $viewer}
}
$denied=$false
try{Invoke-ShowHtml ([IntPtr]::Zero)}catch{$denied=$_.Exception.Message -like '*no keyboard input was sent*'}
if(!$denied){throw 'Invalid-window keyboard guard failed'}
$empty=Read-ViewerByClipboard ([IntPtr]::Zero)
if($empty){throw 'Invalid window returned clipboard data'}
$after=[J9ClipboardProbe]::GetClipboardSequenceNumber()
if($after -ne $before){throw 'Clipboard changed during native capture'}
@{pass=$true;cycles=$results;covered='first/hidden reuse/visible reuse, native HTML+resource refs, invalid-window input guard, clipboard unchanged';clipboardSequenceBefore=$before;clipboardSequenceAfter=$after;parseErrors=$errors.Count;events=$script:events}|ConvertTo-Json -Depth 5
