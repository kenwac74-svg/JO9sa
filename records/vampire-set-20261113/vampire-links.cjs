'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),T='G:/Codex/tmp/vampire-set-20261113',raw=fs.readFileSync(T+'/candidate.qsp'),d=c.parse(raw),cases=[];
const base=["killall","usehtml=1","$onnewloc=''","$ongload=''","$counter=''","settimer 0","gs '#static_base'","slave['jo9_vampire']=1"];
const extract=["qa_start=instr($qa_menu,'href=\"EXEC: ')+len('href=\"EXEC: ')","$qa_tail=mid($qa_menu,qa_start)","$qa_exec=mid($qa_tail,1,instr($qa_tail,'\"')-1)","$qa_menu=mid($qa_tail,instr($qa_tail,'\"')+1)"];
const keys=['blood','darkness','picky','healthy','metabolism','mage'],vars=['$Кровожадная','$Дитя_тьмы','$Не_любит_сладкое',null,'$Мощный_метаболизм','$чародейка'];
for(const [i,key]of keys.entries()){
 const q=[...base];vars.forEach((v,k)=>{if(v)q.push(v+"='JO9_QA_VAMP_"+keys[k]+"_COMPLETE'")});q.push("$qa_menu=$func('jo9_traits','text','vampire')");for(let j=0;j<=i;j++)q.push(...extract);q.push('dynamic $qa_exec');emit(key,q,key==='healthy'?'[건강체질]':'JO9_QA_VAMP_'+key+'_COMPLETE');
}
emit('menu',[...base,"gs 'jo9_traits','describe','vampire'"],'뱀파이어는 다음과 같은 특성을 모두 가집니다.');emit('race',[...base,"$qa_menu=$func('jo9_traits','race_list','slave')",...extract,'dynamic $qa_exec'],'뱀파이어는 다음과 같은 특성을 모두 가집니다.');
function emit(name,q,expected){const dd=c.parse(raw);dd.lines[dd.locations.find(x=>x.name==='Start').body]=c.shift(q.join('\r\n'),-5);fs.writeFileSync(T+'/link-'+name+'.qsp',c.serialize(dd));cases.push({name:'link-'+name,file:T+'/link-'+name+'.qsp',expected,menu:name==='menu'||name==='race'});}
fs.writeFileSync(T+'/links.json',JSON.stringify(cases,null,2)+'\n');console.log('Generated8 native pane/link fixtures.');
