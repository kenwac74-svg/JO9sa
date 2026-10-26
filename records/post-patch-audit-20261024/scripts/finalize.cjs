const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const repo='G:/somi/JO9sa',rec=repo+'/records/post-patch-audit-20261024';
const inv=JSON.parse(fs.readFileSync(rec+'/inventory.json','utf8'));
const journal='G:/somi/Jack O Nine Tails v2.4_work/game/modtools/text-workshop/runtime/backups/2026-10-22T13-24-09-881Z_a241ae.json';
const j=JSON.parse(fs.readFileSync(journal,'utf8').replace(/^\uFEFF/,''));
console.log('JOURNAL_KEYS',Object.keys(j));
function pairs(o,trail=''){
  const keys=Object.keys(o||{}),v={};
  for(const k of keys) if(typeof o[k]==='string'&&/^[0-9a-f]{64}$/i.test(o[k]))v[k]=o[k];
  const bk=Object.keys(v).find(k=>/before|old/i.test(k)),ak=Object.keys(v).find(k=>/after|new/i.test(k));
  if(bk&&ak)return{before:v[bk],after:v[ak],fields:[trail+bk,trail+ak]};
  for(const k of keys)if(o[k]&&typeof o[k]==='object'&&!Array.isArray(o[k])){const p=pairs(o[k],trail+k+'.');if(p)return p;}
}
const jp=pairs(j);assert(jp,'Journal hash pair missing');
assert.equal(jp.before,'a54283107b35e69ad50e23c528a13b499c62e7839aa77dde7ebbdf3b47023214');
assert.equal(jp.after,'26115873b7cfbe72cc35531345fa319cfd759a5704b46bf80378e8fe1da59796');
const edges=[...inv.mods,{file:journal,id:'2026-10-22_text_132409',...jp}];
const chain=[];let h=inv.baselineQsp;
while(h!==inv.currentQsp){const matches=edges.filter(e=>e.before===h&&!chain.includes(e));assert.equal(matches.length,1,'Unique chain edge missing');chain.push(matches[0]);h=matches[0].after;assert(chain.length<=edges.length);}
assert.equal(chain.length,18);assert.equal(chain.length,edges.length);
fs.writeFileSync(rec+'/change-chain.json',JSON.stringify({status:'PASS',method:'metadata hash continuity; not full byte replay',baseline:inv.baselineQsp,current:inv.currentQsp,patches:17,userDialogueSaves:1,changes:chain},null,2));
inv.supplementalUserDialogueJournal=journal;inv.exactRecordedChain=chain;inv.chainMethod='metadata hash continuity; last patch separately byte replayed';
fs.writeFileSync(rec+'/inventory.json',JSON.stringify(inv,null,2));
const releaseRoot='G:/Codex/tmp/jo9-postpatch-audit-release-20261024';
const runs=fs.readdirSync(releaseRoot).filter(n=>n.startsWith('run-'));assert.equal(runs.length,1);
const run=releaseRoot+'/'+runs[0],r=JSON.parse(fs.readFileSync(run+'/report.json','utf8'));
assert.equal(r.verdict,'PASS');assert.equal(r.client.probes.length,9);assert(r.client.probes.every(p=>p.pass));
assert.equal(r.checks.find(c=>c.name==='world-structure-and-line-endings').detail.sha256,inv.currentQsp);
fs.mkdirSync(rec+'/release/client',{recursive:true});
for(const file of ['report.json','report.md','patch-replay.log','patch-reapply.log'])if(fs.existsSync(run+'/'+file))fs.copyFileSync(run+'/'+file,rec+'/release/'+file);
for(const file of fs.readdirSync(run+'/client'))if(/\.(log|json)$/.test(file)&&fs.lstatSync(run+'/client/'+file).isFile())fs.copyFileSync(run+'/client/'+file,rec+'/release/client/'+file);
fs.copyFileSync(__dirname+'/.postpatch-audit-report.md',repo+'/docs/POST_PATCH_STATUS_AUDIT_20261024.md');
fs.copyFileSync(__dirname+'/.postpatch-audit-findings.json',rec+'/findings.json');
fs.copyFileSync(__filename,rec+'/scripts/finalize.cjs');
const preservation=inv.protectedFiles.map(f=>({...f,afterSha256:core.hash(fs.readFileSync(f.path))}));
for(const f of preservation)assert.equal(f.afterSha256,f.sha256,'Protected file changed: '+f.path);
fs.writeFileSync(rec+'/preservation.json',JSON.stringify({status:'PASS',files:preservation.length,userSaves:76,changed:0,results:preservation},null,2));
fs.writeFileSync(rec+'/qa-regression.json',JSON.stringify({status:'KNOWN_STALE_TEST_FAILURE',command:'node --test tools/qa/{qsp-line-endings,qsp-marker-boundaries,meiki-tentacle-success,release-check,check-slave-template-ids,client-smoke-timeout}.test.cjs',tests:45,passed:43,failed:1,skipped:1,failure:{file:'tools/qa/meiki-tentacle-success.test.cjs',line:50,actual:0,expected:3,reason:'old placeholder intentionally replaced in approved later patch; nine current replacement lines match patch; not a runtime failure'},followupReadOnlyComparison:{dialogueEntries:9,successBranches:15,inputCombinationsPerBranch:180,totalPerWorld:2700,baselineEquivalent:true},fixApplied:false},null,2));
const bundle=repo+'/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md';
const marker='POST_PATCH_STATUS_AUDIT_20261024';
const old=fs.readFileSync(bundle,'utf8');
if(!old.includes(marker))fs.appendFileSync(bundle,'\r\n\r\n## 지난 빌드 이후 재점검 ('+marker+')\r\n\r\n실제 마지막 2차 r4 내용의 ZIP(c670)부터 현재 WORK(bf3)까지 재대조했다. 적용 내역과 미구현(행동력 곡선·정상 재판매·소문·8+3슬롯·랠리/캣파이트 명성·승산 경고), 시험 생성기/승수/테스트/배포 안내 미결, GUI 잔여 검사를 분리했다. 현재 공식 엔진9경로·구조/줄/등록/마지막 정확재생 PASS. 게임/Full/ZIP/세이브 수정·커밋·푸시 없음. [최신 감사 보고서](POST_PATCH_STATUS_AUDIT_20261024.md), [검사 기록](../records/post-patch-audit-20261024/).\r\n');
console.log(JSON.stringify({report:repo+'/docs/POST_PATCH_STATUS_AUDIT_20261024.md',releaseVerdict:r.verdict,nativePaths:9,chain:chain.length,protectedFiles:preservation.length,gameChanges:0}));
