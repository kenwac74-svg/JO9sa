'use strict';
const fs=require('node:fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const inventory=JSON.parse(fs.readFileSync(__dirname+'/menu-inventory.json','utf8'));
const locations=['#options','#variative','$newloc','interaction_result'];
const translations={
 'Чужое клеймо':'타인의 낙인',
 'Your slave has become unruly - moderately spoiled. Giving her massages or sending her to the Golden Cage is good for her, but it can also create a sense of entitlement. She is now spoiled enough that it is beginning to erode her obedience. It is necessary to find a balance. Fear, unhappiness, despair and devotion keep a slave in her place.':'노예가 버릇없어지기 시작했습니다. 마사지를 해 주거나 황금 새장에 보내는 것은 노예에게 좋은 일이지만, 이런 대우를 당연하게 여기게 만들 수도 있습니다. 이제는 버릇없음이 복종심을 떨어뜨릴 정도가 되었습니다. 적절한 균형을 찾아야 합니다. 공포, 불행, 절망, 헌신은 노예가 자신의 처지를 잊지 않게 합니다.',
 'Your slave has fully mastered this skill, and you’re unlikely to be able to teach her something new. Perhaps you should pay attention to the less developed aspects or just use her skills in practice.':'노예는 이 기술을 완전히 익혔습니다. 이제 당신이 새로 가르쳐 줄 것은 거의 없습니다. 아직 부족한 다른 능력을 가르치거나, 익힌 기술을 실전에서 활용해 보는 것이 좋겠습니다.'
};
function wrap(id,line,eol){return ['! JO9 MOD START '+id+' | 2026-10-19_argon_trait_text_integration',line,'! JO9 MOD END '+id].join(eol);}
function transform(name,body){
 if(!locations.includes(name))throw Error('Unexpected text location '+name);
 const eol=body.includes('\r\n')?'\r\n':'\n',edits=[];
 if(name==='#options'){
  const lines=body.split(/\r?\n/);
  for(const [i,r]of inventory.rows.entries()){
   if(lines[r.line-1]!==r.source)throw Error('Shop source changed at '+r.line);
   let label=r.choices[0]?.replace(/\s*\(\s*\d+\$\s*\)$/,'');
   if(!label)label=({'Кольцо в пупок':'배꼽 고리','Штанга в язык':'혀 바벨','Другие товары':'다른 상품'})[r.old];
   if(!label||/[А-Яа-яЁё]/.test(label))throw Error('Missing translation: '+r.old);
   const lit=c.literals(r.source).at(-1);
   if(lit.text!==r.old)throw Error('Menu literal mismatch');
   const changed=r.source.slice(0,lit.start)+label+r.source.slice(lit.end);
   const id='ARGON_ASSISTANT_SHOP_LABEL_'+String(i+1).padStart(3,'0');
   lines[r.line-1]=wrap(id,changed,eol);
   edits.push({location:name,patchId:id,before:r.source,after:changed,oldText:r.old,newText:label,reason:'조수 상점 상품명을 기존 한국어 상점과 통일',stateEffects:'없음; 구매 ID·아이콘·가격 계산·회색 조건 유지'});
  }
  return {body:lines.join(eol),edits};
 }
 const expected=name==='#variative'?'Чужое клеймо':name==='$newloc'?Object.keys(translations)[1]:Object.keys(translations)[2];
 const lines=body.split(/\r?\n/),rows=lines.filter(l=>l.includes(expected));
 if(rows.length!==1)throw Error('Expected exactly one static text '+name);
 const before=rows[0],after=before.replace(expected,()=>translations[expected]);
 const id=name==='#variative'?'ARGON_FOREIGN_BRAND_LABEL':name==='$newloc'?'ARGON_UNRULY_NOTICE_KO':'ARGON_MASTERED_SKILL_NOTICE_KO';
 return {body:body.replace(before,()=>wrap(id,after,eol)),edits:[{location:name,patchId:id,before,after,oldText:expected,newText:translations[expected],reason:'미번역 상태·안내 문구 한글화',stateEffects:'없음; 표시 조건·효과 유지'}]};
}
module.exports={locations,transform};
