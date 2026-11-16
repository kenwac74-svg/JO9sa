param([Parameter(Mandatory=$true)][string]$Config)
$ErrorActionPreference='Stop'
if([IntPtr]::Size -ne 4){throw 'Run in x86 PowerShell'}
$cfg=ConvertFrom-Json -InputObject ([IO.File]::ReadAllText($Config))
$dll='C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/outputs/fog-relay-startup-fix-20261017/qsp570-probe/unpacked/qsp.dll'
$native=@"
using System;
using System.Runtime.InteropServices;
public static class HardSpecialSaveApi {
 [DllImport(@"$dll", CallingConvention=CallingConvention.Cdecl)] public static extern void QSPInit();
 [DllImport(@"$dll", CallingConvention=CallingConvention.Cdecl)] public static extern void QSPDeInit();
 [DllImport(@"$dll", CallingConvention=CallingConvention.Cdecl)] public static extern IntPtr QSPGetVersion();
 [DllImport(@"$dll", CallingConvention=CallingConvention.Cdecl, CharSet=CharSet.Unicode)] public static extern int QSPLoadGameWorld(string file);
 [DllImport(@"$dll", CallingConvention=CallingConvention.Cdecl, CharSet=CharSet.Unicode)] public static extern int QSPOpenSavedGame(string file,int refresh);
 [DllImport(@"$dll", CallingConvention=CallingConvention.Cdecl, CharSet=CharSet.Unicode)] public static extern int QSPSaveGame(string file,int refresh);
 [DllImport(@"$dll", CallingConvention=CallingConvention.Cdecl, CharSet=CharSet.Unicode)] public static extern int QSPExecString(string code,int refresh);
 [DllImport(@"$dll", CallingConvention=CallingConvention.Cdecl, CharSet=CharSet.Unicode)] public static extern int QSPGetVarValuesCount(string name,out int count);
 [DllImport(@"$dll", CallingConvention=CallingConvention.Cdecl, CharSet=CharSet.Unicode)] public static extern int QSPGetVarValues(string name,int index,out int num,out IntPtr text);
 [DllImport(@"$dll", CallingConvention=CallingConvention.Cdecl)] public static extern void QSPGetLastErrorData(out int num,out IntPtr location,out int actionIndex,out int line);
 public static int[] Numbers(string name){int count;if(QSPGetVarValuesCount(name,out count)==0)throw new Exception("COUNT_FAILED");int[] a=new int[count];for(int i=0;i<count;i++){int n;IntPtr t;if(QSPGetVarValues(name,i,out n,out t)==0)throw new Exception("VALUE_FAILED");a[i]=n;}return a;}
 [DllImport(@"$dll", CallingConvention=CallingConvention.Cdecl)] public static extern IntPtr QSPGetErrorDesc(int num);
 public static string Error(){int n,a,l;IntPtr p;QSPGetLastErrorData(out n,out p,out a,out l);return "description="+Marshal.PtrToStringUni(QSPGetErrorDesc(n))+";code="+n+";loc="+Marshal.PtrToStringUni(p)+";line="+l;}
}
"@
Add-Type -TypeDefinition $native
function Require-Api([int]$Value,[string]$Stage){if($Value -eq 0){throw ('NATIVE_FAILED_'+$Stage+' '+[HardSpecialSaveApi]::Error())}}
function Hash([string]$File){return (Get-FileHash -LiteralPath $File -Algorithm SHA256).Hash.ToLowerInvariant()}
function Assert-Flags([string]$Stage){$values=[HardSpecialSaveApi]::Numbers('jo9_enemy_special_used');if(($values -join ',') -ne '0,1,0,0,1,0,1'){throw ('FLAGS_'+$Stage+' '+($values -join ','))};return @($values)}
$report=[ordered]@{phase=$cfg.phase;pass=$false;api='Supplemental native QSP 5.7.0';dll=$dll;dllSha256=(Hash $dll);sourceSha256=$cfg.sourceSha256;inputSha256=$cfg.inputSha256;actualInstalledFastQspSavegame=$true;actualFastQspGuiLoad=$false;checks=[ordered]@{};limits=@('Direct older native QSP API restore, not installed FastQSP UI selection.','Older QSP 5.7 DLL rejects helper local declarations (error114 line5); helper execution is verified only in installed FastQSP probes.','CRC bypass DEBUG=1; strict-CRC compatibility not tested.','Synthetic state; no existing user saves read or written.','Diagnostic world blanks original onload; product onload, layout and full gameplay load route remain untested.')}
$started=$false
try {
 [HardSpecialSaveApi]::QSPInit();$started=$true
 $report.version=[Runtime.InteropServices.Marshal]::PtrToStringUni([HardSpecialSaveApi]::QSPGetVersion())
 Require-Api ([HardSpecialSaveApi]::QSPLoadGameWorld($cfg.world)) 'WORLD'
 Require-Api ([HardSpecialSaveApi]::QSPExecString('debug=1',0)) 'DEBUG'
 Require-Api ([HardSpecialSaveApi]::QSPOpenSavedGame($cfg.input,0)) 'OPEN'
 $report.restoredFlags=Assert-Flags 'RESTORE';$report.checks.restoredInstalledFastQspArray=$true
 $report.checks.postRestoreHelperExecution=$false
 Require-Api ([HardSpecialSaveApi]::QSPSaveGame($cfg.output,0)) 'RESAVE'
 Require-Api ([HardSpecialSaveApi]::QSPExecString("killvar 'jo9_enemy_special_used'`r`ndebug=1",0)) 'CORRUPT'
 Require-Api ([HardSpecialSaveApi]::QSPOpenSavedGame($cfg.output,0)) 'REOPEN'
 $report.resavedRestoredFlags=Assert-Flags 'RESAVE';$report.checks.resaveReloadExactArray=$true
 $report.pass=$true
}catch{$report.error=$_.Exception.Message}finally{if($started){[HardSpecialSaveApi]::QSPDeInit()}}
$report.inputUnchanged=((Hash $cfg.input) -eq $cfg.inputSha256)
$report.sourceUnchanged=((Hash $cfg.source) -eq $cfg.sourceSha256)
$report.pass=$report.pass -and $report.inputUnchanged -and $report.sourceUnchanged
ConvertTo-Json -InputObject $report -Depth 8 | Set-Content -LiteralPath $cfg.report -Encoding UTF8
Write-Output ($report|ConvertTo-Json -Depth 8 -Compress)
if(-not $report.pass){exit 1}
