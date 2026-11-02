# 안개괴물 성장 단계 자산 조사 — 2026-10-30

현재 설치본과 기존 시안에서 **성장기/성숙/거대 전용으로 나뉜 전투·패배 이미지 세트는 찾지 못했다.** 현재 세 단계는 같은 초상·전신·패배 파일을 사용한다. 기존 보통/성숙 외형을 유지하고 성장기·거대의 전투/패배 네 컷을 별도로 갖추는 방향이 확인된 자산 현황과 맞는다. 이번 조사는 파일 생성·적용 없이 근거 JSON/MD만 저장했다.

| 단계 | 내부 적 ID | 현재 초상 | 현재 전신 | 현재 패배 |
|---|---|---|---|---|
| 성장기 | исчадие_молодь | spawn_ava.png | spawn.png | defeated/spawn.png |
| 보통/성숙 | исчадие | spawn_ava.png | spawn.png | defeated/spawn.png |
| 거대 | чудовщиное_исчадие | spawn_ava.png | spawn.png | defeated/spawn.png |

보통/성숙은 QSP 표시 이름이 안개 괴물이고 설명이 성숙한 안개 괴물이다. 성장기와 같은 뜻으로 쓰면 안 된다. 현재 QSP a5f9dcb31acac6160836d0f420a1ef0d697bf1e259619be4187ef8e5b1a829cc의 #противники:983–984,1050–1051,1135–1136에서 공유 경로가 확인된다.

## 동일 파일·동일 해시

WORK game/content/pic/mob/ 기준이다. 현재 추적본 resources/new와 기존 승인 출력도 동일 해시다.

- 초상 spawn_ava.png (150×150): 1c547ef4d04f137a1812b5541aaedcadad83b2cd9762ab5e37bfc56397159035
- 전신 spawn.png (795×596): acd85297ed4d83e08a1ea4ce3c514c3944c46532e3d83848b3ad3f43a0e9d739
- 패배 defeated/spawn.png (795×596): 5d4eef6ee1f473ac5d5d11f7f00dbfa650e58be3a1e4148964f0cfc3e7eeaf1a

현재 WORK modtools/catalog/catalog_merge_vs_original.html의 MOB 슬롯 3행 역시 이 경로·해시를 그대로 공유한다. tools/mob-image-sets/background-contexts.json도 세 적의 숲 전투/패배 연결이 같다.

## 기존 제작 기록에서 단계 변형을 찾지 못한 근거

output/fog-mob-redraw-20261029/metadata.json의 15_spawn_battle·15_spawn_defeat 두 항목은 aliases에 성장기·성숙·거대의 세 내부 ID를 모두 묶어 둔다. 이 제작에서 나온 것은 단 하나의 공통 전투/패배 세트다. label이 성장기 안개 괴물이라고 적혀 있어도 그 자료를 성장기 전용 시안으로 읽으면 안 된다.

records/mob-redraw-adopted-20261029/REPORT_KO.md는 공용 안개괴물 파일이 성장 단계 3종에 연결된다고 명시한다. 현재 그림도 바위 같은 비늘·주황 돌기·큰 수직 입·입 촉수·발톱을 가진 같은 괴물이다.

resources/new, resources/pending, assets/content, records와 프로젝트 output의 파일명 10,104개 및 resources/originals를 조사했다. spawn/원래 내부 단계명/성장기/성숙/거대 등으로 별도 단계 파일명을 찾지 못했다. 관련 출력의 제작 메타데이터와 현재 카탈로그까지 대조했다. 모든 개인 이미지 보관소를 전부 검색했다는 뜻은 아니다.

## 다른 후보의 재사용 가능성

- 과거 output/mob-background-composites-20261029/images/.../spawn.png와 defeated/spawn.png는 같은 괴물의 배경·구도·화풍 이전 버전이다. 단계별 체격/외형 차이를 의도한 자료가 아니다.
- 현재 gladiator_spawn.png와 defeated/gladiator_spawn.png는 아레나 배경의 별도 실루엣이다. 숲의 성장기·거대 단계로 바로 쓰는 근거가 없다.
- WORK의 gladiator_spawn (2).png는 물/늪 배경과 여러 인간이 포함된 이전 장면이다. 별도 성장 단계 시안이 아니다.
- 고해상도 generated PNG와 game-ready PNG의 해시 차이는 해상도/정규화 이력이며 새로운 성장 단계 그림 수로 세면 안 된다.

따라서 현행 spawn 전투/패배 한 쌍은 보통/성숙의 기준으로 재사용할 수 있고, 이번 요청의 성장기·거대 외형 차이를 기존 후보만으로 충족했다고 보기 어렵다. 원본·과거 시안·생성 원본은 보존한다.

## 조사 보존물과 한계

asset-audit.json에 현재 QSP·카탈로그·현재/과거 PNG 경로와 SHA-256, 시각 확인 결과, 공용 aliases 근거를 보존했다. WORK·추적·원본 파일을 수정하지 않았고 게임/엔진 실행, 이미지 생성, 잘라내기, 새 이미지 사본 작성은 하지 않았다.
