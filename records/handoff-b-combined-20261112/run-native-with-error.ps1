param([Parameter(Mandatory=$true)][string]$Engine,[Parameter(Mandatory=$true)][string]$Plan,[ValidateRange(1,60)][int]$TimeoutSeconds=12)
$ErrorActionPreference='Stop'
$probeRoot=Split-Path -Parent ([IO.Path]::GetFullPath($Plan))
$probePlan=ConvertFrom-Json -InputObject ([IO.File]::ReadAllText($Plan))
$probeResults=@()
foreach($probe in $probePlan){
 $probeProcess=$null
 $probeStart=Get-Date
 $probeResult=[ordered]@{name=$probe.name;checkpoint=$probe.checkpoint;pass=$false;reason='';durationMs=0}
 try{
  if($probe.name -notmatch '^[a-z-]+$' -or $probe.marker -notmatch '^JO9_QA_[A-Z0-9]+_[a-z_]+_COMPLETE$'){throw 'Invalid diagnostic plan'}
  if((Split-Path -Parent ([IO.Path]::GetFullPath($probe.file))) -ne $probeRoot){throw 'Fixture must be inside diagnostic directory'}
  $probeStderr=Join-Path $probeRoot ($probe.name+'-stderr.log')
  $probeStdout=Join-Path $probeRoot ($probe.name+'-stdout.log')
  $probeProcess=Start-Process -FilePath $Engine -ArgumentList ('"'+$probe.file+'"') -WorkingDirectory $probeRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput $probeStdout -RedirectStandardError $probeStderr
  $probeDeadline=(Get-Date).AddSeconds($TimeoutSeconds)
  $probePattern='showMessage\(\), str:\s*"'+[regex]::Escape($probe.marker)+'"'
  do{
   Start-Sleep -Milliseconds 250
   # Get-Content permits reading a log while Start-Process is still writing it.
   $probeLog=if(Test-Path -LiteralPath $probeStderr){Get-Content -LiteralPath $probeStderr -Raw -Encoding UTF8}else{''}
   if($probeLog -match $probePattern){$probeResult.pass=$true;break}
   if($probeLog -match 'showMessage\(\)'){$probeResult.reason='Unexpected message before completion';break}
   if($probeProcess.HasExited){$probeResult.reason='Engine exited before completion';break}
  }while((Get-Date) -lt $probeDeadline)
  if(-not $probeResult.pass -and -not $probeResult.reason){$probeResult.reason='Completion marker timeout'}
 }catch{$probeResult.reason=$_.Exception.Message}
 finally{
  if($null -ne $probeProcess -and -not $probeResult.pass){
   try{
    Add-Type -AssemblyName UIAutomationClient
    Add-Type -AssemblyName UIAutomationTypes
    $probeCondition=New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ProcessIdProperty,[int]$probeProcess.Id)
    $probeWindows=[System.Windows.Automation.AutomationElement]::RootElement.FindAll([System.Windows.Automation.TreeScope]::Children,$probeCondition)
    $probeUI=@()
    foreach($probeWindow in $probeWindows){
     $probeUI += [pscustomobject]@{window=$probeWindow.Current.Name;control='Window'}
     $probeElements=$probeWindow.FindAll([System.Windows.Automation.TreeScope]::Descendants,[System.Windows.Automation.Condition]::TrueCondition)
     foreach($probeElement in $probeElements){$probeUI += [pscustomobject]@{window=$probeWindow.Current.Name;control=$probeElement.Current.ControlType.ProgrammaticName;name=$probeElement.Current.Name}}
    }
    ConvertTo-Json -InputObject @($probeUI) -Depth 4 | Set-Content -LiteralPath (Join-Path $probeRoot ($probe.name+'-error-ui.json')) -Encoding UTF8
    if(-not ('OwnedProbeWindowText' -as [type])){
     Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public static class OwnedProbeWindowText {
 public delegate bool EnumProc(IntPtr h,IntPtr p);
 [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc cb,IntPtr p);
 [DllImport("user32.dll")] static extern bool EnumChildWindows(IntPtr h,EnumProc cb,IntPtr p);
 [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h,out uint pid);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)] static extern int GetWindowText(IntPtr h,StringBuilder s,int n);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)] static extern int GetClassName(IntPtr h,StringBuilder s,int n);
 [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
 static string Read(IntPtr h){var s=new StringBuilder(4096);var c=new StringBuilder(256);GetWindowText(h,s,4096);GetClassName(h,c,256);return h.ToInt64()+" | "+IsWindowVisible(h)+" | "+c+" | "+s;}
 public static string[] Capture(int owner){var rows=new List<string>();EnumWindows((h,p)=>{uint pid;GetWindowThreadProcessId(h,out pid);if(pid==(uint)owner){rows.Add(Read(h));EnumChildWindows(h,(ch,cp)=>{uint cpid;GetWindowThreadProcessId(ch,out cpid);if(cpid==(uint)owner)rows.Add("  "+Read(ch));return true;},IntPtr.Zero);}return true;},IntPtr.Zero);return rows.ToArray();}
}
'@
    }
    [OwnedProbeWindowText]::Capture([int]$probeProcess.Id) | Set-Content -LiteralPath (Join-Path $probeRoot ($probe.name+'-win32-window-text.txt')) -Encoding UTF8
   }catch{[IO.File]::WriteAllText((Join-Path $probeRoot ($probe.name+'-error-ui.txt')),$_.Exception.Message)}
  }
  # Only the process created for this diagnostic is stopped. Existing game windows are untouched.
  if($null -ne $probeProcess){Stop-Process -Id $probeProcess.Id -ErrorAction SilentlyContinue}
  $probeResult.durationMs=[int]((Get-Date)-$probeStart).TotalMilliseconds
  $probeResults += [pscustomobject]$probeResult
  Write-Output ($probe.name+': '+$probeResult.pass)
 }
}
ConvertTo-Json -InputObject @($probeResults) -Depth 4 | Set-Content -LiteralPath (Join-Path $probeRoot 'client-results.json') -Encoding UTF8
if(@($probeResults | Where-Object {-not $_.pass}).Count -gt 0){exit 1}
