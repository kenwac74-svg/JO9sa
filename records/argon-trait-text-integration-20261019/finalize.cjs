'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const work='G:/somi/Jack O Nine Tails v2.4_work/game',full='G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp';
const repo='G:/somi/JO9sa',build=__dirname+'/build',audit=require('./build/audit.json');
const releaseDir='G:/somi/JO9_work_backups/argon_trait_text_release_20261019/run-5ZN4to';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const sha=p=>c.hash(fs.readFileSync(p));
if(sha(work+'/jack.qsp')!==audit.before||sha(build+'/candidate.qsp')!==audit.after)throw Error('Fresh Work/candidate hash guard failed');
const report=read(releaseDir+'/report.json');if(report.verdict!=='PASS')throw Error('Release gate not PASS');
const evidence=[];
for(const [dir,count]of [['argon_traits_ui_final_20261019',3],['argon_trait_effects_combined_20261019',4],['argon_voice_final_20261019',9],['argon_lesson_final_20261019',10],['argon_menus_green_20261019',2]]){
 const p='G:/somi/JO9_work_backups/'+dir,result=read(p+'/client-results.json'),prepared=read(p+'/prepared.json');
 if(result.length!==count||result.some(r=>!r.pass))throw Error('Native check failed: '+dir);
 if(dir!=='argon_menus_green_20261019'&&prepared.inputHash!==audit.after)throw Error('Wrong native input: '+dir);
 const log=fs.readdirSync(p).filter(n=>n.endsWith('-stderr.log')).map(n=>fs.readFileSync(p+'/'+n,'utf8')).join('\n');
 if(/JO9_QA_ASSERTION_FAILED|showError|Syntax error|Incorrect syntax/i.test(log))throw Error('Native log error: '+dir);
 evidence.push({directory:p,passed:count,results:result,prepared});
}
const releaseLog=fs.readdirSync(releaseDir+'/client').filter(n=>n.endsWith('-stderr.log')).map(n=>fs.readFileSync(releaseDir+'/client/'+n,'utf8')).join('\n');
if(/JO9_QA_ASSERTION_FAILED|showError|Syntax error|Incorrect syntax/i.test(releaseLog))throw Error('Release engine log error');
// The menu-only native probe and final candidate contain byte-identical menu code.
const final=c.parse(fs.readFileSync(build+'/candidate.qsp')),loc=final.locations.find(l=>l.name==='#options');
const menu=require('./text-transform.cjs').transform('#options',fs.readFileSync(__dirname+'/current/#options.txt','utf8')).body.replace(/\r?\n/g,'\r\n');
if(c.shift(final.lines[loc.body],5)!==menu)throw Error('Menu test differs from final candidate');
const fullBefore=sha(full),saveBefore=sha(work+'/save/spete_dialogue_test.sav');
const backupDir='G:/somi/JO9_work_backups/argon_trait_text_applied_20261019';
if(fs.existsSync(backupDir))throw Error('Backup folder already exists; inspect previous transaction');
fs.mkdirSync(backupDir,{recursive:true});fs.copyFileSync(work+'/jack.qsp',backupDir+'/before.qsp');
fs.copyFileSync(build+'/candidate.qsp',backupDir+'/candidate.qsp');
const patchResult=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',work+'/jack.qsp','-ModsDir',build+'/mods'],{encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:4*1024*1024});
fs.writeFileSync(backupDir+'/apply.log',(patchResult.stdout||'')+(patchResult.stderr||''));
if(patchResult.error||patchResult.status!==0)throw Error('Official apply failed; inspect '+backupDir+'/apply.log');
if(sha(work+'/jack.qsp')!==audit.after)throw Error('Installed hash does not match tested candidate');
if(sha(full)!==fullBefore||sha(work+'/save/spete_dialogue_test.sav')!==saveBefore)throw Error('Protected Full/save changed');
const verification='실제 엔진 출고 검사 9/9 PASS, 패치 재현·재적용 검사 PASS. 최종 통합본에서 특성 UI 3/3, 효과 4/4, 발화 동작 9/9, 수업 대상 참조 10/10 검사 그룹 통과. 상점 메뉴 7개 배열의 활성·회색 2/2 검사도 통과했고 통합본의 해당 코드가 검사본과 동일함을 대조했습니다. 모든 최종 로그에서 엔진 오류·실패 단언이 없음을 별도로 확인했습니다.';
const manual=fs.readFileSync(__dirname+'/IMPLEMENTATION_MANUAL_KO.md','utf8').replace('VERIFICATION_PENDING',()=>verification+'\n\n상세 기록: '+releaseDir+'/report.json 및 records/argon-trait-text-integration-20261019/RESULT.json.');
fs.writeFileSync(__dirname+'/IMPLEMENTATION_MANUAL_KO.md',manual);
const html=fs.readFileSync(__dirname+'/comparison.html','utf8').replace('VERIFICATION_PENDING',()=>verification);
fs.writeFileSync(__dirname+'/comparison.html',html);
const record=repo+'/records/argon-trait-text-integration-20261019';fs.mkdirSync(record,{recursive:true});
for(const n of ['baseline.json','trait-mapping.json','trait-edits.json','menu-inventory.json','trait-transform.cjs','voice-transform.cjs','lesson-transform.cjs','text-transform.cjs','build.cjs','report.cjs','finalize.cjs','prepare-trait-ui-native.cjs','prepare-trait-effects-native.cjs','prepare-voice-native.cjs','prepare-lesson-native.cjs','prepare-menu-native.cjs','TRAIT_IMPLEMENTATION_SPEC.md','TRAIT_IMPLEMENTATION_VERIFICATION.md','VOICE_ACTION_MANUAL.md','LESSON_REFERENCE_AUDIT.md','IMPLEMENTATION_MANUAL_KO.md','comparison.html','비교_요약.txt'])fs.copyFileSync(__dirname+'/'+n,record+'/'+n);
fs.copyFileSync(build+'/audit.json',record+'/audit.json');
fs.copyFileSync(__dirname+'/research/FINAL_INDEPENDENT_UI_REVIEW.md',record+'/FINAL_INDEPENDENT_UI_REVIEW.md');
const mod='2026-10-19_argon_trait_text_integration.json';
if(fs.existsSync(repo+'/mods/'+mod)&&sha(repo+'/mods/'+mod)!==sha(build+'/mods/'+mod))throw Error('Different existing mod file');
fs.copyFileSync(build+'/mods/'+mod,repo+'/mods/'+mod);
fs.writeFileSync(repo+'/docs/ARGON_TRAIT_TEXT_INTEGRATION_20261019.md',manual);
const note='\n\n## 2026-10-19 아르곤 특성·누락 텍스트 통합\n\n[신규 효과·원고 비교·검증](ARGON_TRAIT_TEXT_INTEGRATION_20261019.md): 미연결 설명 7종을 실제 신규 효과와 기존 특성창·편집기에 연결했다. 기존 한국어 특성 설명 덮어쓰기 0건. 조수 상점103곳·상태안내3건 한글화, 수업·주문 대상 참조22곳 교정. 기존 특성 목록 반환 오류도 수정했다. Work만 적용했고 다음 2.4 업데이트 마무리 동기화 대상이다. Full·세이브·CSS·JSON은 변경하지 않았으며 배포 동기화·커밋·푸시는 대기한다. 비교표와 원고·구현·검사는 records/argon-trait-text-integration-20261019에 보관한다. 직전 검토 TXT 기록의 “게임 변경 없음”은 당시 상태이며, 이 문서가 7종과 누락 텍스트의 후속 반영 상태를 갱신한다. 여주인 원고·관계 사본·안개동부 보류는 기존 결정 유지.\n';
for(const n of ['SESSION_HANDOFF_INDEX.md','INDIE_UPDATE_NEXT_2_4_20261019.md']){
 const p=repo+'/docs/'+n,b=fs.readFileSync(p,'utf8');if(!b.includes('## 2026-10-19 아르곤 특성·누락 텍스트 통합'))fs.writeFileSync(p,b+note);
}
const result={createdAt:new Date().toISOString(),status:'APPLIED_WORK_ONLY',work:work+'/jack.qsp',before:audit.before,after:audit.after,backupDirectory:backupDir,officialPatchLog:backupDir+'/apply.log',release:report,releaseDirectory:releaseDir,nativeEvidence:evidence,existingKoreanTraitDescriptionOverwrites:0,newTraits:7,newQspLocations:0,changedLocations:audit.locations,full:{path:full,hashBefore:fullBefore,hashAfter:sha(full),unchanged:true},representativeSave:{hashBefore:saveBefore,hashAfter:sha(work+'/save/spete_dialogue_test.sav'),unchanged:true},commitPush:false,limitations:['GUI save selection and visual layout not tested; representative state used in native probes.','Voice traits cover common questions and rhetoric; not every independent event rewritten.','Long-term balance not verified.']};
fs.writeFileSync(record+'/RESULT.json',JSON.stringify(result,null,2));fs.writeFileSync(__dirname+'/RESULT.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({status:result.status,before:result.before,after:result.after,backup:backupDir,comparison:record+'/comparison.html',manual:repo+'/docs/ARGON_TRAIT_TEXT_INTEGRATION_20261019.md',release:report.verdict,fullUnchanged:true,saveUnchanged:true}));
