'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),cp=require('child_process'),a=require('assert/strict');
const {R,G,D,T,c,qa,rd,wr,body,put}=require('./artemia-r03c.cjs');
const p=rd(D+'/plan.json'),proof=rd(D+'/native-green-report.json'),mod=rd(p.modFile),raw=fs.readFileSync(G+'/jack.qsp'),out=fs.readFileSync(T+'/candidate.qsp');
a.equal(c.hash(raw),p.before);a(raw.equals(z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz'))));a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));a.equal(c.hash(out),p.after);a(out.equals(fs.readFileSync(T+'/replay.qsp')));a.equal(proof.sourceHash,p.after);a.equal(proof.passed,true);a.equal(proof.assertions,43);a.equal(proof.results.length,2);a(proof.results.every(x=>x.pass));a(fs.readFileSync(D+'/official-idempotence.log','utf8').includes('모든 edit가 이미 적용'));
const redCases=rd(D+'/cases-red.json'),greenCases=rd(D+'/cases-green.json');a.equal(greenCases.length,14);for(let i=0;i<greenCases.length;i++){a.equal(greenCases[i].price,redCases[i].price,greenCases[i].label);a(greenCases[i].price>0);a.equal(greenCases[i].rating,redCases[i].rating,greenCases[i].label);a.equal(greenCases[i].actualResult,greenCases[i].want,greenCases[i].label);}qa.inspectWorld(out);a(c.serialize(c.parse(out)).equals(out));
const inverse=c.parse(out);for(const e of [...mod.edits].reverse()){const s=body(inverse,e.location);a.equal(s.split(e.new).length-1,1);put(inverse,e.location,s.replace(e.new,()=>e.old));}a(c.serialize(inverse).equals(raw));
const before=c.parse(raw),next=c.parse(out);a.equal(before.locations.length,next.locations.length);for(const l of before.locations)if(!p.changedLocations.includes(l.name))a.equal(body(before,l.name),body(next,l.name),l.name);
const metaPath=R+'/assets/runtime-source-2.4.1.json',meta=rd(metaPath);a.equal(meta.sourceQspSha256,p.before);a(fs.readFileSync(metaPath).equals(z.gunzipSync(fs.readFileSync(D+'/manifest.before.json.gz'))));
const filesBefore=new Set(fs.readdirSync(G));fs.writeFileSync(D+'/work-apply.log',cp.execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/apply_mods.ps1','-Qsp',G+'/jack.qsp','-ModsDir',T+'/mods'],{encoding:'utf8'}));a(fs.readFileSync(G+'/jack.qsp').equals(out));
fs.writeFileSync(R+'/assets/runtime/2.4.1/jack.qsp',out);fs.copyFileSync(p.modFile,R+'/mods/'+p.id+'.json');meta.sourceQspSha256=p.after;meta.snapshotDate='2026-11-13';const row=meta.files.find(x=>x.runtimePath==='jack.qsp');a(row);row.sha256=p.after;row.bytes=out.length;meta.latestReleaseR03c={date:'2026-11-13',mod:p.id,report:'records/release-r03c-artemia-trait-20261113/REPORT_KO.md'};wr(metaPath,meta);
const duplicateBackups=[];for(const f of fs.readdirSync(G))if(!filesBefore.has(f)&&/^jack\.qsp\.bak_\d{8}_\d{6}$/.test(f)){const full=G+'/'+f;a(z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz')).equals(fs.readFileSync(full)));fs.unlinkSync(full);duplicateBackups.push(f);}
fs.writeFileSync(D+'/REPORT_KO.md',`# R03-3 아르테미아 특성 요구 연결

2026-11-13 사용자 승인대로 WORK·추적 QSP·runtime 원장에 반영했다.

## 결과와 변경 범위

아르테미아가 요구하는 nymphomania 최저값1을 실제 납품 검사에 연결했다. 색정광(1)·정액 중독(2 이상)은 허용하고, 특성 없음(0)·음수 단계는 거절한다. 발견 전후는 동일하게 판정한다. 인물에게 특성을 새로 부여하거나 발견 상태를 바꾸지 않는다.

기존 slave_sell_chek의 외모 검사 직후에 요구가 양수일 때만 보유값을 비교하는 블록을 추가했다. 기준 미달이면 기존 거절 상태 sl_txt=100과 사유를 반환하고 buyer_interested=0을 유지한다. 사유는 “나는 색정광이나 정액 중독 특성을 가진 노예를 원한다.”이다. 이 요구가 없는 고객은 이 검사를 통과해 원래 경로를 계속 실행한다. 현재 요구를 정의한 고객은 아르테미아다.

입력은 기존 demand['nymphomania']와 slave['nymphomania']이며, 기존 납품 흐름에서 호출된다. 해당 요구 콜백은 이미 저장되므로 새 $ongload 보정은 필요하지 않다. 게임을 완전히 재시작해 새 QSP를 읽으면 기존 저장도 새 납품 함수를 사용한다. 새 영구 필드·로케이션·마이그레이션 버전은 추가하지 않았다. 이미 완료한 납품·보상을 취소하거나 인물·재산·진행을 바꾸지 않는다.

가격·평가등급8·외모5·기술4/5 조건과 모든 NPC 요구 정의는 유지했다. 정확한 mod 편집1개·기존 본문1개만 변경했다. 제거할 때는 이 mod의 추가 블록만 역검토한다. 이후 다른 수정이 있으면 전체 옛 QSP로 덮어쓰지 않는다. baseline.qsp.gz·manifest.before.json.gz는 수정 직전 복구 자료다.

## 검증

- 실제 성인 합성 인물과 현재 #npc_base·$slave_price·slave_sell_chek를 사용했다. 납품/가격 함수를 대역으로 바꾸지 않았다.
- 변경 전에는 특성 -1/0이 발견0/2 양쪽에서 허용되는 결함4건을 재현했다. 나머지 기존 판정은 통과했다.
- 변경 후 실제 엔진2그룹43개 검사 통과. 8개 특성/발견 조합과 6개 회귀 사례를 확인했다.
- 외모4 거절, 음악3·구강4 거절, 승인된 기술 최저값 전부 충족 시 허용을 유지했다. 요구 없는 실제 고객 아주라에서는 특성 없음·음수도 원래대로 허용했다.
- 14개 사례 모두 변경 전후 가격과 종합등급 계산 결과가 일치했다. 인물의 특성·발견값·이름·식별자 및 소지금·보관 물품·진행이 보존됐다.
- 공식 적용기로 재생·재적용 무변경, 구조·CRLF·마커 경계·바이트 왕복과 역적용 복원을 통과했다. 대상 외309개 본문을 보존했다. WORK 적용 후 추적본·원장과 동일 해시를 확인했다.

개인 SAV의 실제 불러오기·CRC·화면과 2.4.2 전체 출고 검사는 별도다. 이번 결과는 R03-3 검사 완료이며 R03 전체 또는 배포 완료를 뜻하지 않는다.

일반 EXE 확인: 완전 재시작 → 기존 저장 불러오기 → 아르테미아 납품을 새로 연다. 다른 요구를 충족한 인물로 특성 없음 거절과 색정광·정액 중독 허용을 확인한다.

${p.before} → ${p.after}. Full 폴더·음원·JSON·이미지·커밋·푸시는 변경하지 않았다. 이번 진단 사본과 중복 스크립트는 정리하고 보고서·재현 스크립트·최소 복구 자료를 남긴다.
`);
const P=R+'/records/release-prep-20261113',O=R+'/docs/release-prep/2026-11-13',sp=P+'/checklist.json',state=rd(sp),item=state.items.find(x=>x.id==='R03');a(!item.subtasks.some(x=>x.id==='R03-3'));item.status='부분 완료';item.result='R03-1·R03-2·R03-3 완료, R03 전체는 미완료';item.notes='아르테미아 외모5·기술4/5·특성최저1 검사 연결 완료. R03-3 실제 엔진43검사. 다음 레시 조건 비교식 검토.';item.subtasks.push({id:'R03-3',status:'완료',decision:'기존 최저1 이상으로 색정광·정액 중독 모두 허용',checks:43,report:D+'/REPORT_KO.md'});item.proposal='records/release-r03c-artemia-trait-20261113/REPORT_KO.md';state.sourceQspSha256=p.after;state.history.push({date:'2026-11-13',item:'R03-3',result:'실제 특성 요구1이상 연결·엔진43검사',after:p.after,next:'R03-4'});wr(sp,state);
const main=O+'/RELEASE_NOTES_CHECKLIST_KO.md';let m=fs.readFileSync(main,'utf8');a(m.includes('현재 입력은 WORK QSP `'+p.before+'`'));m=m.replace('현재 입력은 WORK QSP `'+p.before+'`','현재 입력은 WORK QSP `'+p.after+'`').replace('**현재 순서: R01·R02·R03-1·R03-2 완료 → R03-3 아르테미아 특성 요구 확인.**','**현재 순서: R01·R02·R03-1·R03-2·R03-3 완료 → R03-4 레시 의뢰 조건 검토.**');m=m.replace(/^\| \[ \] R03 \|.*$/m,'| [ ] R03 | 부분 완료 | 의뢰·선호 설정 비교식 | 아르테미아 외모5·기술4/5·특성최저1 검사 연결 완료(24·120·43검사). 나머지 조건은 별도 검토. | R03 전체 완료 아님 |');m+='\n## R03-3 후속 반영\n\n아르테미아의 특성 요구를 실제 납품검사에 연결했다. 색정광·정액 중독은 허용하고 특성 없음·음수는 거절한다. 발견 여부는 추가 조건으로 삼지 않는다. 실제 엔진43검사와14사례 가격/평가 보존 확인, 공식 재생/멱등/역검증 통과. [상세 기록](<'+D+'/REPORT_KO.md>). 앞선 R03-3 확인 요청은 완료됐으며 다음은 레시 조건 조사다.\n';fs.writeFileSync(main,m);
const ledger=O+'/CHANGE_LEDGER_KO.md';fs.writeFileSync(ledger,fs.readFileSync(ledger,'utf8')+'\n## 빌드 준비 중 승인 후속 R03-3 — 아르테미아 특성 요구\n\n2026-11-13. 사용자 승인대로 내부 최저1 요구를 실제 납품에 연결해 색정광·정액 중독을 모두 허용한다. 발견 상태는 조건으로 추가하지 않았다. 실제 엔진43검사,14사례 가격/평가 보존 및 공식 재생/멱등/역검증 통과. [상세](<'+D+'/REPORT_KO.md>).\n');
const release=rd(P+'/release-data.json');release.sourceQspSha256=p.after;a(!release.approvedFollowups.some(x=>x.id==='R03-3'));release.approvedFollowups.push({id:'R03-3',date:'2026-11-13',title:'아르테미아 특성최저1 실제검사 연결',mod:p.id,before:p.before,after:p.after,edits:1,nativeChecks:43,report:D+'/REPORT_KO.md'});wr(P+'/release-data.json',release);const dv=rd(P+'/document-verification.json');dv.sourceQspSha256=p.after;dv.approvedFollowupRecords=release.approvedFollowups.length;dv.latestFollowup={item:'R03-3',nativeAssertions:43,report:D+'/REPORT_KO.md'};wr(P+'/document-verification.json',dv);
const audit=P+'/AUDIT_KO.md';fs.writeFileSync(audit,fs.readFileSync(audit,'utf8')+'\n## R03-3 완료 후 갱신\n\n아르테미아의 기존 특성최저1 요구를 실제 납품에 연결했다. 색정광/정액 중독 허용, 발견 여부는 미요구. 실제 엔진43검사·14사례 가격/평가 보존. 현재 WORK `'+p.after+'`. R03 나머지는 별도 검토한다. [기록](<'+D+'/REPORT_KO.md>).\n');
const oldReview=P+'/R03C_ARTEMIA_TRAIT_REVIEW_KO.md';fs.writeFileSync(oldReview,'> 2026-11-13 갱신: 사용자가 최저1 이상 허용안을 승인했고 반영을 완료했다. 아래는 승인 전 검토 원문이다. [적용·검증](<'+D+'/REPORT_KO.md>).\n\n'+fs.readFileSync(oldReview,'utf8'));
const idx=R+'/docs/SESSION_HANDOFF_INDEX.md';fs.writeFileSync(idx,'## 2026-11-13 Codex: 2.4.2 준비 R03-3 아르테미아 특성 요구 연결\n\n[변경·실제 납품 검사](../records/release-r03c-artemia-trait-20261113/REPORT_KO.md). 최저1로 색정광·정액 중독 모두 허용. 발견 여부는 미요구. 실제 엔진2그룹43검사·14사례 가격/평가 보존, 공식 재생/멱등/역검증·구조 통과. WORK/소스/원장4f2b7a9d 일치. R03-3 완료, 다음 레시 의뢰 검토. 개인 SAV/Full/음원/커밋푸시 변경 없음.\n\n'+fs.readFileSync(idx,'utf8'));
for(const f of ['artemia-r03c.cjs','artemia-r03c-build.cjs','artemia-r03c-native.cjs','artemia-r03c-finish.cjs'])fs.copyFileSync(f,D+'/'+f);
if(fs.existsSync(T)){const resolved=fs.realpathSync(T);a.equal(path.dirname(resolved).toLowerCase(),fs.realpathSync('G:/Codex/tmp').toLowerCase());a.equal(path.basename(resolved),'release-r03c-artemia-trait-20261113');function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const x=path.join(dir,e.name);a(!fs.lstatSync(x).isSymbolicLink(),x);if(e.isDirectory())scan(x);}}scan(resolved);fs.rmSync(resolved,{recursive:true});}
a.equal(c.hash(fs.readFileSync(G+'/jack.qsp')),p.after);a.equal(c.hash(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')),p.after);a.equal(rd(metaPath).sourceQspSha256,p.after);
wr(D+'/verification.json',{status:'PASS',scope:'R03-3 targeted runtime and patch checks; not full-release PASS',before:p.before,after:p.after,native:proof,priceAndRatingUnchangedCases:14,replay:true,idempotence:true,inverse:true,structure:true,unchangedLocations:309,newSaveFields:0,newLocations:0,newLoadCallback:false,personalSaveReadOrWritten:false,guiTested:false,fullReleaseValidation:false,workSourceManifest:true,taskTempRemoved:!fs.existsSync(T),duplicateWorkBackupsRemoved:duplicateBackups});console.log(JSON.stringify({installed:true,after:p.after,nativeChecks:43,priceUnchangedCases:14,temporaryCopiesRemoved:!fs.existsSync(T)}));
