const fs=require('fs'),a=require('assert/strict'),z=require('zlib'),path=require('path');
const {R,G,D,T,rd,wr,body,put}=require('./handoff-b-combined.cjs'),c=require(R+'/tools/text-workshop/core.cjs');
const p=rd(D+'/plan.json'),v=rd(D+'/verification.json'),raw=fs.readFileSync(G+'/jack.qsp');a.equal(c.hash(raw),p.after);a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));a.equal(+v.integration.failures,0);
const bg=rd(R+'/records/handoff-b-background-20261112/BACKGROUND_NATIVE_RESULTS.json'),oc=rd(R+'/records/handoff-b-occupation-20261112/verification.json'),ac=rd(R+'/records/handoff-b-activity-20261112/verification.json');
fs.writeFileSync(D+'/USER_DECISIONS_KO.md',`# B 사용자 확정 결정

2026-11-13 반영 기준. 아래 항목은 이 채팅에서 사용자가 직접 선택했다.

1. 기존 세계별 비중을 유지하고 고대 로마를 한 칸 추가한다. 각 세계 안의 유효 출신·직업은 균등 추첨한다. 불가능 조합은 제외하며, 유효 조합 자체가 없으면 생성 실패로 처리한다.
2. 끈기·워커홀릭·산만함·무기력함 충돌은 긍정 계열 우선, 같은 계열에서는 상위 특성 우선으로 정리한다. 직업 명세의 추첨 규칙을 적용한 뒤 정규화한다.
3. 출신·직업의 기존 초기 능력치 ±보정을 제거해 세계의 역할로 통일한다. 고정 캐릭터의 지정값은 보존한다.
4. 고대 로마의 로마풍 이름과 독립 동향 그룹을 추가한다. 문명 단계는 기존 힘과 마법 세계와 같다.
5. 하녀의 발견 누적 경험 절반 메모는 보류한다. 현재 게임의 성공 업무 후 발견 방식을 유지한다.
6. 출신의 세련됨 추가 추첨만 보류한다. 별도 세련됨 저장값은 만들지 않으며, 기존 외양 계산을 유지한다. 새 저장값은 일반 무작위 여부 하나와 성장 소수 누적값 셋, 총 네 개다.
7. 도둑의 체력 C 이상·운동선수의 체력 B 이상 최저조건은 3번의 예외로 유지한다.

C의 필로우토크·과거 경험 통계·펠리시티 보살핌은 이번 B 반영 범위에 포함하지 않는다.
`);
fs.writeFileSync(D+'/REPORT_KO.md',`# PR17 B · 배경·일반 생성·출신 성장·활동 단계 통합 WORK 반영

2026-11-13, 사용자 승인한 순서 A→B의 B를 반영했다. 현재 WORK QSP는 ${p.after}. [A](../handoff-a-work-20261112/REPORT_KO.md)의 대상별 장악력·악명과 도나도나 고정 프리셋/보유1회갱신을 보존했다. C 필로우토크는 차기 업데이트로 유지했다.

## 반영 결과와 확정 결정

- 배경: 기존152개 대사 교체 + 신규11항목 =163개. 신규는 고대로마 세계1,출신3,직업7. 사용자가 확정한 연결검수JSON 및 여학생·무용가 초안을 그대로 연결했다. 새 대사를 임의 창작하지 않았다. Roman 이름24개는 승인받은 로마풍 이름 목록으로 추가했다(공식 역사 인명표를 주장하지 않음).
- 연결: 기존세계 추첨 비중에 로마1칸 추가,각세계 안의 허용출신·직업 균등. v2세계/직업별 허용·거부·연령교집합으로 유효 후보만 뽑으며 전체빈후보는 실패한다. 불법대체없음. 고대로마 nation10·문명단계4이며 문명효과는 기존힘과마법과 같다.
- 초기 능력: 세계만 보정. 기존출신·직업의 ±능력치변동은 새 일반랜덤에 한해 제거하고 사용자가예외로유지한도둑체력C·운동선수체력B최저조건과기술·특성·기존고정값은 유지한다. 중세 기질 경계오타(<5에서감소→>1에서감소)수정. 로마는 체력+1·자아/지성-1(기존경계),세련됨 추가추첨은 사용자 결정으로 보류했다. 관련 수치/임시외양/추가필드를 변경하지 않는다.
- 직업:31명세/확정73규칙(상위규칙총78=확정73+메모5). +%p는 실제현재생성코드의 기저·조건에서 정확분수46사례를 도출해 추가비율을 계산했다. 1만표본을 원확률로 쓰지 않았다. 영웅20%진입/4%상위,성향30/30/40,확정/금지/최저기술/제외등급을 연결했다. 활동규칙은 원시추첨목표를 적용한 뒤 승인한 단계정규화를 하므로 상위에 흡수된 하위 표시 비율과 원시확률을 구분한다.
- 출신성장: 확정엑셀 R의57개 ID와 X~AB 성장계수를 사용하고, AC~AD의 세련됨 추가추첨은 보류했다. 자아·태도·감수성의 해당방향 변화만 보정하고 소수손실 없이 누적한다. 예:하락폭+10%는-10→-11. 일반행동·교육·전투·밤넘기기의335개 실제증감문을 같은 helper로 연결했다. 조건·기본변화량·고정인물 결과는 보존한다. 9,144개 최상위 주석블록은 독립검토에서 바이트보존했다.
- 활동: 없음/끈기/워커홀릭/산만함/무기력함 중 하나. 기존 및 신규 충돌은 긍정우선·같은계열상위우선. 상위는 하위효과 포함,중복가산없음. 반복경험+10% 또는 경험/성과-10%,반복기분+2,둘째활동부터±2,직접휴식/마사지 절반·두배를 반영했다. 내부기분수치이며 표시등급+2가 아니다. 기존 고정일과 예외와 개인실전용효과는 유지했다. 자동승급은 추가하지 않았다.

## 기존 플레이·저장

새 일반랜덤 여부는 캐릭터 배열 jo9_bg_random1개로 구분한다. 기존유니크·복제·명시프리셋은0으로 유지해 새생성보정/직업추첨을 적용하지 않는다. 기존 world/family/occupation문자열은 재사용한다. 출신소수누적은 jo9_origin_frac_ego/pride/sensitivity3개를 더한다. 역할배열 전체를 이동하는 원래swap/copy로 함께 옮겨진다. 이4개 외 새캐릭터저장값은 없다. 활동단계는 기존 focus/work_ethic/comfort값을 재사용하며 새영구필드를 만들지 않는다.

이미 영입한 일반인물에 새로운배경·초기능력·출신성장표식을 소급하지 않는다. 이미보유한 도나도나의 앞서승인한1회갱신은 계속동작한다. 활동·집중 충돌정리와 효과개편은 기존 캐릭터에도 기존repair입구를 통해 반영한다. 이름·이미지·장비·소유일·헌신·관계·퀘스트/행동진행을 초기화하지 않는다. 개인SAV를 직접 편집하지 않았다.

옛 세이브의 전역배경대사는 원래옛문구와 정확히 일치할 때만 바꾸고 신규슬롯은 비었을 때만 채운다. 사용자수동전역문구,기존인물설명 사본,커스텀신규문구/로마이름풀은 보존한다. 전체#static_txt를 무작정 재로드하지 않는다. 기존 속성/기술/특성의 옛배경판단을 다시 추첨하지도 않는다.

## 입력·함수·의존성·해제

입력은 PR17/66178cf5의 확정JSON·직업명세·엑셀과 A완료WORK ${p.before}. 동시PR a9ea76bd까지 추가4커밋을 대조했고 B확정데이터 변경없음을 확인했다. 추가커밋의 캐릭터통합편집기는 이 게임반영 범위에 자동합치지 않았다.

새로케이션4개: jo9_background_b(후보·본문/캐시갱신),jo9_occupation_init(일반직업후처리),jo9_activity_stage(기존특성통합입구),jo9_origin_growth(생성시소수누적값초기화·증감반환/소수보존). 원본본문17개와 이함수4개는 mods/${p.mod?.id||'2026-11-12_zzzzzzzzzz_handoff_b_combined'}.json에 현재WORK기준으로 기록했다. 개별산출물은 ../handoff-b-background-20261112/,../handoff-b-occupation-20261112/,../handoff-b-activity-20261112/,../handoff-b-origin-growth-20261112/.

성장helper는 baseDelta를 받아 해당출신계수와 누적나머지를 적용한 정수를 반환한다. 저장변경은3개나머지만이며 비대상역할/고정/옛캐릭터/반대방향은 원래delta를 반환한다. 직접등급설정·초기값·rate리셋을 보정하지 않는다. 세련됨 추가추첨은 하지 않는다. 계산문은 실제코드와 중첩동적문자열을 나눠 편집했고 주석·문구는 보존했다. 반환함수/호출/초기화는 함께 의존하므로 제거할 때 같이 검토한다.

이후수동수정뒤 전체이전QSP로 덮지 말고 mod의차이를 역검토한다. 코드제거는 이미저장된캐릭터의효과를 자동복원하지 않는다. 최소복구본 baseline.qsp.gz/manifest이전본/traits이전본과 변경명세·핵심재현코드를 보존한다.

## 검증과 한계

- 배경개별:새캐시1854검사/600회·옛캐시2016검사/600회,실패0. 후보·연령·빈후보·수동전역캐시/기존인물설명 보존.
- 직업개별:실제엔진197검사,실제공통추첨+RNG11000회(관측최대편차2.39%p),실패0. 정확분수원장과 실제소스근거별도. 표본은 검증자료이며 수식의대체가 아니다.
- 활동개별:실제엔진155사례/4303검사0실패. 같은활동/교대/날짜변경/처음·둘째활동/휴식·마사지/레거시조합,도나도나23·춘향원자료 보존.
- 출신개별:실제엔진1736검사0실패.57개 출신 양방향·20회소수누적·고정/여러역할/dynslave·실제변환문 중첩따옴표·보류한세련됨값유지와경계누적보존.
- 통합 실제생성: ${+v.integration.randomSamples}회 무작위·${+v.integration.fixedSamples}명 고정,${+v.integration.checks}검사,실패0. 세부/한계는 native-integration.json 참조. 초기배치의간헐적timeout원인은미확정이며성공검사와별도보존했다.전체개인SAV로드·GUI·장기플레이는 미검증이다.
- 공식적용기 재생·재적용 무변경,구조/CRLF/왕복·함수4개제거+17본문역적용 시 A기준 바이트일치. 대상외본문과 보호한Dohna/춘향/Ahelper 보존. WORK/추적QSP/manifest일치.
- 현재 모드툴의 특성열람표4개 설명만 갱신하고 다른행/수동메타데이터를 보존했다. PR의별도history편집기2JSON/8설명은 변경명세를 남겨 클로드 인계 대상으로 구분했다(브랜치파일자동덮어쓰기없음).
- 전체배포출고검사는 별도이며,main병합·커밋푸시·Full·음원·개인SAV수정은 하지 않았다.

## 확인 경로와 보류

일반EXE를 완전히 재시작→기존세이브불러오기→새일반캐릭터의배경/특성 및 기존고정캐릭터 상태를 확인한다. 활동정보에서는4개중하나만표시되고 반복교육/휴식보상이 맞는지 확인한다. 표시·플레이검증은 아직완료로표현하지 않는다.

세련됨추가추첨은실제외양보정과의상호작용문제로사용자가보류했다.임시외양/세련됨누적값을그대로두고,출신의자아·태도·감수성성장만연결했다.하녀‘발견누적경험절반’메모는 현게임이누적경험기준을쓰지않아 사용자가보류했다. 기존성공업무후발견방식을 유지한다. C필로우토크/과거경험통계/펠리시티보살핌은 이번B에 넣지 않았다.
`);
fs.writeFileSync(D+'/STATUS_KO.md','# B 반영 완료\n\n현재 WORK '+p.after+'. 세련됨 추가추첨과 하녀발견메모는 사용자보류, 도둑C/운동선수B체력최저는 사용자예외승인으로유지. 승인한 새 저장값4개만사용한다. REPORT_KO.md 참조. CANDIDATE_MOD.json의942b는 세련됨검사실패 당시의미적용초안역사자료이며적용하지않는다. 활성mods에는최종해시의정식패치만있다. C는차기업데이트.\n');
const idx=R+'/docs/SESSION_HANDOFF_INDEX.md';fs.writeFileSync(idx,`## 2026-11-13 Codex: PR17 B 통합 WORK 반영\n\n[반영범위·사용·저장·검증·보류](../records/handoff-b-combined-20261112/REPORT_KO.md).152본문교체+11신규,연결v2/로마이름·독립그룹,세계초기보정/57출신성장,31직업73규칙,활동4단계.사용자확정비중·우선순위·책임분리.새캐릭터값4개,기존고정/플레이기록유지.통합생성검사/공식재생·멱등·역검증통과,개인SAV/UI미확인.하녀발견메모보류,C차기.커밋푸시/Full/음원없음.\n\n`+fs.readFileSync(idx,'utf8'));
for(const f of ['handoff-b-combined.cjs','handoff-b-apply.cjs','handoff-b-close.cjs','origin-growth-module.cjs','origin-growth-input.cjs','origin-growth-native.cjs'])fs.copyFileSync(f,D+'/'+f);
const mod=p.mod;delete p.mod;p.modFile='mods/'+mod.id+'.json';p.modSha256=c.hash(fs.readFileSync(R+'/'+p.modFile));wr(D+'/plan.json',p);
// Preserve the failed style experiment as an exact small delta rather than another full 10 MB mod copy.
const historyPath=D+'/CANDIDATE_MOD.json';if(fs.existsSync(historyPath)){
 const h=rd(historyPath),current=c.parse(raw),diff=[];
 const targets=[...h.edits.map(e=>({name:e.location,text:e.new})),...h.add_locations.map(e=>({name:e.name,text:e.body}))];
 for(const t of targets){const now=body(current,t.name);if(now===t.text)continue;let left=0,right=0;while(left<now.length&&left<t.text.length&&now[left]===t.text[left])left++;while(right<now.length-left&&right<t.text.length-left&&now[now.length-1-right]===t.text[t.text.length-1-right])right++;diff.push({location:t.name,...c.minimalEdit(now,t.text,left,now.length-right,t.text.length-right)});}
 const replay=c.parse(raw);for(const e of diff){const now=body(replay,e.location);a.equal(now.split(e.old).length-1,1);put(replay,e.location,now.replace(e.old,()=>e.new));}a.equal(c.hash(c.serialize(replay)),h.after_sha256);
 wr(D+'/CANDIDATE_STYLE_DIFF.json',{status:'HISTORICAL_FAILED_STYLE_EXPERIMENT_NOT_FOR_WORK',finalBaseSha256:p.after,historicalSha256:h.after_sha256,edits:diff,replayHashVerified:true});fs.unlinkSync(historyPath);
 const sp=D+'/STATUS_KO.md';fs.writeFileSync(sp,fs.readFileSync(sp,'utf8').replace('CANDIDATE_MOD.json의942b','CANDIDATE_STYLE_DIFF.json로차분보존한942b'));
}
const growthPath=R+'/records/handoff-b-origin-growth-20261112/module.json',growth=rd(growthPath);delete growth.edits;growth.reconstruction='handoff-b-combined-20261112/origin-growth-module.cjs build() after background/occupation/activity; official combined mod contains exact final diff';wr(growthPath,growth);
fs.writeFileSync(R+'/records/handoff-b-origin-growth-20261112/REPORT_KO.md','# 출신 성장 구현·검증\n\n확정엑셀 R의57ID와X~AB성장계수를사용.AC~AD세련됨추첨은보류.같은방향 변화만적용,소수누적3키.세련됨추가추첨은사용자보류.신규일반flag1만대상,고정/기존인물은raw.실제엔진1736검사0실패.335호출/13본문(일반코드와중첩코드분리),주석보존.\n\n초기네이티브검사로LOCAL다중초기화/지원하지않는문자생성식 문제를찾아분리초기화와검증된따옴표연결식으로수정했다.독립검토에서실제임시배열dynslave허용누락을찾아추가하고회귀검사통과.핵심코드는통합record에보존.개인SAV/UI미검증.\n');
function cleanup(t){if(!fs.existsSync(t))return;const abs=fs.realpathSync(t),par=fs.realpathSync('G:/Codex/tmp');a.equal(path.dirname(abs).toLowerCase(),par.toLowerCase());a(['handoff-b-combined-20261112','handoff-b-origin-growth-20261112'].includes(path.basename(abs)));function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const x=path.join(dir,e.name);a(!fs.lstatSync(x).isSymbolicLink());if(e.isDirectory())scan(x);}}scan(abs);fs.rmSync(abs,{recursive:true});}
cleanup(T);cleanup('G:/Codex/tmp/handoff-b-origin-growth-20261112');fs.writeFileSync(D+'/cleanup.txt','이번 작업의 격리 후보·공식재생 사본·시험 SAV·복제 JSON만 정리.핵심보고/계수/정확mod/원복gzip/재현스크립트는 보존.\n');console.log('B verified, reported and task diagnostics removed');
