'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),a=require('node:assert/strict');
const repo='G:/somi/JO9sa',work='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/battle-effect-isolation-20261027',rec=repo+'/records/battle-effect-isolation-20261027';
const c=require(repo+'/tools/text-workshop/core.cjs'),hash=p=>c.hash(fs.readFileSync(p)),cr=s=>s.replace(/\r?\n/g,'\r\n');
a.equal(hash(work+'/jack.qsp'),'a48c3817f9a679e532b35daed8bfe0f87b94ef2ffd48c1b0beb1680708563332');
a.equal(hash(work+'/css/base.css'),'f96f144b0361e211673b1ab04ebcafdab4909d23183dd4545eec65d579de0c96');
a.equal(hash(repo+'/assets/css-2.4/base.css'),hash(work+'/css/base.css'));
const stamp=new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14),backup='G:/somi/JO9_work_backups/battle_effect_isolation_'+stamp;
fs.mkdirSync(backup+'/css',{recursive:true});for(const rel of ['jack.qsp','css/base.css'])fs.copyFileSync(work+'/'+rel,backup+'/'+rel);
const raw=fs.readFileSync(work+'/jack.qsp'),doc=c.parse(raw),edits=[],counts=[];a(c.serialize(doc).equals(raw));
const bad=/content[\\/]+pic[\\/]+ui[\\/]+frames[\\/]+legacy[\\/]+bg[\\/]+/gi;
for(const loc of doc.locations){const old=c.shift(doc.lines[loc.body],5);let next=old;const n=[...old.matchAll(bad)].length;
 if(n){next=next.replace(bad,'content/pic/bg/');next='! JO9 MOD START BG_DIRECTORY_PREFIX_FIX_20261027\r\n'+next+'\r\n! JO9 MOD END BG_DIRECTORY_PREFIX_FIX_20261027\r\n';counts.push({location:loc.name,count:n});}
 if(['боевой_интерфейс','конец_боя'].includes(loc.name)){
  const from="*p '<<$jo9_bui_fx>>'";a.equal(next.split(from).length-1,1,loc.name);
  next=next.replace(from,cr('! JO9 MOD START BATTLE_EFFECT_ISOLATION_20261027\n*p \'<div id="jo9_battle_fx_layer" class="jo9-battle-fx-layer" aria-hidden="true"><<$jo9_bui_fx>></div>\'\n! JO9 MOD END BATTLE_EFFECT_ISOLATION_20261027'));
 }
 if(next!==old){edits.push({location:loc.name,field:'body',old,new:next,count:1});doc.lines[loc.body]=c.shift(next,-5);}
}
a.equal(counts.reduce((s,r)=>s+r.count,0),280);a.equal(counts.length,44);
const encoded=c.serialize(doc);a(c.serialize(c.parse(encoded)).equals(encoded));
const patch={id:'2026-10-27_zzz_battle_effect_isolation',before_sha256:c.hash(raw),after_sha256:c.hash(encoded),edits};
fs.mkdirSync(tmp+'/mods',{recursive:true});fs.mkdirSync(tmp+'/candidate/css',{recursive:true});
const patchFile=patch.id+'.json';fs.writeFileSync(tmp+'/mods/'+patchFile,JSON.stringify(patch,null,2)+'\n');fs.copyFileSync(tmp+'/mods/'+patchFile,repo+'/mods/'+patchFile);fs.copyFileSync(work+'/jack.qsp',tmp+'/candidate/jack.qsp');
const apply=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',tmp+'/candidate/jack.qsp','-ModsDir',tmp+'/mods'],{encoding:'utf8',windowsHide:true,timeout:180000,maxBuffer:1024*1024});a.equal(apply.status,0,apply.stdout+apply.stderr);a.equal(hash(tmp+'/candidate/jack.qsp'),patch.after_sha256);
const cssDelta=cr('\n/* JO9 MOD START BATTLE_EFFECT_ISOLATION_20261027\n   The FX surface clips its own children and never receives combat input.\n   Existing hit/flash animations remain on children; ordinary UI is unchanged. */\n.jo9-battle-v01 .jo9-battle-fx-layer{position:absolute;left:0;top:0;width:1280px;height:800px;margin:0;padding:0;border:0;box-sizing:border-box;overflow:hidden;pointer-events:none;z-index:5;background:none;font-size:0;line-height:0;}\n/* JO9 MOD END BATTLE_EFFECT_ISOLATION_20261027 */\n');
const css=Buffer.concat([fs.readFileSync(work+'/css/base.css'),Buffer.from(cssDelta)]);fs.writeFileSync(tmp+'/candidate/css/base.css',css);
const report={status:'CANDIDATE',backup,qspBefore:patch.before_sha256,qspAfter:patch.after_sha256,cssBefore:hash(work+'/css/base.css'),cssAfter:c.hash(css),patch:patchFile,changedLocations:edits.map(x=>x.location),backgroundCorrections:counts,fxRenderers:2,newSaveVariables:0,newLocations:0,scope:'Correct mistaken scene-directory prefix; wrap visual effects only. Existing combat calculations, links, animations and UI geometry unchanged.'};
fs.mkdirSync(rec+'/scripts',{recursive:true});fs.writeFileSync(rec+'/candidate.json',JSON.stringify(report,null,2)+'\n');fs.copyFileSync(__filename,rec+'/scripts/prepare-candidate.cjs');fs.copyFileSync(path.dirname(__filename)+'/check-bg-paths.cjs',rec+'/scripts/check-bg-paths.cjs');fs.writeFileSync(rec+'/scripts/effect-isolation.css',cssDelta);console.log(JSON.stringify(report));
