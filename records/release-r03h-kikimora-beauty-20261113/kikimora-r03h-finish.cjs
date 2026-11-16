'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),cp=require('child_process'),a=require('assert/strict');
const {R,G,D,T,c,qa,rd,wr,body,put}=require('./kikimora-r03h.cjs');
const p=rd(D+'/plan.json'),proof=rd(D+'/native-green-report.json'),mod=rd(p.modFile),raw=fs.readFileSync(G+'/jack.qsp'),out=fs.readFileSync(T+'/candidate.qsp');
a.equal(c.hash(raw),p.before);a(raw.equals(z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz'))));a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));a.equal(c.hash(out),p.after);a(out.equals(fs.readFileSync(T+'/replay.qsp')));a.equal(proof.sourceHash,p.after);a.equal(proof.passed,true);a.equal(proof.assertions,30);a.equal(proof.results.length,2);a(proof.results.every(x=>x.pass));a(fs.readFileSync(D+'/official-idempotence.log','utf8').includes('모든 edit가 이미 적용'));
const redCases=rd(D+'/cases-red.json'),greenCases=rd(D+'/cases-green.json');a.equal(greenCases.length,7);for(let i=0;i<greenCases.length;i++){const v=greenCases[i];a.equal(v.price,redCases[i].price,v.label);a(v.price>0);a.equal(v.rating,redCases[i].rating,v.label);if(v.want==='accept')a([1,2].includes(v.actualResult),v.label);else a.equal(v.actualResult,v.want,v.label);}qa.inspectWorld(out);a(c.serialize(c.parse(out)).equals(out));
const inverse=c.parse(out);for(const e of [...mod.edits].reverse()){const s=body(inverse,e.location);a.equal(s.split(e.new).length-1,1);put(inverse,e.location,s.replace(e.new,()=>e.old));}a(c.serialize(inverse).equals(raw));const before=c.parse(raw),next=c.parse(out);a.equal(before.locations.length,next.locations.length);for(const l of before.locations)if(!p.changedLocations.includes(l.name))a.equal(body(before,l.name),body(next,l.name),l.name);
const metaPath=R+'/assets/runtime-source-2.4.1.json',meta=rd(metaPath);a.equal(meta.sourceQspSha256,p.before);a(fs.readFileSync(metaPath).equals(z.gunzipSync(fs.readFileSync(D+'/manifest.before.json.gz'))));const filesBefore=new Set(fs.readdirSync(G));
fs.writeFileSync(D+'/work-apply.log',cp.execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/apply_mods.ps1','-Qsp',G+'/jack.qsp','-ModsDir',T+'/mods'],{encoding:'utf8'}));a(fs.readFileSync(G+'/jack.qsp').equals(out));fs.writeFileSync(R+'/assets/runtime/2.4.1/jack.qsp',out);fs.copyFileSync(p.modFile,R+'/mods/'+p.id+'.json');meta.sourceQspSha256=p.after;meta.snapshotDate='2026-11-13';const row=meta.files.find(x=>x.runtimePath==='jack.qsp');a(row);row.sha256=p.after;row.bytes=out.length;meta.latestReleaseR03h={date:'2026-11-13',mod:p.id,report:'records/release-r03h-kikimora-beauty-20261113/REPORT_KO.md'};wr(metaPath,meta);
const duplicateBackups=[];for(const f of fs.readdirSync(G))if(!filesBefore.has(f)&&/^jack\.qsp\.bak_\d{8}_\d{6}$/.test(f)){const full=G+'/'+f;a(z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz')).equals(fs.readFileSync(full)));fs.unlinkSync(full);duplicateBackups.push(f);}
fs.writeFileSync(D+'/REPORT_KO.md',`# R03-8 키키모라 최저 외모4

2026-11-13 사용자 승인대로 WORK·추적 QSP·runtime 원장에 반영했다.

## 변경

키키모라의 기존 demand['min_beauty'] > 3 비교식을 =4 대입으로 바꿨다. 기존 실제 납품 함수의 최저 외모 검사와 연결돼 외모3은 거절하고4 이상은 이 조건을 통과한다. 다른 요구도 충족해야 최종 납품이 허용된다.

#npc_base의 해당 요구 정의와 $ongload의 알려진 옛 요구 표현만 수정했다. 저장된 고객 콜백의 해당 구문만 치환하고 사용자 메모·다른 고객·별도 최저값은 보존한다. 남아 있는 기술8종 비교식과 다른 요구·분류·대사·가격·인물값·육성·재산·진행은 변경하지 않았다. 완료 거래나 보상을 소급 취소하지 않는다.

입력은 기존 요구 콜백 문자열과 인물 외모이며,반환은 기존 slave_sell_chek의 거절/허용 상태다. 미달이면 기존 sl_txt=100·buyer_interested=0과 외모 거절 사유를 사용한다. 새 인물별 영구 필드·수정 버전·로케이션은 추가하지 않았다. 정확한 mod 편집2개·기존 본문2개만 변경했다.

## 검증

- 실제 성인 합성 인물(age2)을 사용하고 분류값은 그대로 유지했다. 현재 초기화·가격·납품 함수를 사용했으며 대역으로 바꾸지 않았다.
- 변경 전 외모3이 통과하고 옛 요구의 최저값이 저장되지 않는 결함을 재현했다.
- 최종 후보 실제 엔진2그룹30개 검사 통과: 납품 경계21,옛 저장 요구9.
- 외모3 거절·4/5 허용과 기존 다른 요구의 거절,아주라·아르테미아의 기존 외모 조건을 확인했다.
- 실제 $ongload 두 번 후 외모3 거절·4 허용을 유지하고 메모·다른 콜백·다른 요구와 인물/재산/진행을 보존했다. 별도 사용자 최저3은 강제 덮어쓰지 않았다.
- 경계7사례의 기존 slaveprice와 종합평가 결과가 변경 전후 같았다. 가격 산식과 허용 후 처리 코드는 변경하지 않았다.
- 공식 적용기 재생·재적용 무변경,구조·CRLF·마커·바이트 왕복·역적용 복원과 대상 외308본문 보존을 통과했다. 같은 본문 안의 키키모라 기술 선호도 이전과 동일함을 확인했다. WORK 적용 후 소스·원장 동일 해시를 확인했다.

개인 SAV의 실제 불러오기·CRC·화면과 2.4.2 전체 출고 검사는 별도다. 이번 결과는 R03-8 완료이며 R03 전체나 배포 완료를 뜻하지 않는다.

일반 EXE 확인: 게임 완전 재시작 → 기존 저장 불러오기 → 키키모라 상담·납품을 새로 연다. 다른 요구를 충족한 인물로 외모3 거절·4 허용을 확인한다.

## 유지보수

현재 #npc_base 초기화·$ongload와 기존 납품 검사가 의존 경로다. 제거할 때는 정의와 저장 요구 치환을 함께 역검토한다. 이후 수정이 있으면 전체 옛 QSP로 덮어쓰지 말고 mod 차이를 검토한다. baseline.qsp.gz·manifest.before.json.gz는 수정 직전 최소 복구 자료다.

${p.before} → ${p.after}. Full·음원·이미지·JSON·커밋·푸시는 변경하지 않았다. 이번 진단 사본과 스크립트 중복은 정리하고 보고서·재현 스크립트·최소 복구 자료를 보존한다.
`);
const P=R+'/records/release-prep-20261113',O=R+'/docs/release-prep/2026-11-13',sp=P+'/checklist.json',state=rd(sp),item=state.items.find(x=>x.id==='R03');a(!item.subtasks.some(x=>x.id==='R03-8'));item.status='부분 완료';item.result='R03-1~8 완료, R03 전체는 미완료';item.notes='아르테미아/레시 확정 요구와 키키모라 외모4이상 반영 완료. R03-8 실제 엔진30검사. 키키모라 기술 비교식 등 잔여는 미수정.';item.subtasks.push({id:'R03-8',status:'완료',decision:'키키모라 외모4이상',checks:30,report:D+'/REPORT_KO.md'});item.proposal='records/release-r03h-kikimora-beauty-20261113/REPORT_KO.md';state.sourceQspSha256=p.after;state.history.push({date:'2026-11-13',item:'R03-8',result:'키키모라 외모4이상·옛요구 갱신·엔진30검사',after:p.after});wr(sp,state);
const main=O+'/RELEASE_NOTES_CHECKLIST_KO.md';let m=fs.readFileSync(main,'utf8');a(m.includes('현재 입력은 WORK QSP `'+p.before+'`'));m=m.replace('현재 입력은 WORK QSP `'+p.before+'`','현재 입력은 WORK QSP `'+p.after+'`').replace('**현재 순서: R01·R02·R03-1~7 완료 → R03-8 키키모라 외모 조건 확인.**','**현재 순서: R01·R02·R03-1~8 완료 → 키키모라 기술 조건 검토.**');m=m.replace(/^\| \[ \] R03 \|.*$/m,'| [ ] R03 | 부분 완료 | 의뢰·선호 설정 비교식 | 아르테미아/레시 확정 요구와 키키모라 외모4이상 반영. R03-8 엔진30검사 통과. | 기술 비교식 등 잔여 검토·R03 전체 미완료 |');m=m.replace('## 다음 확인 R03-8','## R03-8 확인 기록 — 완료').replace('키키모라의 최저 외모>3 비교식도 값이 저장되지 않는다. 기존 부등호 뜻대로4이상으로 연결할지 확인한다.','키키모라 최저 외모4이상을 사용자 승인 후 반영했다.').replace('R03H_KIKIMORA_BEAUTY_REVIEW_KO.md>). 아직 적용하지 않았다.','R03H_KIKIMORA_BEAUTY_REVIEW_KO.md>). 검토 원문은 보존한다.');m+='\n## R03-8 후속 반영\n\n키키모라 최저 외모4를 저장하고 알려진 옛 요구 콜백만 갱신했다. 실제 엔진30검사·7사례 가격/평가 보존,공식 재생/멱등/역검증 통과. 다른 요구·기술·분류·대사는 유지했다. [상세 기록](<'+D+'/REPORT_KO.md>).\n';fs.writeFileSync(main,m);
const ledger=O+'/CHANGE_LEDGER_KO.md';fs.writeFileSync(ledger,fs.readFileSync(ledger,'utf8')+'\n## 빌드 준비 중 승인 후속 R03-8 — 키키모라 최저 외모4\n\n2026-11-13. 기존 >3을 최저4 대입으로 고치고 알려진 옛 콜백만 갱신했다. 실제 엔진30검사·7사례 가격/평가 보존,공식 재생/멱등/역검증 통과. [상세](<'+D+'/REPORT_KO.md>).\n');
const release=rd(P+'/release-data.json');release.sourceQspSha256=p.after;a(!release.approvedFollowups.some(x=>x.id==='R03-8'));release.approvedFollowups.push({id:'R03-8',date:'2026-11-13',title:'키키모라 최저외모4',mod:p.id,before:p.before,after:p.after,edits:2,nativeChecks:30,report:D+'/REPORT_KO.md'});wr(P+'/release-data.json',release);const dv=rd(P+'/document-verification.json');dv.sourceQspSha256=p.after;dv.approvedFollowupRecords=release.approvedFollowups.length;dv.latestFollowup={item:'R03-8',nativeAssertions:30,report:D+'/REPORT_KO.md'};wr(P+'/document-verification.json',dv);
const audit=P+'/AUDIT_KO.md';fs.writeFileSync(audit,fs.readFileSync(audit,'utf8')+'\n## R03-8 완료 후 갱신\n\n키키모라 최저 외모4 정의와 알려진 옛 요구 콜백을 맞췄다. 실제 엔진30검사·7사례 가격/평가 보존. 기술 비교식 등 잔여는 미수정이다. 현재 WORK `'+p.after+'`. [기록](<'+D+'/REPORT_KO.md>).\n');const oldReview=P+'/R03H_KIKIMORA_BEAUTY_REVIEW_KO.md';fs.writeFileSync(oldReview,'> 2026-11-13 갱신: 사용자 승인으로 최저 외모4 반영 완료. 아래는 승인 전 검토 원문이다. [적용·검증](<'+D+'/REPORT_KO.md>).\n\n'+fs.readFileSync(oldReview,'utf8'));
const idx=R+'/docs/SESSION_HANDOFF_INDEX.md';fs.writeFileSync(idx,'## 2026-11-13 Codex: 2.4.2 준비 R03-8 키키모라 외모4\n\n[수정·옛 요구·실제 납품 검증](../records/release-r03h-kikimora-beauty-20261113/REPORT_KO.md). 최저 외모4 사용자 승인 반영. 실제 엔진2그룹30검사·7사례 가격/평가 보존,공식 재생/멱등/역검증·구조 통과. WORK/소스/원장081e888d 일치. 기술 비교식/다른 요구/분류/대사는 유지. R03-8 완료·R03 전체 미완료. 개인 SAV/Full/음원/커밋푸시 변경 없음.\n\n'+fs.readFileSync(idx,'utf8'));
for(const f of ['kikimora-r03h.cjs','kikimora-r03h-build.cjs','kikimora-r03h-native.cjs','kikimora-r03h-finish.cjs'])fs.copyFileSync(f,D+'/'+f);
if(fs.existsSync(T)){const resolved=fs.realpathSync(T);a.equal(path.dirname(resolved).toLowerCase(),fs.realpathSync('G:/Codex/tmp').toLowerCase());a.equal(path.basename(resolved),'release-r03h-kikimora-beauty-20261113');function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const x=path.join(dir,e.name);a(!fs.lstatSync(x).isSymbolicLink(),x);if(e.isDirectory())scan(x);}}scan(resolved);fs.rmSync(resolved,{recursive:true});}
a.equal(c.hash(fs.readFileSync(G+'/jack.qsp')),p.after);a.equal(c.hash(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')),p.after);a.equal(rd(metaPath).sourceQspSha256,p.after);wr(D+'/verification.json',{status:'PASS',scope:'R03-8 targeted runtime and patch checks; not full-release PASS',before:p.before,after:p.after,native:proof,priceAndRatingUnchangedCases:7,replay:true,idempotence:true,inverse:true,structure:true,unchangedLocations:308,newSaveFields:0,newLocations:0,otherPreferencesAndClassificationUnchanged:true,personalSaveReadOrWritten:false,guiTested:false,fullReleaseValidation:false,workSourceManifest:true,taskTempRemoved:!fs.existsSync(T),duplicateWorkBackupsRemoved:duplicateBackups});console.log(JSON.stringify({installed:true,after:p.after,nativeChecks:30,priceUnchangedCases:7,temporaryCopiesRemoved:!fs.existsSync(T)}));
