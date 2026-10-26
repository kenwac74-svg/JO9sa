'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',core=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const root=__dirname,baseline=process.argv[2]||root+'/inputs/baseline.qsp',raw=fs.readFileSync(baseline),doc=core.parse(raw),base=core.parse(raw);
const expected='c6ba9600e78f38ae1adeb9cf5c09a53115254ec40f666e48b53b912ab3e0195e';
assert.equal(core.hash(raw),expected,'Baseline drift');assert(core.serialize(doc).equals(raw));
const allowed=new Set(['#var_base','#npc_base','interaction_city']);
const files=['varbase.json','npc.json','city.json'],items=[],dispositions=[];
const norm=s=>s.replace(/\r?\n/g,'\r\n');
const mask=s=>{let p=0,v='';for(const x of core.literals(s)){v+=s.slice(p,x.start)+s[x.end];p=x.end+1;}return v+s.slice(p);};
function checkEdit(e){
 assert(allowed.has(e.location));assert.equal(e.count,1);assert(e.old&&e.new&&e.old!==e.new);
 assert(!/\r(?!\n)|(?<!\r)\n/.test(e.old+e.new),'Non-CRLF edit');
 const a=core.literals(e.old),b=core.literals(e.new);assert.equal(a.length,b.length,'Literal count changed '+e.variable);assert(a.length>0,'No literal');
 assert.equal(mask(e.old),mask(e.new),'Nonliteral code changed '+e.variable);
 for(let i=0;i<a.length;i++){if(a[i].text!==b[i].text){const lead=e.old.slice(0,a[i].start-1);assert(/(?:\$[\p{L}_][\p{L}\p{N}_]*(?:\[[^\r\n]*?\])?)\s*=\s*$/u.test(lead)||/\+\s*_\r\n[ \t]*$/.test(lead),'A non-display key or nonassignment literal changed '+e.variable);}assert.equal(a[i].quote,b[i].quote);assert.deepEqual(core.protectedParts(a[i].text),core.protectedParts(b[i].text),'Markup/interpolation changed '+e.variable);core.validateMarkup(b[i].text);}
}
for(const file of files){
 const data=JSON.parse(fs.readFileSync(root+'/fragments/'+file,'utf8').replace(/^\uFEFF/,''));
 assert(Array.isArray(data.items));dispositions.push({file,dispositions:data.dispositions||null,functionalCandidates:data.functionalCandidates||null});
 for(const e0 of data.items){const e={...e0,old:norm(e0.old),new:norm(e0.new),sourceFragment:file};checkEdit(e);items.push(e);}
}
assert(items.length>0);const patch={id:'2026-10-21_argon_11_14_editorial',description:'Selective dialogue and description prose only; conditions, values, routes, markup and discriminators preserved.',before_sha256:expected,edits:[]};
const scope=[];
for(const [i,e]of items.entries()){
 const l=doc.locations.find(l=>l.name===e.location);assert(l);
 let body=core.shift(doc.lines[l.body],5);assert.equal(body.split(e.old).length-1,1,'Old anchor not unique '+e.variable);
 const id='ARGON1114_TEXT_'+String(i+1).padStart(3,'0');
 const oldLines=e.old.split('\r\n'),newLines=e.new.split('\r\n');assert.equal(oldLines.length,newLines.length,'Editorial edits keep physical lines');const changedLines=new Set();for(let j=0;j<newLines.length;j++){if(oldLines[j]===newLines[j])continue;let first=j,last=j;while(first>0&&/\+\s*_\s*$/.test(newLines[first-1]))first--;while(last<newLines.length-1&&/\+\s*_\s*$/.test(newLines[last]))last++;for(let k=first;k<=last;k++)changedLines.add(k);}let marked=[],segment=0;for(let j=0;j<newLines.length;j++){if(!changedLines.has(j)){marked.push(newLines[j]);continue;}const block=id+'_'+String(++segment).padStart(2,'0');marked.push('! JO9 MOD START '+block+' | '+patch.id);while(j<newLines.length&&changedLines.has(j)){marked.push(newLines[j]);j++;}marked.push('! JO9 MOD END '+block);j--;}const replacement=marked.join('\r\n');
 assert(body.includes(e.old));body=body.replace(e.old,replacement);doc.lines[l.body]=core.shift(body,-5);
 patch.edits.push({location:e.location,field:'body',old:e.old,new:replacement,count:1});
 scope.push({...e,id,addedMarkup:false});
}
const marker=/^! JO9 MOD (?:START|END) ARGON1114_TEXT_\d{3}_\d{2}[^\r\n]*(?:\r\n)?/gm;
const changed=[];
for(let i=0;i<base.lines.length;i++){
 if(base.lines[i]===doc.lines[i])continue;
 const loc=doc.locations.find(l=>l.body===i);assert(loc&&allowed.has(loc.name),'Unrelated QSP field');
 const b=core.shift(base.lines[i],5),n=core.shift(doc.lines[i],5);
 assert.equal(mask(b),mask(n.replace(marker,'')),'Whole-body nonliteral delta '+loc.name);changed.push(loc.name);
}
assert.equal(base.lines.length,doc.lines.length);assert.equal(base.locations.length,doc.locations.length);
const out=core.serialize(doc);qa.inspectWorld(out);patch.after_sha256=core.hash(out);
fs.writeFileSync(root+'/candidate.qsp',out);
fs.mkdirSync(root+'/mods',{recursive:true});fs.writeFileSync(root+'/mods/'+patch.id+'.json',JSON.stringify(patch,null,2)+'\n');
fs.writeFileSync(root+'/selection.json',JSON.stringify({before:expected,after:patch.after_sha256,total:items.length,changedLocations:changed,allOtherQspFieldsIdentical:true,nonliteralCodeIdenticalIgnoringOwnMarkers:true,markupAndInterpolationIdentical:true,newLocations:0,newStateKeys:0,items:scope,dispositions},null,2)+'\n');
console.log(JSON.stringify({before:expected,after:patch.after_sha256,total:items.length,changedLocations:changed,bySource:Object.fromEntries(files.map(f=>[f,items.filter(e=>e.sourceFragment===f).length]))}));