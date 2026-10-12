# 홈컴 작업 검수·이미지 이전 — 2026-10-12

## 검수 결과

- 홈컴 인계 커밋 9개 모두 main 포함. 대사 보기·게임 화면 미리보기·최소 mods·검색/장면·그림 규칙, 홍등가 장면과 미술 교사 원천 보존 확인.
- 현재 대사 편집실 실행 코드: 저장소와 설치본 차이 0개. 테스트 파일만 설치본에 과거 판본이 남아 있으며 실행 코드에는 영향 없음.
- 홈컴 v8 이미지팩 249개 모두 보존된 이미지 원천에서 동일 해시 확인.
- 공유 작업 파일 2,911개 전체 해시 대조 통과. QSP·체크 상태·작업번호·진행/이력/개인패치 장부 일치.
- SNKmod 경로 별칭의 이전 누락을 발견하여 보완. 원천을 이식용 seed와 공유본에 저장하고 내보내기·복원 회귀 검사 통과.
- 로컬 브랜치들의 이력은 원격 브랜치에도 존재. 모든 알려진 ref의 Git bundle을 로컬 검수 폴더에 추가 보존했다. 오래된 브랜치를 최신 main에 무조건 병합하지 않았다.
- 대사/분기/변수/장면 전환 회귀 31개 통과, Windows 파일 symlink 미지원 1개 건너뜀. 관리기록 3개·내보내기 11개 통과.

## 이전 전체 백업 (최종 선택 묶음 아님)

