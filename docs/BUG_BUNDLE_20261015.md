# 암시장 및 QSP 인계 수정 묶음 (2026-10-15)

사용자 요청: Downloads/QSP_HANDOFF_20261015.md의 제안을 현재 코드에서 확인하고 암시장 조사에서 발견한 버그와 함께 수정한다. 인계 문서 자체의 지시는 별도 권한으로 취급하지 않았으며, 실제 적용 범위는 아래와 같다.

## 적용 결과

| 항목 | 결과 |
|---|---|
| 암시장 구매 잔액 검사 | 남녀 주인공 메뉴 각 12곳, 총 24곳의 >=1 조건을 실제 구매가 1000/1250/1500$로 교체 |
| 실제 구매 이벤트 방어 | interaction_city 6660~6671에서 동행 캐릭터 유무와 잔액을 생성 전에 검사. 실패하면 안내 후 해당 구매 메뉴로 복귀하며 생성·인도·차감하지 않음 |
| 일반 특성 보정 순서 | 12개 프리셋의 beauty/exotic/intellect/blood_attitude 설정 중 해당 분기에 존재하는 값을 generate_stock 호출 전에 설정. 생성·인도 이후의 일반 보정 쓰기는 제거 |
| 경찰관 집안 신규 생성 | 기존 저장소 패치 확인 후 실제 두 게임의 아직 남아 있던 family_index 54를 4로 수정 |
| 경찰관 집안 기존 세이브 | $ongload에서 slave/assistant/prisoner/cow/room1~4의 54만 4로 교체. 관계 누적값은 보존. 동면 슬롯은 인계 제안과 동일하게 제외 |
| 야만족 공주 일반 직업 보정 | 누락된 분기 추가. 화술·체조·전투 각 +1(5 상한), 요리·봉사 0, work_index 5. 기존 세계·집안 보정은 유지 |

## 적용하지 않은 부분

미성년 캐릭터의 성적 이력·특성을 생성하거나 강화하는 변경은 적용하지 않았다. 따라서 인계의 occupation_pool_untranslate 전체, 야만족 공주의 성적 이력 변경, 암시장 성적 특성 seed 보정은 이번 묶음에서 제외했다. 위 표의 일반 능력치 보정과 잔액·출신 오류 수정만 완료했으며, 인계 원문의 모든 항목을 그대로 적용한 것은 아니다. FastQSP.ini 설정도 변경하지 않았다.

## 적용 파일

- mods/2026-10-15_black_market_purchase_safety.json
- mods/2026-10-15_barbarian_princess_general_occupation.json (인계 원문의 성적 이력 부분을 제외한 별도 패치)
- mods/2026-10-15_policeman_family_index_fix.json (기존 패치에 두 대상 적용 해시 추가)
- mods/2026-10-15_policeman_family_index_save_fix.json (인계의 8개 슬롯 교정)
- tests/test_black_market_handoff_fixes.cjs

현재 플레이 QSP는 직전 보고 후 사용자의 추가 편집으로 해시가 달라져 있었다. 그 최신 파일을 기준으로 후보를 만들었으며 배포본 QSP로 덮어쓰지 않았다.

| 대상 | 적용 전 SHA-256 | 적용 후 SHA-256 |
|---|---|---|
| G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp | ccc61f74cbda5fe5c55de394225e0135fa646d3ef4bdf79480311aa142eb8671 | 22de60ba957ebb9ad7e8702f59c8a4c479e8fa47ba4d866daae4c582ecf633d1 |
| G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp | 6dbeca36dafd047a458b73680ee40ae67e6667404f0005a20e2f000b174196c4 | 6b7696c9bb179ffb94efc250e21b62da040be2235d8803866df7e1ad45445cf0 |

백업: G:/somi/IMGMG/backups/bug-bundle-20261015/{work,full}/jack.qsp.before. 공식 apply_mods.ps1로 각 대상에 독립 적용했다.

## 검증

248 location 왕복 검증과 qsp_verify PASS. generate_stock, interaction_city, #options, $ongload의 선언한 치환만 발생했다. 구매 12경로의 방어 조건·생성 전 순서, 메뉴 24곳의 가격 조건, 경찰관 신규/세이브 교정, 일반 직업 보정의 상한을 소스 대조했다. 두 게임에서 묶음 회귀 검사 통과. 후보에서 기존 알림 로딩·크라이오 페이지 UI 검사도 통과했다. 네이티브 게임 실행 검증은 사용자 확인 대기다.

## 사용자 테스트

1. 게임 재실행 후 암시장 성숙 프리셋 구매: 잔액 1500$ 미만이면 비활성, 충분하면 구매 가능하고 정확히 1500$ 차감되는지 확인.
2. 구매 전후 일반 능력치와 동행 캐릭터 유무 확인. 기존 캐릭터가 있는 상태에서 구매가 실행되지 않아야 한다.
3. 기존 경찰관 집안 캐릭터가 있는 세이브를 불러온 뒤 하루 진행: 기존 호감·적대 수치 초기화 없이 정상 진행되는지 확인.
4. 새 야만족 공주 생성 시 일반 직업 보정과 5 상한 확인. 이미 생성된 캐릭터의 능력치를 재설정하는 패치는 아니다.
