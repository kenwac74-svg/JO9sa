"""Read-only feature inventory; writes reports only beside this script."""
import json, hashlib, pathlib, zipfile, datetime

OUT = pathlib.Path(__file__).resolve().parent
REPO = pathlib.Path('G:/somi/JO9sa')
GAME = pathlib.Path('G:/somi/Jack O Nine Tails v2.4_work/game')
SPLIT = pathlib.Path('G:/somi/JO9_2.4_SecondPatch_20261021_Split')
BASE = 'c6701e3ab130b1a762d0b1a523d52cd53cee846f71c3d7899a4c369389aa853d'
CURRENT = 'a70bd177d8e7ade58243578b2f04745ff00cec3884d26d3b924dfffc8a8d007a'

# Feature rows group successive fixes to the same player-facing behavior.
# Existing results are historical evidence; this inventory does not rerun them.
ROWS = [
('F01','visual','에드워드 세피아 초상','edward-sepia-fix-20261021','원래 편집기의 sepia(0.8),150x150/알파/구도 보존','이미지 결과 기록; 전체 게임 화면 확인 별도','에드워드 세피아/컬러 초상 전환; 테두리·얼굴·색 확인',''),
('F02','combat','안개 동료 행동력 정산','registered-bugfixes-20261022','출전 노예/조수 최소1AP; 큰 피로와 settled 방어 유지','엔진18시나리오/200경계; 연속 실제 전투 별도','02_FOG 로드 후 노예/조수 각각 전투 종료; 미출전자 AP 보존; 교대/취소/반복정산; 승리 뒤 원래 메뉴 복귀','02'),
('F03','combat','그린치 전용 전투 메뉴','registered-bugfixes-20261022','14 대신10384, 승리10385 복귀; 구형 전투직전 저장 보정','선택지/그린치 엔진10검사; 전체 퀘스트 연속 GUI 별도','03_GRINCH 로드; 전투 준비→무기 선택→전투 시작→승리→10385와 보상; 구형14 저장에서 같은 흐름','03'),
('F04','visual','에게야·구 도나 충돌 역할 외형','registered-bugfixes-20261022','확인된96 역할경로 해석; 사용자경로 보존; 역할그림 없으면 기본 전신/외형란 숨김 정상','13통합검사와 후속63567조회; 모든 실제 저장 GUI 별도','01_HOME 에게야 기본/조수 전환; 이사벨라 하녀/비서/도미나; 구충돌 경로와 사용자 지정 경로 로드; 초상/전신/일일 그림 확인','01'),
('F05','visual','조건부 선택지·툴팁 번역','registered-bugfixes-20261022','선택지/링크8,툴팁4,이름안내1,러시아어 흡혈4분기와Tip8 정리','조건/콜백 보존 및 엔진검사; 동적 선택지 전수 GUI 별도','기존 번역목록의 조건을 맞춰 메뉴 열기; 표시/툴팁/이름입력 확인; 각 원래 콜백의 다음 화면 확인',''),
('F06','visual','우유 협동조합 가격판·숫자·보유금','registered-bugfixes-20261022|milk-panel-layout-20261024|milk-price-label-20261024','최종 가격판 우측정보 하단; 실제가격 검정굵게 정렬; 보유금 원위치','브라우저20상태,가격1~7/2축척14; 네이티브 Qt 최종 확인 별도','04_MILK 실제 로드; 메뉴·가격판·보유금·판매선택지 겹침; 재고/자격/소지품 변화; 숫자 가격과 실제 거래액; 다른 창크기','04'),
('F07','social','0ID 관계 판정·반복 답변','private-feelings-fix-20261022','0/미지정 연애대상 오판 차단; 반복9문장; 구캐시 갱신','관계52경계/일일31/말투캐시; 실제 파일 연속 대화 별도','01_HOME 미지정과05_RELATION 양수ID 비교; 같은 질문 반복시 핵심답변/화자; 저장로드와 개인실 투영 뒤 재확인','01,05'),
('F08','traits','노예근성·거센 반항심·초기기분 순서','disposition-traits-20261023|full-side-effect-audit-20261023','적격 노예근성10%,거센반항2%; 자아/태도 제한; 영입 즉시복종 준비; 현재환경 반영 뒤 일회 기분보정','생성3601조합,영입42+환경8; 확률표본과 GUI 동선 구분','일반/전문가 영입에서 특성·복종·기분; 지저분한 집/위생/외형에서도 초기 정상; 재계산/역할교환 후 강제리셋 없음; 편집기 적격/반대조건','01'),
('F09','visual','이사벨라 일일 알림 그림·06복귀','isabella-event-image-20261023|asset-event-ui-20261024','2571 현인디팩과2323 구랜덤 분리; 구경로 해석;06의 복귀슬롯8개 교정','엔진207사례;06 교정 후 전체 GUI 복귀 별도','06_ISABELLA 실제 로드→현재전신→앞으로→다음알림/메인 복귀;2571/2323/사용자지정 그림; 저장로드','06'),
('F10','economy','파산 전 자산 처분·이벤트 UI','insolvency-asset-liquidation-20261023|asset-event-ui-20261024','장식→빈시설/개인실→주택→급매;정가50%;미납고정/다음날차단;점유보호;압류배경','실제 GUI7~10/15페이지·정산·점유·급매·저장로드 완료; 현재통합/임대료특수경우 별도','교정07~10 사용;장식460/basic·시설/방·주택7500/이사·인물202/204;미납탈출/날짜차단;이중환급/청구 방지;점유·동면보호;급매 퀘스트보존;자산소진 엔딩','07,08,09,10'),
('F11','production','수동·자동 성공문 통일','milking-success-text-20261023','후속 크기별 지급문 포함 최종9문구;placeholder 교체','후속 원문/엔진대조;옛 QA placeholder 실패는 기대값 문제','수동/자동 각 성공문과 실제 지급량 일치;일일보상·지연보고에서 문구1회;기존 실패/거부 분기 유지','11,12,13,14,15,16,17,18,19'),
('F12','production','크기별 특성 생산 보너스','meiki-size-yield-20261023','크기0~4:1.2/1.3/1.4/1.5/1.6배;실제 지급·지연보고 동일','엔진1575수량/45집중;GUI 전체크기×역할×저장로드 별도','11~15 각각 재로드하여 일반12/18/24/64/126,특성14/23/33/96/201;16노예/17조수/18개인실 자동201;19AP0 성장전14 지연보고;지급/보고1회;저장로드','11,12,13,14,15,16,17,18,19'),
('F13','combat','전투 컬러 초상','combat-color-portrait-20261024','일반전투2/콜로세움/캣파이트 ava_clear','엔진5사례;화면픽셀 확인 별도;진행중 구전투 저장 초상은 남을 수 있음','새 일반전투(양 동료)·콜로세움·캣파이트 진입;컬러초상 실제픽셀;화면갱신/종료복귀','02'),
('F14','production','미련한 소 생산·천재 동물기술 성장','cow-genius-balance-20261024','최종milk_gain1.5배;천재 pet/dressage/cowSK 양수XP75%,나머지 기존2배;분수개인보존','XP799/생산74/통합71;구실행중3인자호출 한 번 분수이월 한계','다음날 미련한소/비보유 같은조건 생산;천재 세기술 작은XP4회=기본XP의3회분;다른분야2배;개인실/조수 교환·저장로드 후 분수 유지',''),
('F15','traits','다재다능 신규획득 명성1등급','versatile-fame-20261024','새 부여 때 다음 표시등급 최소원천값으로 상승;상한5;기존보유 소급 없음','엔진313검사;GUI 실제 신규획득 별도','자동24기술A달성/편집기0→1;표시등급과원천값;반복조회/가격평가 중복없음;기존보유로드 무소급;해제후재부여는새부여',''),
('F16','traits','강한 복종심 명칭·설명','strong-obedience-rename-20261024','완전한 사육 표시를 강한 복종심으로;지속복종보정과훈련완료 구분','출력2/패치4블록;실제 UI 확인 별도','기존보유/편집기/프로필/전체보기 설명;옛명칭 잔류와노예근성 혼동 확인;수치보정 유지',''),
('F17','traits','카오틱 에센스','chaotic-essence-20261024|trait-merger-20261025','중앙물약상점900/1회분;부정일반1개랜덤삭제;통합별칭1회;긍정/성취/상태보호','기존915검증+통합/메시지;실제 구매→사용→저장로드 연속 GUI 별도','상점구매900/재고1→연구실목록→노예/조수사용;후보1개와혼합/통합별칭;1개만삭제/소모1;긍정·성취·상태보존;무후보/무재고/빈대상무소모;구약국저장로드',''),
('F18','combat','안개 개인 명성·목격담','fog-fame-20261024','15전투표;20%목격;40미만1/3/5,40~79 0/1/2,상한80;실제승리동료만1회','엔진216상황1480단언/실제난수목격2;전투전과정 GUI 별도','일반/강적/고유/약체 조우;노예/조수 승리;목격이름/실제증가량;39/40/79/80 경계;다수전합산없음;주인공대타/사망제외;중복정산','02'),
('F19','production','전용 단축 그림 버튼 복구','restore-button-art-20261024','녹색공용2참조→기존Fer_Tentacle.png;콜백/조건/효과 유지','실제Qt16/17로드·표시·클릭·저장;콜백59/45와AP5→4 확인 완료','16/17 실제원래버튼 표시/클릭;현재통합에서 AP차감과다음화면;새이미지누락으로분류하지 않음','16,17'),
('F20','combat','캣파이트 누적3승 제한','catfight-win-limit-20261024','승리당1회/생존패배승수보존/3승뒤금지;구준비링크가드','엔진62상황464조건+37회귀;후속명성 통합 GUI 별도','0→1→2→3 승리와각화면출전가능;생존패배승수불변;3승후설명/준비/시작차단;구저장승수초기화/역산없음;명성10+3+3 함께확인',''),
('F21','growth','체력별 기본 행동력','ap-curve-20261024','체력0~5 AP0/2/3/4/5/5;상한/회복/4생성/영입/UI9연결;로드리필없음','엔진999상황3867조건;실제기존파일 GUI로드 별도','6등급 프로필/도시/개인실 AP잠금;일반다음날 현재잔량+기본-부상;0/음수/반칸/보너스 저장로드 무충전;새생성/영입 최종체력 상한;주인공별도 유지',''),
('F22','growth','근육질 과로50% 완화','muscular-overwork-20261024','체력5 음수AP 체력XP손실 누적절반;개인0.5잔여;근육통별도','엔진2477상황8226조건/native저장9역할;실제기존파일 GUI로드 별도','근육질1점손실2회=총1/5점반복2,3;비근육질기존손실;음수AP행동·일일회복;역할교환·체력등급변화·저장로드 뒤0.5잔여;첫로드첫행동 구캐시',''),
('F23','growth','건강체질·의료센터 체질개선','constitution-unification-20261024','노예/조수1000/1회 건강체질획득/약골대체;HP·스태미나1.2배;운동/자연성장1.5배','엔진1899상황5627조건;콜백은마지막MSG억제진단;실제GUI별도','노예/조수 검진→신체개조→확인/취소/성공1000;돈부족/이미건강/기시술/대상변경/재클릭 무결제;현재AP/성장보존;식이·보조식품·충분휴식 분수저장;전투최대치',''),
('F24','economy','잡파·웡 매입가격/옵션 난이도','dealer-economy-20261024','옵션쉬움90/보통75/하드기존;현속성평가/등급표max;불복종20%1회;다재다능1회','엔진695상황3103조건;자동OPENGAME미완료 제외;실제GUI로드별도','옵션3난도에서양상인 견적→확인→대금/인물정리;불복종/F/다재다능/웡정신붕괴/잡파우대;확인중대상/난도/가격변화;구확인저장로드 재견적;재클릭중복지급없음',''),
('F25','economy','지역별 구매자 소문','buyer-rumors-20261024','스컵스/작크/아네스10,정상납품후5;현재보유29역할/고정구매처98명;가격노출없음','matcher105/결제보존87/가용성23/29역할×3/납품12;GUI연속동선별도','3안내자 대화→결제→단일/복수/0추천→페이지/복귀 무추가비;돈부족/소유인물0무소모;추천지역·실제납품조건일치;정상납품뒤해당서비스5;저장로드 할인/인물보존',''),
('F26','combat','랠리·캣파이트 명성','contest-fame-20261024','랠리첫10/반복40미만1,40~790.25/상한80;캣파이트1/2/3승10/3/3','엔진587상황2173조건/분수저장;실제마우스대회/GUI로드별도','랠리입장→추첨→우승/패배→복귀;첫10/반복1/40이상4승1점/79.75→80;기존결과로드무소급;참가취소/대상교체/재진입무명성;캣파이트승수별10/3/3 및3승차단',''),
('F27','combat','안개 전투준비 위험도·상성 대사','combat-danger-dialogue-20261025','15조우/고블린2변형 총16;원래선택전설명에승인문구','엔진16변형337조건;구조/선택지보존;전체실플레이별도','새61101~61115 조우 전투선택전 대사;늑대인간/와그/리치/오우거 힌트;고블린2/3인치환;가르시드85%태그;물러남/전투원래선택지;옛조우저장문구유지허용','02'),
('F28','traits','기존 UI 특성 전체보기','trait-overview-ui-20261025','제목링크/실측넘침링크;상태우선;특성2열+칭호1열;하단설명/닫기복원','실제엔진5기능/2역할DOM·MSG와브라우저10사례;모든기존파일GUI별도','노예/조수/개인실인물 제목→전체보기→각특성하단설명→도움말MSG닫기→같은창복원→닫기;짧은목록/넘침/장문스크롤/초과보유/숨은특성비노출;다른해상도','01'),
('F29','traits','특성 통합·배제·긍정우선','trait-merger-20261025','주목욕구/활동적·휴식선호 통합;5배제;기존충돌부정만정리;긍정끼리기존공존보존','엔진121사례573조건;전역갱신revision3;실제모든구세이브별도','구별칭중복1표시/설명/칭찬1회;반복활동기분±2/휴식반응;긍정+부정5충돌 정리;비표준/무관특성보존;미련한소+운동/활동 기존유지/신규충돌차단/숫자감소허용;카오틱별칭삭제후재등장없음;저장로드','01'),
('F30','growth','금장 목줄 거부 질문 A안','golden-collar-fix-20261025|collar-runtime-test-20261025','재계산전복귀주소;역할/ID/순번/현재목줄검사;Y/X먼저소비;구질문복구;장비명정정','엔진86+원래링크6+범위밖3;추가일일4/실제메뉴Load4 완료','일반일/청구일 정산→Y/X→원메뉴;날짜/청구1회/반환1개;재클릭/재표시무추가;구미응답/이미강제/반환저장로드;무관질문보존;연속거부자;최신실제GUI검증은이미완료로유지',''),
('F31','visual','사용자 나노분자 첨가제 문장 정리','post-patch-audit-20261024','10/22 대사편집기 저장1건,문장연결 유지','감사에서현문구1/옛문구0;실제해당설명화면별도','나노분자 첨가제 실제설명/툴팁 열어줄바꿈·문장연결·원래기능메뉴확인',''),
('F32','visual','사용자 주인공 종합정보 표시 편집','trait-overview-ui-20261025','10/25KST 수동저장12건/되돌리기2;최종master_stat 제목5곳의문자접두·밑줄정리/속성question19px','편집기해시12단계 연속성확인;기존감사에없던추가항목;현재GUI별도','주인공종합정보에서이름/속성/자동마법/교육·성적기술 제목;question.png19px 아이콘과속성도움말클릭/닫기/입력복귀;사용자최종문구보존',''),
]

