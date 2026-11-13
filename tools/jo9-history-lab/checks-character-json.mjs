import assert from 'node:assert/strict';
import fs from 'node:fs';
import {freshState,defaultConfig,clone,estimate,validateState} from './dist/engine.mjs';
import {parseCharacterJSON,exportCharacterJSON,normalizeRaceTags,traitMatches,setTrait,primitiveFields,assertSafeJson,normalizeTraitCatalogue,applyStandardCase} from './dist/character-io.mjs';
import {buildBackgroundCases,findBackgrounds,autoBackground,useBackground} from './dist/backgrounds.mjs';
const sample=JSON.parse(fs.readFileSync('dist/data/isabella-source.json'));
const traits=JSON.parse(fs.readFileSync('dist/data/traits.json')).rows;
const catalogue=JSON.parse(fs.readFileSync('dist/data/backgrounds.json'));
const cfg=defaultConfig();let count=0;const eq=(a,b)=>{assert.deepEqual(a,b);count++;};
let p=parseCharacterJSON(sample,'2571_isabella.json',cfg,traits);
eq(p.character.name,'이사벨라');eq(p.character.id,'2571');eq(p.character.skills.cook,3);eq(p.character.skills.combat,2);eq(p.character.skills.intellect,4);assert(p.character.note.includes('천연두'));count++;
const before=clone(sample),s=freshState();s.character=p.character;s.characterFile=p.document;
s.character.raceTags=['인간','해양 출신'];s.character.overrides.births={mode:'record',value:0};s.character.overrides.combat={mode:'manual',value:30};
const exported=exportCharacterJSON(s),back=parseCharacterJSON(exported,'2571_isabella.json',cfg,traits);
const futureState=clone(s);futureState.characterFile.working.jo9_initial_history={extra:'keep',values:{future_counter:{value:7,source:'record'}}};const futureOut=exportCharacterJSON(futureState);eq(futureOut.jo9_initial_history.extra,'keep');eq(futureOut.jo9_initial_history.values.future_counter,{value:7,source:'record'});
eq(sample,before);eq(exported.fullimage,sample.fullimage);eq(exported.indpack_apron,sample.indpack_apron);eq(back.character.raceTags,['인간','해양 출신']);eq(back.character.overrides.births,{mode:'record',value:0});eq(back.character.combatGroups,null);eq(back.character.overrides.intimacy.mode,'fixed_estimate');eq(exported.jo9_initial_history.values.income,undefined);eq(exported.jo9_owner_history.income,{value:0,source:'record'});eq(exported.jo9_initial_history.values.pregnancies,{value:null,source:'unknown'});eq(exported.jo9_initial_history.values.abortions,undefined);
eq(estimate(back.character,cfg).rows.intimacy.value,estimate(s.character,cfg).rows.intimacy.value);
const changedCfg=clone(cfg);changedCfg.gradeBases.intimacy[3]=99999;eq(estimate(back.character,changedCfg).rows.intimacy.value,estimate(s.character,cfg).rows.intimacy.value);
const zero={seed_name:'유니크',seed_age:2,seed_cook:0,jo9_initial_history:{values:{intimacy:0,combat:0,births:0,children:null}}};
const z=parseCharacterJSON(zero,'unique.json',cfg,traits).character;eq(z.skills.cook,0);eq(estimate(z,cfg).rows.intimacy.value,0);eq(estimate(z,cfg).rows.births.source,'record');eq(estimate(z,cfg).rows.children,undefined);
assert.throws(()=>parseCharacterJSON({...zero,seed_cook:6},'bad.json',cfg,traits));count++;
assert.throws(()=>assertSafeJson(JSON.parse('{"__proto__":{"pollute":1}}')));count++;
eq(parseCharacterJSON({...zero,jo9_initial_history:{values:{wins:-1}}},'legacy.json',cfg,traits).character.overrides.wins,-1);
assert.throws(()=>parseCharacterJSON({...zero,jo9_initial_history:{values:{intimacy:1},distribution:{matrix:[[0,0,0],[0,0,0],[0,0,0],[0,0,0]]}}},'bad.json',cfg,traits));count++;
eq(normalizeRaceTags('악마, 서큐버스,악마'),['악마','서큐버스']);eq(normalizeRaceTags('엘프 / 숲의 주민'),['엘프 / 숲의 주민']);
eq(traits.length,128);eq(traits.filter(t=>t.binding).length,128);
eq(normalizeTraitCatalogue({rows:traits}).length,128);eq(normalizeTraitCatalogue({rows:traits}).filter(t=>t.binding).length,128);
eq(normalizeTraitCatalogue({rows:[{id:'custom_trait = 1',name:'새 특성'}]})[0].binding.setValue,1);
for(const row of traits){const ch=clone(p.character);setTrait(ch,row,true);eq(traitMatches(row,ch.traitValues),true);setTrait(ch,row,false);eq(traitMatches(row,ch.traitValues),false);}
const oral=traits.find(t=>t.binding.key==='oral_affinity'&&t.binding.op==='>');const ch=clone(p.character);setTrait(ch,oral,true);eq(ch.flags.oralAddiction,true);setTrait(ch,oral,false);eq(ch.flags.oralAddiction,false);
const lesbian=traits.find(t=>t.id==='homosexualism = 2');setTrait(ch,lesbian,true);eq(ch.flags.lesbian,true);setTrait(ch,lesbian,false);eq(ch.flags.lesbian,false);
const cases=buildBackgroundCases(catalogue);assert(cases.length>1000);count++;
for(const kind of ['world','family','occupation']){const used=new Set(cases.map(x=>kind==='world'?x.world.id+':'+x.world.variant:x[kind].id));eq(catalogue.records.filter(x=>x.kind===kind&&!used.has(kind==='world'?x.id+':'+x.variant:x.id)).length,0);}
eq(catalogue.records.filter(r=>r.kind==='world').length,39);eq(catalogue.records.filter(r=>r.kind==='family').length,54);eq(catalogue.records.filter(r=>r.kind==='occupation').length,59);
const nurse=findBackgrounds(cases,{job:'nurse'});assert(nurse.length>0);assert(nurse.every(x=>x.occupation.id==='nurse'));count+=2;
const teacher=clone(p.character);teacher.job='teacher';teacher.background='academic';const found=autoBackground(teacher,cases);eq(found.selected.occupation.id,'teacher');const oldNote=teacher.note;useBackground(teacher,found.selected);eq(teacher.noteManualBackup,oldNote);assert(teacher.note.includes(found.selected.occupation.text.replaceAll('{이름}',teacher.name)));count++;
eq(findBackgrounds(cases,{query:'teacher'}).every(x=>[x.title,x.id,x.world.text,x.family.text,x.occupation.text].join(' ').includes('teacher')),true);
const matrix=[[1,2,3],[4,5,6],[7,8,9],[0,0,0]];s.character.fixedDistribution={matrix,source:'record'};s.character.overrides.intimacy={mode:'record',value:45};const r=estimate(s.character,cfg);eq(r.matrix,matrix);eq(r.partners,[12,15,18]);eq(r.acts,[6,15,24]);
const withMatrix=parseCharacterJSON(exportCharacterJSON(s),'2571_isabella.json',cfg,traits);eq(withMatrix.character.fixedDistribution.matrix,matrix);
eq(validateState(JSON.parse(JSON.stringify(s))).character.raceTags,s.character.raceTags);assert(primitiveFields(sample).length>100);count++;
s.character.ownerIncome={mode:'record',value:1234};const incomeRoundtrip=parseCharacterJSON(exportCharacterJSON(s),'actor.json',cfg,traits);eq(incomeRoundtrip.character.ownerIncome,{mode:'record',value:1234});
const legacyActor={seed_name:'기존 캐릭터',seed_age:2,jo9_initial_history:{values:{income:{value:9000,source:'record'},learning:{value:12,source:'record'},combat:{value:30,source:'record'},wins:{value:20,source:'record'},losses:{value:8,source:'record'}}}};
const legacyParsed=parseCharacterJSON(legacyActor,'legacy.json',cfg,traits),legacyState=freshState();legacyState.character=legacyParsed.character;legacyState.characterFile=legacyParsed.document;
const legacyOut=exportCharacterJSON(legacyState);eq(legacyOut.jo9_initial_history.values.income,{value:9000,source:'record'});eq(legacyOut.jo9_initial_history.values.learning,{value:12,source:'record'});eq(legacyOut.jo9_owner_history.income.value,0);eq(estimate(legacyState.character,cfg).rows.income,undefined);eq(estimate(legacyState.character,cfg).rows.learning,undefined);
const family=freshState();family.character=clone(p.character);family.character.overrides={pregnancies:{mode:'record',value:0},abortions:{mode:'manual',value:2}};family.character.ownerIncome={mode:'manual',value:500};
const familyBack=parseCharacterJSON(exportCharacterJSON(family),'family.json',cfg,traits).character;eq(familyBack.overrides.pregnancies,{mode:'record',value:0});eq(familyBack.overrides.abortions,{mode:'manual',value:2});eq(familyBack.ownerIncome,{mode:'manual',value:500});
const standard=freshState();standard.character=applyStandardCase(p.character);standard.characterFile=clone(p.document);eq(estimate(standard.character,standard.config).rows.wins,undefined);eq(estimate(standard.character,standard.config).owner.children,{value:0,source:'record'});
fs.mkdirSync('dist/samples',{recursive:true});fs.writeFileSync('dist/samples/2571_isabella_initial_history_example.json',JSON.stringify(exportCharacterJSON(standard),null,2));
console.log(`PASS · ${count} character JSON, all 128 trait mappings, ${cases.length} background combinations, fixed counts, explicit zero, source preservation and round-trip assertions`);

