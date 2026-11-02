'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict'),vm=require('node:vm');
const REPO='G:/somi/JO9sa',WORK='G:/somi/Jack O Nine Tails v2.4_work/game',core=require(REPO+'/tools/text-workshop/core.cjs'),codec=require(REPO+'/tools/qa/save-codec.cjs'),gate=require(REPO+'/tools/qa/release-check.cjs');
// Same retained read-only log decoder in workspace and archived records layouts.
const uiHelpers=[path.resolve(__dirname,'../battle-followup-20261028/fate-ui-native.cjs'),path.resolve(__dirname,'../../battle-followup-20261028/scripts/fate-ui-native.cjs')];
const uiHelper=uiHelpers.find(p=>fs.existsSync(p));assert(uiHelper,'Retained UI log decoder is missing');
const ui=require(uiHelper);assert.equal(typeof ui.readNativePayload,'function','UI log decoder export missing');
const q=s=>"'"+String(s).replace(/'/g,"''")+"'",cr=s=>s.replace(/\r?\n/g,'\r\n'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const STYLES=[['retiarius',22,'net'],['flagrius',23,'whip'],['dimacherus',24,'dual'],['hoplomachus',25,'shield'],['kimerian',14,'heavy']];
const CASES=[{name:'arena-native-matrix',kind:'matrix'},{name:'arena-kimerian-active',kind:'arena',used:0},{name:'arena-kimerian-used',kind:'arena',used:1}];
function body(d,n){const l=d.locations.find(x=>x.name===n);assert(l,'Missing '+n);return core.shift(d.lines[l.body],5);}
function set(d,n,s){const l=d.locations.find(x=>x.name===n);assert(l,'Missing '+n);d.lines[l.body]=core.shift(cr(s),-5);}
function add(d,n,s){assert(!d.locations.some(x=>x.name===n));d.lines.splice(-1,0,core.shift(n,-5),core.shift('',-5),core.shift(cr(s),-5),core.shift('0',-5));d.lines[3]=core.shift(String(d.locations.length+1),-5);d.locations=core.parse(core.serialize(d)).locations;}
function check(s,t){return "if ("+s+")=0: msg "+q('FAIL_ARENA_UI_'+t)+' & exit';}
function driver(cfg){const s='('+function(cfg){
 var ended=false;
 function rect(n){var r=n.getBoundingClientRect();return {x:r.left,y:r.top,width:r.width,height:r.height,right:r.right,bottom:r.bottom};}
 function click(n){var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);n.dispatchEvent(e);}
 function hit(n){var r=rect(n),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.width>0&&r.height>0&&(top===n||n.contains(top));}
 function send(p){if(ended)return;ended=true;var n=document.getElementById('qa_arena_callback');if(!n)return;n.setAttribute('href',"EXEC: $qa_arena_payload='"+encodeURIComponent(JSON.stringify(p)).replace(/'/g,'%27')+"' & qa_arena_dom_ok="+Number(p.ok)+" & gs 'qa_arena_done'");click(n);}
 function probe(tries){
  if(cfg.kind==='matrix'){send({caseName:cfg.name,ok:true,nativeMatrix:true,scenarios:26});return;}
  var root=document.getElementById('jo9_battle_test_v01'),panel=root&&(root.querySelector('#fight_options_ui2')||root.querySelector('#fight_options'));
  if(!panel){if(tries<30){setTimeout(function(){probe(tries+1);},50);return;}send({caseName:cfg.name,ok:false,error:'PANEL_MISSING'});return;}
  var links=panel.querySelectorAll('a[href]'),result={caseName:cfg.name,kind:cfg.kind,text:panel.textContent,images:panel.querySelectorAll('img').length,links:[],rect:rect(panel)};
  for(var i=0;i<links.length;i++){var s=getComputedStyle(links[i]);result.links.push({text:links[i].textContent,href:links[i].getAttribute('href'),hit:hit(links[i]),fontFamily:s.fontFamily,fontSize:s.fontSize});}
  result.ok=result.images===0&&result.rect.width>0&&result.rect.height>0;
  if(cfg.kind==='normal'){
   var expected=cfg.role===0?['일반 공격','특수 기술','물약 사용','무기 변경','방어']:['일반 공격','물약 사용','무기 변경','방어'];
   result.ok=result.ok&&links.length===expected.length&&result.links.every(function(x,i){return x.text===expected[i]&&x.hit;});send(result);return;
  }
  if(links.length===1&&cfg.used===0){
   result.ok=result.ok&&links[0].textContent==='특수 기술'&&/dynamic\s+\$суперудар_14/.test(links[0].getAttribute('href')||'')&&hit(links[0])&&!/물약 사용|무기 변경|일반 공격|방어/.test(panel.textContent);
   if(!result.ok){send(result);return;}
   /* Local gate only; click the original href unchanged. No intermediate EXEC metrics. */
   ended=true;click(links[0]);return;
  }
  result.ok=result.ok&&links.length===0&&/특수 기술\s*\(사용 완료\)/.test(panel.textContent)&&!!panel.querySelector('[aria-disabled="true"]');
  send(result);
 }
 window.onerror=function(m,url,line){if(/msg\.style/.test(String(m)))return false;send({caseName:cfg.name,ok:false,error:String(m),line:line});return false;};setTimeout(function(){probe(0);},300);
}.toString()+')('+JSON.stringify(cfg)+');';new vm.Script(s.replace(/\r?\n/g,' '));return s.replace(/\r?\n/g,' ');}
function panelCapture(){return [
 'local qa_arena_start=instr($MAINTXT, '+q("id = 'fight_options_ui2'")+')',
 'if qa_arena_start=0: qa_arena_start=instr($MAINTXT, '+q('id = "fight_options_ui2"')+')',
 'if qa_arena_start=0: qa_arena_start=instr($MAINTXT, '+q("id = 'fight_options'")+')',
 'if qa_arena_start=0: qa_arena_start=instr($MAINTXT, '+q('id = "fight_options"')+')',
 check('qa_arena_start>0','MATRIX_PANEL'),"$qa_arena_panel=$mid($MAINTXT,qa_arena_start)","$qa_arena_panel=$mid($qa_arena_panel,1,instr($qa_arena_panel,'</div>')+5)"
 ].join('\n');}
function fixture(raw,prime,cfg,marker){const d=core.parse(raw),renderer=body(d,'боевой_интерфейс');
 const html='<a id="qa_arena_callback" style="display:none" href="#">QA</a><script>'+driver(cfg)+'</script>';
 if(cfg.kind!=='matrix')set(d,'боевой_интерфейс',renderer+'\r\nqa_arena_render_calls+=1\r\n*p '+q(html));
 if(cfg.kind==='arena')set(d,'атака_игрока','qa_arena_attack_calls+=1\r\nqa_arena_attack_arg=args[0]\r\n'+body(d,'атака_игрока'));
 const start=['killall','usehtml=1','SHOWOBJS 0','SHOWACTS 0','SHOWINPUT 0','SHOWSTAT 0','INTEGRATED_ACTIONS=1','HIDE_SCROLL_ARROWS=1','DISABLESCROLL=1',"$FNAME='Sandoll 미생'",prime,"gs 'refresh_database'","$onnewloc=''","$counter=''","$ongload=''",'sound_on=0','snk_room_target=0',"killvar 'jo9_fog'","killvar 'jo9_combat'","gs 'раскладка_бой'",'qa_arena_render_calls=0','qa_arena_attack_calls=0','qa_arena_attack_arg=0','qa_arena_dom_ok=0','qa_arena_matrix_count=0',
 'hero_choice=1','combatant=1','arena_mode=1','colosseum_fight=0','количество_врагов=1','текущий=1','враг[1]=1','поверженные_враги=0','тр=0',"$враг[1]='hoplite_e'","$имя_врага[1]=$название_моба[$враг[1]]","$класс_врага[1]=$класс_моба[$враг[1]]",'здоровье_врага[1]=1000','выносливость_врага[1]=1000','дух_врага[1]=1000','макс_здоровье_игрока=1000','макс_выносливость_игрока=1000','норм_дух_игрока=1000','здоровье_игрока=1000','выносливость_игрока=1000','дух_игрока=1000','base_str=4','base_flagelation=4','сила=4','ловкость=4','восприятие=4',
 "$combatant_ava='content/pic/master/master_noble.png'","$combatant_name='대회 UI 검증'","$place='colosseum_arena'","$fight_return='Start'","$оружие='секира'","$вторичный=''","$броня='qa_no_armor'","$броня_снять['qa_no_armor']=''","$итог_боя=''","$g_type='kimerian'","$extra_special_active='content/pic/ui/buttons/legacy/heavy_active.png'","$extra_special_used='content/pic/ui/buttons/legacy/heavy_used.png'",'ui_style=2'];
 if(cfg.kind==='matrix'){
  for(const style of STYLES)for(const skin of [0,2])for(const used of [0,1])start.push('*clr',"killvar 'суперудар_сделан'",'arena_mode=1','combatant=1','ui_style='+skin,'$g_type='+q(style[0]),'суперудар_сделан['+style[1]+']='+used,'$extra_special_active='+q('content/pic/ui/buttons/legacy/'+style[2]+'_active.png'),'$extra_special_used='+q('content/pic/ui/buttons/legacy/'+style[2]+'_used.png'),"gs 'боевое_меню'","gs 'боевой_интерфейс'",panelCapture(),check("instr($qa_arena_panel,'<img')=0",'MATRIX_NO_IMAGE_'+style[0]+skin+used),check(used?"instr($qa_arena_panel,'href')=0 and instr($qa_arena_panel,'사용 완료')>0":"instr($qa_arena_panel,'$суперудар_"+style[1]+"')>0 and instr($qa_arena_panel,'특수 기술')>0",'MATRIX_CONTRACT_'+style[0]+skin+used),check("instr($qa_arena_panel,'물약 사용')=0 and instr($qa_arena_panel,'무기 변경')=0",'MATRIX_RESTRICTIONS'),'qa_arena_matrix_count+=1');
  for(const role of [0,1,2])for(const skin of [0,2])start.push('*clr','arena_mode=0','combatant='+role,'ui_style='+skin,"gs 'боевое_меню'","gs 'боевой_интерфейс'",panelCapture(),check("instr($qa_arena_panel,'일반 공격')>0 and instr($qa_arena_panel,'물약 사용')>0 and instr($qa_arena_panel,'무기 변경')>0 and instr($qa_arena_panel,'방어')>0",'MATRIX_NORMAL_'+role+skin),check(role===0?"instr($qa_arena_panel,'특수 기술')>0":"instr($qa_arena_panel,'특수 기술')=0",'MATRIX_MASTER_ONLY_SPECIAL'),'qa_arena_matrix_count+=1');
  start.push(check('qa_arena_matrix_count=26','MATRIX_ALL'),'msg '+q(marker));
 }else start.push('arena_mode='+(cfg.kind==='normal'?0:1),'combatant='+(cfg.kind==='normal'?cfg.role:1),"killvar 'суперудар_сделан'",'суперудар_сделан[14]='+(cfg.used||0),"gs 'боевое_меню'","gs 'боевой_интерфейс'");
 set(d,'Start',start.join('\n'));const done=[check('qa_arena_dom_ok=1','DOM')];
 if(cfg.kind==='matrix')done.push(check('qa_arena_matrix_count=26','MATRIX_ALL'));
 else if(cfg.kind==='arena')done.push(check('arena_mode=1 and combatant=1','ARENA_MODE_PRESERVED'),check('суперудар_сделан[14]=1','USED_GUARD'),check('qa_arena_attack_calls='+(cfg.used?0:1),'ATTACK_ONCE'),check(cfg.used?'qa_arena_render_calls=1':'qa_arena_render_calls=2 and qa_arena_attack_arg=24','ACTUAL_ORIGINAL_ACTION'));
 else done.push(check('arena_mode=0 and combatant='+cfg.role+' and qa_arena_render_calls=1','NORMAL_ROLE_PRESERVED'));
 done.push('msg '+q(marker));add(d,'qa_arena_done',done.join('\n'));const bytes=core.serialize(d);assert(core.serialize(core.parse(bytes)).equals(bytes));return {bytes,rendererSha256:hash(Buffer.from(renderer))};}
function options(argv){const o={engine:WORK+'/engine/jack.exe',timeout:30};for(let i=0;i<argv.length;i++){const k=argv[i].replace(/^--/,'');if(['run','self-check','list'].includes(k))o[k]=true;else if(['candidate','game-dir','state-save','out','engine','timeout','case'].includes(k))o[k]=argv[++i];else throw Error('Unknown '+argv[i]);}return o;}
function main(argv){const o=options(argv),cases=o.case?CASES.filter(x=>x.name===o.case):CASES;assert(cases.length,'Unknown case');if(o['self-check']||o.list){cases.forEach(driver);console.log(JSON.stringify({status:'SCRIPT_SELF_CHECK_ONLY',cases,nativeMatrixCases:26,flattenedDriverCompiled:true,engineExecuted:false},null,2));return;}
 for(const k of ['candidate','game-dir','state-save','out'])assert(o[k],'Missing '+k);const candidate=path.resolve(o.candidate),game=path.resolve(o['game-dir']),save=path.resolve(o['state-save']),out=path.resolve(o.out);gate.assertOutside(out,[WORK,REPO,game,'G:/somi/JO9O','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game']);assert(!fs.existsSync(out)||fs.readdirSync(out).length===0,'New/empty output only');
 const tracked=[candidate,save,path.join(game,'css/base.css'),path.join(game,'content/js/jo9_battle_log.js')],hashes=Object.fromEntries(tracked.map(p=>[p,hash(fs.readFileSync(p))]));const raw=fs.readFileSync(candidate),saved=codec.parse(fs.readFileSync(save)),prime=gate.primeState(saved),token=crypto.randomBytes(8).toString('hex').toUpperCase(),prepared=cases.map(cfg=>{const marker='JO9_QA_'+token+'_'+cfg.name.replace(/-/g,'_')+'_COMPLETE';return {cfg,marker,...fixture(raw,prime.code,cfg,marker)};});
 fs.mkdirSync(out,{recursive:true});fs.copyFileSync(path.join(game,'config.xml'),path.join(out,'config.xml'));fs.writeFileSync(path.join(out,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');for(const dir of ['css','content','fonts','json'])fs.symlinkSync(fs.realpathSync(path.join(game,dir)),path.join(out,dir),process.platform==='win32'?'junction':'dir');
 const plan=prepared.map(r=>{const p=path.join(out,r.cfg.name+'.qsp');fs.writeFileSync(p,r.bytes);return {name:r.cfg.name,file:p,marker:r.marker,checkpoint:r.cfg.kind==='matrix'?'26 original renderer string cases':r.cfg.kind==='arena'?'native DOM / original special href / consumed state':'ordinary role menu remains intact'};});const planPath=path.join(out,'plan.json');fs.writeFileSync(planPath,JSON.stringify(plan,null,2));const report={status:'PREPARED_ONLY',candidate,game,save,inputHashes:hashes,engineExecuted:false,caseCount:cases.length,nativeMatrixCases:cases.some(x=>x.kind==='matrix')?26:0};
 if(o.run){report.engineExecuted=true;const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',REPO+'/tools/qa/run-client-smoke.ps1','-Engine',path.resolve(o.engine),'-Plan',planPath,'-TimeoutSeconds',String(o.timeout)],{encoding:'utf8',windowsHide:true,timeout:(plan.length*Number(o.timeout)+15)*1000,maxBuffer:8*1024*1024});fs.writeFileSync(path.join(out,'runner.log'),(run.stdout||'')+(run.stderr||''));const r=path.join(out,'client-results.json');report.client=fs.existsSync(r)?JSON.parse(fs.readFileSync(r,'utf8').replace(/^\uFEFF/,'')):[];report.cases=cases.map(cfg=>({name:cfg.name,nativeOnly:cfg.kind==='matrix',payload:ui.readNativePayload(path.join(out,cfg.name+'-stderr.log'),'qa_arena_payload')}));report.status=!run.error&&run.status===0&&report.client.length===cases.length&&report.client.every(x=>x.pass)&&report.cases.every(x=>x.nativeOnly||x.payload&&x.payload.ok)?'PASS':'FAIL';if(run.error)report.runnerError=run.error.message;}
 report.inputsUnchanged=tracked.every(p=>hash(fs.readFileSync(p))===hashes[p]);if(!report.inputsUnchanged)report.status='FAIL';fs.writeFileSync(path.join(out,'arena-ui-native-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.status==='FAIL')process.exitCode=1;}
if(require.main===module)try{main(process.argv.slice(2));}catch(e){console.error(e.stack||String(e));process.exitCode=2;}module.exports={CASES,STYLES,driver,fixture,main};
