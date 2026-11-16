'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),cp=require('child_process'),a=require('assert/strict');
const {R,G,D,T,c,qa,sv,rd,wr,body,put,limits}=require('./artemia-r03b.cjs');
const p=rd(D+'/plan.json'),proof=rd(D+'/native-green-report.json'),mod=rd(p.modFile),raw=fs.readFileSync(G+'/jack.qsp'),out=fs.readFileSync(T+'/candidate.qsp');
a.equal(c.hash(raw),p.before);a(raw.equals(z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz'))));a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));
a.equal(c.hash(out),p.after);a(out.equals(fs.readFileSync(T+'/replay.qsp')));a.equal(proof.sourceHash,p.after);a.equal(proof.passed,true);a.equal(proof.assertions,120);a.equal(proof.results.length,3);a(proof.results.every(x=>x.pass));
const idem=fs.readFileSync(D+'/official-idempotence.log','utf8');a(idem.includes('모든 edit가 이미 적용'));
qa.inspectWorld(out);a(c.serialize(c.parse(out)).equals(out));
const inverse=c.parse(out);for(const e of [...mod.edits].reverse()){const s=body(inverse,e.location);a.equal(s.split(e.new).length-1,1);put(inverse,e.location,s.replace(e.new,()=>e.old));}a(c.serialize(inverse).equals(raw));
const before=c.parse(raw),next=c.parse(out);a.equal(before.locations.length,next.locations.length);for(const l of before.locations)if(!p.changedLocations.includes(l.name))a.equal(body(before,l.name),body(next,l.name),l.name);
const nativeSave=sv.parse(fs.readFileSync(T+'/native/sale-boundaries.sav'));
const arrayValue=(name,index,col=0)=>{const v=nativeSave.vars.find(x=>x.name===name.toUpperCase());a(v,name);return v.values[index][col];};
const boundaryCases=[];let i=0;for(const [key,min]of [...Object.entries(limits),['all',0]])for(const offset of key==='all'?[0]:[-1,0]){
 i++;const result=+arrayValue('qa_result',i),rating=+arrayValue('qa_rating',i);a.equal(result,key!=='all'&&offset===-1?102:2);a(rating>=8);boundaryCases.push({case:i,skill:key,value:key==='all'?null:min+offset,required:key==='all'?limits:min,result,rating});
}wr(D+'/sale-boundaries.json',boundaryCases);
const metaPath=R+'/assets/runtime-source-2.4.1.json',meta=rd(metaPath);a.equal(meta.sourceQspSha256,p.before);a(fs.readFileSync(metaPath).equals(z.gunzipSync(fs.readFileSync(D+'/manifest.before.json.gz'))));
const filesBefore=new Set(fs.readdirSync(G));
fs.writeFileSync(D+'/work-apply.log',cp.execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/apply_mods.ps1','-Qsp',G+'/jack.qsp','-ModsDir',T+'/mods'],{encoding:'utf8'}));
a(fs.readFileSync(G+'/jack.qsp').equals(out));fs.writeFileSync(R+'/assets/runtime/2.4.1/jack.qsp',out);fs.copyFileSync(p.modFile,R+'/mods/'+p.id+'.json');
meta.sourceQspSha256=p.after;meta.snapshotDate='2026-11-13';const row=meta.files.find(x=>x.runtimePath==='jack.qsp');a(row);row.sha256=p.after;row.bytes=out.length;meta.latestReleaseR03b={date:'2026-11-13',mod:p.id,report:'records/release-r03b-artemia-skills-20261113/REPORT_KO.md'};wr(metaPath,meta);
const duplicateBackups=[];for(const f of fs.readdirSync(G))if(!filesBefore.has(f)&&/^jack\.qsp\.bak_\d{8}_\d{6}$/.test(f)){
 const full=G+'/'+f;a.equal(c.hash(fs.readFileSync(full)),p.before);a(z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz')).equals(fs.readFileSync(full)));fs.unlinkSync(full);duplicateBackups.push(f);
}
fs.writeFileSync(D+'/REPORT_KO.md',`# R03-2 아르테미아 기술 최저값 반영

2026-11-13 사용자 승인에 따라 WORK·추적 QSP·runtime 원장에 반영했다.

| 기술 | 실제 최저값 |
|---|---:|
| 음악·이종·페티시즘 | 4 이상 |
| 애무·구강·삽입·단체·역할놀이 | 5 이상 |

## 바뀐 동작

#npc_base의 아르테미아 선호 콜백은 기존 >3/>4 비교식만 평가하고 값을 저장하지 않았다. 이를 =4/=5 대입으로 고쳐 실제 납품 검사에서 사용하도록 했다. 음악 중복 한 줄은 같은 대입으로 유지했다. 가격·전체 평가등급 8·최저 외모 5·기존 특성 요구 정의·다른 NPC의 조건은 바꾸지 않았다. 이미 완료된 거래·보상·소유 인물에도 소급하지 않는다.

기존 저장에는 선호 콜백 문자열이 남아 있으므로 $ongload에서 이 고객의 알려진 옛 8개 표현만 치환한다. 새 저장 필드·수정 버전·로케이션을 추가하지 않는다. 별도 사용자 조건·메모·다른 NPC 콜백은 유지한다. 조건을 소개하는 화면을 이미 열어 둔 경우 다시 열어 갱신된 조건을 확인한다.

입력은 기술값과 기존 선호 콜백 문자열이며, 호출은 #npc_base 초기화와 실제 $ongload다. 납품 판정은 기존 slave_sell_chek 및 $slave_price에 맡긴다. 기준 미달은 기존 sl_txt=102·buyer_interested=0, 다른 조건도 충족한 기준 이상은 기존 허용 경로로 간다. 가격·평가식 자체에는 편집이 없다. 제거하려면 정의와 저장 콜백 치환을 함께 검토해야 한다. 이후 다른 작업이 진행된 경우 전체 옛 QSP로 덮어쓰지 말고 mod 차이를 역검토한다.

## 검증과 한계

- 변경 전 실제 엔진에서 10개 검사 중 기술 최저값 8개가 저장되지 않는 결함을 재현했다.
- 변경 후 실제 엔진 3그룹 120개 검사 통과: 정의 10, 실제 납품 경계 85, 저장 콜백 25.
- 기술마다 최저값보다 1 낮은 경우 거절 102, 기준값을 만족한 경우 허용 2를 확인했다. 모든 기술이 정확히 최저값인 경우도 허용했다. 경계 사례 17개는 sale-boundaries.json에 보존했다.
- 실제 납품·평가 함수를 사용하고 대역으로 바꾸지 않았다. 검사용 성인 인물의 이름·식별자·재산·진행 보존, 저장 콜백 두 번 갱신, 사용자 메모·별도 조건과 R03-1 외모 조건 보존을 확인했다.
- 공식 적용기로 격리 기준본에서 동일 후보 재생, 재적용 무변경, 구조·CRLF·마커 경계·바이트 왕복·역적용 복원과 대상 외 308개 본문 보존을 확인했다.
- 개인 SAV의 실제 불러오기·CRC·화면과 전체 배포 출고 검사는 별도다. 이번 검사를 R03 전체 또는 2.4.2 배포 완료로 표시하지 않는다.

일반 EXE 확인 경로: 게임 완전 재시작 → 기존 저장 불러오기 → 아르테미아 상담·납품을 새로 연다. 다른 요구를 충족한 인물로 위 기술 기준 미달 거절과 기준 충족 시 통과를 확인한다.

정확한 mod 편집 2개·기존 본문 2개만 변경했다. ${p.before} → ${p.after}. baseline.qsp.gz와 manifest.before.json.gz는 수정 직전 복구 자료다. 재생성 가능한 진단 사본은 정리하고 보고서·검증 로그·재현 스크립트를 남긴다. Full 폴더·이미지·JSON·음원·커밋·푸시는 변경하지 않았다.
`);
const P=R+'/records/release-prep-20261113',O=R+'/docs/release-prep/2026-11-13',sp=P+'/checklist.json',state=rd(sp),item=state.items.find(x=>x.id==='R03');
a(!item.subtasks.some(x=>x.id==='R03-2'));item.status='부분 완료';item.notes='R03-1 외모5와 R03-2 기술8종4/5이상 반영 완료. R03-2 실제 엔진120검사 통과. 나머지 의뢰 조건은 별도 검토.';item.result='R03-1·R03-2 완료, R03 전체는 미완료';item.subtasks.push({id:'R03-2',status:'완료',decision:'기존 부등호대로 4/5 이상',checks:120,report:D+'/REPORT_KO.md'});item.proposal='records/release-r03b-artemia-skills-20261113/REPORT_KO.md';state.sourceQspSha256=p.after;state.activeItem='R03';state.history.push({date:'2026-11-13',item:'R03-2',result:'기술8종 최저4/5 반영·실제 엔진120검사',after:p.after});wr(sp,state);
const main=O+'/RELEASE_NOTES_CHECKLIST_KO.md';let m=fs.readFileSync(main,'utf8');a(m.includes('현재 입력은 WORK QSP `'+p.before+'`'));m=m.replace('현재 입력은 WORK QSP `'+p.before+'`','현재 입력은 WORK QSP `'+p.after+'`');m=m.replace('**현재 순서: R01·R02·R03-1 완료 → R03-2 아르테미아 기술 조건 검토.**','**현재 순서: R01·R02·R03-1·R03-2 완료 → R03의 나머지 의뢰 조건 검토.**');m=m.replace(/^\| \[ \] R03 \|.*$/m,'| [ ] R03 | 부분 완료 | 의뢰·선호 설정 비교식 | 아르테미아 외모5 및 기술8종4/5 반영. 각각 실제 엔진24·120검사 통과. 나머지 조건 별도 검토. | R03 전체 완료 아님 |');
m+='\n## R03-2 후속 반영\n\n아르테미아의 음악·이종·페티시즘은4 이상, 애무·구강·삽입·단체·역할놀이는5 이상을 실제 최저값으로 저장한다. 알려진 옛 선호 콜백도 기존 저장 로드 시 갱신한다. 실제 납품 경계와 반복 갱신·수동 편집 보존 등120검사를 통과했다. 가격·평가등급8·외모5와 다른 조건은 유지했다. [상세 기록](<'+D+'/REPORT_KO.md>). R03 나머지는 미완료다.\n';fs.writeFileSync(main,m);
const ledger=O+'/CHANGE_LEDGER_KO.md';fs.writeFileSync(ledger,fs.readFileSync(ledger,'utf8')+'\n## 빌드 준비 중 승인 후속 R03-2 — 아르테미아 기술8종 최저값\n\n2026-11-13. 사용자 승인대로4/5 이상을 대입하고 알려진 옛 저장 콜백만 갱신했다. 정의·실제 납품·저장 콜백120검사, 공식 재생/멱등/역검증 통과. 가격·평가등급8·외모5·다른 요구와 진행 보존. [상세](<'+D+'/REPORT_KO.md>).\n');
const release=rd(P+'/release-data.json');release.sourceQspSha256=p.after;a(!release.approvedFollowups.some(x=>x.id==='R03-2'));release.approvedFollowups.push({id:'R03-2',date:'2026-11-13',title:'아르테미아 기술8종 최저4/5',mod:p.id,before:p.before,after:p.after,edits:2,nativeChecks:120,report:D+'/REPORT_KO.md'});wr(P+'/release-data.json',release);
const dv=rd(P+'/document-verification.json');dv.sourceQspSha256=p.after;dv.approvedFollowupRecords=release.approvedFollowups.length;dv.latestFollowup={item:'R03-2',nativeAssertions:120,report:D+'/REPORT_KO.md'};wr(P+'/document-verification.json',dv);
const audit=P+'/AUDIT_KO.md';fs.writeFileSync(audit,fs.readFileSync(audit,'utf8')+'\n## R03-2 완료 후 갱신\n\n아르테미아 기술8종의 최저4/5 설정과 알려진 옛 콜백 갱신을 반영했다. 실제 엔진120검사 통과. 다른 R03 문제는 아직 미완료다. 현재 WORK `'+p.after+'`. [기록](<'+D+'/REPORT_KO.md>).\n');
const oldReview=P+'/R03B_ARTEMIA_SKILLS_REVIEW_KO.md';fs.writeFileSync(oldReview,'> 2026-11-13 갱신: 사용자 승인 후 반영 완료. 아래는 승인 전 제안 원문이다. [적용·검증 기록](<'+D+'/REPORT_KO.md>).\n\n'+fs.readFileSync(oldReview,'utf8'));
const idx=R+'/docs/SESSION_HANDOFF_INDEX.md';fs.writeFileSync(idx,'## 2026-11-13 Codex: 2.4.2 준비 R03-2 아르테미아 기술 최저값\n\n[수정·저장 콜백·검증](../records/release-r03b-artemia-skills-20261113/REPORT_KO.md). 음악/이종/페티시즘4 이상, 애무/구강/삽입/단체/역할놀이5 이상 사용자 승인 반영. 실제 엔진3그룹120검사, 공식 재생/멱등/역검증·구조 통과. WORK/소스/원장91e77edf 일치. R03-2 완료·R03 전체 부분완료. 개인 SAV/Full/음원/커밋푸시 변경 없음.\n\n'+fs.readFileSync(idx,'utf8'));
for(const f of ['artemia-r03b.cjs','artemia-r03b-build.cjs','artemia-r03b-native.cjs','artemia-r03b-finish.cjs'])fs.copyFileSync(f,D+'/'+f);
if(fs.existsSync(T)){
 const resolved=fs.realpathSync(T);a.equal(path.dirname(resolved).toLowerCase(),fs.realpathSync('G:/Codex/tmp').toLowerCase());a.equal(path.basename(resolved),'release-r03b-artemia-skills-20261113');
 function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const x=path.join(dir,e.name);a(!fs.lstatSync(x).isSymbolicLink(),x);if(e.isDirectory())scan(x);}}scan(resolved);fs.rmSync(resolved,{recursive:true});
}
a.equal(c.hash(fs.readFileSync(G+'/jack.qsp')),p.after);a.equal(c.hash(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')),p.after);a.equal(rd(metaPath).sourceQspSha256,p.after);
wr(D+'/verification.json',{status:'PASS',scope:'R03-2 targeted runtime and patch checks only; not full-release PASS',before:p.before,after:p.after,native:proof,replay:true,idempotence:true,inverse:true,structure:true,unchangedLocations:before.locations.length-p.changedLocations.length,newSaveFields:0,newLocations:0,personalSaveReadOrWritten:false,guiTested:false,fullReleaseValidation:false,workSourceManifest:true,taskTempRemoved:!fs.existsSync(T),duplicateWorkBackupsRemoved:duplicateBackups});
console.log(JSON.stringify({installed:true,after:p.after,nativeChecks:proof.assertions,temporaryCopiesRemoved:!fs.existsSync(T)}));
