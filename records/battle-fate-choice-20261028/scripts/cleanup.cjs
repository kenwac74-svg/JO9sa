'use strict';
// Safe replacement after automatic review: keep EVERY backup and before-snapshot.
// Removes only regular, generated .qsp diagnostic/candidate/replay files.
// Never deletes a directory, link, save, backup, image, or any file in WORK.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),a=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const STAGE=__dirname,REC='G:/somi/JO9sa/records/battle-fate-choice-20261028';
const ROOTS=['G:/Codex/tmp/battle-fate-20261028','G:/Codex/tmp/battle-fate-qa-20261028'].map(p=>path.resolve(p));
const WORK='G:/somi/Jack O Nine Tails v2.4_work/game';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const installed=read(STAGE+'/installation.json');
a.equal(installed.status,'complete');a.equal(installed.officialVerdict,'PASS');a.equal(installed.nativeUiStatus,'PASS');
a.equal(hash(STAGE+'/installation.json'),hash(REC+'/installation.json'));
const protectedFiles={
 [WORK+'/jack.qsp']:installed.qspAfter,[WORK+'/css/base.css']:installed.cssAfter,
 [WORK+'/content/js/jo9_battle_log.js']:installed.jsAfter,[WORK+'/'+installed.effect.path]:installed.effect.sha256,
 [installed.backup+'/jack.qsp']:installed.qspBefore,[installed.backup+'/base.css']:installed.cssBefore,
 [installed.backup+'/jo9_battle_log.js']:installed.jsBefore,
 ...installed.protectedInputs,
 [ROOTS[0]+'/jack.before.qsp']:installed.qspBefore,
 [ROOTS[0]+'/base.before.css']:installed.cssBefore,
 [ROOTS[0]+'/battle_log.before.js']:installed.jsBefore
};
for(const b of installed.automaticPatchBackups||[])protectedFiles[b.path]=b.sha256;
function protect(){for(const [p,h]of Object.entries(protectedFiles))a.equal(hash(p),h,'Protected file changed: '+p);}
protect();
for(const f of ['MANUAL_KO.md','PLAN_KO.md','candidate.json'])a.equal(hash(STAGE+'/'+f),hash(REC+'/'+f));
for(const f of ['helper.qsp.txt','fate-native.cjs','fate-ui-native.cjs','cleanup.cjs'])a.equal(hash(STAGE+'/'+f),hash(REC+'/scripts/'+f));
a.equal(read(REC+'/official-report.json').verdict,'PASS');
a.equal(read(REC+'/native-ui-results.json').status,'PASS');
a.equal(read(REC+'/native-logic-results.json').status,'PASS');
const actions=[],kept=[];
function under(root,p){const rel=path.relative(root,p);return rel&&!path.isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+path.sep);}
function generated(root,p){
 const rel=path.relative(root,p).replace(/\\/g,'/'),base=path.basename(p);
 if(/before|backup|\.bak|\.sav|\.zip/i.test(rel))return false;
 if(root===ROOTS[0]){
  return rel==='jack.candidate.qsp'||
   /^(?:native-(?:green-v[1-4]|red-v1|negative-red-v1|lastfx-red-v1))\/fate-native\.qsp$/.test(rel)||
   /^ui-native-v[2-8][^/]*\/fate-ui-(?:fog-execute|arena-spare)(?:-pending|-final)?\.qsp$/.test(rel);
 }
 return /^release-v[2-6]\/run-[A-Za-z0-9]+\/(?:replay\.qsp|client\/(?:home|newgame|editor-slave|editor-assistant|cache|daily|city-weapons|city-beauty|battle-entry)\.qsp)$/.test(rel);
}
function walk(root,p){
 a(p===root||under(root,p),'Path escaped diagnostic root');
 const st=fs.lstatSync(p);
 if(st.isSymbolicLink())return; // No link following, inspection of target, or link removal.
 if(st.isDirectory()){for(const n of fs.readdirSync(p))walk(root,path.join(p,n));return;}
 if(!st.isFile())return;
 if(!generated(root,p)){if(/\.qsp$|\.bak|before|backup/i.test(path.basename(p)))kept.push(p);return;}
 a(under(root,p));a(!/before|backup|\.bak|\.sav|\.zip/i.test(p));
 const raw=fs.readFileSync(p),doc=core.parse(raw),start=doc.locations.find(l=>l.name==='Start');
 a.notEqual(core.hash(raw),installed.qspBefore,'Pristine source copies are preserved: '+p);
 if(path.basename(p)==='jack.candidate.qsp')a.equal(core.hash(raw),installed.qspAfter);
 else if(path.basename(p)!=='replay.qsp'){
  const plan=read(path.join(path.dirname(p),'plan.json'));
  const entry=plan.find(e=>path.resolve(e.file)===path.resolve(p));
  a(entry&&/^JO9_QA_/.test(entry.marker),'No exact diagnostic plan entry: '+p);
  const marker=core.shift(entry.marker,-5);
  a(doc.lines.some(line=>line.includes(marker)),'Diagnostic marker missing: '+p);
 }else a(new Set([installed.qspAfter,'260b6af15b4ee0334e79902d373cd2db9ff45392a63811716e8b520acc473dd7','aa248bcb263fa4966d1e3153689afbeee510bb2565820f221347e3417549e93f']).has(core.hash(raw)),'Not a known patched replay candidate');
 actions.push({path:p,bytes:st.size,sha256:core.hash(raw),root});
}
for(const root of ROOTS){
 const st=fs.lstatSync(root);a(st.isDirectory()&&!st.isSymbolicLink());
 a.equal(fs.realpathSync(root).toLowerCase(),path.resolve(root).toLowerCase());
 walk(root,root);
}
const apply=process.argv.slice(2).includes('--apply');
a(process.argv.slice(2).every(x=>x==='--apply'),'Unknown argument');
if(apply)for(const f of actions){
 a(under(f.root,f.path));
 let parent=path.dirname(f.path);while(parent!==f.root){const s=fs.lstatSync(parent);a(s.isDirectory()&&!s.isSymbolicLink());parent=path.dirname(parent);}
 const s=fs.lstatSync(f.path);a(s.isFile()&&!s.isSymbolicLink());
 a.equal(s.size,f.bytes);a.equal(hash(f.path),f.sha256);
 // This is the only destructive operation. Every backup has been excluded.
 fs.unlinkSync(f.path);
}
protect();
const report={status:apply?'complete':'dry-run',scope:'Generated regular diagnostic QSP files only; ALL backups, before snapshots, directories, links, saves and images preserved.',
 autoReviewAdjustment:'The rejected backup-deleting cleanup strategy was removed. No backup-deleting operation remains.',
 removedFiles:apply?actions.length:0,plannedFiles:actions.length,
 freedBytes:apply?actions.reduce((n,f)=>n+f.bytes,0):0,plannedBytes:actions.reduce((n,f)=>n+f.bytes,0),
 preservedSnapshotsAndBackups:kept,protectedHashesUnchanged:true,files:actions};
for(const p of [STAGE+'/cleanup.json',REC+'/cleanup.json'])fs.writeFileSync(p,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,files:actions.length,GiB:report.plannedBytes/1073741824,protectedHashesUnchanged:true,allBackupsPreserved:true},null,2));
