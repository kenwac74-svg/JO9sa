'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const repo='G:/somi/JO9sa',root='G:/Codex/tmp/jo9-full-audit-20261023';
const record=repo+'/records/full-side-effect-audit-20261023',work='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const before='5aeff11fffe6e5f2523749987577f42dab870f4d0adee0df385375f9eefb074f';
const after='81201e0eb964124b71fe0862ffca30e589a74d1578d7c140296574b3362760e0';
const id='2026-10-23_slave_nature_mood_order';
const core=require(repo+'/tools/text-workshop/core.cjs');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const json=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
function copy(from,to){fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);if(hash(from)!==hash(to))throw Error('Copy mismatch '+to);}
function pass(p,n){const x=json(p);if(x.length!==n||x.some(v=>!v.pass))throw Error('Native gate not PASS '+p);return x;}
function verify(){
 const r=json('G:/Codex/tmp/jo9-full-audit-release-20261023/run-J4uMMw/report.json');
 if(r.checks.some(v=>v.required&&v.status!=='PASS')||r.checks[0].detail.candidate!==after)throw Error('Official gate not PASS');
 pass(record+'/trait-fixed-regression-results.json',4);pass(record+'/mood-gap-fixed-results.json',8);pass(record+'/generation-fixed-results.json',1);
 const images=pass(path.join(__dirname,'image-green-client-results.json'),12);
 if(json(path.join(__dirname,'static-final.json')).sha256!==after)throw Error('Wrong static source');
 const u=json(record+'/unit-tests.json');if(u.exitCode!==0)throw Error('Unit tests failed');
 const old=core.parse(fs.readFileSync(root+'/snapshot/jack.qsp')),fixed=core.parse(fs.readFileSync(root+'/candidate.qsp'));
 const b=(d,n)=>core.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
 const changed=old.locations.filter(l=>b(old,l.name)!==b(fixed,l.name)).map(l=>l.name);
 if(changed.length!==1||changed[0]!=='jo9_traits')throw Error('Unexpected product change');
 for(const n of ['jo9_seed_role_images','display_pic','display_fullimage'])if(b(old,n)!==b(fixed,n))throw Error('Image test source changed');
 return {r,images,changed};
}
const mode=process.argv[2];
if(mode==='archive'){
 const v=verify();
 // Preserve compact reports and reproducers; exclude duplicate intermediate full inventories.
 for(const f of fs.readdirSync(__dirname)){
  if(!/\.(?:cjs|md|json|log)$/.test(f)||['static-current.json'].includes(f))continue;
  copy(path.join(__dirname,f),record+'/'+(/\.cjs$/.test(f)?'scripts/':'')+f);
 }
 for(const f of ['report.json','report.md'])copy('G:/Codex/tmp/jo9-full-audit-release-20261023/run-J4uMMw/'+f,record+'/release-validation.'+(f.endsWith('json')?'json':'md'));
 // Detailed call inventory is unique; retain once alongside compact final delta.
 copy(path.join(__dirname,'static-current.json'),record+'/static-call-inventory.json');
 for(const dir of ['generation-fixed','traits-fixed'])for(const f of fs.readdirSync(root+'/'+dir))if(f==='prepared.json'||f==='mood-gap-prepared.json'||/-stderr\.log$/.test(f))copy(root+'/'+dir+'/'+f,record+'/'+dir+'/'+f);
 for(const f of fs.readdirSync(root+'/traits'))if(/^gap-.*-stderr\.log$/.test(f))copy(root+'/traits/'+f,record+'/mood-red/'+f);
 copy(root+'/mods/'+id+'.json',repo+'/mods/'+id+'.json');
 const p=json(record+'/input-preservation.json').filter(v=>/\.json$/i.test(v.file));
 const runtimeJson=p.map(v=>{try{json(v.file);return {file:v.file,pass:true};}catch(e){return {file:v.file,pass:false,error:e.message};}});
 write(record+'/runtime-json-syntax.json',{files:runtimeJson.length,failures:runtimeJson.filter(v=>!v.pass)});
 if(runtimeJson.some(v=>!v.pass))throw Error('Runtime JSON malformed');
 write(record+'/source-linkage.json',{before,after,changedLocations:v.changed,imageSourceIdentical:true,imageNativeSourceSha256:json(path.join(__dirname,'image-static-summary.json')).inputSha256,featureProbeSourceSha256:json(root+'/traits-fixed/prepared.json').sourceSha256});
 console.log('PASS audit evidence, source linkage and '+runtimeJson.length+' runtime JSON files archived');
}else if(mode==='guard'){
 verify();if(hash(work)!==before)throw Error('Live WORK changed; rebase required');console.log('PASS pinned live WORK unchanged');
}else if(mode==='record'){
 const v=verify();if(hash(work)!==after)throw Error('Applied QSP mismatch');
 const inputs=json(record+'/input-preservation.json'),preservation=inputs.map(v=>({file:v.file,before:v.sha256,expected:path.resolve(v.file)===path.resolve(work)?after:v.sha256,after:hash(v.file)}));
 write(record+'/input-preservation-after.json',preservation);
 if(preservation.some(v=>v.expected!==v.after))throw Error('Preserved file changed during audit');
 const images=json(path.join(__dirname,'image-static-summary.json')),stat=json(path.join(__dirname,'static-final.json'));
 const report=`# WORK 부작용·문법 전수 점검 — 2026-10-23

최근 구현에서 실제 결함1건을 찾아 WORK에서 수정했다. 최근 특성·이미지 변경으로 새로 생긴 정적 문법 문제는 없었다. 다만 기존 코드의 누락 호출 참조는 남아 있어 게임 전체 무결함 판정은 아니다.

## 발견·수정한 결함

노예근성 영입 초기화가 기존 상태 갱신 전에 기분을 보정했다. 이후 집안 청결·외형·위생 관련 기분 항목이 늦게 추가되어, 원래 요구한 즉시 복종 대신 mood=-1 / obedience=11 / hateful이 되는6사례를 실제 엔진으로 재현했다. 깨끗한 조건2사례는 통과했으며 원래42사례만으로는 이 차이를 놓쳤다.

수정은 jo9_traits의 일회 초기화에서 기존 전체 상태 갱신2회를 앞/뒤로 나눠 배치한 것이다. 현재 상황의 기분 항목을 먼저 구성한 다음 한 번 기분을 보정하고 복종을 계산한다. 초기 broken 캐시가 기분 보정을 막지 않도록 기존 임시 reluctant 상태를 다시 설정한다. 총 호출 횟수는2회 그대로이며 새 로케이션·함수·영구키·매일 강제 복종 보정은 없다.

입력은 기존 init_slave_nature의 대상 배열명이고 반환값 없이 해당 신규 인물의 일회 초기값을 갱신한다. 플래그=1, initialized=0 가드와 자아/태도 제한은 그대로다. 기존 인물과 이미 초기화한 인물을 재훈련하지 않는다. 이후 플레이의 기분/관계 변화는 기존 규칙을 따른다.

의존성은 기존 $newloc_update_slave, $recalc_slave_mood, $slave_price와 영입 훅이다. 시작 표식 SLAVE_NATURE_INITIAL_MOOD_ORDER_20261023 및 SLAVE_NATURE_FINAL_REFRESH_20261023, 패치 ${id}로 찾는다. 앞 갱신만 빼면 현재 상황을 반영하기 전에 기분을 보정하는 결함이 돌아오고, 마지막 갱신을 빼면 최종 표시 상태가 늦게 반영될 수 있다. 전체 jo9_traits나 기존 영입 훅을 지워 복구하면 다른 특성까지 손상될 수 있다.

수정 후 stock/expert 2영입 경로×깨끗함/지저분한 집/외형 문제/낮은 위생8사례가 모두 통과했다. 영입 직후와 추가 상태 갱신2회 뒤까지 확인했다. 기존 영입/보존/UI42사례, 확률/제한3,601회 및 공식 기본 실행9경로도 최종 후보로 통과했다.

## 전체 파일과 호출 검사

- 최종 QSP263개 로케이션, ${stat.coverage.physicalLines.toLocaleString('en-US')}개 물리 줄. 바이트 왕복·줄/주석 경계·로케이션 중복·따옴표/중괄호 묶음 검사 통과. 기본 행동 본문은0개다.
- 직접 호출5,240곳, 동적 호출41곳, 직접 JUMP206곳, 이벤트 콜백 대입7곳을 조사했다. JUMP/콜백 대상 누락0, 이번 수정의 새 정적 경고0.
- 기존 블록 경고14곳·여분 괄호 경고1곳은 두 이전 기준본과 같았다. 설치 엔진의 대조군 검사를 통해 여분 END·중복 ELSE·여분 ] 대입 등이 실제 허용되는 것을 확인했으므로 이를 확정 문법 오류로 집계하지 않았다. 결과는 STATIC_AUDIT.md와 native-static-results.json에 있다.
- 런타임 JSON은 runtime-json-syntax.json의 전체 파일 파싱 통과. 인물 JSON1,126개 숫자 중복·내부ID 불일치0.
- 검사기/상태 편집기 자동 시험106개 중105개 통과, 실패0,1개는 특정 과거 기능의 비교 기준본 환경변수가 없어 명시적으로 생략됐다. 이를106개 전부 통과로 표현하지 않는다.

## 이미지 부작용 검사

- 인물 JSON1,126개 전부, 그림 등록 필드74개, 인디 제목 팩52개, 비어 있지 않은 기본/역할 별칭2,789개를 조사했다. 현재 데이터 내 같은 ID의 별칭 충돌0. 서로 다른 ID가 공유한 구 경로144종은 ID별로 구분한다.
- 조회 함수 호출42줄/실제 식43개와 정리용 호출2곳을 전부 목록화했다. 이번 보정으로 바뀌는 등록 별칭108개에서 선택되는 이미지 누락0.
- 실제 조회63,567회(기본/역할/팩 누락/사용자 지정/빈 경로/명시 역할/도나96경로/등록 순서/반복 조회), 실제 소비처 문장124회, display_pic40회, display_fullimage52회를 포함한12개 검사 묶음이 통과했다. 전역 그림 배열74개 및 인물 배열13개의 읽기 전후 보존도 검사했다.
- 이 이미지 검사의 입력 QSP는 ${before}이며 최종 후보와 그림 함수3개가 동일한 것을 별도로 확인했다. 최종 변경은 jo9_traits 하나이므로 다른 코드로 검사한 결과를 적용한 것이 아니다.
- 구 랜덤 이사벨라2323과 새2571은 자기 ID의 팩을 쓴다. 다른 사용자 지정 경로·빈 경로는 유지한다. 등록 별칭과 정확히 같은 사용자 경로는 구 기본값과 구분할 수 없으므로 같은 등록 팩 우선순위가 적용된다. 실제 저장 복원 후 등록 데이터가 없는 시점에는 기존 캐시를 유지하며 정상 등록 이후 새 경로를 읽는다.

## 기존 코드에서 남은 위험 — 자동 수리하지 않음

현재 QSP 안에서 해소되지 않는 직접 호출 참조79곳/56대상이 있다. 모두 이번 특성·이미지 변경 전에도 존재했다. 2곳은 선택적 외부 jack_custom.qsp 의존이며 나머지도 모두 독립 버그라고 단정할 수 없다. 함수 호출79곳이라는 뜻이지 확정 버그79개라는 뜻이 아니다.

대부분은 기존 그림 선택기 계열이고, 그 밖의 개인실/일부 모드 참조가 있다. picture_selector_doublehousework의 직접 호출 진단은 누락 대상 대조군과 같이 완료되지 않았다. 실제 플레이에서 어떤 조건으로 그 분기를 밟는지와 대체 설계는 별도 확인이 필요하다. 이번 검사 요청만으로 구형 그림 선택기나 보류 콘텐츠를 새로 구현하지 않았다. 상세 위치·종류는 static-call-inventory.json, static-summary.json 및 STATIC_AUDIT.md에 보존했다.

## 검증의 범위와 결과 보존

전체 파일의 정적 검사는 완료했지만 QSP는 동적 문자열/저장된 콜백을 실행한다. 모든 저장 UI·모든 사건 조합·모든 그림 픽셀·모든 전투 승패를 완전 탐색한 것은 아니다. 동적 코드까지 포함한 게임 전체 무버그/완전 문법 증명으로 표현하지 않는다.

초기 확장 그림 검사에서 검사장치의 FOR 콜론 누락으로 시간초과가 났다. 제품 코드는 바꾸지 않고 검사기를 고친 뒤 기존본에서 예상 실패 CASE_0_ID_2571을 재현하고12묶음 통과를 확인했다. 정적 진단 계획의 최초 마커 형식 문제도 검사장치 오류로 구분했다. 실패를 통과로 바꾸거나 검사 항목을 줄여 해결하지 않았다.

WORK QSP만 수정했다. 입력으로 잡은 세이브·인물JSON·CSS·Full QSP는 해시 보존했다. Full/배포ZIP/커밋/푸시 변경 없음. 다음 패치 작업묶음에 이 초기화 순서 수리와 남은 위험을 기록했다.

- 이전 WORK SHA256: ${before}
- 적용 WORK SHA256: ${after}
- 복구본: G:/somi/JO9_work_backups/full_side_effect_audit_20261023/before.qsp
- 재현 패치: mods/${id}.json
- 기존 초기화 설명: ../disposition-traits-20261023/MANUAL_KO.md
- 재생성 가능한 진단 QSP·복제 JSON·사본은 보고서/스크립트 보관 후 정리한다.
`;
 fs.writeFileSync(record+'/REPORT_KO.md',report);
 const bundle=repo+'/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md',heading='## WORK 수정 완료 — 노예근성 초기 기분 보정 순서 (SLAVE_NATURE_MOOD_ORDER_20261023)';
 const text=fs.readFileSync(bundle,'utf8');if(!text.includes(heading))fs.writeFileSync(bundle,text+'\n\n'+heading+'\n\n- 전수 점검 중 영입 후 현재 상황의 기분 항목이 늦게 반영돼 즉시 복종 대신 적대적으로 판정되던6사례를 발견하고 상태 갱신 순서를 수정했다. 기존 전체 갱신2회·확률·자아/태도 조건·일회 가드 유지.\n- 수정 후 환경8/기존42/생성3,601회/공식9경로 통과. 그림 전체 인물·조회63,567회 검사도 통과. 전체 QSP 정적 검사에서 새 경고0; 기존 누락 호출 참조는 별도 수리 검토 대상으로 기록.\n- WORK만 적용 완료·미배포. 세이브·JSON·CSS·Full·ZIP·커밋·푸시 보존. [전체 점검 및 한계](../records/full-side-effect-audit-20261023/REPORT_KO.md), [최종결과](../records/full-side-effect-audit-20261023/FINAL_RESULT.json).\n');
 write(record+'/FINAL_RESULT.json',{id,recordedAt:new Date().toISOString(),status:'APPLIED_WORK_ONLY_AUDIT_WITH_LEGACY_WARNINGS',work,beforeSha256:before,afterSha256:after,changedLocations:v.changed,confirmedIntroducedDefectsRepaired:1,newLocations:0,newPersistentKeys:0,moodBoundaryCases:8,existingTraitCases:42,generationCalls:3601,officialClientPaths:9,imageResolverCalls:63567,imageBatches:12,wholeQspStatic:{locations:263,physicalLines:stat.coverage.physicalLines,newFindings:0,legacyUnresolvedCallSites:79,legacyUnresolvedTargets:56},unit:{pass:105,fail:0,skip:1},preservedFiles:preservation.length,limits:v.r.limits});
 console.log('PASS final WORK exact; preserved inputs unchanged; audit and next-patch report recorded');
}else throw Error('Use archive, guard or record');
