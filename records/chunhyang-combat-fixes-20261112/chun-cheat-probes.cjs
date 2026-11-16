'use strict';
// Native regression probes for Chunhyang HP-zero finishers. Production files are read only.
// Usage: node chun-cheat-probes.cjs prepare candidate|installed
//        run tools/qa/run-client-smoke.ps1 with the emitted plan.json
//        node chun-cheat-probes.cjs collect candidate|installed
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const task='G:/Codex/tmp/chunhyang-combat-fixes-20261112';
const out=task+'/cheat-probes',rec=repo+'/records/chunhyang-combat-fixes-20261112';
const c=require(repo+'/tools/text-workshop/core.cjs');
const qa=require(repo+'/tools/qa/release-check.cjs');
const sc=require(repo+'/tools/qa/save-codec.cjs');
const phase=process.argv[2]||'prepare',variant=process.argv[3]||'candidate';
assert(['candidate','installed'].includes(variant),'Expected candidate or installed');
const source=variant==='installed'?game+'/jack.qsp':task+'/candidate.qsp';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const body=(d,name)=>c.shift(d.lines[d.locations.find(l=>l.name===name).body],5);
const put=(d,name,text)=>{const l=d.locations.find(l=>l.name===name);assert(l,name);d.lines[l.body]=c.shift(text.replace(/\r?\n/g,'\r\n'),-5);};
const check=(expression,label)=>"if ("+expression+") = 0: msg 'FAIL_CHUNCHEAT_"+label+"' & exit\nqa_checks += 1\n";
const boot="killall\nautosave=0\ndecadesave=0\nsound_on=0\n$onnewloc=''\n$ongload=''\n$ongsave=''\n$counter=''\nsettimer 0\nsnk_room_target=0\ncombatant=0\n$враг[1]='chunhyang'\nколичество_врагов=1\nвраг[1]=1\nтекущий=1\negeya_lose=1\njo9_chunhyang['open']=1\njo9_chun_requested=1\nsparks=250000\njo9_cruel_mercy=5\njo9_cruel_mercy_half=1\ndifficulty_setting=1\n$итог_боя=''\n";
function finish(name){return "\nsavegame '"+name+".sav'\nmsg 'JO9_QA_CHUNCHEAT_"+name.replaceAll('-','_')+"_COMPLETE'\nexit\n";}
if(phase==='prepare'){
 const raw=fs.readFileSync(source),sourceHash=c.hash(raw);
 const original=c.parse(raw);assert(c.serialize(original).equals(raw));
 fs.mkdirSync(out,{recursive:true});fs.mkdirSync(rec,{recursive:true});
 const plan=[];
 for(const kind of ['init','periodic'])for(const invincible of [true,false]){
  const name=kind+'-cheat-'+(invincible?'on':'off'),d=c.parse(raw);
  const hp=kind==='init'?50:70;
  let code=boot+'cheat_fight_dif='+(invincible?0:1)+'\n';
  code+='здоровье_игрока='+hp+'\nмакс_здоровье_игрока='+hp+'\n';
  code+="выносливость_игрока=75\nмакс_выносливость_игрока=75\nдух_игрока=60\nнорм_дух_игрока=60\n";
  const unchanged=check("sparks=250000 and jo9_cruel_mercy=5 and jo9_cruel_mercy_half=1",'cash_cm_unchanged');
  const common=check("jo9_chun_fight['active']=1 and jo9_chun_requested=1",'active_battle_preserved');
  let passed;
  if(kind==='init'){
   // 120 + 100 + 150 + 150 + 180 = 700 units, strictly below the 2100 boundary.
   code+="base_str=1\nсила=1\ngs 'jo9_chun_battle','init'\n";
   passed=check("jo9_chun_fight['units']<2100 and jo9_chun_fight['balm']=3",'low_ratio_initialized')+
    check("jo9_chun_fight['kill_at']>=5 and jo9_chun_fight['kill_at']<=10",'initial_period_preserved');
  }else{
   // Force only the finisher chance roll, leaving the 5..10 period roll native.
   const originalBattle=body(d,'jo9_chun_battle');
   const at=originalBattle.indexOf("if $args[0] = 'after_player':");
   assert(at>=0,'Missing after_player block');
   const head=originalBattle.slice(0,at),tail=originalBattle.slice(at);
   assert(/rand\(\s*1\s*,\s*3000\s*\)/.test(tail),'Missing periodic chance roll');
   put(d,'jo9_chun_battle',head+tail.replace(/rand\(\s*1\s*,\s*3000\s*\)/,'1'));
   code+="jo9_chun_fight['active']=1\njo9_chun_fight['units']=2400\njo9_chun_fight['balm']=3\njo9_chun_fight['turn']=7\njo9_chun_fight['period']=7\njo9_chun_fight['kill_at']=7\njo9_chun_fight['evade_at']=3\njo9_chun_fight['kill_due']=1\nздоровье_врага[1]=200\nвыносливость_врага[1]=300\nдух_врага[1]=200\ngs 'jo9_chun_battle','after_player'\n";
   passed=check("jo9_chun_fight['kill_due']=0 and jo9_chun_fight['kill_at']>=12 and jo9_chun_fight['kill_at']<=17",'next_kill_advanced')+
    check("jo9_chun_fight['evade_at']>7 and jo9_chun_fight['balm']=3 and jo9_chun_fight['turn']=7",'period_and_items_preserved');
  }
  if(invincible){
   code+=check('здоровье_игрока='+hp+" and $итог_боя='' and qa_end_reached=0",'invulnerability_prevents_defeat')+unchanged+common+passed+finish(name);
   put(d,'конец_боя',"qa_end_reached=1\nmsg 'FAIL_CHUNCHEAT_INVULNERABLE_FORCED_END'\nexit\n"+body(d,'конец_боя'));
  }else{
   // An unprotected finisher must transfer to the ordinary HP-zero battle-end path.
   code+="msg 'FAIL_CHUNCHEAT_FINISHER_DID_NOT_END'\nexit\n";
   const end="qa_end_reached=1\n"+check("здоровье_игрока=0 and $итог_боя='убит'",'hp_zero_native_outcome')+unchanged+common+passed+finish(name);
   put(d,'конец_боя',end+body(d,'конец_боя'));
  }
  put(d,'Start',code);const fixture=c.serialize(d);qa.inspectWorld(fixture);
  fs.writeFileSync(out+'/'+name+'.qsp',fixture);
  plan.push({name,file:out+'/'+name+'.qsp',marker:'JO9_QA_CHUNCHEAT_'+name.replaceAll('-','_')+'_COMPLETE',checkpoint:kind+' finisher, invincibility '+(invincible?'enabled':'disabled')});
 }
 fs.copyFileSync(game+'/config.xml',out+'/config.xml');
 fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 write(out+'/plan.json',plan);
 write(rec+'/cheat-probes-'+variant+'-instrumentation.json',{source,sourceHash,cases:4,assertionsPerCase:5,scope:'Actual init/after_player helpers; native battle-end entry intercepted before render/CM settlement. Only periodic chance rand is fixed in fixtures; period rand remains native.',userSavesTouched:false});
 console.log(JSON.stringify({phase,variant,sourceHash,cases:4,plan:out+'/plan.json'}));
}else if(phase==='collect'){
 const results=read(out+'/client-results.json');assert.equal(results.length,4);assert(results.every(x=>x.pass),'Native cheat probe failed');
 const observations=[];
 for(const row of results){
  const s=sc.parse(fs.readFileSync(out+'/'+row.name+'.sav'));
  const num=(name,key)=>Number(sc.value(s,name,key)[0]);
  const snapshot={name:row.name,checks:num('qa_checks'),hp:num('здоровье_игрока'),outcome:sc.value(s,'итог_боя')[1],endReached:num('qa_end_reached'),active:num('jo9_chun_fight','active'),units:num('jo9_chun_fight','units'),killAt:num('jo9_chun_fight','kill_at'),evadeAt:num('jo9_chun_fight','evade_at'),cash:num('sparks'),cm:num('jo9_cruel_mercy'),cmHalf:num('jo9_cruel_mercy_half')};
  assert.equal(snapshot.checks,5);observations.push(snapshot);
  fs.copyFileSync(out+'/'+row.name+'-stderr.log',rec+'/'+variant+'-'+row.name+'-native.log');
 }
 write(rec+'/cheat-native-'+variant+'.json',{source,sourceHash:c.hash(fs.readFileSync(source)),results,observations,assertions:20,passed:true,cmSettlementTested:false});
 console.log(JSON.stringify({variant,cases:4,assertions:20,passed:true,observations}));
}else throw Error('Expected prepare or collect');
