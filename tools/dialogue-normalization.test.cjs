'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {normalize,tokens}=require('./dialogue-normalization.cjs');
test('speaker newline, one indent and ragged physical lines',()=>{
 assert.equal(normalize(' [상인]\r\n\t - 안녕하세요.\r\n\t 좋은 하루입니다. ').text,'[상인]<br>&nbsp;안녕하세요. 좋은 하루입니다.');
});
test('existing breaks and inline formatting remain',()=>{
 assert.equal(normalize('[상인]<BR /> - <b>좋은 물건</b>입니다.<br><br>설명입니다.').text,'[상인]<br>&nbsp;<b>좋은 물건</b>입니다.<br><br>설명입니다.');
});
test('attributes, expressions, negative numbers and middle dash protected',()=>{
 const s='<a href="exec:msg \'너는 - 확인\'">이동</a> <<IIF(x, \'너는\', \'넌\')>> 너는 기다린다. -2 세상에서 - 휴식';
 const result=normalize(s).text;
 assert.equal(result,'<a href="exec:msg \'너는 - 확인\'">이동</a> <<IIF(x, \'너는\', \'넌\')>> 당신은 기다린다. -2 세상에서 - 휴식');
 assert.deepEqual(tokens(result).parts.map(x=>x.raw),tokens(s).parts.map(x=>x.raw));
});
test('independent Korean words only',()=>{assert.equal(normalize('너는 간다. 넌 온다. 건넌 다리, 파트너는 좋다. 넌지시 말했다.').text,'당신은 간다. 당신은 온다. 건넌 다리, 파트너는 좋다. 넌지시 말했다.');});
test('mixed player and NPC speaker scope',()=>{assert.equal(normalize('[당신]<br>- 넌 상인인가?<br>[상인]<br>- 너는 손님이군.').text,'[당신]<br>&nbsp;넌 상인인가?<br>[상인]<br>&nbsp;당신은 손님이군.');});
test('NPC conversation and indirect address stay',()=>{
 assert.equal(normalize('[상인]<br>너는 누구지?<br>[손님]<br>넌 누구인가?').stats.pronouns,0);
 assert.equal(normalize('당신은 조수에게 말한다. 넌 잘하고 있어.').stats.pronouns,0);
 assert.equal(normalize('[경비]<br>넌 기다려.',{keepPronouns:true}).stats.pronouns,0);
});
test('verse and table whitespace stay',()=>{
 const verse='첫 번째 행\r\n\t 두 번째 행';assert.equal(normalize(verse,{preserveLines:true}).text,verse);
 assert.equal(normalize('너는 노래한다.\r\n다음 연',{preserveLines:true}).text,'너는 노래한다.\r\n다음 연');
 const table='<table><tr><td>물건\r\n\t 이름</td></tr></table>';assert.equal(normalize(table).text,table);
});
test('idempotent and opaque malformed data rejected',()=>{
 const s=' [상인]\r\n\t - 너는 기다린다.';const a=normalize(s).text;assert.equal(normalize(a).text,a);
 assert.throws(()=>tokens('<<unfinished'),/Unclosed/);
});
test('attached line dash and inline font dash are removed; negatives stay',()=>{
 assert.equal(normalize('[경비]\r\n -기다리세요.').text,'[경비]<br>&nbsp;기다리세요.');
 assert.equal(normalize('<font color="red">- 다만 기다리세요.</font>').text,'<font color="red">다만 기다리세요.</font>');
 assert.equal(normalize('현재 값은 -2 입니다.').text,'현재 값은 -2 입니다.');
});
test('standalone battle/status labels stay',()=>{
 assert.equal(normalize('[공포]').text,'[공포]');
 assert.equal(normalize('<b>[시야 흐림]</b>').text,'<b>[시야 흐림]</b>');
 assert.equal(normalize('[<<$master_name>>]').text,'[<<$master_name>>]');
});
