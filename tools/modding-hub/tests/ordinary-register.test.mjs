import test from 'node:test';
import assert from 'node:assert/strict';
import * as preview from '../overrides/general-dialogue.mjs';

const princess={id:1210,age:0,occupation:'mprincess',family:'mprincess',psy_status:'docile'};
const topics={
 world:'{이름}<br>제가 살던 세계에는 큰 힘을 가진 마법사들이 있었어요. 전쟁은 드물었죠.',
 family:'{이름}<br>전 왕가의 막내딸로 태어나 부족함 없이 자랐어요. 부모님은 저를 아꼈고, 궁정 사람들도 제 뜻을 잘 맞춰줬죠. “얌전히 기다리세요.”',
 occupation:'{이름}<br>전 나라 사이의 혼인에 관해 여러 제안을 받았어요. 아버지는 그 사정을 알고 계셨죠.'
};
const getBackground=key=>({text:topics[key]});
const data={available:true,strong:{mprincess:'내 말을 끝까지 들어.',barbarian_princess:'잘 들어. 말 끊지 마.'},rows:[
 {profile:'mprincess',question:'1114',state:'rough',text:'매듭짓는 부분만 다시 보여 줘.'}
]};
test('ordinary princess keeps plain address in each past page, preserving quotes, facts, and third-person respect',()=>{
 const plain=preview.pastPreviewPages('',princess,'미라',getBackground);
 assert.deepEqual(plain,[
  '미라\n내가 살던 세계에는 큰 힘을 가진 마법사들이 있었어. 전쟁은 드물었지.',
  '미라\n난 왕가의 막내딸로 태어나 부족함 없이 자랐어. 부모님은 나를 아꼈고, 궁정 사람들도 내 뜻을 잘 맞춰줬지. “얌전히 기다리세요.”',
  '미라\n난 나라 사이의 혼인에 관해 여러 제안을 받았어. 아버지는 그 사정을 알고 계셨지.'
 ]);
 const barbarian={...princess,occupation:'barbarian_princess',family:'barbarian_king',age:1};
 const barbarianBackground={world:topics.world,family:'{이름}<br>전 부족장 딸로 자랐어요. 저희 가족이 살던 곳이에요.'};
 assert.deepEqual(preview.pastPreviewPages('',barbarian,'미라',key=>({text:barbarianBackground[key]})),[
  '미라\n내가 살던 세계에는 큰 힘을 가진 마법사들이 있었어. 전쟁은 드물었지.',
  '미라\n난 부족장 딸로 자랐어. 우리 가족이 살던 곳이야.'
 ]);
 const common={...princess,occupation:'poor_wife',family:'barbarian_king'};
 assert.equal(preview.pastPreviewPages('',common,'미라',getBackground)[0],topics.world.replace('{이름}<br>','미라\n'));
 for(const fixed of [{...princess,id:2576,addressee:'protagonist'},{...princess,fixedSexTalk:true}]){
  assert.match(preview.pastPreviewPages('',fixed,'미라',getBackground)[0],/있었어요/u);
 }
});
test('ordinary princess strict wish retains chosen topic and prepends WORK courtesy lead once',()=>{
 const strict={...princess,humility_rule:1,psy_status:'frightened'};
 const role='native_1114_no_like_core';
 const fallback=preview.sharedNoWishDraft(role,strict);
 assert.equal(fallback,'흠, 아직은 나한테 무슨 일이 맞는지 잘 모르겠다. 딱히 떠오르는 건 없군.');
 const choice={responds:true,lesson:true,wish:true};
 const result=preview.selectReformPreview(data,'1114',strict,choice);
 assert.equal(result.type,'예의 강요 도입부');
 assert.equal(result.text,'내 말을 끝까지 들어.');
 const actual=[{text:fallback,authored:true},{text:'마법을 더 배우고 싶어.'}];
 assert.deepEqual(preview.renderPreviewLines(actual,result,'1114',strict),['내 말을 끝까지 들어. '+fallback,actual[1].text]);
 const interest={...strict,nurse_affinity:1};
 assert.equal(preview.selectReformPreview(data,'1114',interest,choice).text,'매듭짓는 부분만 다시 보여 줘.');
 assert.equal(preview.sharedNoWishDraft(role,princess),'저기… 아직은 무슨 일이 나한테 맞는지 잘 모르겠어. 딱히 떠오르는 건 없는데?');
});

test('past preview uses the exact random runtime record, follows edits, and resolves an ordinary preset',()=>{
 const actor={...princess,source:'random',_runtime:{strings:{world_description:'<<$dynslave_name>><br>실제로 나온 세계 원고예요.'}}};
 const absent=()=>null;
 const runtime=key=>preview.selectPastBackground(key,actor,absent);
 assert.equal(preview.pastPreviewPages('',actor,'미라',runtime)[0],'미라\n실제로 나온 세계 원고야.');
 assert.equal(runtime('family'),null);
 const editable=()=>({text:'직접 수정한 세계 원고예요.',edited:true});
 assert.equal(preview.selectPastBackground('world',actor,editable).text,editable().text);
 assert.equal(preview.selectPastBackground('world',{...actor,source:'unique',fixedSexTalk:true},absent),null);
 const preset=(kind,speaker)=>({text:speaker.family+' '+kind});
 assert.equal(preview.selectPastBackground('family',princess,null,preset).text,'mprincess family');
 assert.equal(preview.selectPastBackground('family',{...princess,id:2576},null,preset),null);
});

test('princess first-person conversion recognizes real name breaks and non-breaking spacing',()=>{
 const pages=preview.pastPreviewPages('',princess,'미라',field=>field==='occupation'?{
  text:'{이름}\n전 나라 사이의 혼인 제안을 받았어요. 전 세계가 그 소식을 알았어요. “전 나갈게요.”'
 }:field==='family'?{text:'{이름}<br>&nbsp;전 왕가의 막내딸이었어요.'}:null);
 assert.equal(pages.length,2);
 assert.match(pages[0],/난 왕가의 막내딸이었어\./u);
 assert.match(pages[1],/난 나라 사이의 혼인 제안을 받았어\. 전 세계가 그 소식을 알았어\. “전 나갈게요\.”/u);
});