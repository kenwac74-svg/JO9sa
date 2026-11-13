import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildBackgroundCases,findBackgrounds,backgroundCategories} from './dist/backgrounds.mjs';
import {getModifier,resolveBackgroundModifiers,validateBackgroundModifiers} from './dist/background-modifiers.mjs';
import {defaultConfig,defaultCharacter,estimate,clone} from './dist/engine.mjs';
const cases=buildBackgroundCases(JSON.parse(fs.readFileSync('dist/data/backgrounds.json')));
const facets=backgroundCategories(cases);
assert.equal(facets.world.length,13);assert.equal(facets.family.length,54);assert.equal(facets.occupation.length,59);
const chosen=cases.find(x=>x.occupation.id==='nurse'),filters={world:chosen.world.id,family:chosen.family.id,occupation:chosen.occupation.id};
for(const fixed of [['world'],['family'],['occupation'],['world','family'],['world','occupation'],['family','occupation'],['world','family','occupation']]){
 const selected=Object.fromEntries(fixed.map(key=>[key,filters[key]])),rows=findBackgrounds(cases,selected);
 assert(rows.length>0);assert(rows.every(row=>fixed.every(key=>row[key].id===filters[key])));
 const options=backgroundCategories(cases,selected);for(const kind of Object.keys(options)){const own=options[kind].find(row=>row.id===filters[kind]);assert(own.count>0);}
}
assert.equal(findBackgrounds(cases,{world:'prehistoric',occupation:'installer'}).length,0);
assert.equal(findBackgrounds(cases,{world:'does-not-exist'}).length,0);
const config=defaultConfig();config.backgroundModifiers={world:{},family:{},occupation:{}};
config.backgroundModifiers.world[filters.world]={intimacy:1.2,combat:1.5,ranges:{pregnancies:{min:1,max:5}}};
config.backgroundModifiers.family[filters.family]={intimacy:.5,combat:2,ranges:{pregnancies:{min:2,max:3}}};
config.backgroundModifiers.occupation[filters.occupation]={intimacy:2,combat:0,ranges:{pregnancies:{min:0,max:0},births:{min:2,max:4},abortions:{min:8,max:8},children:{min:9,max:9}}};
validateBackgroundModifiers(config);const resolved=resolveBackgroundModifiers(config,filters);
assert.equal(resolved.factors.intimacy,1.2);assert.equal(resolved.factors.combat,0);assert.equal(resolved.ranges.pregnancies.kind,'occupation');
const actor=defaultCharacter();actor.storySelection={...filters,variant:0};const result=estimate(actor,config);
assert.equal(result.rows.pregnancies.value,0);assert(result.rows.births.value>=2&&result.rows.births.value<=4);assert.equal(result.rows.abortions,undefined);assert.equal(result.rows.children,undefined);
for(const key of ['pregnancies','births','abortions','children'])assert.deepEqual(result.owner[key],{value:0,source:'record'});
actor.ownerCounts.births={value:5,mode:'manual'};assert.deepEqual(estimate(actor,config).owner.births,{value:5,source:'manual'});assert.deepEqual(estimate(actor,config).rows.births,result.rows.births);
assert.equal(result.rows.wins,undefined);assert.equal(result.combatGroups,undefined);assert.equal(result.owner.combatTotals.wins.value,0);
const restored=JSON.parse(JSON.stringify(config));assert.deepEqual(restored.backgroundModifiers.occupation[filters.occupation].ranges.abortions,{min:8,max:8});assert.deepEqual(restored.backgroundModifiers.occupation[filters.occupation].ranges.children,{min:9,max:9});assert.deepEqual(resolveBackgroundModifiers(restored,filters),resolved);
const preserved=clone(config);const copy=getModifier(config,'occupation',filters.occupation);copy.ranges.births.min=1;assert.deepEqual(config,preserved);
console.log('PASS · 3 category lists, one/two/three fixed filters, strict empty results, shared factors, priority ranges and backup round trip');
