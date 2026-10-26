'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const base=__dirname,root='G:/Codex/tmp/jo9-post-patch-playtest-20261025',rec='G:/somi/JO9sa/records/post-patch-playtest-20261025';
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),game='G:/somi/Jack O Nine Tails v2.4_work/game';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),inv=read(base+'/inventory/inventory.json');
assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),inv.current.qsp_sha256);
const evidence={combat:'combat/report.json',production:'production/report.json',economy:'economy/report.json',traits:'traits/RESULT.json',reported:'economy/reported/report.json',official:'root-evidence/official/report.json',gui:'root-evidence/gui-ledger.json'};
for(const p of Object.values(evidence))assert(fs.existsSync(base+'/'+p),p);
const notes={
 F01:['ASSET_VISUAL_PASS','컬러/세피아150x150 원본을 직접 보아 얼굴·테두리 보존과 세피아 확인. 인게임 캐릭터 선택/초상 전환 미실행.'],
 F04:['NATIVE_PASS','이사벨라 원래 하녀/비서/도미나 선택지 클릭. 에게야는 잘못된 raw캐시를 임의 삭제하지 않고 렌더링이 해결되고 외형란은 숨김.'],
 F05:['PARTIAL_NATIVE_PASS','회색 조건 메뉴/취소와 무용 최대 경고/MSG닫기. 기타 번역 지점/원래 규칙상 도달 못한 조건은 미검.'],
 F09:['PHYSICAL_GUI_PASS','원본06 실제 파일 Load→현재 이사벨라 전신→원래 앞으로 물리 클릭→방 배경/메인 복귀.'],
 F10:['NATIVE_AND_PHYSICAL_GUI_PASS','07 실제처분→엔딩,08 실제저장Load 잔액360,09 점유/수동탈출/날짜차단,10 무낙인 급매406·남은방법 페이지. 이름필터로 수집한NPC/퀘스트/평판 상태 보존; 전세계 모든 상태의 증명은 아님.'],
 F17:['CORE_PASS_WITH_UI_DEFECT','900 구매/1병/양 역할 사용/상태 보호 정상. 주인공 재고행이 종이 아래24px,하단 정보영역14px 침범.'],
 F20:['RULE_PASS_WITH_PREEXISTING_DEFECT','동일인0→1→2→3승/명성10+3+3/출전차단·패배보존 통과. 결과 복귀의 goto_loc 누락은r4에도 존재.'],
 F22:['NATIVE_PASS','실제 강습 과로 경감2경로와 원래AP0/AP1 메뉴→강습→복귀2경로 통과. 옛 진단driver timeout은 제품오류로 합산하지 않음.'],
 F25:['ENTRY_FAIL_DESCENDANTS_BLOCKED','3NPC 실제 소문 링크가exec:gt로 잘림. 상담/결제·복수추천·납품후할인의 완전한 실제 동선은 진입결함 뒤여서 미검.'],
 F26:['REWARD_PASS_WITH_PREEXISTING_DEFECT','랠리 최초/반복/80상한,캣파이트10+3+3 수치 통과. 캣파이트 종료복귀는기존결함으로 분리.'],
 F30:['CURRENT_PRIOR_RUN_PASS','같은a70 WORK의 직전 검증: 일일4경로와실제파일Load4경로. 이미 완료한8경로를 이번에 새로 물리클릭했다고 세지 않음.'],
 F32:['NATIVE_AND_GUI_PASS','사용자 수정 제목 표시를GUI관찰. 19px 원래 도움말→MSG→닫기→프로필복원/원래아이콘hit 모두1.']
};
const features=inv.features.map(f=>({id:f.id,title:f.title,status:notes[f.id]?.[0]||'NATIVE_PASS',detail:notes[f.id]?.[1]||'현재 WORK 격리 사본에서 원래 사용자 흐름/콜백을 실행. 상세 조건·계측·한계는 분야별 보고서 참조.'}));
const defects=[
 {id:'PT01',scope:'post_patch_new',feature:'F25',title:'소문3곳 진입 링크 절단',detail:'스컵스·작크·아네스 원래 소문 href가 작은따옴표 충돌로 exec:gt에서 끝남. 실제 클릭 후 상담에 진입하지 못함.',evidence:'economy/report.json'},
 {id:'PT02',scope:'post_patch_new',feature:'F17',title:'카오틱 에센스 재고 목록 넘침',detail:'현재 기본 UI의 행 bottom656 > 종이632, 정보영역 시작642. 게임 기능은 정상이나24px/14px 침범.',evidence:'traits/misc-geometry-report.json'},
 {id:'PT03',scope:'present_in_shipped_r4',feature:'F20/F26',title:'캣파이트 결과에서 복귀 끊김',detail:'실제 경기·결과·forward 뒤 return_lock=goto_loc이나 해당location없음. 해시가일치하는 배포본c670에서도동일.',evidence:'combat/report.json'},
 {id:'PT04',scope:'existing_report_runtime_reproduced',title:'일반노예/개인실 모유량 클릭 불가',detail:'실제 일반노예·개인실1 DIV 클릭으로MSG없음. 조수A에서는80수량MSG와닫기정상. 나머지개인실2~4는동형코드정적확인뿐.',evidence:'economy/reported/report.json'},
 {id:'PT05',scope:'existing_report_runtime_reproduced',title:'개인실 이종취향 메뉴의 조기복귀',detail:'원래portrait→bridge→프로필135 링크→개인실1으로fallback. 소유자/역할ID가정상복원됨은별도assert통과. 다른방은동형코드정적확인뿐.',evidence:'economy/reported/report.json'}
];
const limitations=[
 '대표기능32묶음의 검사이며 게임의 모든 난수/모든 대사/모든 세이브/모든 분기를 완주한 결과가 아니다.',
 '대다수는 설치 FastQSP에서 원래 HTML/EXEC/object forward를 합성클릭한 통합플레이다. 물리GUI는 원본04/06/08 및08새저장Load와주인공프로필을별도로구분한다.',
 '진단Start의 성인표본/자금/적강도/확률경계는 시험값이다. Grinch 승리 자체나목격20/21 경계는실제콜백을통하지만 일반 난이도/난수확률의 실측통계는 아니다.',
 'primeState는긴저장스크립트를생략한다. 자산엔딩진단에서만 원래auto_day_end의DEATH를정확히복원했다. 결과나승리를대입한것이아니다.',
 '기존76개 세이브는내용보존을해시검증했다. 76개모두실제Load한것이나strictCRC인증이아니다. GUItask설정ignoreCRC=true는WORK설정을변경하지않는다.',
 '공식검사는구조/행끝/왕복/표식/등록JSON/마지막두패치정확재생·재적용/설치엔진9경로PASS다. QSP동적코드전부를증명하는완전문법검사기는아니다.',
 '소문후속흐름은현재진입결함으로차단. F05 일부조건/에드워드인게임전환은미검으로남긴다. 칭호확장·지성AP·마법낙인재현등보류기획은활성화하지않았다.',
 '서로다른분야의PASS수를합산해고유플레이수로부풀리지않는다. 초기진단기실패로그를제품실패와구분했다.'
];
const result={date:'2026-10-25',status:'TESTED_WITH_DEFECTS',baseline:inv.baseline,current:inv.current,featureCount:32,features,defects,notReproduced:[{title:'큰까마귀관 정신상태 MSG 가림',detail:'현재성인표본노예/조수에서원래MSG→닫기→summary복원/hit통과. 실제inline스타일의#__message__ z2147483647확인. 사용자의정확한저장상황이항상해결됐다고단정하지않음.'}],staticOnly:[{title:'212얼굴/178의상0접두참조2건',detail:'이전조사의정확경로불일치를유지. 이번에는두인물의실제생성/의상전환을실행하지않음.'}],protected:{files:96,originalSaves:76,unchanged:true,commitPush:false,gameEdited:false,fullOrZipEdited:false},evidence,limitations};
fs.writeFileSync(base+'/result.json',JSON.stringify(result,null,2));
const md=`# 지난 패치 이후 WORK 실제 플레이 검사\n\n실제 최종2차 r4 QSP c6701e3…를 기준으로 현재 WORK a70bd177…의 변경32묶음을 확인했다. 이번에는 새 구현이나 수정 없이 격리 사본에서 플레이를 실행했다. **새 소문 링크 결함·에센스 목록 넘침과 기존 캣파이트 복귀 결함을 발견했다.** 최근 제보의 모유량/개인실135도 실제 재현됐다.\n\n## 확인한 주요 흐름\n\n- 실제 안개전투 양역할 정산·명성/목격상한,그린치 전투→승리→퀘스트복귀,캣파이트3승/보상,랠리80상한,준비대사·컬러초상 경로. 전투25사례 중24통과/기존복귀결함1재현은 분야보고서기준이다.\n- 수동생산10·자동업무4 모두 원래업무→보고/forward→메인복귀. 수동특성14/23/33/96/201와일반12/18/24/64/126, 자동3역할201·지연14 확인.\n- 병원1000/양역할·취소·대상교체·중복/자금가드, 판매상2곳3난도 실제대금·인물제거, 에센스900/1병/양역할사용·보호가드,일일AP표/영양/우유1.5·교육/과로. 소문진입3실패는통과로세지않았다.\n- 특성·관계 대표20흐름: 전체보기·3열·하단설명·닫기·개인실복원,충돌정리·다재다능1회명성,원래영입·관계반복대사,나노분자문장,주인공도움말닫기.\n- 에게야구캐시의렌더링/외형란숨김과이사벨라3외형실제선택통과. 에게야저장문자열전체를정규화했다고주장하지않는다.\n- 실제GUI의06알림→앞으로→정상집배경,08장식460−청구100=360→기본인테리어→저장/Load360 유지.\n- 07원래처분선택지로자산을소진한뒤19366이50000청구에모자라원래엔딩(day0). 09입주개인실·동면보존,수동탈출뒤다음날차단(day102/미납50000유지). 10무낙인급매202+204=406/두역할별제거/마지막페이지유지. 수집한NPC·퀘스트·평판상태동일.\n- 우유가격1~7 실제Qt DOM의검정색/숫자/상위hit/56×40,보유금700,10을확인하고원래5병판매의재고6→1/대금5×가격까지통과.\n\n## 발견한 문제\n\n${defects.map(d=>`- **${d.id} ${d.title}** (${d.scope}): ${d.detail} [근거](test-evidence/${d.evidence})`).join('\n')}\n\n큰까마귀관정신상태MSG가림은이번원본리소스표본에서재현되지않았다. 노예·조수모두닫기→종합정보복원/입력hit를확인했고최상위메시지규칙이실제inline CSS에있었다. 정확한사용자세이브전체조건을증명한것은아니다. 이미지0접두2건은기존정적확인상태이며이번인물생성/의상플레이로세지않았다. 마법낙인재현은사용자보류를유지했다.\n\n## 기능별 판정\n\n|ID|기능|판정|범위|\n|---|---|---|---|\n${features.map(f=>`|${f.id}|${f.title}|${f.status}|${f.detail}|`).join('\n')}\n\n## 검증과 보존\n\n공식구조/왕복/행끝/표식/1,126인물JSON/마지막두패치정확재생·재적용/설치엔진9기본경로 PASS. [공식결과](test-evidence/root-evidence/official/report.json), [물리GUI기록](test-evidence/root-evidence/gui-ledger.json), [독립검토](test-evidence/independent-review.json).\n\nWORK QSP·CSS/JS와원본76세이브등96보호파일해시불변. Full/ZIP/개인세이브·커밋·푸시미변경. 재생성가능한G임시사본은핵심기록을보존한뒤junction대상을따라가지않고정리한다. 정리결과는cleanup.json에기록한다.\n\n## 한계\n\n${limitations.map(x=>'- '+x).join('\n')}\n\n분야별원래실행로그/스크립트/수치스냅샷은test-evidence아래에있다. 일반게임파일을바꾸지않고재생성하는검사스크립트다. 새기능수정이나보류안승인을뜻하지않는다.\n`;
fs.mkdirSync(rec,{recursive:true});fs.writeFileSync(rec+'/TECHNICAL_REPORT_KO.md',md);fs.writeFileSync(rec+'/result.json',JSON.stringify(result,null,2));
const summary=`# 지난 패치 이후 실제 플레이 검사 결과\n\n마지막 배포본인 2차 r4와 현재 WORK를 비교해 변경 32묶음을 확인했다. 현재 WORK의 격리 사본을 실제 FastQSP 엔진으로 실행했으며, 원래 메뉴·선택지·전투·일일 보고·복귀 경로를 검사했다. 일부 저장 불러오기와 화면 전환은 물리 마우스·키보드로도 확인했다. 이번 작업은 검사만 수행했으며 게임 코드는 수정하지 않았다.\n\n## 확인된 문제\n\n| 항목 | 실제 관찰 | 구분 |\n|---|---|---|\n| 소문 메뉴 3곳 | 링크가 잘려 상담 화면이 열리지 않음. 후속 결제·추천 동선도 차단됨 | 이번 추가 기능 |\n| 카오틱 에센스 재고 행 | 종이 패널 아래로 24px, 하단 설명 영역으로 14px 침범 | 이번 추가 기능 |\n| 캣파이트 결과 복귀 | 결과 뒤 돌아갈 goto_loc 로케이션이 없음 | 배포 r4에도 있던 결함 |\n| 노예·개인실 모유량 | 일반 노예와 개인실1의 아이콘을 눌러도 수량 메시지가 안 뜸. 조수는 정상 | 기존 제보 재현 |\n| 개인실 이종취향 | 얼굴→프로필→이종취향을 누르면 개인실1로 돌아감. 인물 소유·ID 복원은 정상 | 기존 제보 재현 |\n\n큰까마귀관 종합정보의 정신상태 메시지 가림은 현재 표본에서 재현되지 않았다. 노예·조수 모두 메시지를 닫은 뒤 종합정보 복원과 입력 가능한 상태를 확인했다. 이 결과가 사용자 세이브의 모든 조건을 보증하지는 않는다.\n\n## 통과한 주요 동선\n\n- 자산 처분: 장식 환급 460에서 청구 100을 한 번 차감해 360이 남고, 기본 인테리어로 복귀했다. 실제 저장 후 다시 불러와도 잔액 360이 유지됐다.\n- 파산 방지: 입주자가 있는 개인실·동면 장치 처분을 막았고, 직접 자금 마련을 선택해 화면을 나가도 미납이면 다음 날로 진행하지 못했다. 자산을 모두 처분해도 청구액에 못 미치면 원래 파산 엔딩으로 이동했다. 무낙인 급매는 두 인물 각각 202·204로 처리됐으며 수집한 NPC·퀘스트·평판 상태가 유지됐다.\n- 전투·명성: 안개전투의 행동력 정산, 목격 보상과 상한, 그린치 전투 후 퀘스트 복귀, 캣파이트 3승 제한과 10+3+3 보상, 랠리 80 상한을 확인했다. 캣파이트의 기존 종료 복귀 문제는 별도로 남아 있다.\n- 생산: 수동 10경로와 자동 4경로에서 실제 작업·지급·보고·메인 복귀를 확인했다.\n- 육성·경제: 의료센터 결제·취소·중복 방지, 난도별 상인 실제 지급가, 에센스 구매·사용·보호 조건, 행동력·영양·성장·과로 보정을 확인했다.\n- 특성·관계·화면: 전체보기 3열·하단 설명·닫기·개인실 인물 복원, 특성 충돌 정리, 다재다능 명성 1회 지급, 영입 조건, 반복 대화, 이사벨라 3외형과 일일 알림 후 정상 배경 복귀를 확인했다.\n- 우유 가격판: 실제 Qt 엔진에서 가격 1~7의 검정 숫자·위치·가림 여부, 원래 5병 판매의 대금과 재고를 확인했다.\n\n## 한계와 보존\n\n32묶음의 대표 동선을 검사한 결과다. 모든 난수·대사·세이브·분기를 완주한 것은 아니다. 에드워드는 현재 이미지 자체만 확인했고 인게임 선택 전환은 미실행이다. 번역 선택지 일부는 부분 검사이며, 소문 후속 동선은 진입 결함 때문에 확인하지 못했다. 이미지 0접두 참조 2건은 기존 정적 확인 상태다. 마법낙인 재현 등 사용자 보류 항목은 활성화하지 않았다.\n\n공식 구조·행끝·왕복·표식·인물 JSON·정확 패치 재생 검사와 설치 엔진 기본 9경로는 통과했다. 동적 QSP 코드 전체를 증명하는 완전 문법 검사기는 아니다.\n\n실제 원본 SAV는 **76개**다. 저장 폴더의 84항목에는 안내문·보고서·미리보기·백업 등 8항목도 포함된다. 이를 구분해 기록했다. 원본 SAV와 WORK·CSS·설정 등을 포함한 **96개 보호 파일의 해시가 불변**이다. Full·배포 ZIP·사용자 세이브를 수정하지 않았으며 커밋·푸시도 하지 않았다. 재생성 가능한 대용량 진단 사본은 정리하고 핵심 로그·수치·HTML·재현 스크립트만 보존했다.\n\n[32묶음별 범위와 기술 기록](TECHNICAL_REPORT_KO.md) · [구조화된 결과](result.json) · [물리 GUI 기록](test-evidence/root-evidence/gui-ledger.json) · [독립 검토](test-evidence/independent-review.json) · [임시자료 정리 확인](cleanup.json)\n`;
fs.writeFileSync(rec+'/REPORT_KO.md',summary);fs.writeFileSync(base+'/REPORT_KO.md',summary);
const extract=base+'/liquidation-source.txt';if(fs.existsSync(extract))fs.unlinkSync(extract);
function safeTree(p){for(const n of fs.readdirSync(p)){const f=path.join(p,n),s=fs.lstatSync(f);assert(!s.isSymbolicLink(),'Unexpected artifact link '+f);if(s.isDirectory())safeTree(f);else assert(!/\.(?:sav|qsp)$/i.test(n),'Diagnostic binary left in workspace '+f);}}
safeTree(base);fs.cpSync(base,rec+'/test-evidence',{recursive:true});console.log(JSON.stringify({record:rec,features:features.length,defects:defects.length,gameChanged:false}));
