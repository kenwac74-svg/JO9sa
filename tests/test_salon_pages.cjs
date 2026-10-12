'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('../tools/text-workshop/core.cjs');
const [qsp,game,baseline,modFile]=process.argv.slice(2);
const raw=fs.readFileSync(qsp),doc=core.parse(raw);
assert(core.serialize(doc).equals(raw));
const body=n=>core.shift(doc.lines[doc.locations.find(l=>l.name===n).body],5);
const city=body('interaction_city'),screen=body('interaction_screen_city');
const checks=[];
function check(name,fn){try{fn();checks.push({name,ok:true});}catch(e){checks.push({name,ok:false,error:e.message});}}
const pictures=['scene\\VIP\\salononeg01.png','scene\\VIP\\salononeg02.png'];
check('Two independent images in both 20-spark branches',()=>{
 const starts=[...city.matchAll(/IF interaction_city = 102024:/g)];assert.equal(starts.length,2);
 for(const s of starts){
  const end=city.indexOf('\r\n\tEND',city.indexOf('\r\n\t $text[2]',s.index));
  const block=city.slice(s.index,end);assert(block.includes('service_price = 20'));assert(block.includes("$service_picture = ''"));
  pictures.forEach((p,i)=>assert(block.includes("$special_image["+(i+1)+"] = '"+p+"'")));
  assert(block.includes('txt_count = 2'));
 }
 assert.notEqual(pictures[0],pictures[1]);
});
check('Old saved salon frame cannot override page art',()=>{
 const start=screen.indexOf('! JO9_SALON_SINGLE_PAGES_20261012');
 assert(start>=0,'Legacy saved scene needs a scoped render-time guard');
 const end=screen.indexOf('\r\nif not_safe = 1:',start);assert(end>start);
 const guard=screen.slice(start,end);
 assert(guard.includes("if $place = 'erosalon' and interaction_city = 102024:"));
 assert(guard.includes("$bg_path = ''"));assert(guard.includes("$service_picture = ''"));
 pictures.forEach((p,i)=>assert(guard.includes("if $special_image["+(i+1)+"] = 'scene\\VIP\\VIP3.png': $special_image["+(i+1)+"] = '"+p+"'")));
 // The page renderer still draws the current page and only a nonempty background override.
 assert(screen.includes('<<$special_image[txt]>>'));assert(screen.includes("if $bg_path ! '':"));
 assert(start<screen.indexOf('if $special_image_full[txt]'));
});
check('Image targets exist',()=>pictures.forEach(p=>{
 const b=fs.readFileSync(path.join(game,'content','pic',...p.split('\\')));
 assert(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
 assert(b.readUInt32BE(16)>0&&b.readUInt32BE(20)>0);
}));
check('50-spark group service has its configured page paths',()=>{
 const starts=[...city.matchAll(/IF interaction_city = 102025:/g)];assert.equal(starts.length,2);
 for(const s of starts){const block=city.slice(s.index,city.indexOf('\r\n\t $text[1]',s.index));assert(block.includes('service_price = 50'));const split=block.includes('salongroup01.png');for(const i of [1,2])assert(block.includes("$special_image["+i+"] = 'scene\\VIP\\"+(split?'salongroup0'+i:'VIP3')+".png'"));}
});
if(baseline&&modFile)check('Exact QSP change scope',()=>{
 const prev=core.parse(fs.readFileSync(baseline)),mod=JSON.parse(fs.readFileSync(modFile,'utf8'));
 assert.equal(prev.hash,mod.before_sha256);
 for(const e of mod.edits){const l=prev.locations.find(x=>x.name===e.location),old=core.shift(prev.lines[l.body],5);assert.equal(old.split(e.old).length-1,e.count);prev.lines[l.body]=core.shift(old.split(e.old).join(e.new),-5);}
 assert(core.serialize(prev).equals(raw));assert.equal(core.hash(raw),mod.after_sha256);
});
console.log(JSON.stringify({checks,sourceOnly:true},null,2));if(checks.some(c=>!c.ok))process.exitCode=1;
