'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const baseline='972d1b7a8719c9b44e6aca4bfaf5a6f73908240762ce65061a7d298d0aa82679';
const input=process.argv[2]||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const raw=fs.readFileSync(input),d=c.parse(raw);assert.equal(d.hash,baseline);
const loc=d.locations.find(l=>l.name==='jo9_traits');assert(loc);
let body=c.shift(d.lines[loc.body],5);const original=body,edits=[];
const conditions=[
 ['jo9_ambition',1,'jo9_ambition_known','AMBITION'],
 ['jo9_work_ethic',1,'jo9_work_ethic_known','LEGACY_WORK_ACTIVE'],
 ['jo9_work_ethic',-1,'jo9_work_ethic_known','LEGACY_WORK_PASSIVE'],
 ['jo9_focus',1,'jo9_focus_known','FOCUS_POSITIVE'],
 ['jo9_focus',-1,'jo9_focus_known','FOCUS_NEGATIVE'],
 ['jo9_grudge',1,'jo9_grudge_known','GRUDGE_POSITIVE'],
 ['jo9_grudge',-1,'jo9_grudge_known','GRUDGE_NEGATIVE']
];
for(const [field,value,known,key] of conditions){
 const condition=`dynslave['${field}'] = ${value} and dynslave['${known}'] = 1`;
 const line=body.split('\r\n').filter(s=>s.includes('if '+condition+':'));
 assert.equal(line.length,1,'Expected unique display condition '+key);
 const old=line[0],id='REVELIO_NEW_'+key+'_20261028';
 const changed=old.replace(condition,()=>`dynslave['${field}'] = ${value} and (dynslave['${known}'] = 1 or spell_revelio = 1)`);
 assert.notEqual(old,changed);
 const replacement=`! JO9 MOD START ${id}\r\n${changed}\r\n! JO9 MOD END ${id}`;
 body=body.replace(old,()=>replacement);
 edits.push({location:'jo9_traits',field:'body',old,new:replacement,count:1,patchId:id});
}
assert.equal(edits.length,7);
d.lines[loc.body]=c.shift(body,-5);
const out=c.serialize(d),parsed=c.parse(out);assert.equal(parsed.locations.length,d.locations.length);
assert(c.serialize(parsed).equals(out));
// Ignoring only the new wrappers and seven OR clauses must recover the exact original body.
const unwrapped=body.replace(/^! JO9 MOD (?:START|END) REVELIO_NEW_[A-Z_]+_20261028\r\n?/gm,'').replace(/\((dynslave\['jo9_(?:ambition|work_ethic|focus|grudge)_known'\] = 1) or spell_revelio = 1\)/g,'$1');
assert.equal(unwrapped,original);
const patch={id:'2026-10-28_revelio_new_traits',description:'리벨리스·오베레그 활성 중 신규 숨은 특성 및 구형 활동 특성 표시. 실제 보유값·발견기록·확률·효과는 유지.',before_sha256:baseline,after_sha256:c.hash(out),edits};
fs.writeFileSync(path.join(__dirname,patch.id+'.json'),JSON.stringify(patch,null,2)+'\n');
fs.writeFileSync(path.join(__dirname,'candidate-jo9_traits.txt'),body);
console.log(JSON.stringify({before:baseline,after:patch.after_sha256,edits:edits.length,locations:parsed.locations.length,newLocations:0,otherCodeUnchanged:true}));
