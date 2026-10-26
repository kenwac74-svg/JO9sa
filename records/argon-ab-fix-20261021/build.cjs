'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const root=__dirname,file=root+'/inputs/baseline.qsp',raw=fs.readFileSync(file),doc=core.parse(raw),base=core.parse(raw),before='995cd980c9a91416655fd096fc02817e29afc47876011f4c43b132c3bd6c6bab';
assert.equal(core.hash(raw),before);assert(core.serialize(doc).equals(raw));const edits=[],details=[],allowed=new Set(['#var_base','#npc_base']);
function edit(location,old,newText,label,detail){
 const l=doc.locations.find(l=>l.name===location),body=core.shift(doc.lines[l.body],5);assert.equal(body.split(old).length-1,1,label+' exact occurrence');
 assert(!/\r|\n/.test(old+newText),'Whole one-line edits only');
 const replacement='! JO9 MOD START '+label+' | 2026-10-21_argon_ab_display_repairs\r\n'+newText+'\r\n! JO9 MOD END '+label;
 doc.lines[l.body]=core.shift(body.replace(old,replacement),-5);edits.push({location,field:'body',old,new:replacement,count:1});details.push({location,label,...detail});
}
let b=core.shift(doc.lines[doc.locations.find(l=>l.name==='#var_base').body],5);
for(const n of [2,3]){
 const oldToken='<<croom'+n+'["milk_summ"]>>',newToken='<<room'+n+'["milk_summ"]>>',lines=b.split('\r\n').filter(s=>s.includes(oldToken));
 assert.equal(lines.length,1);const old=lines[0];assert(old.includes("if room"+n+"['milk_summ'] >= 50:"));edit('#var_base',old,old.replace(oldToken,newToken),'ARGONAB_MILK_ROOM'+n,{oldToken,newToken,count:1});
}
const rec=JSON.parse(fs.readFileSync('G:/somi/JO9sa/records/argon-11-14-editorial-20261021/npc-functional.json','utf8'));
const groups=new Map();for(const r of rec.recommendations){if(!groups.has(r.variable))groups.set(r.variable,[]);groups.get(r.variable).push(r);}assert.equal(groups.size,6);let htmlTokens=0;
for(const [variable,rules]of groups){
 const body=core.shift(doc.lines[doc.locations.find(l=>l.name==='#npc_base').body],5),lines=body.split('\r\n').filter(s=>s.trimStart().startsWith(variable+' ='));assert.equal(lines.length,1,variable);const old=lines[0];let next=old;
 for(const r of rules){assert.equal(next.split(r.oldToken).length-1,r.count,variable+' token count');next=next.replaceAll(r.oldToken,r.newToken);htmlTokens+=r.count;}
 const label='ARGONAB_'+variable.replace(/[^a-z0-9]/gi,'_').replace(/^_+|_+$/g,'').toUpperCase();edit('#npc_base',old,next,label,{variable,tokens:rules.map(r=>({old:r.oldToken,new:r.newToken,count:r.count}))});
}
assert.equal(htmlTokens,12);assert.equal(edits.length,8);assert.equal(doc.lines.length,base.lines.length);const changed=[];
for(let i=0;i<base.lines.length;i++){if(base.lines[i]===doc.lines[i])continue;const loc=doc.locations.find(l=>l.body===i);assert(loc&&allowed.has(loc.name));let revert=core.shift(doc.lines[i],5);for(const e of [...edits].reverse().filter(e=>e.location===loc.name)){assert.equal(revert.split(e.new).length-1,1);revert=revert.replace(e.new,e.old);}assert.equal(revert,core.shift(base.lines[i],5),'All other content preserved');changed.push(loc.name);}
const out=core.serialize(doc);qa.inspectWorld(out);const after=core.hash(out),patch={id:'2026-10-21_argon_ab_display_repairs',description:'Approved A/B only: two milk value interpolation references and twelve HTML tokens in six existing NPC strings.',before_sha256:before,after_sha256:after,edits};
fs.writeFileSync(root+'/candidate.qsp',out);fs.writeFileSync(root+'/mods/'+patch.id+'.json',JSON.stringify(patch,null,2)+'\n');
fs.writeFileSync(root+'/build-result.json',JSON.stringify({before,after,edits:8,interpolationReferences:2,htmlTokens:12,locations:262,changedBodies:changed,newLocations:0,newStateKeys:0,otherContentPreserved:true,details},null,2)+'\n');console.log(JSON.stringify({before,after,edits:8,htmlTokens:12,changedBodies:changed}));