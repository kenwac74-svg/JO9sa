'use strict';
// JO9 MOD START: text-batch-replace-20261018
const core=require('./core.cjs');
const key=entry=>`${entry.fieldIndex}:${entry.start}:${entry.end}`;
function options(input={}){
  const {query,location='',mode='text'}=input;
  if(typeof query!=='string'||!query.length)throw Error('찾을 단어를 입력해 주세요.');
  if(typeof location!=='string'||!['text','all'].includes(mode))throw Error('검색 범위가 올바르지 않습니다.');
  return {query,location,mode};
}
function count(text,query){let n=0,at=0;while((at=text.indexOf(query,at))!==-1){n++;at+=query.length;}return n;}
function matches(doc,input,cached){
  const {query,location,mode}=options(input);
  return (cached||core.entries(doc)).filter(e=>(mode==='all'||e.dialogue)&&(!location||e.location.includes(location))&&e.text.includes(query)).map(e=>({...e,id:key(e),hash:doc.hash,occurrences:count(e.text,query)}));
}
function search(doc,input={},cached){
  const scope=options(input),offset=Number(input.offset??0),limit=Number(input.limit??50);
  if(!Number.isSafeInteger(offset)||offset<0||!Number.isSafeInteger(limit)||limit<1)throw Error('검색 페이지가 올바르지 않습니다.');
  const found=matches(doc,scope,cached);
  return {hash:doc.hash,...scope,total:found.length,occurrences:found.reduce((n,e)=>n+e.occurrences,0),offset,limit,results:found.slice(offset,offset+limit)};
}
function prepare(doc,input,cached){
  if(!input||input.hash!==doc.hash||core.hash(core.serialize(doc))!==doc.hash)throw Error('검색 이후 QSP가 변경되었습니다. 다시 검색해 주세요.');
  if(typeof input.replacement!=='string')throw Error('수정문을 입력해 주세요.');
  if(input.replacement.length>1000000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(input.replacement))throw Error('수정문에 지원하지 않는 제어문자가 있습니다.');
  const replacement=input.replacement.replace(/\r\n?/g,'\n'),found=matches(doc,input,cached),selection=input.selection;
  if(!selection||typeof selection.all!=='boolean')throw Error('치환할 원문을 선택해 주세요.');
  const known=new Set(found.map(e=>e.id));
  function selectedIds(values){
    if(values===undefined)return new Set();
    if(!Array.isArray(values)||values.some(id=>typeof id!=='string'||!known.has(id))||new Set(values).size!==values.length)throw Error('선택한 원문 위치가 달라졌습니다. 다시 검색해 주세요.');
    return new Set(values);
  }
  const ids=selectedIds(selection.ids),except=selectedIds(selection.except);
  const chosen=found.filter(e=>selection.all?!except.has(e.id):ids.has(e.id));
  if(!chosen.length)throw Error('치환할 원문을 선택해 주세요.');
  const changed={...doc,lines:doc.lines.slice()},edits=[],changes=chosen.map(e=>({id:e.id,location:e.location,field:e.field,line:e.line,old:e.text,new:e.text.split(input.query).join(replacement),occurrences:e.occurrences}));
  if(changes.every(e=>e.old===e.new))throw Error('원문과 수정문이 같습니다.');
  for(const change of changes)core.validateMarkup(change.new);
  const byId=new Map(changes.map(change=>[change.id,change])),groups=new Map();
  for(const entry of chosen){if(!groups.has(entry.fieldIndex))groups.set(entry.fieldIndex,[]);groups.get(entry.fieldIndex).push(entry);}
  // Assemble each field once; original ranges stay valid regardless of replacement lengths.
  // A single export fragment covers its selected ranges and unchanged intervening bytes.
  for(const group of groups.values()){
    group.sort((a,b)=>a.start-b.start);
    const first=group[0],last=group[group.length-1],oldField=core.shift(doc.lines[first.fieldIndex],5),parts=[];
    let cursor=0,delta=0;
    for(const entry of group){
      const value=byId.get(entry.id).new,encoded=entry.quote?value.split(entry.quote).join(entry.quote+entry.quote):value;
      if(entry.quote){const parsed=core.literals(entry.quote+encoded+entry.quote);if(parsed.length!==1||parsed[0].text!==value)throw Error('수정문의 따옴표 검사가 실패했습니다.');}
      parts.push(oldField.slice(cursor,entry.start),encoded);cursor=entry.end;delta+=encoded.length-(entry.end-entry.start);
    }
    parts.push(oldField.slice(cursor));const newField=parts.join('');
    const piece=core.minimalEdit(oldField,newField,first.start,last.end,last.end+delta);
    edits.push({location:first.location,field:first.field,...piece,count:1});
    changed.lines[first.fieldIndex]=core.shift(newField,-5);
  }
  const raw=core.serialize(changed),checked=core.parse(raw),fields=new Set(chosen.map(e=>e.fieldIndex));
  if(checked.locations.length!==doc.locations.length||checked.lines.length!==doc.lines.length||checked.lines.some((s,i)=>!fields.has(i)&&s!==doc.lines[i]))throw Error('수정 범위를 벗어난 변경이 감지되었습니다.');
  return {raw,before:doc.hash,after:core.hash(raw),edits,changes,count:chosen.length,occurrences:chosen.reduce((n,e)=>n+e.occurrences,0)};
}
module.exports={key,search,prepare};
// JO9 MOD END: text-batch-replace-20261018
