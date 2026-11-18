'use strict';
const core=require('./core.cjs'),choices=require('./choice-format.cjs');
function prepare(doc,selection,changes,options={}){
 if(!Array.isArray(changes)||!changes.length||changes.length>100)throw Error('편집할 본문과 선택지를 확인하세요.');
 const permitted=choices.options(doc,selection,null,options).choices.map(c=>c.selection),primary=core.entries(doc).find(e=>e.fieldIndex===selection.fieldIndex&&e.start===selection.start&&e.end===selection.end&&e.text===selection.text);
 if(!primary||selection.hash!==doc.hash)throw Error('원문이 변경되었습니다. 다시 검색하세요.');
 const allowed=new Map([{...primary,hash:doc.hash},...permitted].map(e=>[e.fieldIndex+':'+e.start,e]));
 const unique=new Set(),changed={...doc,lines:doc.lines.slice()};let edits=[],updatedEntry={...selection},count=0;
 const originalFields=new Map();
 for(const change of changes.slice().sort((a,b)=>b.selection.start-a.selection.start)){
  const id=change.selection.fieldIndex+':'+change.selection.start,old=allowed.get(id);if(!old||old.hash!==doc.hash||old.text!==change.selection.text||unique.has(id))throw Error('현재 페이지의 원문을 다시 선택하세요.');unique.add(id);
  require('./work-scope.cjs').assertEntry(old,options);
  if(typeof change.text!=='string'||!change.text.trim()||change.text.length>1000000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(change.text))throw Error('수정문을 확인하세요.');core.validateMarkup(change.text);
  const href=s=>choices.anchors(s).map(a=>a.code);if(JSON.stringify(href(old.text))!==JSON.stringify(href(change.text)))throw Error('선택지 실행문은 서식 편집에서 바꿀 수 없습니다. 선택지 문구와 서식만 수정하세요.');
  if(old.text===change.text)continue;
  if(!originalFields.has(old.fieldIndex))originalFields.set(old.fieldIndex,{location:old.location,field:old.field,text:core.shift(doc.lines[old.fieldIndex],5),start:old.start,end:old.end,delta:0});
  const field=core.shift(changed.lines[old.fieldIndex],5),encoded=change.text.split(old.quote).join(old.quote+old.quote),delta=encoded.length-(old.end-old.start);
  const bounds=originalFields.get(old.fieldIndex);bounds.start=Math.min(bounds.start,old.start);bounds.end=Math.max(bounds.end,old.end);bounds.delta+=delta;
  changed.lines[old.fieldIndex]=core.shift(field.slice(0,old.start)+encoded+field.slice(old.end),-5);
  if(old.fieldIndex===selection.fieldIndex){if(old.start===selection.start)updatedEntry={...updatedEntry,text:change.text,end:updatedEntry.start+encoded.length};else if(old.start<updatedEntry.start)updatedEntry={...updatedEntry,start:updatedEntry.start+delta,end:updatedEntry.end+delta};}count++;
 }
 for(const [fieldIndex,old]of originalFields){const next=core.shift(changed.lines[fieldIndex],5),piece=core.minimalEdit(old.text,next,old.start,old.end,old.end+old.delta);edits.push({location:old.location,field:old.field,old:piece.old,new:piece.new,count:1});}
 const raw=core.serialize(changed),current=core.parse(raw);

 if(!count)throw Error('원문과 수정문이 같습니다.');

 return{kind:'batch',operation:'inline-page',raw:core.serialize(current),before:doc.hash,after:current.hash,entry:selection,updatedEntry,edits,count,occurrences:count,replacement:changes.map(c=>c.text).join('\n'),adjustments:['본문과 선택지를 같은 페이지에서 편집','선택지 실행문·기존 조건 보존']};
}
module.exports={prepare};
