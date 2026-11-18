'use strict';
// JO9 MOD START CHOICE_ADDITION_20261116
const core=require('./core.cjs'),crypto=require('node:crypto'),syntax=require('./check-image-cycle-syntax.cjs');
const quote=value=>"'"+value.replaceAll("'","''")+"'";
const lhsPattern='\\$[\\p{L}_][\\p{L}\\p{N}_]*(?:\\[\\s*(?:\\d+|\'(?:[^\']|\'\')*\'|"(?:[^"]|"")*")\\s*\\])?';
const assignment=new RegExp('^([ \\t]*)('+lhsPattern+')\\s*=\\s*$','u');
function balanced(source,name){
 let q='',stack=[];
 for(let i=0;i<source.length;i++){const c=source[i];if(q){if(c===q){if(source[i+1]===q)i++;else q='';}continue;}if(c==="'"||c==='"'){q=c;continue;}if('([{'.includes(c))stack.push(c);else if(')]}'.includes(c)&&stack.pop()!==({')':'(',']':'[','}':'{'})[c])throw Error(name+'의 괄호 짝이 맞지 않습니다.');}
 if(q)throw Error(name+'의 따옴표가 닫히지 않았습니다.');if(stack.length)throw Error(name+'의 괄호가 닫히지 않았습니다.');
}
function normalize(input){
 if(!input||typeof input.label!=='string'||!input.label.trim())throw Error('선택지 문구를 입력하세요.');
 if(typeof input.actionCode!=='string'||!input.actionCode.trim())throw Error('선택하면 실행할 QSP 실행문을 입력하세요.');
 const label=input.label.trim(),actionCode=input.actionCode.trim(),condition=String(input.condition??'').trim();
 if(label.length>20000||actionCode.length>20000||condition.length>4000||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(label+actionCode+condition))throw Error('선택지 입력이 너무 길거나 지원하지 않는 제어문자가 있습니다.');
 if(/[\r\n]/.test(actionCode))throw Error('QSP 실행문은 한 줄에 입력하고 여러 명령은 &로 연결하세요.');
 if(/[\r\n]/.test(condition))throw Error('선택 조건은 한 줄의 조건식으로 입력하세요.');
 balanced(actionCode,'실행문');balanced(condition,'조건');
 // A condition is an expression, never an extra statement or block boundary.
 let q='';for(let i=0;i<condition.length;i++){const c=condition[i];if(q){if(c===q){if(condition[i+1]===q)i++;else q='';}}else if(c==="'"||c==='"')q=c;else if(/[&:{}]/.test(c))throw Error('선택 조건에는 명령 구분자(&, :)나 코드 블록을 넣을 수 없습니다. 조건식만 입력하세요.');}
 if(syntax.checkSyntax(actionCode,{normalizeEol:true}).errors.length)throw Error('QSP 실행문의 따옴표·블록 구문을 확인하세요.');
 core.validateMarkup(label);return{label,actionCode,condition};
}
function htmlText(value){return value.split(/(<<[\s\S]*?>>)/).map(s=>s.startsWith('<<')?s:s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')).join('');}
function prepare(doc,selection,input){
 const data=normalize(input);if(selection?.hash!==doc.hash)throw Error('검색 이후 QSP가 변경되었습니다. 다시 검색하세요.');
 const entry=core.entries(doc).find(e=>e.fieldIndex===selection.fieldIndex&&e.start===selection.start&&e.end===selection.end&&e.text===selection.text);
 if(!entry||entry.field!=='body'||!entry.quote||!entry.dialogue)throw Error('선택지 추가 기준은 본문의 독립된 문자열 대입 대사여야 합니다.');
 const oldField=core.shift(doc.lines[entry.fieldIndex],5),lineStart=oldField.lastIndexOf('\n',entry.start-1)+1,head=oldField.slice(lineStart,entry.start-1),match=head.match(assignment),lineEnd=oldField.indexOf('\n',entry.end+1),end=lineEnd<0?oldField.length:lineEnd-(oldField[lineEnd-1]==='\r'?1:0);
 if(!match||oldField.slice(entry.end+1,end).trim())throw Error('독립된 문자열 대입($text[번호] 또는 $변수 = 대사)만 지원합니다. 출력 명령·연결식·같은 줄의 다른 명령은 자동으로 바꾸지 않습니다.');
 data.label=core.restoreDisplayTokens(doc,data.label,entry.text);core.validateMarkup(data.label);
 const id=crypto.randomBytes(8).toString('hex'),nl=oldField.includes('\r\n')?'\r\n':'\n',indent=match[1],lhs=match[2],href=data.actionCode.replaceAll('&','&amp;').replaceAll('"','&quot;'),html='<br><a data-jo9-choice="'+id+'" href="EXEC:'+href+'">'+htmlText(data.label)+'</a>';
 const rows=['! JO9 MOD START CHOICE_ADD_'+id];if(data.condition)rows.push('if '+data.condition+':');rows.push((data.condition?' ':'')+lhs+' += '+quote(html));if(data.condition)rows.push('end');rows.push('! JO9 MOD END CHOICE_ADD_'+id);
 const block=rows.map(r=>indent+r).join(nl),blockCheck=syntax.checkSyntax(block,{normalizeEol:true});if(blockCheck.errors.length)throw Error('선택지 추가 구문 검사가 실패했습니다.');
 // Keep repeated additions in creation order, outside each preceding guard.
 let insertAt=end;const following=new RegExp('^\\r?\\n[ \\t]*! JO9 MOD START CHOICE_ADD_([a-f0-9]{16})\\r?\\n[\\s\\S]*?\\r?\\n[ \\t]*! JO9 MOD END CHOICE_ADD_\\1(?=\\r?\\n|$)');
 for(;;){const m=oldField.slice(insertAt).match(following);if(!m)break;const expected=new RegExp('^[ \\t]*'+lhs.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+' \\+= ','m');if(!expected.test(m[0]))break;insertAt+=m[0].length;}
 const insertion=nl+block,newField=oldField.slice(0,insertAt)+insertion+oldField.slice(insertAt),changed={...doc,lines:doc.lines.slice()};changed.lines[entry.fieldIndex]=core.shift(newField,-5);
 const raw=core.serialize(changed),checked=core.parse(raw);if(!core.serialize(checked).equals(raw)||checked.locations.length!==doc.locations.length||checked.lines.some((s,i)=>i!==entry.fieldIndex&&s!==doc.lines[i]))throw Error('선택지 추가 범위 검사에 실패했습니다.');
 const added=core.entries(checked).find(e=>e.fieldIndex===entry.fieldIndex&&e.text===html);if(!added)throw Error('선택지 문자열의 따옴표 검사가 실패했습니다.');
 return{raw,entry,selectionStart:entry.start,oldField,newField,piece:core.minimalEdit(oldField,newField,insertAt,insertAt,insertAt+insertion.length),after:core.hash(raw),operation:'choice',replacement:entry.text+'\n\n[추가 선택지]\n'+data.label+'\n선택 조건: '+(data.condition||'항상 표시')+'\nQSP 실행문: '+data.actionCode,choice:{id,...data,target:lhs},adjustments:['원문 대사 유지','선택하면 입력한 QSP 실행문 실행',data.condition?'조건을 만족할 때만 표시':'항상 표시']};
}
module.exports={prepare,normalize};
// JO9 MOD END CHOICE_ADDITION_20261116
