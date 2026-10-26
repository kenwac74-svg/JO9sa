'use strict';
const fs=require('node:fs'),path=require('node:path');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const base='G:/Codex/tmp/jo9-bugfixes-20261022',work='G:/somi/Jack O Nine Tails v2.4_work/game',full='G:/somi/Jack O Nine Tails v2.4 Kor_Full/game';
const raw=fs.readFileSync(path.join(work,'jack.qsp')),d=c.parse(raw);
if(c.hash(raw)!=='c6701e3ab130b1a762d0b1a523d52cd53cee846f71c3d7899a4c369389aa853d')throw Error('Current WORK changed');
const reads=p=>JSON.parse(fs.readFileSync(path.join(base,p),'utf8').replace(/^\uFEFF/,''));
const fog=reads('fog/edits.json'),root=reads('root/edits.json'),egeya=reads('egeya-revised/edits.json'),css=reads('milk/css-patch.json');
const edits=[...fog,...root,...egeya.edits];
for(const e of edits){const l=d.locations.find(l=>l.name===e.location);if(!l)throw Error('Missing '+e.location);const t=c.shift(d.lines[l.body],5);if(t.split(e.old).length-1!==e.count)throw Error('Bad count '+e.location);d.lines[l.body]=c.shift(t.split(e.old).join(e.new),-5);}
for(const l of egeya.add_locations){if(d.locations.some(x=>x.name===l.name))throw Error('Existing new location');d.lines.splice(d.lines.length-1,0,c.shift(l.name,-5),c.shift(l.desc,-5),c.shift(l.body,-5),c.shift('0',-5));d.lines[3]=c.shift(String(d.locations.length+egeya.add_locations.length),-5);}
const candidate=c.serialize(d),result=qa.inspectWorld(candidate);
const mod={id:'2026-10-22_registered_bugfixes',description:'Approved WORK fixes: fog companion energy, Grinch menu/save-page, original seed role image cache, Korean selection text; milk layout recorded separately in CSS patch.',before_sha256:c.hash(raw),after_sha256:c.hash(candidate),edits,add_locations:egeya.add_locations};
fs.mkdirSync(path.join(base,'mods'),{recursive:true});fs.writeFileSync(path.join(base,'mods','2026-10-22_registered_bugfixes.json'),JSON.stringify(mod,null,2));
fs.writeFileSync(path.join(base,'before.qsp'),raw);fs.writeFileSync(path.join(base,'candidate.qsp'),candidate);
for(const x of css.files){const b=fs.readFileSync(x.file);if(c.hash(b)!==x.sha256Before)throw Error('CSS changed '+x.file);const t=b.toString('utf8');if(t.split(css.old).length!==2)throw Error('CSS match count');const n=Buffer.from(t.replace(css.old,css.new),'utf8');if(c.hash(n)!==x.sha256After)throw Error('CSS candidate hash');fs.writeFileSync(path.join(base,x.candidate),n);}
const preserve=[path.join(full,'jack.qsp'),path.join(full,'css/base.css'),...fs.readdirSync(path.join(work,'save')).filter(n=>/\.sav$/i.test(n)).map(n=>path.join(work,'save',n))];
const manifest={before:qa.inspectWorld(raw),candidate:result,edits:edits.length,add_locations:egeya.add_locations.map(l=>l.name),css,protected:preserve.map(file=>({file,sha256:c.hash(fs.readFileSync(file))}))};
fs.writeFileSync(path.join(base,'manifest.json'),JSON.stringify(manifest,null,2));
fs.appendFileSync(path.join(base,'progress.md'),'\nTask 1: complete. Exact WORK before snapshot and protected Full/save hashes captured.\nTasks 2-6: fragments prepared; focused baseline failures and candidate passes captured. Integrated candidate ready for review/full release gate.\n');
console.log(JSON.stringify({candidate:result,edits:edits.length,protected:manifest.protected.length,css:css.files.map(x=>({file:x.file,after:x.sha256After}))}));
