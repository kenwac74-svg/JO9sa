'use strict';
// Display-only inventory edit builder. Returns declarations; never writes a game file.
const assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
function buildLayoutEdits(doc){
 const location='master_stat',loc=doc.locations.find(l=>l.name===location);assert(loc,'Missing master_stat');
 const body=c.shift(doc.lines[loc.body],5),edits=[];
 for(const tag of ['CHAOTIC_ESSENCE_INVENTORY_LAB','CHAOTIC_ESSENCE_INVENTORY_NO_LAB']){
  const start=body.indexOf('! JO9 MOD START '+tag+' |');assert(start>=0,'Missing inventory block '+tag);
  const stop=body.indexOf('! JO9 MOD END '+tag,start);assert(stop>start);
  const section=body.slice(start,stop),oldRow="'망각의 정수 *<<lab_store[\"opium\"]>><br><br>' + _",newRow=oldRow.replace('<br><br>','<br>');
  if(!section.includes(oldRow)){assert.equal(section.split(newRow).length-1,1,'Unknown already-applied inventory section');continue;}
  assert.equal(section.split(oldRow).length-1,1,'Unique inventory group gap');
  const rowAt=body.indexOf(oldRow,start),end=body.indexOf('\r\n',rowAt);assert(end>rowAt&&end<stop);
  const old=body.slice(start,end),next=old.replace(oldRow,newRow);
  assert.equal(body.split(old).length-1,1,'Unique context for '+tag);
  assert.equal(old.replace(/<br>/g,''),next.replace(/<br>/g,''),'Only an empty break may change');
  edits.push({location,field:'body',old,new:next,count:1});
 }
 return edits;
}
module.exports={buildLayoutEdits,edits:buildLayoutEdits};
if(require.main===module){
 const fs=require('node:fs'),input=process.argv[2]||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
 const raw=fs.readFileSync(input),doc=c.parse(raw),edits=buildLayoutEdits(doc),copy={...doc,lines:doc.lines.slice()};
 for(const e of edits){const l=copy.locations.find(l=>l.name===e.location),body=c.shift(copy.lines[l.body],5);copy.lines[l.body]=c.shift(body.replace(e.old,()=>e.new),-5);}
 assert.equal(buildLayoutEdits(c.parse(c.serialize(copy))).length,0,'Inventory display edits must be idempotent');
 console.log(JSON.stringify({sourceHash:c.hash(raw),runtimeWritten:false,edits}));
}
