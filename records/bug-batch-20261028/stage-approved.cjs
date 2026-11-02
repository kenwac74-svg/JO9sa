'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),a=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',root='G:/Codex/tmp/jo9-approved-rumor-chaotic-20261028';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const raw=fs.readFileSync(game+'/jack.qsp'),baseline=c.hash(raw);a.equal(baseline,'dbe2948f7c827d8fc82ccd32b2c3453626d181a59eb744e015fa66a3846280ae');qa.inspectWorld(raw);
a(!fs.existsSync(root),'Existing staging folder preserved');
fs.mkdirSync(root+'/mods',{recursive:true});
const protectedPaths=[game+'/jack.qsp',game+'/css/base.css',game+'/content/js/jo9_battle_log.js',game+'/save/1.sav',game+'/save/JO9_GOLD_AP_CHECK_20261026.sav','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp'];
write(__dirname+'/protected-before.json',protectedPaths.filter(p=>fs.existsSync(p)).map(file=>({file,sha256:c.hash(fs.readFileSync(file))})));
const patches=[read(__dirname+'/rumor-patch.json'),read(__dirname+'/chaotic-expanded/2026-10-28_chaotic_priority.json')];
const d=c.parse(raw);let before=baseline;
for(let n=0;n<patches.length;n++){
 const p=patches[n];p.before_sha256=before;
 for(const e of p.edits){
  const loc=d.locations.find(l=>l.name===e.location);a(loc,e.location);const field=e.field==='body'?loc.body:loc.desc;
  const value=c.shift(d.lines[field],5);a.equal(value.split(e.old).length-1,e.count,e.patchId||e.location);
  d.lines[field]=c.shift(value.split(e.old).join(e.new),-5);
 }
 const checked=c.serialize(d);qa.inspectWorld(checked);p.after_sha256=c.hash(checked);before=p.after_sha256;
 write(root+'/mods/'+String(n).padStart(2,'0')+'_'+p.id+'.json',p);
 write(__dirname+'/'+p.id+'.json',p);
}
const candidate=root+'/jack.candidate.qsp';fs.writeFileSync(candidate,raw);
const apply=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',candidate,'-ModsDir',root+'/mods'],{encoding:'utf8',windowsHide:true,timeout:60000});
fs.writeFileSync(__dirname+'/apply-stage.log',apply.stdout+'\n'+apply.stderr);a.equal(apply.status,0,'apply_mods stage');
a.equal(c.hash(fs.readFileSync(candidate)),before);
const backups=fs.readdirSync(root).filter(f=>f.includes('.bak_'));a.equal(backups.length,1,'Exactly one pre-edit backup');
const backup=root+'/'+backups[0];a.equal(c.hash(fs.readFileSync(backup)),baseline);
const newloc=c.shift(d.lines[d.locations.find(l=>l.name==='$newloc').body],5);
const revisions=[...newloc.matchAll(/jo9_traits_revision\s*[!=<>]+\s*(\d+)/g)].map(m=>+m[1]);a(revisions.length>0,'cache revision');
const stage={baseline,candidate_sha256:before,candidate,backup,mods_dir:root+'/mods',root,cache_revision:Math.max(...revisions),new_locations:0,patches:patches.map(p=>({id:p.id,edits:p.edits.length,before:p.before_sha256,after:p.after_sha256}))};
write(__dirname+'/staging.json',stage);console.log(JSON.stringify(stage));
