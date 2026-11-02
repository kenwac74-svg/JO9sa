'use strict';
// Independent diagnostic-only QSP/renderer roster sweep. Product and saves are read only.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',work='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/battle-followup-20261028';
const core=require(repo+'/tools/text-workshop/core.cjs'),codec=require(repo+'/tools/qa/save-codec.cjs'),gate=require(repo+'/tools/qa/release-check.cjs');
const out=process.argv[2]||'G:/Codex/tmp/battle-followup-qa-20261028/group-roster-v1';
const candidate=tmp+'/jack.candidate.qsp',game=tmp+'/candidate-game',savePath=work+'/save/JO9_GOLD_AP_CHECK_20261026.sav';
const q=s=>"'"+String(s).replace(/'/g,"''")+"'",cr=s=>s.replace(/\r?\n/g,'\r\n');
assert(!fs.existsSync(out),'Only a new diagnostic output directory is allowed');
gate.assertOutside(out,[work,repo,'G:/somi/JO9O','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game']);
const raw=fs.readFileSync(candidate),save=fs.readFileSync(savePath),beforeWork=fs.readFileSync(work+'/jack.qsp'),doc=core.parse(raw);
const inputHashes={candidate:core.hash(raw),save:core.hash(save),work:core.hash(beforeWork)};
const location=n=>{const l=doc.locations.find(x=>x.name===n);assert(l,n);return l;};
const body=n=>core.shift(doc.lines[location(n).body],5);
function set(n,b){doc.lines[location(n).body]=core.shift(cr(b),-5);}
function add(n,b){assert(!doc.locations.some(x=>x.name===n));doc.lines.splice(doc.lines.length-1,0,core.shift(n,-5),'',core.shift(cr(b),-5),core.shift('0',-5));doc.lines[3]=core.shift(String(doc.locations.length+1),-5);const parsed=core.parse(core.serialize(doc));doc.lines=parsed.lines;doc.locations=parsed.locations;}
const db=body('#противники'),standing=new Map();
for(const m of db.matchAll(/\$силуэт_моба\['([^']+)'\]\s*=\s*["']([^"']+\.png)["']/g))standing.set(m[1],m[2].replace(/\\/g,'/'));
const beast=['козлорогий','свинорылый','жабован','крысолюд'],poor=['канибал','калека','нищеброд','безумец','изможденный'];
function combinations(pool,n,start=0,prefix=[],rows=[]){if(n===0){rows.push(prefix);return rows;}for(let i=start;i<pool.length;i++)combinations(pool,n-1,i,[...prefix,pool[i]],rows);return rows;}
const groups=[
 {name:'black-medic-party',ids:['черный_медик','подручный','подручный','подручный']},
 {name:'taurus-patrol',ids:['паладин','пехотинец','пехотинец']},
 {name:'goblin-pair',ids:['goblin','goblin']},{name:'goblin-trio',ids:['goblin','goblin','goblin']},
 {name:'garsid-party',ids:[...beast,'garsid']},
 ...combinations(beast,4).map((ids,i)=>({name:'beast-multiset-'+i,ids})),
 ...combinations(poor,5).map((ids,i)=>({name:'outcast-multiset-'+i,ids}))
];
assert.equal(groups.length,166);
const assertions=[],cases=[],groupAssets=new Map();
function check(condition,tag){assertions.push(tag);return `if (${condition})=0:\n msg ${q('FAIL_GROUP_'+tag)}\n exit\nend`;}
function expected(id){const p=standing.get(id);assert(p,'Missing actual database silhouette: '+id);return 'content/pic/mob/defeated/'+path.posix.basename(p);}
function base(ids){return [
 "killvar 'jo9_fate'","killvar 'jo9_fate_enemy'","killvar 'jo9_fog'","killvar '$враг'","killvar 'враг'","killvar '$действия_врага'",'snk_room_target=0','combatant=0','jo9_bui_ready=0','текущий=1','поверженные_враги='+ids.length,
 'количество_врагов='+ids.length,"$place='edge_patrol'","$fight_return='city_menu_form'",'colosseum_fight=0','arena_mode=0','ui_style=2',"$итог_боя='победа'","$броня='qa_no_armor'","$броня_снять['qa_no_armor']=''","$действия_игрока=''","$боевая_обстановка=''","$боевое_меню=''","$play_music=''",'sound_on=0',"$bg['edge_patrol']='qa_fog'",
 'здоровье_игрока=100','выносливость_игрока=100','дух_игрока=100',"$combatant_name='검증'","$combatant_ava='content/pic/mob/Ogre_ava.png'",
 ...ids.flatMap((id,j)=>[`$враг[${j+1}]=${q(id)}`,`враг[${j+1}]=0`,`здоровье_врага[${j+1}]=0`,`выносливость_врага[${j+1}]=0`,`дух_врага[${j+1}]=10`,`$имя_врага[${j+1}]='검증'`])
].join('\n');}
const lines=["killall",'usehtml=1','SHOWOBJS 0','SHOWACTS 0','SHOWINPUT 0','SHOWSTAT 0',gate.primeState(codec.parse(save)).code,"$counter=''","$onnewloc=''","$ongload=''",'autosave=0','decadesave=0','sound_on=0',"gs '#противники'",'qa_group_cases=0'];
for(const test of groups){
 cases.push({...test,kind:'group'});lines.push(base(test.ids),'*clr',"gs 'конец_боя'");
 lines.push(check(`instr($MAINTXT,'jo9-battle-defeated-group')>0 and instr($MAINTXT,${q('jo9-group-count-'+test.ids.length)})>0`,test.name+'_wrapper'));
 lines.push(check(`func('qa_group_count',$MAINTXT,'jo9-group-slot-')=${test.ids.length}`,test.name+'_count'));
 const multiplicities=new Map();test.ids.forEach(id=>multiplicities.set(expected(id),(multiplicities.get(expected(id))||0)+1));
 for(const [src,n]of multiplicities){assert(fs.existsSync(game+'/'+src),'Missing defeated resource '+src);groupAssets.set(src,core.hash(fs.readFileSync(game+'/'+src)));lines.push(check(`func('qa_group_count',$MAINTXT,${q('src="'+src+'"')})=${n}`,test.name+'_'+path.posix.basename(src,'.png')+'_multiplicity'));}
 test.ids.forEach((id,j)=>lines.push(check(`$func('jo9_battle_fate','sprite',${j+1},1)=${q(expected(id))}`,test.name+'_slot_'+(j+1)),check(`$силуэт_моба[${q(id)}]=${q(standing.get(id))}`,test.name+'_standing_'+(j+1))));
 lines.push('*clr',"$итог_боя=''",'поверженные_враги=0',...test.ids.map((id,j)=>`враг[${j+1}]=1`),'здоровье_врага[1]=10','выносливость_врага[1]=10',"gs 'боевой_интерфейс'",check(`instr($MAINTXT,${q('id="jo9-battle-monster" src="'+standing.get(test.ids[0])+'"')})>0 and instr($MAINTXT,'jo9-battle-defeated-group')=0`,test.name+'_next_battle'),'qa_group_cases+=1');
}
const missingIds=['werewolf','ratman','toadman','lich','goathead','swine','vampire','garsid','spawn','minion','canibal','cripple','homeless','madman','starving','paladin','footman','medic'];
for(const id of missingIds){
 const entry=[...standing].find(([,src])=>path.posix.basename(src,'.png')===id);assert(entry,id);const [enemy,src]=entry;assert(fs.existsSync(game+'/'+src),'Missing standing resource '+src);groupAssets.set(src,core.hash(fs.readFileSync(game+'/'+src)));cases.push({name:'new-standing-'+id,kind:'standing',enemy,src});
 lines.push(base([enemy]),"$итог_боя=''",'поверженные_враги=0','враг[1]=1','здоровье_врага[1]=10','выносливость_врага[1]=10','*clr',"gs 'боевой_интерфейс'",check(`instr($MAINTXT,${q('id="jo9-battle-monster" src="'+src+'"')})>0`,'new_standing_'+id),check(`$func('jo9_battle_fate','sprite',1,0)=${q(src)}`,'new_standing_func_'+id),'qa_group_cases+=1');
}
for(const ctx of [{name:'fog-single-victory',ids:['ogre'],place:'edge_patrol',outcome:'победа'},{name:'fog-group-loss',ids:['goblin','goblin'],place:'edge_patrol',outcome:'вырубился'},{name:'arena-group-victory',ids:['goblin','goblin'],place:'colosseum_arena',outcome:'победа'}]){
 cases.push({...ctx,kind:'scope'});lines.push(base(ctx.ids),`$place=${q(ctx.place)}`,`$итог_боя=${q(ctx.outcome)}`,'*clr',"gs 'конец_боя'",check(`instr($MAINTXT,'jo9-battle-defeated-group')=0`,ctx.name+'_no_group'),'qa_group_cases+=1');
}
const marker='JO9_QA_'+require('node:crypto').randomBytes(8).toString('hex').toUpperCase()+'_group_roster_COMPLETE';
lines.push(check('qa_group_cases='+cases.length,'all_cases'),`msg ${q(marker)}`);
set('Start',lines.join('\n'));set('interior_change',"$result=$args[1]");
add('qa_group_count',"local $qa_rest=$args[0]\nlocal $qa_needle=$args[1]\nresult=0\nif $qa_needle='': exit\n:qa_group_count_loop\nlocal qa_pos=instr($qa_rest,$qa_needle)\nif qa_pos=0: exit\nresult+=1\n$qa_rest=$mid($qa_rest,qa_pos+len($qa_needle))\njump 'qa_group_count_loop'");
const fixture=core.serialize(doc);assert(core.serialize(core.parse(fixture)).equals(fixture));
fs.mkdirSync(out,{recursive:true});const fixturePath=out+'/group-roster.qsp';fs.writeFileSync(fixturePath,fixture);
for(const dir of ['css','content','fonts','json'])fs.symlinkSync(fs.realpathSync(game+'/'+dir),out+'/'+dir,'junction');
fs.copyFileSync(game+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
fs.writeFileSync(out+'/plan.json',JSON.stringify([{name:'group-roster',file:fixturePath,marker,checkpoint:'all seven group patterns, 161 random-roster multisets, standing resource paths and subsequent-combat preservation'}],null,2)+'\n');
const report={status:'PREPARED_ONLY',createdUTC:new Date().toISOString(),candidate,game,inputHashes,caseCount:cases.length,groupCases:groups.length,beastMultisets:35,outcastMultisets:126,standingCases:18,scopeCases:3,assertionCount:assertions.length,cases,assertions,resources:[...groupAssets].map(([src,sha256])=>({src,sha256})),productionBodiesUnderTest:['конец_боя','боевой_интерфейс','jo9_battle_fate sprite'],diagnosticSeams:['Start primed state','interior_change HTML pass-through','qa_group_count diagnostic string counter'],engineExecuted:true,limits:['Native QSP checks emitted HTML paths/multiplicity and stored standing arrays. DOM geometry, overlap and image decoding are checked separately.','No product files or original save writes.']};
const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',work+'/engine/jack.exe','-Plan',out+'/plan.json','-TimeoutSeconds','60'],{encoding:'utf8',windowsHide:true,timeout:75000,maxBuffer:4*1024*1024});
fs.writeFileSync(out+'/runner.log',(r.stdout||'')+(r.stderr||''));const f=out+'/client-results.json';report.client=fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,'')):[];
report.status=r.status===0&&!r.error&&report.client.length===1&&report.client[0].pass?'PASS':'FAIL';
report.inputsUnchanged=core.hash(fs.readFileSync(candidate))===inputHashes.candidate&&core.hash(fs.readFileSync(savePath))===inputHashes.save&&core.hash(fs.readFileSync(work+'/jack.qsp'))===inputHashes.work;
if(!report.inputsUnchanged)report.status='FAIL';if(r.error)report.error=r.error.message;
fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,caseCount:cases.length,assertionCount:assertions.length,inputsUnchanged:report.inputsUnchanged,out},null,2));
if(report.status!=='PASS')process.exitCode=1;
