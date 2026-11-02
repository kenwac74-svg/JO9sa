'use strict';
// Isolated native round/renderer tests. No production, candidate or source-save writes.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),a=require('node:assert/strict'),vm=require('node:vm');
const repo='G:/somi/JO9sa',work='G:/somi/Jack O Nine Tails v2.4_work/game';
const c=require(repo+'/tools/text-workshop/core.cjs'),codec=require(repo+'/tools/qa/save-codec.cjs'),gate=require(repo+'/tools/qa/release-check.cjs');
const opts={candidate:'G:/Codex/tmp/battle-followup-20261028/jack.candidate.qsp','game-dir':'G:/Codex/tmp/battle-followup-20261028/candidate-game',out:'G:/Codex/tmp/battle-followup-qa-20261028/hit-native-v1',timeout:30};
for(let i=2;i<process.argv.length;i++){const k=process.argv[i].replace(/^--/,'');if(['run','self-check','dom','observe-secondary'].includes(k))opts[k]=true;else if(['candidate','game-dir','out','case','timeout'].includes(k))opts[k]=process.argv[++i];else throw Error('Unknown '+k);}
const cases=[
 {name:'pierce-normal-modifier-zero',type:'колющий',effect:'pierce',mod:0,hp:96,stamina:96,spirit:96},
 {name:'slash-normal',type:'рубящий',effect:'slash',mod:1,hp:96,stamina:96,spirit:96},
 {name:'impact-stamina-only',type:'дробящий',effect:'impact',mod:0,hp:100,stamina:96,spirit:96},
 {name:'whip-spirit-only',type:'психический',effect:'whip',mod:0,hp:100,stamina:100,spirit:96},
 {name:'total-immunity-no-hit',type:'рубящий',effect:null,immune:true,hp:100,stamina:100,spirit:100},
 {name:'zero-damage-no-hit',type:'колющий',effect:null,damage:0,hp:100,stamina:100,spirit:100},
 {name:'opponent-psychic-preserves-player-pierce',type:'колющий',effect:'pierce',enemyAttack:true,hp:96,stamina:96,spirit:99},
 {name:'companion-whip-spirit-only',type:'психический',effect:'whip',actor:1,hp:100,stamina:100,spirit:96},
 {name:'dead-target-auto-switch-no-false-hit',type:'рубящий',effect:null,switchTarget:true,damage:100,hp:0,stamina:0,spirit:0},
 {name:'secondary-legacy-early-exit-no-extra-damage',type:'рубящий',effect:'slash',two:true,hp:96,stamina:96,spirit:96},
 {name:'secondary-legacy-immune-no-false-cue',type:'рубящий',effect:null,two:true,immune:true,hp:100,stamina:100,spirit:100},
 {name:'pawn-status-defeat-hit',type:'дробящий',effect:'impact',pawn:true,mod:1,hp:100,stamina:100,spirit:100}
];
const selected=opts.case?cases.filter(x=>x.name===opts.case):opts['observe-secondary']?cases.filter(x=>x.two):opts.dom?cases.slice(0,4):cases;a(selected.length,'Unknown case');
const q=s=>"'"+String(s).replace(/'/g,"''")+"'",cr=s=>s.replace(/\r?\n/g,'\r\n');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function driver(cfg){
 const source='('+function(cfg){
  var started=Date.now(),samples=[],root=document.getElementById('jo9_battle_test_v01'),finished=false;
  function rect(n){if(!n)return null;var r=n.getBoundingClientRect();return {x:r.left,y:r.top,width:r.width,height:r.height};}
  function snap(delay){if(!root||root!==document.getElementById('jo9_battle_test_v01'))return;
   var image=root.querySelector('.jo9-battle-hit'),s=image?getComputedStyle(image):null,keys=['fight_bg','fight_txt','enemy_combat_ui','ally_combat_ui','jo9_battle_fx_layer'],boxes={root:rect(root)};
   for(var i=0;i<keys.length;i++)boxes[keys[i]]=rect(root.querySelector('#'+keys[i]));
   samples.push({scheduled:delay,elapsed:Date.now()-started,boxes:boxes,effect:image?{src:image.getAttribute('src'),complete:image.complete,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,rect:rect(image),visibility:s.visibility,pointerEvents:s.pointerEvents,parent:image.parentNode.id,opacity:s.opacity,transform:s.webkitTransform||s.transform}:null});
  }
  function send(){if(finished)return;finished=true;var checks={samples:samples.length===3,loaded:false,correctType:true,visibleEarly:false,hiddenLate:false,geometryStable:true,fixedEffect:true};
   var before=samples.length?JSON.stringify(samples[0].boxes):'';
   for(var i=0;i<samples.length;i++){var row=samples[i],e=row.effect;
    checks.correctType=checks.correctType&&!!e&&e.src===cfg.src;
    checks.geometryStable=checks.geometryStable&&JSON.stringify(row.boxes)===before;
    checks.fixedEffect=checks.fixedEffect&&!!e&&e.rect.width===500&&e.rect.height===460&&e.pointerEvents==='none'&&e.parent==='jo9_battle_fx_layer'&&e.transform==='none';
    if(e&&e.complete&&e.naturalWidth===500&&e.naturalHeight===460)checks.loaded=true;
    if(row.scheduled<=200&&e&&e.visibility==='visible')checks.visibleEarly=true;
    if(row.scheduled===750&&e&&e.visibility==='hidden')checks.hiddenLate=true;
   }
   var ok=true;for(var k in checks)if(!checks[k])ok=false;
   var cb=document.getElementById('qa_hit_dom_callback'),event=document.createEvent('MouseEvents');
   var payload=encodeURIComponent(JSON.stringify({name:cfg.name,checks:checks,samples:samples,pass:ok})).replace(/'/g,'%27');
   cb.setAttribute('href',"EXEC: $qa_hit_dom_payload='"+payload+"' & qa_hit_dom_ok="+Number(ok)+" & gs 'qa_hit_checkpoint'");
   event.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);cb.dispatchEvent(event);
  }
  [25,200,750].forEach(function(t){setTimeout(function(){snap(t);},t);});setTimeout(send,850);
 }.toString()+')('+JSON.stringify(cfg)+');';
 const flat=source.replace(/\r?\n/g,' ');new vm.Script(flat);return flat;
}
if(opts['self-check']){for(const cfg of selected)if(opts.dom)driver({name:cfg.name,src:'content/pic/ui/jo9_battle_test_v01/fx/'+cfg.effect+'.svg'});console.log(JSON.stringify({status:'SCRIPT_SELF_CHECK_ONLY',caseCount:selected.length,dom:!!opts.dom,engineExecuted:false},null,2));process.exit(0);}
const raw=fs.readFileSync(opts.candidate),savePath=work+'/save/JO9_GOLD_AP_CHECK_20261026.sav',save=fs.readFileSync(savePath),prime=gate.primeState(codec.parse(save)).code;
const out=path.resolve(opts.out),game=path.resolve(opts['game-dir']);gate.assertOutside(out,[work,repo,'G:/somi/JO9O','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game',game]);
a(!fs.existsSync(out),'Fresh diagnostic output only');fs.mkdirSync(out,{recursive:true});
const protectedHashes=Object.fromEntries([opts.candidate,savePath,game+'/css/base.css',game+'/content/js/jo9_battle_log.js'].map(p=>[p,hash(fs.readFileSync(p))]));
const token=crypto.randomBytes(7).toString('hex').toUpperCase();
function body(d,n){const l=d.locations.find(x=>x.name===n);a(l,n);return c.shift(d.lines[l.body],5);}
function set(d,n,b){const l=d.locations.find(x=>x.name===n);a(l,n);d.lines[l.body]=c.shift(cr(b),-5);}
function add(d,n,b){a(!d.locations.some(x=>x.name===n));d.lines.splice(-1,0,c.shift(n,-5),c.shift('',-5),c.shift(cr(b),-5),c.shift('0',-5));d.lines[3]=c.shift(String(d.locations.length+1),-5);d.locations=c.parse(c.serialize(d)).locations;}
function check(cond,tag){return `if (${cond}) = 0:\n msg ${q('FAIL_HIT_'+tag+' HP1=<<здоровье_врага[1]>> ST1=<<выносливость_врага[1]>> SP1=<<дух_врага[1]>> HP2=<<здоровье_врага[2]>> ST2=<<выносливость_врага[2]>> SP2=<<дух_врага[2]>> MARK1=<<qa_hit_primary>> MARK2=<<qa_hit_secondary>> TYPE1=<<$qa_hit_primary_type>> TYPE2=<<$qa_hit_secondary_type>> PLAYER=<<здоровье_игрока>>/<<выносливость_игрока>>/<<дух_игрока>>')}\n exit\nend`;}
const plan=selected.map(cfg=>{
 const d=c.parse(raw),marker='JO9_QA_'+token+'_'+cfg.name.replace(/-/g,'_')+'_COMPLETE';
 const capture="qa_hit_primary = jo9_bui_hit[1]\nqa_hit_secondary = jo9_bui_hit[2]\n$qa_hit_primary_type = $jo9_bui_hit_type[1]\n$qa_hit_secondary_type = $jo9_bui_hit_type[2]";
 const html=opts.dom?'<a id="qa_hit_dom_callback" style="display:none" href="#">QA</a><script>'+driver({name:cfg.name,src:'content/pic/ui/jo9_battle_test_v01/fx/'+cfg.effect+'.svg'})+'</script>':'';
 for(const n of ['боевой_интерфейс','конец_боя'])set(d,n,capture+'\n'+body(d,n)+(opts.dom?'\n*p '+q(html):"\nif qa_hit_check_active=1: gs 'qa_hit_checkpoint'"));
 const setup=[
 'killall','usehtml=1','SHOWOBJS 0','SHOWACTS 0','SHOWINPUT 0','SHOWSTAT 0','INTEGRATED_ACTIONS=1','HIDE_SCROLL_ARROWS=1','DISABLESCROLL=1',"$FNAME='Sandoll 미생'",prime,"gs 'refresh_database'","$onnewloc=''","$counter=''","$ongload=''",'sound_on=0',
 'snk_room_target=0',"killvar 'jo9_fog'","killvar 'jo9_combat'","gs 'раскладка_бой'","killvar 'jo9_fate'","killvar 'jo9_fate_enemy'","killvar 'враг'","killvar '$враг'","killvar '$действия_врага'","killvar 'труп'","killvar 'в_отключке'","killvar '$трофей'","killvar '$состояние'","killvar 'нанесенный_вред'","killvar 'это_суперудар'",
 'hero_choice=1','combatant='+(cfg.actor||0),'arena_mode=0','colosseum_fight=0','challenge_type=0','get_girl=0','is_home=1','ui_style=2','cheat_fight_dif=1',
 'количество_врагов='+(cfg.two||cfg.switchTarget?2:1),'текущий=1','поверженные_враги=0','тр=0',"$place='qa_hit'","$fight_return=''",'qa_hit_check_active=1',
 "$оружие='гладиус'","$вторичный='кастет'","$броня='qa_hit_no_armor'","$броня_снять['qa_hit_no_armor']=''","$extra_special_used='content/pic/ui/buttons/legacy/shield_used.png'",
 "$combatant_ava='content/pic/master/master_noble.png'","$combatant_name='타격 검증'",'здоровье_игрока=1000','выносливость_игрока=1000','дух_игрока=1000','макс_здоровье_игрока=1000','макс_выносливость_игрока=1000','норм_дух_игрока=1000',
 "враг[1]=1","$враг[1]='qa_hit_enemy_a'","$имя_врага[1]='검증 대상'","$класс_врага[1]="+q(cfg.pawn?'пешка':'воин'),"$аватара_моба['qa_hit_enemy_a']='content/pic/mob/Ogre_ava.png'","$силуэт_моба['qa_hit_enemy_a']='content/pic/mob/ogre.png'",'здоровье_врага[1]=100','выносливость_врага[1]=100','дух_врага[1]=100',
 "$интеллект['qa_hit_enemy_a']='qa_hit_enemy_ai'",'бессмертный[\'qa_hit_enemy_a\']='+Number(!!cfg.immune),'безустали[\'qa_hit_enemy_a\']='+Number(!!cfg.immune),'бесстрашный[\'qa_hit_enemy_a\']='+Number(!!cfg.immune),'хрупкий[\'qa_hit_enemy_a\']=0','тонкое_тело[\'qa_hit_enemy_a\']=0',
 '$тип_нанесенного_вреда='+q(cfg.type),'нанесенный_вред='+(cfg.damage??4),'модификатор='+(cfg.mod??0),"$наложение=''",'длительность=0','это_суперудар=0',
 "$тип_нанесенного_вреда[1]='психический'",'нанесенный_вред[1]='+(cfg.enemyAttack?7:0),"$действия_игрока='검증 공격'","$действия_врага[1]='검증 반격'","$боевая_обстановка=''",'jo9_bui_ready=0'
 ];
 if(cfg.two||cfg.switchTarget)setup.push("враг[2]=1","$враг[2]='qa_hit_enemy_b'","$имя_врага[2]='두 번째 검증 대상'","$класс_врага[2]='воин'","$аватара_моба['qa_hit_enemy_b']='content/pic/mob/Ogre_ava.png'","$силуэт_моба['qa_hit_enemy_b']='content/pic/mob/ogre.png'",'здоровье_врага[2]=100','выносливость_врага[2]=100','дух_врага[2]=100',"$интеллект['qa_hit_enemy_b']='qa_hit_enemy_ai'","$тип_нанесенного_вреда[2]='дробящий'",'нанесенный_вред[2]=0',"$next_enemy_click={текущий=2}");
 if(cfg.pawn)setup.push("$состояние[1]='повержен'");
 if(cfg.two){
  setup.push("$суперудар[2]='рассечение'","базовый_вред['гладиус']=2","$тип_вреда['гладиус']='рубящий'","gt 'атака_игрока',22");
  set(d,'рассчет_вреда',"модификатор=0\nнанесенный_вред[atk]=4\n$тип_нанесенного_вреда[atk]=$рассчетный_тип_вреда\n$эффект=''\nналожение=0");
 }else setup.push("gt 'конец_раунда'");
 add(d,'qa_hit_enemy_ai','нанесенный_вред[i]=0\n$тип_нанесенного_вреда[i]=\'психический\'');
 const expectedPrimary=!cfg.immune&&cfg.damage!==0,checkpoints=[check('здоровье_врага[1]='+cfg.hp+' and выносливость_врага[1]='+cfg.stamina+' and дух_врага[1]='+cfg.spirit,'RESOURCES')];
 if(!opts['observe-secondary'])checkpoints.push(check('qa_hit_primary='+Number(expectedPrimary),'PRIMARY_MARK'),check('jo9_bui_hit[1]=0 and jo9_bui_hit[2]=0','CONSUMED_ONCE'));
 if(expectedPrimary&&!opts['observe-secondary'])checkpoints.push(check('$qa_hit_primary_type='+q(cfg.type),'PRIMARY_TYPE'));
 if(cfg.effect&&!opts['observe-secondary']){
  const src='content/pic/ui/jo9_battle_test_v01/fx/'+cfg.effect+'.svg';
  checkpoints.push(check('instr($jo9_bui_fx,'+q(src)+')>0','EXPECTED_FX'),check('instr($MAINTXT,'+q(src)+')>0','RENDERED_FX'));
 }else if(!opts['observe-secondary'])checkpoints.push(check('instr($jo9_bui_fx,'+q('jo9-battle-hit')+')=0','NO_FALSE_FX'));
 if(cfg.two)checkpoints.push(check('qa_hit_secondary=0 and здоровье_врага[2]=100 and выносливость_врага[2]=100 and дух_врага[2]=100','LEGACY_SECONDARY_NO_EXTRA_DAMAGE'));
 if(cfg.switchTarget)checkpoints.push(check('текущий=2 and здоровье_врага[2]=100 and выносливость_врага[2]=100 and дух_врага[2]=100','AUTO_SWITCH'));
 if(cfg.enemyAttack)checkpoints.push(check('здоровье_игрока=1000 and выносливость_игрока=1000 and дух_игрока=995','OPPONENT_ATTACK'));
 if(opts.dom)checkpoints.push(check('qa_hit_dom_ok=1','DOM_LOAD_VISIBILITY_AND_GEOMETRY'));
 checkpoints.push('msg '+q(marker));add(d,'qa_hit_checkpoint',checkpoints.join('\n'));set(d,'Start',setup.join('\n'));
 const file=path.join(out,cfg.name+'.qsp'),bytes=c.serialize(d);a(c.serialize(c.parse(bytes)).equals(bytes));fs.writeFileSync(file,bytes);
 return {name:cfg.name,file,marker,checkpoint:'Actual round damage and actual original renderer; observational marker capture and native assertions.'};
});
for(const n of ['css','content','fonts','json'])fs.symlinkSync(fs.realpathSync(game+'/'+n),out+'/'+n,'junction');
fs.copyFileSync(game+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
fs.writeFileSync(out+'/plan.json',JSON.stringify(plan,null,2)+'\n');
const report={status:'PREPARED_ONLY',candidate:opts.candidate,game,stateSave:savePath,inputHashes:protectedHashes,caseCount:plan.length,plan:out+'/plan.json',dom:!!opts.dom,observeLegacySecondary:!!opts['observe-secondary'],engineExecuted:false,diagnosticSeams:['Start state fixtures','renderer prefix observes pending event state and tail redirects to terminal assertions','two-target case replaces damage calculator with deterministic returned 4 damage and no modifiers','synthetic no-op enemy AI only for two-target deterministic player-attack path','native checkpoint location',...(opts.dom?['append-only DOM samples25/200/750ms and one terminal callback at850ms; no intermediate EXEC metrics']:[])],limits:['This verifies actual native round damage routing and generated renderer HTML, not SVG art quality or every desktop resolution.','Modifier zero is a normal hit in original calculation, not a miss. The zero-damage and total-immunity cases test absent effect.','Opponent attack fixture sets indexed enemy attack data, preserving scalar player-damage type by original array convention.','Auto-switch case uses the existing dynamic next-enemy hook with a deterministic index transition.','The two-target skill currently exits its original secondary path without applying extra damage. Those two cases verify unchanged behavior and absence of false effects, not successful secondary damage. The original combat mechanic is not repaired here.']};
if(opts.run){
 report.engineExecuted=true;const timeout=Number(opts.timeout),run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',work+'/engine/jack.exe','-Plan',out+'/plan.json','-TimeoutSeconds',String(timeout)],{encoding:'utf8',windowsHide:true,timeout:(plan.length*timeout+20)*1000,maxBuffer:6*1024*1024});
 fs.writeFileSync(out+'/runner.log',(run.stdout||'')+(run.stderr||''));report.client=fs.existsSync(out+'/client-results.json')?JSON.parse(fs.readFileSync(out+'/client-results.json','utf8').replace(/^\uFEFF/,'')):[];
 report.status=run.status===0&&report.client.length===plan.length&&report.client.every(x=>x.pass)?'PASS':'FAIL';if(run.error)report.runnerError=run.error.message;
 if(opts.dom){report.domCases=plan.map(p=>{const b=fs.readFileSync(out+'/'+p.name+'-stderr.log');let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(b);}catch{text=new TextDecoder('euc-kr').decode(b);}const matches=[...text.matchAll(/\$qa_hit_dom_payload='([^']*)'\s*&/g)];return matches.length?JSON.parse(decodeURIComponent(matches.at(-1)[1])):{name:p.name,pass:false,error:'No terminal payload'};});if(!report.domCases.every(x=>x.pass))report.status='FAIL';}
}
for(const [p,h]of Object.entries(protectedHashes))a.equal(hash(fs.readFileSync(p)),h,'Input changed '+p);report.inputsUnchanged=true;
fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,inputHashes:undefined,client:report.client&&report.client.map(x=>({name:x.name,pass:x.pass,reason:x.reason})),domCases:report.domCases&&report.domCases.map(x=>({name:x.name,pass:x.pass,checks:x.checks})),diagnosticSeams:undefined,limits:undefined},null,2));
process.exitCode=report.status==='FAIL'?1:0;
