'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const input='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',raw=fs.readFileSync(input),doc=c.parse(raw),patch=JSON.parse(fs.readFileSync(__dirname+'/2026-10-28_chaotic_priority.json','utf8'));
assert.equal(c.hash(raw),patch.before_sha256);
const candidate={...doc,lines:doc.lines.slice()},changed=new Set();
for(const e of patch.edits){const l=candidate.locations.find(l=>l.name===e.location),b=c.shift(candidate.lines[l.body],5);assert.equal(b.split(e.old).length-1,1);candidate.lines[l.body]=c.shift(b.replace(e.old,()=>e.new),-5);changed.add(l.body);}
const data=c.serialize(candidate);assert.equal(c.hash(data),patch.after_sha256);assert(c.serialize(c.parse(data)).equals(data));
for(let i=0;i<doc.lines.length;i++)if(!changed.has(i))assert.equal(candidate.lines[i],doc.lines[i]);
for(const e of [...patch.edits].reverse()){const l=candidate.locations.find(l=>l.name===e.location),b=c.shift(candidate.lines[l.body],5);assert.equal(b.split(e.new).length-1,1);candidate.lines[l.body]=c.shift(b.replace(e.new,()=>e.old),-5);}
assert(c.serialize(candidate).equals(raw),'Exact reversal');
const source=n=>{const l=doc.locations.find(l=>l.name===n);return c.shift(doc.lines[l.body],5);};
const helper=patch.edits.find(e=>e.location==='jo9_chaotic').new;
assert(helper.includes("if jo9_chaotic_count = 0:\r\n dynamic $replace({"));
assert.equal((helper.match(/if jo9ceactor\['jo9_learning_trait'\] = -1:/g)||[]).length,1);
assert(!helper.includes("jo9ceactor['jo9_learning_trait'] = 1:"));
assert(helper.includes("jo9ceactor[$args[0]] = iif($args[0] = 'metabolism', 3, 0)"));
const start=source('#variative').indexOf("$indep_atr[0]"),stop=source('#variative').indexOf('indep_atr_min_threshold',start);
assert(!source('#variative').slice(start,stop).includes('metabolism'));
for(const loc of doc.locations){const b=c.shift(doc.lines[loc.body],5);assert(!/\b[a-z_]+_rate\[['"]metabolism['"]\]/i.test(b),'Unexpected metabolism source rate axis');}
assert(source('pharmacy').includes('sparks -= 900')&&source('pharmacy').includes('chaotic_essence += 1'));
const menu=source('menu_form');for(const role of ['slave','assistant'])assert(menu.includes("func('jo9_chaotic', 'count', '"+role+"') > 0"));
const newDescriptions=patch.edits.filter(e=>e.location!=='jo9_chaotic').map(e=>e.new).join('\n');assert(!newDescriptions.includes('부정 특성 중 무작위 1개'));
for(const e of patch.edits){assert.equal((e.new.match(/! JO9 MOD START CHAOTIC_PRIORITY_20261028/g)||[]).length,1);assert.equal((e.new.match(/! JO9 MOD END CHAOTIC_PRIORITY_20261028/g)||[]).length,1);}
assert(fs.readFileSync(input).equals(raw));
const result={status:'STATIC_REPLAY_REVERSAL_SCOPE_PASS',baselineHash:doc.hash,candidateHash:patch.after_sha256,edits:patch.edits.length,changedLocations:[...new Set(patch.edits.map(e=>e.location))],locationCount:doc.locations.length,newLocations:0,newPersistentKeys:0,roundtrip:true,exactReverse:true,otherFieldsUnchanged:true,metabolismNeutral3NoSeparateRateAxis:true,stockAndPriceUnchanged:true,availabilityUsesSameCountHelper:true,geniusExcluded:true,workUnchanged:true};
fs.writeFileSync(__dirname+'/static-results.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