// Distinct periods survive raw and native wrapper exports without reinterpreting legacy data.
const periodsRaw={seed_name:'periods',custom:{untouched:9},jo9_initial_history:{values:{pregnancies:0,births:null,abortions:{value:4,source:'record',custom:'keep'},children:3}},jo9_owner_history:{custom:'keep',pregnancies:{value:2,source:'manual',extra:true},births:{value:0,source:'record'},abortions:{value:1,source:'record'},children:{value:0,source:'manual'}}};
const pp=parseCharacterJSON(periodsRaw,'periods.json',cfg,traits),ps=freshState();ps.character=pp.character;ps.characterFile=pp.document;const po=exportCharacterJSON(ps);
eq(po.jo9_initial_history.values.abortions,periodsRaw.jo9_initial_history.values.abortions);eq(po.jo9_initial_history.values.children,3);eq(po.custom,{untouched:9});eq(po.jo9_owner_history.pregnancies,{value:2,source:'manual',extra:true});eq(estimate(ps.character,cfg).rows.abortions,undefined);eq(estimate(ps.character,cfg).owner.children,{value:0,source:'manual'});
const oldPeriod=freshState();delete oldPeriod.character.ownerCounts;oldPeriod.character.overrides.children={mode:'record',value:8};const migrated=validateState(oldPeriod);eq(migrated.character.ownerCounts.children,{mode:'record',value:0});eq(migrated.character.overrides.children,{mode:'record',value:8});
const wr={schema:'jo9-history-result/v1',config:cfg,character:ps.character,result:estimate(ps.character,cfg)};const wp=parseCharacterJSON(wr,'wrapper.json',cfg);eq(wp.character.ownerCounts,ps.character.ownerCounts);
for(const value of [-1,1.5,null]){const bad=freshState();bad.character.ownerCounts.births.value=value;assert.throws(()=>validateState(bad));}
