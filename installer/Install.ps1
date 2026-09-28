# JO9 UI SNKmod 설치·검사·복구기: UI 이미지는 SNKmod에, 이미지 외 파일은 원본 경로에 복구 가능하게 적용한다
param(
    [ValidateSet('Check','Apply','Restore')][string]$Mode='Apply',
    [string]$GamePath='',
    [switch]$NonInteractive
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version 2
$Root=$PSScriptRoot
$Title='JO9 UI SNKmod'
$StateDirName='_JO9_SNKmod_STATE'
$Utf8=New-Object Text.UTF8Encoding($false,$true)
$Utf8Bom=New-Object Text.UTF8Encoding($true,$true)
$Sep=[IO.Path]::DirectorySeparatorChar
$script:Forms=$false
$script:Warnings=New-Object Collections.Generic.List[string]
# 이 패키지가 쓰는 파일과 같은 내용이면 다른 모드 변경으로 보지 않는다 (수동으로 패치 파일을 넣은 경우).
$script:PackageHashes=@()
# 이미지·json 패치가 menu_icon.json·base.css를 덮으면 UI가 깨지므로 이 패치를 마지막에 설치하도록 안내한다.
$OrderNote="권장 설치 순서: JoNT_IndividualityPatchInstaller.zip → ai_girl_pack.zip → 그 밖의 이미지·json 패치 → 이 UI 패치(맨 마지막).`r`n순서가 바뀌면 UI 패치가 정상 작동하지 않을 수 있습니다. 다른 패치를 나중에 설치했다면 이 UI 패치를 다시 설치하세요.`r`nQSP를 바꾸는 다른 모드와는 호환되지 않습니다."

function Tell([string]$text,[string]$icon='Information'){Write-Host $text; if($script:Forms){[void][Windows.Forms.MessageBox]::Show($text,$Title,'OK',$icon)}}
function Warn([string]$text){$script:Warnings.Add($text); Write-Warning $text}
function Ask([string]$text){if(-not $script:Forms){return $false}; return [Windows.Forms.MessageBox]::Show($text,$Title,'YesNo','Question')-eq 'Yes'}
function Hash([string]$file){return (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant()}
function HashBytes([byte[]]$data){$h=[Security.Cryptography.SHA256]::Create();try{return [BitConverter]::ToString($h.ComputeHash($data)).Replace('-','').ToLowerInvariant()}finally{$h.Dispose()}}
function HashOrAbsent([string]$file){if([IO.File]::Exists($file)){return Hash $file};return 'ABSENT'}
function SafePath([string]$base,[string]$rel){
    $base=[IO.Path]::GetFullPath($base).TrimEnd($Sep)
    $full=[IO.Path]::GetFullPath([IO.Path]::Combine($base,$rel.Replace('/',$Sep).Replace('\',$Sep)))
    if(-not $full.StartsWith($base+$Sep,[StringComparison]::OrdinalIgnoreCase)){throw ('선택한 폴더 밖의 경로입니다: '+$rel)}
    $scan=$full
    while($scan.Length-ge $base.Length){
        if(Test-Path -LiteralPath $scan){if(((Get-Item -LiteralPath $scan -Force).Attributes-band [IO.FileAttributes]::ReparsePoint)-ne 0){throw ('심볼릭 링크/정션은 지원하지 않습니다: '+$scan)}}
        if($scan-eq $base){break};$scan=[IO.Path]::GetDirectoryName($scan)
    }
    return $full
}
function Commit([string]$file,[byte[]]$data){
    [void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($file))
    $tmp=$file+'.snkmod-'+[Guid]::NewGuid().ToString('N')+'.tmp'
    try{[IO.File]::WriteAllBytes($tmp,$data);if([IO.File]::Exists($file)){[IO.File]::Replace($tmp,$file,[NullString]::Value)}else{[IO.File]::Move($tmp,$file)}}finally{if([IO.File]::Exists($tmp)){[IO.File]::Delete($tmp)}}
    if((Hash $file)-ne (HashBytes $data)){throw ('쓰기 검증 실패: '+$file)}
}
function SaveState($state,[string]$folder){[IO.File]::WriteAllText((Join-Path $folder 'state.json'),($state|ConvertTo-Json -Depth 8),$Utf8Bom)}
function ReadJson([string]$file){return [IO.File]::ReadAllText($file,$Utf8)|ConvertFrom-Json}

# 설치 후 바뀐 파일 목록. 다른 모드·다른 버전 설치로 흔히 생기며 실패 사유가 아니다.
function ChangedSince($state,[string]$folder){
    $changed=New-Object Collections.Generic.List[object]
    foreach($e in $state.Files){
        $target=SafePath $GamePath $e.Rel
        if($e.Existed){$backup=SafePath (Join-Path $folder 'original') $e.Rel;if((Hash $backup)-ne $e.Before){throw ('보관본 해시 불일치: '+$e.Rel)}}
        $current=HashOrAbsent $target
        # 사용자가 기존 모드 폴더를 pic 아래로 옮긴 경우 새 위치는 설치 계획에서 별도 백업한다.
        $moved=$false
        if($current-eq 'ABSENT' -and -not $e.Existed -and $e.Rel.StartsWith('SNKmod/content/pic/')){
            $newRel='content/pic/SNKmod/'+$e.Rel.Substring('SNKmod/content/pic/'.Length)
            $moved=[IO.File]::Exists((SafePath $GamePath $newRel))
        }
        # 원래 게임 파일이 다른 내용으로 바뀌었으면 그 상태를 새 기준으로 두고 되돌리지 않는다.
        if(-not $moved -and $current-ne $e.Before-and $current-ne $e.After){$changed.Add([pscustomobject]@{Rel=$e.Rel;Hash=$current;Keep=($e.Existed -and $current-ne 'ABSENT' -and $script:PackageHashes -notcontains $current)})}
    }
    return ,$changed
}
function KeptMessage([string]$rel){return ($rel+' 파일이 설치 후 바뀌었습니다 (다른 모드·다른 버전 설치로 보임). 설치 전 원본으로 되돌리지 않고 현재 파일을 그대로 둡니다.')}

# 바뀐 파일은 현재본을 별도 보관한다. 바뀐 원래 게임 파일은 그대로 두고, 나머지는 설치 전 상태로 되돌린다.
function RestoreState($state,[string]$folder){
    $changed=ChangedSince $state $folder
    $kept=@($changed|Where-Object{$_.Keep}|ForEach-Object{$_.Rel})
    if($changed.Count-gt 0){
        $changedDir=Join-Path $folder ('changed/'+(Get-Date).ToString('yyyyMMdd_HHmmss')+'_'+[Guid]::NewGuid().ToString('N').Substring(0,8))
        [void][IO.Directory]::CreateDirectory($changedDir)
        foreach($c in $changed){
            $target=SafePath $GamePath $c.Rel
            if((HashOrAbsent $target)-ne $c.Hash){throw ('확인 중 파일이 다시 바뀌었습니다: '+$c.Rel)}
            if($c.Hash-ne 'ABSENT'){
                $copy=SafePath $changedDir $c.Rel
                [void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($copy))
                [IO.File]::Copy($target,$copy)
                if((Hash $copy)-ne $c.Hash){throw ('변경본 백업 검증 실패: '+$c.Rel)}
            }
            if($c.Keep){Warn (KeptMessage $c.Rel)}
        }
        [IO.File]::WriteAllText((Join-Path $changedDir 'changed-files.json'),(ConvertTo-Json -InputObject @($changed.ToArray()) -Depth 5),$Utf8Bom)
        Write-Host ('설치 후 바뀐 파일 '+$changed.Count+'개의 현재본 백업: '+$changedDir)
    }
    $files=@($state.Files)
    for($i=$files.Count-1;$i-ge 0;$i--){
        $e=$files[$i];$target=SafePath $GamePath $e.Rel
        if($kept -contains $e.Rel){continue}
        if($e.Existed){if((HashOrAbsent $target)-ne $e.Before){Commit $target ([IO.File]::ReadAllBytes((SafePath (Join-Path $folder 'original') $e.Rel)))}}
        elseif([IO.File]::Exists($target)){[IO.File]::Delete($target)}
    }
    # 모드가 만든 빈 폴더만 정리한다. 사용자 파일이 남은 폴더는 그대로 둔다.
    foreach($snkRel in @('SNKmod','content/pic/SNKmod')){
    $snk=SafePath $GamePath $snkRel
    if(Test-Path -LiteralPath $snk){
        foreach($d in @(Get-ChildItem -LiteralPath $snk -Directory -Recurse | Sort-Object {$_.FullName.Length} -Descending)){if(@(Get-ChildItem -LiteralPath $d.FullName -Force).Count-eq 0){[IO.Directory]::Delete($d.FullName)}}
        if(@(Get-ChildItem -LiteralPath $snk -Force).Count-eq 0){[IO.Directory]::Delete($snk)}
    }
    }
    $state.Status='restored';$state|Add-Member -NotePropertyName KeptChanged -NotePropertyValue $kept -Force;SaveState $state $folder
}

function FindActiveState([string]$stateRoot){
    if(-not (Test-Path -LiteralPath $stateRoot)){return $null}
    foreach($dir in Get-ChildItem -LiteralPath $stateRoot -Directory | Sort-Object Name -Descending){
        $record=Join-Path $dir.FullName 'state.json'
        if(Test-Path -LiteralPath $record){$s=ReadJson $record;if($s.Package -in @('JO9_UI_SNKMOD','JO9 UI_overhaul_SNKmod') -and $s.Status-ne 'restored'){return [pscustomobject]@{Dir=$dir.FullName;State=$s}}}
    }
    return $null
}

try {
    if(-not $NonInteractive){Add-Type -AssemblyName System.Windows.Forms;$script:Forms=$true}
    if([string]::IsNullOrWhiteSpace($GamePath)){
        if($NonInteractive){throw '-GamePath로 게임 폴더나 jack.qsp를 지정하세요.'}
        $dialog=New-Object Windows.Forms.OpenFileDialog
        $dialog.Title=$Title+' - game/jack.qsp 선택';$dialog.Filter='Jack game|jack.qsp';$dialog.CheckFileExists=$true
        try{if($dialog.ShowDialog()-ne 'OK'){exit 0};$GamePath=$dialog.FileName}finally{$dialog.Dispose()}
    }
    $GamePath=[IO.Path]::GetFullPath($GamePath.Trim().Trim('"'))
    if([IO.File]::Exists($GamePath)){$GamePath=[IO.Path]::GetDirectoryName($GamePath)}
    $qsp=SafePath $GamePath 'jack.qsp';$css=SafePath $GamePath 'css/base.css'
    if(-not [IO.File]::Exists($qsp)-or -not [IO.File]::Exists($css)){throw 'jack.qsp와 css/base.css가 있는 실제 게임 폴더를 선택하세요.'}
    foreach($proc in Get-Process -Name jack -ErrorAction SilentlyContinue){if($proc.Path -and [IO.Path]::GetFullPath($proc.Path)-eq (SafePath $GamePath 'engine/jack.exe')){throw '게임을 닫은 뒤 다시 실행하세요.'}}
    $stateRoot=SafePath $GamePath $StateDirName

    if($Mode-eq 'Restore'){
        $active=FindActiveState $stateRoot
        if($null-eq $active){throw '복구할 SNKmod UI 설치 기록이 없습니다.'}
        if($script:Forms -and -not (Ask "SNKmod UI를 제거하고 설치 전 jack.qsp·base.css·엔진으로 되돌릴까요?`r`n교체한 일반 이미지(캐릭터·NPC·일반 배경)는 되돌리지 않습니다.")){exit 0}
        RestoreState $active.State $active.Dir
        $msg='SNKmod UI를 제거했습니다. jack.qsp·base.css·엔진은 설치 전 상태로 돌아갔습니다. 교체한 일반 이미지는 그대로 남습니다.'
        if($script:Warnings.Count-gt 0){$msg+="`r`n`r`n경고:`r`n- "+($script:Warnings -join "`r`n- ")}
        Tell $msg;exit 0
    }

    $manifest=ReadJson (Join-Path $Root 'manifest.json')
    foreach($entry in $manifest.Payload){if((Hash (SafePath $Root $entry.Rel))-ne $entry.Hash){throw ('패키지가 손상됐습니다: '+$entry.Rel)}}
    $script:PackageHashes=@($manifest.Qsp.Hash)+@($manifest.Overwrite|ForEach-Object{$_.Hash})

    # 같은 버전이 이미 적용돼 있으면 끝, 다른 버전이면 먼저 되돌린다.
    $active=FindActiveState $stateRoot
    if($null-ne $active){
        $same=$active.State.Version-eq $manifest.Version
        if($same){foreach($e in $active.State.Files){if((HashOrAbsent (SafePath $GamePath $e.Rel))-ne $e.After){$same=$false;break}}}
        if($same){Tell ('SNKmod UI '+$manifest.Version+'이(가) 이미 설치돼 있습니다. 바꿀 파일이 없습니다.');exit 0}
        if($Mode-eq 'Check'){
            foreach($c in (ChangedSince $active.State $active.Dir)){if($c.Keep){Warn (KeptMessage $c.Rel)}}
        }
        else{RestoreState $active.State $active.Dir}
    }
    # 이전 SNKmod 설치가 쓴 파일은 다른 모드 변경으로 보지 않는다 (Check 모드는 정리 전이라 이 파일이 남아 있다).
    $known=@();if($null-ne $active){$known=@($active.State.Files|ForEach-Object{$_.After})}

    # --- 적용 계획 ---
    $plan=New-Object Collections.Generic.List[object]
    # jack.qsp: 패키지에 든 완성본으로 교체한다. 원본은 _JO9_SNKmod_STATE에 보관한다.
    $qspHash=Hash $qsp
    if($qspHash-ne $manifest.Qsp.Hash){
        if($manifest.Qsp.Before -notcontains $qspHash -and $known -notcontains $qspHash){Warn '호환성: jack.qsp가 순정 2.3과 다릅니다. 다른 QSP 모드나 다른 게임 버전이 설치된 것으로 보입니다. 이 UI 패치는 QSP를 바꾸는 모드와 호환되지 않아 jack.qsp를 이 패치의 파일로 교체합니다. 그 모드의 변경은 사라지며 원본은 복구용으로 보관합니다. 설치는 계속합니다.'}
        $plan.Add([pscustomobject]@{Rel='jack.qsp';Data=[IO.File]::ReadAllBytes((SafePath $Root $manifest.Qsp.Source))})
    }

    # 이미지 외 파일(base.css, json/menu_icon.json): 원본 경로에 덮어쓰고, 원본은 복구용으로 보관한다.
    foreach($ow in $manifest.Overwrite){
        $t=SafePath $GamePath $ow.Rel
        if(-not [IO.File]::Exists($t)){Warn ($ow.Rel+' 파일이 없어 건너뜁니다.');continue}
        $h=Hash $t
        if($h-eq $ow.Hash){continue}
        if($ow.Before -notcontains $h -and $known -notcontains $h){Warn ('알려지지 않은 '+$ow.Rel+'('+$h+')를 SNKmod UI용 파일로 교체합니다. 원본은 복구용으로 보관합니다.')}
        $plan.Add([pscustomobject]@{Rel=$ow.Rel;Data=[IO.File]::ReadAllBytes((SafePath $Root $ow.Source))})
    }

    $engine=SafePath $GamePath $manifest.Engine.Rel
    $engineHash=HashOrAbsent $engine;$engineMessage=''
    if($engineHash-eq $manifest.Engine.Before){
        $qt=SafePath $GamePath 'engine/Qt5Widgets.dll'
        if([IO.File]::Exists($qt)-and (Hash $qt)-eq $manifest.Engine.QtWidgetsHash){
            $plan.Add([pscustomobject]@{Rel=$manifest.Engine.Rel;Data=[IO.File]::ReadAllBytes((SafePath $Root $manifest.Engine.Source))})
            $engineMessage='순정 jack.exe를 재도색 수정 엔진으로 교체합니다.'
        }else{$engineMessage='순정 jack.exe이지만 Qt5Widgets.dll 버전이 맞지 않아 엔진은 바꾸지 않습니다.';Warn $engineMessage}
    }elseif($engineHash-eq $manifest.Engine.After){$engineMessage='재도색 수정 엔진이 이미 설치돼 있어 그대로 둡니다.'}
    else{$engineMessage='커스텀/미상 jack.exe는 그대로 둡니다 (SHA-256 '+$engineHash+').'}

    foreach($img in $manifest.Images){
        $target=SafePath $GamePath $img.Rel
        if([IO.File]::Exists($target)-and (Hash $target)-eq $img.Hash){continue}
        $plan.Add([pscustomobject]@{Rel=$img.Rel;Data=[IO.File]::ReadAllBytes((SafePath $Root $img.Source))})
    }

    # 일반 이미지: 별도 명시 동의가 있을 때만, 백업 없이 기존 경로에 덮어쓴다.
    $general=@($manifest.General)
    $generalOk=$false
    if($general.Count-gt 0 -and $Mode-eq 'Apply'){
        $generalOk=Ask ("원본이미지 교체에 동의하십니까?`r`n`r`n캐릭터·NPC·일반 배경 이미지를 기존 파일에 덮어씁니다. 현재 설치된 다른 이미지팩도 같은 경로의 그림은 교체됩니다. 원본 이미지를 백업하지 않으며 이 패치로 자동 복구할 수 없습니다. 일괄 교체 대신 원하는 파일만 골라 수동 교체할 수도 있습니다.`r`n`r`n[예] 동의하고 교체 / [아니요] 교체하지 않음")
        if(-not $generalOk){Write-Host '일반 이미지는 교체하지 않습니다. UI만 설치합니다.'}
    }

    $entries=foreach($p in $plan){$t=SafePath $GamePath $p.Rel;$ex=[IO.File]::Exists($t);$b='ABSENT';if($ex){$b=Hash $t};[pscustomobject]@{Rel=$p.Rel;Existed=$ex;Before=$b;After=(HashBytes $p.Data)}}
    $summary=$(if($null-ne $active){'이전 SNKmod UI 설치('+$active.State.Version+')를 정리하고 새로 설치합니다.'+"`r`n"}else{''})+$(if($qspHash-eq $manifest.Qsp.Hash){'jack.qsp는 이미 이 패치의 파일입니다.'}else{'jack.qsp를 이 패치의 파일로 교체합니다.'})+' 쓸 파일 '+$plan.Count+'개.'+"`r`n"+$engineMessage
    if($Mode-eq 'Check'){
        $msg='CHECK: 게임 파일을 바꾸지 않았습니다.'+"`r`n"+$summary+"`r`n`r`n"+$OrderNote
        if($script:Warnings.Count-gt 0){$msg+="`r`n`r`n경고:`r`n- "+($script:Warnings -join "`r`n- ")}
        Tell $msg;exit 0
    }
    if($plan.Count-eq 0 -and -not $generalOk){Tell ('SNKmod UI 파일이 모두 설치돼 있습니다.'+"`r`n"+$engineMessage);exit 0}
    if($script:Forms -and -not (Ask ('게임을 닫아 주세요. SNKmod UI를 설치할까요?'+"`r`n"+'원본 UI 이미지는 바꾸지 않고, jack.qsp·base.css는 복구용 원본을 보관한 뒤 교체합니다.'+"`r`n`r`n"+$summary+"`r`n`r`n"+$OrderNote+$(if($script:Warnings.Count-gt 0){"`r`n`r`n경고:`r`n- "+($script:Warnings -join "`r`n- ")}else{''})))){exit 0}

    $folder=Join-Path $stateRoot ((Get-Date).ToString('yyyyMMdd_HHmmss')+'_'+[Guid]::NewGuid().ToString('N').Substring(0,8))
    foreach($e in $entries){if($e.Existed){$t=SafePath $GamePath $e.Rel;$b=SafePath (Join-Path $folder 'original') $e.Rel;[void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($b));[IO.File]::Copy($t,$b);if((Hash $b)-ne $e.Before){throw '보관본을 만드는 동안 파일이 바뀌었습니다.'}}}
    [void][IO.Directory]::CreateDirectory($folder)
    $state=[pscustomobject]@{Package=$manifest.Package;Version=$manifest.Version;Status='applying';Files=@($entries);Warnings=@($script:Warnings)}
    SaveState $state $folder
    try{
        for($i=0;$i-lt $plan.Count;$i++){$p=$plan[$i];$t=SafePath $GamePath $p.Rel;if((HashOrAbsent $t)-ne $entries[$i].Before){throw ('설치 중 파일이 바뀌었습니다: '+$p.Rel)};Commit $t $p.Data}
        $state.Status='applied';SaveState $state $folder
    }catch{
        $reason=$_.Exception.Message
        try{RestoreState $state $folder}catch{Write-Warning ('자동 복구 실패: '+$_.Exception.Message+'; 기록: '+$folder)}
        throw $reason
    }
    $failed=New-Object Collections.Generic.List[string]
    if($generalOk){
        foreach($g in $general){try{Commit (SafePath $GamePath $g.Rel) ([IO.File]::ReadAllBytes((SafePath $Root $g.Source)))}catch{$failed.Add($g.Rel)}}
        if($failed.Count-gt 0){Warn ('일반 이미지 '+$failed.Count+'개 교체 실패 (자동 복구 없음): '+($failed -join ', '))}
    }
    $msg='SNKmod UI를 설치했습니다. 게임을 다시 시작하세요.'+"`r`n"+$summary+"`r`n"+'복구 기록: '+$folder
    if($script:Warnings.Count-gt 0){$msg+="`r`n`r`n경고:`r`n- "+($script:Warnings -join "`r`n- ")}
    Tell $msg
}catch{
    Write-Host ('[JO9 UI SNKmod 오류] '+$_.Exception.Message) -ForegroundColor Red
    if($script:Forms){[void][Windows.Forms.MessageBox]::Show($_.Exception.Message,$Title,'OK','Error')}
    exit 1
}