GROUPS = [
 {'id':'combat','priority':1,'title':'전투·경기: 실제 진입부터 결과 복귀','features':['F02','F03','F13','F18','F20','F26','F27'],'note':'02/03는기존표본.그외대회/조우표본은기존재현스크립트를참고해격리준비.난수제어결과와실제랜덤플레이구분.'},
 {'id':'growth','priority':1,'title':'행동력·과로·의료·일일정산','features':['F21','F22','F23','F30'],'note':'실제메뉴확인과일일전환/저장로드가핵심.목줄8경로직접검사는기완료.'},
 {'id':'traits','priority':1,'title':'특성·편집·약품·전체보기','features':['F08','F15','F16','F17','F28','F29'],'note':'획득→설명/전체보기→효과→삭제/충돌→저장로드의연속사용흐름.일반8칸은검토종료.'},
 {'id':'economy','priority':1,'title':'판매·유료소문·파산정산','features':['F10','F24','F25'],'note':'견적과실제돈/인물변화,구확인저장,서비스할인과원래납품복귀.파산07은교정본만엔딩판정에사용.'},
 {'id':'production','priority':2,'title':'생산·성장·수량·지연보고','features':['F11','F12','F14','F19'],'note':'11~19의일반/특성비교는매회같은파일재로드.이미클릭한16/17만으로전체행렬통과금지.'},
 {'id':'visual','priority':2,'title':'외형·번역·관계·주인공 표시','features':['F01','F04','F05','F06','F07','F09','F31','F32'],'note':'01/04/05/06 실제Load와다음화면복귀.에게야역할그림없음은정상.종합정보MSG레이어기존제보함께관찰.'},
]

