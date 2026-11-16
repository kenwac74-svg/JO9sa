import test from 'node:test';import assert from 'node:assert/strict';
import {masterStats,initialValue,initialCm,cmInitialChanges} from '../overrides/studio-role.mjs';
const catalog={fields:[{key:'master_medic',label:'의학',group:'능력치·상태·경험치',kind:'number',value:0,inherited:true,phase:'preset',sources:[{location:'init_game',line:3,expression:'0'}]},
 {key:'$master_ring',label:'반지',group:'장비·유물',kind:'string',value:'none',expression:"'none'",inherited:true,phase:'preset',sources:[]},
 {key:'master_energy',label:'행동력',group:'능력치·상태·경험치',kind:'number',value:null,expression:'master_str + 1',phase:'description',recalculated:true,sources:[{location:'hero_description',line:13,expression:'master_str + 1'}]}]};
test('inherited strings and calculated values appear with provenance and no assumed zero',()=>{
 const html=masterStats({statsCode:''},'master',{},catalog,{});
 assert.match(html,/data-st-initial="master_medic"/);assert.match(html,/data-st-initial="\$master_ring"/);assert.match(html,/value="none"/);
 assert.match(html,/init_game:3/);assert.match(html,/master_str \+ 1/);assert.match(html,/조건|자동/);assert.match(html,/data-initial-filter/);
 assert.match(html,/data-st-initial="master_energy" value=""/);
});
test('pending override and reset are distinct and preserve strings',()=>{
 const row=catalog.fields[1];assert.equal(initialValue(row,{'$master_ring':'new'}),'new');
 assert.equal(initialValue(row,{}),'none');
 const html=masterStats({statsCode:''},'slave',{},catalog,{'$master_ring':'new'});
 assert.match(html,/value="new"/);assert.match(html,/마스터 전환용/);assert.match(html,/data-initial-reset/);
});
test('CM is a typed starting override instead of mutating a browsing preset',()=>{
 const changes=cmInitialChanges(-3.5);assert.deepEqual(changes,{jo9_cruel_mercy:-3,jo9_cruel_mercy_half:-1});
 const fields=[{key:'jo9_cruel_mercy',value:0},{key:'jo9_cruel_mercy_half',value:0}];
 assert.equal(initialCm({statsCode:''},{},{fields},changes),-3.5);assert.throws(()=>cmInitialChanges(1.25));
});
