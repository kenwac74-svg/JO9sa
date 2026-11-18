'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const core=require('./core.cjs'),batch=require('./batch-replace.cjs'),scenes=require('./scenes.cjs');
const locations=[
 ['#masters_base',"$master_base_name[1]='남자 이름'\n$master_base_name[18]='남자 마지막'\n$master_base_name[101]='여자 이름'\n$master_base_name[124]='여자 마지막'"],
 ['#txt_woman',"$text[1]='여성 전용 문구입니다.'"],
 ['mixed',"if hero_choice < 100:\n *pl '남성 전용 문구입니다.'\nelseif hero_choice > 100:\n *pl '여성 전용 문구입니다.'\nelse\n *pl '도달 불명 문구입니다.'\nend\n*pl '공용 문구입니다.'\nif hero_choice > 100 or flag=1:\n *pl '혼합 확인 문구입니다.'\nend\n*pl 'if hero_choice > 100: 동적 확인 문구입니다.'\n$woman_dosug_options={\n $text[1]='별칭 여성 문구입니다.'\n}\nif female['pregnant'] > 0 and female['fertility'] = 0:\n *pl '임신 여성 문구입니다.'\nelse\n *pl '비임신 공용 문구입니다.'\nend\nif female['parasite']>0:\n *pl '기생 여성 문구입니다.'\nend\nif female_abortion=1 and sparks>=10:\n *pl '수술 여성 문구입니다.'\nend\nif female_insidous_abortion=1:\n *pl '다른 수술 여성 문구입니다.'\nend\nif slave['gender']=1:\n *pl '여성 NPC 공용 문구입니다.'\nend"],
 ['interaction_city',"if interaction_city=10420:\n *pl '보충 검토 문구입니다.'\nelseif interaction_city=42:\n *pl '독립 공용 문구입니다.'\nend"],
];
function fixture(rows=locations){const lines=['QSPGAME','header','',core.shift(String(rows.length),-5)];for(const [name,body]of rows)lines.push(core.shift(name,-5),'',core.shift(body,-5),core.shift('0',-5));lines.push('');return core.parse(Buffer.from(lines.join('\r\n'),'utf16le'));}
const selection=(doc,text)=>({...core.entries(doc).find(e=>e.text===text),hash:doc.hash});
test('current token classification distinguishes ownership, shared review and unrelated female NPCs',()=>{
 const doc=fixture(),by=new Map(core.entries(doc).map(e=>[e.text,e.workScope?.category]));
 for(const text of ['여자 이름','여성 전용 문구입니다.','별칭 여성 문구입니다.','임신 여성 문구입니다.','기생 여성 문구입니다.','수술 여성 문구입니다.','다른 수술 여성 문구입니다.'])assert.equal(by.get(text),'female',text);
 for(const text of ['혼합 확인 문구입니다.','if hero_choice > 100: 동적 확인 문구입니다.','보충 검토 문구입니다.'])assert.equal(by.get(text),'review',text);
 for(const text of ['남자 이름','남성 전용 문구입니다.','공용 문구입니다.','비임신 공용 문구입니다.','여성 NPC 공용 문구입니다.','독립 공용 문구입니다.'])assert.equal(by.get(text),'general',text);
});
test('default direct and batch changes protect female and review tokens, with explicit opt-in',()=>{
 const doc=fixture();
 for(const text of ['여성 전용 문구입니다.','혼합 확인 문구입니다.']){
  const ref=selection(doc,text);assert.throws(()=>core.prepare(doc,ref,'수정 문구입니다.'),/작업 대상/);
  assert.doesNotThrow(()=>core.prepare(doc,ref,'수정 문구입니다.',{includeFemale:true}));
 }
 const found=batch.search(doc,{query:'문구입니다.'});assert.ok(found.results.every(e=>e.workScope.category==='general'));assert.ok(found.scope.excludedFemale>0);assert.ok(found.scope.excludedReview>0);
 const all=batch.search(doc,{query:'문구입니다.',includeFemale:true});assert.ok(all.total>found.total);
 const p=batch.prepare(doc,{hash:doc.hash,query:'문구입니다.',replacement:'수정 문구입니다.',selection:{all:true}});assert.ok(p.changes.every(c=>!['female','review'].includes(c.workScope?.category)));
});
test('classification follows freshly parsed document offsets and hero definitions',()=>{
 const doc=fixture(),old=selection(doc,'여성 전용 문구입니다.');const first=selection(doc,'공용 문구입니다.');
 const changed=core.parse(core.prepare(doc,first,'훨씬 길어진 공용 문구입니다.').raw),current=selection(changed,'여성 전용 문구입니다.');
 assert.equal(current.workScope.category,'female');assert.throws(()=>core.prepare(changed,{...old,hash:changed.hash},'새 문구입니다.'),/작업 대상|원문 위치/);
 const changedModel=fixture([['#masters_base',"$master_base_name[99]='남성'\n$master_base_name[105]='여성'"],['event',"if hero_choice=99:\n*pl '현재 남성 문구입니다.'\nelseif hero_choice=105:\n*pl '현재 여성 문구입니다.'\nend"]]);
 assert.equal(selection(changedModel,'현재 남성 문구입니다.').workScope.category,'general');assert.equal(selection(changedModel,'현재 여성 문구입니다.').workScope.category,'female');
});
test('automatic navigator export skips mixed and female text while manual context can inspect review',()=>{
 const doc=fixture(),entries=core.entries(doc),nav=scenes.buildNavigator(doc,entries),mixed=selection(doc,'혼합 확인 문구입니다.');
 assert.ok(nav.context(mixed).selection.workScope.category==='review');
 const script=nav.script({hash:doc.hash,location:'mixed',sceneId:'root',options:{maxScenes:1}});
 assert.ok(!script.text.includes('여성 전용 문구입니다.'));assert.ok(!script.text.includes('혼합 확인 문구입니다.'));assert.ok(script.text.includes('공용 문구입니다.'));
});
module.exports={fixture,selection};
test('addition, choice, formatting and dialogue-image entry points reject excluded selections before editing',()=>{
 const doc=fixture(),ref=selection(doc,'여성 전용 문구입니다.');
 const calls=[
  ()=>require('./addition.cjs').prepare(doc,ref,'새 대사입니다.','page'),
  ()=>require('./choice-addition.cjs').prepare(doc,ref,{label:'선택',actionCode:'flag=1'}),
  ()=>require('./choice-format.cjs').prepare(doc,ref,{anchorIndex:0,style:{color:'#123'}}),
  ()=>require('./dialogue-image.cjs').prepare(doc,ref,'scene/test.png'),
  ()=>require('./image-reference.cjs').prepare(doc,ref,'scene/test.png',{source:ref})
 ];
 for(const call of calls)assert.throws(call,/기본 작업 대상/);
});
test('old and revalidated script maps cannot bypass default work scope',()=>{
 const doc=fixture(),ref=selection(doc,'여성 전용 문구입니다.'),record={hash:doc.hash,map:{'S1-P1':ref}},text='---- [S1-P1] ----\n각색된 문구입니다.';
 assert.throws(()=>require('./script-import.cjs').prepare(doc,record,text),/기본 작업 대상/);
 assert.doesNotThrow(()=>require('./script-import.cjs').prepare(doc,record,text,{includeFemale:true}));
 const next=core.parse(core.prepare(doc,selection(doc,'공용 문구입니다.'),'외부에서 변경된 공용 문구입니다.').raw),revalidated=require('./script-import.cjs').revalidateRecord(next,record);
 assert.throws(()=>require('./script-import.cjs').prepare(next,revalidated,text),/기본 작업 대상/);
});
test('classification cache detects in-memory field replacement as well as a new document hash',()=>{
 const doc=fixture([['event',"if hero_choice > 100:\n*pl '캐시 확인 문구입니다.'\nend"]]);
 assert.equal(selection(doc,'캐시 확인 문구입니다.').workScope.category,'female');
 doc.lines[doc.locations[0].body]=core.shift("if hero_choice < 100:\n*pl '캐시 확인 문구입니다.'\nend",-5);
 assert.equal(selection(doc,'캐시 확인 문구입니다.').workScope.category,'general');
});
test('a related edit cannot change an excluded page index or guard while leaving its prose identical',()=>{
 const doc=fixture([['event',"$text[1]='공용 문구입니다.'\nif hero_choice>100:\n$text[2]='여성 문구입니다.'\nend"]]),field=doc.locations[0].body,old=core.shift(doc.lines[field],5),changed={...doc,lines:doc.lines.slice()};
 for(const body of [old.replace('$text[2]','$text[3]'),old.replace('hero_choice>100','hero_choice=101')]){
  changed.lines[field]=core.shift(body,-5);
  assert.throws(()=>require('./work-scope.cjs').assertPrepared(doc,{raw:core.serialize(changed)}),/변경 범위/);
 }
});