def read(p): return json.loads(pathlib.Path(p).read_text(encoding='utf-8-sig'))
def sha(p): return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def dump(p,obj): pathlib.Path(p).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def main():
    assert sha(GAME/'jack.qsp') == CURRENT, 'WORK changed; do not publish stale inventory'
    full=pathlib.Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp')
    assert sha(full)==BASE
    core=SPLIT/'JO9_2.4_SecondPatch_20261021.zip'
    with zipfile.ZipFile(core) as z:
        entry=z.read('game/jack.qsp'); assert hashlib.sha256(entry).hexdigest()==BASE
    manifest=read(SPLIT/'LATEST_SPLIT_BUILD.json')
    features=[]
    for fid,group,title,dirs,change,tests,scenarios,saves in ROWS:
        paths=[REPO/'records'/x for x in dirs.split('|')]
        scripts=sorted({str(p).replace('\\','/') for d in paths for p in d.rglob('*.cjs')})
        manuals=[str(p).replace('\\','/') for d in paths for name in ['MANUAL_KO.md','APPLICATION_MANUAL_KO.md','REPORT_KO.md'] if (p:=d/name).exists()]
        features.append({'id':fid,'group':group,'title':title,'status':'APPLIED_WORK_UNRELEASED','change':change,'records':[str(x).replace('\\','/') for x in paths],'manuals':manuals,'reproduction_scripts':scripts,'existing_evidence_historical':tests,'required_player_flow_scenarios':scenarios.split(';'),'prepared_save_numbers':saves.split(',') if saves else [],'current_run_status':'NOT_RUN_BY_INVENTORY_AGENT'})

    # Traverse metadata edges, including editor undo edges, without replaying/writing QSP.
    edges=[]
    for p in sorted((REPO/'mods').glob('2026-10-2[2345]*.json')):
        j=read(p)
        edges.append({'path':str(p).replace('\\','/'),'kind':'mod','id':j['id'],'before':j['before_sha256'].lower(),'after':j['after_sha256'].lower()})
    editor=GAME/'modtools/text-workshop/runtime/backups'
    for p in sorted(editor.glob('2026-10-2[2345]*.json')):
        j=read(p)
        if j.get('before') and j.get('after'):
            edges.append({'path':str(p).replace('\\','/'),'kind':'editor_'+str(j.get('kind','save')),'id':j['id'],'before':j['before'].lower(),'after':j['after'].lower(),'location':j.get('location'),'edits':j.get('mod',{}).get('edits',[])})
    collar=REPO/'records/golden-collar-fix-20261025'
    for p in sorted(collar.glob('2026-10-25*.json')):
        j=read(p)
        edges.append({'path':str(p).replace('\\','/'),'kind':'collar_patch','id':j['id'],'before':j['before_sha256'].lower(),'after':j['after_sha256'].lower()})
    cur=BASE;used=[];seen=set()
    while cur!=CURRENT:
        candidates=sorted([(i,e) for i,e in enumerate(edges) if i not in seen and e['before']==cur],key=lambda x:x[1]['path'])
        if not candidates: break
        i,e=candidates[0];seen.add(i);used.append(e);cur=e['after']
        assert len(used)<100
    chain={'method':'metadata_hash_continuity_not_full_byte_replay','baseline':BASE,'target':CURRENT,'reached':cur,'complete':cur==CURRENT,'stages':len(used),'kinds':{k:sum(x['kind']==k for x in used) for k in sorted({x['kind'] for x in used})},'edges':used}
    dump(OUT/'change-chain.json',chain)
    save_spec=read(REPO/'records/ready-test-saves-20261023/spec.json')
    saves=[{k:s[k] for k in ['key','title','file','how']} for s in save_spec['all']]
    dump(OUT/'prepared-saves.json',saves)
    exclusions=[
      {'id':'X01','title':'일반8칸/만석획득규칙','status':'DROPPED_NOT_A_TODO','source':'records/trait-scope-decision-20261025/DECISION_KO.md'},
      {'id':'X02','title':'칭호구성/세번째칭호','status':'USER_DEFERRED','source':'records/deferred-discussions-20261024/index.json:D08'},
      {'id':'X03','title':'지성AP할인','status':'USER_DEFERRED','source':'records/deferred-discussions-20261024/index.json:D03'},
      {'id':'X04','title':'아이템/전리품·4차부동산32문구·혀손실·다재다능XP·상인신규서비스/재매입·한글식별자이관','status':'USER_DEFERRED','source':'records/deferred-discussions-20261024/index.json'},
      {'id':'X05','title':'전투/전차 원본난도주석불일치','status':'USER_DEFERRED','source':'records/deferred-discussions-20261024/index.json:D01,D02'},
      {'id':'X06','title':'마법낙인 특수이벤트 제보 재현','status':'USER_DEFERRED_REPRODUCTION','source':'records/deferred-discussions-20261024/index.json:D12'},
      {'id':'X07','title':'명기전용알림/X명시확인·쉬움복종+8/+10·납품상세안내·희귀가격상한·하드50%','status':'REVIEWED_NOT_APPROVED_NOT_IMPLEMENTED','source':'records/proposals-review-20261025/'},
      {'id':'X08','title':'종합정보MSG레이어/이미지0접두2경로/모유량6링크/개인실135','status':'CONFIRMED_STATIC_FINDINGS_NOT_FIXED','source':'records/bug-report-review-20261025/REPORT_KO.md'},
      {'id':'X09','title':'아르곤F1/F3/F4 기능후보 등 기존승인대기','status':'NOT_APPROVED_NOT_IMPLEMENTED','source':'docs/POST_PATCH_STATUS_AUDIT_20261024.md'},
      {'id':'X10','title':'ImageWorkshop/B컷/모딩도구','status':'EXCLUDED_NOT_GAME_FEATURES','source':'docs/POST_PATCH_STATUS_AUDIT_20261024.md'},
    ]
    result={'schema':1,'date':'2026-10-25','scope':'last_shipped_qsp_build_to_current_WORK_all_player_facing_changes','read_only_game':True,'baseline':{'archive':str(core).replace('\\','/'),'archive_sha256':sha(core),'qsp_sha256':BASE,'qsp_bytes':len(entry),'revision':manifest['coreRevision'],'manifest':str(SPLIT/'LATEST_SPLIT_BUILD.json').replace('\\','/'),'manifest_archive_names_are_stale':True},'current':{'path':str(GAME/'jack.qsp').replace('\\','/'),'qsp_sha256':CURRENT,'qsp_bytes':(GAME/'jack.qsp').stat().st_size,'Full_qsp_sha256':sha(full)},'count_features':len(features),'metadata_chain':{'path':str(OUT/'change-chain.json'),'complete':chain['complete'],'stages':chain['stages'],'kinds':chain['kinds']},'priority_groups':GROUPS,'features':features,'excluded_or_unimplemented':exclusions,'global_limits':['기존 집중엔진 PASS는 현재 실제 플레이 PASS와 다름','기존시험19개는10/23표본으로 이후기능전부를포괄하지않음','시험생성기의 DEATH긴함수/인덱스 누락 때문에 원본07의 빈엔딩을게임전체결함으로판정하지않음','일반생성기수리는미결;교정07~10 ZIP은 asset-event-ui-20261024/runtime-test에보존','엄격CRC/모든기존파일로드는미증명;ignoreCRC 진단과제품로드분리','재현스크립트의 install/finish/apply 등은실행하지않음;상수와단계를검토후격리본만사용','목줄추가검증의 실제 메뉴Load4/일일4와 자산GUI15페이지·단축버튼Qt클릭은기완료로유지'],'resource_delta':['master/master_edward_sepia.png','bg/jo9_bankruptcy_seizure.png','ui overhaul의 카오틱 활성/비활성PNG2','css/jo9_traits_view.css','content/js/jo9_traits_view.js','css/base.css 최종가격판/숫자표시'],'sources':['G:/somi/JO9sa/docs/POST_PATCH_STATUS_AUDIT_20261024.md','G:/somi/JO9sa/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md','G:/somi/JO9sa/docs/SESSION_HANDOFF_INDEX.md','G:/somi/JO9sa/records/deferred-discussions-20261024/index.json']}
    dump(OUT/'inventory.json',result)
    lines=['# 지난 배포 빌드 이후 전체 기능 플레이 검사 목록','',f'배포 QSP `{BASE}` → 현재 WORK `{CURRENT}`. 실제 최종 본체 ZIP SHA256 `{sha(core)}`를 읽어 내부 `game/jack.qsp`와 직접 대조했다. 파일명은 최종명으로 바뀌었고 `LATEST_SPLIT_BUILD.json`의 Test_r4 경로는 오래됐지만 내용 기준은 `r4-user-dialogue-editor-sync`다. Full은 여전히 배포 QSP다.','',f'사용자에게 보이는 변경을 **{len(features)}묶음**으로 정리했다. 같은 기능의 후속 보정은 한 묶음이고 모딩 도구는 제외했다. 해시 메타데이터 {chain["stages"]}단계의 연결은 '+('완료' if chain['complete'] else '미완료')+'했다. 이는 전 패치 바이트 재생을 의미하지 않는다. 게임 파일은 변경하지 않았다.','','## 위임할 검사 묶음','']
    for g in GROUPS:
        lines += [f'- P{g["priority"]} **{g["title"]}**: '+', '.join(g['features'])+'. '+g['note']]
    lines+=['','## 적용 완료 기능과 실제 사용자 흐름','', '| ID | 기능 | 기존 증거와 한계 | 이번에 확인할 흐름 |','|---|---|---|---|']
    for f in features:
        lines.append('|'+f['id']+'|'+f['title']+'|'+f['existing_evidence_historical']+'|'+f['required_player_flow_scenarios'][0]+'|')
    lines+=['','전체 분기·경계·저장로드 항목과 정확한 기록/재현 스크립트 경로는 `inventory.json`에 있다. 준비된19세이브의 원래 파일명/사용법은 `prepared-saves.json`에 있다. 이 목록 작성 에이전트는 플레이를 실행하지 않았으며, 현재 실행 결과는 담당 플레이 검사에서 별도로 채워야 한다.','','## 새로 확인한 누락 방지 사항','','10/24 감사 이후 구현된 캣파이트3승·기본AP·근육질과로·건강체질통합·잡파/웡가격·구매자소문·경기명성·안개위험도대사·특성전체보기·특성통합·금장목줄 A안은 모두 대상이다. 감사 첫머리의 옛 미구현 표를 최신 상태로 인용하면 안 된다.','','기존 감사의 사용자 나노분자 설명1건 외에, 10/25 KST 주인공 종합정보 수동편집12단계(되돌리기2 포함)를 추가로 찾았다. master_stat 이름/속성/자동마법/교육·성적기술 제목 정리와 question.png19px 도움말 아이콘이다. 사용자 최종 편집을 보존하며 도움말 열기/닫기와 화면 복귀를 확인한다. 80a295→c05e014의 누락 이력을 편집실 로그로 연결했다.','','목줄은 최신 일일4경로·실제 메뉴Load4경로가 이미 통과했다. 자산처분15페이지와16/17 단축버튼 실제Qt클릭도 완료다. 이를 미실행으로 되돌리지 않는다. 다만 현재 통합본의 추가 조합과 엄격CRC·사용자 전 세이브를 모두 검증한 결과는 아니다.','','## 제외·보류·미승인','','일반8칸/만석획득규칙은 검토종료다. 칭호보완·지성AP·원본난도불일치·아이템/부동산/혀손실/다재다능XP·신규상인/재매입은 보류 상태를 유지한다. 마법낙인 제보 재현은 사용자보류다. 명기알림·쉬움복종수치·납품상세안내·희귀가격상한/하드50%는 검토안이다. 모두 신규구현 검사대상으로 세지 않는다.','','종합정보MSG레이어·정확한 이미지0접두2경로·모유량6링크·개인실135는 정적으로 확인한 미수정 제보다. 연관 기능 플레이 중 증상은 관찰하되 수정완료 기능으로 세지 않는다. 별도 수리 승인을 이 조사로 추정하지 않는다.','','## 시험 자료와 보존','','원본07 시험 세이브의 빈 엔딩은 생성기 DEATH[0] 생략/이름인덱스 문제다. asset-event-ui-20261024/runtime-test의 교정07~10을 사용하고 원본을 덮어쓰지 않는다. 06은 복귀슬롯8개 교정본을 사용한다. 11~15의 일반/특성 비교는 매회 같은 원본을 재로드한다. 16/17 버튼 클릭 성공만으로 자동업무·모든크기·지연보고 전체가 통과했다고 하지 않는다.','','작업 산출물은 이 폴더의 JSON/보고서/재생성 스크립트뿐이다. 게임·Full·ZIP·사용자 세이브 변경, 배포·커밋·푸시는 하지 않았다.']
    (OUT/'REPORT_KO.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print(json.dumps({'features':len(features),'chain':chain['complete'],'stages':chain['stages'],'kinds':chain['kinds'],'files':['inventory.json','change-chain.json','prepared-saves.json','REPORT_KO.md']},ensure_ascii=False))

if __name__=='__main__': main()
