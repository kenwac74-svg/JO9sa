# 배포 포장 기본값 — 설치기 없는 ZIP

2026-10-19 사용자 확정:

> 앞으로는 백업은 알아서 사용자들이 할테니 미설치 버전으로 해줘
>
> 지금버전도 일단 ZIP으로 다시 패키징

이후 JO9 배포물은 별도 지시가 없으면 압축 해제·폴더 합치기·파일 덮어쓰기 방식의 ZIP으로 만든다. 설치용 실행 파일·설치 스크립트·자동 백업 기능을 추가하지 않는다. 배포본을 받는 사용자의 백업은 사용자에게 맡긴다. 게임 구동에 필요한 실행 파일과 설치기는 구분한다.

이 지시는 사용자용 설치 절차에 관한 것이다. 개발 중 원본 보존·수정 전 백업·출고 검증·Full/간소 배포의 세이브 차이는 기존 규칙을 유지한다. 기존 ZIP은 이력으로 보존하고 새 이름으로 재패키징한다.

## 이번 1차 패치

- 최신 배포 파일: G:/somi/JO9_2.4_FirstPatch_20261019/JO9_2.4_FirstPatch_20261019_Manual.zip
- 4파일: game/jack.qsp, game/css/base.css, README_KO.txt, CHANGELOG_KO.md
- 크기: 3,729,593 bytes
- SHA256: def5ae2f44670f6df7c2abfbceca80a7332c790bb5a42b686d5a96d46d60ad40
- 설치기·설치 스크립트·자동 백업·세이브·JSON·이미지 추가 없음.
- QSP91db7a7b…와 CSSf2b2701f…는 기존 자동 출고 PASS 통합본 및 현재 Work와 바이트 동일하다. 게임 코드는 바꾸지 않고 포장과 안내만 변경했다.
- ZIP CRC·재추출 전후 전체 파일 비교·런타임 해시 및 읽기 전용 독립 검토 통과. 엔진 검사를 새로 실행한 것으로 보고하지 않는다.
- 이전 설치기 포함 ZIP은 과거 기록이다. 앞으로 다운로드 안내에는 _Manual.zip을 사용한다.

수동 적용은 게임 종료 후 압축 안의 game 폴더를 기존 실행 파일 옆의 game 폴더와 합쳐 동일 파일을 덮어쓰는 방식이다. 기존 폴더를 통째로 삭제하지 않으며 세이브와 사용자 이미지 팩을 유지한다.

## r2 최신 배포

G:/somi/JO9_2.4_FirstPatch_20261019/JO9_2.4_FirstPatch_20261019_Manual_r2.zip

SHA-256 4482a532730b9720732f12c8e51d8f01efb4e5d464a26524504adeb6068cb966, 3729891 bytes. 임신 아이콘 연결·상태열 배치를 포함한 QSP b0c40f46bc020c9d372e72e490ccde28894d31797bcf1653a7b7aac1e3490f71, CSS 593f1f8e4aa80413b2da01af9bb8ffe35a869738f0652f5df821e4bbb4b0ffc3로 갱신했다. 4파일 수동 ZIP이며 이전 ZIP은 보존한다. 새 실제 엔진 출고 검사와 Full 대조 PASS, CRC·재추출·런타임 일치 확인. 이후 다운로드 안내는 _Manual_r2.zip을 사용한다.

## 2026-10-20 최신 r3

G:/somi/JO9_2.4_FirstPatch_20261020_r3/JO9_2.4_FirstPatch_20261020_Manual_r3.zip

SHA-256 27117c23c03e712e0db83d8c8c46abbc3c5bf64be9b2f083052feb4fd25629f9, 3730610 bytes. 최신 Work QSP20137b73…/CSS593f1f8e…의4파일 수동 ZIP. 교육 수정 포함, 실제 기본 엔진9경로·누적재생/멱등성·ZIPCRC/재추출 일치 PASS. Full·이전ZIP·커밋·푸시는 변경하지 않았다. [최신 배포 상세](FIRST_PATCH_RELEASE_20261019.md).

## 2026-10-21 2차 누적 사용자 테스트 후보 (SECOND_PATCH_TEST_ZIP_20261021)

