'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const c=require('./core.cjs');
const batch=require('./batch-replace.cjs');

function fixture(locations){
  const lines=['QSPGAME','unchanged header','header two',c.shift(String(locations.length),-5)];
  for(const [name,desc,body] of locations)lines.push(c.shift(name,-5),c.shift(desc,-5),c.shift(body,-5),c.shift('1',-5),c.shift('keep.png',-5),c.shift('보존 행동',-5),c.shift("*pl '행동 고양이'",-5));
  lines.push('');return c.parse(Buffer.from(lines.join('\r\n'),'utf16le'));
}
const sample=()=>fixture([
  ['first','고양이 설명',"! '주석 고양이'\n*pl '고양이 고양이'\n*pl '고양이 고양이'\n$path = 'gs 고양이'\n*pl '보존 문장'"],
  ['second','','*pl "고양이 고양이"']
]);
function request(doc,extra={}){return {hash:doc.hash,query:'고양이',location:'',mode:'text',selection:{all:true},replacement:'여우',...extra};}
function replay(doc,edits){
  const lines=doc.lines.slice();
  for(const edit of edits){const loc=doc.locations.find(l=>l.name===edit.location);const index=loc[edit.field];const value=c.shift(lines[index],5);assert.equal(value.split(edit.old).length-1,1,'each exported old fragment matches once at its replay step');lines[index]=c.shift(value.replace(edit.old,()=>edit.new),-5);}
  return c.serialize({...doc,lines});
}

test('search pages matching strings with stable position IDs and total literal occurrences',()=>{
  assert.equal(typeof batch.search,'function');
  const doc=sample(),result=batch.search(doc,{query:'고양이',offset:1,limit:2});
  assert.equal(result.hash,doc.hash);assert.equal(result.query,'고양이');assert.equal(result.location,'');assert.equal(result.mode,'text');
  assert.equal(result.total,4);assert.equal(result.occurrences,7);assert.equal(result.offset,1);assert.equal(result.limit,2);assert.equal(result.results.length,2);
  assert.equal(result.results[0].text,'고양이 고양이');assert.equal(result.results[0].occurrences,2);
  assert.notEqual(result.results[0].id,result.results[1].id);
  assert.equal(result.results[0].id,`${result.results[0].fieldIndex}:${result.results[0].start}:${result.results[0].end}`);
  assert.equal(batch.key(result.results[0]),result.results[0].id);
  assert.equal(batch.search(doc,{query:'고양이',location:'sec'}).total,1);
  assert.equal(batch.search(doc,{query:'고양이',mode:'all'}).total,5);
  assert.equal(batch.search(doc,{query:'고양이',offset:99}).results.length,0);
});

test('prepare changes only selected duplicate positions and replaces all occurrences within them',()=>{
  assert.equal(typeof batch.prepare,'function');
  const doc=sample(),raw=c.serialize(doc),rows=batch.search(doc,{query:'고양이'}).results;
  const chosen=rows[2],p=batch.prepare(doc,request(doc,{selection:{all:false,ids:[chosen.id]}}));
  const after=c.parse(p.raw),values=c.entries(after).map(e=>e.text);
  assert.deepEqual(values,['고양이 설명','고양이 고양이','여우 여우','gs 고양이','보존 문장','고양이 고양이']);
  assert.equal(p.before,doc.hash);assert.equal(p.after,c.hash(p.raw));assert.equal(p.count,1);assert.equal(p.occurrences,2);
  assert.deepEqual(p.changes,[{id:chosen.id,location:'first',field:'body',line:3,old:'고양이 고양이',new:'여우 여우',occurrences:2}]);
  assert.equal(p.edits.length,1);assert.equal(p.edits[0].count,1);assert.deepEqual(replay(doc,p.edits),p.raw);
  assert.deepEqual(c.serialize(doc),raw,'prepare does not mutate the input document');
  assert.equal(after.lines.length,doc.lines.length);
  for(let index=0;index<doc.lines.length;index++)if(index!==chosen.fieldIndex)assert.equal(after.lines[index],doc.lines[index],`header/action/other field ${index} is unchanged`);
  assert.ok(c.shift(after.lines[chosen.fieldIndex],5).startsWith("! '주석 고양이'\n*pl '고양이 고양이'\n"));
});

