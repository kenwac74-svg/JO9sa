'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),core=require('../text-workshop/core.cjs');
const policy=require('./policy.json');
const beforeHash='236ec1611f5c5dcc0000e86198782afcc3d076eeda5f4cc5f3ac3c5ebbe3f043';
function build(raw){
 assert.equal(core.hash(raw),beforeHash,'Expected backed-up source');
 const d=core.parse(raw);assert(core.serialize(d).equals(raw));
 const loc=d.locations.find(l=>l.name==='jo9_chaotic'),old=core.shift(d.lines[loc.body],5);
 const primaryStart=old.indexOf('dynamic $replace({\r\n'),primaryEnd=old.indexOf("}, 'jo9ceactor', $jo9_chaotic_role)",primaryStart);
 const fallbackStart=old.indexOf(' dynamic $replace({\r\n',primaryEnd),fallbackEnd=old.indexOf(" }, 'jo9ceactor', $jo9_chaotic_role)",fallbackStart);
 assert(primaryStart>0&&primaryEnd>primaryStart&&fallbackStart>primaryEnd&&fallbackEnd>fallbackStart);
 const sections=(s,indent)=>[...s.matchAll(new RegExp('^'+indent+'if [^\\r\\n]*:\\r\\n[\\s\\S]*?^'+indent+'end\\r\\n','gm'))].map(m=>m[0]);
 const pText=old.slice(primaryStart+'dynamic $replace({\r\n'.length,primaryEnd),fText=old.slice(fallbackStart+' dynamic $replace({\r\n'.length,fallbackEnd);
 const primary=sections(pText,' '),fallback=sections(fText,'  ');
 assert.equal(primary.join(''),pText,'All primary blocks parsed');assert.equal(fallback.join(''),fText,'All fallback blocks parsed');
 const key=b=>b.match(/\$jo9_chaotic_keys\[jo9_chaotic_count\] = '([^']+)'/)[1];
 const get=(blocks,k)=>{const a=blocks.filter(b=>key(b)===k);assert.equal(a.length,1,k);return a[0];};
 const attention=get(primary,'jo9_attention'),deprivation=get(primary,'deprivation_attitude'),frigidity=get(primary,'nymphomania'),activity=get(primary,'jo9_activity');
 const split=' elseif ';assert(activity.includes(split));
 const activityOnly=activity.slice(0,activity.indexOf(split))+' end\r\n';
 const legacyActivity=' if '+activity.slice(activity.indexOf(split)+split.length);
 assert(legacyActivity.includes("activity_compatible', 'jo9ceactor') = 0"));
 const moved=new Set(['jo9_attention','deprivation_attitude','jo9_voice_trait','jo9_activity','nymphomania',...policy.physicalProtection]);
 const nextPrimary=[];for(const b of primary){if(key(b)==='jo9_activity')nextPrimary.push(legacyActivity);else if(!moved.has(key(b)))nextPrimary.push(b);}
 const homophobia=get(fallback,'homosexualism').replace("if jo9ceactor['homosexualism'] = -1 or jo9ceactor['homosexualism'] = 2:","if jo9ceactor['homosexualism'] = -1:").split('\r\n').filter(line=>!line.includes("if jo9ceactor['homosexualism'] = 2:")).map(line=>line.startsWith(' ')?line.slice(1):line).join('\r\n');
 nextPrimary.push(homophobia);
 const nextFallback=[attention,activityOnly,deprivation,frigidity].map(b=>b.split('\r\n').map(line=>line?' '+line:line).join('\r\n'));
 for(let b of fallback){
  const k=key(b);if(k==='metabolism'||k==='nymphomania')continue;
  if(k==='perversion')b=b.replace(" = -1 or jo9ceactor['perversion'] = 2:"," = -1:").split('\r\n').filter(l=>!l.includes("if jo9ceactor['perversion'] = 2:")).join('\r\n');
  if(k==='homosexualism')b=b.replace(" = -1 or jo9ceactor['homosexualism'] = 2:"," = 2:").split('\r\n').filter(l=>!l.includes("if jo9ceactor['homosexualism'] = -1:")).join('\r\n');
  if(k==='courage')b=b.replace(" = -1 or jo9ceactor['courage'] = 1 or jo9ceactor['courage'] = 2:"," = -1 or jo9ceactor['courage'] = 2:").split('\r\n').filter(l=>!l.includes("if jo9ceactor['courage'] = 1:")).join('\r\n');
  if(k==='compassion')b=b.replace(" = -1 or jo9ceactor['compassion'] = 1:"," = 1:").split('\r\n').filter(l=>!l.includes("if jo9ceactor['compassion'] = -1:")).join('\r\n');
  nextFallback.push(b);
 }
 const eligibilityBody=old.slice(0,primaryStart+'dynamic $replace({\r\n'.length)+nextPrimary.join('')+old.slice(primaryEnd,fallbackStart+' dynamic $replace({\r\n'.length)+nextFallback.join('')+old.slice(fallbackEnd);
 const tail="if $jo9_chaotic_mode = 'count':";assert.equal(eligibilityBody.slice(eligibilityBody.indexOf(tail)),old.slice(old.indexOf(tail)),'Selection, removal, cleanup and consumption unchanged');
 const body='! JO9 MOD START CHAOTIC_APPROVED_POLICY_20261103\r\n! Eligibility only: protect approved traits; negatives first, approved mixed traits only if no negatives.\r\n'+eligibilityBody+'\r\n! JO9 MOD END CHAOTIC_APPROVED_POLICY_20261103\r\n';
 d.lines[loc.body]=core.shift(body,-5);const candidate=core.serialize(d),parsed=core.parse(candidate);assert(core.serialize(parsed).equals(candidate));
 const original=core.parse(raw);for(let i=0;i<d.lines.length;i++)if(i!==loc.body)assert.equal(d.lines[i],original.lines[i],'Unrelated QSP field '+i);
 const patch={id:'2026-11-03_chaotic_approved_policy',description:'User-approved chaotic essence priority, mixed fallback, protected traits and metabolism exception. Only jo9_chaotic eligibility changed.',before_sha256:beforeHash,after_sha256:core.hash(candidate),edits:[{location:'jo9_chaotic',field:'body',old,new:body,count:1}]};
 const report={beforeSha256:beforeHash,afterSha256:patch.after_sha256,changedLocations:['jo9_chaotic'],locations:parsed.locations.length,physicalProtection:policy.physicalProtection,physicalPending:policy.physicalPending,removalTailPreserved:true,unrelatedFieldsPreserved:true,roundtrip:true,primaryKeys:nextPrimary.map(key),fallbackKeys:nextFallback.map(key)};
 return {raw:candidate,patch,report,body};
}
if(require.main===module){const[input,out]=process.argv.slice(2);assert(input&&out);const r=build(fs.readFileSync(input));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'jack.qsp'),r.raw);fs.writeFileSync(path.join(out,'patch.json'),JSON.stringify(r.patch,null,2));fs.writeFileSync(path.join(out,'build.json'),JSON.stringify(r.report,null,2));fs.writeFileSync(path.join(out,'jo9_chaotic.qsps'),r.body);console.log(JSON.stringify(r.report));}
module.exports={build};
