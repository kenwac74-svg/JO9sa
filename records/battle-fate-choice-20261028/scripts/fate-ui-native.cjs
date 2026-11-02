'use strict';
// Diagnostic-only FastQSP DOM test. Does not modify candidate/game/save inputs.
// node fate-ui-native.cjs --candidate QSP --game-dir CANDIDATE_GAME --state-save SAVE --out NEW_EMPTY_DIR [--case NAME] [--run]
// --self-check / --list: read-only script checks, no fixtures, no engine launch.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const REPO = 'G:/somi/JO9sa';
const WORK = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const core = require(REPO + '/tools/text-workshop/core.cjs');
const codec = require(REPO + '/tools/qa/save-codec.cjs');
const gate = require(REPO + '/tools/qa/release-check.cjs');
const RUNNER = REPO + '/tools/qa/run-client-smoke.ps1';
const HELPER = 'jo9_battle_fate';
const CASES = [
  {name: 'fate-ui-fog-execute', mode: 1, source: 'normal', enemy: 'ogre', place: 'edge_patrol', choice: 1},
  {name: 'fate-ui-arena-spare', mode: 2, source: 'arena', enemy: 'hoplite_b', place: 'colosseum_arena', choice: 2}
];
const q = value => "'" + String(value).replace(/'/g, "''") + "'";
const cr = value => value.replace(/\r?\n/g, '\r\n');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function body(doc, name) {
  const loc = doc.locations.find(row => row.name === name);
  assert(loc, 'Missing location ' + name);
  return core.shift(doc.lines[loc.body], 5);
}
function setBody(doc, name, value) {
  const loc = doc.locations.find(row => row.name === name);
  assert(loc, 'Missing location ' + name);
  doc.lines[loc.body] = core.shift(cr(value), -5);
}
function add(doc, name, value) {
  assert(!doc.locations.some(row => row.name === name), 'Duplicate diagnostic location ' + name);
  doc.lines.splice(-1, 0, core.shift(name, -5), core.shift('', -5), core.shift(cr(value), -5), core.shift('0', -5));
  doc.lines[3] = core.shift(String(doc.locations.length + 1), -5);
  doc.locations = core.parse(core.serialize(doc)).locations;
}
function checkQsp(condition, tag) {
  return ["if (" + condition + ") = 0:", " msg " + q('FAIL_FATE_UI_' + tag), ' exit', 'end'].join('\n');
}
function driver(config) {
  return '(' + function (cfg) {
    var started = Date.now(), root = null, ended = false, samples = [], visibility = [];
    function rect(node) {
      if (!node) return null;
      var r = node.getBoundingClientRect();
      return {x:r.left, y:r.top, width:r.width, height:r.height, right:r.right, bottom:r.bottom};
    }
    function overlap(a,b) { return !!a && !!b && Math.min(a.right,b.right)-Math.max(a.x,b.x)>1 && Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>1; }
    function hit(node) {
      if (!node) return false;
      var r=rect(node), top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      return r.width>0 && r.height>0 && (top===node || node.contains(top));
    }
    function each(nodes, fn) { for(var i=0;i<nodes.length;i++) fn(nodes[i],i); }
    function attrs(node) {
      if(!node) return null;
      var style=getComputedStyle(node);
      return {tag:node.tagName, text:node.textContent, href:node.getAttribute('href'),
        ariaDisabled:node.getAttribute('aria-disabled'), rect:rect(node), hit:hit(node),
        pointerEvents:style.pointerEvents, display:style.display, visibility:style.visibility};
    }
    function nodes(parent, selector) {
      var answer=[]; if(parent) each(parent.querySelectorAll(selector),function(node){answer.push(attrs(node));}); return answer;
    }
    function boxes() {
      var choices=root.querySelector('#jo9_fate_choices'), log=root.querySelector('#fight_txt'), rows=[];
      each(choices ? choices.querySelectorAll('.jo9-battle-fate-row') : [],function(row){rows.push(rect(row));});
      return {root:rect(root), stage:rect(root.querySelector('#fight_bg')), log:rect(log),
        logSkin:rect(root.querySelector('.jo9-battle-log-skin')), choices:rect(choices), rows:rows,
        thumb:rect(root.querySelector('#fight_subtions')), ally:rect(root.querySelector('#ally_combat_ui')),
        enemy:rect(root.querySelector('#enemy_combat_ui'))};
    }
    function metric(label) {
      var choices=root.querySelector('#jo9_fate_choices'), thumb=root.querySelector('#fight_subtions'),
        effect=root.querySelector('.jo9-battle-execution'), es=effect?getComputedStyle(effect):null,
        ep=root.querySelector('#enemy_combat_ui'), hp=ep&&ep.querySelector('#combat_ui_health center'),
        stamina=ep&&ep.querySelector('#combat_ui_stamina center'), image=effect&&effect.querySelector('img'),
        geometry=boxes();
      return {sample:label, elapsed:Date.now()-started, viewport:[innerWidth,innerHeight],
        rootClass:root.className, geometry:geometry,
        choices:nodes(choices,'.jo9-battle-fate-row > a, .jo9-battle-fate-row > span'),
        choiceAnchors:choices?choices.querySelectorAll('a[href]').length:0,
        thumbAnchors:thumb?thumb.querySelectorAll('a[href]').length:0,
        thumbDisabled:!!thumb&&!!thumb.querySelector('[aria-disabled="true"]'),
        thumbReady:nodes(thumb,'a[href]'), enemyHP:hp?hp.textContent.trim():null,
        enemyStamina:stamina?stamina.textContent.trim():null,
        logChoicesOverlap:overlap(geometry.log,geometry.choices),
        rowsOverlap:geometry.rows.length===2&&overlap(geometry.rows[0],geometry.rows[1]),
        effect:effect?{rect:rect(effect),parentId:effect.parentNode.id,
          directLayerChild:effect.parentNode===root.querySelector('#jo9_battle_fx_layer'),
          visibility:es.visibility, opacity:es.opacity, position:es.position,
          pointerEvents:es.pointerEvents, transform:es.webkitTransform||es.transform,
          animation:es.webkitAnimationName||es.animationName,
          imageLoaded:!!image&&image.complete&&image.naturalWidth>0}:null};
    }
    function click(node) {
      var event=document.createEvent('MouseEvents');
      event.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);
      node.dispatchEvent(event);
    }
    function encode(value) { return encodeURIComponent(JSON.stringify(value)).replace(/'/g,'%27'); }
    function stillHere() { return root && root===document.getElementById('jo9_battle_test_v01'); }
    function sendFinal(ok, error) {
      if(ended || !stillHere()) return;
      ended=true;
      var callback=document.getElementById('qa_fate_ui_callback');
      if(!callback) return;
      var payload={caseName:cfg.caseName||cfg.name, fixtureName:cfg.name, fixturePhase:cfg.phase,
        mode:cfg.mode, choice:cfg.choice, ok:!!ok,
        error:error||null, samples:samples, visibilityTransitions:visibility};
      callback.setAttribute('href',"EXEC: $qa_fate_ui_final='"+encode(payload)+
        "' & qa_fate_ui_dom_final_ok="+Number(!!ok)+" & gs 'qa_fate_ui_done'");
      click(callback);
    }
    function required(sample) {
      var g=sample.geometry;
      return g.stage&&g.log&&g.choices&&g.thumb&&g.ally&&g.enemy&&g.rows.length===2&&
        !sample.logChoicesOverlap&&!sample.rowsOverlap&&
        g.rows[0].width>0&&g.rows[0].height>0&&g.rows[1].height>0;
    }
    function pending() {
      var sample=metric('pending'); samples.push(sample);
      var rows=sample.choices, choices=root.querySelector('#jo9_fate_choices'),
        links=choices?choices.querySelectorAll('a[href]'):[], execute=null, spare=null;
      each(links,function(link){
        var href=link.getAttribute('href')||'';
        if(/jo9_battle_fate/.test(href)&&/['"]apply['"]\s*,\s*1\b/.test(href)) execute=link;
        if(/jo9_battle_fate/.test(href)&&/['"]apply['"]\s*,\s*2\b/.test(href)) spare=link;
      });
      var disabled=choices&&choices.querySelector('.jo9-battle-fate-row + .jo9-battle-fate-row > span[aria-disabled="true"]');
      var ok=required(sample)&&rows.length===2&&sample.thumbAnchors===0&&sample.thumbDisabled&&
        !!execute&&hit(execute)&&!sample.effect&&
        (cfg.mode===1 ? sample.choiceAnchors===1&&!!disabled&&!disabled.hasAttribute('href')&&
          getComputedStyle(disabled).pointerEvents==='none' :
          sample.choiceAnchors===2&&!!spare&&hit(spare)&&!disabled);
      var selected=cfg.choice===1?execute:spare, original=selected&&selected.getAttribute('href');
      var payload={caseName:cfg.caseName||cfg.name, fixtureName:cfg.name, fixturePhase:cfg.phase,
        mode:cfg.mode, choice:cfg.choice, ok:!!ok,
        sample:sample, originalHref:original||null, disabled:attrs(disabled)};
      if(!ok || !selected || !/^EXEC:/i.test(original||'')) {
        sendFinal(false,'PENDING_CONTRACT_FAILED'); return;
      }
      if(cfg.phase==='final') {
        /* A successful local DOM gate is required; the actual choice href is never modified or preceded by EXEC. */
        ended=true;
        click(selected);
        return;
      }
      /* This pending-only process terminates at a native MSG. It never proceeds to a choice. */
      var callback=document.getElementById('qa_fate_ui_callback');
      callback.setAttribute('href',"EXEC: $qa_fate_ui_pending='"+encode(payload)+
        "' & qa_fate_ui_dom_pending_ok=1 & gs 'qa_fate_ui_done'");
      ended=true;
      click(callback);
    }
    function finalState() {
      var lastVisibility=null, interval=setInterval(function(){
        if(!stillHere()){clearInterval(interval);return;}
        var effect=root.querySelector('.jo9-battle-execution'),
          value=effect?getComputedStyle(effect).visibility:'absent';
        if(value!==lastVisibility){visibility.push({elapsed:Date.now()-started,value:value});lastVisibility=value;}
      },20);
      [25,125,350,600,750,1000].forEach(function(delay){setTimeout(function(){
        if(stillHere())samples.push(metric('final-'+delay));
      },delay);});
      setTimeout(function(){
        clearInterval(interval);
        if(!stillHere())return;
        var ok=samples.length===6;
        for(var i=0;i<samples.length;i++){
          var s=samples[i];
          ok=ok&&required(s)&&s.choices.length===2&&s.choiceAnchors===1&&
            s.choices[0].tag==='SPAN'&&s.choices[1].tag==='A'&&
            /계속/.test(s.choices[1].text)&&/выход_из_боя/.test(s.choices[1].href||'')&&
            s.choices[1].hit&&s.thumbAnchors===1&&!s.thumbDisabled&&
            s.thumbReady.length===1&&s.thumbReady[0].hit&&
            s.enemyHP===(cfg.choice===1?'0':'1');
          if(cfg.choice===2)ok=ok&&s.enemyStamina==='0'&&!s.effect;
          else ok=ok&&!!s.effect&&s.effect.directLayerChild&&s.effect.parentId==='jo9_battle_fx_layer'&&
            s.effect.position==='absolute'&&s.effect.pointerEvents==='none'&&
            s.effect.transform==='none'&&(s.effect.animation==='none'||s.effect.animation==='');
        }
        if(cfg.choice===1) {
          ok=ok&&samples.some(function(s){return s.elapsed<250&&s.effect&&s.effect.visibility==='visible';})&&
            samples[samples.length-1].effect&&samples[samples.length-1].effect.visibility==='hidden'&&
            samples.some(function(s){return s.effect&&s.effect.imageLoaded;});
        }
        sendFinal(ok,ok?null:'FINAL_DOM_OR_FX_CONTRACT_FAILED');
      },1080);
    }
    function begin(tries) {
      root=document.getElementById('jo9_battle_test_v01');
      if(!root){if(tries<30){setTimeout(function(){begin(tries+1);},30);}return;}
      var choices=root.querySelector('#jo9_fate_choices');
      if(!choices){sendFinal(false,'CHOICES_NODE_MISSING');return;}
      var isFinal=!!choices.querySelector('.jo9-battle-fate-message');
      if(isFinal)finalState();
      else setTimeout(function(){if(stillHere())pending();},300);
    }
    window.onerror=function(message,url,line){
      if(/msg\.style/.test(String(message)))return false;
      sendFinal(false,'JS_ERROR '+String(message)+' line '+line); return false;
    };
    begin(0);
  }.toString() + ')(' + JSON.stringify(config) + ');';
}
function embeddedDriver(config) {
  const source=driver(config).replace(/\r?\n/g,' ');
  new vm.Script(source); // Validate the exact flattened source that QtWebKit receives.
  return source;
}
function buildFixture(raw, prime, cfg, marker) {
  cfg={phase:'final',caseName:cfg.name,...cfg};
  const doc=core.parse(raw), renderer=body(doc,'конец_боя'), helper=body(doc,HELPER);
  assert(renderer.includes("$jo9_fate['page']"), 'Candidate result renderer must capture the real HTML cache');
  const html='<a id="qa_fate_ui_callback" style="display:none" href="#">QA</a>'+
    '<span id="qa_fate_ui_renderer_tail" style="display:none">renderer-tail</span>'+
    '<script>'+embeddedDriver(cfg)+'</script>';
  // Run the entire original renderer first. Only its diagnostic tail adds DOM instrumentation and recaptures the same real page.
  setBody(doc,'конец_боя',renderer+'\r\n'+[
    'qa_fate_ui_renderer_tail += 1',
    '*p '+q(html),
    "if jo9_fate['phase'] = 1: $jo9_fate['page'] = $MAINTXT"
  ].join('\n'));
  // Observational counters only; no mutation/guard/render branch is replaced.
  setBody(doc,HELPER,[
    "if $args[0] = 'apply': qa_fate_ui_apply_calls += 1",
    "if $args[0] = 'render': qa_fate_ui_render_calls += 1",
    helper
  ].join('\n'));
  const setup=[
    'killall','usehtml=1','SHOWOBJS 0','SHOWACTS 0','SHOWINPUT 0','SHOWSTAT 0',
    'INTEGRATED_ACTIONS=1','HIDE_SCROLL_ARROWS=1','DISABLESCROLL=1',"$FNAME='Sandoll 미생'",
    prime,"gs 'refresh_database'","$onnewloc=''","$counter=''","$ongload=''","sound_on=0",
    'snk_room_target=0',"killvar 'jo9_fog'","killvar 'jo9_combat'",
    "gs 'раскладка_бой'",
    "killvar '$враг'","killvar 'враг'","killvar '$действия_врага'","killvar 'труп'",
    "killvar 'в_отключке'","killvar '$трофей'","killvar '$состояние'",
    'hero_choice=1','combatant=0','arena_mode='+(cfg.mode===2?1:0),'colosseum_fight=0',
    'challenge_type=0','get_girl=0','fog_battle=0','is_home=1','ui_style=2',
    'количество_врагов=1','текущий=1','враг[1]=1','поверженные_враги=0','тр=0',
    '$враг[1]='+q(cfg.enemy),"$имя_врага[1]=$название_моба[$враг[1]]",
    "$класс_врага[1]=$класс_моба[$враг[1]]",
    'здоровье_врага[1]=0','выносливость_врага[1]=90','дух_врага[1]=80',
    'макс_здоровье_игрока=100','макс_выносливость_игрока=90','норм_дух_игрока=80',
    'здоровье_игрока=90','выносливость_игрока=80','дух_игрока=70',
    "$combatant_ava='content/pic/master/master_noble.png'","$combatant_name='처분 UI 검증'",
    '$place='+q(cfg.place),"$fight_return="+q(cfg.mode===2?'Start':'city_menu_form'),
    "$оружие='кинжал'","$вторичный='кастет'","$броня='qa_fate_ui_no_armor'",
    "$броня_снять['qa_fate_ui_no_armor']=''",
    "$extra_special_used='content/pic/ui/buttons/legacy/shield_used.png'",
    "$боевая_обстановка='전투 결과와 처분 선택의 영역을 확인합니다.'",
    "$действия_игрока='플레이어의 마지막 공격 기록입니다.'",
    "$действия_врага[1]='상대의 마지막 전투 기록입니다.'",
    "$итог_боя=''",'qa_fate_ui_apply_calls=0','qa_fate_ui_render_calls=0',
    'qa_fate_ui_renderer_tail=0','qa_fate_ui_start_tail=0',
    'qa_fate_ui_dom_pending_ok=0','qa_fate_ui_dom_final_ok=0',
    "gs '"+HELPER+"', 'init', "+q(cfg.source),
    checkQsp("jo9_fate['mode'] = "+cfg.mode,'INIT_MODE'),
    "qa_fate_ui_stage_accepted=func('"+HELPER+"', 'stage', 1, 1)",
    checkQsp("qa_fate_ui_stage_accepted=1 and jo9_fate['count']=1 and враг[1]=0",'STAGE'),
    checkQsp("тр=0 and труп["+q(cfg.enemy)+"]=0 and в_отключке["+q(cfg.enemy)+"]=0",'NO_EARLY_COMMIT'),
    "gs 'боевое_меню'","$итог_боя='победа'","gs 'конец_боя'",
    'qa_fate_ui_start_tail=1'
  ].join('\n');
  setBody(doc,'Start',setup);
  const done=(cfg.phase==='pending'?[
    checkQsp('qa_fate_ui_dom_pending_ok=1','PENDING_DOM_CHECKS'),
    checkQsp("jo9_fate['mode']="+cfg.mode+" and jo9_fate['phase']=1 and jo9_fate['count']=1 and jo9_fate_enemy[1]=1",'PENDING_NATIVE_STATE'),
    checkQsp('qa_fate_ui_apply_calls=0 and qa_fate_ui_render_calls=0','NO_CHOICE_EXECUTED'),
    checkQsp('qa_fate_ui_renderer_tail=1 and qa_fate_ui_start_tail=1','PENDING_ORIGINAL_RENDERER_COMPLETED'),
    checkQsp("тр=0 and труп["+q(cfg.enemy)+"]=0 and в_отключке["+q(cfg.enemy)+"]=0",'PENDING_NO_COMMIT'),
    checkQsp("здоровье_врага[1]=0 and выносливость_врага[1]=90 and jo9_fate['fx_played']=0",'PENDING_STATS_AND_FX_UNCHANGED'),
    'msg '+q(marker)
  ]:[
    checkQsp('qa_fate_ui_dom_final_ok=1','FINAL_DOM_CHECKS'),
    checkQsp("jo9_fate['mode']="+cfg.mode+" and jo9_fate['phase']=2 and jo9_fate['choice']="+cfg.choice,'ACTUAL_PHASE_TWO'),
    checkQsp('qa_fate_ui_apply_calls=1 and qa_fate_ui_render_calls=1','ACTUAL_EXEC_CALLBACK'),
    checkQsp('qa_fate_ui_renderer_tail=1 and qa_fate_ui_start_tail=1','ORIGINAL_RENDERER_COMPLETED'),
    checkQsp("jo9_fate['count']=0 and jo9_fate_enemy[1]=0 and тр=1",'LEDGER_ONCE'),
    checkQsp(cfg.choice===1 ?
      "труп["+q(cfg.enemy)+"]=1 and в_отключке["+q(cfg.enemy)+"]=0 and здоровье_врага[1]<=0 and jo9_fate['fx_played']=1" :
      "труп["+q(cfg.enemy)+"]=0 and в_отключке["+q(cfg.enemy)+"]=1 and здоровье_врага[1]>=1 and выносливость_врага[1]=0 and jo9_fate['fx_played']=0",'FINAL_NATIVE_STATE'),
    'msg '+q(marker)
  ]).join('\n');
  add(doc,'qa_fate_ui_done',done);
  const bytes=core.serialize(doc);
  assert(core.serialize(core.parse(bytes)).equals(bytes),'Diagnostic QSP roundtrip');
  return {raw:bytes,htmlBytes:Buffer.byteLength(html),rendererOriginalSha256:hash(Buffer.from(renderer)),
    helperOriginalSha256:hash(Buffer.from(helper)),diagnosticSeams:['Start','конец_боя append-only DOM sentinel/cache tail',
    'jo9_battle_fate observational entry counters','independent pending-only terminal fixture / final fixture with no intermediate EXEC metrics',
    'qa_fate_ui_done native-state assertions']};
}
function readNativeText(file) {
  const bytes=fs.readFileSync(file);
  try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{return new TextDecoder('euc-kr').decode(bytes);}
}
function readNativePayload(file, variable) {
  if(!fs.existsSync(file))return null;
  const text=readNativeText(file), re=new RegExp('\\$'+variable+"='([^']*)'\\s*&",'g');
  let match,latest=null;
  while((match=re.exec(text)))try{latest=JSON.parse(decodeURIComponent(match[1]));}catch{}
  return latest;
}
function compareRect(a,b,tolerance=1) {
  return !!a&&!!b&&['x','y','width','height','right','bottom'].every(key=>Math.abs(a[key]-b[key])<=tolerance);
}
function relativeRect(rect,root) {
  if(!rect||!root)return null;
  return {x:rect.x-root.x,y:rect.y-root.y,width:rect.width,height:rect.height,
    right:rect.right-root.x,bottom:rect.bottom-root.y};
}
function assess(pending,final,cfg) {
  const checks={pendingReceived:!!pending,finalReceived:!!final};
  if(!pending||!final)return {checks,pass:false};
  checks.caseIdentity=pending.caseName===cfg.name&&final.caseName===cfg.name&&pending.mode===cfg.mode&&final.choice===cfg.choice;
  checks.independentFixtureRoles=pending.fixturePhase==='pending'&&final.fixturePhase==='final';
  checks.pendingDOM=!!pending.ok;
  checks.finalDOM=!!final.ok;
  checks.realOriginalApplyLink=/^EXEC:/i.test(pending.originalHref||'')&&/jo9_battle_fate/.test(pending.originalHref||'')&&
    new RegExp("['\"]apply['\"]\\s*,\\s*"+cfg.choice+'\\b').test(pending.originalHref||'');
  const refs=pending.sample.geometry, samples=final.samples||[];
  checks.samples=samples.length===6;
  const changes=[];
  for(const sample of samples)for(const key of ['root','stage','log','logSkin','choices','thumb','ally','enemy']){
    const before=relativeRect(refs[key],refs.root),after=relativeRect(sample.geometry[key],sample.geometry.root);
    if(!compareRect(before,after))changes.push({sample:sample.sample,component:key,before,after});
  }
  for(const sample of samples)for(let i=0;i<2;i++)if(!compareRect(relativeRect(refs.rows[i],refs.root),relativeRect(sample.geometry.rows[i],sample.geometry.root)))
    changes.push({sample:sample.sample,component:'choice-row-'+i});
  checks.independentPendingFinalRootRelativeRects=changes.length===0;
  checks.finalCoreTemporalInvariant=samples.length>0&&samples.every(sample=>
    ['root','stage','log','logSkin','choices','thumb','ally','enemy'].every(key=>
      compareRect(sample.geometry[key],samples[0].geometry[key])));
  checks.noLogChoiceOrRowOverlap=samples.every(sample=>!sample.logChoicesOverlap&&!sample.rowsOverlap);
  if(cfg.choice===1){
    const visibility=final.visibilityTransitions||[], shown=visibility.findIndex(row=>row.value==='visible'),
      hidden=shown<0?null:visibility.slice(shown+1).find(row=>row.value==='hidden');
    checks.executionSeen=samples.some(sample=>sample.elapsed<250&&sample.effect&&sample.effect.visibility==='visible');
    checks.executionHiddenAfterDeadline=!!hidden&&hidden.elapsed>=450&&hidden.elapsed<=900&&
      !!samples.at(-1).effect&&samples.at(-1).effect.visibility==='hidden';
    checks.fixedEffectRectMatchesStage=samples.every(sample=>sample.effect&&compareRect(sample.effect.rect,sample.geometry.stage,2));
    checks.effectRectTemporalInvariant=samples.every(sample=>sample.effect&&compareRect(sample.effect.rect,samples[0].effect.rect));
  }else checks.spareHasNoExecutionEffect=samples.every(sample=>!sample.effect);
  return {checks,geometryChanges:changes,
    comparisonScope:'pending와final은같은후보·설정·리소스를쓰는별도네이티브프로세스입니다. root상대좌표를대조하며final시간축불변성은한프로세스실측입니다.',
    pass:Object.values(checks).every(Boolean)};
}
function options(argv) {
  const out={engine:WORK+'/engine/jack.exe',timeout:30};
  for(let i=0;i<argv.length;i++){
    const key=argv[i].replace(/^--/,'');
    if(['run','self-check','list'].includes(key))out[key]=true;
    else if(['candidate','game-dir','state-save','out','engine','timeout','case'].includes(key)){
      assert(argv[i+1]&&!argv[i+1].startsWith('--'),'Missing --'+key);out[key]=argv[++i];
    }else throw Error('Unknown argument '+argv[i]);
  }
  return out;
}
function main(argv) {
  const opt=options(argv);
  const cases=opt.case?CASES.filter(cfg=>cfg.name===opt.case):CASES;
  assert(cases.length,'Unknown --case '+opt.case+'; expected '+CASES.map(cfg=>cfg.name).join(', '));
  const executions=cases.flatMap(cfg=>['pending','final'].map(phase=>
    ({...cfg,caseName:cfg.name,name:cfg.name+'-'+phase,phase})));
  if(opt['self-check']||opt.list){
    for(const cfg of executions){embeddedDriver(cfg);assert(/^[a-z-]+$/.test(cfg.name));}
    console.log(JSON.stringify({status:opt.list?'LIST_ONLY':'SCRIPT_SELF_CHECK_ONLY',
      cases,fixtures:executions,flattenedDriverCompiled:true,engineExecuted:false,filesWritten:0},null,2));return;
  }
  for(const key of ['candidate','game-dir','state-save','out'])assert(opt[key],'--'+key+' is required');
  const candidate=path.resolve(opt.candidate),game=path.resolve(opt['game-dir']),
    stateSave=path.resolve(opt['state-save']),out=path.resolve(opt.out);
  gate.assertOutside(out,[WORK,'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game','G:/somi/JO9O',REPO,game]);
  assert(!fs.existsSync(out)||fs.readdirSync(out).length===0,'Output must be new or empty; no deletion or overwrite');
  const timeout=Number(opt.timeout);assert(Number.isInteger(timeout)&&timeout>=1&&timeout<=60,'Invalid --timeout');
  const raw=fs.readFileSync(candidate),saveRaw=fs.readFileSync(stateSave),saved=codec.parse(saveRaw);
  assert(codec.serialize(saved).equals(saveRaw),'Source save roundtrip');
  const tracked=[candidate,stateSave,path.join(game,'css/base.css'),path.join(game,'content/js/jo9_battle_log.js')];
  if(fs.existsSync(opt.engine))tracked.push(path.resolve(opt.engine));
  const hashes=Object.fromEntries(tracked.map(file=>[file,hash(fs.readFileSync(file))]));
  const prime=gate.primeState(saved),token=crypto.randomBytes(8).toString('hex').toUpperCase();
  const fixtures=executions.map(cfg=>{
    const marker='JO9_QA_'+token+'_'+cfg.name.replace(/-/g,'_')+'_COMPLETE';
    return {cfg,marker,prepared:buildFixture(raw,prime.code,cfg,marker)};
  });
  fs.mkdirSync(out,{recursive:true});
  const config=path.join(game,'config.xml');assert(fs.existsSync(config),'Candidate game config.xml missing');
  fs.copyFileSync(config,path.join(out,'config.xml'));
  fs.writeFileSync(path.join(out,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
  const resourcesLinked=[];
  for(const directory of ['css','content','fonts','json']){
    const source=path.join(game,directory);assert(fs.existsSync(source),'Missing resource directory '+source);
    const resolved=fs.realpathSync(source);
    fs.symlinkSync(resolved,path.join(out,directory),process.platform==='win32'?'junction':'dir');
    resourcesLinked.push({directory,target:resolved,writtenThroughLink:false});
  }
  const plan=fixtures.map(item=>{
    const file=path.join(out,item.cfg.name+'.qsp');fs.writeFileSync(file,item.prepared.raw);
    return {name:item.cfg.name,file,marker:item.marker,checkpoint:item.cfg.phase==='pending'?
      '원본결과renderer의pendingDOM/비활성thumb를검사하고nativephase1/count1/미정산MSG로종료. 선택없음.':
      'pendingDOMlocalgate통과시원래href무수정클릭. 중간EXEC계측없이phase2와650ms효과/finalDOM/정산1회MSG검사.'};
  });
  const planPath=path.join(out,'plan.json');fs.writeFileSync(planPath,JSON.stringify(plan,null,2)+'\n');
  const report={status:'PREPARED_ONLY',candidate,game,stateSave,inputHashes:hashes,
    engineExecuted:false,caseCount:cases.length,fixtureCount:fixtures.length,resourcesLinked,plan:planPath,
    fixtures:fixtures.map(item=>({name:item.cfg.name,mode:item.cfg.mode,choice:item.cfg.choice,
      diagnosticSeams:item.prepared.diagnosticSeams,htmlBytes:item.prepared.htmlBytes,
      rendererOriginalSha256:item.prepared.rendererOriginalSha256,helperOriginalSha256:item.prepared.helperOriginalSha256})),
    limits:['대표단일적2설정에pending-only/final을분리한4fixture입니다. 모든전투/스토리분기를검사하지않습니다.',
      'pending와final은별도프로세스입니다. 같은후보·설정·리소스의root상대좌표를대조하며동일연속프레임비교로보고하지않습니다.',
      'final내부효과수명과좌표불변은동일프로세스25~1000ms실측입니다. 중간QSP EXEC계측은전혀없습니다.',
      '세이브는대표값초기화에만사용합니다. 실제GUI세이브불러오기/CRC호환은검사하지않습니다.',
      '원본결과renderer와helper apply/render분기를실행하며진단Start/tail/카운터만추가합니다.',
      '생산/후보/원본세이브를쓰지않습니다. 효과시간은네이티브타이머허용오차를포함하고수동미술검토는별도입니다.']};
  if(opt.run){
    assert(fs.existsSync(opt.engine),'Native engine missing');
    report.engineExecuted=true;
    const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',RUNNER,
      '-Engine',path.resolve(opt.engine),'-Plan',planPath,'-TimeoutSeconds',String(timeout)],
      {encoding:'utf8',windowsHide:true,timeout:(plan.length*timeout+15)*1000,maxBuffer:8*1024*1024});
    fs.writeFileSync(path.join(out,'runner.log'),(run.stdout||'')+(run.stderr||''));
    const clients=path.join(out,'client-results.json');
    report.client=fs.existsSync(clients)?JSON.parse(fs.readFileSync(clients,'utf8').replace(/^\uFEFF/,'')):[];
    report.cases=cases.map(cfg=>{
      const pendingLog=path.join(out,cfg.name+'-pending-stderr.log'),finalLog=path.join(out,cfg.name+'-final-stderr.log'),
        pending=readNativePayload(pendingLog,'qa_fate_ui_pending'),final=readNativePayload(finalLog,'qa_fate_ui_final');
      return {name:cfg.name,pendingFixture:cfg.name+'-pending',finalFixture:cfg.name+'-final',
        pending,final,assessment:assess(pending,final,cfg)};
    });
    if(run.error)report.runnerError=run.error.message;
    report.status=!run.error&&run.status===0&&report.client.length===fixtures.length&&
      report.client.every(row=>row.pass)&&report.cases.every(row=>row.assessment.pass)?'PASS':'FAIL';
  }
  report.inputsUnchanged=tracked.every(file=>hash(fs.readFileSync(file))===hashes[file]);
  if(!report.inputsUnchanged)report.status='FAIL';
  fs.writeFileSync(path.join(out,'fate-ui-native-results.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:report.status,engineExecuted:report.engineExecuted,caseCount:report.caseCount,
    inputsUnchanged:report.inputsUnchanged,out,checks:report.cases&&report.cases.map(row=>({name:row.name,...row.assessment}))},null,2));
  if(report.status==='FAIL')process.exitCode=1;
}
if(require.main===module){try{main(process.argv.slice(2));}catch(error){console.error(error.stack||String(error));process.exitCode=2;}}
module.exports={CASES,driver,embeddedDriver,buildFixture,readNativeText,readNativePayload,assess,options,main};