test('one export fragment per field replays multiple longer replacements together',()=>{
  const doc=sample(),p=batch.prepare(doc,request(doc,{replacement:'아주 긴 여우 문구'}));
  assert.deepEqual(c.entries(c.parse(p.raw)).map(e=>e.text),['아주 긴 여우 문구 설명','아주 긴 여우 문구 아주 긴 여우 문구','아주 긴 여우 문구 아주 긴 여우 문구','gs 고양이','보존 문장','아주 긴 여우 문구 아주 긴 여우 문구']);
  assert.equal(p.count,4);assert.equal(p.occurrences,7);assert.equal(p.edits.length,3);
  assert.deepEqual(replay(doc,p.edits),p.raw);
});

test('all-selection includes off-page results while exceptions stay unchanged',()=>{
  const body=Array.from({length:241},(_,i)=>`*pl '고양이 ${i}'`).join('\n'),doc=fixture([['many','',body]]);
  const first=batch.search(doc,{query:'고양이',limit:5}),last=batch.search(doc,{query:'고양이',offset:240,limit:5});
  assert.equal(first.total,241);assert.equal(first.results.length,5);assert.equal(last.results[0].text,'고양이 240');
  const p=batch.prepare(doc,request(doc,{selection:{all:true,except:[first.results[0].id,last.results[0].id]}}));
  const values=c.entries(c.parse(p.raw)).map(e=>e.text);assert.equal(p.count,239);assert.equal(p.occurrences,239);
  assert.equal(values[0],'고양이 0');assert.equal(values[1],'여우 1');assert.equal(values[239],'여우 239');assert.equal(values[240],'고양이 240');
  assert.deepEqual(replay(doc,p.edits),p.raw);
});

test('literal query and replacement preserve regex characters, dollar expansions, case and whitespace',()=>{
  const doc=fixture([['literal','',"*pl 'a.* a.* A.*'\n*pl ' a  a '"]]);
  const p=batch.prepare(doc,request(doc,{query:'a.*',mode:'all',replacement:"$&'$`"}));
  assert.equal(c.entries(c.parse(p.raw))[0].text,"$&'$` $&'$` A.*");assert.equal(p.occurrences,2);assert.deepEqual(replay(doc,p.edits),p.raw);
  const spaces=batch.search(doc,{query:' ',mode:'all'});assert.equal(spaces.query,' ');assert.equal(spaces.occurrences,6);
  assert.equal(batch.search(doc,{query:'a.*',mode:'all'}).occurrences,2);
});

test('quotes and multiline replacements round trip without changing surrounding CRLF code',()=>{
  const body="! 보존 주석\r\n*pl '고양이'\r\n*pl \"고양이\"\r\nif flag = 1: x = 3",doc=fixture([['quoted','',body]]);
  const p=batch.prepare(doc,request(doc,{replacement:'새 \'말\'과 "말"\r\n다음 줄'}));
  assert.deepEqual(c.entries(c.parse(p.raw)).map(e=>e.text),['새 \'말\'과 "말"\n다음 줄','새 \'말\'과 "말"\n다음 줄']);
  const changed=c.shift(c.parse(p.raw).lines[6],5);assert.ok(changed.startsWith('! 보존 주석\r\n'));assert.ok(changed.endsWith('\r\nif flag = 1: x = 3'));
  assert.deepEqual(replay(doc,p.edits),p.raw);
});

test('empty replacement deletes all matches including an entire string and description',()=>{
  const doc=fixture([['delete','고양이',"*pl '고양이'\n*pl '고양이와 고양이'\n*pl '보존'"]]),p=batch.prepare(doc,request(doc,{replacement:''}));
  const after=c.parse(p.raw);assert.equal(c.shift(after.lines[5],5),'');assert.deepEqual(c.entries(after).map(e=>e.text),['','와 ','보존']);
  assert.equal(p.count,3);assert.equal(p.occurrences,4);assert.deepEqual(replay(doc,p.edits),p.raw);
});

test('replacement validates final markup while permitting existing HTML and interpolation edits',()=>{
  const doc=fixture([['markup','',"*pl '<b>고양이</b> <<$name>>'"]]);
  const good=batch.prepare(doc,request(doc,{replacement:'<i>여우</i>'}));assert.equal(c.entries(c.parse(good.raw))[0].text,'<b><i>여우</i></b> <<$name>>');
  const expression=batch.prepare(doc,request(doc,{query:'$name',replacement:'func("a")'}));assert.equal(c.entries(c.parse(expression.raw))[0].text,'<b>고양이</b> <<func("a")>>');
  for(const replacement of ['<<>>','<span title="broken>'])assert.throws(()=>batch.prepare(doc,request(doc,{replacement})),/치환문|HTML/);
  const plain=fixture([['plain','',"*pl '고양이'"]]);assert.throws(()=>batch.prepare(plain,request(plain,{replacement:'<<unclosed'})),/치환문/);
});

