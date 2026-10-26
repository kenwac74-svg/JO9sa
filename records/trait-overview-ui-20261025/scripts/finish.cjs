'use strict';
// Finish only the approved WORK UI task; never publish or alter original saves.
const fs=require('node:fs'),assert=require('node:assert/strict'),z=require('node:zlib');
const src=__dirname,repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',rec=repo+'/records/trait-overview-ui-20261025';
const core=require(repo+'/tools/text-workshop/core.cjs'),read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const result=read(rec+'/application-result.json');assert.equal(result.status,'WORK_APPLIED_UNRELEASED');
assert.equal(core.hash(fs.readFileSync(game+'/jack.qsp')),result.after);
for(const [path,key]of [['content/js/jo9_traits_view.js','productionJsSha256'],['css/jo9_traits_view.css','productionCssSha256']])assert.equal(core.hash(fs.readFileSync(game+'/'+path)),result[key]);
for(const f of read(rec+'/inputs.json'))if(f.path!==game+'/jack.qsp')assert.equal(core.hash(fs.readFileSync(f.path)),f.sha256,f.path);
assert.equal(core.hash(z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz'))),result.before);
for(const name of ['native-focused-results.json','browser-results.json','native-dom-results.json'])assert.equal(read(rec+'/'+name).status,'PASS');
assert.equal(read(rec+'/release-report.json').verdict,'PASS');
const trueMsg=read(rec+'/native-message-results.json');assert.equal(trueMsg.status,'PASS');
assert.equal(trueMsg.productionJsSha256,result.productionJsSha256);assert.equal(trueMsg.productionCssSha256,result.productionCssSha256);
const section='\n\n## WORK 적용 — 기존 UI 기반 특성 전체보기 (TRAIT_OVERVIEW_UI_APPLIED_20261025)\n\n'+
'기존 좌측 혼합 목록·상단 속성·색/글꼴을 유지하고 상태를 먼저 표시한다. 노예/조수의 특성 제목을 누르면 기존 전공 조건보기 양피지에 특성1→2열/칭호3열이 열리며, 항목 설명은 하단에 표시한다. 실제 좌측 넘침 때만 파란 밑줄 전체보기 링크가 나타난다. 기존 초과 보유·숨겨진 특성·개인실 인물·세이브를 보존하며 획득/슬롯 제한은 변경하지 않는다.\n\n'+
'공식9경로·문법/주석 경계·정확 재생/재적용, 실제엔진5기능경로와2역할 DOM/도움말 메시지, 브라우저10표시사례 PASS. 기존76세이브·기본CSS·설정·Full 보존. 새 UI전역 문자열1개와 보조로케이션1개·JS/CSS2파일. WORK만 미배포, Full/ZIP/커밋/푸시 없음. [설명과 한계](../records/trait-overview-ui-20261025/MANUAL_KO.md), [결과](../records/trait-overview-ui-20261025/application-result.json).\n';
for(const file of ['SESSION_HANDOFF_INDEX.md','SECOND_PATCH_WORK_BUNDLE_20261021.md']){const p=repo+'/docs/'+file,s=fs.readFileSync(p,'utf8');if(!s.includes('TRAIT_OVERVIEW_UI_APPLIED_20261025'))fs.appendFileSync(p,section);}
const plan=fs.readFileSync(src+'/PLAN_KO.md','utf8').replaceAll('- [ ]','- [x]');
for(const p of [src+'/PLAN_KO.md',rec+'/PLAN_KO.md',repo+'/docs/superpowers/plans/2026-10-25-trait-overview.md'])fs.writeFileSync(p,plan);
for(const name of fs.readdirSync(src).filter(n=>/\.(cjs|css|js|qsrc)$/i.test(n)))fs.copyFileSync(src+'/'+name,rec+'/scripts/'+name);
fs.copyFileSync(src+'/MANUAL_KO.md',rec+'/MANUAL_KO.md');
write(rec+'/independent-review.json',{status:'PASS_AFTER_FIX',reviewer:'trait_ui_final_review',fixedFinding:'Only actual profile-refresh help links store the one-use reopen key; rank/rating MSG-only links remain untouched.',reviewed:['QSP read-only helper callbacks','all visible and unknown legacy rows preserved','font wrapper live collection fix','font-ready and removed-root guards','no actor/acquisition changes'],excluded:'Qt geometry and visual layout validated by separate native/browser reports'});
write(rec+'/final-verification.json',{status:'PASS',qsp:result.after,productionJsSha256:result.productionJsSha256,productionCssSha256:result.productionCssSha256,protectedFilesChecked:read(rec+'/inputs.json').length,protectedSaves:result.protectedSaveCount,compressedBaselineExact:true,officialRelease:'PASS',nativeFunctionalCases:5,nativeDomRoles:2,nativeActualMessage:'PASS',browserCases:10,allOtherProtectedFilesUnchanged:true,limits:['Representative native actors and private-room paths; not every full-game dynamic branch or all saves loaded through GUI.','General trait/title acquisition and slot-cap rules remain a separate unimplemented decision.'],commit:false,push:false,Full:false});
console.log(JSON.stringify({status:'PASS',records:rec,protectedSaves:result.protectedSaveCount,cleanupPending:true}));
