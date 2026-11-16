'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),cp=require('child_process'),a=require('assert/strict');
const {R,G,D,T,c,qa,rd,wr,body,put}=require('./leshiy-r03g.cjs');
const p=rd(D+'/plan.json'),proof=rd(D+'/native-green-report.json'),mod=rd(p.modFile),raw=fs.readFileSync(G+'/jack.qsp'),out=fs.readFileSync(T+'/candidate.qsp');
a.equal(c.hash(raw),p.before);a(raw.equals(z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz'))));a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));a.equal(c.hash(out),p.after);a(out.equals(fs.readFileSync(T+'/replay.qsp')));a.equal(proof.sourceHash,p.after);a.equal(proof.passed,true);a.equal(proof.assertions,35);a.equal(proof.results.length,2);a(proof.results.every(x=>x.pass));a(fs.readFileSync(D+'/official-idempotence.log','utf8').includes('모든 edit가 이미 적용'));
const redCases=rd(D+'/cases-red.json'),greenCases=rd(D+'/cases-green.json');a.equal(greenCases.length,9);for(let i=0;i<greenCases.length;i++){const v=greenCases[i];a.equal(v.price,redCases[i].price,v.label);a(v.price>0);a.equal(v.rating,redCases[i].rating,v.label);if(v.want==='accept')a([1,2].includes(v.actualResult),v.label);else a.equal(v.actualResult,v.want,v.label);}qa.inspectWorld(out);a(c.serialize(c.parse(out)).equals(out));
const inverse=c.parse(out);for(const e of [...mod.edits].reverse()){const s=body(inverse,e.location);a.equal(s.split(e.new).length-1,1);put(inverse,e.location,s.replace(e.new,()=>e.old));}a(c.serialize(inverse).equals(raw));const before=c.parse(raw),next=c.parse(out);a.equal(before.locations.length,next.locations.length);for(const l of before.locations)if(!p.changedLocations.includes(l.name))a.equal(body(before,l.name),body(next,l.name),l.name);
const metaPath=R+'/assets/runtime-source-2.4.1.json',meta=rd(metaPath);a.equal(meta.sourceQspSha256,p.before);a(fs.readFileSync(metaPath).equals(z.gunzipSync(fs.readFileSync(D+'/manifest.before.json.gz'))));const filesBefore=new Set(fs.readdirSync(G));
fs.writeFileSync(D+'/work-apply.log',cp.execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/apply_mods.ps1','-Qsp',G+'/jack.qsp','-ModsDir',T+'/mods'],{encoding:'utf8'}));a(fs.readFileSync(G+'/jack.qsp').equals(out));fs.writeFileSync(R+'/assets/runtime/2.4.1/jack.qsp',out);fs.copyFileSync(p.modFile,R+'/mods/'+p.id+'.json');meta.sourceQspSha256=p.after;meta.snapshotDate='2026-11-13';const row=meta.files.find(x=>x.runtimePath==='jack.qsp');a(row);row.sha256=p.after;row.bytes=out.length;meta.latestReleaseR03g={date:'2026-11-13',mod:p.id,report:'records/release-r03g-leshiy-sensitivity-min-20261113/REPORT_KO.md'};wr(metaPath,meta);
const duplicateBackups=[];for(const f of fs.readdirSync(G))if(!filesBefore.has(f)&&/^jack\.qsp\.bak_\d{8}_\d{6}$/.test(f)){const full=G+'/'+f;a(z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz')).equals(fs.readFileSync(full)));fs.unlinkSync(full);duplicateBackups.push(f);}
fs.writeFileSync(D+'/REPORT_KO.md',`# R03-7 레시 감수성 1~3

2026-11-13 사용자 승인대로 WORK·추적 QSP·runtime 원장에 반영했다.

## 결과와 변경 범위

레시는 감수성1~3만 허용하고0과4이상을 거절한다. 기존 감수성 상한3 검사 다음에 레시일 때만 저장된 demand['min_sensitivity']를 읽는 최저값 검사를 추가했다. 미달이면 기존 속성/기술 거절 sl_txt=102·buyer_interested=0으로 끝낸다. 인물의 실제 감수성은 바꾸지 않는다.

체력4이상·인지도0 무명 요구와 지성/자아/간호/전투/마법/이종 등 기존 선호,종합등급6·가격 계산은 유지했다. 다른 고객의 감수성 최저값은 이번에 일괄 활성화하지 않았다. 완료 거래·보상·이름·재산·퀘스트와 다른 인물값도 수정하지 않는다.

최저1은 이미 기존 고객 요구와 저장 콜백에 있으므로 #npc_base·$ongload를 수정하지 않았다. 새 인물별 저장 필드·수정 버전·로케이션이 없다. 별도로 편집한 최저값도 덮어쓰지 않고 저장값을 그대로 읽는다. 기존 slave_sell_chek 한 본문에 정확 mod 편집1개만 추가했다.

## 검증

- 변경 전 실제 엔진에서 감수성0이 통과하고 저장 요구에 최저값이 있어도 적용되지 않는 것을 재현했다.
- 최종 후보는 실제 엔진2그룹35개 검사 통과: 실제 납품 경계27,기존 저장 요구8.
- 성인 합성 인물로0/1/3/4 경계,체력3·인지도1·간호3 거절과 아주라·아르테미아의 기존 거래 허용을 확인했다. 실제 가격/납품 함수를 대역으로 바꾸지 않았다.
- 실제 $ongload 두 번 후에도0 거절·1 허용,사용자 메모·다른 콜백·기존 체력/무명 요구를 보존했다. 별도 사용자 최저2에서는1 거절·2 허용을 확인해 최저1을 강제 덮어쓰지 않는 것도 검증했다.
- 경계9사례의 가격·평가 결과가 변경 전후 동일하고 인물의 감수성·체력·인지도·이름·식별자와 재산·진행이 보존됐다.
- 공식 적용기 재생·재적용 무변경,구조·CRLF·마커·바이트 왕복·역적용 복원 및 대상 외309본문 보존을 통과했다. WORK 적용 후 추적본·원장 해시를 확인했다.

개인 SAV의 실제 불러오기·CRC·화면과 2.4.2 전체 출고 검사는 별도다. 이번 결과는 R03-7 완료이며 R03 전체나 배포 완료를 뜻하지 않는다.

일반 EXE 확인: 게임 완전 재시작 → 기존 저장 불러오기 → 레시 납품을 새로 연다. 나머지 요구를 충족한 인물로 감수성1/3 허용·0/4 거절을 확인한다.

## 유지보수

입력은 기존 고객 식별자·요구 최저값·인물 감수성이며,반환은 기존 납품 상태다. 기존 요구 콜백·일반 납품·감수성 상한 검사에 의존한다. 제거할 때는 해당 mod의 추가 블록만 역검토한다. 이후 변경이 있으면 전체 옛 QSP로 덮어쓰지 않는다. baseline.qsp.gz·manifest.before.json.gz는 수정 직전 최소 복구 자료다.

${p.before} → ${p.after}. Full·음원·이미지·JSON·커밋·푸시는 변경하지 않았다. 이번 진단 사본과 스크립트 중복은 정리하고 보고서·재현 스크립트·최소 복구 자료를 보존한다.
`);
const P=R+'/records/release-prep-20261113',O=R+'/docs/release-prep/2026-11-13',sp=P+'/checklist.json',state=rd(sp),item=state.items.find(x=>x.id==='R03');a(!item.subtasks.some(x=>x.id==='R03-7'));item.status='부분 완료';item.result='R03-1~7 완료, R03 전체는 미완료';item.notes='아르테미아 요구 및 레시 체력4이상·감수성1~3·인지도0 반영 완료. R03-7 실제 엔진35검사. 다른 NPC 잔여는 별도 검토.';item.subtasks.push({id:'R03-7',status:'완료',decision:'레시 감수성 최저1 연결·1~3 허용',checks:35,report:D+'/REPORT_KO.md'});item.proposal='records/release-r03g-leshiy-sensitivity-min-20261113/REPORT_KO.md';state.sourceQspSha256=p.after;state.history.push({date:'2026-11-13',item:'R03-7',result:'레시 감수성1~3·엔진35검사',after:p.after});wr(sp,state);
const main=O+'/RELEASE_NOTES_CHECKLIST_KO.md';let m=fs.readFileSync(main,'utf8');a(m.includes('현재 입력은 WORK QSP `'+p.before+'`'));m=m.replace('현재 입력은 WORK QSP `'+p.before+'`','현재 입력은 WORK QSP `'+p.after+'`').replace('**현재 순서: R01·R02·R03-1~6 완료 → R03-7 레시 감수성 최저값 결정.**','**현재 순서: R01·R02·R03-1~7 완료 → R03 잔여 검토.**');m=m.replace(/^\| \[ \] R03 \|.*$/m,'| [ ] R03 | 부분 완료 | 의뢰·선호 설정 비교식 | 아르테미아 요구와 레시 체력4이상·감수성1~3·인지도0 연결. R03-7 엔진35검사 통과. | 다른 NPC 잔여 검토·R03 전체 미완료 |');m=m.replace('## 다음 확인 R03-7','## R03-7 확인 기록 — 완료').replace('레시의 원본 감수성최저1도 실제 검사에 연결할지 결정한다. 연결하면 현재3이하에서1~3으로 좁아지고,현행 유지라면0도 이 조건에서는 허용한다.','원본 최저1까지 연결해 레시 감수성1~3만 허용하도록 사용자 승인 후 반영했다.').replace('R03G_LESHIY_MIN_SENSITIVITY_REVIEW_KO.md>). 아직 적용하지 않았다.','R03G_LESHIY_MIN_SENSITIVITY_REVIEW_KO.md>). 검토 원문은 보존한다.');m+='\n## R03-7 후속 반영\n\n레시 감수성 최저1을 연결해1~3만 허용한다. 기존 체력4이상·인지도0·기술·다른 고객·수동 편집은 유지했다. 실제 엔진35검사·9사례 가격/평가 보존과 공식 재생/멱등/역검증 통과. [상세 기록](<'+D+'/REPORT_KO.md>).\n';fs.writeFileSync(main,m);
const ledger=O+'/CHANGE_LEDGER_KO.md';fs.writeFileSync(ledger,fs.readFileSync(ledger,'utf8')+'\n## 빌드 준비 중 승인 후속 R03-7 — 레시 감수성 최저1\n\n2026-11-13. 기존 최저1 요구를 연결해 감수성1~3만 허용한다. 실제 엔진35검사·9사례 가격/평가 보존,공식 재생/멱등/역검증 통과. [상세](<'+D+'/REPORT_KO.md>).\n');
const release=rd(P+'/release-data.json');release.sourceQspSha256=p.after;a(!release.approvedFollowups.some(x=>x.id==='R03-7'));release.approvedFollowups.push({id:'R03-7',date:'2026-11-13',title:'레시 감수성1~3',mod:p.id,before:p.before,after:p.after,edits:1,nativeChecks:35,report:D+'/REPORT_KO.md'});wr(P+'/release-data.json',release);const dv=rd(P+'/document-verification.json');dv.sourceQspSha256=p.after;dv.approvedFollowupRecords=release.approvedFollowups.length;dv.latestFollowup={item:'R03-7',nativeAssertions:35,report:D+'/REPORT_KO.md'};wr(P+'/document-verification.json',dv);
const audit=P+'/AUDIT_KO.md';fs.writeFileSync(audit,fs.readFileSync(audit,'utf8')+'\n## R03-7 완료 후 갱신\n\n레시 감수성 최저1을 실제 검사에 연결해1~3만 허용한다. 실제 엔진35검사·9사례 가격/평가 보존. 현재 WORK `'+p.after+'`. [기록](<'+D+'/REPORT_KO.md>).\n');const oldReview=P+'/R03G_LESHIY_MIN_SENSITIVITY_REVIEW_KO.md';fs.writeFileSync(oldReview,'> 2026-11-13 갱신: 사용자 승인으로 감수성1~3 반영 완료. 아래는 승인 전 검토 원문이다. [적용·검증](<'+D+'/REPORT_KO.md>).\n\n'+fs.readFileSync(oldReview,'utf8'));
const idx=R+'/docs/SESSION_HANDOFF_INDEX.md';fs.writeFileSync(idx,'## 2026-11-13 Codex: 2.4.2 준비 R03-7 레시 감수성1~3\n\n[수정·기존 저장 요구·실제 납품 검증](../records/release-r03g-leshiy-sensitivity-min-20261113/REPORT_KO.md). 최저1 추가 연결 사용자 승인 반영. 실제 엔진2그룹35검사·9사례 가격/평가 보존,공식 재생/멱등/역검증·구조 통과. WORK/소스/원장1ec9e14b 일치. 레시 현재 체력4이상·감수성1~3·인지도0. R03-7 완료·R03 전체 미완료. 개인 SAV/Full/음원/커밋푸시 변경 없음.\n\n'+fs.readFileSync(idx,'utf8'));
for(const f of ['leshiy-r03g.cjs','leshiy-r03g-build.cjs','leshiy-r03g-native.cjs','leshiy-r03g-finish.cjs'])fs.copyFileSync(f,D+'/'+f);
if(fs.existsSync(T)){const resolved=fs.realpathSync(T);a.equal(path.dirname(resolved).toLowerCase(),fs.realpathSync('G:/Codex/tmp').toLowerCase());a.equal(path.basename(resolved),'release-r03g-leshiy-sensitivity-min-20261113');function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const x=path.join(dir,e.name);a(!fs.lstatSync(x).isSymbolicLink(),x);if(e.isDirectory())scan(x);}}scan(resolved);fs.rmSync(resolved,{recursive:true});}
a.equal(c.hash(fs.readFileSync(G+'/jack.qsp')),p.after);a.equal(c.hash(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')),p.after);a.equal(rd(metaPath).sourceQspSha256,p.after);wr(D+'/verification.json',{status:'PASS',scope:'R03-7 targeted runtime and patch checks; not full-release PASS',before:p.before,after:p.after,native:proof,priceAndRatingUnchangedCases:9,replay:true,idempotence:true,inverse:true,structure:true,unchangedLocations:309,newSaveFields:0,newLocations:0,newLoadCallback:false,customerScope:'Leshiy only',personalSaveReadOrWritten:false,guiTested:false,fullReleaseValidation:false,workSourceManifest:true,taskTempRemoved:!fs.existsSync(T),duplicateWorkBackupsRemoved:duplicateBackups});console.log(JSON.stringify({installed:true,after:p.after,nativeChecks:35,priceUnchangedCases:9,temporaryCopiesRemoved:!fs.existsSync(T)}));
