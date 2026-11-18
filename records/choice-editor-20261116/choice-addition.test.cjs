'use strict';
require('./loader.cjs');
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),scenes=require('G:/somi/JO9sa/tools/text-workshop/scenes.cjs');
const moduleFile=path.join(__dirname,'stage/choice-addition.cjs'),choice=fs.existsSync(moduleFile)?require(moduleFile):{};
function fixture(body){const rows=['QSPGAME','neutral fixture','',core.shift('2',-5),core.shift('event',-5),'',core.shift(body,-5),core.shift('0',-5),core.shift('elsewhere',-5),'',core.shift("$text='다른 장면입니다.'",-5),core.shift('0',-5),''];const raw=Buffer.from(rows.join('\r\n'),'utf16le'),doc=core.parse(raw);return{raw,doc,selection:{...core.entries(doc).find(e=>e.text==='기준 대사입니다.'),hash:doc.hash}};}
const actionCode="pick = 4 & gt 'elsewhere'",input={label:'새 선택지',actionCode,condition:''};
test('standalone array literal gains one separate marked append; original text and other locations stay byte-identical',()=>{
 a.equal(typeof choice.prepare,'function','choice prepare must exist');
 const f=fixture("if event = 1:\r\n $text[1] = '기준 대사입니다.'\r\n $text[2] = '다음 대사입니다.'\r\nend"),p=choice.prepare(f.doc,f.selection,input),d=core.parse(p.raw);
 a.equal(p.operation,'choice');a.match(p.newField,/\$text\[1\] \+= '<br><a data-jo9-choice="[a-f0-9]{16}" href="EXEC:/);a.match(p.newField,/pick = 4 &amp; gt ''elsewhere''/);
 a.equal(core.entries(d).find(e=>e.start===f.selection.start&&e.fieldIndex===f.selection.fieldIndex).text,f.selection.text);d.lines.forEach((s,i)=>{if(i!==f.selection.fieldIndex)a.equal(s,f.doc.lines[i]);});
 a.equal(p.oldField.replace(p.piece.old,p.piece.new),p.newField);a(core.serialize(d).equals(p.raw));
});
test('HTML attribute and QSP quotes roundtrip into the original action, label variables and plain text',()=>{
 const f=fixture("$text = '기준 대사입니다.'"),code='if sparks >= 2: $name = "A & B" & gt \'elsewhere\'',p=choice.prepare(f.doc,f.selection,{label:'선택 "하나" & 둘 <<$name>>',actionCode:code,condition:'sparks >= 2 and $name ! \'닫힘\''}),entries=core.entries(core.parse(p.raw)),e=entries.find(e=>e.text.includes('data-jo9-choice='));
 a.equal(scenes.links(e.text)[0].code,code);a.match(e.text,/선택 "하나" &amp; 둘 <<\$name>>/);a.match(p.newField,/if sparks >= 2 and \$name ! '닫힘':/);
});
test('repeating on the unchanged original keeps insertion order and does not inherit the first new condition',()=>{
 const f=fixture("if event = 1:\r\n $text[1]='기준 대사입니다.'\r\nend"),p=choice.prepare(f.doc,f.selection,{...input,label:'첫 선택지',condition:'sparks >= 2'}),d=core.parse(p.raw),s={...core.entries(d).find(e=>e.text===f.selection.text),hash:d.hash},q=choice.prepare(d,s,{...input,label:'둘째 선택지',actionCode:"event = 1 & gt 'event'"});
 a(q.newField.indexOf('첫 선택지')<q.newField.indexOf('둘째 선택지'));const nav=scenes.buildNavigator(core.parse(q.raw),core.entries(core.parse(q.raw))),ctx=nav.context({...s,hash:core.hash(q.raw)});const first=ctx.branches.find(b=>b.label==='첫 선택지'),second=ctx.branches.find(b=>b.label==='둘째 선택지');a(first.conditions.includes('sparks >= 2'));a(!second.conditions.includes('sparks >= 2'));a.notEqual(first.sourceStart,second.sourceStart);a.equal(first.destinations[0].location,'elsewhere');a.equal(second.destinations[0].location,'event');a.notEqual(first.destinations[0].sceneId,second.destinations[0].sceneId);a.equal(nav.open(first.destinations[0],'text').location,'elsewhere');a.equal(nav.open(second.destinations[0],'text').selection.text,f.selection.text);
});
test('ambiguous output, composite or dynamic assignments and stale selections are rejected before mutation',()=>{
 for(const line of ["*pl '기준 대사입니다.'","$text='기준 대사입니다.' + $tail","$text='기준 대사입니다.' & points += 1","$text[next()]='기준 대사입니다.'","if flag: $text='기준 대사입니다.'"]){const f=fixture(line);a.throws(()=>choice.prepare(f.doc,f.selection,input),/독립|문자열|대입|출력/);a(core.serialize(f.doc).equals(f.raw));}
 const f=fixture("$text='기준 대사입니다.'");a.throws(()=>choice.prepare(f.doc,{...f.selection,hash:'stale'},input),/변경/);
 for(const condition of ['x = 1: points = 9','x = 1 & points = 9','x = 1\nend',"$name = '열림",'(x = 1'])a.throws(()=>choice.prepare(f.doc,f.selection,{...input,condition}),/조건|괄호|따옴표/);
 for(const code of ['',"gt '열림",'gt \'elsewhere\'\nend','if x:'])a.throws(()=>choice.prepare(f.doc,f.selection,{...input,actionCode:code}),/실행|괄호|따옴표|구문/);
});
test('a marked choice appears only on its selected array page and remains independently navigable',()=>{
 const f=fixture("if event = 1:\r\n $text[1]='기준 대사입니다.'\r\n $text[2]='다음 대사입니다.'\r\nend"),p=choice.prepare(f.doc,f.selection,input),d=core.parse(p.raw),entries=core.entries(d),nav=scenes.buildNavigator(d,entries),s={...entries.find(e=>e.text===f.selection.text),hash:d.hash},ctx=nav.context(s),next=nav.context({...entries.find(e=>e.text==='다음 대사입니다.'),hash:d.hash});a(ctx.branches.some(b=>b.label===input.label));a(!next.branches.some(b=>b.label===input.label));a.equal(nav.open(ctx.branches.find(b=>b.label===input.label).destinations[0],'text').location,'elsewhere');
});
test('scalar composed menu exposes an appended choice as its own part and result branch',()=>{
 const f=fixture("if $args[0]='menu':\r\n $intro='기준 대사입니다.'\r\n $option1='<a href=\"EXEC: pick=1 & gt \'\'elsewhere\'\'\">첫 기존 선택지</a>'\r\n $option2='<a href=\"EXEC: pick=2 & gt \'\'elsewhere\'\'\">둘째 기존 선택지</a>'\r\n $text=$intro+'<br>'+$option1+'<br>'+$option2\r\n exit\r\nend\r\nif $args[0]='result':\r\n if pick=1:\r\n  $text='첫 결과 대사입니다.'\r\n else\r\n  $text='다른 결과 대사입니다.'\r\n end\r\n exit\r\nend"),p=choice.prepare(f.doc,f.selection,input),d=core.parse(p.raw),entries=core.entries(d),ctx=scenes.buildNavigator(d,entries).context({...entries.find(e=>e.text===f.selection.text),hash:d.hash});a.equal(ctx.flow.kind,'pages');a.equal(ctx.flow.stages.find(p=>p.menu).parts.filter(p=>p.choice).length,3);a(ctx.branches.some(b=>b.label===input.label));
});
test('direct scalar result output keeps two appended choices on its result page with distinct destinations',()=>{
 const f=fixture("if $args[0]='menu':\r\n $option1='<a href=\"EXEC: pick=1 & gt $curloc\">첫 기존 선택지</a>'\r\n $option2='<a href=\"EXEC: pick=2 & gt $curloc\">둘째 기존 선택지</a>'\r\n $text=$intro+'<br>'+$option1+'<br>'+$option2\r\n exit\r\nend\r\nif $args[0]='result':\r\n if pick=1:\r\n  $text='기준 대사입니다.'\r\n else\r\n  $text='다른 결과 대사입니다.'\r\n end\r\n exit\r\nend"),p=choice.prepare(f.doc,f.selection,input),d=core.parse(p.raw),s={...core.entries(d).find(e=>e.text===f.selection.text),hash:d.hash},q=choice.prepare(d,s,{...input,label:'되돌아가기',actionCode:"gt 'event', 'menu'"}),after=core.parse(q.raw),entries=core.entries(after),ctx=scenes.buildNavigator(after,entries).context({...entries.find(e=>e.text===f.selection.text),hash:after.hash});a.equal(ctx.flow.kind,'pages');a.equal(ctx.flow.stages.find(p=>p.number===ctx.flow.selected).parts.filter(p=>p.choice).length,2);a.deepEqual(ctx.branches.filter(b=>b.kind==='choice').map(b=>b.destinations[0].location),['elsewhere','event']);
});
module.exports={fixture,input};