`G:/somi/JO9_2.4_SecondPatch_20261021_Test/JO9_2.4_SecondPatch_20261021_Cumulative_Test.zip` / 4,186,287,284 bytes / SHA256 `9d03d72d985a43a429623bb2b09f3b5f85e19a4057a982e1ea6bfa6fcb71678e`.
설치기없는수동덮어쓰기방식. 1차/r2/r3누적수정과미배포이미지/JSON포함. 세이브·개인설정·도구미포함. 구도나25파일은정확목록대로수동제거해야함. 사용자가배포폴더에직접적용해확인할테스트후보이며공개배포완료가아님. Full동기화/커밋/푸시없음. [검증결과](../records/second-patch-zip-20261021/FINAL_RESULT.json).

## 2차 테스트 빌드 분리·도나 JSON 삭제기 (SECOND_PATCH_SPLIT_AND_DONA_CLEANER_20261021)

사용자 최신 지시: 본체(QSP/비이미지/도나JSON삭제기), 인디이미지팩, 개인제작/교체이미지팩의 세 ZIP으로 분리한다. 기존 설치기없는ZIP기본값은 유지하며, 이번 정확25파일 정리 유틸만 명시적으로 추가 승인했다. 자동설치·자동백업·게임시작시자동삭제를 추가한 것이 아니다.

- core: `G:/somi/JO9_2.4_SecondPatch_20261021_Split/JO9_2.4_SecondPatch_20261021_Core_Test.zip` / 3865289 bytes / SHA256 `418f9fd7cf4fa7dbb9dda4a584c9b18d5be073caf0d8cfaf2112f170944a7664`
- indie: `G:/somi/JO9_2.4_SecondPatch_20261021_Split/JO9_2.4_IndieImages_20261021_Test.zip` / 4154774006 bytes / SHA256 `91c8f6ef227064b7af1b177e888dbe85b3200f06ee62d2de77f3bd67d40afdf1`
- sank: `G:/somi/JO9_2.4_SecondPatch_20261021_Split/JO9_2.4_SAnkImages_20261021_Test.zip` / 26638087 bytes / SHA256 `c73aaa66a65100065bcb3131c6ac5d5e5b919e8c3efbaf1fce87c18f11839236`

- 본체: QSP1/CSS1/게임JSON32. 이미지0. 1차/r2/r3수정 포함.
- 인디팩: PSP_PSP6799경로. 개인팩: SAnk118파일(bg19/mob99,B컷7포함). 두이미지팩비중복·합6917,기존통합ZIP런타임6951파일과정확동일.
- 최초적용은인디이미지팩과본체를함께적용한다. CORE의2323등인물/외형JSON은인디팩이미지에의존한다. 기존통합ZIP이미지가적용돼있으면본체만다시받을수있다. 개인이미지팩은별도적용가능.
- 삭제기3파일은본체에포함. 실행파일옆최상위에복사하고CMD를직접실행하면정확한구도나25파일만검사·삭제한다. 목록SHA고정,대상/정상고번호SHA대조,전체사전검사,루트/상위/대상재분석점거부,비재귀Literal삭제,미리보기/재실행지원. 수정/누락이있으면중단. 원작같은번호JSON/정상8877~8901/세이브/QSP는삭제하지않는다.
- 삭제기는격리시험폴더에서만실행했다. 실제Work/Full에는실행하지않았다. 정상제거/재실행/부분부재/WhatIf·DryRun/변조거부/정상파일누락/잘못된폴더/정션/명세변조등18회귀PASS.
- 분리ZIP모든항목CRC/SHA확인및독립검토PASS. 게임QSP는앞선공식실제엔진9경로/재생/멱등성PASS본과동일하며새게임로직수정없음. 실제엔진9검사를이번포장만으로새로실행했다고주장하지않는다.
- Full동기화/Work런타임수정/세이브수정/커밋푸시없음. 예전4.19GB통합테스트ZIP은과거검증산출물로보존하며새다운로드안내는세분리팩을사용한다.

[최종결과](../records/second-patch-split-20261021/FINAL_RESULT.json), [삭제기회귀](../records/second-patch-split-20261021/utility-test-result.json), [독립검토](../records/second-patch-split-20261021/independent-split-review.json).

## 인디 JSON 소속 수정·r2 테스트 빌드 (INDIE_JSON_MOVED_TO_RESOURCE_PACK_20261021)

사용자 승인: 인디 외형/등록 JSON31개는 해당 인디 이미지와 같은 리소스팩에 둔다. 이전 본체JSON32개 구성은 이 r2가 대체한다.

