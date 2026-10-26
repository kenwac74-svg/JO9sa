'use strict';
// Prepares disposable real-QtWebKit click probes; never edits game/save inputs.
const fs = require('node:fs'), path = require('node:path');
const c = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const qa = require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const sc = require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const game = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const base = path.resolve('G:/Codex/tmp/jo9-insolvency-simple-20261025');
const input = path.resolve(process.argv[2] || path.join(base, 'candidate.qsp'));
const out = path.resolve(process.argv[3] || path.join(base, 'play-dom'));
const rel = path.relative(base, out);
if (!rel || rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) throw Error('Disposable subdirectory required');
qa.assertOutside(out, [game, 'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game', 'G:/somi/JO9O']);
const raw = fs.readFileSync(input), plan = [], prepared = [];
const q = s => "'" + String(s).replaceAll("'", "''") + "'";
const cr = s => s.replace(/\r?\n/g, '\r\n');
const A = (cond, tag) => `if ${cond}: msg 'FAIL_SIMPLE_DOM_${tag}' & exit`;
fs.mkdirSync(out, {recursive: true});
for (const n of ['css', 'content', 'fonts']) if (!fs.existsSync(path.join(out, n))) fs.symlinkSync(path.join(game, n), path.join(out, n), 'junction');
fs.cpSync(path.join(game, 'json'), path.join(out, 'json'), {recursive: true});
fs.copyFileSync(path.join(game, 'config.xml'), path.join(out, 'config.xml'));
fs.writeFileSync(path.join(out, 'FastQSP.ini'), '[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');

// Find and scroll a production anchor, require a topmost visible hit point, then
// dispatch its original EXEC. Only diagnostic metric assignments prefix it.
function clickScript(selector, contains) {
  return `(function(){var tries=0;function click(a){var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(e)}function fail(t){var a=document.createElement('a');a.href="EXEC: msg 'FAIL_SIMPLE_DOM_"+t+"'";document.body.appendChild(a);click(a)}function f(){var as=document.querySelectorAll(${JSON.stringify(selector)}),a=null;for(var i=0;i<as.length;i++){if(${contains.map(s => `as[i].getAttribute('href').indexOf(${JSON.stringify(s)})>=0`).join('||')}){a=as[i];break}}if(!a){if(++tries<120)setTimeout(f,50);else fail('NO_ANCHOR');return}var p=document.getElementById('text');if(p&&p.contains(a)){var pr=p.getBoundingClientRect(),ar=a.getBoundingClientRect();if(ar.bottom>pr.bottom)p.scrollTop+=ar.bottom-pr.bottom+5;if(ar.top<pr.top)p.scrollTop-=pr.top-ar.top+5}a.scrollIntoView(false);setTimeout(function(){var rs=a.getClientRects(),r=a.getBoundingClientRect(),ok=false,x=0,y=0;for(var j=0;j<rs.length;j++){var z=rs[j],l=Math.max(0,z.left),t=Math.max(0,z.top),rr=Math.min(window.innerWidth,z.right),bb=Math.min(window.innerHeight,z.bottom);if(rr>l&&bb>t){x=(l+rr)/2;y=(t+bb)/2;var h=document.elementFromPoint(x,y);if(h&&a.contains(h)){ok=true;break}}}if(!ok){if(++tries<120)setTimeout(f,50);else fail('ANCHOR_OCCLUDED');return}var metric=JSON.stringify({text:a.textContent,left:r.left,top:r.top,width:r.width,height:r.height,x:x,y:y,hit:true,scroll:p?p.scrollTop:0,viewport:[window.innerWidth,window.innerHeight]}),old=a.getAttribute('href');if(!/^exec:/i.test(old)){fail('NOT_EXEC');return}a.setAttribute('href',"EXEC: qa_dom_clicks+=1 & $qa_dom_metrics[qa_dom_clicks]='"+metric.replace(/'/g,"''")+"' & "+old.slice(old.indexOf(':')+1));click(a)},80)}setTimeout(f,200)}());`;
}
const script = js => '*p ' + q('<script type="text/javascript">' + js.replace(/\r?\n/g, ' ') + '</script>');
function fixture(number) {
  const name = {11: '11_assets-and-quick.sav', 12: '12_bill-settle-once.sav', 13: '13_occupied-assets.sav'}[number];
  const save = fs.readFileSync(path.join(game, 'save/JO9_MANUAL_20261025/01_검사완료재확인', name));
  const savedoc = sc.parse(save), prime = qa.primeState(savedoc);
  const d = c.parse(raw);
  const loc = n => {const l = d.locations.find(x => x.name === n); if (!l) throw Error('Missing ' + n); return l;};
  const get = n => c.shift(d.lines[loc(n).body], 5);
  const set = (n, s) => {d.lines[loc(n).body] = c.shift(cr(s), -5);};
  const append = (n, s) => set(n, get(n) + '\r\n' + s);
  const death = sc.value(savedoc, 'death')[1];
  if (!death.includes("gt 'exit'")) throw Error('Original saved death macro missing');
  const start = ['killall', 'settimer 0', prime.code, 'usehtml=1', "$counter=''", "$onnewloc=''", "$ongload=''", "gs 'refresh_database'", "$counter=''", "$onnewloc=''", "$ongload=''", 'sound_on=0', 'settimer 0', 'autosave=0', 'decadesave=0', 'autosave_day=0', 'autosave_decade=0', 'nsfw=1', 'snk_room_target=0', '$death={' + death + '}', 'qa_dom_clicks=0', 'qa_dom_visits=0', 'qa_original_day=day', 'is_home=1', 'city_district=-1'];
  return {name, save, d, get, set, append, start};
}
function finish(name, f, marker, evidence) {
  const bytes = c.serialize(f.d); qa.inspectWorld(bytes);
  const file = path.join(out, name + '.qsp'); fs.writeFileSync(file, bytes);
  plan.push({name, file, marker, checkpoint: evidence});
  prepared.push({name, fixture: f.name, fixtureHash: c.hash(f.save), sha256: c.hash(bytes)});
}

