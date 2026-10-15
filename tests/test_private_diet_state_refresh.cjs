const fs=require('fs'),assert=require('assert'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const d=c.parse(fs.readFileSync(process.argv[2])),body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
const refresh=body('snk_room_diet_migrate').split('! Refresh cached diet help on existing saves.')[1].split('if room1_ration = -1:')[0];assert(refresh);
// QSP keeps numeric and string values in the same variable. COPYARR clones both.
function runRefresh(slots){for(const line of refresh.split('\r\n').map(s=>s.trim()).filter(s=>s&&!s.startsWith('!'))){
 let m=line.match(/^\$room(\d)_ration\[(\d+)\] = '(.*)'$/);if(m){slots[+m[1]].strings[+m[2]]=m[3];continue;}
 m=line.match(/^copyarr '\$room(\d)_ration', '\$room(\d)_ration'$/i);if(m){slots[+m[1]]=JSON.parse(JSON.stringify(slots[+m[2]]));continue;}
 m=line.match(/^\$room(\d)_ration\[(\d+)\] = \$room(\d)_ration\[(\d+)\]$/);if(m){slots[+m[1]].strings[+m[2]]=slots[+m[3]].strings[+m[4]];continue;}
 throw Error('Unmodelled refresh statement: '+line);
}}
for(let room=1;room<=4;room++)for(const selected of [0,1,2]){
 const slots={};for(let n=1;n<=4;n++)slots[n]={number:1,strings:{}};slots[room].number=selected;const expected=Object.values(slots).map(s=>s.number);
 for(let entry=0;entry<3;entry++){runRefresh(slots);assert.deepEqual(Object.values(slots).map(s=>s.number),expected,`room ${room} diet ${selected}: opening/reopening a view must preserve independent numeric selections`);}
 for(let n=1;n<=4;n++)assert.equal(slots[n].strings[4],slots[1].strings[4]);
}
for(let room=1;room<=4;room++){const b=body('slave_private_room'+room),style=b.match(/<style id="jo9_private_diet_style">.*?<\/style>/)[0];assert(style.includes('경기천년제목 Medium'));assert(!b.includes('<span class="jo9_diet_description">'),'Detailed prose belongs below the scene, not in the compact popup');}
console.log('PASS: 12 independent diet selections survive 3 repeated help refreshes; descriptions propagate without copying numeric state; compact theme-font popup');
