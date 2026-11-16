import test from 'node:test';import assert from 'node:assert/strict';
import {QUESTION_TABS,generalSlot,splitTalkLines,mergeTalkLines,simulatorMenuHtml,shown} from '../overrides/general-dialogue.mjs';
test('question menus include eight independent topics with sex experience inside questions',()=>{
 assert.deepEqual(QUESTION_TABS.map(([k])=>k),['1112','1115','1113','1114','1116','1111','1117','sex']);
 const nav=simulatorMenuHtml();for(const [id] of QUESTION_TABS)assert(nav.includes(`data-sim-question="${id}"`));assert(nav.includes('질문하기'));assert(nav.includes('data-tab="character"'));
});
test('general edits round trip separately from sex slots without changing the character',()=>{
 const original={partners:'original','custom':'manual','general.1112':'impression','general.1115':'complaint'};const copy=structuredClone(original),parts=splitTalkLines(original);
 assert.deepEqual(parts.general,{'1112':'impression','1115':'complaint'});assert.deepEqual(parts.other,{partners:'original',custom:'manual'});
 assert.deepEqual(mergeTalkLines(parts.other,parts.general),original);assert.deepEqual(original,copy);
 assert.equal(mergeTalkLines(original,{'1112':''})['general.1112'],'');assert.throws(()=>generalSlot('1111'));assert.throws(()=>generalSlot('sex'));
});
test('preview replaces the actor name without treating QSP placeholders as HTML',()=>{
 assert.equal(shown('[<<$slave_name>>]<br><font color="gold">Hello</font>','Actor'),'[Actor]\nHello');
 assert.equal(shown('<<$target_name>>','Actor'),'<<$target_name>>');
});
