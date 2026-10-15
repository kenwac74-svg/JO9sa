// Read-only RM comparison. Writes a report only when --out is explicitly supplied.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('../text-workshop/core.cjs');
const defaults={work:'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',full:'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp',rm:'I:/내 드라이브/Moding/JO9mod/jont-rm-mod-master/game/jack.qsp'};
const args=process.argv.slice(2),options={};for(let i=0;i<args.length;i+=2){assert(/^--(?:work|full|rm|out)$/.test(args[i])&&args[i+1],'Use --work/--full/--rm/--out path');options[args[i].slice(2)]=args[i+1];}
const docs={};for(const [key,defaultPath] of Object.entries(defaults)){const p=options[key]||defaultPath,raw=fs.readFileSync(p),doc=core.parse(raw);assert(core.serialize(doc).equals(raw),'QSP roundtrip: '+key);docs[key]={path:p,sha256:core.hash(raw),locationCount:doc.locations.length,locations:doc.locations.map(l=>({name:l.name,body:core.shift(doc.lines[l.body],5)}))};}
const loc=(key,name)=>{const l=docs[key].locations.find(l=>l.name===name);assert(l,'Missing '+key+': '+name);return l.body;};
const lines=(key,name,re)=>loc(key,name).split(/\r?\n/).flatMap((text,i)=>re.test(text)?[{line:i+1,text}]:[]);
const keys=key=>[...new Set([...loc(key,'slave_sell_chek').matchAll(/\bdemand\[['"]([^'"\]]+)['"]\]/gi)].map(m=>m[1].toLowerCase()))];
const missing=keys('rm').filter(k=>!keys('work').includes(k));
function buyers(key){const result=[];for(const l of docs[key].locations){const blockRe=/^\s*\$buyer_demand\[['"]([^'"\]]+)['"]\]\s*=\s*\{([\s\S]*?)^\s*\}/gmi;for(const m of l.body.matchAll(blockRe)){const defs=[...m[2].matchAll(/^\s*demand\[['"]([^'"\]]+)['"]\]\s*=\s*([^\r\n&]+)/gmi)].map(x=>({key:x[1].toLowerCase(),value:x[2].trim()}));result.push({location:l.name,buyer:m[1],line:l.body.slice(0,m.index).split(/\r?\n/).length,definitions:defs});}}return result;}
const registrations=buyers('work').filter(b=>b.location!=='#npc_base_woman');
const demandMatrix=missing.map(key=>({key,registrations:registrations.filter(b=>b.definitions.some(d=>d.key===key)).map(b=>({location:b.location,buyer:b.buyer,line:b.line,values:b.definitions.filter(d=>d.key===key).map(d=>d.value)}))}));
const watched=['get_stock_seed','origins_relations','generate_stock','stock_to_slave_nogt','slave_sell_chek','slave_sell','interaction_city','interaction_result_city','#dynamic','#options','#npc_base','#quest_base','snk_rm_dialogue_info','pharmacy','искусственный_идиот','next_day','$newloc'];
const parity=watched.map(name=>({location:name,equal:loc('work',name)===loc('full',name),workBodySha256:core.hash(Buffer.from(loc('work',name))),fullBodySha256:core.hash(Buffer.from(loc('full',name)))}));
const excerpts={};for(const key of Object.keys(docs)){excerpts[key]={
 generation:lines(key,'get_stock_seed',/stock_(?:world|nation|family|work)_index|stock_id|relative_relations|args\[0\].*demo/),
 relations:lines(key,'origins_relations',/snk_origin_relation|relative_id|1926319775|1395836363/),
 factionRise:lines(key,'#dynamic',/rise_faction_fame|no_rise|faction_fame\[\$npc_alignment\[\$npc_id\]\].*\+=/),
 factionBuyerMapping:lines(key,'#npc_base',/(?:demand_rating|npc_alignment)\[['"](?:Jinn|Varvar_king|Nimfadora|Konstantin|ImperatorGay|pope)['"]\]/),
 ai:lines(key,'искусственный_идиот',/^\s*ам\s*=|суператака_истрачена.*jump/),
 daily:lines(key,'next_day',/spell_revelio\s*=|gt 'end_day_screen'/),
 onMove:lines(key,'$newloc',/obereg_on/),
 fameCall:lines(key,'#quest_base',/snk_rm_dialogue_info|russiankvartal_fame|futaland_fame/)
};}
const supplementalEvidence={fameDefinitions:lines('work','snk_rm_dialogue_info',/\$(?:russiankvartal|futaland)_fame\[/),pharmacyEntry:lines('work','pharmacy',/19914/),pharmacyRoute:lines('work','interaction_city',/interaction_city = 19914|가격은 물약마다 다르니|900스파크에 3회분/),pamelaReminder:lines('work','interaction_city',/npc_progress\['elsa'\] < 3|엘사는 아그라바의 지니의 집에서 데려오면/),goblinCall:lines('work','interaction_city',/gs 'snk_rm_dialogue_info', 'goblins'/)};
const report={date:'2026-10-16',scope:'Read-only current compiled QSP comparison; male protagonist buyer definitions only, excludes #npc_base_woman and commented assignments; no native gameplay test or game writes.',inputs:Object.fromEntries(Object.entries(docs).map(([k,d])=>[k,{path:d.path,sha256:d.sha256,locations:d.locationCount,roundtrip:true}])),parity,demandMatrix,summary:{rmOnlyCheckerKeys:missing.length,registeredInCurrent: demandMatrix.filter(r=>r.registrations.length).length,notRegistered:demandMatrix.filter(r=>!r.registrations.length).map(r=>r.key)},excerpts,supplementalEvidence};
for(const d of Object.values(docs))assert.equal(core.hash(fs.readFileSync(d.path)),d.sha256,'Input changed during audit');
if(options.out){fs.mkdirSync(path.dirname(options.out),{recursive:true});fs.writeFileSync(options.out,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({inputs:report.inputs,summary:report.summary,parityDifferences:parity.filter(r=>!r.equal).map(r=>r.location)},null,2));
