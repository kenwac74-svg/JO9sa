'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const input=JSON.parse(fs.readFileSync(__dirname+'/inputs.json','utf8')),{work,repo,tmp,assets}=input,cr=s=>s.replace(/\r?\n/g,'\r\n'),hash=p=>c.hash(fs.readFileSync(p));
for(const [f,h]of Object.entries(input.hashes))a.equal(hash(work+'/'+f),h,'WORK changed '+f);
const raw=fs.readFileSync(tmp+'/before/jack.qsp'),d=c.parse(raw),original=new Map(d.locations.map(l=>[l.name,c.shift(d.lines[l.body],5)])),current=new Map(original);
function once(s,old,rep){a.equal(s.split(old).length-1,1,'Unique anchor '+old.slice(0,110));return s.replace(old,rep);}
const mark=s=>cr('! JO9 MOD START BATTLE_FOLLOWUP_20261028\n'+s+'\n! JO9 MOD END BATTLE_FOLLOWUP_20261028');
const hit=JSON.parse(fs.readFileSync(__dirname+'/hit-snippets.json','utf8'));a.equal(hit.baselineSha256,c.hash(raw));
for(const e of hit.edits)current.set(e.location,once(current.get(e.location),e.old,e.new));
let result=current.get('конец_боя'),helper=current.get('jo9_battle_fate');
const start=result.indexOf('local $jo9_bv_standing = '),end=result.indexOf('! JO9 MOD END BATTLE_FATE_VISUAL_20261028',start);a(start>=0&&end>start);
const oldSprite=result.slice(start,end).trimEnd(),lookup=oldSprite.slice(0,oldSprite.indexOf("if $jo9_bv_image ! ''")).trimEnd();
const sprite=mark("if $args[0] = 'sprite':\n local jo9_bv_slot = args[1]\n $result = ''\n if jo9_bv_slot < 1 or jo9_bv_slot > количество_врагов: exit\n"+lookup.replaceAll('[текущий]','[jo9_bv_slot]').replace("if $итог_боя = 'победа':","if args[2] = 1:")+"\n $result = $jo9_bv_image\n exit\nend");
helper=once(helper,'result = 0','result = 0\r\n'+sprite);
const output=mark(`local jo9_bv_defeated = 0
if $итог_боя = 'победа': jo9_bv_defeated = 1
if $place = 'edge_patrol' and jo9_bv_defeated = 1 and количество_врагов > 1 and количество_врагов <= 5:
 *p '<div class="jo9-battle-monster-wrap jo9-battle-defeated-group jo9-group-count-<<количество_врагов>>">'
 local jo9_bv_slot = 1
 :jo9_bv_group_loop
 if jo9_bv_slot <= количество_врагов:
  local $jo9_bv_image = $func('jo9_battle_fate', 'sprite', jo9_bv_slot, 1)
  if $jo9_bv_image ! '': *p '<img class="jo9-group-slot-<<jo9_bv_slot>>" src="<<$jo9_bv_image>>" onerror="this.style.display=String.fromCharCode(110,111,110,101)">'
  jo9_bv_slot += 1
  jump 'jo9_bv_group_loop'
 end
 *p '</div>'
else
 local $jo9_bv_image = $func('jo9_battle_fate', 'sprite', текущий, jo9_bv_defeated)
 if $jo9_bv_image ! '': *p '<div class="jo9-battle-monster-wrap"><img id="jo9-battle-monster" src="<<$jo9_bv_image>>" onerror="this.style.display=String.fromCharCode(110,111,110,101)"></div>'
end`);
result=once(result,oldSprite+'\r\n',output+'\r\n');
helper=once(helper,"if jo9_fate['choice'] = 1 and jo9_fate['fx_played'] = 0:","if jo9_fate['choice'] = 1:");
helper=once(helper,`$jo9_bf_page = $replace($jo9_bf_page, '<div id = "fight_bg">', '<div id = "fight_bg"><div class="jo9-battle-execution"><img src="content/pic/ui/jo9_battle_test_v01/execution_red.png"></div>')`,`$jo9_bf_page = $replace($jo9_bf_page, '<div id="jo9_battle_fx_layer" class="jo9-battle-fx-layer" aria-hidden="true">', '<div id="jo9_battle_fx_layer" class="jo9-battle-fx-layer" aria-hidden="true"><div class="jo9-battle-execution"><img src="content/pic/ui/jo9_battle_test_v01/execution_red.png"></div>')`);
current.set('конец_боя',result);current.set('jo9_battle_fate',helper);
let city=current.get('interaction_screen_city');
const cityLine=`\t\t*p func('interior_change', 'jo9_html', '<div id = "bg"><img src="content\\pic\\<<$bg_path>>.png"></div>')`;
city=once(city,cityLine,mark(`local $jo9_cf_class = ''
if instr($bg_path, 'scene/arena_end') = 1: $jo9_cf_class = ' class="jo9-colosseum-end"'
*p func('interior_change', 'jo9_html', '<div id = "bg"<<$jo9_cf_class>>><img src="content\\pic\\<<$bg_path>>.png"></div>')`));current.set('interaction_screen_city',city);
for(const n of ['конец_боя','боевой_интерфейс'])current.set(n,current.get(n).replace(/jo9_battle_log\.js\?v=[A-Za-z0-9]+/g,'jo9_battle_log.js?v=20261028FOLLOWUP'));
const edits=[];for(const [name,s]of current)if(s!==original.get(name)){const l=d.locations.find(x=>x.name===name),after=cr(s);d.lines[l.body]=c.shift(after,-5);edits.push({location:name,field:'body',old:original.get(name),new:after,count:1});}
const out=c.serialize(d);a(c.serialize(c.parse(out)).equals(out));fs.mkdirSync(__dirname+'/mods',{recursive:true});
const patch={id:'2026-10-28_battle_followup',description:'Battle hit types, fog standing and exact roster defeat scenes, borderless choices, persistent execution filter, scoped colosseum end sizing. Dialogue and protagonist art deferred.',before_sha256:c.hash(raw),after_sha256:c.hash(out),edits};
fs.writeFileSync(__dirname+'/mods/2026-10-28_battle_followup.json',JSON.stringify(patch,null,2)+'\n');fs.writeFileSync(tmp+'/jack.candidate.qsp',out);
let css=fs.readFileSync(tmp+'/before/css/base.css','utf8');
const cssStart=css.indexOf('/* JO9 MOD START BATTLE_FATE_CHOICE_20261028'),cssEnd=css.indexOf('/* JO9 MOD END BATTLE_FATE_CHOICE_20261028 */',cssStart)+'/* JO9 MOD END BATTLE_FATE_CHOICE_20261028 */'.length;
let block=css.slice(cssStart,cssEnd);a(cssStart>=0&&cssEnd>cssStart);
block=once(block,'height: 78px;','height: 73px;');block=once(block,'top: 724px;','top: 719px;');
block=once(block,'border: 1px solid rgba(62, 43, 28, 0.35);','border: 0;');block=once(block,'background: rgba(236, 218, 184, 0.18);','background: none;');
block=once(block,'  border-color: #654b36;\r\n  background: rgba(218, 192, 151, 0.3);\r\n  outline: 1px solid #654b36;\r\n  outline-offset: -2px;','  border: 0;\r\n  background: none;\r\n  outline: none;\r\n  text-decoration: underline;');
block=once(block,'border-color: rgba(62, 43, 28, 0.2);','border: 0;');block=once(block,'background: rgba(62, 43, 28, 0.05);','background: none;');
block=block.replaceAll('#fight_bg > .jo9-battle-execution','#jo9_battle_fx_layer > .jo9-battle-execution');
block=block.replace('/* The opaque red backdrop stays inside fight_bg, behind the separate monster sprite.\r\n   Its fixed rectangle and one visibility deadline do not change UI layout. */','/* Persistent stage-only filter, above the sprite and below no clickable UI. */');
block=once(block,'  left: 0;\r\n  top: 0;\r\n  width: 795px;','  left: 242px;\r\n  top: 0;\r\n  width: 795px;');
block=once(block,'  visibility: hidden;','  visibility: visible;');block=once(block,'  z-index: 1;\r\n  opacity: 1;','  z-index: 10;\r\n  opacity: 0.3;');
css=css.slice(0,cssStart)+block+css.slice(cssEnd)+cr('\n'+fs.readFileSync(__dirname+'/group-and-scene.css','utf8'));
let js=fs.readFileSync(tmp+'/before/content/js/jo9_battle_log.js','utf8');const jStart=js.indexOf('/* JO9 MOD START BATTLE_FATE_CHOICE_20261028 */');a(jStart>0);js=js.slice(0,jStart)+cr('/* JO9 MOD BATTLE_FOLLOWUP_20261028: execution is a persistent CSS filter and has no timer. */\n');
const game=tmp+'/candidate-game';a(!fs.existsSync(game));fs.mkdirSync(game,{recursive:true});
const overrides=new Map([['css/base.css',Buffer.from(css)],['content/js/jo9_battle_log.js',Buffer.from(js)],...assets.map(x=>[x.destination,fs.readFileSync(x.source)])]);for(const rel of overrides.keys())fs.mkdirSync(path.dirname(game+'/'+rel),{recursive:true});
function overlay(rel){const src=work+'/'+rel,dst=game+'/'+rel;fs.mkdirSync(dst,{recursive:true});for(const ent of fs.readdirSync(src,{withFileTypes:true})){const child=rel+'/'+ent.name,target=game+'/'+child;if(ent.isDirectory()){if(fs.existsSync(target))overlay(child);else fs.symlinkSync(fs.realpathSync(work+'/'+child),target,'junction');}else if(ent.isFile()&&!overrides.has(child))fs.copyFileSync(work+'/'+child,target);}}
overlay('css');overlay('content');for(const [f,b]of overrides)fs.writeFileSync(game+'/'+f,b);for(const dir of ['fonts','json'])fs.symlinkSync(fs.realpathSync(work+'/'+dir),game+'/'+dir,'junction');for(const f of ['config.xml','FastQSP.ini'])fs.copyFileSync(work+'/'+f,game+'/'+f);
const report={candidate:tmp+'/jack.candidate.qsp',game,qspBefore:c.hash(raw),qspAfter:c.hash(out),cssAfter:hash(game+'/css/base.css'),jsAfter:hash(game+'/content/js/jo9_battle_log.js'),modifiedLocations:edits.map(x=>x.location),addedLocations:[],assets};fs.writeFileSync(__dirname+'/candidate.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,assets:assets.length},null,2));
