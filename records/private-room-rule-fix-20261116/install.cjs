'use strict';
const {fs,a,R,W,T,c,body}=require('./shared.cjs'),z=require('zlib');
const D=R+'/records/private-room-rule-fix-20261116',H=__dirname,load=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const p=load(H+'/patch.json'),prep=load(H+'/prepared.json'),green=load(H+'/daily-green-results.json'),ext=load(H+'/external-verification.json'),combined=load(T+'/client-results.json');
a(green.length===1&&green[0].pass);a(ext.green.length===3&&ext.green.every(r=>r.pass));a(combined.length===1&&combined[0].name==='combined'&&combined[0].pass);
a(fs.readFileSync(H+'/official-replay.log','utf8').toLowerCase().includes(p.after_sha256));a(fs.readFileSync(H+'/official-reapply.log','utf8').includes('이미 적용'));
const before=fs.readFileSync(W+'/jack.qsp'),after=fs.readFileSync(T+'/candidate.qsp'),source=fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp');a.equal(c.hash(before),p.before_sha256);a(before.equals(source));a.equal(c.hash(after),p.after_sha256);
const beforeDoc=c.parse(before),afterDoc=c.parse(after);for(const name of ['#dynamic','assistant_stat','jo9_household_worker'])a.equal(body(beforeDoc,name),body(afterDoc,name));
const inverse=c.parse(after);for(const e of [...p.edits].reverse()){const l=inverse.locations.find(l=>l.name===e.location),b=body(inverse,e.location);a.equal(b.split(e.new).length,2);inverse.lines[l.body]=c.shift(b.replace(e.new,()=>e.old),-5);}a(c.serialize(inverse).equals(before));
const manifestPath=R+'/assets/runtime-source-2.4.1.json',manifestRaw=fs.readFileSync(manifestPath),manifest=JSON.parse(manifestRaw);a.equal(manifest.sourceQspSha256,p.before_sha256);
a(!fs.existsSync(D),'Do not overwrite a completed record');fs.mkdirSync(D,{recursive:true});fs.writeFileSync(D+'/manifest.before.json.gz',z.gzipSync(manifestRaw));
for(const name of fs.readdirSync(H))if(fs.statSync(H+'/'+name).isFile())fs.copyFileSync(H+'/'+name,D+'/'+name);
for(const name of fs.readdirSync(T))if(name.endsWith('-stderr.log'))fs.copyFileSync(T+'/'+name,D+'/'+name);
fs.writeFileSync(D+'/combined-results.json',JSON.stringify(combined,null,2)+'\n');
fs.writeFileSync(R+'/mods/'+p.id+'.json',JSON.stringify(p,null,2)+'\n');fs.writeFileSync(W+'/jack.qsp',after);fs.writeFileSync(R+'/assets/runtime/2.4.1/jack.qsp',after);
manifest.sourceQspSha256=p.after_sha256;manifest.snapshotDate='2026-11-16';const row=manifest.files.find(r=>r.runtimePath==='jack.qsp');a(row);row.sha256=p.after_sha256;row.bytes=after.length;
manifest.latestPrivateRoomRules={mod:p.id,report:'records/private-room-rule-fix-20261116/REPORT_KO.md',rooms:4,assistantExpanded:false,blockedExternalRules:9,preservedRules:6,newSaveFields:0};fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
const report=`# 개인실 두 규칙·외근 제한 반영

2026-11-16 사용자 최종 지시 반영. 현재 규칙 메뉴가 있는 개인실1~4에만 소변기/육변기 일일 처리·설명·무드 연결을 추가했다. 조수 지원은 추가하지 않았다.

## 최종 동작

휴식(duty0)·집안일(duty1)의 정상 활동 상태에서는 일반 노예의 기존 수락·거부·도구 강제 조건, 일일 기분/습관/위생/성향·기술 경험 변화와 불쾌 무드 조건을 재사용한다. 무드는 원래의 성향·기술·정신상태 조건이 맞을 때만 기존 공통 갱신 경로에서 표시된다.
일반 노예의 기존 처리 본문은 유지했다. 기상 담당자에게 이미 적용된 위반·강제 수치와 설명은 보존하며, 새 두 규칙으로 늘어난 부분만 처리한다. 강제 상황의 인식 보정도 기존 하루 상한을 넘지 않도록 차이만 더한다. 전체 개인실은 각각 한 번씩 처리하고 일반 노예의 overnight_rules_count를 건드리지 않는다.

외근(duty2 안개 경계,3 길거리,4 일용직)을 지정하면 식사 준비·잡일·목욕·펫 강요·재갈·육변기·소변기·배변 금지·안개 괴물 착정9개 규칙을 해제한다. 기존 세이브의 충돌 값도 다음 일일 처리에서 정리한다. 외근 상태에서는 해당9개 체크 항목을 실행 링크 없이 비활성화하며 툴팁은 정확히 “외근 지시를 받은 노예는 수행할 수 없습니다.”다.
펠라 자명종·예의 강요·절정 금지·자위 금지·바기나 비즈·도구 사용6개 설정은 유지한다. 장비를 자동으로 벗기거나 배경·능력치·다른 규칙을 바꾸지 않는다. 외근을 해제하면9개 규칙은 다시 선택 가능하지만 해제된 체크를 자동 복원하지는 않는다.

## 원본과 죄책감

확인한2.3.2.5한국어자료는 G:/somi/JO9O/Jack O Nine Tails v2.3 Kor_nosex.zip 안 game/jack.qsp, SHA256070dad711ec21038684c713e7e4999bd913741aa953be4d16ebf123ffccf77dc다. 두 규칙과 죄책감 부여는 일반 노예 전용이었다. 이번 반영은 현재 개인실 UI의 설정을 실제 처리에 연결하는 지원 확장이다.
사용자 최종 범위에 따라 조수 동작과 기존 일반 노예 전용 죄책감 helper는 유지했다. 기존 sin 상태를 참조하는 규칙 거부 판정/변화는 원래 조건을 사용한다. 이번 작업으로 다른 역할의 죄책감 시스템 전체를 확장하지 않았다.

## 확인

- 수정 전 개인실 효과 누락 RED와 외근 설정/일일 정리/UI RED3개를 확인했다.
- 실제 엔진: 개인실69조건/1512검사, 외근 설정40·일일20·UI50조건/1721검사, 두 기능을 합친 외근→휴식 전환19검사 통과. 해당 조건은 원래 일반 노예 본문과 비교하며 외부 수락 결과·성장/죄책감 helper 일부는 진단용으로 통제했다.
- 기상과의 중첩, 수락/거부/강제·도구 없음, 성향에 따른 무드 유무, 무드 목록 생성, 비활동 상태, 규칙 해제 후 오래된 문구 제거,4방 동시 처리, 일반 노예·조수 값과 기본 규칙 개수 보존을 확인했다.
- 최종 통합본의3개 본문이 각각 검증된 본문과 동일함을 대조했다. 공식 apply_mods DryRun 재생/재적용, 구조·CRLF·주석 경계·왕복·역적용·무관 본문 보존도 통과했다.
- 실제 개인 세이브 UI 전체 하루 진행과 툴팁 육안은 확인하지 않았다. 전체9경로는 이번 국소 수정 때문에 반복하지 않았다.

## 입력·출력·유지보수

next_day의 PRIVATE_SANITARY_RULES_20261116 블록은 기존 room1~4 상태·규칙·역할별 카운터·업무를 읽어 기존 인물 배열과 rate 배열, 설명·무드키를 갱신한다. 기존 기상 효과 뒤, 휴식 처리 전에 실행한다. 기존 do_for_each_slave_in_list, 수락/거부·경험치·출신 성장 helper와 일반 newloc의 기분 갱신에 의존한다. 기분을 next_day 중간에 다시 계산하지 않아 기존 하루 계산 순서를 유지한다.
jo9_room_duty의 set/daily가 외근 충돌을 정리하고 slave_stat의 개인실 전용 분기가 UI를 잠근다. 이3위치를 함께 유지한다. 효과 블록만 제거하면 개인실의 체크만 남는 원래 문제가 돌아오고, UI만 제거하면 작동하지 않을 외근 규칙을 다시 선택할 수 있다.
새 QSP 위치·영구 필드·세이브 마이그레이션은 없다. 정규 게임을 재실행하고 기존 저장을 불러온 뒤 하루 처리를 하면 적용된다. 사용자 확인은 개인실 휴식/내근에서 하루 뒤 무드, 외근에서9개 툴팁, 허용6개 선택 유지의3가지다.

## 파일과 복구

WORK ${p.before_sha256} → ${p.after_sha256}. WORK·추적 QSP·소스 원장 일치.
변경은 next_day·jo9_room_duty·slave_stat의13개 선언형 edit다. patch.json의 old/new로 정확 역적용을 확인해 중복된 대형 QSP 백업을 만들지 않았다. 후속 수동 편집이 있으면 전체 구버전을 덮지 말고 해당 edit만 역검토한다.
QSP 외 CSS/JSON/음원/개인 저장/Full/기존 배포 ZIP은 바꾸지 않았다. 커밋·푸시·재패킹 없음.
`;
fs.writeFileSync(D+'/REPORT_KO.md',report);fs.writeFileSync(H+'/REPORT_KO.md',report);
const index=R+'/docs/SESSION_HANDOFF_INDEX.md';let text=fs.readFileSync(index,'utf8');a(!text.includes('PRIVATE_ROOM_DAILY_RULES_20261116'));
text+='\n\n### 2026-11-16 개인실 규칙·외근 제한 (PRIVATE_ROOM_DAILY_RULES_20261116)\n\n개인실1~4의 소변기/육변기 효과·무드 연결. 외근9규칙 해제/잠금 및 지정 툴팁,6규칙 유지. 조수·2.3죄책감 범위는 유지. 원문 조건/수치 재사용,기상중복방지·무드·외근통합 검사 및 공식재생 통과. WORK/source '+p.after_sha256+'. 새저장필드/기존ZIP/Full/커밋푸시 없음. [기록](../records/private-room-rule-fix-20261116/REPORT_KO.md).\n';fs.writeFileSync(index,text);
a.equal(c.hash(fs.readFileSync(W+'/jack.qsp')),p.after_sha256);a(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp').equals(after));
const result={after:p.after_sha256,rooms:4,externalBlocked:9,externalAllowed:6,nativeChecks:3252,nativeFixtures:5,officialReplay:true,idempotence:true,assistantUnchanged:true,guiltHelperUnchanged:true,newSaveFields:0,releaseZipChanged:false};fs.writeFileSync(D+'/installed.json',JSON.stringify(result,null,2)+'\n');fs.writeFileSync(H+'/installed.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
