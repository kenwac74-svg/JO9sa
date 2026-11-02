'use strict';
// Mechanical read-only audit; output is restricted to this directory.
const fs=require('node:fs'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const paths={work:'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',original:'G:/somi/JO9O/game/jack.qsp',save:'G:/somi/Jack O Nine Tails v2.4_work/game/save/JO9_MANUAL_20261025/02_수동확인_문제재현/27_private_reports.sav'};
const raw=Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,fs.readFileSync(p)]));
const docs={work:c.parse(raw.work),original:c.parse(raw.original)};
assert.equal(docs.work.hash,'dbe2948f7c827d8fc82ccd32b2c3453626d181a59eb744e015fa66a3846280ae');
function lines(doc,n){let l=doc.locations.find(l=>l.name===n);assert(l,n);return c.shift(doc.lines[l.body],5).split(/\r?\n/);}
function hits(doc,n,re){return lines(doc,n).flatMap((text,i)=>re.test(text)?[{line:i+1,text:text.trim()}]:[]);}
function span(doc,n,start,end){const ls=lines(doc,n),exact=ls.findIndex(s=>s.trim()===start),a=exact>=0?exact:ls.findIndex(s=>s.includes(start)),b=ls.findIndex((s,i)=>i>a&&s.includes(end));assert(a>=0&&b>a);return {start:a+1,end:b+1,lines:ls.slice(a,b+1)};}
const evidence={paths,hashes:Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,c.hash(v)])),scope:'READ_ONLY_STATIC_MECHANICS_NO_RUNTIME_OR_SAVE_MUTATIONS',design:{path:'G:/somi/JO9sa/records/maid-trainee-priority-20261019/MANUAL_KO.md',lines:[12,34],meaning:'Approved private-room residence ignores stored ordinary sleep/diet settings and uses private-room rest/diet effects; current private profile disables ordinary sleep inputs.'},sources:{}};
for(const [version,doc]of Object.entries(docs)){
 const ordinary=span(doc,'next_day','!existence check for sleep condition effects','end of existence and interactions check for slave sleep conditions');
 const privateSleep=span(doc,'next_day','!개인실','!매춘 파트');
 evidence.sources[version]={mainScreenActors:hits(doc,'#static_base',/^\$main_screen_slave_characters\[\]/),pregnancyCalls:hits(doc,'next_day',/^dynamic .*\$next_day_menses_preg_egglaying_update/),sleep:{ordinary:{start:ordinary.start,end:ordinary.end,moralWrites:ordinary.lines.flatMap((s,i)=>/slave_rate\['moral'\]/.test(s)?[{line:ordinary.start+i,text:s.trim()}]:[])},private:{start:privateSleep.start,end:privateSleep.end,checksStoredCondition:privateSleep.lines.some(s=>/sleep_condition/.test(s)),moralWrites:privateSleep.lines.filter(s=>/_rate\['moral'\]/.test(s)),blockHash:c.hash(Buffer.from(privateSleep.lines.join('\n')))}},inseminate:hits(doc,'#dynamic',/\['inseminated'\] = rand\(3,5\)/),conception:hits(doc,'next_day',/inseminated.*-=|cycle_day.*-=|cycle_day.*rand\(21,35\)|ovulation.*-=|inseminated.*iif\(dynslave_type/),display:hits(doc,'sjm_UI_UIadds',/args\[2\].*120/),overnightEquipment:hits(doc,'next_day',/^dynamic .*\$next_day_apply_overnight_item_bonuses/)};
}
evidence.sources.work.bridge={enter:hits(docs.work,'snk_room_bridge',/^dynamic \$swap_slave_instances/).slice(0,2),leave:hits(docs.work,'snk_room_bridge',/^dynamic \$swap_slave_instances/).slice(3),nativeRoomRoute:hits(docs.work,'snk_room_bridge',/snk_room_original_interaction|gs 'snk_room_bridge', 'leave'/).filter(h=>h.line>=109&&h.line<=118)};
evidence.sources.work.privatePregnancyCalls=hits(docs.work,'interaction',/\$vaginally_penetrated.*'room[1-4]'/);
evidence.sources.work.inseminationCall=hits(docs.work,'#dynamic',/hero_choice.*100.*impregnate_cow|dynamic \$inseminate, 'dynslave'/);
evidence.sources.work.reveal=hits(docs.work,'next_day',/pregnant.*120.*90|pregnant_revealed.*= 1/);
evidence.sources.work.clinicRoom1=hits(docs.work,'interaction_city',/room1\['pregnant'\] > 9|room1\['pregnant_revealed'\] = 2/);
const save=sc.parse(raw.save);assert(sc.serialize(save).equals(raw.save));
evidence.sample27={day:sc.value(save,'day')[0],hero:sc.value(save,'hero_choice')[0],target:sc.value(save,'snk_room_target')[0],mainScreenActors:save.vars.find(v=>v.name==='MAIN_SCREEN_SLAVE_CHARACTERS')?.values.map(v=>v[1]),roles:{}};
for(const role of ['slave','assistant','room1','room2','room3','room4']){
 const o={state:sc.value(save,role+'_state')[0],type:sc.value(save,role+'_type')[0]};
 for(const key of ['age','moral','pride','angst','sleep_condition','fertility','fertility_revealed','ovulation','cycle_day','menstruation','pregnant','pregnant_revealed','inseminated','vaginal_modification','parasite'])o[key]=sc.value(save,role,key)[0];
 evidence.sample27.roles[role]=o;
}
const pairs=[];for(let deposited=3;deposited<=5;deposited++)for(let roll=1;roll<=5;roll++)pairs.push({deposited,atOvulation:deposited-1,roll,conceives:deposited-1>roll});
const wins=pairs.filter(p=>p.conceives).length;
evidence.probability={meaning:'Source-derived conditional enumeration, not measured engine RNG or a diagnosis of user save',assumptions:['Male protagonist (hero_choice<100), successful qualifying interaction and positive ejaculation_intensity','fertility=0, non-special type (not2572), no existing pregnancy or active menstruation','Fresh inseminated=rand(3,5) before each night, then one daily decay before ovulation check','Cycle crosses ovulation before resetting cycle_day; no other modifying actions'],uniformPairs:pairs.length,successPairs:wins,perEligibleOvulation:wins/pairs.length,notPerDailyInteraction:true,nonConceptionAfterOneEligibleOvulation:1-wins/pairs.length,nonConceptionAfterTwoIndependentEligibleOvulations:(1-wins/pairs.length)**2};
evidence.limits=['No newly reported user save was supplied to this audit. The old27 room1 is infertile (fertility=-1).','Static call-path verification does not prove every native engine branch or saved dynamic cache executes correctly.','Generic item support was traced; unnamed item-specific effect claims cannot be confirmed.'];
for(const [k,p]of Object.entries(paths))assert(fs.readFileSync(p).equals(raw[k]),'Protected input changed during audit: '+k);
evidence.protectedInputsUnchanged=true;
fs.writeFileSync(__dirname+'/evidence.json',JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({work:docs.work.hash,original:docs.original.hash,probability:evidence.probability.perEligibleOvulation,sample27Room1:evidence.sample27.roles.room1,protectedInputsUnchanged:true}));
