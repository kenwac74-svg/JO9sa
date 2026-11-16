'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const temp='G:/Codex/tmp/jo9-cow-costume-20261111';
const core=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const baseline='396abb21437e04713d1f461b018af80821f4a077b261492b122db334af29217a';
const id='2026-11-11_cow_costume';
const raw=fs.readFileSync(game+'/jack.qsp'),world=core.parse(raw);
assert.equal(core.hash(raw),baseline,'WORK changed since item design; re-read before preparing');
assert.equal(core.hash(fs.readFileSync(repo+'/assets/runtime/2.4.1/jack.qsp')),baseline,'Tracked snapshot differs from WORK');
assert(core.serialize(world).equals(raw));
assert(!world.locations.some(x=>x.name==='jo9_cow_costume'));
const body=name=>core.shift(world.lines[world.locations.find(x=>x.name===name).body],5);
const crlf=s=>s.replace(/\r\n|\r|\n/g,'\r\n');
const quote=s=>"'"+s.replaceAll("'","''")+"'";
const original=Object.fromEntries(world.locations.map(l=>[l.name,body(l.name)]));
const edits=[];
function edit(location,oldText,newText,count=1,patchId='COW_COSTUME_20261111'){
 const text=body(location);
 assert.equal(text.split(oldText).length-1,count,location+' unique anchor');
 const l=world.locations.find(x=>x.name===location);
 world.lines[l.body]=core.shift(text.split(oldText).join(newText),-5);
 edits.push({location,field:'body',old:oldText,new:newText,count,patchId});
}
function append(location,op){
 const old=body(location).match(/[^\r\n]+(?:\r\n)*$/)[0];
 const add=crlf(`! JO9 MOD START COW_COSTUME_${op.toUpperCase()}_20261111\ngs 'jo9_cow_costume', '${op}'\n! JO9 MOD END COW_COSTUME_${op.toUpperCase()}_20261111`);
 edit(location,old,old+'\r\n'+add);
}
const dynamics=original['#dynamic'].split('\r\n');
const oldSlave=dynamics.filter(s=>/if slave_inventory\['cow_gear'\]/.test(s));
const oldAssistant=dynamics.filter(s=>/if assistant_inventory\['cow_gear'\]/.test(s));
assert.equal(oldSlave.length,1);assert.equal(oldAssistant.length,1);
let helper=fs.readFileSync(__dirname+'/jo9-cow-costume.qsp.txt','utf8');
helper=helper.replace('@@OLD_SLAVE_LINE@@',oldSlave[0]).replace('@@OLD_ASSISTANT_LINE@@',oldAssistant[0]);
assert(!helper.includes('@@'));
helper=crlf(helper);
append('#item_base','data');append('#dynamic','equipment');append('#options','menus');
const loadFirst=body('$ongload').split('\r\n')[0];
edit('$ongload',loadFirst,crlf("! JO9 MOD START COW_COSTUME_LOAD_20261111\ngs 'jo9_cow_costume', 'load'\n! JO9 MOD END COW_COSTUME_LOAD_20261111\n")+loadFirst);
const drawOld="if $outfit_game = 'cow_gear': $outfit_patch = 'cow'";
edit('display_fullimage',drawOld,drawOld+crlf("\n! JO9 MOD START COW_COSTUME_IMAGE_20261111\nif $outfit_game = 'cow_costume': $outfit_patch = 'cow'\n! JO9 MOD END COW_COSTUME_IMAGE_20261111"));
for(const [oldScene,newScene,type]of [[39933,39934,'buy_item'],[39833,39834,'buy_item_assistant']]){
 const oldType=oldScene===39933?'buy_item_slut':'buy_item_assistant_slut';
 const oldBlock=crlf(`IF interaction_city = ${oldScene}:\n $place = 'baraholka'\n $return_lock  = 'shop_general'\n $interaction_type = '${oldType}'\n $item_id = 'slutcostume'\nEND`);
 assert(!original.interaction_city.includes(`interaction_city = ${newScene}:`));
 const add=crlf(`! JO9 MOD START COW_COSTUME_SALE_${newScene}_20261111\nIF interaction_city = ${newScene}:\n $place = 'baraholka'\n $return_lock  = 'shop_general'\n $interaction_type = '${type}'\n $item_id = 'cow_costume'\n item_qty = 1\nEND\n! JO9 MOD END COW_COSTUME_SALE_${newScene}_20261111`);
 edit('interaction_city',oldBlock,oldBlock+'\r\n'+add);
}
world.lines.splice(world.lines.length-1,0,core.shift('jo9_cow_costume',-5),'',core.shift(helper,-5),core.shift('0',-5));
world.lines[3]=core.shift(String(world.locations.length+1),-5);
const candidate=core.serialize(world),structure=qa.inspectWorld(candidate);
assert.equal(body('interaction'),original.interaction,'High-level training item requirements must stay intact');
assert.equal(core.hash(fs.readFileSync(game+'/jack.qsp')),baseline,'WORK changed during candidate build');
const mod={id,status:'APPROVED',description:'Add the ordinary cow costume sold at the flea market for 25 sparks, reusing cow images with exoticism +1, daily taming +1, cow learning +2 and style -1. No intellect/pride loss or refusal. Original advanced-training gear requirement retained.',before_sha256:baseline,after_sha256:core.hash(candidate),add_locations:[{name:'jo9_cow_costume',desc:'',body:helper,actions:[]}],edits};
fs.mkdirSync(temp+'/mods',{recursive:true});
fs.writeFileSync(temp+'/candidate.qsp',candidate);
fs.writeFileSync(temp+'/replay.qsp',raw);
fs.writeFileSync(temp+'/mods/'+id+'.json',JSON.stringify(mod,null,2)+'\n');
fs.writeFileSync(temp+'/helper.qsp.txt',helper);
fs.writeFileSync(temp+'/prepared.json',JSON.stringify({before:baseline,after:core.hash(candidate),edits:edits.length,structure,changedLocations:[...new Set(edits.map(e=>e.location))],addedLocations:['jo9_cow_costume'],workModified:false,sourceModified:false},null,2)+'\n');
console.log(JSON.stringify({candidate:temp+'/candidate.qsp',mod:temp+'/mods/'+id+'.json',before:baseline,after:core.hash(candidate),structure}));
