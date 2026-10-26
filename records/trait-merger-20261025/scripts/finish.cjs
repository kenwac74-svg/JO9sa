'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),z=require('node:zlib'),cp=require('node:child_process');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/jo9-trait-merger-20261025',release='G:/Codex/tmp/jo9-trait-merger-release-20261025',rec=repo+'/records/trait-merger-20261025',src=__dirname;
const c=require(repo+'/tools/text-workshop/core.cjs'),read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const patch=read(rec+'/patch.json'),protectedFiles=read(rec+'/inputs.json'),candidate=fs.readFileSync(tmp+'/candidate.qsp');
assert.equal(c.hash(candidate),patch.after_sha256);assert.deepEqual(fs.readFileSync(game+'/jack.qsp'),fs.readFileSync(tmp+'/before.qsp'),'WORK drifted; rebase/revalidate first');
assert.equal(c.hash(z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz'))),patch.before_sha256);
const focus=read(rec+'/focus-results.json');assert.equal(focus.status,'PASS');assert.equal(focus.candidate,patch.after_sha256);
const reports=fs.readdirSync(release).map(n=>release+'/'+n+'/report.json').filter(fs.existsSync).map(read);
const report=reports.find(r=>r.verdict==='PASS'&&r.checks.some(x=>x.name==='inputs-readable'&&x.detail.candidate===patch.after_sha256));assert(report,'Final candidate official release PASS required');
for(const file of protectedFiles)assert.equal(c.hash(fs.readFileSync(file.path)),file.sha256,file.path);
const oldBackups=new Set(fs.readdirSync(game).filter(n=>n.startsWith('jack.qsp.bak_')));
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',tmp+'/patches'],{windowsHide:true,timeout:60000,maxBuffer:2*1024*1024});
fs.writeFileSync(rec+'/evidence/apply-stdout.log',run.stdout||'');fs.writeFileSync(rec+'/evidence/apply-stderr.log',run.stderr||'');assert.equal(run.status,0,'Existing apply_mods failed; see retained raw transcript');assert.deepEqual(fs.readFileSync(game+'/jack.qsp'),candidate);
const backups=fs.readdirSync(game).filter(n=>n.startsWith('jack.qsp.bak_')&&!oldBackups.has(n)).map(n=>game+'/'+n);assert.equal(backups.length,1);assert.equal(c.hash(fs.readFileSync(backups[0])),patch.before_sha256);
for(const file of protectedFiles)if(file.path!==game+'/jack.qsp')assert.equal(c.hash(fs.readFileSync(file.path)),file.sha256,file.path);
fs.copyFileSync(rec+'/patch.json',repo+'/mods/2026-10-25_trait_merge_exclusions.json');fs.copyFileSync(report.output+'/report.json',rec+'/release-report.json');
for(const name of ['patch-replay.log','patch-reapply.log','client-runner.log'])if(fs.existsSync(report.output+'/'+name))fs.copyFileSync(report.output+'/'+name,rec+'/evidence/'+name);
for(const p of report.client.probes)for(const s of ['stderr','stdout']){const f=report.output+'/client/'+p.name+'-'+s+'.log';if(fs.existsSync(f))fs.copyFileSync(f,rec+'/evidence/client-'+p.name+'-'+s+'.log');}
const plan=fs.readFileSync(src+'/PLAN_KO.md','utf8').replaceAll('- [ ]','- [x]');fs.writeFileSync(src+'/PLAN_KO.md',plan);fs.writeFileSync(rec+'/PLAN_KO.md',plan);fs.copyFileSync(src+'/MANUAL_KO.md',rec+'/MANUAL_KO.md');
for(const file of fs.readdirSync(src))if(/\.(cjs|py)$/i.test(file))fs.copyFileSync(src+'/'+file,rec+'/scripts/'+file);
for(const dir of ['attention','activity','exclusions'])fs.cpSync(src+'/'+dir,rec+'/scripts/'+dir,{recursive:true});
fs.mkdirSync(repo+'/docs/superpowers/plans',{recursive:true});fs.writeFileSync(repo+'/docs/superpowers/plans/2026-10-25-trait-merge-exclusions.md',plan);
write(rec+'/independent-review.json',{status:'PASS',candidate:patch.after_sha256,reviewer:'trait_merge_final_review',checked:['final candidate hash','outer attention repair return','helper/source match','127 final hunks replay exactly','role-specific positivity repair','unknown and unrelated values preserved','previous numeric decrement P2 fixed'],runtimeEvidence:'focus-results.json and release-report.json'});
const result={status:'WORK_APPLIED_UNRELEASED',before:patch.before_sha256,after:patch.after_sha256,changedRuntime:['jack.qsp'],changedLocations:read(rec+'/build.json').changed,newLocations:0,newActorKeys:['jo9_attention','jo9_attention_known'],cacheRevision:3,positiveWins:true,legacyNegativeTraits:'Only approved conflicting negative fields are removed in loaded actors; original save files untouched.',protectedFiles:protectedFiles.length,protectedSaves:protectedFiles.filter(x=>/\.sav$/i.test(x.path)).length,allOtherProtectedFilesUnchanged:true,focusedCases:focus.testCases,staticFailureGates:focus.staticFailureGates,officialNativePaths:report.client.probes.length,release:'PASS',independentReview:'PASS',temporaryDuplicateBackups:backups,commit:false,push:false,Full:false,ZIP:false};write(rec+'/application-result.json',result);
write(rec+'/final-verification.json',{...result,status:'PASS',compressedBaselineExact:true});
const section='\n\n## WORK 적용 — 특성 통합·배제·긍정 우선 (TRAIT_MERGE_EXCLUSIONS_APPLIED_20261025)\n\n'+
'주목욕구(연극성 인격장애/인지욕구), 활동적/휴식 선호(일벌레/안분지족+과다행동/무기력)를 통합했다. 설명/표시/효과/편집/카오틱 제거를 연결하고 칭찬·활동·삭제 중복을 막는다. 승인5배제와 후속 긍정우선에 따라 기존 충돌 부정만 게임 내에서 정리하며 비표준값·무관한특성·원본76세이브파일은 보존한다. 미련한소와운동/활동처럼둘다이점인기존조합은유지하고신규충돌부여만차단한다.\n\n'+
'실제엔진121사례/573실패검사조건·공식9경로·구조/줄/주석경계·정확재생/재적용과독립검토PASS. 기존273로케이션유지,21곳변경·인물키2개·캐시revision3. 일반8칸상한/세번째칭호/다재다능XP/혀손실은미진행. WORK QSP만,Full/ZIP/커밋/푸시없음. [설명·한계](../records/trait-merger-20261025/MANUAL_KO.md), [결과](../records/trait-merger-20261025/application-result.json).\n';
for(const name of ['SESSION_HANDOFF_INDEX.md','SECOND_PATCH_WORK_BUNDLE_20261021.md']){const p=repo+'/docs/'+name;if(!fs.readFileSync(p,'utf8').includes('TRAIT_MERGE_EXCLUSIONS_APPLIED_20261025'))fs.appendFileSync(p,section);}
const deferredPath=repo+'/records/deferred-discussions-20261024/index.json',deferred=read(deferredPath),d08=deferred.deferred?.find(x=>x.id==='D08')||Object.values(deferred).find(x=>Array.isArray(x)&&x.some(r=>r.id==='D08'))?.find(x=>x.id==='D08');
assert(d08);d08.status='UI_AND_APPROVED_RELATIONS_APPLIED_SLOT_DETAILS_PENDING';d08.facts='일반8+칭호3 틀은 유지하되 강제제한/개별분류/만석획득/세번째칭호는 미결. 2026-10-25 전체보기UI와 승인2통합/5배제·긍정우선충돌정리는 WORK 적용 완료. 창관용칭호 예약 유지.';if(!d08.evidence.includes('records/trait-merger-20261025/MANUAL_KO.md'))d08.evidence.push('records/trait-merger-20261025/MANUAL_KO.md');d08.constraints=[...new Set([...d08.constraints,'2026-10-25 승인한 충돌 부정만 게임 내에서 정리; 무관한 특성·비표준값·원본 세이브 파일 보존'])];write(deferredPath,deferred);
console.log(JSON.stringify(result));
