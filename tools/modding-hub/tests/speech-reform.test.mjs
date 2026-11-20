import test from 'node:test';
import assert from 'node:assert/strict';
import {speechPresentation,reformProfile,interviewGate,interviewRefusal,previewSpeech,plainSpeech} from '../overrides/speech-reform.mjs';
import {pillowTalk} from '../overrides/pillow-talk.mjs';
import {selectReformPreview} from '../overrides/general-dialogue.mjs';

test('fixed speech follows the actual actor and the approved precedence',()=>{
 const noble={id:1201,occupation:'barbarian_princess',family:'barbarian_king',moral:4,psy_status:'frightened',humility_rule:1};
 const common={...noble,occupation:'poor_wife'};
 assert.deepEqual(speechPresentation(noble),{style:3,expression:'rough',strict:true});
 assert.deepEqual(speechPresentation(common),{style:2,expression:'fearful',strict:false});
 assert.equal(reformProfile(common),'poor_wife');
 for(const id of [3002,1448,2610])assert.equal(speechPresentation({id,jo9_plain_tone:-1,rational:5,moral:5}).style,3);
 assert.equal(speechPresentation({id:9999,jo9_plain_tone:1}).style,3);
 assert.equal(speechPresentation({id:9999,occupation:'mprincess'}).style,2);
 assert.equal(speechPresentation({moral:1,psy_status:'reluctant'}).expression,'rough');
 assert.equal(speechPresentation({moral:2,psy_status:'resistant'}).expression,'normal');
 assert.equal(speechPresentation({moral:3,psy_status:'hateful'}).expression,'normal');
 assert.equal(speechPresentation({moral:3,psy_status:'docile'}).expression,'soft');
 assert.equal(speechPresentation({moral:3,psy_status:'lachrymose'}).expression,'sad');
 assert.equal(speechPresentation({moral:3,psy_status:'broken'}).expression,'original');
});
test('the same questions are refused under the same gates with register held during refusal',()=>{
 assert.equal(interviewGate({angst:3,spoil:4,rational:0}),'angst');
 assert.equal(interviewGate({angst:2,spoil:3,rational:0}),'spoil');
 assert.equal(interviewGate({angst:2,spoil:2,rational:2}),'rational');
 assert.equal(interviewGate({angst:2,spoil:2,rational:3}),null);
 const noble={id:1448,moral:5,humility_rule:1},common={id:1200,moral:5,family:'barbarian_king',occupation:'poor_wife',humility_rule:1};
 assert.match(interviewRefusal('angst',noble),/잘 들어.+기억이 안 나\./u);
 assert.match(interviewRefusal('angst',common),/기억이 안 납니다\./u);
 assert.doesNotMatch(interviewRefusal('rational',noble),/습니다|[어아]요/u);
});
test('preview-only voices keep their register and apply Julia’s addressee rule',()=>{
 const flags={occupation:'mprincess',jo9_plain_tone:1,psy_status:'hateful',moral:1,humility_rule:1};
 for (const addressee of ['protagonist','other',undefined]) {
  assert.equal(speechPresentation({...flags,id:2572,addressee}).style,3);
  assert.equal(speechPresentation({...flags,id:2576,addressee}).style,addressee==='protagonist'?3:2);
 }
 assert.deepEqual(speechPresentation({...flags,id:2574}),{style:1,expression:'firm',strict:false});
 assert.deepEqual(speechPresentation({...flags,id:8901}),{style:1,expression:'calm',strict:false});
 assert.equal(speechPresentation({id:2339}).style,2);
 assert.match(interviewRefusal('rational',{id:2576,addressee:'protagonist'}),/없어\.$/u);
 assert.match(interviewRefusal('rational',{id:2576,addressee:'other'}),/없습니다\.$/u);
});
test('formal previews preserve authored facts and words quoted from another speaker',()=>{
 const raw='나는 세 번 지휘했다. “기다려.” 명령을 기억했지.';
 assert.equal(previewSpeech(raw,{id:2574}),'분명히 말씀드리겠습니다. 저는 세 번 지휘했습니다. “기다려.” 명령을 기억했죠.');
 assert.equal(previewSpeech('제가 왕좌에 있었던 일입니다.',{id:8901,psy_status:'hateful'}),'제가 왕좌에 있었던 일입니다.');
});
test('the editor compares both listeners for Julia without taking samples from WORK',()=>{
 const settings={responds:true,master:10};
 const protagonist=selectReformPreview(null,'1111',{id:2576,addressee:'protagonist'},settings);
 const other=selectReformPreview(null,'1111',{id:2576,addressee:'other'},settings);
 assert.equal(protagonist.type,'편집기 말투 예문');
 assert.match(protagonist.text,/오빠.*잖아\./u);
 assert.match(other.text,/사이예요\./u);
 assert.doesNotMatch(other.text,/오빠/u);
 assert.equal(selectReformPreview(null,'1111',{id:2576},{responds:false}).text,'');
 assert.equal(selectReformPreview(null,'1111',{id:2339},settings).text,'');
});
test('presentation never changes quoted text, reported counts, or selection history',()=>{
 const source='저는 17번 기억해요. “기다리세요.” 필요. 제 답이에요.';
 const copy=previewSpeech(source,{id:3002},{style:3,expression:'normal',strict:false});
 assert.equal(copy,'나는 17번 기억해. “기다리세요.” 필요. 내 답이야.');
 assert.equal(plainSpeech('그녀가 3번 왔다고 했습니다. 동의했습니까?'),'그녀가 3번 왔다고 했다. 동의했나?');
 const stock={id:1210,occupation:'poor_wife',temper:2,sensitivity:2,ego:2,pride:2,psy_status:'docile',moral:3};
 const prior={intimacy:8,births:0,acts:{},partners:{}};
 const one=pillowTalk(stock,prior,'married',()=>.25,[]);
 const two=pillowTalk(stock,prior,'married',()=>.25,[],{id:1448,psy_status:'frightened',humility_rule:1,moral:4});
 assert.equal(two.style,3);assert.equal(one.style,2);
 assert.equal(two.mode,one.mode);assert.deepEqual(two.used,one.used);assert.equal(two.told,one.told);assert.equal(two.refused,one.refused);
 const refusing={...stock,ego:0,temper:0,fear:5,psy_status:'hateful'};
 assert.equal(pillowTalk(refusing,prior,'married',()=>.1,[],{id:1448,humility_rule:1}).refused,true);
});

test('Julia reunion previews are limited to Johnny',()=>{
 const julia={id:2576,addressee:'protagonist'};
 for(const master of [1,9,13,101]){
  for(const question of ['1111','1112','1113','1114','1115','1116','1117']){
   const view=selectReformPreview(null,question,julia,{responds:true,master});
   assert.equal(view.unavailable,true,question+' '+master);
   assert.equal(view.text,'');
  }
 }
 const work=selectReformPreview(null,'1111',julia,{responds:true,master:10,previewVersion:'work'});
 assert.equal(work.text,'');
 assert.notEqual(work.unavailable,true);
});