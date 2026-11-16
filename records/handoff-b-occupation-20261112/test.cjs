'use strict';
const fs=require('fs'),a=require('assert/strict'),path=require('path');
const D=__dirname,c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
a(fs.existsSync(D+'/module.json'),'Occupation module must exist and contain confirmed rules');
const m=JSON.parse(fs.readFileSync(D+'/module.json','utf8')),r=JSON.parse(fs.readFileSync(D+'/probability-ledger.json','utf8')),s=JSON.parse(fs.readFileSync(D+'/occupation-specs.source.json','utf8'));
a.equal(s.specs.length,31);a.equal(s.specs.flatMap(x=>x.rules).length,78);a.equal(r.rules.filter(x=>x.status==='확정').length,73);
a.equal(m.add_locations.length,1);a.equal(m.add_locations[0].name,'jo9_occupation_init');
const body=m.add_locations[0].body;
a(body.includes("stock['jo9_bg_random'] ! 1"));a(body.includes('special_stock ! 0 or creating_clone ! 0'));
a(!/stock\['jo9_occ_/.test(body),'No added persistent occupation state');
for(const row of r.rules.filter(x=>x.type==='chance'&&x.mode==='add')){a(row.calculation&&row.extra,'Every add rule requires an explicit exact calculation: '+row.label+' '+row.target);}
for(const row of r.probabilities){const p=row.base[0]/row.base[1],e=row.eligible[0]/row.eligible[1],q=row.extra[0]/row.extra[1];a(Math.abs(p+e*q-(p+row.delta/100))<1e-12,row.id+' exact additional percentage points');a(q<=1&&q>=0,row.id);}
// Independently enumerate the actual common draw dependencies, including blocked positive work.
let cow=0,eligible=0,negative=0,neutral=0;
for(const [comfort,pc]of [[-1,1/24],[0,21/24],[1,1/24],[2,1/24]])for(const [sport,ps]of [[-1,1/18],[0,16/18],[1,1/18]])for(const [draw,pd]of [[0,6/7],[1,1/7]])for(const [glad,pg]of [[0,6/7],[1,1/7]])for(const [rawWork,pw]of [[0,8/10],[1,1/10],[-1,1/10]]){
 let k=draw&&sport!==1&&comfort>=0?1:0;if(glad)k=0;
 const w=rawWork===1&&k?0:rawWork,upper=w>0||comfort<0?1:w<0||comfort>0?-1:0,p=pc*ps*pd*pg*pw;
 if(k)cow+=p;if(!k&&sport!==1&&!glad&&upper!==1)eligible+=p;if(upper===-1)negative+=p;if(upper===0)neutral+=p;
}
for(const [got,want]of [[cow,391/3528],[eligible,1173/1960],[negative,5767/35280],[neutral,1193/1680]])a(Math.abs(got-want)<1e-12,'joint baseline enumeration');
// Slave-nature overlaps positive meekness: subtract only its nonpositive-meekness intersection.
const dl=r.rules.find(x=>x.target==='defiant = 1'&&x.type==='chance').extra.find(x=>x.condition==='j9occ_low = 1');
a.deepEqual(dl.eligible,[1333,1600],'Exact eligible defiant intersection for low ego/pride');
const raw=fs.readFileSync(process.env.OCCUPATION_BASELINE||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp');a.equal(c.hash(raw),m.before_sha256);
let d=c.parse(raw);const changed=[];
for(const e of m.edits){const l=d.locations.find(x=>x.name===e.location),b=c.shift(d.lines[l.body],5);a.equal(b.split(e.old).length-1,e.count);d.lines[l.body]=c.shift(b.replace(e.old,e.new),-5);changed.push(l.body);}
for(const l of m.add_locations){d.lines.splice(-1,0,c.shift(l.name,-5),c.shift(l.desc,-5),c.shift(l.body,-5),c.shift('0',-5));d.lines[3]=c.shift(String(d.locations.length+1),-5);d=c.parse(c.serialize(d));}
const candidate=c.serialize(d);a.equal(c.hash(candidate),m.after_sha256);a(c.serialize(c.parse(candidate)).equals(candidate));
for(const e of m.edits){const l=d.locations.find(x=>x.name===e.location),b=c.shift(d.lines[l.body],5);a.equal(b.split(e.new).length-1,1);}
// Reverse the exact module and compare original bytes; all unrelated original bodies remain unchanged.
const added=d.locations.at(-1);a.equal(added.name,'jo9_occupation_init');d.lines.splice(added.desc-1,4);d.lines[3]=c.shift(String(d.locations.length-1),-5);d=c.parse(c.serialize(d));
for(const e of [...m.edits].reverse()){const l=d.locations.find(x=>x.name===e.location),b=c.shift(d.lines[l.body],5);d.lines[l.body]=c.shift(b.replace(e.new,e.old),-5);}
a(c.serialize(d).equals(raw),'Reversal must restore original bytes');
console.log(JSON.stringify({pass:true,specs:s.specs.length,rules:78,confirmed:73,exactProbabilityCases:r.probabilities.length,edits:m.edits.length,locationsAdded:1,candidate:c.hash(candidate)}));
