'use strict';
// Existing private-room menu navigation only. No lesson body/action is changed.
const assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
function buildBridgeUiEdits(doc){
 const l=doc.locations.find(l=>l.name==='snk_room_bridge');assert(l,'Missing existing room bridge');
 const body=c.shift(doc.lines[l.body],5);
 assert(body.includes("if $args[1] = 'interaction' or $args[1] = 'interaction_result' or $args[1] = 'interaction_screen': exit"),'Existing generic interaction route must remain');
 assert(body.includes('  if menu_form = 13: exit'),'Existing back menu route must remain');
 if(body.includes('  if menu_form = 135: exit'))return [];
 const old='  if menu_form = 134: exit\r\n  if menu_form = 136: exit';
 assert.equal(body.split(old).length-1,1,'Existing menu navigation context drift');
 return [{location:'snk_room_bridge',field:'body',old,new:'  if menu_form = 134: exit\r\n  if menu_form = 135: exit\r\n  if menu_form = 136: exit',count:1}];
}
module.exports={buildBridgeUiEdits};
if(require.main===module){const fs=require('node:fs'),doc=c.parse(fs.readFileSync(process.argv[2]||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp')),edits=buildBridgeUiEdits(doc);const clone={...doc,lines:doc.lines.slice()};for(const e of edits){const l=clone.locations.find(l=>l.name===e.location);clone.lines[l.body]=c.shift(c.shift(clone.lines[l.body],5).replace(e.old,()=>e.new),-5);}assert.equal(buildBridgeUiEdits(clone).length,0);console.log(JSON.stringify({runtimeWritten:false,edits:edits.length,idempotent:true,newLocations:0,newPersistentKeys:0,existingInteractionRouteUnchanged:true}));}
