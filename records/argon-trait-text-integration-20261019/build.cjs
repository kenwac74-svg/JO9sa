'use strict';
const fs=require('node:fs'),path=require('node:path'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const work='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const raw=fs.readFileSync(work),d=c.parse(raw),baseline=JSON.parse(fs.readFileSync(__dirname+'/baseline.json','utf8'));
if(c.hash(raw)!==baseline.sha256)throw Error('Work changed: '+c.hash(raw));
const before=new Map(d.locations.map(l=>[l.name,c.shift(d.lines[l.body],5)]));
let bodies=new Map(before),audit=[];
const traits=require('./trait-transform.cjs').transformLocations(bodies);bodies=traits.locations;audit.push(...traits.edits);
for(const name of require('./voice-transform.cjs').locations){const r=require('./voice-transform.cjs').transform(name,bodies.get(name));bodies.set(name,r.body);audit.push(...r.edits);}
{const r=require('./lesson-transform.cjs').transform(bodies.get('#static_txt'));bodies.set('#static_txt',r.body);audit.push(...r.edits);}
for(const name of require('./text-transform.cjs').locations){const r=require('./text-transform.cjs').transform(name,bodies.get(name));bodies.set(name,r.body);audit.push(...r.edits);}
const edits=[];
for(const l of d.locations){const old=before.get(l.name),next=bodies.get(l.name).replace(/\r?\n/g,'\r\n');if(old!==next){d.lines[l.body]=c.shift(next,-5);edits.push({location:l.name,field:'body',old,new:next,count:1});}}
const candidate=c.serialize(d);require('G:/somi/JO9sa/tools/qa/release-check.cjs').inspectWorld(candidate);
const out=__dirname+'/build';fs.mkdirSync(out,{recursive:true});fs.mkdirSync(out+'/mods',{recursive:true});
fs.writeFileSync(out+'/before.qsp',raw);fs.writeFileSync(out+'/candidate.qsp',candidate);
const mod={id:'2026-10-19_argon_trait_text_integration',description:'Connect seven dormant trait descriptions and new effects; repair dynamic lesson references and untranslated assistant-shop/status text.',before_sha256:c.hash(raw),after_sha256:c.hash(candidate),edits};
fs.writeFileSync(out+'/mods/2026-10-19_argon_trait_text_integration.json',JSON.stringify(mod,null,2));
fs.writeFileSync(out+'/audit.json',JSON.stringify({before:c.hash(raw),after:c.hash(candidate),locations:edits.map(e=>e.location),traits:traits.summary,edits:audit},null,2));
console.log(JSON.stringify({before:mod.before_sha256,after:mod.after_sha256,locations:edits.map(e=>e.location),auditEdits:audit.length,traits:traits.summary}));
