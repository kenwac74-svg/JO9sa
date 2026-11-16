'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),cp=require('child_process'),a=require('assert/strict');
const {R,G,D,T,c,qa,rd,wr,body,put}=require('./leshiy-r03d.cjs');
const p=rd(D+'/plan.json'),proof=rd(D+'/native-green-report.json'),mod=rd(p.modFile),raw=fs.readFileSync(G+'/jack.qsp'),out=fs.readFileSync(T+'/candidate.qsp');
a.equal(c.hash(raw),p.before);a(raw.equals(z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz'))));a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));a.equal(c.hash(out),p.after);a(out.equals(fs.readFileSync(T+'/replay.qsp')));a.equal(proof.sourceHash,p.after);a.equal(proof.passed,true);a.equal(proof.assertions,30);a.equal(proof.results.length,2);a(proof.results.every(x=>x.pass));a(fs.readFileSync(D+'/official-idempotence.log','utf8').includes('모든 edit가 이미 적용'));
const redCases=rd(D+'/cases-red.json'),greenCases=rd(D+'/cases-green.json');a.equal(greenCases.length,7);for(let i=0;i<greenCases.length;i++){a.equal(greenCases[i].price,redCases[i].price,greenCases[i].label);a(greenCases[i].price>0);a.equal(greenCases[i].rating,redCases[i].rating,greenCases[i].label);a.equal(greenCases[i].actualResult,greenCases[i].want,greenCases[i].label);}qa.inspectWorld(out);a(c.serialize(c.parse(out)).equals(out));
const inverse=c.parse(out);for(const e of [...mod.edits].reverse()){const s=body(inverse,e.location);a.equal(s.split(e.new).length-1,1);put(inverse,e.location,s.replace(e.new,()=>e.old));}a(c.serialize(inverse).equals(raw));const before=c.parse(raw),next=c.parse(out);a.equal(before.locations.length,next.locations.length);for(const l of before.locations)if(!p.changedLocations.includes(l.name))a.equal(body(before,l.name),body(next,l.name),l.name);
const metaPath=R+'/assets/runtime-source-2.4.1.json',meta=rd(metaPath);a.equal(meta.sourceQspSha256,p.before);a(fs.readFileSync(metaPath).equals(z.gunzipSync(fs.readFileSync(D+'/manifest.before.json.gz'))));const filesBefore=new Set(fs.readdirSync(G));
fs.writeFileSync(D+'/work-apply.log',cp.execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/apply_mods.ps1','-Qsp',G+'/jack.qsp','-ModsDir',T+'/mods'],{encoding:'utf8'}));a(fs.readFileSync(G+'/jack.qsp').equals(out));fs.writeFileSync(R+'/assets/runtime/2.4.1/jack.qsp',out);fs.copyFileSync(p.modFile,R+'/mods/'+p.id+'.json');meta.sourceQspSha256=p.after;meta.snapshotDate='2026-11-13';const row=meta.files.find(x=>x.runtimePath==='jack.qsp');a(row);row.sha256=p.after;row.bytes=out.length;meta.latestReleaseR03d={date:'2026-11-13',mod:p.id,report:'records/release-r03d-leshiy-sensitivity-20261113/REPORT_KO.md'};wr(metaPath,meta);
const duplicateBackups=[];for(const f of fs.readdirSync(G))if(!filesBefore.has(f)&&/^jack\.qsp\.bak_\d{8}_\d{6}$/.test(f)){const full=G+'/'+f;a(z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz')).equals(fs.readFileSync(full)));fs.unlinkSync(full);duplicateBackups.push(f);}
fs.writeFileSync(D+'/REPORT_KO.md',`# R03-4 레시 감수성 상한 3

2026-11-13 사용자 승인대로 WORK·추적 QSP·runtime 원장에 반영했다.

## 결과

레시에게 납품할 때 감수성3 이하는 허용하고4 이상은 거절한다. 기존 <4 비교식은 값을 저장하지 않았으므로 아무 제한을 주지 못했다. 이를 최저값3 대입으로 바꾸면 조건이 반대로 되기 때문에 상한을 별도로 검사한다.

현재 초기화와 데이터 새로고침이 사용하는 #npc_base의 레시 선호에 stat_importance['max_sensitivity']=3을 저장한다. 공통 slave_sell_chek는 기존 선호 콜백을 실행한 직후 이 상한이 양수이고 인물 감수성이 상한을 넘으면 기존 기술/속성 거절 상태 sl_txt=102로 종료한다. 상한이 없는 다른 고객에는 제한을 추가하지 않는다. 이 조건표는 각 납품 검사 시작의 기존 killvar로 초기화돼 다른 고객에게 남지 않는다.

기존 저장용 $ongload는 레시 선호 문자열 안의 알려진 옛 stat_importance['sensitivity'] < 4만 새 상한 표현으로 치환한다. 사용자 메모·다른 고객·별도로 편집한 상한은 보존한다. 새 인물별 영구 저장 필드·로케이션·수정 버전은 없다. 기존 임시 조건표에 상한 키1개를 사용하며, 별도 인물 데이터나 완료 거래는 바꾸지 않는다.

가격·전체 평가·다른 기술과 특성·체력/인지도 등 다른 요구·퀘스트/소지금/보관 물품/이름은 유지한다. 이번 수정으로 다른 미연결 요구까지 함께 강제하지 않는다. 실제 수정은 #npc_base·slave_sell_chek·$ongload 세 본문에 각각 정확 편집1개다. 과거의 별도 #npc_base_woman은 현재 호출 경로가 없어 이번 범위에서 바꾸지 않았다.

## 검증

- 변경 전 실제 엔진에서 감수성4·5 통과 및 옛 저장 조건의 상한 누락을 재현했다.
- 변경 후 실제 엔진2그룹30개 검사 통과: 실제 납품 경계21,실제 $ongload 및 저장 선호9.
- 성인 합성 인물로 감수성0/3 허용·4/5 거절,간호 기술 미달 거절,곧이어 거래한 아주라·아르테미아에 상한 잔류가 없는 것을 확인했다. 실제 납품·가격 함수를 대역으로 바꾸지 않았다.
- 알려진 옛 선호에 사용자 메모가 있어도 두 번의 실제 로드 후3 허용·4 거절을 유지했다. 다른 고객 콜백과 별도 사용자 상한2를 보존했다.
- 경계7사례 모두 변경 전후 가격·평가 결과가 같고 인물과 재산·진행을 보존했다. cases-red/green.json에 결과를 남겼다.
- 최초 진단은 감수성0 인물에게 불필요하게 평가8을 요구해 실제 고객 요구를 충족한 평가7을 실패로 기록했다. 검사 전제를 실제 고객 요구등급으로 바로잡고 RED부터 다시 확인했다. 제품 평가식은 수정하지 않았고 초기 진단·수정 근거는 별도 보관했다.
- 공식 적용기 재생·재적용 무변경,구조·CRLF·마커·바이트 왕복·역적용 복원과 대상 외307본문 보존을 통과했다. WORK 적용 후 추적본·원장 해시를 대조했다.

개인 SAV의 실제 불러오기·CRC·화면과 2.4.2 전체 출고 검사는 별도다. 이번 결과는 R03-4 완료이며 R03 전체 또는 배포 완료를 뜻하지 않는다.

일반 EXE 확인: 게임 완전 재시작 → 기존 저장 불러오기 → 레시 납품을 새로 연다. 나머지 요구를 충족한 인물로 감수성3 허용·4 거절을 확인한다.

## 유지보수

입력은 기존 선호 문자열·감수성값,출력은 기존 납품 상태다. 초기화/새로고침과 $ongload,실제 납품 흐름에 의존한다. 제거할 때는 정의·캐시 치환·상한 검사를 함께 역검토해야 한다. 이후 수정이 있으면 전체 옛 QSP로 덮어쓰지 말고 mod 차이를 검토한다. baseline.qsp.gz·manifest.before.json.gz는 수정 직전 최소 복구 자료다.

${p.before} → ${p.after}. Full·음원·이미지·JSON·커밋·푸시는 변경하지 않았다. 재생성 가능한 진단 사본과 스크립트 중복은 정리하고 보고서·재현 스크립트를 보존한다.
`);
const P=R+'/records/release-prep-20261113',O=R+'/docs/release-prep/2026-11-13',sp=P+'/checklist.json',state=rd(sp),item=state.items.find(x=>x.id==='R03');a(!item.subtasks.some(x=>x.id==='R03-4'));item.status='부분 완료';item.result='R03-1~4 완료, R03 전체는 미완료';item.notes='아르테미아 외모/기술/특성 요구와 레시 감수성3이하 상한 반영 완료. R03-4 실제 엔진30검사. 레시의 다른 요구는 별도 검토.';item.subtasks.push({id:'R03-4',status:'완료',decision:'감수성3이하 상한',checks:30,report:D+'/REPORT_KO.md'});item.proposal='records/release-r03d-leshiy-sensitivity-20261113/REPORT_KO.md';state.sourceQspSha256=p.after;state.history.push({date:'2026-11-13',item:'R03-4',result:'레시 감수성3이하 상한·옛선호 갱신·엔진30검사',after:p.after});wr(sp,state);
const main=O+'/RELEASE_NOTES_CHECKLIST_KO.md';let m=fs.readFileSync(main,'utf8');a(m.includes('현재 입력은 WORK QSP `'+p.before+'`'));m=m.replace('현재 입력은 WORK QSP `'+p.before+'`','현재 입력은 WORK QSP `'+p.after+'`').replace('**현재 순서: R01·R02·R03-1·R03-2·R03-3 완료 → R03-4 레시 의뢰 조건 검토.**','**현재 순서: R01·R02·R03-1~4 완료 → 레시의 나머지 의뢰 조건 검토.**');m=m.replace(/^\| \[ \] R03 \|.*$/m,'| [ ] R03 | 부분 완료 | 의뢰·선호 설정 비교식 | 아르테미아 외모/기술/특성 요구와 레시 감수성3이하 상한 반영. R03-4 엔진30검사 통과. | 다른 요구 별도 검토·R03 전체 미완료 |');m=m.replace('## 다음 확인 R03-4','## R03-4 확인 기록 — 완료').replace('레시의 감수성<4 비교식도 값이 저장되지 않는다. 감수성3이하를 허용하는 상한 검사로 연결할지 확인한다.','레시 감수성3이하 상한은 사용자 승인 후 반영했다.').replace('R03D_LESHIY_SENSITIVITY_REVIEW_KO.md>). 아직 적용하지 않았다.','R03D_LESHIY_SENSITIVITY_REVIEW_KO.md>). 검토 원문은 보존한다.');m+='\n## R03-4 후속 반영\n\n레시 감수성3이하 허용·4이상 거절 상한을 실제 납품에 연결하고 알려진 옛 저장 선호만 갱신했다. 실제 엔진30검사,7사례 가격/평가 보존 및 공식 재생/멱등/역검증 통과. [상세 기록](<'+D+'/REPORT_KO.md>). 다른 의뢰 조건은 별도 검토한다.\n';fs.writeFileSync(main,m);
const ledger=O+'/CHANGE_LEDGER_KO.md';fs.writeFileSync(ledger,fs.readFileSync(ledger,'utf8')+'\n## 빌드 준비 중 승인 후속 R03-4 — 레시 감수성 상한\n\n2026-11-13. 감수성3이하 상한과 알려진 옛 선호 캐시를 연결했다. 실제 엔진30검사·7사례 가격/평가 보존,공식 재생/멱등/역검증 통과. 다른 요구는 별도 검토한다. [상세](<'+D+'/REPORT_KO.md>).\n');
const release=rd(P+'/release-data.json');release.sourceQspSha256=p.after;a(!release.approvedFollowups.some(x=>x.id==='R03-4'));release.approvedFollowups.push({id:'R03-4',date:'2026-11-13',title:'레시 감수성3이하 상한',mod:p.id,before:p.before,after:p.after,edits:3,nativeChecks:30,report:D+'/REPORT_KO.md'});wr(P+'/release-data.json',release);const dv=rd(P+'/document-verification.json');dv.sourceQspSha256=p.after;dv.approvedFollowupRecords=release.approvedFollowups.length;dv.latestFollowup={item:'R03-4',nativeAssertions:30,report:D+'/REPORT_KO.md'};wr(P+'/document-verification.json',dv);
const audit=P+'/AUDIT_KO.md';fs.writeFileSync(audit,fs.readFileSync(audit,'utf8')+'\n## R03-4 완료 후 갱신\n\n레시의 감수성3이하 상한 및 알려진 옛 저장 선호 갱신을 반영했다. 실제 엔진30검사·7사례 가격/평가 보존. 다른 요구는 미수정이다. 현재 WORK `'+p.after+'`. [기록](<'+D+'/REPORT_KO.md>).\n');
const oldReview=P+'/R03D_LESHIY_SENSITIVITY_REVIEW_KO.md';fs.writeFileSync(oldReview,'> 2026-11-13 갱신: 사용자 승인으로 감수성3이하 상한 반영 완료. 아래는 승인 전 검토 원문이다. [적용·검증](<'+D+'/REPORT_KO.md>).\n\n'+fs.readFileSync(oldReview,'utf8'));
const idx=R+'/docs/SESSION_HANDOFF_INDEX.md';fs.writeFileSync(idx,'## 2026-11-13 Codex: 2.4.2 준비 R03-4 레시 감수성 상한\n\n[수정·저장 선호·실제 납품 검증](../records/release-r03d-leshiy-sensitivity-20261113/REPORT_KO.md). 감수성3이하 허용·4이상 거절 사용자 승인 반영. 실제 엔진2그룹30검사·7사례 가격/평가 보존,공식 재생/멱등/역검증·구조 통과. WORK/소스/원장1efab505 일치. R03-4 완료·나머지 요구 검토 중. 개인 SAV/Full/음원/커밋푸시 변경 없음.\n\n'+fs.readFileSync(idx,'utf8'));
for(const f of ['leshiy-r03d.cjs','leshiy-r03d-build.cjs','leshiy-r03d-native.cjs','leshiy-r03d-finish.cjs'])fs.copyFileSync(f,D+'/'+f);
if(fs.existsSync(T)){const resolved=fs.realpathSync(T);a.equal(path.dirname(resolved).toLowerCase(),fs.realpathSync('G:/Codex/tmp').toLowerCase());a.equal(path.basename(resolved),'release-r03d-leshiy-sensitivity-20261113');function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const x=path.join(dir,e.name);a(!fs.lstatSync(x).isSymbolicLink(),x);if(e.isDirectory())scan(x);}}scan(resolved);fs.rmSync(resolved,{recursive:true});}
a.equal(c.hash(fs.readFileSync(G+'/jack.qsp')),p.after);a.equal(c.hash(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')),p.after);a.equal(rd(metaPath).sourceQspSha256,p.after);wr(D+'/verification.json',{status:'PASS',scope:'R03-4 targeted runtime and patch checks; not full-release PASS',before:p.before,after:p.after,native:proof,priceAndRatingUnchangedCases:7,replay:true,idempotence:true,inverse:true,structure:true,unchangedLocations:307,newActorSaveFields:0,newLocations:0,scratchKey:'stat_importance[max_sensitivity]',personalSaveReadOrWritten:false,guiTested:false,fullReleaseValidation:false,workSourceManifest:true,taskTempRemoved:!fs.existsSync(T),duplicateWorkBackupsRemoved:duplicateBackups});console.log(JSON.stringify({installed:true,after:p.after,nativeChecks:30,priceUnchangedCases:7,temporaryCopiesRemoved:!fs.existsSync(T)}));
