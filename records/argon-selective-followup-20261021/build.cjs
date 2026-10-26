"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',core=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const scratch='G:/Codex/tmp/argon-selective-followup-20261021',record=__dirname;
const raw=fs.readFileSync(scratch+'/inputs/baseline.qsp'),before='a2e0265881bebd8a72b3fcbb214ddaf831106cfe50e9c96da8e0b6e7d692707a';
assert.equal(core.hash(raw),before);const doc=core.parse(raw),base=core.parse(raw);assert(core.serialize(doc).equals(raw));
const specifications=[['npc-format-candidates.json','format'],['editorial-candidates.json','editorial']];
const items=[];for(const [name,kind]of specifications){const s=JSON.parse(fs.readFileSync(path.join(record,name),'utf8').replace(/^\uFEFF/,''));const entries=s.candidates||s.entries||s.items;assert(Array.isArray(entries),name+' entries');for(const e of entries){const variable=e.key||e.variable;let old=e.oldLine||e.old;if(!old&&e.originalAssignmentSha256){const loc=base.locations.find(l=>l.name===e.location);const hits=core.shift(base.lines[loc.body],5).split('\r\n').filter(l=>l.trimStart().startsWith(variable+' ='));assert.equal(hits.length,1);old=hits[0];assert.equal(core.hash(Buffer.from(old,'utf8')),e.originalAssignmentSha256);}items.push({...e,formatKind:e.kind,kind,old,new:e.newLine||e.new,variable,sourceSpec:name});}}
const mask=s=>{let v='',last=0;for(const t of core.literals(s)){v+=s.slice(last,t.start)+s[t.end];last=t.end+1;}return v+s.slice(last);};
const removeBoldFont=s=>s.replace(/<\/?(?:b|font)\b[^>]*>/gi,'');
const changed=[],edits=[];let textN=0;const targets=new Set();
for(const e of items){
 assert(['#npc_base','#txt_man','#static_txt'].includes(e.location),'Unexpected location');
 assert.equal(typeof e.old,'string');assert.equal(typeof e.new,'string');assert(!/[\r\n]/.test(e.old+e.new),'Single physical lines only');assert.notEqual(e.old,e.new);
 assert.equal(mask(e.old),mask(e.new),'Nonliteral change '+e.variable);const a=core.literals(e.old),b=core.literals(e.new);assert.equal(a.length,b.length);
 let changedLiteral=0;for(let i=0;i<a.length;i++){assert.equal(a[i].quote,b[i].quote);if(a[i].text===b[i].text)continue;changedLiteral++;const lead=e.old.slice(0,a[i].start-1);assert(/\$[\w]+(?:\[[^\r\n]*\])?\s*=\s*$/.test(lead),'Non-display literal change '+e.variable);
  if(e.kind==='editorial'){assert.deepEqual(core.protectedParts(a[i].text),core.protectedParts(b[i].text),'Protected HTML/interpolation changed '+e.variable);core.validateMarkup(b[i].text);}else if(e.formatKind==='manual-placeholder'){assert.equal(e.variable,"$bishop_shaitana_pref[2]");assert.equal(b[i].text,'[주교 샤이타나]<br>수동편집</div>');assert(a[i].text.startsWith('[주교 샤이타나]<br>'));assert(a[i].text.endsWith('</div>'));}else{const oldPlain=removeBoldFont(a[i].text).replace(' (true)',''),newPlain=removeBoldFont(b[i].text);assert.equal(oldPlain,newPlain,'Format edit changed prose '+e.variable);const interp=t=>t.match(/<<[\s\S]*?>>/g)||[];assert.deepEqual(interp(a[i].text),interp(b[i].text));}
 }
 assert.equal(changedLiteral,1,'Exactly one display literal per assignment '+e.variable);
 const loc=doc.locations.find(l=>l.name===e.location);assert(loc);let body=core.shift(doc.lines[loc.body],5);assert.equal(body.split(e.old).length-1,1,'Anchor not unique '+e.variable);
 const id=e.id||e.label||(e.kind==='editorial'?'ARGONSEL_TEXT_'+String(++textN).padStart(3,'0'):null);assert(id&&/^[A-Z0-9_]+$/.test(id));
 assert(!targets.has(e.location+'|'+e.variable),'Duplicate variable');targets.add(e.location+'|'+e.variable);
 const replacement='! JO9 MOD START '+id+' | 2026-10-21_argon_selective_followup\r\n'+e.new+'\r\n! JO9 MOD END '+id;
 doc.lines[loc.body]=core.shift(body.replace(e.old,replacement),-5);edits.push({location:e.location,field:'body',old:e.old,new:replacement,count:1});changed.push({...e,id});
}
const changedBodies=[];assert.equal(doc.lines.length,base.lines.length);assert.equal(doc.locations.length,base.locations.length);
for(let i=0;i<doc.lines.length;i++){if(doc.lines[i]===base.lines[i])continue;const loc=doc.locations.find(l=>l.body===i);assert(loc);let restored=core.shift(doc.lines[i],5);for(const e of [...edits].reverse().filter(e=>e.location===loc.name)){assert.equal(restored.split(e.new).length-1,1);restored=restored.replace(e.new,e.old);}assert.equal(restored,core.shift(base.lines[i],5),'Unrelated change '+loc.name);changedBodies.push(loc.name);}
const out=core.serialize(doc),inspection=qa.inspectWorld(out);const patch={id:'2026-10-21_argon_selective_followup',description:'Approved six NPC display corrections and selected existing mansion dialogue prose; no condition/value/route/state changes.',before_sha256:before,after_sha256:core.hash(out),edits};
fs.mkdirSync(scratch+'/mods',{recursive:true});fs.writeFileSync(scratch+'/build/candidate.qsp',out);fs.writeFileSync(scratch+'/mods/'+patch.id+'.json',JSON.stringify(patch,null,2)+'\n','utf8');
const result={before,after:patch.after_sha256,edits:items.length,editorial:items.filter(e=>e.kind==='editorial').length,format:items.filter(e=>e.kind==='format').length,changedBodies,allOtherFieldsPreserved:true,nonliteralCodePreserved:true,editorialProtectedTokensPreserved:true,newLocations:0,newStateKeys:0,inspection,items:changed};fs.writeFileSync(record+'/build-result.json',JSON.stringify(result,null,2)+'\n','utf8');console.log(JSON.stringify({before,after:result.after,edits:result.edits,editorial:result.editorial,format:result.format,changedBodies}));
