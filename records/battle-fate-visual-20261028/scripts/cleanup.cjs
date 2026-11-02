'use strict';
// Only reproducible regular diagnostic QSPs and exact temporary candidate resource copies.
// No recursive removal, directory removal, link following, backup removal or save removal.
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const input=JSON.parse(fs.readFileSync(__dirname+'/inputs.json','utf8')),candidate=JSON.parse(fs.readFileSync(__dirname+'/candidate.json','utf8')),installation=JSON.parse(fs.readFileSync(__dirname+'/installation.json','utf8'));
const qa=path.resolve('G:/Codex/tmp/battle-fate-visual-qa-20261028'),hash=p=>c.hash(fs.readFileSync(p));
const protect=new Map();
for(const f of ['jack.qsp','css/base.css','content/js/jo9_battle_log.js','save/1.sav','save/JO9_GOLD_AP_CHECK_20261026.sav'])protect.set(input.work+'/'+f,hash(input.work+'/'+f));
for(const f of ['jack.qsp','css/base.css','content/js/jo9_battle_log.js'])protect.set(input.tmp+'/before/'+f,hash(input.tmp+'/before/'+f));
for(const x of installation.backups.automatic)protect.set(x.path,x.sha256);
for(const x of input.assets){for(const p of [x.source,input.work+'/'+x.destination,input.repo+'/resources/new/'+x.destination]){a.equal(hash(p),x.sha256);protect.set(p,x.sha256);}}
a.equal(hash(input.work+'/jack.qsp'),candidate.qspAfter);a.equal(hash(input.tmp+'/before/jack.qsp'),candidate.qspBefore);
const selected=[],skipped=[];
function contained(p,root){const rel=path.relative(root,p);return rel&&!rel.startsWith('..')&&!path.isAbsolute(rel);}
function select(p,reason,expected){
 const absolute=path.resolve(p),st=fs.lstatSync(absolute);a(st.isFile()&&!st.isSymbolicLink(),'Only regular files '+absolute);
 a(!/\.bak(?:_|\.|$)|\.sav$|before/i.test(path.basename(absolute)),'Protected filename '+absolute);
 a(!protect.has(absolute)&&!protect.has(absolute.replace(/\\/g,'/')),'Protected source '+absolute);
 const sha=hash(absolute);a.equal(sha,expected);a.notEqual(sha,candidate.qspBefore,'Never delete pristine original bytes');
 selected.push({path:absolute,reason,bytes:st.size,sha256:sha});
}
function walk(dir){
 a(contained(dir,qa)||path.resolve(dir)===qa,'Outside QA root');
 for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,ent.name),st=fs.lstatSync(p);
  if(st.isSymbolicLink()){skipped.push({path:p,reason:'link-preserved'});continue;}
  if(st.isDirectory()){walk(p);continue;}
  if(!st.isFile()||!ent.name.endsWith('.qsp'))continue;
  const b=fs.readFileSync(p),h=c.hash(b);if(h===candidate.qspBefore){skipped.push({path:p,reason:'pristine-before-preserved'});continue;}
  const doc=c.parse(b);let marked=false;
  for(const l of doc.locations){const body=c.shift(doc.lines[l.body],5);if(body.includes('JO9_QA_')){marked=true;break;}}
  if(marked)select(p,'generated diagnostic with QA completion marker',h);
  else if(h===candidate.qspAfter)select(p,'exact installed candidate replay copy',h);
  else skipped.push({path:p,reason:'unrecognized-qsp-preserved'});
 }
}
walk(qa);
if(fs.existsSync(candidate.candidate))select(candidate.candidate,'exact installed reproducible candidate',candidate.qspAfter);
for(const x of input.assets){const p=candidate.game+'/'+x.destination;if(fs.existsSync(p)){a(contained(path.resolve(p),path.resolve(candidate.game)));select(p,'temporary asset copy; original, WORK and tracked copies verified',x.sha256);}}
const apply=process.argv.includes('--apply');
if(apply)for(const x of selected){a.equal(hash(x.path),x.sha256);fs.unlinkSync(x.path);}
for(const [p,h]of protect)a.equal(hash(p),h,'Protected file changed '+p);
const report={mode:apply?'applied':'dry-run',files:selected.length,bytes:selected.reduce((n,x)=>n+x.bytes,0),selected,skipped,protectedFiles:protect.size,allProtectedHashesUnchanged:true,note:'All backups, before snapshots, directories, links and original/source/save files preserved.'};
fs.writeFileSync(__dirname+'/cleanup'+(apply?'':'.plan')+'.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,selected:report.selected.length,skipped:report.skipped.length},null,2));
