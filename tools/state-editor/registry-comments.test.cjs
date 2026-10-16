'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../text-workshop/core.cjs'),registry=require('./registry.cjs');
const {makeFixture}=require('./test-fixture.cjs');
const raw=makeFixture();
function body(bytes,name){const d=core.parse(bytes),l=d.locations.find(l=>l.name===name);return core.shift(d.lines[l.body],5);}
function alter(bytes,name,old,value){const d=core.parse(bytes),l=d.locations.find(l=>l.name===name);d.lines[l.body]=core.shift(core.shift(d.lines[l.body],5).replace(old,()=>value),-5);return core.serialize(d);}
test('reads marked UI source and edits exact tooltip bytes without removing comments or blank lines',()=>{
 for(const newline of ['\n','\r\n']){
  const d=core.parse(raw),names=['sjm_UI_UIadds','slave_private_room1','slave_private_room2','slave_private_room3','slave_private_room4','snk_room_menu_screen'];
  for(const l of d.locations.filter(l=>names.includes(l.name))){
   const marked=core.shift(d.lines[l.body],5).split(/\r?\n/).flatMap(line=>line.includes('tooltip-data=')?[' ! JO9 MOD START REVIEW_UI','',line,' ! JO9 MOD END REVIEW_UI','  ']:[line]).join(newline);
   d.lines[l.body]=core.shift(marked,-5);
  }
  const markedRaw=core.serialize(d),view=registry.inspect(markedRaw),field=view.fields.find(f=>f.id==='state.3.tooltip');
  assert.equal(field.bindings.length,7);
  for(const binding of field.bindings){assert.match(binding.code,/tooltip-data=/);assert.equal(binding.code,body(markedRaw,binding.location).split('\n')[binding.line-1]);}
  const prepared=registry.prepare(markedRaw,[{id:field.id,value:'주석 유지 검토'}],view.hash);
  assert.equal(registry.inspect(prepared.raw).fields.find(f=>f.id===field.id).value,'주석 유지 검토');
  let reversed=prepared.raw;
  for(const edit of prepared.patch.edits.slice().reverse())reversed=alter(reversed,edit.location,edit.new,edit.old);
  assert.deepEqual(reversed,markedRaw);
 }
});
test('does not skip executable statements between a UI condition and its registered markup',()=>{
 const changed=alter(raw,'sjm_UI_UIadds',"if slave['virginity'] = 1:\n","if slave['virginity'] = 1:\n unregistered = 1\n");
 assert.throws(()=>registry.inspect(changed),/상태 툴팁|상태표 분기/);
});
test('reads the learning-trait XP form and changes only its registered bonus amount',()=>{
 const old="if func('jo9_meiki_training_bonus', 'dynslave', $subskill) = 1: dynamic $replace('<<$subskill_xp>> += 1', 'slave', 'dynslave')";
 const current="jo9_learning_gain = 4\n if func('jo9_meiki_training_bonus', 'dynslave', $subskill) = 1: jo9_learning_gain += 1\n jo9_learning_gain = func('jo9_learning_xp', jo9_learning_gain, dynslave['jo9_learning_trait'], 'subskill')\n dynamic $replace('<<$subskill_xp>> += jo9_learning_gain', 'slave', 'dynslave')";
 const bytes=alter(raw,'#dynamic',old,current),view=registry.inspect(bytes);
 assert.equal(view.fields.find(f=>f.id==='training.xp').value,1);
 const prepared=registry.prepare(bytes,[{id:'training.xp',value:7}],view.hash);
 assert.equal(body(prepared.raw,'#dynamic'),body(bytes,'#dynamic').replace('jo9_learning_gain += 1','jo9_learning_gain += 7'));
 assert.equal(registry.inspect(prepared.raw).fields.find(f=>f.id==='training.xp').value,7);
});
