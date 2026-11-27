import test from 'node:test';import assert from 'node:assert/strict';
import {setGamePresentation,loadGamePresentation,describeGameValue,readSimulation,attributeCards,skillTree,statusDashboard,traitPresentation,editorTraitRows,findTraitByName} from '../overrides/game-presentation.mjs';
import {initialPreview} from '../overrides/initial-preview.mjs';
const rules={palettes:{skill:{0:'#cd0000',1:'#EA0090',2:'#6B0084',3:'#0000D8',4:'#009FEF',5:'#009900'}},labels:{beauty:'외모',pride:'태도',fat:'체형'},values:{beauty:{6:{text:'절세의 미모 S++',cycle:'skill',index:5}},pride:{0:{text:'개방적',cycle:'skill',index:5}},fat:{1:{text:'모델 체형',cycle:'skill',index:5}},sub_hj:{0:{text:'핸드잡 F',cycle:'skill',index:0}}},skills:[{key:'petting',label:'애무',children:['sub_hj']}],supportedSeeds:['moral','psy_basic']};
setGamePresentation(rules);
test('uses actual mapped game colors rather than raw numeric index',()=>{
 for(const [key,value] of [['beauty',6],['pride',0],['fat',1]]){const x=describeGameValue(key,value);assert.equal(x.color,'#009900');assert(x.tooltip.includes(String(value)));}
 assert.equal(describeGameValue('beauty',undefined).text,'미설정');assert.equal(describeGameValue('beauty',99).color,null);
});
test('simulation overlays preserve explicit source values; defaults stay derived',()=>{
 const status=readSimulation({seed_moral:3,seed_psy_basic:'docile'},{'rate.moral':10});assert.equal(status.moral,3);assert.equal(status.psy_status,'docile');assert.equal(status['rate.moral'],10);
 const defaults=initialPreview({},readSimulation({},{}),rules).status;assert.equal(defaults.mood,0);assert.equal(defaults.fear,0);assert.equal(defaults['rate.rational'],0);assert.deepEqual(readSimulation({},{}),{});
 assert.equal(readSimulation({seed_psy_basic:'docile'},{psy_status:'soft'}).psy_status,'soft');
 assert.equal(readSimulation({seed_moral:3},{moral:5}).moral,3);
 assert.equal(readSimulation({seed_fear:9},{fear:2}).fear,2);
});
test('derived attributes use game thresholds and cosmetic modifiers, not unset values',()=>{
 const c={fame_rate:80,grace:1,makeup:2,perfume:1,manicure:1,epilation:1,hairstyle:1};const clone=structuredClone(c),p=initialPreview(c,{},rules);
 assert.equal(p.attributes.fame,4);assert.equal(p.attributes.style,4);assert.deepEqual(c,clone);
 assert(!attributeCards({}).includes('미설정'));assert(!statusDashboard({name:'A'},{}).includes('미설정'));
 const manual=initialPreview({}, {mood:3,obedience:99,'rate.fear':12},rules);assert.equal(manual.status.mood,3);assert.equal(manual.status.obedience,99);assert.equal(manual.status['rate.fear'],12);
 const broken=initialPreview({psy_basic:'broken',mood:4},{},rules);assert.equal(broken.status.mood,0);assert.equal(broken.status.obedience,100);
 assert.equal(initialPreview({style_rate:1000},{},rules).attributes.style,4);
 const distressed=initialPreview({temper:2,ego:2,pride:2,angst:3,mood_rate:40},{},rules);assert.equal(distressed.status.mood,0);assert.equal(distressed.status.obedience,-5);
 assert.equal(initialPreview({age:1,beauty:3,grace:2},{},rules).attributes.style,3);
});
test('trait color lookup follows explicit game grades, aliases and title overrides',()=>{
 setGamePresentation({...rules,traitColors:{양성애자:'#009900',통증내성:'#6B0084',워커홀릭:'#009FEF'},titleColor:'#5c351d'});
 try{assert.equal(traitPresentation({name:'양성애자'}).color,'#009900');assert.equal(traitPresentation({name:'통증 내성'}).color,'#6B0084');assert.equal(traitPresentation({name:'old',aliases:['워커홀릭']}).color,'#009FEF');assert.equal(traitPresentation({name:'팔방미인',binding:{key:'jo9_versatile'}}).color,'#5c351d');}finally{setGamePresentation(rules);}
});
test('skills have no visible calculation-prefix label and keep numeric grades',()=>{
 const tree=skillTree({});assert(!tree.includes('<small>입력 평균</small>'));assert(tree.includes('>F</span>'));
});
test('01 and 02 have no editable controls; categories expand and zero is visible',()=>{
 const html=attributeCards({base_beauty:6})+statusDashboard({name:'A'},{});
 assert(!/<(?:input|textarea|select|button)\b/.test(html));assert(html.includes('추가 지표'));
 const tree=skillTree({sub_hj:0});assert(tree.includes('<details'));assert(tree.includes('<summary'));assert(tree.includes('핸드잡 F'));
});
test('canonical editable attribute aliases win over imported duplicate keys',()=>{
 const html=attributeCards({beauty:1,base_beauty:6});assert(html.includes('절세의 미모 S++'));assert(html.includes('수치: 6'));
});
test('missing game folder does not block startup and metadata can be retried',async()=>{
 const original=globalThis.fetch;
 try{globalThis.fetch=async()=>({ok:false});assert((await loadGamePresentation(true)).unavailable);globalThis.fetch=async()=>({ok:true,json:async()=>rules});assert.equal((await loadGamePresentation()).unavailable,undefined);}
 finally{globalThis.fetch=original;setGamePresentation(rules);}
});

