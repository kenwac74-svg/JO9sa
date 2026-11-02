'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('../text-workshop/core.cjs'),{gates,body}=require('./probe.cjs');
function build(raw){
 const doc=core.parse(raw);assert(core.serialize(doc).equals(raw),'Byte-exact roundtrip');
 const before=gates(doc),edits=[];
 for(const g of before){
  const old=g.condition;
  assert.equal(old,`${g.role}['sub_tentacles'] > tentacle_size or ${g.role}['virginity'] = 4`,'Expected unpatched production condition');
  const replacement=`${g.role}['sub_tentacles'] > tentacle_size or (${g.role}['virginity'] = 4 and ${g.role}['sub_tentacles'] >= tentacle_size)`;
  const l=doc.locations.find(l=>l.name===g.location),text=body(doc,g.location);
  assert.equal(text.split(old).length-1,1,'Unique predicate '+g.location+g.role);
  doc.lines[l.body]=core.shift(text.replace(old,replacement),-5);
  edits.push({location:g.location,field:'body',old,new:replacement,count:1});
 }
 const candidate=core.serialize(doc),parsed=core.parse(candidate),original=core.parse(raw);
 assert(core.serialize(parsed).equals(candidate));assert.equal(parsed.locations.length,original.locations.length);
 const allowed=new Set(before.map(g=>original.locations.find(l=>l.name===g.location).body));
 for(let i=0;i<original.lines.length;i++)if(!allowed.has(i))assert.equal(parsed.lines[i],original.lines[i],'Unrelated field changed '+i);
 assert.deepEqual([...allowed].length,3);
 const patch={id:'2026-11-02_meiki_production_grade',description:'Approved A: one education step lower for meiki; Kraken B; preserve all existing yield bonuses and other conditions.',before_sha256:core.hash(raw),after_sha256:core.hash(candidate),edits};
 return {raw:candidate,patch,report:{schema:1,beforeSha256:patch.before_sha256,afterSha256:patch.after_sha256,locations:parsed.locations.length,changedLocations:[...new Set(edits.map(e=>e.location))],predicateCount:edits.length,ordinaryMinimum:['D','C','B','A','S'],meikiMinimum:['F','D','C','B','A'],roundtrip:true,unrelatedFieldsPreserved:true}};
}
if(require.main===module){const [input,out]=process.argv.slice(2);assert(input&&out,'usage: build.cjs BASELINE_QSP OUT_DIRECTORY');const r=build(fs.readFileSync(input));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'jack.qsp'),r.raw);fs.writeFileSync(path.join(out,'patch.json'),JSON.stringify(r.patch,null,2)+'\n');fs.writeFileSync(path.join(out,'build.json'),JSON.stringify(r.report,null,2)+'\n');console.log(JSON.stringify(r.report));}
module.exports={build};
