'use strict';
// Source-level regression checks. Does not modify QSP or save files.
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const repo=process.argv[3]||path.resolve(__dirname,'..'),c=require(path.join(repo,'tools/text-workshop/core.cjs'));
const file=process.argv[2];a(file,'Usage: node tests/test_kura_patch.cjs GAME/jack.qsp [REPO]');
const raw=fs.readFileSync(file),d=c.parse(raw);a(c.serialize(d).equals(raw));
const body=name=>{const l=d.locations.find(x=>x.name===name);a(l,name);return c.shift(d.lines[l.body],5);};
function block(t,start,end){const s=t.indexOf(start),e=t.indexOf(end,s+start.length);a(s>=0&&e>s);return t.slice(s,e);}
const preset=block(body('#masters_base'),'$sepia_ava_path[13] =','$sepia_ava_path[14] =');
a(preset.includes("$master_base_name[13] = '쿠라'"));a(preset.includes('본명 카일 윈스턴'));a(preset.includes('매우 쉬운 난이도'));
const expected={master_str:5,master_cha:5,master_style:4,master_libido:4,master_tutor:5,master_fighter:5,master_butler:3,master_artdirector:3,master_medic:4,master_mage:3,master_torture:5,master_domination:5,master_bondage:5,master_flagelation:4,master_petting:5,master_oral:5,master_penetration:5,master_fetish:5,sparks:20000};
for(const [name,value] of Object.entries(expected)){const match=preset.match(new RegExp('^'+name+'\\s*=\\s*(\\d+)','m'));a(match,name);a.equal(Number(match[1]),value,name);}
for(const s of ["$master_cloth = 'fancy_suit'","$master_left_wpn = 'катана'","$master_right_wpn = 'безоружный'","$master_leg_wpn = 'кинжал'","faction_fame['serpis'] = 3"]){a(preset.includes(s),s);}
a(body('main_menu').includes("$menu_item_Storyselect, 'gt \"hero_customization_man\"'"));
a(body('init_custom_game').includes('hero_choice = 1 &! Personal patch: custom protagonist is male-only'));
const dyn=body('#dynamic');
const start=block(dyn,'$name_and_start = {','$name_type = {');
a(start.includes("if hero_choice = 13:\r\n\t\t$estate = 'serpis_house'"));a(start.includes("else\r\n\t\t$estate = 'slum_house'"));a(start.includes("gt 'start_game'"));
// Interpret only the actual numeric statements in the two avatar helpers.
// Reject unfamiliar syntax so a changed helper cannot silently bypass checks.
function scroll(t,input){let value=input,active=true,condition=null;
 for(let line of t.split(/\r?\n/).slice(1)){
  line=line.trim();if(!line||line==='}'||line==='gt $curloc')continue;
  if(/^IF /i.test(line)){a.equal(condition,null);const expr=line.slice(3, -1);condition=expr.split(/\s+and\s+/i).every(x=>{const m=x.match(/^hero_choice\s*(<=|<|>)\s*(\d+)$/);a(m,x);const n=Number(m[2]);return m[1]==='<'?value<n:m[1]==='>'?value>n:value<=n;});active=condition;}
  else if(/^else$/i.test(line)){a.notEqual(condition,null);active=!condition;}
  else if(/^END$/i.test(line)){active=true;condition=null;}
  else {const m=line.match(/^hero_choice\s*(\+=|-=|=)\s*(\d+)$/);a(m,line);if(active)value=m[1]==='='?Number(m[2]):m[1]==='+='?value+Number(m[2]):value-Number(m[2]);}
 }return value;
}
const fwd=block(dyn,'$scroll_ava = {','$scroll_ava_back = {'),back=block(dyn,'$scroll_ava_back = {','$name_and_start = {');
for(let n=1;n<=18;n++){a.equal(scroll(fwd,n),n===18?1:n+1);a.equal(scroll(back,n),n===1?18:n-1);}
for(const n of [19,101,124]){a.equal(scroll(fwd,n),1);a.equal(scroll(back,n),18);}
a(body('hero_customization_man').includes('content\\pic\\master\\master_kura_sepia.png'));
a(!preset.includes('SNKmod'));
const portraits=['master_kura.png','master_kura_sepia.png'];
// Candidate QSPs may be outside GAME; use optional KURA_GAME_ROOT for image checks.
const game=process.env.KURA_GAME_ROOT||path.dirname(file);
for(const name of portraits){a(preset.includes('content\\pic\\master\\'+name));const p=path.join(game,'content/pic/master',name);a(fs.existsSync(p),p);a.equal(c.hash(fs.readFileSync(p)),'73323a81cf6d46e4b5b4ff470425dafcd28e47ed2377018c7b38aa14ba20cf78');}
console.log('PASS: Kura preset, start routes, 42 avatar boundary cases, canonical portrait paths and checksums, QSP round trip.');
