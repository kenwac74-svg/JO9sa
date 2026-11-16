import test from 'node:test';import assert from 'node:assert/strict';
import * as role from '../overrides/studio-role.mjs';
test('CM appears even without a per-preset assignment and reads inherited defaults',()=>{
 const html=role.masterStats({statsCode:'master_str = 4'},'master',{jo9_cruel_mercy:-3,jo9_cruel_mercy_half:-1});
 assert.match(html,/data-st-master-cm/);assert.match(html,/value="-3.5"/);assert.match(html,/step="0.5"/);assert.match(html,/Cruel/);assert.match(html,/Mercy/);
});
test('CM uses existing whole/half fields and preserves unrelated starting code',()=>{
 assert.equal(typeof role.patchCm,'function');
 const code="master_str = 4\r\n$equipment = 'original'\r\n! last comment";
 for(const value of [-10,-3.5,-0.5,0,0.5,20.5]){
  const updated=role.patchCm(code,value);assert(updated.startsWith(code+'\r\n'));assert.equal(role.cmValue(updated),value);
  assert.equal(updated.match(/jo9_cruel_mercy =/g).length,1);assert.equal(updated.match(/jo9_cruel_mercy_half =/g).length,1);
  assert.equal(role.patchCm(updated,value),updated);
 }
 assert.throws(()=>role.patchCm(code,0.25));
 assert.throws(()=>role.patchCm('jo9_cruel_mercy = 1\njo9_cruel_mercy = 2',3));
});
