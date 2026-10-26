const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('assert/strict');
const repo='G:/somi/JO9sa',c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const root='G:/Codex/tmp/sale-cap-b-private-20261026',rec=repo+'/records/sale-cap-b-20261026/private-tests',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const candidatePath='G:/Codex/tmp/sale-cap-b-20261026/candidate.qsp',baselinePath='G:/Codex/tmp/sale-cap-b-20261026/before.qsp';
const cand=fs.readFileSync(candidatePath),base=fs.readFileSync(baselinePath),candHash=c.hash(cand),baseHash=c.hash(base);
assert.equal(candHash,'e4110fb537108326d0de680efa4a87d286f9b3a6e5bc0b6073e83d13e1ee97f0');assert.equal(baseHash,'b8de16b088051eea5e51d8636f9ca3cc3975974129adf950ce122260ba2b5cf1');
const protectPaths=[game+'/jack.qsp',game+'/FastQSP.ini','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp'];const protectedBefore=protectPaths.map(p=>({path:p,sha256:c.hash(fs.readFileSync(p))}));
assert(!fs.existsSync(root),'fresh bounded temp');fs.mkdirSync(root,{recursive:true});fs.mkdirSync(rec,{recursive:true});fs.mkdirSync(root+'/save');fs.writeFileSync(root+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const cr=s=>s.replace(/\r?\n/g,'\r\n');const get=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),set=(d,n,s)=>d.lines[d.locations.find(l=>l.name===n).body]=c.shift(cr(s),-5);
function slice(s,start,end){const a=s.indexOf(start),b=s.indexOf(end,a+start.length);assert(a>=0&&b>a,start);return s.slice(a,b);}
const checks=(s,id)=>"if ("+s+") = 0: msg 'FAIL_CAPS_"+id+"' & exit\r\n";
function init(kind='high'){
 const low=kind==='low',stress=kind==='discountstress';
 return cr(`usehtml=0
$onnewloc=''
$counter=''
$ongload=''
$ongsave=''
settimer 0
autosave=0 & sound_on=0 & snk_room_target=0
CONST_INT['slave_exist']=1
slave_state=1 & slave_type=2571
slave['id']=910001
slave['energy']=5 & slave['stamina']=3
slave['virginity']=${low?2:4}
slave['jo9_peerless']=${low?0:1}
slave['jo9_versatile']=${low?0:1}
slave['brand']=1
slave_specialisation['qa_service']=5
$interesting_specialisation['qa_buyer']='${low?'qa_service':'concubine'}'
$npc_id='qa_buyer'
$npc_alignment['qa_buyer']='qa_faction'
npc_money['qa_buyer']=100000
npc_bennies['qa_buyer']=0
personal_relations['qa_buyer']=0
common_price[6]=3500 & common_price[10]=8000
demand_rating['qa_buyer']=${low?6:10}
rating=${low?6:10} & charm=${low?24:46}
brand_reputation=5
master_cha=5 & master_domination=5 & master_style=5 & master_str=5
hero_choice=0 & custom_game=1 & day=1
virgin_price=${stress?5000:low?0:1000}
client_satisfaction=0
buyer_from_house=0
fixed_brand_rise=0 & noble_status=1
sparks=1000
qa_clear_calls=0 & qa_clothing_calls=0
$clear_slave_instance='qa_clear_calls+=1 & slave_state=0'
$sold_clothing='qa_clothing_calls+=1'
$return_lock_transfer='qa_return' & $place_transfer='qa_place'
`);
}
const jobs=[];
for(const mode of [911,912,913]){jobs.push({name:'quote-'+({911:'haggle',912:'direct',913:'discount'}[mode])+'-high',mode,kind:mode===913?'discountstress':'high',expectCap:true});jobs.push({name:'quote-'+({911:'haggle',912:'direct',913:'discount'}[mode])+'-below',mode,kind:'low',below:true});}
for(const house of [true,false]){jobs.push({name:'old-'+(house?'house':'repeat')+'-pay',pay:true,house,amount:15000,expected:8000});jobs.push({name:'below-'+(house?'house':'repeat')+'-pay',pay:true,house,amount:6000,expected:6000});jobs.push({name:'quote-'+(house?'house':'repeat')+'-once',mode:house?911:912,kind:'high',compose:true,house,expectCap:true});}
jobs.push({name:'fixed-simple-preserved',fixed:'simple'},{name:'fixed-complex-preserved',fixed:'complex'});
jobs.push({name:'baseline-haggle-red',old:true,mode:911,kind:'high',expectCap:true,red:true});
for(const house of [true,false])jobs.push({name:'baseline-'+(house?'house':'repeat')+'-red',old:true,pay:true,house,amount:15000,expected:8000,red:true});
const plan=[],manifest=[];
for(const job of jobs){const d=c.parse(job.old?base:cand),ic=get(d,'interaction_city'),irc=get(d,'interaction_result_city');const marker='JO9_QA_CAPS_'+job.name.replaceAll('-','_')+'_COMPLETE';let boot=init(job.kind||'low'),finish='';
 const houseCode=slice(irc,"if $interaction_type = 'slave_sold_house':",'!interaction type - sell_slave_complex');const repeatCode=slice(irc,"if $interaction_type = 'slave_sold':",'!interaction type - demonstration');const payCode=job.house?houseCode:repeatCode;
 if(job.mode){const quoteCode=slice(ic,'if interaction_city = '+job.mode+':','if interaction_city = '+(job.mode===911?912:job.mode===912?913:92)+':');boot+='interaction_city='+job.mode+'\r\n';if(job.compose&&job.house)boot+='buyer_from_house=1\r\n';boot+=quoteCode+"\r\ngt 'demo_estate'\r\n";finish+='qa_quote=sell_price\r\n'+checks(job.expectCap?'sell_price=8000':'sell_price>0 and sell_price<8000','QUOTE_CAP');if(job.compose)finish+=payCode+'\r\n'+checks('sparks=9000 and qa_clear_calls=1 and qa_clothing_calls=1 and sell_price=8000 and npc_money[$npc_id]=100000','SINGLE_PAY');}
 else if(job.pay){boot+="$interaction_type='"+(job.house?'slave_sold_house':'slave_sold')+"'\r\nsell_price="+job.amount+'\r\n'+payCode+"\r\ngt 'demo_estate'\r\n";finish+=checks('sell_price='+job.expected+' and sparks='+(1000+job.expected)+' and qa_clear_calls=1 and qa_clothing_calls=1 and npc_money[$npc_id]=100000','PAYOUT_CAP');}
 else if(job.fixed){boot=init('high')+"slave['virginity']=2 & slave['jo9_peerless']=0\r\n$interesting_specialisation[$npc_id]='qa_service'\r\n"+checks("func('jo9_traits_value','base_price','slave',8000)=10000",'FIXED_BASE_HELPER');set(d,'$slave_price','exit');set(d,'slave_sell_chek','buyer_interested=1\r\nexit');boot+="$interaction_type='sell_slave_"+job.fixed+"'\r\n";boot+=(job.fixed==='simple'?slice(irc,"if $interaction_type = 'sell_slave_simple':",'!interaction type - slave sell to clients'):slice(irc,'!interaction type - sell_slave_complex','!interaction type - cow sell'));boot+="\r\ngt 'demo_estate'\r\n";finish+=checks('sparks=11000 and qa_clear_calls=1','FIXED_TEN_THOUSAND');}
 finish+="savegame '"+job.name+"-state.sav'\r\nmsg '"+marker+"'\r\n";set(d,'Start',boot);set(d,'demo_estate',finish);set(d,'choice_screen',"gt 'demo_estate'");const raw=c.serialize(d);qa.inspectWorld(raw);assert(c.serialize(c.parse(raw)).equals(raw));const file=root+'/'+job.name+'.qsp';fs.writeFileSync(file,raw);plan.push({name:job.name,file,marker,checkpoint:'Exact original private quote/payment branch in installed FastQSP, isolated numeric fixture'});manifest.push({...job,sourceSha256:job.old?baseHash:candHash,exactQuoteAndPaymentSlices:true,uiBoundaryStubOnly:true,fixedEligibilityStubs:!!job.fixed});}
