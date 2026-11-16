'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),cp=require('child_process'),a=require('assert/strict');
const {R,G,D,T,c,qa,rd,wr,body,put}=require('./leshiy-r03f.cjs');
const p=rd(D+'/plan.json'),proof=rd(D+'/native-green-report.json'),mod=rd(p.modFile),raw=fs.readFileSync(G+'/jack.qsp'),out=fs.readFileSync(T+'/candidate.qsp');
a.equal(c.hash(raw),p.before);a(raw.equals(z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz'))));a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));a.equal(c.hash(out),p.after);a(out.equals(fs.readFileSync(T+'/replay.qsp')));a.equal(proof.sourceHash,p.after);a.equal(proof.passed,true);a.equal(proof.assertions,31);a.equal(proof.results.length,2);a(proof.results.every(x=>x.pass));a(fs.readFileSync(D+'/official-idempotence.log','utf8').includes('모든 edit가 이미 적용'));
const redCases=rd(D+'/cases-red.json'),greenCases=rd(D+'/cases-green.json');a.equal(greenCases.length,8);for(let i=0;i<greenCases.length;i++){const v=greenCases[i];a.equal(v.price,redCases[i].price,v.label);a(v.price>0);a.equal(v.rating,redCases[i].rating,v.label);if(v.want==='accept')a([1,2].includes(v.actualResult),v.label);else a.equal(v.actualResult,v.want,v.label);}qa.inspectWorld(out);a(c.serialize(c.parse(out)).equals(out));
const inverse=c.parse(out);for(const e of [...mod.edits].reverse()){const s=body(inverse,e.location);a.equal(s.split(e.new).length-1,1);put(inverse,e.location,s.replace(e.new,()=>e.old));}a(c.serialize(inverse).equals(raw));const before=c.parse(raw),next=c.parse(out);a.equal(before.locations.length,next.locations.length);for(const l of before.locations)if(!p.changedLocations.includes(l.name))a.equal(body(before,l.name),body(next,l.name),l.name);
const metaPath=R+'/assets/runtime-source-2.4.1.json',meta=rd(metaPath);a.equal(meta.sourceQspSha256,p.before);a(fs.readFileSync(metaPath).equals(z.gunzipSync(fs.readFileSync(D+'/manifest.before.json.gz'))));const filesBefore=new Set(fs.readdirSync(G));
fs.writeFileSync(D+'/work-apply.log',cp.execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/apply_mods.ps1','-Qsp',G+'/jack.qsp','-ModsDir',T+'/mods'],{encoding:'utf8'}));a(fs.readFileSync(G+'/jack.qsp').equals(out));fs.writeFileSync(R+'/assets/runtime/2.4.1/jack.qsp',out);fs.copyFileSync(p.modFile,R+'/mods/'+p.id+'.json');meta.sourceQspSha256=p.after;meta.snapshotDate='2026-11-13';const row=meta.files.find(x=>x.runtimePath==='jack.qsp');a(row);row.sha256=p.after;row.bytes=out.length;meta.latestReleaseR03f={date:'2026-11-13',mod:p.id,report:'records/release-r03f-leshiy-unknown-20261113/REPORT_KO.md'};wr(metaPath,meta);
const duplicateBackups=[];for(const f of fs.readdirSync(G))if(!filesBefore.has(f)&&/^jack\.qsp\.bak_\d{8}_\d{6}$/.test(f)){const full=G+'/'+f;a(z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz')).equals(fs.readFileSync(full)));fs.unlinkSync(full);duplicateBackups.push(f);}
fs.writeFileSync(D+'/REPORT_KO.md',`# R03-6 레시 무명 요구 연결

2026-11-13 사용자 승인대로 WORK·추적 QSP·runtime 원장에 반영했다.

## 결과와 범위

레시의 기존 unknown=1 요구를 실제 납품검사에 연결했다. 인지도0인 ‘무명 노예’만 허용하고1 이상은 거절한다. 요구 플래그가1이고 인지도가0이 아니면 기존 특별조건 거절 sl_txt=100·buyer_interested=0과 “나는 아무에게도 알려지지 않은 무명 노예를 원한다.”라는 사유로 끝낸다. 현재 이 요구를 정의한 고객은 레시다. 요구가 없는 다른 고객은 원래 경로로 계속 진행한다.

인지도 수치를 낮추거나 인물의 육성·관계·기록을 수정하지 않는다. 기존 체력4이상·감수성3이하·기술·전체평가·가격 조건과 완료 거래·보상·소지금·보관 물품·진행을 유지했다. 이번 수정은 기존 slave_sell_chek 한 본문에 정확 편집1개다.

요구값은 이미 기존 $buyer_demand['leshiy']에 저장되어 있으므로 #npc_base나 $ongload를 수정할 필요가 없다. 새 인물별 저장 필드·수정 버전·로케이션을 추가하지 않았다. 실제 게임을 완전히 재시작하면 새 QSP의 납품 함수를 사용한다. 별도 사용자 콜백에서 요구를0으로 정한 경우도 강제로 덮어쓰지 않는다.

## 검증

- 실제 성인 합성 인물과 현재 초기화·가격·납품 함수를 사용했다. 가격/납품 함수를 대역으로 바꾸지 않았다.
- 변경 전 인지도1·5가 통과하고 기존 저장 요구가 있어도 인지도1이 통과하는 결함을 재현했다.
- 최종 후보는 실제 엔진2그룹31개 검사 통과: 납품 경계24,기존 저장 요구7.
- 인지도0 허용·1/5 거절,인지도0일 때 체력3·감수성4·간호3 거절을 확인했다. 아주라·아르테미아의 기존 거래 허용도 유지했다.
- 실제 $ongload 두 번 후에도 요구를 읽고 사용자 메모·기존 체력요구·다른 고객 콜백·별도 요구0을 보존했다. 기존 콜백을 전면 재생성하지 않았다.
- 경계8사례의 가격·평가 결과가 변경 전후 동일했다. 인물의 인지도·체력·감수성·이름·식별자와 재산·진행이 보존됐다.
- 공식 적용기 재생·재적용 무변경,구조·CRLF·마커·바이트 왕복·역적용 복원 및 대상 외309본문 보존을 통과했다. WORK 적용 후 추적본·원장과 같은 해시를 확인했다.

개인 SAV의 실제 불러오기·CRC·화면과 2.4.2 전체 출고 검사는 별도다. 이번 결과는 R03-6 완료이며 R03 전체나 배포 완료를 뜻하지 않는다.

일반 EXE 확인: 게임 완전 재시작 → 기존 저장 불러오기 → 레시 납품을 새로 연다. 나머지 요구를 충족한 인물로 인지도0 허용·1 거절을 확인한다.

## 유지보수

입력은 기존 demand['unknown']와 slave['fame'],반환은 기존 납품 상태와 거절 사유다. 기존 요구 콜백·일반 납품 호출·가격 선검사에 의존한다. 제거할 때는 해당 mod 추가 블록만 역검토한다. 이후 변경이 있으면 전체 옛 QSP로 덮어쓰지 않는다. baseline.qsp.gz·manifest.before.json.gz는 수정 직전 최소 복구 자료다.

${p.before} → ${p.after}. Full·음원·이미지·JSON·커밋·푸시는 변경하지 않았다. 이번 진단 사본과 스크립트 중복은 정리하고 보고서·재현 스크립트·최소 복구 자료를 보존한다.
`);
const P=R+'/records/release-prep-20261113',O=R+'/docs/release-prep/2026-11-13',sp=P+'/checklist.json',state=rd(sp),item=state.items.find(x=>x.id==='R03');a(!item.subtasks.some(x=>x.id==='R03-6'));item.status='부분 완료';item.result='R03-1~6 완료, R03 전체는 미완료';item.notes='아르테미아 요구와 레시 감수성 상한3·체력최저4·인지도0 요구 반영 완료. R03-6 실제 엔진31검사. 나머지 요구는 별도 검토.';item.subtasks.push({id:'R03-6',status:'완료',decision:'인지도0 무명 노예만 허용',checks:31,report:D+'/REPORT_KO.md'});item.proposal='records/release-r03f-leshiy-unknown-20261113/REPORT_KO.md';state.sourceQspSha256=p.after;state.history.push({date:'2026-11-13',item:'R03-6',result:'레시 무명 요구·엔진31검사',after:p.after});wr(sp,state);
const main=O+'/RELEASE_NOTES_CHECKLIST_KO.md';let m=fs.readFileSync(main,'utf8');a(m.includes('현재 입력은 WORK QSP `'+p.before+'`'));m=m.replace('현재 입력은 WORK QSP `'+p.before+'`','현재 입력은 WORK QSP `'+p.after+'`').replace('**현재 순서: R01·R02·R03-1~5 완료 → R03-6 레시 무명 요구 확인.**','**현재 순서: R01·R02·R03-1~6 완료 → 남은 의뢰 조건 검토.**');m=m.replace(/^\| \[ \] R03 \|.*$/m,'| [ ] R03 | 부분 완료 | 의뢰·선호 설정 비교식 | 아르테미아 요구와 레시 감수성3이하·체력4이상·인지도0 연결. R03-6 엔진31검사 통과. | 남은 요구 별도 검토·R03 전체 미완료 |');m=m.replace('## 다음 확인 R03-6','## R03-6 확인 기록 — 완료').replace('레시의 무명 요구(unknown=1)는 실제 납품검사에서 읽지 않는다. 기존 요청에 맞춰 인지도0 ‘무명 노예’만 허용할지 확인한다.','레시의 무명 요구는 사용자 승인 후 인지도0만 허용하도록 반영했다.').replace('R03F_LESHIY_UNKNOWN_REVIEW_KO.md>). 아직 적용하지 않았다.','R03F_LESHIY_UNKNOWN_REVIEW_KO.md>). 검토 원문은 보존한다.');m+='\n## R03-6 후속 반영\n\n레시의 기존 무명 요구를 실제 납품에 연결해 인지도0만 허용한다. 기존 체력/감수성/기술·다른 고객·수동 편집은 유지했다. 실제 엔진31검사·8사례 가격/평가 보존과 공식 재생/멱등/역검증 통과. [상세 기록](<'+D+'/REPORT_KO.md>).\n';fs.writeFileSync(main,m);
const ledger=O+'/CHANGE_LEDGER_KO.md';fs.writeFileSync(ledger,fs.readFileSync(ledger,'utf8')+'\n## 빌드 준비 중 승인 후속 R03-6 — 레시 무명 요구\n\n2026-11-13. 기존 unknown=1 요구가 인지도0만 허용하도록 실제 납품에 연결됐다. 실제 엔진31검사·8사례 가격/평가 보존,공식 재생/멱등/역검증 통과. [상세](<'+D+'/REPORT_KO.md>).\n');
const release=rd(P+'/release-data.json');release.sourceQspSha256=p.after;a(!release.approvedFollowups.some(x=>x.id==='R03-6'));release.approvedFollowups.push({id:'R03-6',date:'2026-11-13',title:'레시 인지도0 무명 요구',mod:p.id,before:p.before,after:p.after,edits:1,nativeChecks:31,report:D+'/REPORT_KO.md'});wr(P+'/release-data.json',release);const dv=rd(P+'/document-verification.json');dv.sourceQspSha256=p.after;dv.approvedFollowupRecords=release.approvedFollowups.length;dv.latestFollowup={item:'R03-6',nativeAssertions:31,report:D+'/REPORT_KO.md'};wr(P+'/document-verification.json',dv);
const audit=P+'/AUDIT_KO.md';fs.writeFileSync(audit,fs.readFileSync(audit,'utf8')+'\n## R03-6 완료 후 갱신\n\n레시의 기존 무명 요구를 인지도0 납품 조건으로 연결했다. 실제 엔진31검사·8사례 가격/평가 보존. 다른 조건은 유지했다. 현재 WORK `'+p.after+'`. [기록](<'+D+'/REPORT_KO.md>).\n');const oldReview=P+'/R03F_LESHIY_UNKNOWN_REVIEW_KO.md';fs.writeFileSync(oldReview,'> 2026-11-13 갱신: 사용자 승인으로 인지도0 무명 요구 반영 완료. 아래는 승인 전 검토 원문이다. [적용·검증](<'+D+'/REPORT_KO.md>).\n\n'+fs.readFileSync(oldReview,'utf8'));
const idx=R+'/docs/SESSION_HANDOFF_INDEX.md';fs.writeFileSync(idx,'## 2026-11-13 Codex: 2.4.2 준비 R03-6 레시 무명 요구\n\n[수정·기존 저장 요구·실제 납품 검증](../records/release-r03f-leshiy-unknown-20261113/REPORT_KO.md). 인지도0 무명 노예만 허용 사용자 승인 반영. 실제 엔진2그룹31검사·8사례 가격/평가 보존,공식 재생/멱등/역검증·구조 통과. WORK/소스/원장2c408883 일치. R03-6 완료·R03 나머지 검토. 개인 SAV/Full/음원/커밋푸시 변경 없음.\n\n'+fs.readFileSync(idx,'utf8'));
for(const f of ['leshiy-r03f.cjs','leshiy-r03f-build.cjs','leshiy-r03f-native.cjs','leshiy-r03f-finish.cjs'])fs.copyFileSync(f,D+'/'+f);
if(fs.existsSync(T)){const resolved=fs.realpathSync(T);a.equal(path.dirname(resolved).toLowerCase(),fs.realpathSync('G:/Codex/tmp').toLowerCase());a.equal(path.basename(resolved),'release-r03f-leshiy-unknown-20261113');function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const x=path.join(dir,e.name);a(!fs.lstatSync(x).isSymbolicLink(),x);if(e.isDirectory())scan(x);}}scan(resolved);fs.rmSync(resolved,{recursive:true});}
a.equal(c.hash(fs.readFileSync(G+'/jack.qsp')),p.after);a.equal(c.hash(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')),p.after);a.equal(rd(metaPath).sourceQspSha256,p.after);wr(D+'/verification.json',{status:'PASS',scope:'R03-6 targeted runtime and patch checks; not full-release PASS',before:p.before,after:p.after,native:proof,priceAndRatingUnchangedCases:8,replay:true,idempotence:true,inverse:true,structure:true,unchangedLocations:309,newSaveFields:0,newLocations:0,newLoadCallback:false,personalSaveReadOrWritten:false,guiTested:false,fullReleaseValidation:false,workSourceManifest:true,taskTempRemoved:!fs.existsSync(T),duplicateWorkBackupsRemoved:duplicateBackups});console.log(JSON.stringify({installed:true,after:p.after,nativeChecks:31,priceUnchangedCases:8,temporaryCopiesRemoved:!fs.existsSync(T)}));
