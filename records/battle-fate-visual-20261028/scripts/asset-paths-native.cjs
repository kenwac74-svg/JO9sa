'use strict';
// Diagnostic-only independent renderer lookup sweep. No production or save writes.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',work='G:/somi/Jack O Nine Tails v2.4_work/game';
const core=require(repo+'/tools/text-workshop/core.cjs'),codec=require(repo+'/tools/qa/save-codec.cjs'),gate=require(repo+'/tools/qa/release-check.cjs');
const root=__dirname,input=JSON.parse(fs.readFileSync(root+'/inputs.json','utf8')),candidate=JSON.parse(fs.readFileSync(root+'/candidate.json','utf8'));
const out=process.argv[2]||'G:/Codex/tmp/battle-fate-visual-qa-20261028/asset-paths-v1';
assert(!fs.existsSync(out),'Fresh diagnostic output only');
gate.assertOutside(out,[work,repo,'G:/somi/JO9O','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game']);
const q=s=>"'"+s.replace(/'/g,"''")+"'",cr=s=>s.replace(/\r?\n/g,'\r\n');
const raw=fs.readFileSync(candidate.candidate),savePath=work+'/save/JO9_GOLD_AP_CHECK_20261026.sav',save=fs.readFileSync(savePath),doc=core.parse(raw);
const hashes={candidate:core.hash(raw),save:core.hash(save)};
const body=n=>{const l=doc.locations.find(x=>x.name===n);assert(l,n);return core.shift(doc.lines[l.body],5);};
function set(n,b){const l=doc.locations.find(x=>x.name===n);assert(l,n);doc.lines[l.body]=core.shift(cr(b),-5);}
const standingMap=new Map();
for(const loc of doc.locations){const b=core.shift(doc.lines[loc.body],5);for(const m of b.matchAll(/\$силуэт_моба\['([^']+)'\]\s*=\s*["']([^"']+\.png)["']/g)){
 const standing=m[2].replace(/\\/g,'/'),id=path.posix.basename(standing,'.png');if(!standingMap.has(id))standingMap.set(id,{enemy:m[1],standing});
}}
const cases=[],assertions=[];
function check(cond,tag){assertions.push(tag);return `if (${cond}) = 0:\n msg ${q('FAIL_ASSET_'+tag)}\n exit\nend`;}
function base(enemy,standing){return [
 "killvar 'jo9_fate'","killvar 'jo9_fate_enemy'","killvar 'jo9_fog'",'snk_room_target=0','combatant=0','количество_врагов=1','текущий=1','враг[1]=1','поверженные_враги=0','jo9_bui_ready=0',
 "$place='qa_home'","$fight_return=''",'colosseum_fight=0','arena_mode=0','ui_style=2',"$итог_боя='победа'",`$враг[1]=${q(enemy)}`,`$силуэт_моба[${q(enemy)}]=${q(standing)}`,
 "$броня='qa_nothing'","$броня_снять['qa_nothing']=''","$действия_игрока=''","$боевая_обстановка=''","killvar '$действия_врага'","$боевое_меню=''","$play_music=''",'sound_on=0',
 'здоровье_врага[1]=0','выносливость_врага[1]=0','дух_врага[1]=10','здоровье_игрока=100','выносливость_игрока=100','дух_игрока=100',"$combatant_name='검증'",`$combatant_ava='content/pic/mob/Ogre_ava.png'`,"$имя_врага[1]='검증'"
].join('\n');}
const lines=["killall",'usehtml=1','SHOWOBJS 0','SHOWACTS 0','SHOWINPUT 0','SHOWSTAT 0',gate.primeState(codec.parse(save)).code,"$counter=''","$onnewloc=''","$ongload=''",'autosave=0','decadesave=0','sound_on=0',"gs '#противники'",'qa_asset_cases=0'];
for(const item of input.assets.filter(x=>x.id)){
 let p=standingMap.get(item.id);
 if(/^gladiator_prisoner_[a-d]$/.test(item.id))p={enemy:'fugituive_'+item.id.slice(-1),standing:'content/pic/mob/gladiator_prisoners.png'};
 assert(p,'Missing case '+item.id);cases.push({name:item.id,...p,expected:item.destination});
 const target=candidate.game+'/'+item.destination;assert(fs.existsSync(target),target);assert.equal(core.hash(fs.readFileSync(target)),item.sha256);
 lines.push(base(p.enemy,p.standing),'*clr',"gs 'конец_боя'",check(`instr($MAINTXT,${q('id="jo9-battle-monster" src="'+item.destination+'"')})>0`,item.id+'_result'),check(`$силуэт_моба[${q(p.enemy)}]=${q(p.standing)}`,item.id+'_standing_unchanged'),
 '*clr',"$итог_боя=''",'враг[1]=1','здоровье_врага[1]=10','выносливость_врага[1]=10',"gs 'боевой_интерфейс'",check(`instr($MAINTXT,${q('id="jo9-battle-monster" src="'+p.standing+'"')})>0`,item.id+'_next_battle_standing'),'qa_asset_cases+=1');
}
for(const id of ['glad_naked_2','glad_naked_3','glad_mistress_3','mistress_morrigan','gladiator_prisoners']){
 const standing=(id==='mistress_morrigan'?'content/pic/characters/':'content/pic/mob/')+id+'.png',enemy=id==='gladiator_prisoners'?'fugituive_e':'qa_missing_'+id;
 cases.push({name:'fallback_'+id,enemy,standing,expected:standing});
 lines.push(base(enemy,standing),'*clr',"gs 'конец_боя'",check(`instr($MAINTXT,${q('id="jo9-battle-monster" src="'+standing+'"')})>0`,'fallback_'+id),'qa_asset_cases+=1');
}
const contexts=[
 {name:'arena',place:'colosseum_arena',ret:'Start',cf:0,bg:'content/pic/ui/jo9_battle_test_v01/arena.png'},
 {name:'colosseum',place:'colosseum',ret:'',cf:4,bg:'content/pic/ui/jo9_battle_test_v01/arena.png'},
 {name:'fog',place:'edge_patrol',ret:'',cf:0,bg:'content/pic/bg/qa_fog.png'},
 {name:'home',place:'qa_home',ret:'menu_form',cf:0,bg:'content\\pic\\ui\\grimdark\\bg\\fight.png'},
 {name:'catfight',place:'catfight_club',ret:'Start1',cf:0,bg:'content\\pic\\ui\\grimdark\\bg\\fight.png'},
 {name:'city_special',place:'qa_city_quest',ret:'city_menu_form',cf:0,bg:'content\\pic\\ui\\grimdark\\bg\\fight.png'},
 {name:'stale_arena_place',place:'colosseum_arena',ret:'city_menu_form',cf:0,bg:'content\\pic\\ui\\grimdark\\bg\\fight.png'},
 {name:'stale_colosseum_place',place:'colosseum',ret:'',cf:0,bg:'content\\pic\\ui\\grimdark\\bg\\fight.png'}
];
for(const x of contexts){cases.push(x);lines.push(base('ogre','content/pic/mob/ogre.png'),`$place=${q(x.place)}`,`$fight_return=${q(x.ret)}`,`colosseum_fight=${x.cf}`,"$bg['edge_patrol']='qa_fog'",'*clr',"gs 'конец_боя'",check(`instr($MAINTXT,${q('<div id = "fight_bg"><img src = "'+x.bg+'"></div>')})>0`,x.name+'_result_bg'),'*clr',"$итог_боя=''",'враг[1]=1','здоровье_врага[1]=10','выносливость_врага[1]=10',"gs 'боевой_интерфейс'",check(`instr($MAINTXT,${q('<div id = "fight_bg"><img src = "'+x.bg+'"></div>')})>0`,x.name+'_battle_bg'),'qa_asset_cases+=1');}
const marker='JO9_QA_'+require('node:crypto').randomBytes(8).toString('hex').toUpperCase()+'_asset_paths_COMPLETE';
lines.push(check('qa_asset_cases='+cases.length,'all_cases'),`msg ${q(marker)}`);set('Start',lines.join('\n'));
// Isolate only the image-cycle presentation wrapper. Actual battle/result renderer, database and choice helper stay original.
set('interior_change',"$result=$args[1]");
const fixture=core.serialize(doc);assert(core.serialize(core.parse(fixture)).equals(fixture));
fs.mkdirSync(out,{recursive:true});const fixturePath=out+'/asset-paths.qsp';fs.writeFileSync(fixturePath,fixture);
for(const dir of ['css','content','fonts','json'])fs.symlinkSync(fs.realpathSync(candidate.game+'/'+dir),out+'/'+dir,'junction');
fs.copyFileSync(candidate.game+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const plan=[{name:'asset-paths',file:fixturePath,marker,checkpoint:'all sixty result sprites, four prisoner ID exceptions, unchanged standing state, subsequent combat standing and eight background contexts'}];
fs.writeFileSync(out+'/plan.json',JSON.stringify(plan,null,2)+'\n');
const report={status:'PREPARED_ONLY',candidate:candidate.candidate,candidateHash:hashes.candidate,stateSave:savePath,stateSaveHash:hashes.save,caseCount:cases.length,assertionCount:assertions.length,cases,assertions,productionBodiesUnderTest:['конец_боя','боевой_интерфейс','jo9_battle_fate'],diagnosticSeams:['Start primed state','interior_change HTML pass-through'],limits:['Checks native QSP MAINTXT paths and state; DOM image loading, geometry and effect timing checked separately.','No writes to WORK, original saves or product sources.'],engineExecuted:true};
const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',work+'/engine/jack.exe','-Plan',out+'/plan.json','-TimeoutSeconds','60'],{encoding:'utf8',windowsHide:true,timeout:75000,maxBuffer:4*1024*1024});
fs.writeFileSync(out+'/runner.log',(r.stdout||'')+(r.stderr||''));const resultFile=out+'/client-results.json';report.client=fs.existsSync(resultFile)?JSON.parse(fs.readFileSync(resultFile,'utf8').replace(/^\uFEFF/,'')):[];
report.status=r.status===0&&!r.error&&report.client.length===1&&report.client[0].pass?'PASS':'FAIL';
report.inputsUnchanged=core.hash(fs.readFileSync(candidate.candidate))===hashes.candidate&&core.hash(fs.readFileSync(savePath))===hashes.save;
if(!report.inputsUnchanged)report.status='FAIL';if(r.error)report.error=r.error.message;
fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,caseCount:cases.length,assertionCount:assertions.length,inputsUnchanged:report.inputsUnchanged,out},null,2));
if(report.status!=='PASS')process.exitCode=1;
