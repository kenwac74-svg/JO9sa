'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('../tools/text-workshop/core.cjs');
const [qsp,game,baseline,modFile]=process.argv.slice(2),raw=fs.readFileSync(qsp),d=c.parse(raw);
assert(c.serialize(d).equals(raw));
const body=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),city=body('interaction_city'),screen=body('interaction_screen_city');
const checks=[];function check(name,f){try{f();checks.push({name,ok:true});}catch(e){checks.push({name,ok:false,error:e.message});}}
check('50-spark group has two independent page paths',()=>{
 const starts=[...city.matchAll(/IF interaction_city = 102025:/g)];assert.equal(starts.length,2);
 for(const s of starts){const end=city.indexOf('\r\n\t $text[1]',s.index),block=city.slice(s.index,end);
  assert(block.includes('service_price = 50'));assert(block.includes('txt_count = 2'));assert(block.includes("$service_picture = ''"));
  for(const n of [1,2])assert(block.includes("$special_image["+n+"] = 'scene\\VIP\\salongroup0"+n+".png'"));
 }
});
check('Saved group scene clears stale background and migrates only VIP3',()=>{
 const start=screen.indexOf('! JO9_SALON_GROUP_PAGES_20261012');assert(start>=0);
 const guard=screen.slice(start,screen.indexOf('\r\nif not_safe = 1:',start));
 assert(guard.includes("if $place = 'erosalon' and interaction_city = 102025:"));assert(guard.includes("$bg_path = ''"));
 for(const n of [1,2])assert(guard.includes("if $special_image["+n+"] = 'scene\\VIP\\VIP3.png': $special_image["+n+"] = 'scene\\VIP\\salongroup0"+n+".png'"));
 assert(start<screen.indexOf('if $special_image_full[txt]'));
});
check('Both group files exist',()=>{for(const n of [1,2]){const b=fs.readFileSync(path.join(game,'content/pic/scene/VIP/salongroup0'+n+'.png'));assert(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));}});
if(baseline&&modFile)check('Exact changes only, including solo-service preservation',()=>{
 const prev=c.parse(fs.readFileSync(baseline)),m=JSON.parse(fs.readFileSync(modFile,'utf8'));assert.equal(prev.hash,m.before_sha256);
 for(const e of m.edits){const l=prev.locations.find(x=>x.name===e.location),old=c.shift(prev.lines[l.body],5);assert.equal(old.split(e.old).length-1,e.count);prev.lines[l.body]=c.shift(old.split(e.old).join(e.new),-5);}
 assert(c.serialize(prev).equals(raw));assert.equal(c.hash(raw),m.after_sha256);
});
console.log(JSON.stringify({checks,sourceOnly:true},null,2));if(checks.some(x=>!x.ok))process.exitCode=1;
