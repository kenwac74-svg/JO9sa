const fs=require('fs'),assert=require('node:assert/strict'),c=require('../tools/text-workshop/core.cjs');
const input=process.argv[2];
assert(input,'Pass the current game QSP path as the first argument.');
const raw=fs.readFileSync(input),d=c.parse(raw);assert(c.serialize(d).equals(raw));
const names=['warning','main_menu','controls','credits','development','hero_creation','hero_customization','hero_customization_woman','hero_customization_man','hero_description','exit'];
const bodies=Object.fromEntries(d.locations.map(l=>[l.name,c.shift(d.lines[l.body],5)]));
for(const name of names){const b=bodies[name];assert(b.includes('id="jo9_startup_no_outer_frame"'),`${name}: gameplay border is not suppressed`);assert(b.includes('body:before,body:after{display:none!important;}'));assert.equal((b.match(/jo9_startup_no_outer_frame/g)||[]).length,1);if(name==='exit')assert(b.indexOf('jo9_startup_no_outer_frame')>b.indexOf('*clr'));}
for(const name of ['main_screen','city_screen','menu_form','choice_screen','slave_private_room1','assistant_private_room'])assert(!bodies[name].includes('jo9_startup_no_outer_frame'),`${name}: gameplay frame must remain`);
console.log(`PASS: ${names.length} startup/fullscreen locations suppress frame; 6 gameplay locations retain it; QSP roundtrip`);
