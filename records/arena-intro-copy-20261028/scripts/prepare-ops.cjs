'use strict';
const fs=require('node:fs');
const source=__dirname+'/../battle-legacy-axe-20261028/';
let install=fs.readFileSync(source+'install.cjs','utf8');
install=install.replaceAll('battle-legacy-axe-qa-20261028','arena-intro-copy-qa-20261028').replaceAll('records/battle-legacy-axe-20261028','records/arena-intro-copy-20261028').replaceAll('2026-10-28_arena_special_text_ui.json','2026-10-28_arena_intro_copy.json').replaceAll('UI_QA_KO.md','CACHE_REVIEW_KO.md').replaceAll('## 2026-10-28 격투대회 옛 필살기 아이콘 제거','## 2026-10-28 격투대회 소개문 수정').replace('대회 전용1회 필살기의 녹색도끼 등 옛 이미지 출력을 기존 텍스트 메뉴로 교체. 원래 기술 EXEC·사용 조건·1회 제한 보존, 신규 일반전투 메뉴 허용 없음.','진행자 소개문을 승자 주인이 패자의 생사를 결정하는 설정으로 수정. 실제 주인·노예 이름을 보존하고 남녀 주인공 모두 해당 문구만 좁게 갱신. 전투·보상·참가조건 변경과 신규 저장 상태 없음.');
fs.writeFileSync(__dirname+'/install.cjs',install);
let cleanup=fs.readFileSync(source+'cleanup.cjs','utf8').replaceAll('battle-legacy-axe-qa-20261028','arena-intro-copy-qa-20261028');fs.writeFileSync(__dirname+'/cleanup.cjs',cleanup);
console.log('Prepared scoped installation and diagnostic cleanup operations from the verified previous workflow.');