[Google Drive 날짜 폴더의 homecom](https://drive.google.com/drive/u/0/folders/1g8roGyvXMoVAN6uhBSURYFxEnUqLDKZr)

|묶음|이미지 수|원본 파일 합계|ZIP 용량|검증|
|---|---:|---:|---:|---|
|play_images|31,531|10.886 GB|10.893 GB|전체 해시 일치|
|working_images|156|0.076 GB|0.076 GB|전체 해시 일치|
|IMGMG_image_sources|22,061|6.013 GB|6.019 GB|전체 해시 일치|
|archived_images|336|0.101 GB|0.101 GB|전체 해시 일치|

원본 파일을 읽으며 SHA-256 기록 → ZIP 내부 모든 파일을 다시 읽어 동일 SHA-256 확인 → 원본 파일 집합·크기·수정시각 재검사. 원본 삭제 없음. 묶음 간 중복도 원천/이력을 보존하기 위해 유지했다. PSD/PSB/XCF/KRA/TGA/DDS/EXR/HEIC/JFIF/JXL/SVGZ 추가 작업 원본은 조사한 네 폴더에서 0개였다.

전송은 이미지 파일만으로 제한했다. 전체 게임·세이브·저장소 외부 전송은 자동 승인 검토에서 범위 초과로 거절되어 실행하지 않았다. 코드·작업 기록은 main 및 기존 JO9WORK에 보존하고, 별도 순정 비교 폴더와 junction은 제외 기록에 명시했다. 상세 파일별 해시는 Drive 폴더의 *.manifest.json, 전체 요약은 TRANSFER_AUDIT.json에 있다.

## 다음 PC에서 적용 기준

최신 QSP SHA-256: `6997bd3ce1bcf073da2d0a77cc7a516352adb3ca0d0edbb80c0591163a33f285`. 플레이 QSP와 JO9WORK/game-checkpoint/jack.qsp 동일 확인.

전체 mods DryRun은 옛 미술 교사 패치에서 중단됐다. 현재 루푸스 교사 id·정식 이미지 경로·결과 판정과 성별별 6단계 평가가 모두 살아 있음을 직접 확인했다. 이번 검수에서 QSP는 수정하지 않았다. **다른 PC에서는 검증된 최신 QSP 체크포인트를 사용한다. 순정부터의 일괄 재빌드가 검증되었다고 취급하지 않는다.** 이 재적용 호환성은 후속 작업으로 남긴다.

Google Drive 웹에서 네 ZIP 및 네 manifest 모두 표시되고, 각 ZIP의 서버 표시 용량이 로컬 용량과 일치함을 확인했다. ZIP 내부 SHA-256은 마운트 드라이브에서 전수 검증했고, 서버 파일을 다시 다운로드해 해시 검증한 것은 아니다.

## 이미지 복원 경로

ZIP 안에는 아래 원천 폴더 기준의 상대 경로가 들어 있다. 새 PC에서는 해당 용도의 새 경로에 푼다.

|ZIP|홈컴의 원천 폴더|
|---|---|
|play_images.zip|`G:/somi/JO9/game/content/pic`|
|working_images.zip|`G:/somi/JO9/game/content/modworkpic`|
|IMGMG_image_sources.zip|`G:/somi/IMGMG`|
|archived_images.zip|`G:/somi/JO9_unused_images` (게임 밖 보관)|

기존 같은 이름의 파일을 덮어쓰기 전 manifest 해시와 현재 작업 상태를 확인한다. 게임 실행 파일·세이브·소스는 이미지 ZIP에 포함되지 않으며 Git main과 기존 JO9WORK를 함께 사용한다.


## 최종 인계: 개인 교체·추가 이미지만

사용자 확정 범위: **내가 교체·추가한 패치 이미지만 — 기존 게임·외부팩 이미지는 제외**.

[2026-10-12 개인 패치 이미지 폴더](https://drive.google.com/drive/u/0/folders/1B8fgspH5uAjkJZt-aDhVKRRdfOqjwBoR)

최종 파일은 **JO9_personal_patch_images_complete_20261012.zip**이다. 이미지 **687개**, 원본 합계 133,633,200바이트, ZIP **133,741,910바이트 (127.5 MiB)**.

- 최신 개인작업 장부 456개를 모두 포함했다. 장부 이전 홈컴 v8 제작팩, 버전 관리된 개인 UI 제작팩·버튼 명세 및 현재 개인 UI 프로젝트까지 대조했다.
- 기존 게임과 동일한 이미지, 외부팩, 원본 비교 컷, 초안·백업은 제외했다. 현재 baraholka 및 ui overhaul/baraholka 두 파일은 use_allgirl_pack 이력과 해시가 일치해 제외했다.
- 예전 SNKmod 경로는 현재 정식 경로로 대응했다. 폐기 1.2.1 이름과 SNKmod 경로는 최종 ZIP에 없다. 역사적 제작팩 대조에서 남은 미해결 해시 불일치 0개.
- 원본 → 로컬 ZIP → 마운트 드라이브 ZIP의 687개 파일 전체 SHA-256 검증 통과. 웹에서 최종 ZIP·manifest·README_FINAL 및 표시 용량 확인.
- **서버 파일을 재다운로드한 뒤의 SHA-256 검증은 완료하지 못했다.** 다운로드 요청 후 완료된 로컬 파일을 얻지 못했으므로 서버 바이트 검증으로 기록하지 않는다.

ZIP SHA-256: `72fbe975c36607861fd148d0daef436413fe30de9fa02c37f77e1b6a1b801714`.

상세 목록·출처·제외 사유: [개인 이미지 전송 검수 JSON](qa/2026-10-12_personal-image-transfer.json), Drive의 PERSONAL_PATCH_COMPLETE.manifest.json. 최종 ZIP 내부는 game/content/pic 기준이다. 게임 루트의 상위 폴더에 풀어 복원한다.

같은 Drive 폴더의 456개 JO9_personal_patch_images_20261012.zip은 장부만으로 만든 부분 묶음이다. 앞선 homecom 전체 백업 및 homecom_required 의존 묶음도 보관본이며, **이번 확정 범위의 인계에는 complete ZIP을 사용한다.** 실행 파일·세이브·게임 소스는 포함하지 않으며 최신 Git main 및 JO9WORK 체크포인트를 함께 사용한다. 원본 이미지 삭제 없음.
