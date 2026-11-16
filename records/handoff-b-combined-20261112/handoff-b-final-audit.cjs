const fs=require('fs'),path=require('path'),z=require('zlib'),a=require('assert/strict');
const R='G:/somi/JO9sa',D=R+'/records/handoff-b-combined-20261112',G='G:/somi/Jack O Nine Tails v2.4_work/game',c=require(R+'/tools/text-workshop/core.cjs');
const rd=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const p=rd(D+'/plan.json'),v=rd(D+'/verification.json'),proof=rd(D+'/native-integration.json'),q=fs.readFileSync(G+'/jack.qsp'),m=rd(R+'/assets/runtime-source-2.4.1.json');
a.equal(p.after,'29f4c04892a19afb25c82443a928e5d7895f1a7a24208df670eb3f4032bbbd15');a.equal(c.hash(q),p.after);a(q.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));a.equal(m.sourceQspSha256,p.after);a.equal(m.files.find(e=>e.runtimePath==='jack.qsp').sha256,p.after);a.equal(c.hash(fs.readFileSync(R+'/'+p.modFile)),p.modSha256);a.equal(rd(R+'/'+p.modFile).after_sha256,p.after);a.equal(proof.candidateHash,p.after);a.equal(proof.failures.length,0);a.equal(proof.randomSamples,300);a.equal(proof.fixedSamples,24);a.equal(v.after,p.after);
const before=JSON.parse(z.gunzipSync(fs.readFileSync(D+'/traits.before.json.gz'))),now=rd(R+'/tools/game-reference/traits.json'),changes=rd(D+'/traits-description-edits.json');a.equal(changes.length,4);
for(const e of changes){const row=before.rows.find(r=>r.id===e.id&&r.name===e.name);a.equal(row.description,e.old);row.description=e.new;row.source='jo9_activity_stage:text · jo9_traits:text';}
delete before.hash;delete before.latestActivityStage;const newRows=structuredClone(now);delete newRows.hash;delete newRows.latestActivityStage;a.deepEqual(newRows,before);
for(const f of ['REPORT_KO.md','STATUS_KO.md','USER_DECISIONS_KO.md','PR_COMMENT_FINAL_KO.md','pr-comment-final.json'])a(fs.statSync(D+'/'+f).size>0,f);
for(const f of ['handoff-b-combined.cjs','handoff-b-apply.cjs','handoff-b-close.cjs','origin-growth-module.cjs','origin-growth-input.cjs','origin-growth-native.cjs','style-deferred-check.cjs'])a(fs.readFileSync(f).equals(fs.readFileSync(D+'/'+f)),f);
const A=R+'/records/handoff-a-work-20261112';for(const f of ['handoff-a-work.cjs','handoff-a-close.cjs'])a(fs.readFileSync(f).equals(fs.readFileSync(A+'/'+f)),f);
const T='G:/Codex/tmp/handoff-b-style-deferred-20261113';
if(fs.existsSync(T)){
 const resolved=fs.realpathSync(T);a.equal(path.dirname(resolved).toLowerCase(),fs.realpathSync('G:/Codex/tmp').toLowerCase());a.equal(path.basename(resolved),'handoff-b-style-deferred-20261113');
 function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const x=path.join(dir,e.name);a(!fs.lstatSync(x).isSymbolicLink(),x);if(e.isDirectory())scan(x);}}scan(resolved);
 for(const f of fs.readdirSync(T))if(/\.log$|client-results\.json$|fixture-metadata\.json$/.test(f))fs.copyFileSync(T+'/'+f,D+'/style-deferred-'+f);
 fs.rmSync(resolved,{recursive:true});
}
for(const t of ['handoff-b-combined-20261112','handoff-b-origin-growth-20261112','handoff-b-style-deferred-20261113'])a(!fs.existsSync('G:/Codex/tmp/'+t),t);
const result={status:'PASS',qspSha256:p.after,workSourceManifestMod:true,traitDescriptionsOnly:4,randomSamples:300,fixedSamples:24,nativeChecks:proof.checks,failures:0,personalSaveAndGuiTested:false,taskTempCopiesRemoved:true,prComment:rd(D+'/pr-comment-final.json').html_url};
fs.copyFileSync(__filename,D+'/handoff-b-final-audit.cjs');fs.writeFileSync(D+'/final-audit.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
