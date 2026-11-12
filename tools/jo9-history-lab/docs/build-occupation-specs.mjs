// occupation-specs-source.mjs의 직업 명세를 특성 ID·직업 ID와 연결하고 검증해 dist/data/occupation-specs.json으로 쓴다
import {readFile,writeFile} from 'node:fs/promises';
import {SPECS,SKILLS,SOURCE} from './occupation-specs-source.mjs';
const data=f=>new URL('../dist/data/'+f,import.meta.url);
const traits=JSON.parse(await readFile(data('traits.json'),'utf8')).rows;
const bg=JSON.parse(await readFile(data('backgrounds.json'),'utf8')),drafts=JSON.parse(await readFile(data('background-drafts.json'),'utf8'));
const occupations=new Map([...bg.records,...drafts.records].filter(r=>r.kind==='occupation').map(r=>[r.id,r.label]));
const traitByName=new Map(traits.map(t=>[t.name,t]));
const GRADES=['F','D','C','B','A','S'];
export function buildSpecs(specs=SPECS){
 const errors=[];
 const trait=name=>{const t=traitByName.get(name);if(!t){errors.push('없는 특성: '+name);return null;}return {name,id:t.id,key:t.binding?.key??null};};
 const out=specs.map(spec=>{
  for(const id of spec.occupations)if(!occupations.has(id))errors.push('없는 직업 ID: '+id);
  const rules=spec.rules.map(r=>{
   const base={type:r.type,status:'확정',...(r.text?{text:r.text}:{})};
   if(['chance','grant','exclude','forbid','raise'].includes(r.type)){
    const t=trait(r.trait);
    const rule={...base,trait:t};
    if(r.type==='chance'){
     if(r.probability!==null&&!(r.probability>0&&r.probability<=100))errors.push(`${spec.label}: ${r.trait} 확률 범위`);
     rule.probability=r.probability;if(r.probability===null)rule.status='미정';
     rule.mode=r.mode??'add';if(!['add','final'].includes(rule.mode))errors.push(`${spec.label}: ${r.trait} 확률 방식`);
    }
    if(r.type==='raise')rule.status='미정';
    return rule;
   }
   if(r.type==='group'){
    const options=r.options.map(o=>({trait:trait(o.trait),probability:o.probability}));
    const sum=options.reduce((a,o)=>a+o.probability,0)+r.none;
    if(sum!==100)errors.push(`${spec.label}: 배척 그룹 합 ${sum}`);
    return {...base,options,none:r.none};
   }
   if(r.type==='tiered'){
    return {...base,status:r.weights?'확정':'미정',...(r.weights?{weights:r.weights}:{}),entry:r.entry,first:r.first.map(trait),second:{probability:r.second.probability,traits:r.second.traits.map(trait)},overall:r.entry*r.second.probability/100};
   }
   if(r.type==='skillMin'||r.type==='skillExclude'){
    const skill=SKILLS[r.skill];if(!skill)errors.push('없는 스킬: '+r.skill);
    const grades=r.type==='skillMin'?[r.grade]:r.grades;
    for(const g of grades)if(!GRADES.includes(g))errors.push('없는 등급: '+g);
    return r.type==='skillMin'?{...base,skill:{name:r.skill,key:skill},minGrade:r.grade,minValue:GRADES.indexOf(r.grade)}:{...base,skill:{name:r.skill,key:skill},grades};
   }
   if(r.type==='note')return {...base,status:'메모',text:r.text};
   errors.push('알 수 없는 규칙: '+r.type);return base;
  });
  return {label:spec.label,occupations:spec.occupations.map(id=>({id,label:occupations.get(id)??null})),source:`${SOURCE}:${spec.line}`,rules};
 });
 // 같은 직업에 같은 특성을 부여·확률과 제외·금지로 동시에 두면 모순이다.
 const byOcc=new Map();
 for(const spec of out)for(const o of spec.occupations)for(const r of spec.rules){
  const list=[r.trait,...(r.options??[]).map(x=>x.trait),...(r.first??[]),...(r.second?.traits??[])].filter(Boolean);
  for(const t of list){const k=o.id+'|'+t.name;if(!byOcc.has(k))byOcc.set(k,new Set());byOcc.get(k).add(['exclude','forbid'].includes(r.type)?'deny':'allow');}
 }
 for(const [k,v]of byOcc)if(v.size>1)errors.push('부여와 제외가 겹침: '+k);
 return {specs:out,errors};
}
if(import.meta.url===`file://${process.argv[1]}`){
 const {specs,errors}=buildSpecs();
 if(errors.length){console.error(errors.join('\n'));process.exit(1);}
 const count=s=>specs.flatMap(x=>x.rules).filter(r=>r.status===s).length;
 await writeFile(data('occupation-specs.json'),JSON.stringify({version:'20261111-specs-v1',source:SOURCE,note:'핸드오프 9장·7장 결정의 데이터화. 미정은 수치가 정해지지 않은 규칙이며 임의로 채우지 않는다. 게임 본체 미반영.',specs},null,1)+'\n');
 console.log(`${specs.length}개 명세, 확정 ${count('확정')} · 미정 ${count('미정')} · 메모 ${count('메모')}`);
}