{
  const f = fixture(11), marker = 'JO9_QA_SIMPLEDOM_asset_chain_COMPLETE';
  f.start.push("jo9_lq['bill']=10000000", "savegame 'chain-before.sav'", "gt 'jo9_liquidation','view'");
  f.set('Start', f.start.join('\r\n'));
  f.append('jo9_liquidation', [
    'qa_dom_visits+=1', "qa_dom_pages[qa_dom_visits]=jo9_lq['page']", 'qa_dom_money[qa_dom_visits]=sparks',
    A('qa_dom_visits>6', 'CHAIN_LOOP'), "savegame 'chain-progress.sav'",
    script(clickScript('#text a', ["'dispose'", "'sell_person'"]))
  ].join('\r\n'));
  f.append('exit', [
    A("day ! 0 or $estate ! 'slum_house' or kulaconstruct ! 0 or slave_state ! CONST_INT['no_slave'] or assistant_state ! CONST_INT['no_slave']", 'CHAIN_FINAL_STATE'),
    A('qa_dom_clicks ! 4 or qa_dom_visits ! 4', 'CHAIN_FOUR_CLICKS'),
    A("qa_dom_pages[1] ! 0 or qa_dom_pages[2] ! 1 or qa_dom_pages[3] ! 2 or qa_dom_pages[4] ! 3", 'CHAIN_ORDER'),
    A("instr($args[0],'빚을 갚지 못한 노예상')=0", 'ORIGINAL_DEATH_TEXT'),
    'qa_dom_ending=1', "savegame 'chain-ending.sav'", `msg '${marker}'`
  ].join('\r\n'));
  finish('asset-chain', f, marker, 'Real bankruptcy links in #text, topmost hit tests, four decisions, original death macro and exit renderer. Diagnostic bill raised to 10000000 to require full exhaustion.');
}
{
  const f = fixture(12), marker = 'JO9_QA_SIMPLEDOM_bill_once_COMPLETE';
  f.start.push("gt 'jo9_liquidation','view'"); f.set('Start', f.start.join('\r\n'));
  f.append('jo9_liquidation', script(clickScript('#text a', ["'dispose'"])));
  f.append('main_screen', [
    A("jo9_lq['active'] ! 0 or sparks ! 360 or qa_dom_clicks ! 1 or day ! qa_original_day", 'BILL_ACTUAL_FINISH'),
    "gs 'jo9_liquidation','settle'", "gs 'jo9_liquidation','settle'", A('sparks ! 360', 'BILL_NO_SECOND_CHARGE'),
    "savegame 'bill-finished.sav'", `msg '${marker}'`
  ].join('\r\n'));
  finish('bill-once', f, marker, 'Real decor anchor click -> real finish -> menu_form -> main_screen, 460 refund less fixed100 bill=360, repeated settle remains360.');
}
{
  const f = fixture(13), marker = 'JO9_QA_SIMPLEDOM_manual_city_COMPLETE';
  f.start.push('master_energy=3', 'qa_master_ap=master_energy', 'qa_room_state=room4_state', 'qa_iced_state=iced_1_state', '$qa_room_name=$room4_name', '$qa_iced_name=$iced_1_name', 'qa_manual_money=sparks', "gt 'jo9_liquidation','view'");
  f.set('Start', f.start.join('\r\n'));
  f.append('jo9_liquidation', script(clickScript('#text a', ["'manual'"])));
  const checks = [A("day ! qa_original_day or sparks ! qa_manual_money or master_energy ! qa_master_ap or room4_state ! qa_room_state or iced_1_state ! qa_iced_state or $room4_name ! $qa_room_name or $iced_1_name ! $qa_iced_name or jo9_lq['active'] ! 1", 'MANUAL_RESIDENTS_AP')];
  f.append('main_screen', [...checks, A("jo9_lq['manual'] ! 1 or qa_dom_clicks ! 1", 'MANUAL_REAL_HOME'), "savegame 'manual-home.sav'", script(clickScript('#back_home a', ["city_menu_form"]))].join('\r\n'));
  f.append('city_screen', [...checks, A('qa_dom_clicks ! 2 or is_home ! 0', 'MANUAL_REAL_CITY'), "savegame 'manual-city.sav'", `msg '${marker}'`].join('\r\n'));
  finish('manual-city', f, marker, 'Real manual anchor -> production home menu -> topmost original home-exit door -> normal city menu and city screen; occupants, money, AP and day preserved.');
}
fs.writeFileSync(path.join(out, 'plan.json'), JSON.stringify(plan, null, 2));
fs.writeFileSync(path.join(out, 'prepared.json'), JSON.stringify({input, sourceHash: c.hash(raw), prepared, method: 'Production QtWebKit DOM synthetic mouse clicks, original EXEC preserved with diagnostic metric prefix; no fake gameplay links.', limits: ['Primed manual save state rather than native OPENGAME.', 'Diagnostics append click drivers and assertion checkpoints; no production location is replaced except Start.', 'Snapshot DOM hit-test metrics are recorded in diagnostic saves, not screenshot pixel comparisons.']}, null, 2));
console.log(JSON.stringify({input, out, sourceHash: c.hash(raw), cases: plan.length}));
