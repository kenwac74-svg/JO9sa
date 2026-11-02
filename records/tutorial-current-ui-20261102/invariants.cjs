'use strict';
const fs=require('fs'),zlib=require('zlib'),assert=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const O=__dirname,p=JSON.parse(fs.readFileSync(O+'/prepared.json')),a=c.parse(fs.readFileSync(p.baseline)),b=c.parse(fs.readFileSync(p.candidate));
const body=(d,n)=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),report={candidateSha256:p.after,checks:[],pass:false};
assert.equal(a.locations.length,b.locations.length);assert.deepEqual(a.locations.map(x=>x.name),b.locations.map(x=>x.name));
for(const n of p.changedLocations){const old=body(a,n),next=body(b,n),oldLinks=old.match(/href\s*=[^>]+>/g)||[],newLinks=next.match(/href\s*=[^>]+>/g)||[];assert.deepEqual(newLinks,oldLinks,n+' original callbacks and link order');report.checks.push({location:n,kind:'original-callbacks-and-order',count:oldLinks.length,pass:true});}
for(const n of ['demo_intro','choose_the_girl']){const pick=s=>s.split('\r\n').filter(x=>/^\s*\$text\[/.test(x));assert.deepEqual(pick(body(a,n)),pick(body(b,n)));report.checks.push({location:n,kind:'original-story-text-assignments',count:pick(body(a,n)).length,pass:true});}
const originalCss=zlib.gunzipSync(fs.readFileSync(O+'/../css/before-base.css.gz')),candidateCss=fs.readFileSync(O+'/../css/candidate-base.css');assert(candidateCss.subarray(0,originalCss.length).equals(originalCss));report.checks.push({kind:'original-css-byte-prefix',bytes:originalCss.length,pass:true});
const newCss=candidateCss.subarray(originalCss.length).toString('utf8');assert(!/content\s*:|\bdisplay\s*:\s*none[^}]*#under/i.test(newCss));report.cssSha256=c.hash(candidateCss);report.pass=true;fs.writeFileSync(O+'/invariant-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
