'use strict';
// Six milk-quantity report links only. No runtime writes or lesson-menu changes.
const assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const expected='38aaaaa5e7c424ec0f9b0b22f125bc2ca4966392ea42f982750375c4d982c0ed';
const targets=[['sjm_UI_UIadds','slave'],['slave_private_room1','room1'],['slave_private_room2','room2'],['slave_private_room3','room3'],['slave_private_room4','room4'],['snk_room_menu_screen','slave']];
function buildPrivateMilkEdits(doc){
 const edits=[];
 for(const [location,role]of targets){
  const loc=doc.locations.find(l=>l.name===location);assert(loc,'Missing milk UI '+location);
  const body=c.shift(doc.lines[loc.body],5),hits=body.split('\r\n').filter(line=>line.includes('$'+role+'_milk_quantity')&&line.includes('tooltip-data="모유 분비함"'));
  assert.equal(hits.length,1,'Expected one report link '+location);
  const old=hits[0];
  if(old.includes('<a style="display:inline-block;position:relative;"')&&old.includes('</a>'))continue;
  assert.equal(old.split('<div style="display:inline-block;position:relative;"').length-1,1);
  assert.equal(old.split('</div>').length-1,1);
  assert(old.includes('href = "EXEC: gs \'\'#var_base\'\' & msg $'+role+'_milk_quantity"'));
  const next=old.replace('<div style="display:inline-block;position:relative;"','<a style="display:inline-block;position:relative;"').replace('</div>','</a>');
  assert.equal(body.split(old).length-1,1);
  edits.push({location,field:'body',old,new:next,count:1});
 }
 return edits;
}
// Use the same complete instance-variable schema as the existing room bridge.
// Snapshot before and after a read-only report click, and after bridge close.
function snapshotRoles(save){
 const schema=save.vars.find(v=>v.name==='SLAVE_VARS');assert(schema&&schema.values.length>=20,'Missing role schema');
 const roles=['slave','assistant','room1','room2','room3','room4','snk_parked_slave'];
 const result={};
 for(const role of roles){
  const fields=[];
  for(const [,template]of schema.values){
   const name=template.replace(/^\$/,'').replaceAll('instance',role).toUpperCase();
   if(fields.some(r=>r.name===name))continue;
   const v=save.vars.find(v=>v.name===name),data=v?{values:v.values,idx:v.idx}:{values:[],idx:[]};
   fields.push({name,sha256:c.hash(Buffer.from(JSON.stringify(data)))});
  }
  result[role]={state:sc.value(save,role+'_state')[0],type:sc.value(save,role+'_type')[0],id:sc.value(save,role,'id')[0],name:sc.value(save,role+'_name')[1],milk:sc.value(save,role,'milk_summ')[0],fields};
 }
 return result;
}
function assertRolesPreserved(before,after){assert.deepEqual(snapshotRoles(after),snapshotRoles(before),'Actor instance state changed');}
module.exports={buildPrivateMilkEdits,buildPrivateEdits:buildPrivateMilkEdits,snapshotRoles,assertRolesPreserved};
if(require.main===module){
 const fs=require('node:fs');
 const raw=fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'),doc=c.parse(raw);assert.equal(doc.hash,expected);assert(c.serialize(doc).equals(raw));
 const edits=buildPrivateMilkEdits(doc);assert.equal(edits.length,6);
 const clone={...doc,lines:doc.lines.slice()};
 for(const e of edits){const l=clone.locations.find(l=>l.name===e.location),b=c.shift(clone.lines[l.body],5);assert.equal(b.split(e.old).length-1,1);clone.lines[l.body]=c.shift(b.replace(e.old,()=>e.new),-5);}
 assert.equal(buildPrivateMilkEdits(clone).length,0);
 const saves=['G:/somi/Jack O Nine Tails v2.4_work/game/save/27_private_reports.sav','G:/somi/Jack O Nine Tails v2.4_work/game/save/JO9_MANUAL_20261025/02_수동확인_문제재현/27_private_reports.sav'];
 const buffers=saves.map(p=>fs.readFileSync(p));assert(buffers[0].equals(buffers[1]),'Reported save copies differ');
 const state=sc.parse(buffers[0]);assert(sc.serialize(state).equals(buffers[0]));
 const audit={status:'STATIC_REPLAY_PASS',runtimeWritten:false,sourceHash:doc.hash,edits:edits.length,locations:targets.map(t=>t[0]),onlyChange:'Active report element DIV->A; existing style, tooltip, href, image and conditions unchanged.',save:{paths:saves,sha256:c.hash(buffers[0]),identicalCopies:true,roleState:snapshotRoles(state)},excluded:{bridge135:'Read-only root-cause/provenance investigation; no whitelist edit or removed feature restoration.',crownPopup:'No change requested; untouched.'},nativeCriteria:['Load the preserved adult report fixture. Click original active slave milk report; expect quantity80 and working native close, no actor/milk/money/day changes.','Assistant existing link remains the control case, quantity80.','Room1 original report must show its own80; repeat room2..4 using isolated adult fixture copies and distinguishable quantities to prevent cross-role reports.','Room portrait/bridge report, then normal profile close: compare the complete original SLAVE_VARS instance fields, original active actor, assistant, room actor and empty parked slot.','Absent lactation keeps its original nonclickable indicator. Do not execute production actions or teaching from this test.']};
 fs.writeFileSync(__dirname+'/private-audit.json',JSON.stringify(audit,null,2)+'\n');
 console.log(JSON.stringify({status:audit.status,edits:edits.length,idempotent:true,runtimeWritten:false,saveHash:audit.save.sha256}));
}
