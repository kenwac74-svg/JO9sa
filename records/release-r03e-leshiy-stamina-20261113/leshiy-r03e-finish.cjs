'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),cp=require('child_process'),a=require('assert/strict');
const {R,G,D,T,c,qa,rd,wr,body,put}=require('./leshiy-r03e.cjs');
const p=rd(D+'/plan.json'),proof=rd(D+'/native-green-report.json'),mod=rd(p.modFile),raw=fs.readFileSync(G+'/jack.qsp'),out=fs.readFileSync(T+'/candidate.qsp');
a.equal(c.hash(raw),p.before);a(raw.equals(z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz'))));a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));a.equal(c.hash(out),p.after);a(out.equals(fs.readFileSync(T+'/replay.qsp')));a.equal(proof.sourceHash,p.after);a.equal(proof.passed,true);a.equal(proof.assertions,33);a.equal(proof.results.length,2);a(proof.results.every(x=>x.pass));a(fs.readFileSync(D+'/official-idempotence.log','utf8').includes('모든 edit가 이미 적용'));a.equal(rd(D+'/candidate-correction.json').reconstructedInitialHashMatches,true);
const redCases=rd(D+'/cases-red.json'),greenCases=rd(D+'/cases-green.json');a.equal(greenCases.length,8);for(let i=0;i<greenCases.length;i++){a.equal(greenCases[i].price,redCases[i].price,greenCases[i].label);a(greenCases[i].price>0);a.equal(greenCases[i].rating,redCases[i].rating,greenCases[i].label);a.equal(greenCases[i].actualResult,greenCases[i].want,greenCases[i].label);}qa.inspectWorld(out);a(c.serialize(c.parse(out)).equals(out));
const inverse=c.parse(out);for(const e of [...mod.edits].reverse()){const s=body(inverse,e.location);a.equal(s.split(e.new).length-1,1);put(inverse,e.location,s.replace(e.new,()=>e.old));}a(c.serialize(inverse).equals(raw));const before=c.parse(raw),next=c.parse(out);a.equal(before.locations.length,next.locations.length);for(const l of before.locations)if(!p.changedLocations.includes(l.name))a.equal(body(before,l.name),body(next,l.name),l.name);
const metaPath=R+'/assets/runtime-source-2.4.1.json',meta=rd(metaPath);a.equal(meta.sourceQspSha256,p.before);a(fs.readFileSync(metaPath).equals(z.gunzipSync(fs.readFileSync(D+'/manifest.before.json.gz'))));const filesBefore=new Set(fs.readdirSync(G));
fs.writeFileSync(D+'/work-apply.log',cp.execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/apply_mods.ps1','-Qsp',G+'/jack.qsp','-ModsDir',T+'/mods'],{encoding:'utf8'}));a(fs.readFileSync(G+'/jack.qsp').equals(out));fs.writeFileSync(R+'/assets/runtime/2.4.1/jack.qsp',out);fs.copyFileSync(p.modFile,R+'/mods/'+p.id+'.json');meta.sourceQspSha256=p.after;meta.snapshotDate='2026-11-13';const row=meta.files.find(x=>x.runtimePath==='jack.qsp');a(row);row.sha256=p.after;row.bytes=out.length;meta.latestReleaseR03e={date:'2026-11-13',mod:p.id,report:'records/release-r03e-leshiy-stamina-20261113/REPORT_KO.md'};wr(metaPath,meta);
const duplicateBackups=[];for(const f of fs.readdirSync(G))if(!filesBefore.has(f)&&/^jack\.qsp\.bak_\d{8}_\d{6}$/.test(f)){const full=G+'/'+f;a(z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz')).equals(fs.readFileSync(full)));fs.unlinkSync(full);duplicateBackups.push(f);}
fs.writeFileSync(D+'/REPORT_KO.md',`# R03-5 레시 체력 최저4

2026-11-13 사용자 승인대로 WORK·추적 QSP·runtime 원장에 반영했다.

## 바뀐 동작

레시 납품은 체력3을 거절하고4 이상을 허용한다. 다른 고객의 기존 조건은 유지한다. 기존 레시 요구의 demand['min_stamina'] > 3는 값을 저장하지 않는 비교식이므로 =4로 고쳤다. 공통 건강검사 직후 레시일 때만 해당 최저값을 읽고,미달이면 기존 건강 거절 sl_txt=104·buyer_interested=0으로 끝낸다. 새로운 거절 대사는 추가하지 않았다.

실제 도시 경로의 $npc_id='Leshiy'와 정의의 소문자 식별자를 모두 처리하도록 비교할 때만 소문자로 읽는다. 캐릭터/식별자 이름을 변경하지 않는다. 기존 감수성 상한3·기술·평가·가격·체력 수치 자체와 인물/재산/퀘스트는 바꾸지 않는다. 다른 고객의 min_stamina를 일괄 활성화하는 변경은 이번 승인 범위가 아니며 반영하지 않았다.

기존 저장에는 요구 콜백이 남으므로 $ongload에서 레시 콜백의 알려진 옛 >3 표현만 =4로 치환한다. 사용자 메모·다른 고객·별도로 편집한 최저값은 보존한다. 완료 거래나 보상을 소급 취소하지 않는다. 새 인물별 영구 필드·수정 버전·로케이션은 추가하지 않았다.

수정은 현재 초기화가 쓰는 #npc_base·slave_sell_chek·$ongload 세 본문에 각각 정확 편집1개다. 과거의 미호출 #npc_base_woman은 변경하지 않았다.

## 검증과 수정 후보 이력

- 실제 성인 합성 인물과 현재 초기화/가격/납품 함수를 사용했다. 가격·납품 함수를 대역으로 바꾸지 않았다.
- 변경 전 체력3이 통과하고 옛 요구의 최저값이 저장되지 않는 결함을 재현했다.
- 최종 후보는 실제 엔진2그룹33개 검사 통과: 납품 경계24,저장 요구9.
- 체력3/4 경계와 대소문자 식별자,감수성4 및 간호3 거절,다른 고객 두 곳의 기존 허용을 확인했다. 고객별 체력4 정의가 있는 조프르에게 체력3을 납품하는 기존 동작도 유지했다.
- 실제 $ongload 두 번 뒤에도3 거절·4 허용을 유지하고 사용자 메모·다른 콜백·별도 최저3을 보존했다.
- 경계8사례의 가격·평가 계산 결과가 변경 전후 동일하고 인물의 체력·감수성·이름·식별자 및 재산·진행을 보존했다.
- 첫 수정 후보의 새 주석에 짝이 없는 작은따옴표를 넣어 엔진이 후속 판정을 실행하지 않는 문제가 있었다. WORK에 반영하기 전 검사에서 발견했다. 해당 주석 한 줄만 고친 후보가33검사를 통과했으며,나머지 제품 코드가 같다는 점도 최초 후보 해시 재구성으로 확인했다. 초기 실패·재현 스크립트·차이는 initial-candidate-*와 candidate-correction.json에 보존했다. 실패 후보는 WORK에 적용하지 않았다.
- 공식 적용기 재생·재적용 무변경,구조·CRLF·마커·바이트 왕복·역적용 복원과 대상 외307본문 보존을 통과했다. WORK 적용 후 추적본·원장 동일 해시를 확인했다.

개인 SAV의 실제 불러오기·CRC·화면과 2.4.2 전체 출고 검사는 별도다. 이번 결과는 R03-5 완료이며 R03 전체나 배포 완료를 뜻하지 않는다.

일반 EXE 확인: 완전 재시작 → 기존 저장 불러오기 → 레시 납품을 새로 연다. 나머지 요구를 충족한 인물로 체력3 거절·4 허용,감수성4 거절을 확인한다.

## 유지보수

입력은 기존 고객 요구 문자열·체력값과 고객 식별자이며,반환은 기존 납품 상태다. 현재 #npc_base 초기화·$ongload·일반 납품 경로에 의존한다. 제거할 때는 정의/캐시/검사를 함께 역검토한다. 이후 다른 수정이 있으면 전체 옛 QSP로 덮어쓰지 말고 mod 차이를 검토한다. baseline.qsp.gz·manifest.before.json.gz는 수정 직전 최소 복구 자료다.

${p.before} → ${p.after}. Full·음원·이미지·JSON·커밋·푸시는 변경하지 않았다. 이번 진단 사본과 스크립트 중복은 정리하고 보고서·재현 스크립트·최소 복구 자료를 보존한다.
`);
const P=R+'/records/release-prep-20261113',O=R+'/docs/release-prep/2026-11-13',sp=P+'/checklist.json',state=rd(sp),item=state.items.find(x=>x.id==='R03');a(!item.subtasks.some(x=>x.id==='R03-5'));item.status='부분 완료';item.result='R03-1~5 완료, R03 전체는 미완료';item.notes='아르테미아 요구와 레시 감수성 상한3·체력 최저4 반영 완료. R03-5 실제 엔진33검사. 다른 의뢰/요구는 별도 검토.';item.subtasks.push({id:'R03-5',status:'완료',decision:'다른 고객 유지·레시만 체력4이상',checks:33,report:D+'/REPORT_KO.md'});item.proposal='records/release-r03e-leshiy-stamina-20261113/REPORT_KO.md';state.sourceQspSha256=p.after;state.history.push({date:'2026-11-13',item:'R03-5',result:'레시만 체력4이상·옛요구 갱신·엔진33검사',after:p.after});wr(sp,state);
const main=O+'/RELEASE_NOTES_CHECKLIST_KO.md';let m=fs.readFileSync(main,'utf8');a(m.includes('현재 입력은 WORK QSP `'+p.before+'`'));m=m.replace('현재 입력은 WORK QSP `'+p.before+'`','현재 입력은 WORK QSP `'+p.after+'`').replace('**현재 순서: R01·R02·R03-1~4 완료 → R03-5 레시 체력 조건 확인.**','**현재 순서: R01·R02·R03-1~5 완료 → 레시의 나머지 요구 검토.**');m=m.replace(/^\| \[ \] R03 \|.*$/m,'| [ ] R03 | 부분 완료 | 의뢰·선호 설정 비교식 | 아르테미아 요구와 레시 감수성3이하·체력4이상 반영. R03-5 엔진33검사 통과. | 다른 요구 별도 검토·R03 전체 미완료 |');m=m.replace('## 다음 확인 R03-5','## R03-5 확인 기록 — 완료').replace('레시 체력>3도 저장되지 않으며 현재 일반 납품검사는 고객별 체력 최저값을 읽지 않는다. 다른 고객의 동작을 이번에 일괄 바꾸지 않고 레시만 체력4이상으로 연결하는 안을 확인한다.','레시만 체력4이상 납품 조건을 사용자 승인 후 반영했다. 다른 고객의 동작은 유지했다.').replace('R03E_LESHIY_STAMINA_REVIEW_KO.md>). 아직 적용하지 않았다.','R03E_LESHIY_STAMINA_REVIEW_KO.md>). 검토 원문은 보존한다.');m+='\n## R03-5 후속 반영\n\n레시만 체력4이상 실제 납품 검사와 알려진 옛 요구 캐시를 연결했다. 기존 감수성 상한·다른 고객/기술을 유지했고 실제 엔진33검사·8사례 가격/평가 보존,공식 재생/멱등/역검증을 통과했다. 첫 후보의 주석 오류는 적용 전 발견·수정했고 실패 후보는 WORK에 반영하지 않았다. [상세 기록](<'+D+'/REPORT_KO.md>).\n';fs.writeFileSync(main,m);
const ledger=O+'/CHANGE_LEDGER_KO.md';fs.writeFileSync(ledger,fs.readFileSync(ledger,'utf8')+'\n## 빌드 준비 중 승인 후속 R03-5 — 레시 체력 최저4\n\n2026-11-13. 다른 고객은 유지하고 레시만 체력4이상 검사 및 알려진 옛 요구 캐시 갱신을 연결했다. 실제 엔진33검사·8사례 가격/평가 보존,공식 재생/멱등/역검증 통과. [상세](<'+D+'/REPORT_KO.md>).\n');
const release=rd(P+'/release-data.json');release.sourceQspSha256=p.after;a(!release.approvedFollowups.some(x=>x.id==='R03-5'));release.approvedFollowups.push({id:'R03-5',date:'2026-11-13',title:'레시만 체력최저4',mod:p.id,before:p.before,after:p.after,edits:3,nativeChecks:33,report:D+'/REPORT_KO.md'});wr(P+'/release-data.json',release);const dv=rd(P+'/document-verification.json');dv.sourceQspSha256=p.after;dv.approvedFollowupRecords=release.approvedFollowups.length;dv.latestFollowup={item:'R03-5',nativeAssertions:33,report:D+'/REPORT_KO.md'};wr(P+'/document-verification.json',dv);
const audit=P+'/AUDIT_KO.md';fs.writeFileSync(audit,fs.readFileSync(audit,'utf8')+'\n## R03-5 완료 후 갱신\n\n레시만 체력4이상 검사 및 알려진 옛 요구 캐시를 반영했다. 실제 엔진33검사·8사례 가격/평가 보존. 다른 고객은 유지. 현재 WORK `'+p.after+'`. [기록](<'+D+'/REPORT_KO.md>).\n');const oldReview=P+'/R03E_LESHIY_STAMINA_REVIEW_KO.md';fs.writeFileSync(oldReview,'> 2026-11-13 갱신: 사용자 승인으로 레시만 체력4이상 반영 완료. 아래는 승인 전 검토 원문이다. [적용·검증](<'+D+'/REPORT_KO.md>).\n\n'+fs.readFileSync(oldReview,'utf8'));
const idx=R+'/docs/SESSION_HANDOFF_INDEX.md';fs.writeFileSync(idx,'## 2026-11-13 Codex: 2.4.2 준비 R03-5 레시 체력 최저4\n\n[변경·저장 요구·실제 납품 검증](../records/release-r03e-leshiy-stamina-20261113/REPORT_KO.md). 다른 고객은 유지하고 레시만 체력4이상 사용자 승인 반영. 실제 엔진2그룹33검사·8사례 가격/평가 보존,공식 재생/멱등/역검증·구조 통과. WORK/소스/원장7b4c58fa 일치. 최초 후보 주석 오류는 반영 전 발견·수정. R03-5 완료·나머지 요구 검토. 개인 SAV/Full/음원/커밋푸시 변경 없음.\n\n'+fs.readFileSync(idx,'utf8'));
for(const f of ['leshiy-r03e.cjs','leshiy-r03e-build.cjs','leshiy-r03e-native.cjs','leshiy-r03e-finish.cjs'])fs.copyFileSync(f,D+'/'+f);
if(fs.existsSync(T)){const resolved=fs.realpathSync(T);a.equal(path.dirname(resolved).toLowerCase(),fs.realpathSync('G:/Codex/tmp').toLowerCase());a.equal(path.basename(resolved),'release-r03e-leshiy-stamina-20261113');function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const x=path.join(dir,e.name);a(!fs.lstatSync(x).isSymbolicLink(),x);if(e.isDirectory())scan(x);}}scan(resolved);fs.rmSync(resolved,{recursive:true});}
a.equal(c.hash(fs.readFileSync(G+'/jack.qsp')),p.after);a.equal(c.hash(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')),p.after);a.equal(rd(metaPath).sourceQspSha256,p.after);wr(D+'/verification.json',{status:'PASS',scope:'R03-5 targeted runtime and patch checks; not full-release PASS',before:p.before,after:p.after,native:proof,priceAndRatingUnchangedCases:8,replay:true,idempotence:true,inverse:true,structure:true,unchangedLocations:307,newSaveFields:0,newLocations:0,customerScope:'Leshiy only',initialCandidateRejectedBeforeWork:true,personalSaveReadOrWritten:false,guiTested:false,fullReleaseValidation:false,workSourceManifest:true,taskTempRemoved:!fs.existsSync(T),duplicateWorkBackupsRemoved:duplicateBackups});console.log(JSON.stringify({installed:true,after:p.after,nativeChecks:33,priceUnchangedCases:8,temporaryCopiesRemoved:!fs.existsSync(T)}));
