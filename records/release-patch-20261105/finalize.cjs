'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',record=repo+'/records/release-patch-20261105';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),get=p=>JSON.parse(fs.readFileSync(p));
const runtime=get(__dirname+'/inventory/package-runtime.json'),pack=get(__dirname+'/package-result.json'),review=get(__dirname+'/package-review.json');
assert.equal(pack.status,'PASS');assert.equal(hash(fs.readFileSync(pack.archive)),pack.archiveSha256);
const qa=get(__dirname+'/qa-game/release-report.json');assert.equal(qa.verdict,'PASS');assert.ok(qa.client.probes.every(p=>p.pass));
const tracked=get(repo+'/assets/runtime-source-2.4.1.json'),map=new Map(tracked.files.map(f=>[f.runtimePath,f]));
const allEvents=fs.readFileSync(game+'/modtools/catalog/image_work/personal-patch/events.jsonl','utf8').trim().split('\n').map(JSON.parse),latest=new Map();
for(const e of allEvents)for(const f of e.files||[])latest.set(f.path,f);
for(const f of runtime.files){
 const rel=f.kind==='qsp'?tracked.qspSnapshot:map.get(f.runtimePath)?.repositoryPath;
 assert.ok(rel,'Missing tracked resource '+f.path);assert.equal(hash(fs.readFileSync(repo+'/'+rel)),f.sha256);
 if(f.kind!=='qsp'){assert.equal(map.get(f.runtimePath).sha256,f.sha256);assert.equal(map.get(f.runtimePath).bytes,f.bytes);}
 if(f.kind==='image')assert.equal(latest.get(f.runtimePath.slice('content/pic/'.length))?.after,f.sha256,'Image ledger mismatch '+f.path);
}
assert.equal(hash(fs.readFileSync(game+'/jack.qsp')),pack.extractedQspMatchesNativeValidatedStage);
const cleanup=get(__dirname+'/inventory/cleanup-legacy-json.json');for(const f of cleanup.files)assert.ok(!map.has(f.runtimePath));
const browser=get(__dirname+'/notes-browser-check.json');assert.equal(browser.status,'PASS');
for(const f of ['package-review.json','notes-browser-check.json','notes-contact.jpg','render-notes.cjs','finalize.cjs'])fs.copyFileSync(__dirname+'/'+f,record+'/'+f);
const note='# 2.4.1 추가 패치 — 2026-11-05 최종 납품\n\n펠리시티2572 교체까지 포함한 현재 WORK를 기존2.4.1용 수동 덮어쓰기 패치 ZIP으로 제작했습니다. 전체게임이나 설치기는 포함하지 않습니다.\n\n- ZIP: `'+pack.archive.replaceAll('\\','/')+'`\n- '+pack.archiveBytes.toLocaleString('en-US')+' bytes, '+pack.totalZipFiles+'항목(런타임942: PNG807/JSON134/QSP1, 한영HTML2/설치안내2). 이미지807주소는 변경779와 필수호환KEEP28이며 새 그림807종을 뜻하지 않습니다.\n- SHA-256: `'+pack.archiveSha256+'`\n- 기존2.4.1에 game폴더를 합친 뒤 새 이름이 들어온 것을 확인하고 옛JSON25파일명만 수동정리합니다. 세이브·개인설정·Full·이전ZIP·원본JO9O는 수정하지 않았습니다.\n\n## 확인\n\n최종QSP 구조/줄·주석경계, 기준→현재 정확재생/재적용멱등성, 인물JSON등록, 실제FastQSP9경로PASS. ZIP전항목CRC·SHA-256·재추출내용일치, 출시JSON+패치+정리25의결과가현재WORK1158JSON과동일하고숫자ID중복0. 이미지807의PNG해독/검증PASS. 추가독립포장검토17항목PASS.\n\nWORK에서빠져있던추적235파일을보완하고이미지원장104주소(기존변경81+호환KEEP23)를최신화했습니다. 카탈로그기존48메타정보수정·누락33주소추가, 사용자태그보존. 실제게임EXE에서의기존저장/외형/전체분기플레이는미실행으로사용자확인대기이며PLAYTEST_KO.txt에5개TC를담았습니다. 한영자급형HTML은각10미리보기를내장하고헤드리스브라우저로표시·가로넘침없음을확인했으며출력도직접보았습니다.\n\n설치·삭제·백업·게임실행스크립트를동봉하지않았습니다. 기존2.4.1의게임실행EXE를사용합니다. 모드툴·작업후보원화4장·백업·미승인기획·세이브는패치에포함하지않았습니다. 저장소커밋/푸시는하지않았습니다.\n\n검증상세: package-result.json, package-review.json, json-overlay-verification.json, image-validation.json, qa-game/RESULT_KO.md. 재현: stage-and-track.cjs, build-package.py 및inventory/build-package-inventory.cjs.\n';
fs.writeFileSync(record+'/REPORT_KO.md',note);fs.writeFileSync(__dirname+'/REPORT_KO.md',note);
const append=(p,heading,body)=>{const t=fs.readFileSync(p,'utf8');if(!t.includes(heading))fs.writeFileSync(p,t+'\n\n'+heading+'\n\n'+body+'\n');};
append(repo+'/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md','## 2026-11-05 2.4.1 추가 패치 ZIP 제작 완료','이번 산출물은 위의옛2.4알파패치가아니라2.4.1출시본대비추가패치입니다. [최종기록](../records/release-patch-20261105/REPORT_KO.md). 펠리시티2572포함942런타임+4문서,192,969,738bytes. 실제엔진9/9·ZIP전항목CRC/SHA/재추출·JSON정리모의·독립17검사PASS. 설치기는없으며옛JSON25이름만수동정리필요. 한영HTML/TXT동봉및별도제공,실제EXE수동5TC는사용자확인대기. WORK추적·원장·체크리스트최신화,Full·세이브·기존ZIP·커밋푸시변경없음.');
append(repo+'/docs/SESSION_HANDOFF_INDEX.md','## 2026-11-05 2.4.1 추가 패치 최종 ZIP','[납품·검증기록](../records/release-patch-20261105/REPORT_KO.md): 최신WORK·펠리시티교체포함무설치덮어쓰기ZIP,한영릴리즈HTML·게시판TXT,수동JSON25정리안내·5TC. 최종QSP f9abb…/ZIP555a3736… . Full수동동기화기준유지.');
const final={status:'PASS',archiveSha256:pack.archiveSha256,verifiedTrackedRuntime:runtime.files.length,verifiedLatestImageLedger:807,retiredOldJsonNames:25,nativeProbes:qa.client.probes.length,allNativeProbesPass:true,htmlDocuments:browser.documents.length,manualGameVisualTests:'pending user',fullModified:false,commitOrPush:false};
for(const p of [__dirname+'/final-verification.json',record+'/final-verification.json'])fs.writeFileSync(p,JSON.stringify(final,null,2)+'\n');
console.log(JSON.stringify(final));
