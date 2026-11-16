'use strict';
const fs=require('node:fs'),z=require('node:zlib'),a=require('node:assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',D=R+'/records/mercy-salon-patch1-20261115',T='G:/Codex/tmp/mercy-salon-patch1-20261115';
const c=require(R+'/tools/text-workshop/core.cjs'),gate=require(R+'/tools/qa/release-check.cjs');
const baseline=fs.readFileSync(W+'/jack.qsp'),doc=c.parse(baseline),body=n=>c.shift(doc.lines[doc.locations.find(l=>l.name===n).body],5);
a.equal(c.hash(baseline),'60c7addc1238ecfe44249b57125ceb60a1731d0b0f19d83983d8f5e86f2fcb9e','WORK changed since inspection');
const old=body('jo9_mercy_allure');a(old.includes('local jo9_mercy_points2 = 2*jo9_cruel_mercy + jo9_cruel_mercy_half'));
const prior=c.parse(z.gunzipSync(fs.readFileSync(R+'/records/mercy-allure-20261113/jack.before.qsp.gz')));
let calc=c.shift(prior.lines[prior.locations.find(l=>l.name==='$calculate_attributes').body],5);
const lo=calc.indexOf('master_style = 2 + style_modifer'),hi=calc.indexOf('!Calculate Master Supermacy',lo);a(lo>=0&&hi>lo);
const original=calc.slice(lo,hi).trim();
const base=original.replaceAll('master_style','jo9_allure_base').replace(/^jo9_allure_base =/,'local jo9_allure_base =');
const help='[매력 TIPS]<br>&nbsp;매력은 의상·청결·행동력·단장·머리 손질·힘·기분에 따라 달라집니다. 미용실 관리도 반영됩니다.<br>현재 자비 수치에 따라 추가 보정을 받으며, 자비가 줄면 보정도 줄어듭니다. 최종 매력은 F~S 범위입니다.';
const next=[
'! JO9 MOD START MERCY_ALLURE_20261113_HELPER',
'! JO9 MOD START MERCY_SALON_RESTORE_20261115',
"if $args[0] = 'help':"," $result = '"+help+"'",' exit','end',
'local jo9_mercy_points2 = 2*jo9_cruel_mercy + jo9_cruel_mercy_half',
'local jo9_mercy_bonus = 0',
'if jo9_mercy_points2 >= 10: jo9_mercy_bonus = 1',
'if jo9_mercy_points2 >= 30: jo9_mercy_bonus = 2',
'if jo9_mercy_points2 >= 50: jo9_mercy_bonus = 3',
'if jo9_mercy_points2 >= 80: jo9_mercy_bonus = 4',
'if jo9_mercy_points2 >= 120: jo9_mercy_bonus = 5',
base,
'result = max(0, min(5, jo9_allure_base + jo9_mercy_bonus))',
'! JO9 MOD END MERCY_SALON_RESTORE_20261115',
'! JO9 MOD END MERCY_ALLURE_20261113_HELPER',''].join('\r\n');
doc.lines[doc.locations.find(l=>l.name==='jo9_mercy_allure').body]=c.shift(next,-5);
const work=c.serialize(doc),mod={id:'2026-11-15_mercy_salon_restore',status:'APPROVED',approval:'User approved restore of salon/outfit/condition allure with additive current Mercy, rebuild Patch1 only; no full package.',before_sha256:c.hash(baseline),after_sha256:c.hash(work),edits:[{location:'jo9_mercy_allure',field:'body',old,new:next,count:1,patchId:'MERCY_SALON_RESTORE_20261115'}]};
fs.mkdirSync(T+'/mods',{recursive:true});fs.writeFileSync(T+'/mods/'+mod.id+'.json',JSON.stringify(mod,null,2)+'\n');
fs.writeFileSync(T+'/work-before.qsp',baseline);fs.writeFileSync(T+'/work-after.qsp',work);
const gz=D+'/work.before.qsp.gz';if(fs.existsSync(gz))a.equal(c.hash(z.gunzipSync(fs.readFileSync(gz))),c.hash(baseline));else fs.writeFileSync(gz,z.gzipSync(baseline));
const distBefore=fs.readFileSync(T+'/distribution-before.qsp'),distDoc=c.parse(distBefore),loc=distDoc.locations.find(l=>l.name==='jo9_mercy_allure');a.equal(c.shift(distDoc.lines[loc.body],5),old);distDoc.lines[loc.body]=c.shift(next,-5);const dist=c.serialize(distDoc);fs.writeFileSync(T+'/distribution-after.qsp',dist);
const changed=(before,after)=>{const b=c.parse(before),n=c.parse(after);a.equal(b.locations.length,n.locations.length);return b.locations.filter(l=>b.lines[l.body]!==n.lines[n.locations.find(x=>x.name===l.name).body]).map(l=>l.name);};
a.deepEqual(changed(baseline,work),['jo9_mercy_allure']);a.deepEqual(changed(distBefore,dist),['jo9_mercy_allure']);
gate.inspectWorld(work);gate.inspectWorld(dist);gate.validatePatchSet([mod],c.hash(baseline),c.hash(work));
const inverse=c.parse(work);inverse.lines[inverse.locations.find(l=>l.name==='jo9_mercy_allure').body]=c.shift(old,-5);a.equal(Buffer.compare(c.serialize(inverse),baseline),0);
const result={beforeWork:c.hash(baseline),afterWork:c.hash(work),beforeDistribution:c.hash(distBefore),afterDistribution:c.hash(dist),changedLocations:['jo9_mercy_allure'],locations:doc.locations.length,newSaveFields:0,baseFormulaRestoredVerbatim:true,currentMercyBonusThresholds:[5,15,25,40,60],baseAndFinalRange:[0,5],inverseByteMatch:true,syntaxStructureChecked:true};
fs.writeFileSync(D+'/change.json',JSON.stringify(mod,null,2)+'\n');fs.writeFileSync(D+'/prepared.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
