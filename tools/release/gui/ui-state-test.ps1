param([Parameter(Mandatory=$true)][string]$Executable)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$assembly=[Reflection.Assembly]::LoadFrom([IO.Path]::GetFullPath($Executable))
$form=[Activator]::CreateInstance($assembly.GetType('JO9PatchInstaller.InstallerForm',$true))
try {
 $state=$form.Controls.Find('state',$true)[0]
 $summary=$form.Controls.Find('summary',$true)[0]
 $details=$form.Controls.Find('details',$true)[0]
 $folder=$form.Controls.Find('gameFolder',$true)[0]
 $state.Text='이전 폴더 검사 완료'
 $state.ForeColor=[Drawing.Color]::DarkGreen
 $summary.Text='이전 폴더 결과'
 $details.Text='OLD_RESULT'
 $folder.Text='D:\새로운 게임\game'
 if($state.Text -match '검사 완료' -or $summary.Text -match '이전 폴더' -or $details.Text -eq 'OLD_RESULT' -or $state.ForeColor -eq [Drawing.Color]::DarkGreen){throw 'Folder change retained stale check state.'}
 Write-Output 'PASS Korean UI clears previous check result when target changes.'
} finally {$form.Dispose()}
