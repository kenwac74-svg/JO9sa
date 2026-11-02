'use strict';
// Isolated DOM tests for original colosseum result routes and the active medic sprite.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict'),vm=require('node:vm');
const REPO='G:/somi/JO9sa',WORK='G:/somi/Jack O Nine Tails v2.4_work/game';
const core=require(REPO+'/tools/text-workshop/core.cjs'),codec=require(REPO+'/tools/qa/save-codec.cjs'),gate=require(REPO+'/tools/qa/release-check.cjs');
const ui=require('./fate-ui-native.cjs'),q=s=>"'"+String(s).replace(/'/g,"''")+"'",cr=s=>s.replace(/\r?\n/g,'\r\n'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const CASES=[
 {name:'colosseum-followup-master',kind:'scene',role:0,interaction:1296},
 {name:'colosseum-followup-slave',kind:'scene',role:1,interaction:1297},
 {name:'colosseum-followup-assistant',kind:'scene',role:2,interaction:1298},
 {name:'fog-active-medic',kind:'medic'}
];
function body(d,n){const l=d.locations.find(x=>x.name===n);assert(l,'Missing '+n);return core.shift(d.lines[l.body],5);}
function setBody(d,n,s){const l=d.locations.find(x=>x.name===n);assert(l,'Missing '+n);d.lines[l.body]=core.shift(cr(s),-5);}
function add(d,n,s){assert(!d.locations.some(x=>x.name===n));d.lines.splice(-1,0,core.shift(n,-5),core.shift('',-5),core.shift(cr(s),-5),core.shift('0',-5));d.lines[3]=core.shift(String(d.locations.length+1),-5);d.locations=core.parse(core.serialize(d)).locations;}
function check(s,t){return "if ("+s+")=0: msg "+q('FAIL_FOLLOWUP_'+t)+' & exit';}
function driver(cfg){const s='('+function(cfg){
 var done=false;
 function rect(n){if(!n)return null;var r=n.getBoundingClientRect();return {x:r.left,y:r.top,width:r.width,height:r.height,right:r.right,bottom:r.bottom};}
 function ends(n,v){return !!n&&String(n.getAttribute('src')||'').replace(/\\/g,'/').split('?')[0].slice(-v.length)===v;}
 function click(n){var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);n.dispatchEvent(e);}
 function send(payload){if(done)return;done=true;var n=document.getElementById('qa_followup_callback');if(!n)return;n.setAttribute('href',"EXEC: $qa_followup_payload='"+encodeURIComponent(JSON.stringify(payload)).replace(/'/g,'%27')+"' & qa_followup_dom_ok="+Number(payload.ok)+" & gs 'qa_followup_done'");click(n);}
 function probe(tries){
  var payload={caseName:cfg.name,kind:cfg.kind,ok:false},images=[],i;
  if(cfg.kind==='scene'){
   var all=document.querySelectorAll('#bg.jo9-colosseum-end'),box=null,im=null;
   for(i=0;i<all.length;i++){var candidate=all[i].querySelector('img');if(candidate&&/arena_end/.test(candidate.getAttribute('src')||'')){box=all[i];im=candidate;}}
   if(!box||!im||!im.complete||!im.naturalWidth){if(tries<40){setTimeout(function(){probe(tries+1);},50);return;}send(payload);return;}
   var b=rect(box),r=rect(im),caption=document.getElementById('text'),cs=getComputedStyle(im);
   payload.box=b;payload.image={src:im.getAttribute('src'),rect:r,width:im.naturalWidth,height:im.naturalHeight,display:cs.display};payload.caption=caption?caption.textContent:null;
   payload.ok=Math.abs(b.width-795)<1&&Math.abs(b.height-596)<1&&Math.abs(r.width-795)<1&&Math.abs(r.height-596)<1&&Math.abs(r.x-b.x)<1&&Math.abs(r.y-b.y)<1&&!!payload.caption&&
    /arena_end(?: \(2\))?\.png(?:\?|$)/.test(im.getAttribute('src')||'');
  }else{
   var root=document.getElementById('jo9_battle_test_v01'),image=root&&root.querySelector('#jo9-battle-monster'),stage=root&&root.querySelector('#fight_bg');
   if(!image||!stage||!image.complete||!image.naturalWidth){if(tries<40){setTimeout(function(){probe(tries+1);},50);return;}send(payload);return;}
   var ir=rect(image),sr=rect(stage);payload.stage=sr;payload.image={src:image.getAttribute('src'),rect:ir,width:image.naturalWidth,height:image.naturalHeight};
   payload.ok=ends(image,'content/pic/mob/medic.png')&&ir.width>0&&ir.height>0&&ir.x>=sr.x-1&&ir.y>=sr.y-1&&ir.right<=sr.right+1&&ir.bottom<=sr.bottom+1;
  }
  send(payload);
 }
 window.onerror=function(m,url,line){if(/msg\.style/.test(String(m)))return false;send({caseName:cfg.name,kind:cfg.kind,ok:false,error:String(m),line:line});return false;};
 setTimeout(function(){probe(0);},250);
}.toString()+')('+JSON.stringify(cfg)+');';new vm.Script(s.replace(/\r?\n/g,' '));return s.replace(/\r?\n/g,' ');}
function fixture(raw,prime,cfg,marker){
 const d=core.parse(raw),target=cfg.kind==='scene'?'interaction_screen_city':'боевой_интерфейс',original=body(d,target);
 const html='<a id="qa_followup_callback" style="display:none" href="#">QA</a><script>'+driver(cfg)+'</script>';
 setBody(d,target,original+'\r\n'+'qa_followup_renderer_tail+=1\r\n*p '+q(html));
 const start=[
  'killall','usehtml=1','SHOWOBJS 0','SHOWACTS 0','SHOWINPUT 0','SHOWSTAT 0','INTEGRATED_ACTIONS=1','HIDE_SCROLL_ARROWS=1','DISABLESCROLL=1',"$FNAME='Sandoll 미생'",
  prime,"gs 'refresh_database'","$onnewloc=''","$counter=''","$ongload=''",'sound_on=0','snk_room_target=0','qa_followup_renderer_tail=0','qa_followup_dom_ok=0',
  "killvar 'jo9_fog'","killvar 'jo9_combat'",'ui_style=2','is_home=1','npc=0',"$slave_name='검증 노예'","$assistant_name='검증 조수'"
 ];
 if(cfg.kind==='scene')start.push(
  "gs '_layout'",'interaction_city='+cfg.interaction,'combatant='+cfg.role,'colosseum_fight='+(cfg.role===0?4:cfg.role===1?14:34),
  "jo9_fate['mode']=2","jo9_fate['phase']=3","jo9_fate['choice']=1","$итог_боя='победа'","$place='colosseum'","$fight_return=''",
  'master_fighter=2','master_str=2','master_domination=1',"boost_up['master_fighter']=0",'master_energy=5',"slave['gladiatrix']=2","assistant['gladiatrix']=2","slave['stamina']=3","assistant['stamina']=3","slave_already_done_today['exertion']=0","assistant_already_done_today['exertion']=0",
  "gt 'interaction_city'"
 );
 else start.push(
  "gs 'раскладка_бой'","killvar '$враг'","killvar 'враг'",'hero_choice=1','combatant=0','arena_mode=0','colosseum_fight=0','количество_врагов=4','текущий=1','поверженные_враги=0','тр=0',
  ...[1,2,3,4].map(i=>"$враг["+i+"]="+q(i===1?'черный_медик':'подручный')+' & враг['+i+']=1 & здоровье_врага['+i+']=100 & выносливость_врага['+i+']=90 & дух_врага['+i+']=80 & $имя_врага['+i+']=$название_моба[$враг['+i+']]'),
  'макс_здоровье_игрока=100','макс_выносливость_игрока=90','норм_дух_игрока=80','здоровье_игрока=90','выносливость_игрока=80','дух_игрока=70',
  "$combatant_ava='content/pic/master/master_noble.png'","$combatant_name='의사 전신 검증'","$place='edge_patrol'","$fight_return='city_menu_form'","$оружие='кинжал'","$вторичный='кастет'","$броня='qa_no_armor'","$броня_снять['qa_no_armor']=''","$итог_боя=''","gs 'боевое_меню'","gs 'боевой_интерфейс'"
 );
 setBody(d,'Start',start.join('\n'));
 const native=[check('qa_followup_dom_ok=1','DOM'),check('qa_followup_renderer_tail=1','ORIGINAL_RENDERER_ONCE')];
 if(cfg.kind==='scene')native.push(check('interaction_city='+cfg.interaction,'ROLE_ROUTE'),check("$place='colosseum' and $return_lock='shop_general'",'RETURN'),check("combatant=0 and colosseum_fight=0 and $итог_боя=''",'ORIGINAL_RESET'),check("jo9_fate['mode']=2 and jo9_fate['phase']=3 and jo9_fate['choice']=1",'CHOICE_PRESERVED'));
 else native.push(check("количество_врагов=4 and враг[1]=1 and $враг[1]='черный_медик' and поверженные_враги=0",'ACTIVE_NOT_DEFEATED'));
 native.push('msg '+q(marker));add(d,'qa_followup_done',native.join('\n'));const bytes=core.serialize(d);assert(core.serialize(core.parse(bytes)).equals(bytes));return {bytes,seams:['Start',target+' append-only DOM instrumentation','qa_followup_done native assertions'],rendererSha256:hash(Buffer.from(original))};
}
function options(argv){const o={engine:WORK+'/engine/jack.exe',timeout:30};for(let i=0;i<argv.length;i++){const k=argv[i].replace(/^--/,'');if(['run','self-check','list'].includes(k))o[k]=true;else if(['candidate','game-dir','state-save','out','engine','timeout','case'].includes(k))o[k]=argv[++i];else throw Error('Unknown '+argv[i]);}return o;}
function main(argv){
 const o=options(argv),cases=o.case?CASES.filter(x=>x.name===o.case):CASES;assert(cases.length,'Unknown case');
 if(o['self-check']||o.list){cases.forEach(driver);console.log(JSON.stringify({status:'SCRIPT_SELF_CHECK_ONLY',cases,flattenedDriverCompiled:true,engineExecuted:false},null,2));return;}
 for(const k of ['candidate','game-dir','state-save','out'])assert(o[k],'Missing '+k);
 const candidate=path.resolve(o.candidate),game=path.resolve(o['game-dir']),save=path.resolve(o['state-save']),out=path.resolve(o.out);gate.assertOutside(out,[WORK,REPO,game,'G:/somi/JO9O','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game']);assert(!fs.existsSync(out)||fs.readdirSync(out).length===0,'New/empty output only');
 const tracked=[candidate,save,path.join(game,'css/base.css'),path.join(game,'content/js/jo9_battle_log.js')],hashes=Object.fromEntries(tracked.map(p=>[p,hash(fs.readFileSync(p))]));
 const raw=fs.readFileSync(candidate),saved=codec.parse(fs.readFileSync(save)),prime=gate.primeState(saved),token=crypto.randomBytes(8).toString('hex').toUpperCase();
 const prepared=cases.map(cfg=>{const marker='JO9_QA_'+token+'_'+cfg.name.replace(/-/g,'_')+'_COMPLETE';return {cfg,marker,...fixture(raw,prime.code,cfg,marker)};});
 fs.mkdirSync(out,{recursive:true});fs.copyFileSync(path.join(game,'config.xml'),path.join(out,'config.xml'));fs.writeFileSync(path.join(out,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 for(const dir of ['css','content','fonts','json'])fs.symlinkSync(fs.realpathSync(path.join(game,dir)),path.join(out,dir),process.platform==='win32'?'junction':'dir');
 const plan=prepared.map(r=>{const p=path.join(out,r.cfg.name+'.qsp');fs.writeFileSync(p,r.bytes);return {name:r.cfg.name,file:p,marker:r.marker,checkpoint:r.cfg.kind==='scene'?'original 1296/1297/1298 full result path / scoped 795x596 / phase3 preserved':'active four enemies / actual medic.png loads inside stage'};});
 const planPath=path.join(out,'plan.json');fs.writeFileSync(planPath,JSON.stringify(plan,null,2));const report={status:'PREPARED_ONLY',candidate,game,save,inputHashes:hashes,engineExecuted:false,caseCount:cases.length,seams:prepared.map(x=>({name:x.cfg.name,seams:x.seams,rendererSha256:x.rendererSha256}))};
 if(o.run){report.engineExecuted=true;const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',REPO+'/tools/qa/run-client-smoke.ps1','-Engine',path.resolve(o.engine),'-Plan',planPath,'-TimeoutSeconds',String(o.timeout)],{encoding:'utf8',windowsHide:true,timeout:(plan.length*Number(o.timeout)+15)*1000,maxBuffer:8*1024*1024});fs.writeFileSync(path.join(out,'runner.log'),(run.stdout||'')+(run.stderr||''));const r=path.join(out,'client-results.json');report.client=fs.existsSync(r)?JSON.parse(fs.readFileSync(r,'utf8').replace(/^\uFEFF/,'')):[];report.cases=cases.map(cfg=>({name:cfg.name,payload:ui.readNativePayload(path.join(out,cfg.name+'-stderr.log'),'qa_followup_payload')}));report.status=!run.error&&run.status===0&&report.client.length===cases.length&&report.client.every(x=>x.pass)&&report.cases.every(x=>x.payload&&x.payload.ok)?'PASS':'FAIL';if(run.error)report.runnerError=run.error.message;}
 report.inputsUnchanged=tracked.every(p=>hash(fs.readFileSync(p))===hashes[p]);if(!report.inputsUnchanged)report.status='FAIL';fs.writeFileSync(path.join(out,'followup-scene-ui-native-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.status==='FAIL')process.exitCode=1;
}
if(require.main===module)try{main(process.argv.slice(2));}catch(e){console.error(e.stack||String(e));process.exitCode=2;}
module.exports={CASES,driver,fixture,main};
