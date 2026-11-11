import assert from 'node:assert/strict';
import {defaultConfig,defaultCharacter,estimate,freshState,validateState,clone} from './dist/engine.mjs';

let checks=0;
const eq=(actual,expected)=>{assert.deepEqual(actual,expected);checks++;};
const cfg=defaultConfig(),c=defaultCharacter();
eq(cfg.backgroundModifiers,{world:{},family:{},occupation:{}});
const {BACKGROUND_KINDS,RANGE_KEYS,PAST_RANGE_KEYS,getModifier,resolveBackgroundModifiers,validateBackgroundModifiers}=await import('./dist/background-modifiers.mjs');
eq(BACKGROUND_KINDS,['world','family','occupation']);
eq(RANGE_KEYS,['pregnancies','abortions','births','children']);
eq(PAST_RANGE_KEYS,['pregnancies','births']);
const emptyRanges=Object.fromEntries(RANGE_KEYS.map(key=>[key,null]));
eq(getModifier(cfg,'world','absent'),{intimacy:1,combat:1,ranges:emptyRanges});
eq(getModifier(cfg,'world','constructor'),{intimacy:1,combat:1,ranges:emptyRanges});
eq(resolveBackgroundModifiers(cfg,null),{active:false,parts:[],factors:{intimacy:1,combat:1},ranges:emptyRanges});
cfg.rules.variation=0;c.scale=1;c.skills.combat=3;
c.storySelection={world:'earth',variant:'one',family:'noble',occupation:'scholar'};
cfg.backgroundModifiers={world:{earth:{intimacy:2,combat:3,ranges:{pregnancies:{min:4,max:5},births:{min:2,max:3},children:{min:7,max:7}}}},family:{noble:{intimacy:3,combat:2,ranges:{pregnancies:{min:2,max:3},births:{min:0,max:0}}}},occupation:{scholar:{intimacy:4,combat:.5,ranges:{pregnancies:{min:0,max:1},abortions:{min:1,max:1}}}}};
validateBackgroundModifiers(cfg);
const independent=getModifier(cfg,'world','earth');independent.intimacy=19;independent.ranges.children.min=99;
eq(getModifier(cfg,'world','earth').intimacy,2);eq(getModifier(cfg,'world','earth').ranges.children,{min:7,max:7});
const resolution=resolveBackgroundModifiers(cfg,c.storySelection);
eq(resolution.active,true);eq(resolution.factors,{intimacy:24,combat:3});
eq(resolution.parts.map(part=>[part.kind,part.id]),[['world','earth'],['family','noble'],['occupation','scholar']]);
eq(resolution.ranges.pregnancies,{min:0,max:1,kind:'occupation',id:'scholar'});
eq(resolution.ranges.births,{min:0,max:0,kind:'family',id:'noble'});
eq(resolution.ranges.children,{min:7,max:7,kind:'world',id:'earth'});
const result=estimate(c,cfg);
const base=cfg.gradeBases.intimacy[c.skills.petting]*.2+cfg.gradeBases.intimacy[c.skills.oral]*.4+cfg.gradeBases.intimacy[c.skills.penetration]*.4;
eq(result.rows.intimacy.value,Math.round(base*24));
eq(result.rows.wins,undefined);eq(result.owner.combatTotals.wins.value,0);
eq(result.rows.intimacy.trace.job,1);eq(result.rows.intimacy.trace.background,24);
eq(result.rows.intimacy.trace.backgroundParts,resolution.parts);
eq(result.backgroundModifiers,resolution);
const coarseChanged=clone(cfg);for(const list of [coarseChanged.jobs,coarseChanged.backgrounds])for(const item of list)item.scales={intimacy:20,combat:20};
eq(estimate(c,coarseChanged).rows.intimacy.value,result.rows.intimacy.value);
eq(estimate(c,coarseChanged).owner.combatGroups,result.owner.combatGroups);
const variant=clone(c);variant.storySelection.variant='two';
eq(estimate(variant,cfg).backgroundModifiers.factors,resolution.factors);
eq(estimate(variant,cfg).rows.intimacy.value,result.rows.intimacy.value);
eq(estimate(variant,cfg).rows.pregnancies.trace.rangeSeed,result.rows.pregnancies.trace.rangeSeed);
eq(estimate(variant,cfg).rows.pregnancies.auto,result.rows.pregnancies.auto);
eq(result.rows.births.value,0);eq(result.rows.births.source,'estimate');
eq(result.rows.children,undefined);eq(result.rows.abortions,undefined);
for(const key of RANGE_KEYS)eq(result.owner[key],{value:0,source:'record'});
eq(result.rows.pregnancies.source,'estimate');
eq(estimate(c,cfg),estimate(c,cfg));
const outcomes=new Set();for(let seed=0;seed<100;seed++){const sample=clone(c);sample.seed=String(seed);outcomes.add(estimate(sample,cfg).rows.pregnancies.auto);}
eq([...outcomes].sort(),[0,1]);
const unselected=clone(c);unselected.storySelection={world:'earth',family:'noble'};
eq(estimate(unselected,cfg).backgroundModifiers.active,false);
eq(estimate(unselected,cfg).rows.births.source,'unknown');eq(estimate(unselected,cfg).rows.children,undefined);
const unselectedBase=estimate({...clone(c),storySelection:null},cfg);
eq(estimate(unselected,cfg).rows.intimacy.value,unselectedBase.rows.intimacy.value);
for(const mode of ['manual','record','fixed_estimate']){const explicit=clone(c);explicit.overrides={pregnancies:{mode,value:99},children:{mode,value:0},intimacy:{mode,value:17}};const out=estimate(explicit,cfg);eq(out.rows.pregnancies.value,99);eq(out.rows.pregnancies.source,mode);eq(out.rows.children,undefined);eq(out.owner.children,{value:0,source:'record'});eq(out.rows.intimacy.value,17);assert([0,1].includes(out.rows.pregnancies.auto));checks++;}
const injected=clone(c);injected.flags.clone=true;const injectedResult=estimate(injected,cfg);
eq(injectedResult.rows.intimacy.value,0);eq(injectedResult.rows.wins,undefined);eq(injectedResult.rows.children,undefined);eq(injectedResult.owner.children,{value:0,source:'record'});
const income=clone(c);income.ownerIncome={mode:'record',value:123};eq(estimate(income,cfg).owner.income,123);
for(const key of RANGE_KEYS){const owned=clone(c);owned.ownerCounts[key]={value:11,mode:'manual'};eq(estimate(owned,cfg).owner[key],{value:11,source:'manual'});eq(estimate(owned,cfg).rows.pregnancies,result.rows.pregnancies);}
const zero=clone(cfg);zero.backgroundModifiers.world.earth.intimacy=0;zero.backgroundModifiers.family.noble.combat=0;
eq(estimate(c,zero).rows.intimacy.value,0);eq(estimate(c,zero).rows.wins,undefined);eq(estimate(c,zero).owner.combatGroups,result.owner.combatGroups);
const old=freshState();delete old.config.backgroundModifiers;eq(validateState(old).config.backgroundModifiers,{world:{},family:{},occupation:{}});
const normalized={};validateBackgroundModifiers(normalized);eq(normalized.backgroundModifiers,{world:{},family:{},occupation:{}});
const frozen=freshState();frozen.config=clone(cfg);frozen.character=clone(c);frozen.snapshots=[{id:'frozen',label:'과거',savedAt:'2026-11-10T00:00:00Z',character:clone(c),config:clone(cfg),result:clone(result)}];
frozen.config.backgroundModifiers.occupation.scholar.ranges.children={min:99,max:99};
const frozenChecked=validateState(frozen);eq(frozenChecked.snapshots[0].result.rows.children,undefined);eq(frozenChecked.snapshots[0].config.backgroundModifiers.world.earth.ranges.children,{min:7,max:7});eq(frozenChecked.config.backgroundModifiers.occupation.scholar.ranges.children,{min:99,max:99});
const legacyRows=clone(frozen);legacyRows.snapshots[0].result.rows.children={value:7,source:'estimate',trace:{legacy:true}};eq(validateState(legacyRows).snapshots[0].result.rows.children,{value:7,source:'estimate',trace:{legacy:true}});eq(validateState(legacyRows).snapshots[0].result.owner.children,{value:0,source:'record'});
for(const invalid of [
 {intimacy:-1},{intimacy:21},{intimacy:NaN},{combat:Infinity},
 {ranges:{births:{min:2,max:1}}},{ranges:{births:{min:-1,max:0}}},
 {ranges:{births:{min:0,max:1e9+1}}},{ranges:{births:{min:.5,max:1}}},
 {ranges:{births:{min:0,max:NaN}}},
 JSON.parse('{"__proto__":{"intimacy":1}}'),JSON.parse('{"ranges":{"constructor":{}}}')
]){assert.throws(()=>validateBackgroundModifiers({backgroundModifiers:{world:{bad:invalid},family:{},occupation:{}}}));checks++;}
for(const name of ['__proto__','prototype','constructor']){const bad=JSON.parse(`{"world":{"${name}":{}},"family":{},"occupation":{}}`);assert.throws(()=>validateBackgroundModifiers({backgroundModifiers:bad}));checks++;}
for(const bad of [null,[],1]){assert.throws(()=>validateBackgroundModifiers({backgroundModifiers:bad}));checks++;}
for(const invalid of [JSON.parse('{"world":{"__proto__":{}}}'),{world:{bad:{intimacy:NaN}}},{world:{bad:{ranges:{births:{min:2,max:1}}}}}]){const state=freshState();state.config.backgroundModifiers=invalid;assert.throws(()=>validateState(state));checks++;}
const maxRange=clone(cfg);maxRange.backgroundModifiers.occupation.scholar.ranges.children={min:0,max:1e9};validateBackgroundModifiers(maxRange);
eq(estimate(c,maxRange).rows.children,undefined);eq(estimate(c,maxRange).owner.children,{value:0,source:'record'});eq(maxRange.backgroundModifiers.occupation.scholar.ranges.children,{min:0,max:1e9});
console.log(`PASS · ${checks} background modifier assertions · products, priority, deterministic inclusive ranges, overrides, compatibility and validation`);
