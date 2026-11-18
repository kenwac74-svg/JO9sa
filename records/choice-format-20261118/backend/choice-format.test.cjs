'use strict';
require('./loader.cjs');
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const fpath=path.join(__dirname,'choice-format.cjs'),format=fs.existsSync(fpath)?require(fpath):{};
function fixture(body){const rows=['QSPGAME','neutral choice formatting fixture','',core.shift('2',-5),core.shift('event',-5),'',core.shift(body,-5),core.shift('0',-5),core.shift('result',-5),'',core.shift("$text='다른 장면입니다.'",-5),core.shift('0',-5),''];const raw=Buffer.from(rows.join('\r\n'),'utf16le'),doc=core.parse(raw),entries=core.entries(doc);return{raw,doc,entries,select:needle=>({...entries.find(e=>e.text.includes(needle)),hash:doc.hash})};}
const quoted=text=>"'"+text.replaceAll("'","''")+"'";
const anchor=(label,code="pick=1 & gt 'result'",attrs='')=>'<a '+attrs+'href="EXEC: '+code+'">'+label+'</a>';
test('formats only selected existing anchor; exact href, interpolation, CRLF and other fields survive with minimal replay',()=>{
 a.equal(typeof format.prepare,'function');
 const html='원래\r\n문단<br>'+anchor('<i>첫 <<$name>></i>',"if pick > 0: pick=1 & gt 'result'",'class="old" data-jo9-choice="keep" ')+'<br><br>'+anchor('두 번째',"pick=2 & gt 'result'");
 const f=fixture('$text[1] = '+quoted(html)),s=f.select('원래'),p=format.prepare(f.doc,s,{anchorIndex:0,style:{fontFamily:'경기천년제목 Medium',fontSize:'25',letterSpacing:'1.5',lineHeight:'1.4',paragraphGap:'12',color:'#12ABEF'}}),d=core.parse(p.raw),e=core.entries(d).find(x=>x.start===s.start&&x.fieldIndex===s.fieldIndex);
 a.equal(p.operation,'choice-format');a.ok(e.text.startsWith('원래\r\n문단<br>'));a.ok(e.text.endsWith('<br><br>'+anchor('두 번째',"pick=2 & gt 'result'")));a.ok(e.text.includes('href="EXEC: if pick > 0: pick=1 & gt \'result\'"'));a.ok(e.text.includes('<i>첫 <<$name>></i>'));a.ok(e.text.includes('data-jo9-choice="keep"'));a.match(e.text,/font-size:25px/);a.match(e.text,/margin-bottom:12px/);a.equal(p.oldField.replace(p.piece.old,p.piece.new),p.newField);a.equal(p.newField.replace(p.piece.new,p.piece.old),p.oldField);d.lines.forEach((v,i)=>{if(i!==s.fieldIndex)a.equal(v,f.doc.lines[i]);});a.ok(core.serialize(d).equals(p.raw));
});
test('style updates retain author CSS declarations and remove only managed properties on reset',()=>{
 const html=anchor('꾸민 선택지',undefined,'style="background:url(&quot;x;y&quot;);border:1px solid red;font-size:18px;color:#abc;display:flex" '),f=fixture('$text='+quoted(html)),s=f.select('꾸민'),p=format.prepare(f.doc,s,{anchorIndex:0,style:{fontSize:'',color:'',paragraphGap:'10'}}),e=core.entries(core.parse(p.raw)).find(e=>e.location==='event');
 a.ok(e.text.includes('background:url(&quot;x;y&quot;);border:1px solid red;'));a.ok(e.text.includes('display:flex'));a.ok(!e.text.includes('font-size:'));a.ok(!e.text.includes('color:'));a.match(e.text,/margin-bottom:10px/);a.ok(!e.text.includes('display:inline-block'));
 const d=core.parse(p.raw),q=format.prepare(d,{...e,hash:d.hash},{anchorIndex:0,style:{paragraphGap:''}});a.ok(!q.replacement.includes('margin-bottom:'));a.ok(q.replacement.includes('display:flex'));
});
test('owned layout for extra option gap is reversible without removing an author display value',()=>{
 const f=fixture('$text='+quoted(anchor('간격 선택지'))),s=f.select('간격'),p=format.prepare(f.doc,s,{anchorIndex:0,style:{paragraphGap:14}}),d=core.parse(p.raw),e=core.entries(d).find(e=>e.location==='event');a.match(e.text,/display:inline-block/);
 const q=format.prepare(d,{...e,hash:d.hash},{anchorIndex:0,style:{paragraphGap:''}});a.equal(q.replacement,s.text);
});
test('unquoted style attributes become quoted without damaging source attributes or existing units',()=>{
 const html=anchor('기존 단위 선택지',undefined,'class=old style=font-size:1.2em;line-height:normal;color:blue '),f=fixture('$text='+quoted(html)),p=format.prepare(f.doc,f.select('기존 단위'),{anchorIndex:0,style:{fontFamily:'"Segoe Print", sans-serif',color:'#123456'}}),found=format.anchors(p.replacement)[0],attrs=found.attributes;
 a.equal(attrs.find(a=>a.name==='class').value,'old');a.equal(attrs.find(a=>a.name==='style').quote,'"');a.ok(attrs.find(a=>a.name==='style').value.includes('font-size:1.2em;line-height:normal;'));a.ok(p.replacement.includes('font-family:&quot;Segoe Print&quot;, sans-serif;'));a.equal(found.code,format.anchors(html)[0].code);a.equal(format.readStyle(p.replacement,found).fontFamily,'"Segoe Print", sans-serif');
});
test('CSS source offsets preserve nonBMP characters and unknown declarations exactly',()=>{
 for(const emoji of ['😀','&#128512;']){const unknown="--label:'"+emoji+"';border:2px solid red;",html=anchor('이모지 서식 선택지',undefined,'style="'+unknown+'color:#abc" '),f=fixture('$text='+quoted(html)),p=format.prepare(f.doc,f.select('이모지 서식'),{anchorIndex:0,style:{color:'#123456'}});
 a.equal(format.anchors(p.replacement)[0].attributes.find(a=>a.name==='style').value,unknown+'color:#123456;');a.equal(format.readStyle(p.replacement,format.anchors(p.replacement)[0]).color,'#123456');}
});
test('scanner handles quoted greater-than, both quote types, expression tags and duplicate labels',()=>{
 a.equal(typeof format.anchors,'function');
 const raw='<<if(x>0,"<a href=\'EXEC:fake\'>fake</a>","")>>'+anchor('같은 문구',"if pick > 1: gt 'result'",'title="a > b" ')+"<a href='EXEC: gt &quot;result&quot;'>같은 문구</a>";
 const found=format.anchors(raw);a.equal(found.length,2);a.equal(found[0].label,'같은 문구');a.equal(found[1].label,'같은 문구');a.ok(raw.slice(found[0].start,found[0].end).includes('title="a > b"'));
});
test('options uses selected array page, includes appended source choices and omits other pages',()=>{
 const f=fixture('if event=1:\r\n $text[1]=\'기준 대사입니다.\'\r\n $text[1] += '+quoted('<br><br>'+anchor('현재 선택지',undefined,'data-jo9-choice="one" '))+'\r\n $text[2]=\'다음 대사입니다.\'\r\n $text[2] += '+quoted('<br>'+anchor('다른 페이지',undefined,'data-jo9-choice="two" '))+'\r\nend'),o=format.options(f.doc,f.select('기준 대사'));
 a.deepEqual(o.choices.map(c=>c.label),['현재 선택지']);a.equal(o.choices[0].selection.hash,f.doc.hash);a.equal(o.choices[0].sourceLine,3);a.equal(o.choices[0].anchorIndex,0);a.deepEqual(format.options(f.doc,f.select('현재 선택지')).choices.map(c=>c.label),['현재 선택지']);
});
test('scalar composed menus include conditional alternatives on current page',()=>{
 const body="if $args[0]='menu':\r\n $intro='기준 대사입니다.'\r\n $one="+quoted(anchor('첫 선택지'))+"\r\n $two="+quoted(anchor('둘째 선택지'))+"\r\n if rich=1:\r\n $two="+quoted(anchor('조건별 선택지'))+"\r\n end\r\n $text=$intro+'<br>'+$one+'<br>'+$two\r\n exit\r\nend\r\nif $args[0]='result':\r\n $text='결과 본문입니다.'\r\n exit\r\nend",f=fixture(body),o=format.options(f.doc,f.select('기준 대사'));
 a.deepEqual(o.choices.map(c=>c.label).sort(),['첫 선택지','둘째 선택지','조건별 선택지'].sort());
});
test('explicit named-array usage selects only that usage scene in a shared location',()=>{
 const defs=[['library',"$shared[1]='공유 기준 대사입니다.'"],['event',"if event=1:\r\n copyarr '$text', '$shared'\r\n $shared[1] += "+quoted(anchor('첫 사용처 선택지',undefined,'data-jo9-choice="usage-one" '))+"\r\nend\r\nif event=2:\r\n copyarr '$text', '$shared'\r\n $shared[1] += "+quoted(anchor('둘째 사용처 선택지',undefined,'data-jo9-choice="usage-two" '))+"\r\nend"]],rows=['QSPGAME','shared array fixture','',core.shift(String(defs.length),-5)];for(const [name,body]of defs)rows.push(core.shift(name,-5),'',core.shift(body,-5),core.shift('0',-5));rows.push('');const doc=core.parse(Buffer.from(rows.join('\r\n'),'utf16le')),entries=core.entries(doc),selection={...entries.find(e=>e.text==='공유 기준 대사입니다.'),hash:doc.hash},nav=require('G:/somi/JO9sa/tools/text-workshop/scenes.cjs').buildNavigator(doc,entries),ctx=nav.context(selection),second=ctx.flow.usages.find(u=>u.title==='event=2');a.ok(second);
 const options=format.options(doc,selection,nav,{sceneId:ctx.scene.id,usageId:second.id});a.deepEqual(options.choices.map(c=>c.label),['둘째 사용처 선택지']);
});
test('stale selections, invalid anchors and CSS injection are rejected without changing the document',()=>{
 const f=fixture('$text='+quoted(anchor('선택지'))),s=f.select('선택지');
 a.throws(()=>format.prepare(f.doc,{...s,hash:'stale'},{anchorIndex:0,style:{fontSize:20}}),/변경/);a.throws(()=>format.options(f.doc,{...s,text:'바뀜'}),/원문|위치/);
 for(const style of [{fontSize:0},{lineHeight:99},{letterSpacing:Infinity},{paragraphGap:-121},{fontFamily:'a; color:red'},{color:'red;background:blue'},{fontSize:'20px'},{fontSize:20,unknown:'x'}])a.throws(()=>format.prepare(f.doc,s,{anchorIndex:0,style}),/서식|글꼴|크기|간격|색|지원/);
 a.throws(()=>format.prepare(f.doc,s,{anchorIndex:3,style:{fontSize:20}}),/선택지/);a.ok(core.serialize(f.doc).equals(f.raw));
});
module.exports={fixture,anchor,quoted};