test('stale hashes, forged IDs and IDs outside the current query scope are rejected',()=>{
  const doc=sample(),all=batch.search(doc,{query:'고양이',mode:'all'}).results,known=all[1].id,internal=all.find(e=>!e.dialogue).id;
  for(const selection of [
    {all:false,ids:['999:1:2']},
    {all:true,except:['999:1:2']},
    {all:false,ids:[internal]},
    {all:false,ids:[known,known]},
    {all:false,ids:[]},
    {all:true,except:all.filter(e=>e.dialogue).map(e=>e.id)},
    {all:false,ids:known},
    {all:true,except:'bad'},
    {},null
  ])assert.throws(()=>batch.prepare(doc,request(doc,{selection})),/선택|원문/);
  assert.throws(()=>batch.prepare(doc,request(doc,{hash:'stale'})),/변경/);
  assert.throws(()=>batch.prepare(doc,request(doc,{location:'second',selection:{all:false,ids:[known]}})),/선택|원문/);
  doc.lines[6]=c.shift("*pl '변경된 고양이'",-5);
  assert.throws(()=>batch.prepare(doc,request(doc)),/변경/);
});

test('invalid query, replacement and paging input fail before any edits are prepared',()=>{
  const doc=sample();
  for(const query of ['',null,42])assert.throws(()=>batch.search(doc,{query}),/단어/);
  for(const mode of ['',null,'unknown'])assert.throws(()=>batch.search(doc,{query:'고양이',mode}),/범위/);
  for(const page of [{offset:-1},{offset:0.5},{limit:0},{limit:1.5}])assert.throws(()=>batch.search(doc,{query:'고양이',...page}),/페이지/);
  for(const replacement of [null,7,'bad\0text','x'.repeat(1000001)])assert.throws(()=>batch.prepare(doc,request(doc,{replacement})),/수정문|제어문자/);
  assert.throws(()=>batch.prepare(doc,request(doc,{replacement:'고양이'})),/같습니다|변경/);
});

test('cached entries give the same scoped search and prepared bytes',()=>{
  const doc=sample(),cached=c.entries(doc),input=request(doc,{location:'first',mode:'all'});
  assert.deepEqual(batch.search(doc,{query:'고양이',mode:'all'},cached),batch.search(doc,{query:'고양이',mode:'all'}));
  const p=batch.prepare(doc,input,cached),uncached=batch.prepare(doc,input);assert.deepEqual(p.raw,uncached.raw);assert.equal(p.count,4);assert.deepEqual(replay(doc,p.edits),p.raw);
});

test('large fields group hundreds of selected strings without changing intervening unselected code',()=>{
  const probe=fixture([['probe','',"*pl '고양이 하나'\n*pl '고양이 둘'"]]);
  assert.equal(batch.prepare(probe,request(probe)).edits.length,1,'one affected field produces one replayable fragment');
  const padding='x'.repeat(4096),excluded=new Set([0,300,599]);
  const sourceRows=Array.from({length:600},(_,i)=>`*pl '고양이 ${i}'\r\n! 보존 ${padding}\r\n`);
  const expectedRows=Array.from({length:600},(_,i)=>`*pl '${excluded.has(i)?'고양이':'새로운 여우'} ${i}'\r\n! 보존 ${padding}\r\n`);
  const prefix="! 이 앞은 보존\r\n",suffix="! 이 뒤는 보존\r\nx = 7",body=prefix+sourceRows.join('')+suffix;
  const doc=fixture([['large','',body],['other','보존 설명',"*pl '고양이 보존'"]]),rows=batch.search(doc,{query:'고양이',location:'large',limit:600}).results;
  const p=batch.prepare(doc,request(doc,{location:'large',replacement:'새로운 여우',selection:{all:true,except:[rows[0].id,rows[300].id,rows[599].id]}}));
  const after=c.parse(p.raw);assert.equal(p.count,597);assert.equal(p.occurrences,597);assert.equal(p.edits.length,1);assert.equal(p.edits[0].count,1);
  assert.equal(c.shift(after.lines[6],5),prefix+expectedRows.join('')+suffix);
  assert.ok(p.edits[0].old.length<body.length,'fragment stays within the first and last selected text plus unique context');
  for(let index=0;index<doc.lines.length;index++)if(index!==6)assert.equal(after.lines[index],doc.lines[index]);
  assert.deepEqual(replay(doc,p.edits),p.raw);assert.equal(c.shift(doc.lines[6],5),body);
});
