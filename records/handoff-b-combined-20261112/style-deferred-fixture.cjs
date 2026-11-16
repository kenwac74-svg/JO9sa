// Diagnostic only: reproduces the reported style interaction on candidate942.
// Product logic is unchanged. Only this fixture's style RNG is forced to hit.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const candidate=process.argv[2]||'G:/Codex/tmp/handoff-b-combined-20261112/candidate.qsp';
const out=process.argv[3]||'G:/Codex/tmp/handoff-b-style-interop-red-20261112';
const expected='29f4c04892a19afb25c82443a928e5d7895f1a7a24208df670eb3f4032bbbd15';
const raw=fs.readFileSync(candidate);assert.equal(c.hash(raw),expected);
let d=c.parse(raw);
const get=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5);
const put=(n,b)=>d.lines[d.locations.find(x=>x.name===n).body]=c.shift(b.replace(/\r?\n/g,'\r\n'),-5);
const q=s=>"'"+s.replaceAll("'","''")+"'";
const base=get('#static_base');
const begin=base.indexOf('!IMPACTS ON STYLE (temp style rate is refreshed constantly)');
const end=base.indexOf('!counters for anatomy tab',begin);assert(begin>0&&end>begin);
const pureStyle=base.slice(begin,end).replaceAll('dynslave','stock');
const origin=get('jo9_origin_growth');
assert(!origin.includes("stock['style']"));
put('jo9_origin_growth',origin.replaceAll('rand(1,100)','1'));
d.lines.splice(-1,0,c.shift('qa_actual_style_temp',-5),'',c.shift(pureStyle,-5),c.shift('0',-5));
d.lines[3]=c.shift(String(d.locations.length+1),-5);d=c.parse(c.serialize(d));
let s="killall\n$onnewloc=''\n$ongload=''\n$counter=''\nsettimer 0\nqa_checks=0\nqa_failed=0\ngs '#static_base'\ngs '#dynamic'\ngs '#variative'\nqa_bootstrap=(cont_atr_threshold[2]=20 and arrsize('$cont_atr')=9)\n";
const calc="gs 'qa_actual_style_temp'\ndynamic $replace($dyn_calc_slave_attrs,'dyn'+'slave','stock')\n";
const cases=[
 {name:'grace1-clean-groomed',grace:1,hygiene:0,groom:1,base:0},
 {name:'grace2-clean-groomed',grace:2,hygiene:0,groom:1,base:0},
 {name:'grace1-hygiene1-groomed',grace:1,hygiene:1,groom:1,base:0},
 {name:'grace1-hygiene3-groomed',grace:1,hygiene:3,groom:1,base:0},
 {name:'negative-temp-control',grace:1,hygiene:0,groom:0,base:80},
 {name:'late-occupation-grace',grace:0,lateGrace:1,hygiene:0,groom:1,base:0},
 {name:'fixed-control',grace:1,hygiene:0,groom:1,base:0,fixed:1}
];
for(let i=0;i<cases.length;i++){
 const t=cases[i];s+=`qa_case=${i}\n$qa_case_name[qa_case]=${q(t.name)}\nkillvar 'stock'\nkillvar 'stock_rate'\nstock_state=1\nstock['age']=0\nstock['fat']=2\nstock['stamina']=3\nstock['sanity']=3\nstock['metabolism']=3\nstock['grace']=${t.grace}\nstock['hygiene']=${t.hygiene}\nstock_rate['hygiene']=cont_atr_threshold[${t.hygiene}]\nstock['makeup']=${t.groom?2:0}\nstock['perfume']=${t.groom}\nstock['manicure']=${t.groom}\nstock['epilation']=${t.groom}\nstock['hairstyle']=${t.groom}\nstock_rate['style']=${t.base}\n`+calc;
 s+="qa_before_grade[qa_case]=stock['style']\nqa_before_temp[qa_case]=stock_rate['temp_style']\nqa_proper_base[qa_case]=stock['style']\n";
 if(t.lateGrace!==undefined){s+=`stock['grace']=${t.lateGrace}\n`+calc+"qa_proper_base[qa_case]=stock['style']\nqa_late_temp[qa_case]=stock_rate['temp_style']\nstock['style']=qa_before_grade[qa_case]\nstock_rate['temp_style']=qa_before_temp[qa_case]\n";}
 s+=`stock['jo9_bg_random']=${t.fixed?0:1}\n$stock_family='orphan'\nqa_target[qa_case]=max(0,min(5,qa_proper_base[qa_case]))\nqa_init_hit[qa_case]=func('jo9_origin_growth','init')\nqa_applied_grade[qa_case]=stock['style']\nqa_written_rate[qa_case]=stock_rate['style']\n`+calc;
 s+="qa_after_grade[qa_case]=stock['style']\nqa_after_temp[qa_case]=stock_rate['temp_style']\nqa_required_signed_base[qa_case]=cont_atr_threshold[qa_target[qa_case]]-stock_rate['temp_style']\nqa_checks+=1\nif qa_after_grade[qa_case]!qa_target[qa_case]: qa_failed+=1\n";
}
s+="savegame 'qa.sav'\nmsg 'JO9_QA_STYLEINTEROP_deferred_COMPLETE'\nexit\n";
put('Start',s);fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/test.qsp',c.serialize(d));
fs.copyFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/config.xml',out+'/config.xml');
fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
fs.writeFileSync(out+'/plan.json',JSON.stringify([{name:'style-interop',file:out+'/test.qsp',marker:'JO9_QA_STYLEINTEROP_deferred_COMPLETE',checkpoint:'User-deferred style roll: actual pure temp_style and full dyn_calc must match baseline'}],null,2));
fs.writeFileSync(out+'/fixture-metadata.json',JSON.stringify({candidate,sha256:expected,cases,pureStyle,
 originalOriginSource:origin,
 continuousStyleGradeSource:base.slice(base.indexOf('!Continuous field dependence'),base.indexOf('! Linked stats')),
 fixtureOnlyChange:'rand(1,100) ->1 in jo9_origin_growth to force approved style hit; no product writes'},null,2));
console.log('Prepared style interaction RED fixture');
