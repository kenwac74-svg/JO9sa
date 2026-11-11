import {seededUnit} from './engine.mjs';
import {editedBackgroundText,worldFamilies,familyOccupations,backgroundAgeAllows} from './background-settings.mjs';
export const JOB_MAP={general:[],huntress:['huntress','heroine','brigand','thug','avanturiste'],maid:['maid','valertry','oficiant'],teacher:['teacher'],nurse:['nurse'],herbalist:['herbalist','shaman','witch','sorceress'],brothel:['whore','brothel','markitane']};
const BACKGROUND_MAP={ordinary:[],sheltered:['merchant','knight','mprincess','craftsman','barbarian_king','admiral','gendesigner'],academic:['church','scientist','nanofarmacist','gendesigner','sorcerer','priest','shaman'],field:['tribe','amazon','nomad','hunter','fisher','viking','orphan','bondman','pesant']};
export function buildBackgroundCases(catalogue,config={}){
 const worlds=catalogue.records.filter(r=>r.kind==='world'),families=new Map(catalogue.records.filter(r=>r.kind==='family').map(x=>[x.id,x])),jobs=new Map(catalogue.records.filter(r=>r.kind==='occupation').map(x=>[x.id,x]));
 const rows=[];
 for(const w of worlds)for(const fid of worldFamilies(catalogue,config,w.id)){
  const f=families.get(fid);if(!f)continue;
  const occupations=familyOccupations(catalogue,config,w.id,fid);
  for(const jid of occupations){
   const j=jobs.get(jid);if(!j)continue;
   rows.push({id:`${w.id}:${w.variant}:${fid}:${jid}`,world:{...w,text:editedBackgroundText(config,w)},family:{...f,text:editedBackgroundText(config,f)},occupation:{...j,text:editedBackgroundText(config,j)},title:`${w.label} · ${f.label} · ${j.label}`});
  }
 }return rows;
}
export function findBackgrounds(cases,{query='',world='',family='',occupation='',job='',background=''}={}){
 const q=query.trim().toLocaleLowerCase(),words=q.split(/\s+/).filter(Boolean);
 return cases.filter(x=>(!world||x.world.id===world)&&(!family||x.family.id===family)&&(!occupation||x.occupation.id===occupation)&&(!JOB_MAP[job]?.length||JOB_MAP[job].includes(x.occupation.id))&&(!BACKGROUND_MAP[background]?.length||BACKGROUND_MAP[background].includes(x.family.id))&&words.every(w=>[x.title,x.id,x.world.text,x.family.text,x.occupation.text].join(' ').toLocaleLowerCase().includes(w)));
}
export function backgroundCategories(cases,filters={}){
 return Object.fromEntries(['world','family','occupation'].map(kind=>{
  const options=[...new Map(cases.map(item=>[item[kind].id,{id:item[kind].id,label:item[kind].label}])).values()];
  const others={...filters,[kind]:''};
  return [kind,options.map(option=>({...option,count:findBackgrounds(cases,{...others,[kind]:option.id}).length}))];
 }));
}
export function autoBackground(character,cases,config={}){
 const eligible=cases.filter(item=>backgroundAgeAllows(config,item,character.seedAge));
 let rows=findBackgrounds(eligible,{job:character.job,background:character.background}),relaxed=false;
 if(!rows.length){rows=findBackgrounds(eligible,{job:character.job});relaxed=true;}
 if(!rows.length){rows=eligible;relaxed=true;}
 const selected=rows[Math.floor(seededUnit(character.id+'|'+character.seed+'|'+character.job+'|'+character.background)*rows.length)]??null;
 return {selected,relaxed};
}
export function useBackground(character,item){
 if(character.note)character.noteManualBackup=character.note;
 character.storySelection={world:item.world.id,variant:item.world.variant,family:item.family.id,occupation:item.occupation.id};
 const render=t=>t.replaceAll('{이름}',character.name||'이 인물');
 character.storyText={world:render(item.world.text),family:render(item.family.text),occupation:render(item.occupation.text)};
 character.note=`[세계]\n${character.storyText.world}\n\n[출신]\n${character.storyText.family}\n\n[직업]\n${character.storyText.occupation}`.slice(0,4000);
}
