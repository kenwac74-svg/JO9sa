const fs=require('fs'),assert=require('assert'),vm=require('vm');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const file=process.argv[2]||'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp';
const raw=fs.readFileSync(file),d=c.parse(raw),loc=d.locations.find(l=>l.name==='jo9_meiki_state');
assert(loc,'Missing persistent state helper');
const source=c.shift(d.lines[loc.body],5);let js='';
for(let line of source.split(/\r?\n/)){
 line=line.trim();if(!line||line.startsWith('!'))continue;
 line=line.replace(/\$args/g,'STRARGS').replace(/\bargs\b/g,'ARGS').replace(/\band\b/gi,'&&').replace(/\bor\b/gi,'||');
 if(/^if /i.test(line)){assert(line.endsWith(':'));js+='if ('+line.slice(3,-1).replace(/\s!\s/g,' !== ').replace(/(?<![<>!=])=(?!=)/g,'===')+') {\n';}
 else if(line==='end')js+='}\n';else if(line==='else')js+='} else {\n';else js+=line+';\n';
}
let checks=0;
for(const role of ['slave','assistant','room1','room2','room3','room4']){
 const make=(age=2)=>{const ctx={STRARGS:[role],ARGS:[role,0],CONST_INT:{young_age:0,milf_age:2},rolls:0};for(const r of ['slave','assistant','room1','room2','room3','room4'])ctx[r]={age,virginity:0,jo9_meiki_initialized:0,jo9_meiki_checked:0,jo9_meiki_prev:0,jo9_meiki_known:0};ctx.rand=()=>{ctx.rolls++;return ctx.roll};return ctx;};
 const run=x=>vm.runInNewContext(js,x);const step=(x,v,allow=0)=>{x[role].virginity=v;x.ARGS[1]=allow;run(x);};
 for(let n=1;n<=100;n++){const x=make();x.roll=n;run(x);step(x,2,1);assert.equal(x[role].jo9_meiki_known||0,n<=5?1:0);assert.equal(x[role].virginity,n<=5?4:2);step(x,3,1);assert.equal(x.rolls,1);checks++;}
 let x=make();x.roll=1;step(x,1);step(x,2,1);assert.equal(x.rolls,0);checks++;
 x=make();x.roll=1;run(x);step(x,2,0);assert.equal(x.rolls,0);step(x,0);step(x,2,1);assert.equal(x.rolls,0);checks++;
 x=make();x[role].virginity=3;run(x);step(x,2,1);assert.equal(x.rolls,0);checks++;
 x=make();x[role].virginity=4;run(x);for(const v of [1,2,3]){step(x,v);assert.equal(x[role].virginity,v===1?1:4);}const cloned=JSON.parse(JSON.stringify(x));cloned.rand=()=>{throw Error('No reroll');};step(cloned,2);assert.equal(cloned[role].virginity,4);checks++;
 x=make(1);run(x);step(x,2,1);assert.equal(x.rolls,0);assert.equal(x[role].virginity,2);checks++;
}
assert(c.serialize(d).equals(raw));
for(const n of ['$newloc','#dynamic','#static_base','sex_end','sjm_UI_UIadds','snk_room_menu_screen']){const l=d.locations.find(l=>l.name===n);assert(c.shift(d.lines[l.body],5).includes('jo9_meiki_state'),n+' integration');}
console.log('PASS '+checks+' state-model cases: 5/100 boundary, once only, no restored/legacy reroll, permanent restoration, minor exclusion; byte roundtrip. Not native execution.');
