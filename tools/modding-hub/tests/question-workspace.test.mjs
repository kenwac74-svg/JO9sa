import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
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
test('the questionnaire uses the array order and length from JSON',()=>{
 const source=readFileSync(new URL('../overrides/character-view.mjs',import.meta.url),'utf8');
 const start=source.indexOf('export function parseQuestionnaire');
 const helpers=source.slice(start,source.indexOf('const TYPE_GROUP',start)).replaceAll('export function','function');
 const {parseQuestionnaire,questionnaireJson,questionnaireTopics}=runInNewContext(helpers+';({parseQuestionnaire,questionnaireJson,questionnaireTopics})');
 const defaults=JSON.parse(readFileSync(new URL('../data/sex-talk-questionnaire.json',import.meta.url),'utf8'));
 const custom=(id,level)=>({id,level,label:'추가 질문',question:'추가 문구',topics:['new']});
 const edited={...defaults,questions:[custom('new_question',1),...defaults.questions.slice(2,4),custom('another',5)]};
 assert.deepEqual(JSON.parse(JSON.stringify(questionnaireJson(parseQuestionnaire(edited)))),edited);
 assert.deepEqual(JSON.parse(JSON.stringify(questionnaireJson(parseQuestionnaire(defaults)))),defaults);
 assert.throws(()=>parseQuestionnaire({...edited,questions:[custom('__end',1)]}),/예약 ID/);
 assert.equal(JSON.stringify(questionnaireTopics({new:['r1'],old:['r0']},['new','__proto__'])),'["r1"]');
});
