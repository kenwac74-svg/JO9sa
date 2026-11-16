'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),cp=require('child_process'),a=require('assert/strict');
const {R,G,D,T,c,qa,rd,wr,body,put}=require('./joker-r02-task.cjs');
const p=rd(D+'/plan.json'),proof=rd(D+'/native-green-report.json'),mod=rd(p.modFile),candidate=fs.readFileSync(T+'/candidate.qsp'),raw=fs.readFileSync(G+'/jack.qsp');
a.equal(c.hash(raw),p.before);a.equal(c.hash(candidate),p.after);a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));a(candidate.equals(fs.readFileSync(T+'/replay.qsp')));a.equal(proof.sourceHash,p.after);a.equal(proof.passed,true);a.equal(proof.assertions,106);a.equal(proof.results.length,3);a(proof.results.every(x=>x.pass));qa.inspectWorld(candidate);a(c.serialize(c.parse(candidate)).equals(candidate));
const inverse=c.parse(candidate);for(const e of [...mod.edits].reverse()){const b=body(inverse,e.location);a.equal(b.split(e.new).length-1,1);put(inverse,e.location,b.replace(e.new,()=>e.old));}a(c.serialize(inverse).equals(raw));
const base=c.parse(raw),next=c.parse(candidate);for(const l of base.locations)if(!p.changedLocations.includes(l.name))a.equal(body(base,l.name),body(next,l.name),l.name);a.equal(base.locations.length,next.locations.length);
const manifestPath=R+'/assets/runtime-source-2.4.1.json',metaRaw=fs.readFileSync(manifestPath);a(metaRaw.equals(z.gunzipSync(fs.readFileSync(D+'/manifest.before.json.gz'))));const meta=rd(manifestPath);a.equal(meta.sourceQspSha256,p.before);const beforeFiles=new Set(fs.readdirSync(G));
const log=cp.execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/apply_mods.ps1','-Qsp',G+'/jack.qsp','-ModsDir',T+'/mods'],{encoding:'utf8'});fs.writeFileSync(D+'/work-apply.log',log);a(fs.readFileSync(G+'/jack.qsp').equals(candidate));fs.writeFileSync(R+'/assets/runtime/2.4.1/jack.qsp',candidate);fs.copyFileSync(p.modFile,R+'/mods/'+p.id+'.json');meta.sourceQspSha256=p.after;meta.snapshotDate='2026-11-13';const item=meta.files.find(x=>x.runtimePath==='jack.qsp');a(item);item.sha256=p.after;item.bytes=candidate.length;meta.latestReleaseR02={date:'2026-11-13',mod:p.id,report:'records/release-r02-joker-20261113/REPORT_KO.md'};wr(manifestPath,meta);
const deletedBackups=[];for(const f of fs.readdirSync(G))if(!beforeFiles.has(f)&&/^jack\.qsp\.bak_\d{8}_\d{6}$/.test(f)){const file=G+'/'+f;a.equal(c.hash(fs.readFileSync(file)),p.before);a(z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz')).equals(fs.readFileSync(file)));fs.unlinkSync(file);deletedBackups.push(f);}
const report=`# R02 조커 재구매 차단

2026-11-13 사용자 승인으로 WORK·추적 QSP·manifest에 반영했다.
기준 ${p.before} → ${p.after}.

## 변경과 보존

- 구매 메뉴의 오타 jokr 대신 실제 구매 기록 joker를 검사한다. 예전 jokr값을 추정 구매 기록으로 이관하거나 삭제하지 않는다.
- 구매번호6244 진입에서 미구매·3000스파크 이상·주 노예 칸 비어 있음이라는 기존 메뉴의 조건을 다시 검사한다. 저장된 링크라도 조건을 벗어나면 구매 메뉴로 돌아간다. 생성·역할 교환·차감을 하지 않는다.
- 옛 $KulaShop_options[2]와 조커 콜백이 있는 $display_options에서 알려진 “if jokr = 0:”만 교체한다. 사용자 문구와 다른 메뉴/조건은 보존한다.
- $ongload에서 이 작은 캐시 모드를 호출하고,현재 쿨라의 해당 구매 화면이면 거래를 실행하지 않고 다시 그린다. 전체 #options/인물 데이터베이스를 재생성하지 않는다.
- 가격3000,8885 템플릿·프리셋·브랜드·생성·교환·구매 완료 기록 자체는 원래 본문 그대로다. 기존 인물의 작명·기술·관계·장비·소유일·퀘스트·소지품을 초기화하지 않는다. 개인SAV는 읽거나 쓰지 않았다.

## 호출·입력·반환·부작용·해제

mods/${p.id}.json의 정확 편집5개,기존3본문(#options/interaction_city/$ongload)만 변경했다. 새 로케이션·영구 필드·저장 revision은 없다.

#options의 인수 jo9_joker_menu_cache는 저장 메뉴 문자열을 읽고 조건 한 구문만 치환한 뒤 반환한다. iteration 변수는 LOCAL이다. 입력 금액·joker·슬롯·배우 상태를 바꾸지 않는다. 거래 입구는 실패 시 shop_general로 이동하고 sp_txt2/skip_to0 등 표시 상태만 설정한다. 정상 거래는 원래 흐름으로 내려간다. 로드 끝의 재표시는 현재 쿨라 구매 페이지에서만 실행한다.

해제하려면 조건 키·입구 검사·로드 캐시/재표시를 함께 역검토한다. 캐시 갱신만 제거하면 옛 저장의 잘못된 메뉴가 남을 수 있다. 이후 수동 수정이 있으면 전체 과거 QSP 덮어쓰기 대신 mod 차이를 검토한다. 기준 QSP/manifest gzip은 최소 복구 자료다.

## 검증과 한계

기준본의 실제 메뉴에서 joker1/jokr0 상태에도 링크·상품명이 남는 RED 2개를 확인했다. 최종 후보는 실제 엔진3그룹106검사 실패0: 메뉴25,거래75,로드6. 실제 #options/$menu,generate_stock·역할 교환·6244 거래 분기와 전체 $ongload·실제 구매 메뉴 재표시를 실행했다.

첫 구매/3000경계/2999/빈칸 없음/구매 완료 후 빈칸·다른 인물/동일 링크 재호출/유효한 비0기록/오타변수만1인 상태를 확인했다. 저장된 사용자 메뉴 문구·다른 메뉴·기존 조수·주 노예 표시값·퀘스트/소지품/금액이 보존됐다. 구매 메뉴 로드2회를 연속 실행해 재차감·중복 생성이 없음을 확인했다.

거래 검사에서는 화면으로 넘어가는 종료점을 계측했으며 생성·교환 함수는 대역으로 바꾸지 않았다. 로드 검사는 합성 상태의 실제 콜백/렌더러이며 개인SAV의 OPENGAME/CRC·전체 실제UI로드 증거가 아니다. 픽셀 외형은 시각 검사하지 않았다.

공식 적용기 재생·재적용 무변경·구조/CRLF/마커·바이트 역적용과 대상 외 본문 보존을 통과했다. 공식 적용기로 실제 WORK에 반영하고 추적 QSP/manifest 같은 해시를 확인했다. 전체 배포 출고검사는 별도다.

일반 EXE 확인: 게임 재시작→기존 저장 로드→쿨라 구매 메뉴. 이미 구매했으면 조커 항목이 없어야 하고,미구매/빈칸/3000 이상이면 기존 가격으로 한 번만 구매되어야 한다.

Full·원본·JSON·이미지·음원·기존 저장·커밋·푸시 변경 없음. R02 완료,다음 R03은 조사/범위 확인 단계다.
`;
fs.writeFileSync(D+'/REPORT_KO.md',report);
const prep=R+'/records/release-prep-20261113',state=rd(prep+'/checklist.json'),entry=state.items.find(x=>x.id==='R02');entry.status='완료';entry.result='실제 엔진3그룹106검사·공식재생/멱등/역검증 통과. 메뉴키·저장캐시·거래입구 보완.';entry.notes='가격3000/8885프리셋/기존 영입 인물·재산·진행 보존. 실제 개인SAV UI로드는 별도.';entry.checkedAt='2026-11-13';entry.report='records/release-r02-joker-20261113/REPORT_KO.md';state.activeItem='R03';state.sourceQspSha256=p.after;state.history=state.history||[];state.history=state.history.filter((e,i,ar)=>!(i>0&&e.item===ar[i-1].item&&e.decision===ar[i-1].decision&&e.date===ar[i-1].date));state.history.push({date:'2026-11-13',item:'R02',result:entry.result,after:p.after,next:'R03'});wr(prep+'/checklist.json',state);
const O=R+'/docs/release-prep/2026-11-13',main=O+'/RELEASE_NOTES_CHECKLIST_KO.md';let m=fs.readFileSync(main,'utf8');m=m.replace('현재 입력은 WORK QSP `'+p.before+'`','현재 입력은 WORK QSP `'+p.after+'`').replace('**현재 순서: R01 완료 → R02 조커 재구매 플래그 검토.**','**현재 순서: R01·R02 완료 → R03 의뢰·선호 설정 비교식 검토.**');m=m.replace(/^\| \[ \] R02 \|.*$/m,'| [x] R02 | 완료 | 조커 재구매 플래그 | 메뉴 검사·기존 저장 캐시·거래 입구를 joker 기준으로 통일. 가격·프리셋·기존 인물 보존. | 실제 엔진106검사·공식재생/멱등/역검증 통과 |');m=m.replace('## 누락 감사의 현재 결론','## R02 후속 반영\n\n조커 재구매 차단을 보완했다. 새 구매·저장 링크·금액/빈칸 조건과 옛 메뉴 캐시를 실제 엔진106검사로 확인했다. '+`[상세 기록](<${D}/REPORT_KO.md>)`+'\n\n## 누락 감사의 현재 결론');m=m.replace('- 118개 모드 기록의','- 최초 감사 입력2ad5be48의 118개 모드 기록의');m+='\nR02 이후 승인 모드1개/편집5개는 위 최초 감사와 별도 후속이다. 새 입력으로 공식 재생·역적용해 이전 감사본과의 차이를 확인했다. 전체 출고 PASS를 뜻하지 않는다.\n';fs.writeFileSync(main,m);
const release=rd(prep+'/release-data.json');release.sourceAuditQspSha256=release.sourceAuditQspSha256||release.sourceQspSha256;release.sourceQspSha256=p.after;release.approvedFollowups=release.approvedFollowups||[];release.approvedFollowups.push({id:'R02',date:'2026-11-13',title:'조커 재구매 차단',mod:p.id,before:p.before,after:p.after,edits:5,nativeChecks:106,report:D+'/REPORT_KO.md'});wr(prep+'/release-data.json',release);
const audit=prep+'/AUDIT_KO.md';let text=fs.readFileSync(audit,'utf8');text=text.replace('## 먼저 검토할 기능 잔여','## R02 완료 후 상태\n\n2026-11-13 조커 구매 키/저장 메뉴/거래 입구 수정과 실제 엔진106검사를 완료했다. 현재 WORK는 `'+p.after+'`. 아래는 최초2ad5be48 감사의 근거를 보존하며 G01은 해결됐다. '+`[R02 상세](<${D}/REPORT_KO.md>)`+'\n\n## 먼저 검토할 기능 잔여');text=text.replace('### G01 조커 재구매 차단 플래그 불일치\n\n- 상태: 현재 실행코드 불일치 확인;수정 미적용;게임 재현 미실행','### G01 조커 재구매 차단 플래그 불일치\n\n- 상태: R02 수정·실제 엔진 검증 완료. 아래 위치/불일치 근거는 수정 전 감사 기록이다.');fs.writeFileSync(audit,text);
const idx=R+'/docs/SESSION_HANDOFF_INDEX.md';fs.writeFileSync(idx,'## 2026-11-13 Codex: 2.4.2 준비 R02 조커 재구매 차단 완료\n\n[수정·사용·보존·검증](../records/release-r02-joker-20261113/REPORT_KO.md). 실제구매 joker키로 메뉴 통일·구저장 조건만 갱신·6244 거래입구 검사,가격3000/프리셋/기존인물보존. 실제엔진3그룹106검사·공식재생/멱등/역검증/구조 통과. WORK/소스/manifest f03580b7 일치,개인SAV OPENGAME/시각검사 미실시. 체크리스트R02완료/R03다음,포장/이관/Full/음원/커밋푸시없음.\n\n'+fs.readFileSync(idx,'utf8'));
for(const file of ['joker-r02-task.cjs','joker-r02-build.cjs','joker-r02-native.cjs','joker-r02-flow.cjs','joker-r02-finish.cjs'])fs.copyFileSync(file,D+'/'+file);
const v={status:'PASS',before:p.before,after:p.after,native:proof,replay:true,idempotence:true,inverse:true,structure:true,unchangedLocations:base.locations.length-p.changedLocations.length,transactionPreserved:true,price:3000,newPersistentFields:0,newLocations:0,personalSaveReadOrWritten:false,guiTested:false,fullReleaseValidation:false,duplicateWorkBackupsRemoved:deletedBackups};
if(fs.existsSync(T)){const root=fs.realpathSync(T);a.equal(path.dirname(root).toLowerCase(),fs.realpathSync('G:/Codex/tmp').toLowerCase());a.equal(path.basename(root),'release-r02-joker-20261113');function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);a(!fs.lstatSync(f).isSymbolicLink(),f);if(e.isDirectory())scan(f);}}scan(root);fs.rmSync(root,{recursive:true});}
a.equal(c.hash(fs.readFileSync(G+'/jack.qsp')),p.after);a.equal(c.hash(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')),p.after);a.equal(rd(manifestPath).sourceQspSha256,p.after);v.workSourceManifest=true;v.taskTemporaryCopiesRemoved=!fs.existsSync(T);wr(D+'/verification.json',v);console.log(JSON.stringify({installed:true,after:p.after,checks:proof.assertions,temporaryCopiesRemoved:v.taskTemporaryCopiesRemoved,checklist:'R02 complete -> R03'}));
