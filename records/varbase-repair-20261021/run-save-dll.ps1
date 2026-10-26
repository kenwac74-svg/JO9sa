param([string]$Config = (Join-Path $PSScriptRoot 'config.json'))
$ErrorActionPreference='Stop'
if([IntPtr]::Size -ne 4){throw 'Run this helper in x86 PowerShell'}
$fixtureConfig=ConvertFrom-Json -InputObject ([IO.File]::ReadAllText($Config))
$nativeDll='C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/outputs/fog-relay-startup-fix-20261017/qsp570-probe/unpacked/qsp.dll'
$nativeCode=@"
using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
public sealed class ActorSnapshot { public int Count; public int[] Numbers; public string[] Texts; }
public static class SaveDllApi {
 [DllImport(@"$nativeDll", CallingConvention=CallingConvention.Cdecl)] public static extern void QSPInit();
 [DllImport(@"$nativeDll", CallingConvention=CallingConvention.Cdecl)] public static extern void QSPDeInit();
 [DllImport(@"$nativeDll", CallingConvention=CallingConvention.Cdecl)] public static extern IntPtr QSPGetVersion();
 [DllImport(@"$nativeDll", CallingConvention=CallingConvention.Cdecl, CharSet=CharSet.Unicode)] public static extern int QSPLoadGameWorld(string file);
 [DllImport(@"$nativeDll", CallingConvention=CallingConvention.Cdecl, CharSet=CharSet.Unicode)] public static extern int QSPOpenSavedGame(string file,int refresh);
 [DllImport(@"$nativeDll", CallingConvention=CallingConvention.Cdecl, CharSet=CharSet.Unicode)] public static extern int QSPSaveGame(string file,int refresh);
 [DllImport(@"$nativeDll", CallingConvention=CallingConvention.Cdecl, CharSet=CharSet.Unicode)] public static extern int QSPExecString(string code,int refresh);
 [DllImport(@"$nativeDll", CallingConvention=CallingConvention.Cdecl, CharSet=CharSet.Unicode)] public static extern int QSPGetVarValuesCount(string name,out int count);
 [DllImport(@"$nativeDll", CallingConvention=CallingConvention.Cdecl, CharSet=CharSet.Unicode)] public static extern int QSPGetVarValues(string name,int index,out int num,out IntPtr text);
 [DllImport(@"$nativeDll", CallingConvention=CallingConvention.Cdecl)] public static extern void QSPGetLastErrorData(out int num,out IntPtr location,out int actionIndex,out int line);
 [DllImport(@"$nativeDll", CallingConvention=CallingConvention.Cdecl)] public static extern IntPtr QSPGetErrorDesc(int num);
 public static string Ptr(IntPtr p){return p==IntPtr.Zero ? "" : Marshal.PtrToStringUni(p);}
 public static string Error(){int n,a,l;IntPtr loc;QSPGetLastErrorData(out n,out loc,out a,out l);return "code="+n+";location="+Ptr(loc)+";action="+a+";line="+l+";description="+Ptr(QSPGetErrorDesc(n));}
 public static ActorSnapshot Capture(string name){
  int count;if(QSPGetVarValuesCount(name,out count)==0)throw new Exception("ACTOR_COUNT_API_FAILED");
  ActorSnapshot s=new ActorSnapshot();s.Count=count;s.Numbers=new int[count];s.Texts=new string[count];
  for(int i=0;i<count;i++){int n;IntPtr t;if(QSPGetVarValues(name,i,out n,out t)==0)throw new Exception("ACTOR_VALUE_API_FAILED");s.Numbers[i]=n;s.Texts[i]=Ptr(t);}return s;
 }
 public static string Digest(ActorSnapshot s,int exclude){
  using(MemoryStream m=new MemoryStream())using(BinaryWriter w=new BinaryWriter(m,Encoding.UTF8)){
   w.Write(s.Count);for(int i=0;i<s.Count;i++){if(i==exclude)continue;w.Write(i);w.Write(s.Numbers[i]);w.Write(s.Texts[i]??"");}w.Flush();
   using(SHA256 h=SHA256.Create()){return BitConverter.ToString(h.ComputeHash(m.ToArray())).Replace("-","").ToLowerInvariant();}
  }
 }
}
"@
Add-Type -TypeDefinition $nativeCode
function Require-Native([int]$Value,[string]$Stage){if($Value -eq 0){throw ('NATIVE_CALL_FAILED_'+$Stage)}}
function Hash-File([string]$File){return (Get-FileHash -LiteralPath $File -Algorithm SHA256).Hash.ToLowerInvariant()}
$report=[ordered]@{schema=1;scope='QSP57_DLL_SUPPLEMENTAL_SAVE_API';createdAt=[DateTime]::UtcNow.ToString('o');x86=$true;dll=$nativeDll;dllSha256=(Hash-File $nativeDll);engineVersion='';sourceSha256=$fixtureConfig.sourceSha256;worldSha256=$fixtureConfig.worldSha256;crcBypass='DEBUG=1 before direct native open; not a CRC compatibility assertion';onload='Only diagnostic world $ongload body blanked';cases=@();limits=@('Supplemental old QSP DLL; not installed FastQSP UI save selection.','Native feature-support differences must not be classified as a FastQSP regression.','Only slave ERO_RWD_CNT is excluded around gs #var_base; native resave/reopen compares complete actor fields.');verdict='INCOMPLETE'}
foreach($fixture in $fixtureConfig.fixtures){
 $result=[ordered]@{name=$fixture.name;pass=$false;stage='init';inputSha256=$fixture.sha256;inputUnchanged=$false;checks=[ordered]@{};actors=@()}
 $initialized=$false
 try {
  if((Hash-File $fixture.input) -ne $fixture.sha256){throw 'INPUT_HASH_BEFORE_MISMATCH'}
  if(Test-Path -LiteralPath $fixture.output){throw 'REFUSE_EXISTING_OUTPUT'}
  [SaveDllApi]::QSPInit();$initialized=$true
  $report.engineVersion=[SaveDllApi]::Ptr([SaveDllApi]::QSPGetVersion())
  $result.stage='load-world';Require-Native ([SaveDllApi]::QSPLoadGameWorld($fixtureConfig.world)) 'LOAD_WORLD';$result.checks.loadWorld=$true
  $result.stage='crc-bypass';Require-Native ([SaveDllApi]::QSPExecString('debug=1',0)) 'DEBUG';
  $result.stage='native-open-input';Require-Native ([SaveDllApi]::QSPOpenSavedGame($fixture.input,0)) 'OPEN_INPUT';$result.checks.openInput=$true
  $result.stage='disable-side-effects';Require-Native ([SaveDllApi]::QSPExecString("snk_room_target=0`r`nautosave=0`r`ndecadesave=0`r`nautosave_day=0`r`nautosave_decade=0`r`nsound_on=0`r`nsettimer 0",0)) 'SETUP'
  $before=@{};$after=@{}
  $result.stage='capture-before'
  foreach($role in $fixture.roles){$before[$role.name]=[SaveDllApi]::Capture($role.name);if($before[$role.name].Count -ne $role.count){throw 'NATIVE_RESTORED_ACTOR_COUNT_MISMATCH'}}
  $result.checks.nativeRestoredActorCounts=$true
  $result.stage='candidate-var-base';Require-Native ([SaveDllApi]::QSPExecString("gs '#var_base'",0)) 'VAR_BASE';$result.checks.varBase=$true
  $result.stage='capture-after'
  foreach($role in $fixture.roles){
   $after[$role.name]=[SaveDllApi]::Capture($role.name)
   $beforeDigest=[SaveDllApi]::Digest($before[$role.name],[int]$role.excludedIndex)
   $afterDigest=[SaveDllApi]::Digest($after[$role.name],[int]$role.excludedIndex)
   if($beforeDigest -ne $afterDigest){throw 'ACTOR_CHANGED_BEYOND_ALLOWED_FIELD'}
   $result.actors+=([ordered]@{role=$role.name;count=$after[$role.name].Count;excludedIndex=[int]$role.excludedIndex;beforeHash=$beforeDigest;afterHash=$afterDigest;preserved=$true;reloadPreserved=$false})
  }
  $result.checks.actorPreservation=$true
  $result.stage='native-save-copy';Require-Native ([SaveDllApi]::QSPSaveGame($fixture.output,0)) 'SAVE_COPY';$result.checks.saveCopy=$true
  $result.stage='native-reopen-copy';Require-Native ([SaveDllApi]::QSPExecString('debug=1',0)) 'DEBUG_REOPEN';Require-Native ([SaveDllApi]::QSPOpenSavedGame($fixture.output,0)) 'REOPEN_COPY';$result.checks.reopenCopy=$true
  $result.stage='verify-reopened-actors'
  foreach($role in $fixture.roles){
   $reloaded=[SaveDllApi]::Capture($role.name)
   if([SaveDllApi]::Digest($after[$role.name],-1) -ne [SaveDllApi]::Digest($reloaded,-1)){throw 'NATIVE_RESAVE_RELOAD_ACTOR_MISMATCH'}
   foreach($actorResult in $result.actors){if($actorResult.role -eq $role.name){$actorResult.reloadPreserved=$true}}
  }
  $result.checks.completeActorReload=$true;$result.outputSha256=Hash-File $fixture.output;$result.stage='complete';$result.pass=$true
 }catch{
  $result.error=$_.Exception.Message
  if($initialized){$result.nativeError=[SaveDllApi]::Error()}
 }finally{
  if($initialized){[SaveDllApi]::QSPDeInit()}
  $result.inputUnchanged=((Hash-File $fixture.input) -eq $fixture.sha256)
  if(-not $result.inputUnchanged){$result.pass=$false}
  $report.cases+=[pscustomobject]$result
 }
}
$report.sourceUnchanged=((Hash-File $fixtureConfig.source) -eq $fixtureConfig.sourceSha256)
$report.worldUnchanged=((Hash-File $fixtureConfig.world) -eq $fixtureConfig.worldSha256)
if(@($report.cases | Where-Object {-not $_.pass}).Count -eq 0 -and $report.sourceUnchanged -and $report.worldUnchanged){$report.verdict='PASS'}else{$report.verdict='LIMITED'}
ConvertTo-Json -InputObject $report -Depth 9 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'report.json') -Encoding UTF8
Write-Output ($report.verdict+' cases='+$report.cases.Count+' version='+$report.engineVersion)
foreach($result in $report.cases){Write-Output ($result.name+' pass='+$result.pass+' stage='+$result.stage+$(if($result.error){' error='+$result.error}else{''}))}
if($report.verdict -ne 'PASS'){exit 2}