- core: `G:/somi/JO9_2.4_SecondPatch_20261021_Split/JO9_2.4_SecondPatch_20261021_Core_Test_r2.zip` / 3831307 bytes / SHA256 `93d11e242a6c70261f333653b4dc1bc2158ada00f03e0605957bae9d532cf1be`
- indie: `G:/somi/JO9_2.4_SecondPatch_20261021_Split/JO9_2.4_IndieResources_20261021_Test_r2.zip` / 4154806749 bytes / SHA256 `ab95c03aa11beeb4f56d653b99952c584575c23c9797b16dd077fe48ebdbcda9`
- sank: `G:/somi/JO9_2.4_SecondPatch_20261021_Split/JO9_2.4_SAnkImages_20261021_Test.zip` / 26638087 bytes / SHA256 `c73aaa66a65100065bcb3131c6ac5d5e5b919e8c3efbaf1fce87c18f11839236`

- 본체 런타임은 QSP/CSS/211.json의3파일. 기존 도나25파일 정리유틸3파일도 유지. 이미지와 인디JSON은 없음.
- 인디 리소스팩은 이미지6799경로+연결JSON31개. 개인 이미지팩118파일은 바이트변경 없이 기존 ZIP을 사용.
- 이동31JSON은 인디통합 원명세와 경로/해시까지 일치. 211.json은 기존 승인 문법수리로 본체에 남음. 전체6951런타임 합집합/내용은 이전 검증 통합본과 같음.
- 인디팩 없이 최초 본체만 적용하면 기존2.4 인물등록상한/외형연결을 유지한다. 2323등 새인디등록은 인디팩을 적용할 때만 들어온다. 기존 인디팩/2323개체를 사용중이라면 해당JSON·그림은 유지하며 본체가 삭제/복원하지 않음.
- 실제 최초2.4 JSON에 본체211수리·정확구도나25제거를 모사한 별도구성으로 공식 실제엔진9경로/구조/줄경계/재생/멱등성/인물등록/추출QSPmirror PASS. 인디JSON31을 추가한 전체JSON은 Work와 해시·경로 일치.
- 삭제기는 기존18시험PASS 동결본과 동일하고 새기능변경 없음. 실제세이브선택UI/모든인물·화면·분기는 사용자플레이확인대상.
- 새2ZIP전항목CRC/SHA검사와독립검수PASS. 기존ZIP은보존하고활성README/목록을r2로갱신. 개인팩재압축/복사없음.
- Work/Full/세이브/커밋·푸시변경없음. 생성된격리QA/JSON복사본은증거보관후정리.

[최종결과](../records/second-patch-json-r2-20261021/FINAL_RESULT.json), [본체단독실제출고검사](../records/second-patch-json-r2-20261021/release-validation.json), [독립검수](../records/second-patch-json-r2-20261021/independent-review.json).

## 특성 표시명 통일 (PEERLESS_DISPLAY_NAME_20261021)

사용자 지시: QSP만 수정하여 경국지색을 절세미인으로 변경한다.

- Work/game/jack.qsp의 menu_form 1곳·jo9_traits 3곳, 총4표시만수정. 기존능력치계산표시2곳은이미절세미인이라보존.
- 내부키jo9_peerless/분기peerless/효과수치/배열/저장자료/캐시버전유지. 새함수·영구키·세이브변환0.
- 이전QSP `404b57f83893e6fc06ff69260b654de770de09a75c3709570c0eaa2d23411365` → 현재 `698513ebb8e0383f0fc2a6eb9b7bdc433a944e516a6f44ad9353689fdda4c000`.
- 새본체 `G:/somi/JO9_2.4_SecondPatch_20261021_Split/JO9_2.4_SecondPatch_20261021_Core_Test_r3.zip`, SHA256 `26f42c7a215e13a2f46a2e1bc33c33c387949a86053cb79a76de6b7ae6bb9f37`. 런타임변경은jack.qsp하나. CSS/211.json/정리유틸/인디JSON·이미지팩/개인이미지팩불변. 최신활성목록/README만새본체로연결.
- 구조/줄경계·정확재생/멱등성·인물등록·ZIPmirror·실제엔진9경로PASS후기존적용기로Work반영·바이트일치확인. 원본은r2본체ZIP의동일jack.qsp로복구가능하게해시검증. 새로생긴중복49MB백업은이검증후정리.
- 실제화면/GUI세이브전체복원은사용자확인대상. 배포FullQSP·세이브·다른팩·커밋푸시는변경하지않음.

