'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',record=repo+'/records/portrait-sync-20261108';
const read=f=>JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8'));
const plan=read('plan.json'),inv=read('inventory.json'),search=read('existing-portrait-search.json'),lookup=read('existing-portrait-matches.json'),pixels=read('existing-name-independent-search.json');
const verification=read('verification.json');verification.catalogBrowserVerified={sampleCharacter:2328,standingLoaded:true,portraitsLoaded:3,portraitDimensions:[151,150]};fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(verification,null,2));
const ids=[...new Set(plan.files.filter(f=>f.characterId).map(f=>f.characterId))];
const findings={charactersScanned:1154,portraitFilesScanned:6450,changedCharacters:ids,additionalPackNormal:[2324,2333],existingSearch:{roots:search.roots,fileNamesScanned:search.imageNamesScanned,relatedFiles:search.candidateFiles,uniqueImages:search.uniqueImages,relatedPairs:lookup.pairs,installedColorPortraits:pixels.installedColorPortraits,nameIndependentPairs:pixels.pairsVerified,errors:search.errors},changedSources:inv.rows.filter(r=>ids.includes(r.id)),borderOnlyPaths:plan.files.filter(f=>f.operation==='frame-only').map(f=>f.path),limitations:['Automatic correspondence is screening evidence, not a person-identity guarantee.','Actual game save UI remains unchecked.']};
fs.writeFileSync(path.join(__dirname,'findings.json'),JSON.stringify(findings,null,2));
assert(!fs.existsSync(record));fs.mkdirSync(record);
const coreFiles=['REPORT_KO.md','plan.json','installation.json','verification.json','findings.json','inspection.csv','audit.py','match.py','borders.py','frame_screen.py','extra_frames.py','search.py','search_compare.py','search_by_pixels.py','prepare.py','install.py','track.cjs','finish.py','record.cjs'];
for(const f of coreFiles)fs.copyFileSync(path.join(__dirname,f),record+'/'+f);
const hp=repo+'/docs/SESSION_HANDOFF_INDEX.md',h=fs.readFileSync(hp,'utf8'),heading='# JO9 통합 대화 인계';assert(h.startsWith(heading));
const entry='## 2026-11-08 전신·초상 동기화와 테두리 보완\r\n\r\n[조사·적용·검증·복구](../records/portrait-sync-20261108/REPORT_KO.md). WORK1154명/초상6450개 조사 후31명93개를 현재 전신 얼굴 크롭으로 맞추고, 별도15개는 테두리만 추가했다. 합계108PNG, 테두리 추가90개는75개가 앞 항목과 겹친다. 기존 초상 검색 후 사용자 선택의 코드 크롭·합성 사용. WORK/추적/개인 패치/메타데이터 동기화, PNG·보존 픽셀·HTTP108개·브라우저2328 확인. QSP6ab15282… 및JSON/전신/태그 보존, Full·정식배포·커밋푸시 없음. 실제 게임 화면 확인 대기.\r\n\r\n';
if(!h.includes('## 2026-11-08 전신·초상 동기화와 테두리 보완'))fs.writeFileSync(hp,h.replace(heading,heading+'\r\n\r\n'+entry));
const log=game+'/../CHANGELOG_KO.md',s=fs.readFileSync(log,'utf8'),line='- 전신과 다른 얼굴이 나오던 캐릭터31명의 초상3종을 현재 전신에 맞췄으며, 테두리가 빠진 초상도 보완했습니다.';assert(s.includes('[신규 업데이트]'));if(!s.includes(line))fs.writeFileSync(log,s.replace('[신규 업데이트]','[신규 업데이트]\r\n'+line));
// Each removed artifact was generated for this audit; no game or original image path is traversed.
const generatedImages=/^(?:global-candidates-\d+|additional-heads-\d+|detail-heads-\d+|border-candidates-\d+|frame-families|extra-frame-candidates)\.jpg$/;
const diagnosticJson=['inventory.json','borders.json','frame-screen.json','extra-frames.json','matches-pack.json','matches-all.json','existing-portrait-search.json','existing-portrait-matches.json','existing-name-independent-search.json','tracking.json','catalog-reconciliation.json','http-verification.json'];
let removed=0;for(const f of fs.readdirSync(__dirname))if(generatedImages.test(f)||diagnosticJson.includes(f)||f==='search-paths.txt'){const p=path.join(__dirname,f);assert(fs.lstatSync(p).isFile());fs.unlinkSync(p);removed++;}
for(const f of coreFiles){assert(fs.readFileSync(path.join(__dirname,f)).equals(fs.readFileSync(record+'/'+f)));if(!['REPORT_KO.md','inspection.csv','verification.json','record.cjs'].includes(f)){fs.unlinkSync(path.join(__dirname,f));removed++;}}
fs.writeFileSync(path.join(__dirname,'RECORD_LOCATION.txt'),record+'\n');
fs.writeFileSync(record+'/cleanup.json',JSON.stringify({candidateCopiesRemoved:108,workspaceDiagnosticFilesRemoved:removed,coreFilesPreserved:coreFiles.length,reviewZipAndComparisonsRetained:true},null,2));
console.log(JSON.stringify({record,workspaceDiagnosticFilesRemoved:removed,reviewFiles:'review ZIP, six portrait comparisons, frame comparison, browser capture'}));