test('unspecified sex skills use F while missing category averages zero defaults',()=>{
 assert.equal(describeGameValue('sub_hj',undefined).grade,'F');
 assert.equal(describeGameValue('sub_hj',undefined).color,'#cd0000');
 assert.equal(describeGameValue('beauty',undefined).text,'미설정');
 assert(!skillTree({}).includes('미설정'));assert(skillTree({}).includes('애무 F'));
 const original=rules.skills;rules.skills=[{key:'petting',label:'애무',children:['sub_hj','sub_fj']}];
 try{assert(skillTree({sub_hj:4}).includes('애무 C'));}finally{rules.skills=original;}
});
test('the retired dancing label is removed and the editable talent remains',()=>{
 const id='calisthenics_affinity > 0', binding={key:'calisthenics_affinity',op:'>',threshold:0,setValue:1};
 const primary={id,name:'발레리나',description:'해당 성향이 드러나지 않은 인물에게 표시되는 이름이다.',binding,aliases:[]};
 const alternate={id,name:'이국적인 댄서',description:'성향에 따라 표시되는 이름이다.',binding,aliases:[]};
 const unrelated={id:'calisthenics_affinity < 0',name:'별도 판정',binding:{...binding,op:'<'}};
 const rows=editorTraitRows([alternate,unrelated,primary]);
 assert.equal(rows.length,2);
 const result=findTraitByName(rows,'발레리나');
 assert.equal(findTraitByName(rows,'이국적인 댄서'),undefined);
 assert.deepEqual(result.aliases,[]);
 assert.equal(result.id,id);
 assert.deepEqual(result.binding,binding);
 assert(result.description.startsWith('무용술을 더 빨리 배운다.'));
 assert(!result.description.includes('성향'));
 assert.equal(rows[0],unrelated);
 assert.deepEqual(primary.aliases,[]);
 assert.deepEqual(editorTraitRows(rows),rows);
 assert.equal(editorTraitRows([alternate])[0].name,'발레리나');
 assert.deepEqual(editorTraitRows([{...primary,aliases:['이국적인 댄서']}])[0].aliases,[]);
});