[결과](../records/peerless-display-rename-20261021/FINAL_RESULT.json), [문법/엔진검사](../records/peerless-display-rename-20261021/release-validation.json), [독립검수](../records/peerless-display-rename-20261021/independent-review.json), [재현패치](../mods/2026-10-21_peerless_display_name.json).

## 사용자 대사 수정기 저장분 동기화 (USER_DIALOGUE_EDITOR_SYNC_20261021)

- 저장 이력 15건의 해시 연결을 검증. 서로 되돌린 2건을 제외한 최종 문구 13곳(#npc_base 12, interaction_city 1)을 원문 그대로 보존.
- WORK는 이미 저장 완료된 최신 QSP였으므로 다시 덮어쓰지 않음. 배포용 Full/game/jack.qsp만 동일 바이트로 반영.
- 1차 누적 구성 및 절세미인 표시명을 포함하는 Core_Test_r4.zip 생성. CSS·211.json·삭제기·인디/개인 이미지팩 불변. 이전 ZIP 보존.
- 구조/줄·주석 경계/정확 재생·재적용/등록 JSON/실제 엔진 9경로 및 코어 단독·Full 배포 QSP 대조 PASS. 세이브·설정·Full의 다른 파일 보존 확인.
- 새 상태 키·기능 변경·세이브 변환 없음. 실제 세이브 GUI 불러오기와 화면 문구는 별도 사용자 확인 대상. 커밋·푸시 보류 유지.

[결과](../records/dialogue-editor-sync-20261021/FINAL_RESULT.json), [사용자 수정 재현 기록](../mods/2026-10-21_user_dialogue_editor_sync.json).


## 2026-10-26 — 3차 누적 패치 제작 완료

[배포기록](THIRD_PATCH_RELEASE_20261026.md). 본체·개인팩신규,인디팩2차동일재사용. 원장대조로누락19추가확인해기존118+신규27=개인이미지145/JSON1을포함. 전체6983런타임·ZIPCRC/SHA·공식엔진9·독립67PASS. 이미지체크리스트/이력갱신. 기존ZIP/WORK/Full/세이브보존,커밋푸시없음. 설치/파일명은3차출력README가우선.


## 2026-10-26 — 승인 추가 수정 포함 3차 r1

[최신 배포 기록](THIRD_PATCH_RELEASE_20261026_r1.md). 랠리 거절·상한 밖 기술 분류·이미지 JSON 두 건과 호환 PNG 두 개를 포함했다. 새 본체/개인팩 r1을 적용하고 인디팩은 재사용한다. 구조·수정 분기·최종 엔진 9경로·ZIP 무결성·독립 감사 PASS. 기존 ZIP/Full/세이브 보존, 커밋·푸시 없음.

## 2026-10-26 — 패치 빌드 잔여 공간 정리

[검증 기록](../records/patch-build-space-cleanup-20261026/SUMMARY_KO.md). 기존 임시 진단 사본은 정리 완료 상태였다. 같은 인디팩 ZIP 세 배포 경로는 SHA-256을 대조한 뒤 NTFS 하드링크로 통합하여 G 드라이브 약 8.31GB를 확보했다. 세 경로의 이름·ZIP 내용·체크섬은 그대로다. 배포 ZIP은 불변 자료로 취급하고 후속 빌드는 새 파일명으로 생성한다. 내용을 수정해야 할 경우 사본을 분리하며 하드링크된 기존 파일에 직접 쓰지 않는다. 유일한 작은 재현 자료 14개는 records/jo9-test-saves-load-probe-20261023에 보존했다. 세이브·원본 이미지·최소 복구 자료·재현 소스는 보존했다.


## 2026-10-26 — WORK 전용 동기화·이번 커밋/푸시 승인

[최신 정책](WORK_ONLY_SYNC_POLICY_20261026.md). 이번 완료 작업의 커밋·푸시는 사용자 지시로 수행한다. 이후 Kor_Full은 사용자 패치 설치·수동 테스트 대상으로 두고, 별도 명시 지시가 있을 때만 동기화한다. 커밋·푸시 시 자동 동기화 규칙은 대체됐다. WORK의 최신 소스·패치·검사 기록만 기준으로 삼는다.
