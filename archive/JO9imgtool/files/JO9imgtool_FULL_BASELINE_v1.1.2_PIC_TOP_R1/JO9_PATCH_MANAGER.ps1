$ErrorActionPreference='Stop'
$Root=(Get-Location).Path
$Payload=Join-Path $PSScriptRoot 'payload'
$Install=Join-Path $Payload 'JO9_Install.ps1'
$Restore=Join-Path $Payload 'JO9_RestoreVanilla.ps1'

while($true){
    Clear-Host
    Write-Host '================================================'
    Write-Host ' JO9 IMAGE WORKSHOP PATCH MANAGER v1.1.2'
    Write-Host '================================================'
    Write-Host ''
    Write-Host '  1. 패치 설치 / 업데이트'
    Write-Host '  2. 순정 복구'
    Write-Host '  0. 종료'
    Write-Host ''
    $choice=Read-Host '선택'

    switch($choice){
        '1' {
            & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $Install -GameRoot $Root
            Write-Host ''
            Read-Host 'Enter를 누르면 메뉴로 돌아갑니다'
        }
        '2' {
            & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $Restore -GameRoot $Root
            Write-Host ''
            Read-Host 'Enter를 누르면 메뉴로 돌아갑니다'
        }
        '0' { exit 0 }
        default {
            Write-Host '1, 2, 0 중 하나를 선택하세요.'
            Start-Sleep -Seconds 1
        }
    }
}
