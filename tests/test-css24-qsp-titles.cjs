const fs=require('fs'),assert=require('assert'),c=require('../tools/text-workshop/core.cjs');
const root=process.argv[2]||'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game';
const css=fs.readFileSync(root+'/css/base.css','utf8').replace(/\/\*[\s\S]*?\*\//g,'');
const literals=[...css.matchAll(/\bcontent\s*:\s*(["'])(.*?)\1/g)].filter(m=>m[2].trim());assert.equal(literals.length,0,'CSS must not generate fixed display wording: '+literals.map(m=>m[2]));
const raw=fs.readFileSync(root+'/jack.qsp'),d=c.parse(raw);assert(c.serialize(d).equals(raw));
for(const n of ['main_screen','city_screen','slave_private_room1','slave_private_room2','slave_private_room3','slave_private_room4','snk_room_menu_screen']){const b=c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);assert(b.includes('<span class="jo9_card_title">주인공</span>'),n);if(/^(main|city)_screen$/.test(n)){assert(b.includes('<span class="jo9_card_title">노예</span>'),n);assert(b.includes('<span class="jo9_card_title">조수</span>'),n);}else assert(b.includes('<div id="jo9_slave_card"><span class="jo9_card_title"></span></div>'),n);}
const entries=c.entries(d);for(const word of ['주인공','노예','조수'])assert(entries.some(e=>e.location==='main_screen'&&e.dialogue&&e.text.includes('>'+word+'</span>')),'Editor discoverability '+word);
console.log('PASS: CSS has no fixed wording; QSP owns titles; editor classifies title text; roundtrip preserved');
