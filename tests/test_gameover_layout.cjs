const fs=require('fs'),assert=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const raw=fs.readFileSync(process.argv[2]),d=c.parse(raw);assert(c.serialize(d).equals(raw));const b=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),s=b('exit');
assert(!s.includes('참고 정보:')&&!s.includes('<b>게임 오버</b>'),'Remove duplicate overlay headings');
assert(s.includes('id="jo9_gameover_message"'));assert(s.includes('<<$args[0]>>'),'Keep cause-specific messages');assert(s.includes('left:110px;top:505px;width:460px;'));assert(s.includes("EXEC: gt ''main_menu''"));assert(s.includes('content/pic/bg/game_over.png'));
assert(b('выход_из_боя').includes('불멸의 로마에서, 당신의 이야기는 여기서 끝났다.'));
if(process.argv[3]){const prev=c.parse(fs.readFileSync(process.argv[3]));for(const l of d.locations)if(!['exit','выход_из_боя'].includes(l.name))assert.equal(b(l.name),c.shift(prev.lines[prev.locations.find(x=>x.name===l.name).body],5));}
console.log('PASS: duplicate headings removed, message/menu placement, cause preservation, main-menu action, exact other-location preservation. Source only.');
