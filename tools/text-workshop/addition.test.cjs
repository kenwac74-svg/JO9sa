'use strict';const assert=require('node:assert/strict'),c=require('./core.cjs'),add=require('./addition.cjs');
function fixture(body){const lines=['QSPGAME','','',c.shift('2',-5),c.shift('event',-5),'',c.shift(body,-5),c.shift('0',-5),c.shift('untouched',-5),'',c.shift("*p '보존 대상'",-5),c.shift('0',-5),''];return c.parse(Buffer.from(lines.join('\r\n'),'utf16le'));}
function selection(d){return {...c.entries(d).find(e=>e.text==='첫 대사'),hash:d.hash};}
const source="if event = 1:\n $text[1] = '첫 대사'\n $text[2] = '기존 다음 대사'\n $special_image[2] = 'scene/keep2.png'\n $play_sound[2] = 'keep2'\n gt 'interaction_screen'\nelseif event = 2:\n $text[1] = '다른 분기'\n gt 'interaction_screen'\nend";
const d=fixture(source),p=add.prepare(d,selection(d),"추가한 '대사' <<$name>>");
assert(p.newField.includes("$text[2] = '추가한 ''대사'' <<$name>>'"));assert(p.newField.includes("$text[3] = '기존 다음 대사'"));assert(p.newField.includes('$special_image[3]'));assert(p.newField.includes('$play_sound[3]'));assert(p.newField.endsWith("elseif event = 2:\n $text[1] = '다른 분기'\n gt 'interaction_screen'\nend"));assert.equal(c.parse(p.raw).lines[10],d.lines[10]);assert.equal(p.oldField.replace(p.piece.old,p.piece.new),p.newField);
const para=add.prepare(d,selection(d),'새 문단','paragraph');assert.equal(para.replacement,'첫 대사<br><br>새 문단');
assert.throws(()=>add.prepare(d,{...selection(d),hash:'stale'},'새 대사'),/변경/);
for(const code of [source.replace("$text[2]",'$text[i]'),source.replace("$text[2]",'$text[1]'),source.replace("$text[2] = '기존 다음 대사'","if x = 1:\n $text[2] = '기존 다음 대사'\nend")]){const doc=fixture(code);assert.throws(()=>add.prepare(doc,selection(doc),'추가 대사'));}
const conditional=fixture(source.replace("gt 'interaction_screen'","if txt = 2: x = 1\n txt_count = 2\n $special_action[2] = {\n  reward += 10\n  if txt >= 2: $place = 'home'\n }\n gt 'interaction_screen'"));
const cp=add.prepare(conditional,selection(conditional),'추가 대사');
assert(cp.newField.includes('if txt = 3: x = 1'));assert(cp.newField.includes('txt_count = 3'));assert(cp.newField.includes('$special_action[3]'));assert(cp.newField.includes('if txt >= 3'));assert.equal(cp.newField.split('reward += 10').length-1,1);
assert(cp.newField.includes('$special_image[2] = $special_image[1]'));assert(!cp.newField.includes('$special_action[2]'));
const rewrite=s=>add.applyEdits(s,add.numberEdits(s,2,{}));
assert.equal(rewrite('if txt > 2 and txt < 3: txt = 3'),'if txt > 3 and txt < 4: txt = 4');
assert.equal(rewrite('if 3 <= txt and 2 >= txt: x = 1'),'if 4 <= txt and 3 >= txt: x = 1');
assert.equal(rewrite("! if txt = 3\n $note = 'txt = 3'\n if txt = 3: x = 1"),"! if txt = 3\n $note = 'txt = 3'\n if txt = 4: x = 1");
assert.equal(rewrite('dynamic "if txt = 3: x = 1"'),'dynamic "if txt = 4: x = 1"');
assert.equal(rewrite("$text[3] = '<a href=\"EXEC: txt = 3 & gt $curloc\">선택</a>'"),"$text[4] = '<a href=\"EXEC: txt = 4 & gt $curloc\">선택</a>'");
assert.throws(()=>rewrite('if txt = next_page: x = 1'),/변수로/);
assert.throws(()=>rewrite('txt = 3 + offset'),/계산식/);
const againDoc=c.parse(cp.raw),againEntry=c.entries(againDoc).find(e=>e.text==='추가 대사'),again=add.prepare(againDoc,{...againEntry,hash:againDoc.hash},'두 번째 추가');
assert(again.newField.includes("$text[4] = '기존 다음 대사'"));assert(again.newField.includes('$special_action[4]'));assert(again.newField.includes('$special_image[3] = $special_image[2]'));assert.equal(again.newField.split('reward += 10').length-1,1);
const wide=fixture("if event = 1:\n txt_count = 9\n $special_image[9] = 'scene/last.png'\n $text[8] = '첫 대사'\n $text[9] = '끝 대사'\n gt 'interaction_screen'\nend"),wp=add.prepare(wide,selection(wide),'폭 변경 시험');
assert.equal(c.entries(c.parse(wp.raw)).find(e=>e.text==='첫 대사').start,wp.selectionStart);assert(wp.newField.includes('txt_count = 10'));
const crlf=fixture(source.replace(/\n/g,'\r\n')),crlfp=add.prepare(crlf,selection(crlf),'줄 끝 시험');assert(!/(?<!\r)\n/.test(crlfp.newField));
// Every old page keeps the same comparison result after physical page remapping.
const ops={'=':(a,b)=>a===b,'!':(a,b)=>a!==b,'>':(a,b)=>a>b,'<':(a,b)=>a<b,'>=':(a,b)=>a>=b,'<=':(a,b)=>a<=b};
for(let insertedAfter=1;insertedAfter<=4;insertedAfter++)for(let page=1;page<=5;page++)for(let boundary=0;boundary<=6;boundary++)for(const [op,fn] of Object.entries(ops))assert.equal(fn(page,boundary),fn(page>insertedAfter?page+1:page,add.shiftedNumber(boundary,op,insertedAfter)));
console.log('PASS: page insert, companion indices, sibling branch, other location, export edit, paragraph, stale input, unsafe scenes');
console.log('PASS: page count, actions once, image inheritance, comparisons, dynamic/EXEC jumps, original-page predicate equivalence');
