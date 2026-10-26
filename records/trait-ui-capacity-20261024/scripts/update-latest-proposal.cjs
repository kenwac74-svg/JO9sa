'use strict';
const fs=require('fs'),assert=require('assert/strict'),repo='G:/somi/JO9sa',base=repo+'/records/trait-ui-capacity-20261024',file=base+'/PROPOSAL_KO.md';
let s=fs.readFileSync(file,'utf8');const cut=s.indexOf('## 추천');assert(cut>0);s=s.slice(0,cut)+`## 추가 검증: 상단 빈 간격 압축

기본 속성 글자는 그대로 두고 실제 빈 간격5곳을 약5px로 압축했다. 분류 제목은 추가하지 않았다. 3개 기존 실제 엔진 HTML을 사용해 Edge에서 각1번씩 해당 국소 배치를 확인했다.

| 화면 | 회수한 높이 | 새 목록 시작 | 12특성+8상태 끝 | 패널 아래 여유 |
|---|---:|---:|---:|---:|
|노예|80px|y436|y756|34px|
|조수|75px|y436|y756|34px|
|교육|75px|y436|y756|34px|

기본 속성의 기존20px 값과 상단 기준 위치를 유지하고 목록만16px/줄 간격16px로 측정했다. 실제 긴 상태 표본의 줄바꿈과 목록 행 겹침은 없었고, 기본 속성의 행 겹침도 없었다. 위의 폰트만 변경한 표는 기존 여백 유지 조건이며 이 추가 배치와 구분한다. 새 QSP 실행·게임 적용·Qt 픽셀 검증을 통과했다는 의미는 아니다.

## 최신 추천

**선천5·후천4·성취3, 총12개를 유지하는 안을 우선 추천한다.** 기본 속성 글자는 그대로 두고, 그룹 사이 빈 간격만 약5px로 줄이며 특성·상태 목록은16px/줄 간격16px로 표시한다. 상태최대8행을 항상 수용하고 분류 제목은 추가하지 않는다.16px는현재20px 대비20% 축소다.

이 배치에서 표본의 하단 여유34px가 남아 이전 대리측정과 실제 게임의20~30논리px 차이를 고려할 공간이 있다. 모든 Qt 창크기·모든 미래명칭을 보증하는 것은 아니므로 실제 게임 화면 확인은 여전히 필요하다. 기존 중첩 font size2가 줄간격20px을 강제하지 않도록 목록 안 글자와 줄간격을 함께 정리해야 한다.

상단 여백을 반드시 유지한다면16px/16px에서 선천3·후천2·성취2, 총7개를 여유 있는 대안으로 둔다. 현재 배치에서12개를 위해12px로 줄이는40% 축소는 권하지 않는다. 이 두 안 중12개+상단여백압축안을 우선 제안하며 실제 게임에는 아직 적용하지 않았다.

인물의 기존 특성을 삭제하거나 숨기거나 효과만 남기는 변경은 하지 않았다. 실제 슬롯 획득 제한을 구현할 때는 특성별 분류와 선천/후천 양쪽 경로로 얻는 특성의 처리, 기존 초과 보유자 보존 방식을 따로 구체화해야 한다.

근거: [상태8행 분기 감사](STATUS_ROWS_KO.md), [폰트·여백 실측](font-options/REPORT_KO.md), [기존/압축 배치 비교](font-options/spacing-comparison.png). 이전7개 추천은 상단 여백을 유지하는 대안으로 갱신했다. 이번에는게임파일변경·커밋·푸시없음.
`;
fs.writeFileSync(file,s);const c=require(repo+'/tools/text-workshop/core.cjs');assert.equal(c.hash(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp')),'afb2b9eccbe02193f77fefea4a990081616a79eb84ed14fe2d8f0bbd3cf2d1fc');fs.mkdirSync(base+'/scripts',{recursive:true});fs.copyFileSync(__filename,base+'/scripts/update-latest-proposal.cjs');fs.unlinkSync(__filename);console.log('Updated 12-trait compact-spacing proposal; runtime unchanged');
