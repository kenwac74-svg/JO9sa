'use strict';
const fs=require('node:fs'),path=require('node:path'),core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const root='G:/Codex/tmp/jo9-script-route-20261110',game=path.join(root,'game');
for(const dir of [game,path.join(root,'catalog'),path.join(root,'runtime'),path.join(game,'content/pic')])fs.mkdirSync(dir,{recursive:true});
const body=[
 'if interaction_city = 77:',
 " $text[1] = '[안내]<br>앞부분 첫 대사'",
 " $text[2] = '[안내]<br>시작 이전 대사'",
 " $text[3] = '[안내]<br>여기를 각본의 시작으로 고정합니다.'",
 " $text[4] = '[안내]<br>고르지 않은 기본 경로 A'",
 ' if route_a = 1:',
 "  $text[4] = '[안내]<br>선택한 조건 경로 A를 고정합니다.'",
 ' end',
 " $text[5] = '[안내]<br>고르지 않은 기본 경로 B'",
 ' if route_b = 1:',
 "  $text[5] = '[안내]<br>선택한 조건 경로 B를 고정합니다.'",
 ' end',
 " $text[6] = '[안내]<br>여기를 각본의 마무리로 고정합니다.'",
 " $text[7] = '[안내]<br>마무리 뒤에 있어 제외할 대사'",
 " *p '<a href=\"EXEC: interaction_city=88 & gt ''interaction_city''\">선택한 후속 장면</a><a href=\"EXEC: interaction_city=99 & gt ''interaction_city''\">고르지 않은 장면</a>'",
 'end',
 'if interaction_city = 88:',
 " $text[1] = '[안내]<br>선택한 후속 장면의 첫 대사'",
 " $text[2] = '[안내]<br>후속 장면 마무리'",
 'end',
 'if interaction_city = 99:',
 " $text[1] = '[안내]<br>고르지 않은 후속 장면 대사'",
 'end',
].join('\r\n');
const lines=['QSPGAME','','',core.shift('1',-5),core.shift('interaction_city',-5),'',core.shift(body,-5),core.shift('0',-5),''];
fs.writeFileSync(path.join(game,'jack.qsp'),core.serialize({lines}));
console.log(JSON.stringify({root,game,bytes:fs.statSync(path.join(game,'jack.qsp')).size}));