fs.writeFileSync(root+'/plan.json',JSON.stringify(plan,null,2));fs.writeFileSync(rec+'/prepared.json',JSON.stringify({candidateSha256:candHash,baselineSha256:baseHash,cases:manifest,protectedBefore,limits:['Numeric fixture execution in hidden installed engine; no GUI clicks or full save loading.','Production quote/payment blocks are exact source slices; display boundary and actor-clear/clothing code are counter stubs.','Fixed-order tests stub eligibility/appraisal only; real common base-price helper and payout branch are retained.','High discount fixture intentionally injects oversized premium 5000 to exercise the cap boundary; normal discount fixture is also tested.','No repeated execution of an already paid result; composed tests require exactly one payout and one clear.']},null,2));
const proc=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',root+'/plan.json','-TimeoutSeconds','8'],{encoding:'utf8',windowsHide:true,timeout:200000});
console.log(proc.stdout);console.log(proc.stderr);const results=JSON.parse(fs.readFileSync(root+'/client-results.json','utf8').replace(/^\uFEFF/,''));const detailed=results.map(r=>{const j=jobs.find(j=>j.name===r.name),log=fs.readFileSync(root+'/'+r.name+'-stderr.log','utf8');fs.copyFileSync(root+'/'+r.name+'-stderr.log',rec+'/'+r.name+'-stderr.log');fs.copyFileSync(root+'/'+r.name+'-stdout.log',rec+'/'+r.name+'-stdout.log');const redObserved=!!(j.red&&log.includes('FAIL_CAPS_'));let snapshot=null;const save=root+'/'+r.name+'-state.sav';if(fs.existsSync(save)){const s=sc.parse(fs.readFileSync(save));snapshot={sellPrice:sc.value(s,'sell_price')[0],quote:sc.value(s,'qa_quote')[0],sparks:sc.value(s,'sparks')[0],clears:sc.value(s,'qa_clear_calls')[0],clothingCalls:sc.value(s,'qa_clothing_calls')[0],npcMoney:sc.value(s,'npc_money','qa_buyer')[0]};}return {...r,expectedRed:!!j.red,redObserved,expectedOutcomeMatched:j.red?redObserved:r.pass,snapshot};});
const protectedAfter=protectedBefore.map(o=>({...o,after:c.hash(fs.readFileSync(o.path))}));assert(protectedAfter.every(o=>o.sha256===o.after),'protected inputs unchanged');fs.writeFileSync(rec+'/RESULT.json',JSON.stringify({candidateSha256:candHash,baselineSha256:baseHash,cases:detailed,protectedAfter},null,2));console.log(JSON.stringify({cases:jobs.length,matched:detailed.filter(r=>r.expectedOutcomeMatched).length,candidatePass:detailed.filter(r=>!r.expectedRed&&r.pass).length,baselineRed:detailed.filter(r=>r.redObserved).length,failed:detailed.filter(r=>!r.expectedOutcomeMatched).map(r=>r.name)},null,2));
