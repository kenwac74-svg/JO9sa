// 대사 페이지 삽입 시 조건·이미지·소리·실행 처리를 함께 이동한다.
'use strict';
const assert=require('node:assert/strict'),core=require('./core.cjs'),scenes=require('./scenes.cjs');
const ARRAYS=new Set(['$text','$special_image','$special_image_full','$special_action','$play_sound']);
const RENDERERS=['interaction_screen','interaction_screen_city','sex_interaction_screen','special_screen'];
function applyEdits(source,edits){
 const sorted=edits.slice().sort((a,b)=>b.start-a.start||b.end-a.end);
 for(let i=1;i<sorted.length;i++)if(sorted[i].end>sorted[i-1].start)throw Error('페이지 연결 수정 범위가 겹칩니다.');
 for(const e of sorted)source=source.slice(0,e.start)+e.value+source.slice(e.end);
 return source;
}
function shiftedNumber(n,operator,page,isCount=false){
 if(isCount)return n>=page?n+1:n;
 if(operator==='>'||operator==='<=')return n>=page?n+1:n;
 return n>page?n+1:n;
}
function numberEdits(source,page,summary,depth=0){
 if(depth>4)throw Error('동적 페이지 명령의 중첩이 너무 깊습니다.');
 const safe=scenes.masked(source),edits=[],handled=[];
 function change(start,end,value,kind){if(source.slice(start,end)===value)return;edits.push({start,end,value});summary[kind]=(summary[kind]||0)+1;}
 for(const m of safe.matchAll(/(\$[\w]+\s*\[\s*)([^\]\n]+)(\s*\])/g)){
  const name=m[1].match(/^\$[\w]+/)[0].toLowerCase();if(!ARRAYS.has(name))continue;
  const index=m[2].trim();
  if(/^\d+$/.test(index)){
   const at=m.index+m[1].length,leading=m[2].length-m[2].trimStart().length;
   if(Number(index)>page)change(at+leading,at+leading+index.length,String(Number(index)+1),name==='$text'?'dialogue':name==='$special_action'?'actions':name==='$play_sound'?'sounds':'images');
  }else if(!/^txt$/i.test(index))throw Error('계산식으로 지정된 '+name+' 페이지 연결을 확인해야 합니다: '+index);
  else handled.push([m.index,m.index+m[0].length]);
 }
 for(const m of safe.matchAll(/(?<![\w$])(txt|txt_count)\s*(<=|>=|<>|!=|=|!|<|>)\s*(\d+)\b/gi)){
  const n=Number(m[3]),count=m[1].toLowerCase()==='txt_count',assignment=m[2]==='='&&/(?:^|[\n&:])\s*$/.test(safe.slice(0,m.index));
  const end=m.index+m[0].length,start=end-m[3].length;
  if(/^\s*[+*/%\-]/.test(safe.slice(end)))throw Error('페이지 이동 대상이 계산식입니다: '+source.slice(m.index,end+30).split('\n')[0]);
  change(start,end,String(shiftedNumber(n,assignment?'=':m[2],page,count)),count?'counts':assignment?'jumps':'conditions');handled.push([m.index,end]);
 }
 const inverse={'<':'>','>':'<','<=':'>=','>=':'<=','=':'=','!':'!','<>':'<>','!=':'!='};
 for(const m of safe.matchAll(/\b(\d+)\s*(<=|>=|<>|!=|=|!|<|>)\s*(txt|txt_count)\b/gi)){
  change(m.index,m.index+m[1].length,String(shiftedNumber(Number(m[1]),inverse[m[2]],page,m[3].toLowerCase()==='txt_count')),'conditions');handled.push([m.index,m.index+m[0].length]);
 }
 for(const m of safe.matchAll(/(?<![\w$])txt(?:_count)?\b/gi)){
  if(handled.some(([a,b])=>m.index>=a&&m.index<b))continue;
  const rest=safe.slice(m.index+m[0].length),before=safe.slice(0,m.index);
  if(/^\s*(?:<=|>=|<>|!=|=|!|<|>)/.test(rest)&&!/^\s*=\s*arrsize\s*\(/i.test(rest))throw Error('변수로 정해지는 페이지 연결을 확인해야 합니다: '+source.slice(m.index,m.index+65).split('\n')[0]);
  if(/(?:^|[\n&:])\s*$/.test(before)&&/^\s*(?:\+=|-=)/.test(rest))throw Error('상대 번호로 이동하는 이벤트 명령을 확인해야 합니다: '+source.slice(m.index,m.index+45).split('\n')[0]);
 }
 // Rewrite code in dynamic strings and EXEC hyperlinks, never ordinary prose.
 for(const literal of core.literals(source)){
  const prefix=source.slice(Math.max(0,literal.start-100),literal.start-1);let replacement=literal.text;
  if(/\bdynamic\s*$/i.test(prefix)||/\$special_action\s*\[\s*\d+\s*\]\s*=\s*$/i.test(prefix))replacement=applyEdits(replacement,numberEdits(replacement,page,summary,depth+1));
  else{
   const links=[];
   for(const m of replacement.matchAll(/\bhref\s*=\s*(["'])\s*exec:([\s\S]*?)\1/gi)){
    const start=m.index+m[0].indexOf(m[2]),changed=applyEdits(m[2],numberEdits(m[2],page,summary,depth+1));
    if(changed!==m[2])links.push({start,end:start+m[2].length,value:changed});
   }
   replacement=applyEdits(replacement,links);
  }
  if(replacement!==literal.text)edits.push({start:literal.start,end:literal.end,value:replacement.split(literal.quote).join(literal.quote+literal.quote)});
 }
 return edits;
}
function braceSpans(safe){const stack=[],out=[];for(let i=0;i<safe.length;i++){if(safe[i]==='{')stack.push(i);if(safe[i]==='}'&&stack.length){const start=stack.pop();if(!stack.length)out.push([start,i+1]);}}return out;}
function renderer(doc,entry,body,analysis,route,scoped){
 const delayed=braceSpans(scenes.masked(scoped));
 const calls=scenes.calls(scoped,{location:entry.location,scene:route}),direct=calls.find(c=>RENDERERS.includes(c.target)&&!delayed.some(([a,b])=>c.offset>=a&&c.offset<b)&&!analysis.blocks.some(b=>b.start>route.start&&route.start+c.offset>=b.start&&route.start+c.offset<b.end));
 if(direct)return {name:direct.target,insertAt:route.start+direct.offset};
 const common=scenes.calls(body,{location:entry.location,scene:route}).filter(c=>c.offset>=route.end&&!analysis.blocks.some(b=>c.offset>=b.start&&c.offset<b.end));
 const simple=common.find(c=>RENDERERS.includes(c.target));if(simple)return {name:simple.target,insertAt:route.end};
 // The basic city dispatcher preserves the initialized arrays. Other types may
 // regenerate them, so confirm the exact dispatcher path and its final renderer.
 if(entry.location==='interaction_city'&&common.some(c=>c.target==='interaction_result_city')){
  const prefix=body.slice(0,route.start).split('');
  for(const b of analysis.blocks)if(b.start<route.start&&b.end<=route.start)for(let i=b.start;i<Math.min(b.end,prefix.length);i++)if(prefix[i]!=='\n')prefix[i]=' ';
  const defaults=scenes.assignments(prefix.join('')),local=scenes.assignments(scoped),type=local.$interaction_type??defaults.$interaction_type;
  const result=doc.locations.find(l=>l.name==='interaction_result_city');
  if(type==='basic'&&result){
   const next=core.shift(doc.lines[result.body],5),a=scenes.analyse(result.name,next),basic=a.blocks.filter(b=>b.predicate?.key==='$interaction_type'&&b.predicate.value==='basic');
   const ending=scenes.calls(next,{location:result.name}).some(c=>c.target==='interaction_screen_city'&&!a.blocks.some(b=>c.offset>=b.start&&c.offset<b.end));
   if(!basic.length&&ending)return {name:'interaction_screen_city',insertAt:route.end,via:result.name};
  }
 }
 throw Error('이 장면의 다음 화면 연결을 아직 분석하지 못했습니다. 위치: '+entry.location+' / '+route.condition);
}
function prepare(doc,selection,text,mode='page'){
 if(typeof text!=='string'||!text.trim())throw Error('추가할 대사를 입력하세요.');
 if(text.length>20000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text))throw Error('추가 대사가 너무 길거나 지원하지 않는 문자가 있습니다.');
 if(selection?.hash!==doc.hash)throw Error('검색 이후 QSP가 변경되었습니다. 다시 검색하세요.');
 const entry=core.entries(doc).find(e=>e.fieldIndex===selection.fieldIndex&&e.start===selection.start&&e.end===selection.end&&e.text===selection.text);
 if(!entry||!entry.dialogue)throw Error('추가할 기준 대사를 먼저 선택하세요.');
 text=core.restoreDisplayTokens(doc,text.replace(/\r\n?/g,'\n').trim(),entry.text);core.validateMarkup(text);
 if(mode==='paragraph'){const p=core.prepare(doc,selection,entry.text+'<br><br>'+text);return {...p,operation:'paragraph',addition:text};}
 if(mode!=='page')throw Error('지원하지 않는 추가 방식입니다.');
 if(entry.field!=='body'||!entry.quote)throw Error('이 설명문은 페이지 배열이 아닙니다.');
 const oldField=core.shift(doc.lines[entry.fieldIndex],5),analysis=scenes.analyse(entry.location,oldField);
 const lineStart=oldField.lastIndexOf('\n',entry.start)+1,head=oldField.slice(lineStart,entry.start-1),assignment=head.match(/^(\s*)\$text\s*\[\s*(\d+)\s*\]\s*=\s*$/i);
 if(!assignment)throw Error('페이지 추가 기준은 독립된 $text[번호] 대사여야 합니다.');
 const page=Number(assignment[2]),route=analysis.scenes.filter(s=>s.id!=='root'&&!s.type&&entry.start>=s.start&&entry.start<s.end).sort((a,b)=>(a.end-a.start)-(b.end-b.start))[0]||analysis.scenes[0],scoped=oldField.slice(route.start,route.end),safe=scenes.masked(scoped),braces=braceSpans(safe);
 const inDelayedCode=offset=>braces.some(([a,b])=>offset>=a&&offset<b);
 if(analysis.blocks.some(b=>b.start>route.start&&b.start<entry.start&&b.end>entry.start))throw Error('조건별로 갈라진 페이지입니다. 이 분기의 대사 배열을 함께 분석해야 합니다: '+route.condition);
 if(/\b(?:chestbuster|self_sex_lesson|self_sex_lesson_special)\b/i.test(scoped))throw Error('공용 화면에도 별도 페이지 조건이 있는 장면입니다. 해당 연결의 추가 분석이 필요합니다.');
 if(/\b(?:copyarr|arrpos|arrcomp|scanstr)\b/i.test(safe))throw Error('배열을 복사하거나 검색하는 페이지 생성 코드의 추가 분석이 필요합니다.');
 const assignments=[...safe.matchAll(/\$text\s*\[\s*(\d+)\s*\]\s*=/gi)].filter(m=>!inDelayedCode(m.index)),indices=assignments.map(m=>Number(m[1]));
 if(new Set(indices).size!==indices.length)throw Error('여러 조건에서 같은 페이지를 생성합니다. 조건별 페이지 연결의 추가 분석이 필요합니다.');
 for(const m of assignments){const absolute=route.start+m.index;if(analysis.blocks.some(b=>b.start>route.start&&b.start<absolute&&b.end>absolute))throw Error('조건별 대사 배열의 추가 분석이 필요합니다.');}
 if(!indices.includes(page)||indices.some(n=>n>10000))throw Error('페이지 번호를 확인할 수 없습니다.');
 const screen=renderer(doc,entry,oldField,analysis,route,scoped),summary={dialogue:0,images:0,actions:0,sounds:0,counts:0,conditions:0,jumps:0};
 const edits=numberEdits(scoped,page,summary).map(e=>({...e,start:e.start+route.start,end:e.end+route.start}));
 const quote=entry.quote,close=entry.end+1,lineEnd=oldField.indexOf('\n',close),tail=oldField.slice(close,lineEnd<0?oldField.length:lineEnd);
 if(tail.trim()&&!/^\s*!/.test(tail))throw Error('여러 명령을 연결한 대사입니다. 대사 끝의 연결 명령을 확인해야 합니다.');
 const newline=oldField.includes('\r\n')?'\r\n':'\n',encoded=text.split(quote).join(quote+quote),insertAt=lineEnd<0?oldField.length:lineEnd-(oldField[lineEnd-1]==='\r'?1:0);
 edits.push({start:insertAt,end:insertAt,value:newline+assignment[1]+'$text['+(page+1)+'] = '+quote+encoded+quote});
 // Inherit visuals after setup. Do not copy an action/sound and repeat its effect.
 if(screen.name!=='sex_interaction_screen'){
  const aliases='$special_image['+(page+1)+'] = $special_image['+page+'] & $special_image_full['+(page+1)+'] = $special_image_full['+page+']';
  edits.push({start:screen.insertAt,end:screen.insertAt,value:screen.insertAt<route.end?aliases+' & ':assignment[1]+aliases+newline});
 }
 const newField=applyEdits(oldField,edits),changed={...doc,lines:doc.lines.slice()};changed.lines[entry.fieldIndex]=core.shift(newField,-5);
 const raw=core.serialize(changed),checked=core.parse(raw);assert(core.serialize(checked).equals(raw));
 assert.equal(checked.locations.length,doc.locations.length);checked.lines.forEach((s,i)=>{if(i!==entry.fieldIndex)assert.equal(s,doc.lines[i]);});
 if(!core.entries(checked).some(e=>e.fieldIndex===entry.fieldIndex&&e.text===text))throw Error('추가 대사 검증에 실패했습니다.');
 const a=Math.min(...edits.map(e=>e.start)),b=Math.max(...edits.map(e=>e.end)),delta=newField.length-oldField.length,piece=core.minimalEdit(oldField,newField,a,b,b+delta);
 const labels={dialogue:'뒤 대사',images:'이미지 연결',actions:'실행 처리',sounds:'소리 연결',counts:'전체 페이지 수',conditions:'페이지 조건',jumps:'페이지 이동'};
 const adjustments=Object.entries(summary).filter(([,n])=>n).map(([key,n])=>labels[key]+' '+n+'곳 조정');
 if(screen.name!=='sex_interaction_screen')adjustments.push('추가 페이지는 앞 페이지의 이미지 유지 · 실행 처리와 소리는 복제하지 않음');
 const selectionStart=entry.start+edits.filter(e=>e.end<=entry.start).reduce((n,e)=>n+e.value.length-(e.end-e.start),0);
 return {raw,entry,selectionStart,replacement:entry.text+'\n\n[추가된 다음 페이지]\n'+text,oldField,newField,piece,after:core.hash(raw),operation:'page',addition:text,page:page+1,adjustments};
}
module.exports={prepare,numberEdits,applyEdits,shiftedNumber};
