'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),crypto=require('crypto');
const W=process.cwd(),R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',D=R+'/records/release-prep-20261113',O=R+'/docs/release-prep/2026-11-13';
const rd=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),wr=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const old=rd(W+'/outputs/jo9-post3-20261110/audit-data.json'),latest=rd(R+'/records/post3-ledger-refresh-20261111/latest-data.json'),code=rd(W+'/release-change-ledger-audit.json'),assets=rd(W+'/release-assets-audit.json');
const currentHash=hash(fs.readFileSync(G+'/jack.qsp'));a.equal(currentHash,'2ad5be48346be378983ca0eb018067eb358b5a347b6863ff8c37bb1071f13d30');a.equal(currentHash,hash(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));a.equal(rd(R+'/assets/runtime-source-2.4.1.json').sourceQspSha256,currentHash);a.equal(code.currentQspSha256,currentHash);a.equal(assets.sourceQspSha256,currentHash);
fs.mkdirSync(D,{recursive:true});fs.mkdirSync(O,{recursive:true});
const link=(label,p)=>`[${label}](<${p}>)`,esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('|','\\|').replace(/\r?\n/g,'<br>');
const rows=old.rows.map(row=>({...row,historicalFollowup:latest.rows.find(x=>x.id===row.id)||null}));a.equal(rows.length,308);
const sections=code.postSnapshotHandoffSections; a.equal(sections.length,46);
const checklist=[
 ['R01','완료','배포 형태','2.4.2 풀버전으로 사용자 확정. 원본2.4.1+모든 승인 후속 변경을 포함.','2026-11-13 사용자 직접 답변'],
 ['R02','다음 검토','조커 재구매 플래그','메뉴는 jokr, 실제 구매는 joker. 동일 키와 구세이브 메뉴 캐시 처리안을 확인한 뒤 수정·회귀검사.','G01 · 현재 실행코드 불일치'],
 ['R03','확인 필요','의뢰·선호 설정 비교식','키키모라·아르테미아 및 레시의 비교식 잔여를 NPC별로 검토. 선호를 임의 필수조건으로 바꾸지 않음.','G03 · 실제 영향/수정 범위 미검증'],
 ['R04','확인 필요','반복 구매자 목표 연결','문의 이력과 목표·납품 조건을 상태별로 확인. 현재 문자열 부재만으로 전체 경로 결함을 단정하지 않음.','G02 · 조사 잔여'],
 ['R05','확인 필요','일반 노예 반말 제외','지정 유니크8명만 허용한다는 결정과 일반11직업 tone3 분기의 차이 정리.','G04 · 현행 콜백과 사용자 방침 차이'],
 ['R06','확인 필요','WORK 수동 JSON 보존','소스와 다른17개·2339_yagisuna 명명본의 변경을 보존하고 동일ID 중복 배포 방지.','JSON17 · 이름/배경/외형의 수동 편집 포함'],
 ['R07','확인 필요','이미지 입력 완전성','원장 밖101이미지와 직접 JSON 참조50경로를 최종Full입력으로 대조. 신규38/내용변경10은 필수 보존 후보.','실물 있음 · Full 누락 확정 아님'],
 ['R08','확인 필요','옛 경로9·호환 보존','과거 얼굴4·Gloria4·2339옛JSON의 후속대체/퇴역/세이브 영향 판정. 23호환·시루·2071 별칭은 KEEP.','승인 없는 삭제·복원 금지'],
 ['R09','부분 확인','WORK·소스·원장 기준 통일','QSP는일치. JSON17·초상9·UI1의27크기차이와 원장밖 경로를 실제WORK기준으로 정합화.','QSP확인 완료 / 리소스 미완료'],
 ['R10','대기','2.4.2 버전·실행 구성','실행기/엔진/필수DLL·폰트·라이선스와 게임버전표시,README/구2.4.1안내문을 최종구성으로 정리.','옛 파일명·설치기 자동 재사용 금지'],
 ['R11','결정 필요','모드툴 동봉 범위','게임 실행 필수와 선택 개발도구를 구분. WORKSHOP/DB/편집기 중 제공범위·실행 의존성을 정함.','개인 image_work1865·아이디어·설정 배포 제외'],
 ['R12','코드 대조 완료','과거 패치 후속 대체 추적','118mods/773편집 중669정확현재존재. 후속대체33·계보9·조각최종60·그림핵심2를현재근거에연결. 동작 전수검사와 구분.','개수는 기능/버그 건수가 아님'],
 ['R13','대기','이번 포함·보류 범위 동결','최신 완료 기능과 기획/정의만 있는 항목·C차기·세련됨 추첨·하녀 발견 경험 메모를 구분.','명시 보류 자동 재개 금지'],
 ['R14','부분 확인','음원·BGM 최종 구성','최신61원장 존재/크기·지정7해시 확인. 게임전체136음원의 실제호출/루프/포맷/원본china·town 보존과 불필요한 입력원본 동봉여부 정리.','사운드 Git업로드금지 ≠ 게임배포 제외'],
 ['R15','대기','화면·컷신·초상 최종 확인','개인실/캐릭터 복장·초상/컷신·프레임/하드공개·춘향 대사·조소/회피 대응을 일반EXE에서 확인.','자동 검증과 시각·청감 확인 구분'],
 ['R16','대기','Full 파일 명세 동결','게임 폴더와 상위 실행기까지 전파일경로·크기·SHA를 새로 명세. 개발/개인/캐시/백업·임시자료 제외.','기존5304원장만으로 Full을 만들지 않음'],
 ['R17','대기','최종 기능 회귀','소문/목표·개인실·글로리아·춘향·도나1회갱신·생성/활동·음원 등 최종수정 범위별 검사.','현재 기록은 개별 버전의 근거'],
 ['R18','마지막 단계','D21 세이브 이관 범위 고정','모든 수정·경로 정리 완료 후 동일ID+옛기본이름/이미지주소·캐시/임시별칭 목록 확정. 사용자 작명·육성·진행 보존.','2.4.2 Full 직전이라는 사용자 조건'],
 ['R19','마지막 단계','이관 도구 구현·검증','원본SAV 보존·새출력/복원·중복실행·실패취소·구/신규 저장과 실제UI 로드/저장/재로드 검증.','코덱 왕복이나 변수검사만으로 호환 완료 아님'],
 ['R20','대기','공식 출고 검사','격리 최종QSP에서 정확패치재생·멱등·구조·줄/주석·JSON ID·실제엔진9경로, 추출본 mirror 일치.','STATIC_PASS/INCOMPLETE는 출고 PASS 아님'],
 ['R21','대기','새 Full 포장·설치 검증','새출력 이름/새폴더에 생성. 기존2.4.1 고정 스크립트 변경검토,동봉 세이브/설정 정책·수동설치/기존선택권 확인.','기존ZIP/원본/Kor_Full/개인SAV 보존'],
 ['R22','대기','압축 무결성·재추출 대조','전항목CRC/SHA·경로·중복·재추출명세/엔진실행·실제 설치 시뮬레이션.','압축 생성 전에는 검사 완료로 표시하지 않음'],
 ['R23','대기','릴리즈노트 최종 확정','미완료/보류를 완성기능에서 제외,버전·실제파일명·용량·SHA·설치순서·호환/제한을 최종값으로 갱신.','현재 문서는 사전 검토용 초안'],
 ['R24','대기','배포 승인·전달','사용자가 최종물을 검토한 뒤 공개/업로드 범위를 결정. 커밋·푸시·Full폴더 반영은 각각 명시 지시 기준.','현재 빌드/포장/업로드 없음']
].map(([id,status,title,action,evidence])=>({id,status,title,action,evidence}));
const state={schema:1,asOf:'2026-11-13',timezone:'Asia/Seoul',release:{version:'2.4.2',kind:'Full',approvedByUser:true},sourceQspSha256:currentHash,phase:'prebuild-audit',activeItem:'R02',items:checklist,packaged:false,migrationImplemented:false,published:false};
// Refreshing the document must not reset user decisions or completed checklist work.
if(fs.existsSync(D+'/checklist.json')){const previous=rd(D+'/checklist.json');a.equal(previous.release.version,state.release.version);for(const item of checklist){const prior=previous.items.find(x=>x.id===item.id);if(prior)for(const k of ['status','decision','notes','result','checkedAt'])if(Object.hasOwn(prior,k))item[k]=prior[k];}for(const k of ['activeItem','phase','packaged','migrationImplemented','published','history'])if(Object.hasOwn(previous,k))state[k]=previous[k];}
wr(D+'/checklist.json',state);
const topics=[
 ['인물·고유 이벤트',[
 '글로리아의 후임 납품·영입·부동산 담당자 교대와 전용 그림/복장 연결을 추가했다. 후임 납품 후 대기와 스쿱스 소문은 모두30일 기준으로 맞췄다.',
 '에게야 영입 후 매물로 나온 캣파이트 클럽을30일 뒤 춘향이 인수한다. 춘향 결투·영입·클럽 소유권과 폐쇄/지배인 필요 안내를 연결했다.',
 '춘향은 체력200·스태미나300·사기200·기본피해15,힘5·전투기술6을 기준으로 한다. 프로필·배경·산도·최고 챔피언·지정 특성,신규영입 인식3·헌신0/0을 반영했다.',
 '춘향의 시작 즉사를 제거했다. 전투 중5~10턴 무작위 일섬은 회피 자세로만 막으며 일반공격은 회피를 공략하는 속도 상성이다. 일섬/연고/일반공격이 한 턴에 겹치지 않는다.',
 '춘향 대비 능력70% 미만이면6종99턴 강화와 시작 대사를 부여하고 “춘향의 조소”로 표시한다. 기존 무적치트 피해 배율과 CM별 패배 정산은 유지한다.',
 '펠라게야·베네라의 가족 설정·소개·후일담과 관련 JSON을 맞추고,기존 공유 복장·역할 그림과 시루 호환 주소를 정리했다.',
 '도나도나23명의 세계·출신·직업과 초기 능력·지정 특성/기술을 배경에 맞췄다. 안테나 고유 분류와 누락된 seed 전달을 보완했다.',
 '이미 영입한 도나도나도 한 번만 보강되게 했다. 육성으로 더 높아진 수치·이름·장비·관계·소유일·퀘스트 진행을 보존하도록 연결했다.'
 ]],
 ['생성·속성·특성·교육',[
 '배경152개를 교체하고 로마 세계1·출신3·직업7을 추가했다. 기존 세계 비중+로마1칸,허용 출신/직업 균등 추첨과 연령/연결 교집합을 적용한다.',
 '로마풍 이름24개와 독립 동향 그룹을 추가했다. 유효 조합이 없으면 임의 대체하지 않고 생성 실패로 처리한다.',
 '새 일반 캐릭터의 초기 능력 보정은 세계,성장폭은 출신,기술·특성은 직업이 담당한다. 도둑 체력C·운동선수B 최저조건은 승인 예외로 유지한다.',
 '57개 출신의 자아·태도·감수성 성장 계수와 소수 누적,31개 직업의73개 확정 규칙을 연결했다. 고정 캐릭터·기존 보유 인물에 새 무작위 보정을 강제로 소급하지 않는다.',
 '끈기/워커홀릭/산만함/무기력함을 단일 단계로 정리했다. 긍정 계열 우선·동일 계열 상위 우선이며 반복 경험/성과·기분·휴식/마사지 효과를 맞췄다.',
 '대상별 장악력과 구타/악명 효과를 계산하도록 보완하고,순찰 성기사 처형·감방 구출의 악명 변동 및 옛 계산 캐시를 맞췄다.',
 '하드모드 속성 정보는 획득 즉시/10일/20일로 나눠 공개하고,속성을 드러내는 마법은 우선한다. 실제 속성 수치를 숨김 때문에 바꾸지 않는다.',
 '희망사항에서 드러난 적성이 특성 목록에 표시되게 하고,마법 적성과 사용자 확정 특성별 희망 대사를 연결했다. 일부 서로 배척해야 하는 구강 특성의 충돌 처리도 보완했다.',
 '조수 애무 교육의 뒤로/취소와 유두 교육의 대상 그림 조회를 고쳤다. 가임성·쿨라 안내·체질 개선·주인공 장비 설명은 실제 효과에 맞춰 문구를 교정했다.'
 ]],
 ['도시·의뢰·개인실·전투',[
 '개인실 섹스 선택을 기존 행동 메뉴의 비용·효과에 연결했다. 개인실 자동업무·보고·인테리어/식단과 빈방 배경 오류를 보완했다.',
 '캣파이트 일반전의 처형/석방 선택을 새 상대에서도 유지하고,승리/패배 결과·컷신 잔류 및 대사창 하단 프레임과 여백을 보완했다.',
 '게임 중 하드모드에서 기존 적의 특수공격을 실제 연결하고 적 전투 특성·공격 이름·사용 몬스터와 MOB 열람표를 추가했다. 엘자·포털 가디언의 승인 방어/저항 변경을 반영했다.',
 '슐랴프킨 의뢰의 납품 등급 오판과 조수 동행 관련 흐름을 고쳤다. 하사 완료 보상 VIP 출입·대사와 일부 소문/목표·정산/메뉴 조건을 보완했다.',
 '마녀들의 모임 첫 진입 조건과 랠리의 캐릭터별 참가·배당 감소를 반영했다.',
 '벼룩시장에 기존 특수 장비와 구분한 일반 코스튬을 추가했다. 외형/교육 보너스는 제공하지만 고급 훈련의 기존 장비 요구는 유지한다.',
 '창관 인수는 “업데이트 예정” 안내로 유지한다. 인수/지배인 이후 실제 운영 등 미완성 영역을 완성 콘텐츠로 안내하지 않는다.'
 ]],
 ['이미지·소리·편집도구',[
 'WORK 설치 기준으로 이미지 목록과 조건 분석을 정리하고 탭별 로딩·명시 검색·노예 전용 목록을 보완했다. 동기화는 현재 버전과 수정 자료를 대조한 뒤 실제 병합하는 흐름이다.',
 '캐릭터 JSON은 번호 유무와 관계없이 감지하고,복장/초상 파일 수동 선택·공유/해제·경로 경고·기존 이미지 등록을 제공한다.',
 '이미지 교체기의 선택 이미지 일괄 테두리와 노예 초상 자동 테두리,전신/초상 동기화·추가 이미지팩/전용 장면·배경 연결을 보완했다.',
 '대사 편집실의 시작/분기/끝 선택 고정,구간 각본 추출·저장·미리보기,수정문 직접 편집·검증·반영과 선택 대사 이미지 경로/조건 편집을 보완했다.',
 '사운드 목록·수동 파일/폴더 지정·채택/재제작/보류 상태,특성/아이템/마법·적 특성/MOB DB 및 개인 아이디어 기능을 추가했다. 도구는 게임 기능과 동봉 범위를 구분한다.',
 'BGM은 거주지 중심으로 유지하고 조건을 넘긴 지역 명성곡을 순차 재생하도록 연결했다. 도시 설정창에서 음악이 끊기던 경로와 게임오버 화면 전용 음향을 맞췄다.',
 '채택 전투/몬스터·처형/석방 등의 효과음과 승인한 둔기·가르시드 등을 실제 게임 호출에 연결하고,음악MP3/효과음WAV 구성을 정리했다. 최종 긴 곡 청취·모든 전투 청감은 별도 확인한다.'
 ]]
];
let main=`# JO9 2.4.2 풀버전 상세 릴리즈 노트·배포 체크리스트\n\n2026-11-13 / Asia-Seoul / **빌드 전 검토 초안·배포 준비 미완료**\n\n사용자가 이번 배포를 **2.4.2 풀버전**으로 확정했다. 현재 입력은 WORK QSP \`${currentHash}\`이며 추적 QSP와 runtime 원장도 같다. 현재 결과물은 문서와 감사 자료이며 새 Full·ZIP·세이브 변환기는 아직 만들지 않았다.\n\n**현재 순서: R01 완료 → R02 조커 재구매 플래그 검토.** 각 항목은 수정안과 결과를 확인한 뒤 다음으로 넘긴다. 명시 보류는 체크되지 않았다는 이유로 재개하지 않는다.\n\n${link('상세 변경 원장(과거308행+후속46기록)',O+'/CHANGE_LEDGER_KO.md')} · ${link('현재 누락·드리프트 감사',D+'/AUDIT_KO.md')} · ${link('기계 체크리스트',D+'/checklist.json')}\n\n## 배포 기준\n\n- 원배포: 2026-11-02 2.4.1 본편(QSP \`6cc7066736cae7fc428d58f89fbf659f06ee6feae8c710d810ee67c99467d505\`).\n- 최신 공개 업데이트: 2026-11-07 2.4.1 3차r2(QSP \`${old.facts.baseline.qspSha256}\`,필수2409경로).\n- 이번 Full은 원배포와 승인 후속 전체를 포함한다. 과거 인계의 “4차 델타/3차 선행”은 이번 Full 설치 안내로 쓰지 않는다.\n- 현재5304경로 원장은 패치/작업 리소스의 부분 목록이다. Full 전체 입력 원장을 새로 만들어야 한다.\n- **아래는 WORK 반영 기록을 기반으로 한 릴리즈 후보 내역이다. 최종 패키지 전수·실제 플레이 검증이 끝났다는 뜻은 아니다.**\n`;
for(const [heading,items] of topics){main+='\n## '+heading+'\n\n'+items.map(v=>'- '+v).join('\n')+'\n';}
main+=`\n## 이번 완성 기능으로 넣지 않는 항목\n\n- 출신의 세련됨 추가 추첨과 하녀 특성 발견 경험 절반 메모는 사용자 보류다.\n- C 필로우토크·과거 경험 통계·펠리시티 보살핌은 차기 개발이다.\n- 상위 드랍 장비/장신구/전리품 확장은 기획 저장 상태다. 지금 판매/드랍되는 완성 장비로 소개하지 않는다.\n- 비밀서고/금서와 특등급 식재료는 각각 중요 퀘스트 연계 보류다. 창관 인수·춘향 영입 후 클럽 재개장의 미구현 부분도 구분한다.\n- D15 검은 테두리/잔상은 재발 시 재조사한다. 해결 완료로 표시하지 않는다.\n- 안개·동부 부동산 소개32문구는 기존 보류를 유지한다. 이번2.4.2Full 선택을 4차 원고 재개 승인으로 해석하지 않는다.\n- **D21 세이브 마이그레이션은 이번 Full의 필수 마지막 작업**이다. 수정/리소스 정리 완료 후 구현·검증하며 아직 호환 완료가 아니다.\n\n## 차례대로 진행할 배포 체크리스트\n\n| 순서 | 상태 | 확인할 항목 | 완료 기준 | 현재 근거/제한 |\n|---|---|---|---|---|\n`;
for(const e of checklist)main+=`| ${['완료','코드 대조 완료'].includes(e.status)?'[x]':'[ ]'} ${e.id} | ${e.status} | ${e.title} | ${e.action} | ${e.evidence} |\n`;
main+=`\n## 누락 감사의 현재 결론\n\n**배포 준비 완료로 판정할 수 없다.** 실제 파일이 없는 것과 작업 원장에 안 올라간 것을 구분해야 한다. WORK에는 보존할 수동 변경과 원장 밖 리소스가 있고,기존 의뢰/말투/구매 플래그의 잔여도 있다.\n\n- 최초308행은 게임99/도구69/이미지·소리140의 이력이며,후속46기록도 중간 대체·조사·기획을 포함한다. 합계354개의 신규 기능이라는 뜻이 아니다.\n- 118개 모드 기록의 대상/신규 로케이션 부재는0이다. 773개 편집 중669개는 현재 정확 존재한다. 나머지104개도 후속대체33·계보9·조각최종60·그림핵심블록2의 근거를 연결했다. 이는 기록상 편집의 잔존 대조이며 전체 동작·출고 PASS는 아니다.\n- WORK 수동JSON17,원장 밖 이미지101,직접참조50 중 신규38/내용변경10,원장 부재9와 크기차이27을 발견했다. 서로 겹치는 수치이므로 합산하지 않는다.\n- 현재 원장 밖 수정/추가2524개에는 개인 편집 상태1865개가 들어 있다. 이를 그대로 공개 Full에 복사하면 안 된다.\n- PR17은 원격최신015e4c48까지 확인했다. 추가3커밋은 문서만 바뀌었으며,PR은 draft/open/unmerged다. 승인한A/B의 WORK 반영과 PR전체 병합은 구분한다.\n- 이번 감사는 문서/코드/경로·크기와 지정 표본 해시 대조다. 동일 크기의 모든 파일 변경·모든 분기·개인SAV·완성 ZIP 전항목 검사까지 수행한 것은 아니다.\n\n검토 결과와 체크리스트는 계속 이 문서와 checklist.json에 갱신한다. 완료되지 않은 검사를 이전 버전의 PASS로 대체하지 않는다.\n`;
fs.writeFileSync(O+'/RELEASE_NOTES_CHECKLIST_KO.md',main);
let ledger='# 2.4.2 Full 준비 상세 변경 이력 부록\n\n2026-11-13. 최초308행과11/11후속상태를 보존하고 이후46기록을 붙였다. **과거상태/중간 대체/미구현 기획을 완성 기능으로 세지 않는다.** 현재 최종 동작은 메인 릴리즈 노트와 후속 기록을 우선한다.\n';
for(const domain of ['게임','모드 도구','이미지·사운드']){const list=rows.filter(r=>r.domain===domain);ledger+=`\n## 최초 이력: ${domain} ${list.length}행\n\n| ID | 날짜·분류 | 변경 | 당시 결과/11월11일 후속 결과 | 상태·남은 확인 | 근거 |\n|---|---|---|---|---|---|\n`;for(const r of list){const q=r.historicalFollowup;ledger+=`| H${String(r.id).padStart(3,'0')} | ${esc(r.date)}<br>${esc(r.category)} | ${esc(r.title)} | ${esc(q?.currentResult||r.after)} | ${esc(q?.currentStatus||r.status)}${q?.remainingCheck?'<br>잔여: '+esc(q.remainingCheck):''} | ${(q?.evidence?.length?q.evidence:r.evidence).map((v,i)=>link('근거'+(i+1),v)).join('<br>')} |\n`;}}
ledger+='\n## 11월11일 이후 추가·후속 기록46건\n\n중간에 미반영으로 조사했던 활동 단계형·춘향 기획·보류 원고 등은 후속 구현 기록과 함께 읽는다. 백업 정리나 조사 문서는 게임 신규 기능이 아니다.\n';sections.forEach((r,i)=>{ledger+=`\n### N${String(i+1).padStart(2,'0')} ${r.header}\n\n${r.body.replace(/\]\(([^)]+)\)/g,(m,q)=>'](<'+(/^(?:https?:|[A-Za-z]:[/\\])/.test(q)?q:path.resolve(R+'/docs',q).replaceAll('\\','/'))+'>)')}\n\n${r.reportPaths.map((q,j)=>link('상세 근거'+(j+1),q)).join(' · ')}\n`;});fs.writeFileSync(O+'/CHANGE_LEDGER_KO.md',ledger);
const counts={historicalRows:rows.length,historicalByDomain:{game:99,tools:69,imagesSound:140},postSnapshotRecords:sections.length,modFiles:code.modSummary.files,modEdits:code.modSummary.edits,newLocationDeclarations:code.modSummary.addLocations,exactCurrentEdits:code.modSummary.exactEditNewMatches};
wr(D+'/release-data.json',{asOf:'2026-11-13',release:state.release,sourceQspSha256:currentHash,baseline:old.facts.baseline,counts,rows,postSnapshotRecords:sections,findings:code.findings,deferredItems:code.deferredItems,remote:code.remoteFollowupFromRoot,limits:['Historical rows and postSnapshot records overlap; not new-feature totals.','No final Full package, migration implementation, whole release QA or GUI/SAV load in this audit.']});
fs.copyFileSync(W+'/release-base-audit.md',D+'/BASE_AUDIT_KO.md');fs.copyFileSync(W+'/release-changes-audit.md',D+'/CODE_AUDIT_KO.md');fs.copyFileSync(W+'/release-assets-audit.md',D+'/ASSET_AUDIT_KO.md');fs.copyFileSync(W+'/release-change-ledger-audit.json',D+'/code-audit-data.json');fs.copyFileSync(W+'/release-migration-preflight.md',D+'/MIGRATION_PREFLIGHT_KO.md');
wr(D+'/asset-audit-data.json',{...assets,skipped:undefined,added:undefined,sizeChanged:undefined,missingBase:undefined,unregisteredAddedOrSizeChanged:assets.unregisteredAddedOrSizeChanged.filter(e=>!String(e.path||e.runtimePath||e.relativePath||'').includes('modtools/')),candidateClassification:{...assets.candidateClassification,authoringStateNotPublicPayload:{count:1865,note:'Private authoring inventory omitted from public-facing preparation record'}}});
let audit=`# 2.4.2 Full 빌드 전 누락·정합성 감사\n\n기준2026-11-13 WORK \`${currentHash}\`. **출고 미완료.** 코드·기록·메타데이터/표적해시 감사 결과다.\n\n${link('배포 기준 상세',D+'/BASE_AUDIT_KO.md')} · ${link('기능·보류 상세',D+'/CODE_AUDIT_KO.md')} · ${link('리소스 상세',D+'/ASSET_AUDIT_KO.md')} · ${link('세이브 이관 사전 점검',D+'/MIGRATION_PREFLIGHT_KO.md')}\n\n## 먼저 검토할 기능 잔여\n\n`;
for(const f of code.findings)audit+=`### ${f.id} ${f.title}\n\n- 상태: ${f.status}\n- 위치: ${f.location}\n- 근거: ${f.evidence}\n- 기록: ${link('상세',f.source)}\n\n`;
audit+=`## 리소스·포장 위험\n\n1. 수동JSON17과2339_yagisuna 명명본은 WORK가 현재 기준이다. 소스의 옛파일로 덮거나 같은ID 두정의를 함께 배포하지 않는다.\n2. 원장 밖101이미지는 모두WORK에 있다. 그중 직접JSON참조50의38신규/10교체는 최종 입력 보존 후보다. 실제 Full을 아직 만들지 않아 ZIP누락이라고 부르지 않는다.\n3. 원장 부재9·크기차이27은 승인된 교체/퇴역과 세이브 호환을 대조해야 한다. 호환23개와 시루·2071의 검증된 주소는 임의삭제하지 않는다.\n4. game전체45630파일과본편game42926의metadata차이는신규2773/크기차이991/부재69다. 동일크기의내용차이는이번전수검사범위밖이며최종Full SHA대조에서확인한다.\n5. 원장밖2524에는도구2403·그중개인편집상태1865가포함된다. 개인SAV/설정/아이디어/후보/백업을공개배포로복사하지않는다.\n6. 게임음원136개를단순전부복사할지결정한것은아니다. 호출/원본보존/형식에따라필수파일을정하고,Git바이너리업로드금지와게임배포를구분한다.\n7. WORK상위에는구2.4.1안내HTML/README/INSTALL/manifest가남아있다.2.4.2Full의실행기/엔진/설치흐름/버전표시/문서는새최종명세로대조해야한다.\n\n## 코드 이력 대조의 한계\n\n308행/46절/118mods는범위가겹치는이력이다.773편집중669정확일치외104는후속교체33·전체본문계보및조각추적9·개별조각최종60·그림핵심블록2로현재근거에모두연결했다.이는대상변경의코드잔존/후속대체감사이며모든게임분기나최종출고PASS는아니다.후속상세CODE_AUDIT_KO.md및code-audit-data.json을우선한다.\n\n## D21 마지막 단계\n\n2.4.2Full이확정돼이관준비를포함한다.그러나모든수정·이미지경로정리후최종매핑을고정한다는사용자조건을지킨다.기존작명/육성/관계/퀘스트/장비/소유일과이미승인된도나1회갱신은보존하고,원본SAV를직접덮지않는도구·반복/실패/복구/CRC와실제UI로드를검증해야한다.\n\n## 변경 경계\n\n이번준비감사에서게임QSP/JSON/이미지/음원을수정하거나기존Full폴더/개인SAV를바꾸지않았다.직전춘향수정은별도기록으로완료됐다.포장·설치·마이그레이션구현·커밋·푸시·공개업로드는아직없다.\n`;
fs.writeFileSync(D+'/AUDIT_KO.md',audit);fs.copyFileSync(__filename,D+'/build-release-prep.cjs');
wr(D+'/document-verification.json',{status:'PASS',currentQspSha256:currentHash,rows:rows.length,postRecords:sections.length,checklist:checklist.length,versionConfirmed:'2.4.2 Full',packaged:false,gameChangesInThisPreparation:false});
const idx=R+'/docs/SESSION_HANDOFF_INDEX.md',heading='## 2026-11-13 Codex: 2.4.2 Full 빌드 준비·릴리즈노트·누락 감사';const text=fs.readFileSync(idx,'utf8');if(!text.includes(heading))fs.writeFileSync(idx,heading+'\n\n[상세 릴리즈노트·순차 체크리스트](release-prep/2026-11-13/RELEASE_NOTES_CHECKLIST_KO.md) · [누락·드리프트 감사](../records/release-prep-20261113/AUDIT_KO.md). 사용자2.4.2Full확정. 최초308이력+후속46기록/Claude포함,현WORK2ad5be48. 코드잔여/수동JSON17/원장밖이미지101·직접참조필수후보48/옛9경로 검토필요. R01완료,R02부터한건씩검토. D21은수정·경로정리완료후마지막구현검증,명시보류자동재개없음. 새Full/ZIP/이관도구/게임수정/Full폴더동기화/커밋푸시없음.\n\n'+text);
console.log(JSON.stringify({documents:[O+'/RELEASE_NOTES_CHECKLIST_KO.md',O+'/CHANGE_LEDGER_KO.md',D+'/AUDIT_KO.md'],counts,checklist:checklist.length,active:'R02'}));
