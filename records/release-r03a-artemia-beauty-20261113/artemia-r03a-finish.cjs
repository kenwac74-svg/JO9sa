'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),cp=require('child_process'),a=require('assert/strict');const {R,G,D,T,c,qa,rd,wr,body,put}=require('./artemia-r03a.cjs');
const p=rd(D+'/plan.json'),proof=rd(D+'/native-green-report.json'),mod=rd(p.modFile),raw=fs.readFileSync(G+'/jack.qsp'),out=fs.readFileSync(T+'/candidate.qsp');a.equal(c.hash(raw),p.before);a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));a.equal(c.hash(out),p.after);a(out.equals(fs.readFileSync(T+'/replay.qsp')));a.equal(proof.sourceHash,p.after);a.equal(proof.passed,true);a.equal(proof.assertions,24);a.equal(proof.results.length,3);a(proof.results.every(x=>x.pass));qa.inspectWorld(out);a(c.serialize(c.parse(out)).equals(out));
const inverse=c.parse(out);for(const e of [...mod.edits].reverse()){const s=body(inverse,e.location);a.equal(s.split(e.new).length-1,1);put(inverse,e.location,s.replace(e.new,()=>e.old));}a(c.serialize(inverse).equals(raw));const before=c.parse(raw),next=c.parse(out);a.equal(before.locations.length,next.locations.length);for(const l of before.locations)if(!p.changedLocations.includes(l.name))a.equal(body(before,l.name),body(next,l.name),l.name);
const metaPath=R+'/assets/runtime-source-2.4.1.json',meta=rd(metaPath);a.equal(meta.sourceQspSha256,p.before);a(fs.readFileSync(metaPath).equals(z.gunzipSync(fs.readFileSync(D+'/manifest.before.json.gz'))));const filesBefore=new Set(fs.readdirSync(G));fs.writeFileSync(D+'/work-apply.log',cp.execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/apply_mods.ps1','-Qsp',G+'/jack.qsp','-ModsDir',T+'/mods'],{encoding:'utf8'}));a(fs.readFileSync(G+'/jack.qsp').equals(out));fs.writeFileSync(R+'/assets/runtime/2.4.1/jack.qsp',out);fs.copyFileSync(p.modFile,R+'/mods/'+p.id+'.json');meta.sourceQspSha256=p.after;meta.snapshotDate='2026-11-13';const row=meta.files.find(x=>x.runtimePath==='jack.qsp');a(row);row.sha256=p.after;row.bytes=out.length;meta.latestReleaseR03a={date:'2026-11-13',mod:p.id,report:'records/release-r03a-artemia-beauty-20261113/REPORT_KO.md'};wr(metaPath,meta);
const duplicateBackups=[];for(const f of fs.readdirSync(G))if(!filesBefore.has(f)&&/^jack\.qsp\.bak_\d{8}_\d{6}$/.test(f)){const full=G+'/'+f;a.equal(c.hash(fs.readFileSync(full)),p.before);a(z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz')).equals(fs.readFileSync(full)));fs.unlinkSync(full);duplicateBackups.push(f);}
fs.writeFileSync(D+'/REPORT_KO.md',`# R03-1 아르테미아 최저 외모5 이상

2026-11-13 사용자 선택에 따라 WORK/추적QSP/manifest 반영. ${p.before} → ${p.after}.

## 변경

#npc_base의 $buyer_demand['Artemia']에서 값이 저장되지 않던 demand['min_beauty'] > 4를 demand['min_beauty'] = 5로 수정했다. 실제 납품 검사의 “외모가 최저값보다 작으면 거절”과 연결되어 외모4는 거절하고5·6은 이 조건을 통과한다.

$ongload는 해당 고객의 알려진 옛 구문만 치환한다. 다른 조건·NPC·사용자 문구와 별도 편집 조건은 보존한다. 가격/평가식/기술/특성/연령/프리셋/완료한거래/소지금/진행은 바꾸지 않았다. 이미 완료된 납품을 취소하거나 보상을 회수하지 않는다. 기존 저장 캐시가 아닌 별도 커스텀 최저값은 일괄 강제 덮어쓰지 않는다.

정확 mod2개편집·기존본문2개만 변경. 새 함수·영구 필드·저장revision은 없다. 입력은 기존 요구콜백 문자열과 외모값이며,반환은 기존 slave_sell_chek의 상태코드다. 원래 거절 경로는 sl_txt100,조건을 만족하고 나머지 요구도 충족하면 기존허용1/2다. 일반거래·소문/안내에서 같은 콜백을 읽는 흐름을 보존했다. 최신조건의표시가필요하면고객정보/상담을다시연다.

제거할 때는 #npc_base의정의와 $ongload의캐시치환을 함께 역검토한다. 이후수동수정이있으면전체이전QSP로덮지말고 mod차이를검토한다. baseline.qsp.gz/manifest.before.json.gz는유일복구용으로보존한다.

## 검증

실제엔진에서옛정의의min_beauty가5로저장되지않는RED를확인했다. 최종후보3그룹24검사실패0:정의2,실제납품경계15,저장콜백7. 실제 #npc_base/$slave_price/slave_sell_chek/$ongload를사용했고가격/납품함수를대역으로바꾸지않았다. 고객의실제요구등급8도유지했다.

검사용성인인물의평가등급10·매력44 상태에서외모4→거절100,5/6→허용2를확인했다. 이름·외모·식별자·재산·퀘스트가보존됐다. 옛콜백의2회로드,수동메모/다른콜백/별도커스텀조건보존을확인했다. 최초합성인물은외모누적값이없고자동칭호가발동해등급전제를충족하지못했으므로진단상태를수정해재검사했다. 제품평가코드는변경하지않았으며초기진단과수정근거를분리보관했다.

공식재생·재적용무변경·구조/CRLF/마커·바이트역적용·대상외308본문보존을통과했다. 실제WORK공식적용후소스/manifest동일해시확인. 개인SAV의OPENGAME/CRC·시각확인·전체배포출고검사는별도다. 개인SAV는읽거나수정하지않았다.

이번검사는외모조건한건이다. 아르테미아의기술설정비교식등나머지R03은수정하지않았으며완료로처리하지않는다.

일반EXE확인:완전재시작→기존저장로드→아르테미아상담/납품을새로열기. 나머지요구를충족한인물로외모4거절·5이상허용을확인한다. Full/원본/JSON/이미지/음원/커밋푸시변경없음.
`);
const P=R+'/records/release-prep-20261113',O=R+'/docs/release-prep/2026-11-13',sp=P+'/checklist.json',state=rd(sp),item=state.items.find(x=>x.id==='R03');item.status='부분 완료';item.notes='R03-1 아르테미아 최저외모5 수정완료(실제엔진24검사). 다음 R03-2 아르테미아 기술 설정 비교식 검토. 나머지NPC/조건 미수정.';item.result='R03-1 완료, R03 전체는 미완료';item.proposal='records/release-prep-20261113/R03B_ARTEMIA_SKILLS_REVIEW_KO.md';item.subtasks=[...(item.subtasks||[]),{id:'R03-1',status:'완료',decision:'외모5이상',checks:24,report:D+'/REPORT_KO.md'}];state.sourceQspSha256=p.after;state.activeItem='R03';state.history.push({date:'2026-11-13',item:'R03-1',result:'외모5이상 반영·실제엔진24검사',after:p.after,next:'R03-2'});wr(sp,state);
const main=O+'/RELEASE_NOTES_CHECKLIST_KO.md';let m=fs.readFileSync(main,'utf8').replace('현재 입력은 WORK QSP `'+p.before+'`','현재 입력은 WORK QSP `'+p.after+'`');m=m.replace(/^\| \[ \] R03 \|.*$/m,'| [ ] R03 | 부분 완료 | 의뢰·선호 설정 비교식 | R03-1 아르테미아 최저외모5 반영·24검사통과. R03-2 기술설정과 다른NPC는 다음 검토. | R03 전체 완료 아님 |');m+='\n## R03-1 후속 반영\n\n아르테미아의 실제 최저외모를5로 저장하고 알려진 옛 요구 캐시를 갱신했다. 실제 납품검사에서4거절/5·6허용,고객등급8유지·저장반복/다른문구보존을 포함한24검사통과. [상세기록](<'+D+'/REPORT_KO.md>). 다른R03조건은아직미수정이다.\n';fs.writeFileSync(main,m);
const ledger=O+'/CHANGE_LEDGER_KO.md';fs.writeFileSync(ledger,fs.readFileSync(ledger,'utf8')+'\n## 빌드 준비 중 승인 후속 R03-1 — 아르테미아 외모5 이상\n\n2026-11-13. 잘못된비교식>4를최저값5대입으로수정하고옛요구캐시의알려진구문만갱신. 정의·실제납품·캐시24검사,공식재생/멱등/역검증통과. 가격/다른조건/진행보존. [상세](<'+D+'/REPORT_KO.md>)\n');
const release=rd(P+'/release-data.json');release.sourceQspSha256=p.after;release.approvedFollowups.push({id:'R03-1',date:'2026-11-13',title:'아르테미아 최저외모5이상',mod:p.id,before:p.before,after:p.after,edits:2,nativeChecks:24,report:D+'/REPORT_KO.md'});wr(P+'/release-data.json',release);const dv=rd(P+'/document-verification.json');dv.sourceQspSha256=p.after;dv.approvedFollowupRecords=2;dv.latestFollowup={item:'R03-1',nativeAssertions:24,report:D+'/REPORT_KO.md'};wr(P+'/document-verification.json',dv);
const audit=P+'/AUDIT_KO.md';fs.writeFileSync(audit,fs.readFileSync(audit,'utf8')+'\n## R03-1 完了後の更新\n\n2026-11-13. アルテミアの最小外見条件だけを5以上に修正した。その他のR03比較式は未修正。現在WORK `'+p.after+'`。 [R03-1記録](<'+D+'/REPORT_KO.md>)\n');
fs.writeFileSync(P+'/R03B_ARTEMIA_SKILLS_REVIEW_KO.md',`# R03-2 아르테미아 기술 조건 검토

2026-11-13. 조사/제안만이며 아직 수정하지 않았다. 현재WORK ${p.after}.

stat_importance는 slave_sell_chek에서 실제 기술 최저값으로 검사한다. 아르테미아의 현재9줄은 >비교식이라 값을 저장하지 않는다(음악1줄중복,고유기술8종).

| 기술 | 현재 비교식 | 부등호 뜻대로 저장할 최저값 |
|---|---:|---:|
| 음악·이종·페티시즘 | >3 | 4이상 |
| 애무·구강·삽입·단체·역할놀이 | >4 | 5이상 |

위4/5안은 방금외모>4를5이상으로정한것과같은해석이다. 숫자3/4를그대로최저3/4로정하는안은문턱이다르므로사용자결정대상이다. 현재는이조건들이저장되지않아수정후실제요구가엄격해진다. 전체평가등급8/새외모5/가격/다른특성·NPC조건은그대로유지한다. 승인뒤알려진옛캐시까지맞추고각기술의경계/실제납품을검증한다.
`);
const idx=R+'/docs/SESSION_HANDOFF_INDEX.md';fs.writeFileSync(idx,'## 2026-11-13 Codex: 2.4.2 준비 R03-1 아르테미아 외모5\n\n[수정·캐시·검증](../records/release-r03a-artemia-beauty-20261113/REPORT_KO.md). min_beauty>4 무대입을=5로수정,구저장알려진콜백만갱신. 실제엔진3그룹24검사(외모4거절/5·6허용,실제고객등급8),공식재생/멱등/역검증/구조통과. WORK/소스/manifest d64c3500일치. R03-1완료/R03전체부분완료,기술비교식은다음컨펌. 개인SAV/Full/음원/커밋푸시없음.\n\n'+fs.readFileSync(idx,'utf8'));
for(const f of ['artemia-r03a.cjs','artemia-r03a-build.cjs','artemia-r03a-native.cjs','artemia-r03a-flow.cjs','artemia-r03a-finish.cjs'])fs.copyFileSync(f,D+'/'+f);
if(fs.existsSync(T)){const resolved=fs.realpathSync(T);a.equal(path.dirname(resolved).toLowerCase(),fs.realpathSync('G:/Codex/tmp').toLowerCase());a.equal(path.basename(resolved),'release-r03a-artemia-beauty-20261113');function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const x=path.join(dir,e.name);a(!fs.lstatSync(x).isSymbolicLink(),x);if(e.isDirectory())scan(x);}}scan(resolved);fs.rmSync(resolved,{recursive:true});}
a.equal(c.hash(fs.readFileSync(G+'/jack.qsp')),p.after);a.equal(c.hash(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')),p.after);a.equal(rd(metaPath).sourceQspSha256,p.after);wr(D+'/verification.json',{status:'PASS',before:p.before,after:p.after,native:proof,replay:true,idempotence:true,inverse:true,structure:true,unchangedLocations:before.locations.length-p.changedLocations.length,newSaveFields:0,newLocations:0,personalSaveReadOrWritten:false,guiTested:false,fullReleaseValidation:false,workSourceManifest:true,taskTempRemoved:!fs.existsSync(T),duplicateWorkBackupsRemoved:duplicateBackups});console.log(JSON.stringify({installed:true,after:p.after,nativeChecks:24,next:'R03-2',temporaryCopiesRemoved:!fs.existsSync(T)}));
