import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
const source=fs.readFileSync(new URL('../overrides/character-view.mjs',import.meta.url),'utf8');
const functions=source.slice(source.indexOf(' function backgroundSource('),source.indexOf(' // 현재 캐릭터의 과거 경험'));
function setup(unique=true){const c={type:'1',world:'world',unique:unique?{texts:{world:'original'},original:{world:'original'},fileName:'1.json'}:null};const st={backgroundDrafts:{}};const env={st,ch:()=>c,charKey:()=> 'actor',save:()=>{},root:{querySelectorAll:()=>[]},recordFor:()=>({text:'original',id:'world'}),editedBackgroundText:(_cfg,r)=>r.text,validateBackgroundSettings:()=>{},textKey:()=> 'world',structuredClone,api:{getState:()=>({config:{backgroundSettings:{texts:{world:{}}}}}),save:()=>{}},nameOf:()=> 'world'};vm.createContext(env);vm.runInContext(functions+';this.methods={backgroundText,setBackgroundDraft,saveBackgroundText};',env);return env;}
test('shared past draft survives validation failure and restoring it does not alter original',()=>{
 const env=setup();env.methods.setBackgroundDraft('world','x'.repeat(4001));assert.throws(()=>env.methods.saveBackgroundText('world','x'.repeat(4001)),/4,000/);assert.equal(env.methods.backgroundText('world').text.length,4001);assert.equal(env.ch().unique.texts.world,'original');env.methods.setBackgroundDraft('world','original');assert.equal(Object.keys(env.st.backgroundDrafts).length,0);
});
test('a shared DB validation error keeps the exact unsaved draft',()=>{
 const env=setup(false);env.methods.setBackgroundDraft('world','unsaved');env.validateBackgroundSettings=()=>{throw Error('rejected');};assert.throws(()=>env.methods.saveBackgroundText('world','unsaved'),/rejected/);assert.equal(env.methods.backgroundText('world').text,'unsaved');
});
