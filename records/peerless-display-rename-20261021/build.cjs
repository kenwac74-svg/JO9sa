'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const repo='G:/somi/JO9sa',work='G:/somi/Jack O Nine Tails v2.4_work/game';
const record=repo+'/records/peerless-display-rename-20261021',temp='G:/Codex/tmp/peerless-display-rename-20261021';
const core=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const source=fs.readFileSync(work+'/jack.qsp'),before=core.hash(source);
assert.equal(before,'404b57f83893e6fc06ff69260b654de770de09a75c3709570c0eaa2d23411365');
const doc=core.parse(source),original=core.parse(source);assert(core.serialize(doc).equals(source));
const old='경국지색',name='절세미인',needle=core.shift(old,-5);
assert.equal(doc.lines.reduce((n,s)=>n+s.split(needle).length-1,0),4);
const edits=[],inventory=[];
const mask=s=>{let out='',last=0;for(const t of core.literals(s)){out+=s.slice(last,t.start);last=t.end+1;}return out+s.slice(last);};
for(const l of doc.locations){
 let body=core.shift(doc.lines[l.body],5);if(!body.includes(old))continue;const lines=body.split('\r\n');
 for(const [i,line]of lines.entries()){
  if(!line.includes(old))continue;
  assert(['menu_form','jo9_traits'].includes(l.name));assert.equal(line.split(old).length-1,1);
  const next=line.replace(old,name);assert.equal(mask(line),mask(next));
  const a=core.literals(line),b=core.literals(next);assert.equal(a.length,b.length);
  for(let n=0;n<a.length;n++){assert.equal(a[n].quote,b[n].quote);assert.equal(a[n].text.replaceAll(old,name),b[n].text);assert.deepEqual(core.protectedParts(a[n].text),core.protectedParts(b[n].text));}
  const id='PEERLESS_DISPLAY_NAME_'+String(edits.length+1).padStart(2,'0');
  const replacement='! JO9 MOD START '+id+' | 2026-10-21_peerless_display_name\r\n'+next+'\r\n! JO9 MOD END '+id;
  assert.equal(body.split(line).length-1,1);body=body.replace(line,replacement);
  edits.push({location:l.name,field:'body',old:line,new:replacement,count:1});
  inventory.push({location:l.name,line:i+1,before:line,after:next,id});
 }
 doc.lines[l.body]=core.shift(body,-5);
}
assert.equal(edits.length,4);assert.equal(doc.locations.length,original.locations.length);
const changed=[];
for(let i=0;i<doc.lines.length;i++)if(doc.lines[i]!==original.lines[i]){
 const l=doc.locations.find(l=>l.body===i);assert(l);let restored=core.shift(doc.lines[i],5);
 for(const e of [...edits].reverse().filter(e=>e.location===l.name)){assert.equal(restored.split(e.new).length-1,1);restored=restored.replace(e.new,e.old);}
 assert.equal(restored,core.shift(original.lines[i],5));changed.push(l.name);
}
const output=core.serialize(doc),after=core.hash(output),inspection=qa.inspectWorld(output);
assert.deepEqual([...changed].sort(),['jo9_traits','menu_form'].sort());
assert.equal(output.toString('utf16le').split(needle).length-1,0);
const patch={id:'2026-10-21_peerless_display_name',description:'Display-only rename to 절세미인; jo9_peerless/peerless, numeric effects and saves unchanged.',before_sha256:before,after_sha256:after,edits};
for(const d of [record,temp+'/inputs',temp+'/candidate',temp+'/mods'])fs.mkdirSync(d,{recursive:true});
for(const [p,b]of [[temp+'/inputs/baseline.qsp',source],[temp+'/candidate/jack.qsp',output]]){assert(!fs.existsSync(p));fs.writeFileSync(p,b);}
const patchBytes=JSON.stringify(patch,null,2)+'\n';
for(const p of [temp+'/mods/'+patch.id+'.json',repo+'/mods/'+patch.id+'.json']){assert(!fs.existsSync(p));fs.writeFileSync(p,patchBytes);}
fs.writeFileSync(record+'/BUILD_RESULT.json',JSON.stringify({before,after,displayReplacements:4,changedLocations:changed,inspection,newLocations:0,newStateKeys:0,allOtherQSPFieldsPreserved:true,nonliteralCodePreserved:true,inventory},null,2)+'\n');
console.log(JSON.stringify({before,after,displayReplacements:4,changedLocations:changed,inspection}));
