'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',work='G:/somi/Jack O Nine Tails v2.4_work/game',rec=repo+'/records/battle-ui-test-v01-20261027',tmp='G:/Codex/tmp/battle-ui-v01-20261027';
const c=require(repo+'/tools/text-workshop/core.cjs'),j=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),before=j(rec+'/before.json');
const cr=s=>s.replace(/\r?\n/g,'\r\n'),raw=fs.readFileSync(before.backup+'/jack.qsp'),doc=c.parse(raw);
assert(c.serialize(doc).equals(raw));assert.equal(c.hash(fs.readFileSync(work+'/jack.qsp')),before.qsp);
const edits=[];
function edit(name,fn){const loc=doc.locations.find(l=>l.name===name);assert(loc,name);const old=c.shift(doc.lines[loc.body],5),next=cr(fn(old));assert.notEqual(old,next);edits.push({location:name,field:'body',old,new:next,count:1});doc.lines[loc.body]=c.shift(next,-5);}
function marked(s){return cr('! JO9 MOD START BATTLE_UI_TEST_V01\n'+s+'\n! JO9 MOD END BATTLE_UI_TEST_V01\n');}
// Transient rendering values only; neither battle stats nor saved actor data are modified.
const track=`$jo9_bui_fx = ''
if jo9_bui_ready = 1 and jo9_bui_enemy_index = текущий and $jo9_bui_enemy_id = $враг[текущий]:
 if jo9_bui_enemy_hp > здоровье_врага[текущий]: $jo9_bui_fx = '<img class="jo9-battle-hit" src="content/pic/ui/jo9_battle_test_v01/slash.svg">'
end
if jo9_bui_ready = 1 and jo9_bui_player_hp > здоровье_игрока: $jo9_bui_fx += '<div class="jo9-battle-player-hit"></div>'
jo9_bui_ready = 1
jo9_bui_enemy_index = текущий
$jo9_bui_enemy_id = $враг[текущий]
jo9_bui_enemy_hp = здоровье_врага[текущий]
jo9_bui_player_hp = здоровье_игрока`;
const open=result=>marked(track+`\n*p '<div id="jo9_battle_test_v01" class="jo9-battle-v01${result?' jo9-battle-result':''}"><div class="jo9-battle-log-skin"></div>'`);
const stage=marked(`if $силуэт_моба[$враг[текущий]] ! '': *p '<div class="jo9-battle-monster-wrap"><img id="jo9-battle-monster" src="<<$силуэт_моба[$враг[текущий]]>>" onerror="this.style.display=String.fromCharCode(110,111,110,101)"></div>'
*p '<<$jo9_bui_fx>>'`);
for(const name of ['боевой_интерфейс','конец_боя'])edit(name,body=>{
 const at=body.indexOf("if $place = 'edge_patrol':");assert(at>0);body=body.slice(0,at)+open(name==='конец_боя')+body.slice(at);
 const needle='*p \'<div id = "fight_txt"><<$информация_о_бое>></div>\'';assert(body.includes(needle));
 let label='';
 if(name==='конец_боя')label=marked(`$jo9_bui_result = '전투 종료'
if $итог_боя = 'победа': $jo9_bui_result = '승리'
if $итог_боя = 'бегство': $jo9_bui_result = '전투에서 이탈했습니다'
if $итог_боя = 'вырубился' or $итог_боя = 'убит': $jo9_bui_result = '패배'
*p '<div class="jo9-battle-result-title"><<$jo9_bui_result>></div>'`);
 body=body.replace(needle,stage+label+needle);
 return body+marked("*p '</div>'");
});
edit('раскладка_бой',body=>marked("jo9_bui_ready = 0\n$jo9_bui_fx = ''")+body);
const candidate=c.serialize(doc),after=c.hash(candidate);assert(c.serialize(c.parse(candidate)).equals(candidate));
const patch={id:'2026-10-27_battle_ui_test_v01',before_sha256:c.hash(raw),after_sha256:after,edits};
fs.mkdirSync(tmp+'/mods',{recursive:true});fs.mkdirSync(tmp+'/game/css',{recursive:true});fs.mkdirSync(rec+'/scripts',{recursive:true});
fs.writeFileSync(tmp+'/mods/2026-10-27_battle_ui_test_v01.json',JSON.stringify(patch,null,2)+'\n');
fs.copyFileSync(before.backup+'/jack.qsp',tmp+'/game/jack.qsp');
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',tmp+'/game/jack.qsp','-ModsDir',tmp+'/mods'],{encoding:'utf8',windowsHide:true,timeout:60000});
assert.equal(run.status,0,run.stdout+run.stderr);assert.equal(c.hash(fs.readFileSync(tmp+'/game/jack.qsp')),after);
const css=fs.readFileSync(before.backup+'/css/base.css');assert.equal(c.hash(css),before.css);
const proposalPath=fs.existsSync(path.join(__dirname,'base-ui.css'))?path.join(__dirname,'base-ui.css'):tmp+'/css-proposal.txt';
let proposal=fs.readFileSync(proposalPath,'utf8').replace(/z-index:950/g,'z-index:1');
proposal+=`\n.jo9-battle-v01,.jo9-battle-v01 div{display:block!important;}
.jo9-battle-v01 #fight_subtions>a{display:inline;min-height:0;margin:0;padding:0;line-height:20px;}
.jo9-battle-v01 #fight_subtions>br{display:inline;}
.jo9-battle-v01 .jo9-battle-monster-wrap{position:absolute;left:242px;top:0;width:795px;height:596px;overflow:hidden;z-index:2;text-align:center;pointer-events:none;}
.jo9-battle-v01 #jo9-battle-monster{height:596px;max-width:795px;width:auto;border:0;}
.jo9-battle-v01 .jo9-battle-hit{position:absolute;left:390px;top:70px;width:500px;height:460px;z-index:5;pointer-events:none;opacity:0;-webkit-animation:jo9-battle-slash .6s ease-out;animation:jo9-battle-slash .6s ease-out;}
@-webkit-keyframes jo9-battle-slash{0%{opacity:1;-webkit-transform:scale(.75)}35%{opacity:1}100%{opacity:0;-webkit-transform:scale(1.15)}}
@keyframes jo9-battle-slash{0%{opacity:1;transform:scale(.75)}35%{opacity:1}100%{opacity:0;transform:scale(1.15)}}
.jo9-battle-v01 .jo9-battle-player-hit{position:absolute;left:1037px;top:0;width:243px;height:440px;background:#b31717;opacity:0;z-index:6;pointer-events:none;-webkit-animation:jo9-battle-flash .5s ease-out;animation:jo9-battle-flash .5s ease-out;}
@-webkit-keyframes jo9-battle-flash{0%{opacity:.45}100%{opacity:0}}
@keyframes jo9-battle-flash{0%{opacity:.45}100%{opacity:0}}
.jo9-battle-result #fight_options,.jo9-battle-result #fight_options_ui2{left:252px;top:620px;width:155px;height:160px;padding:0;background:none;overflow:hidden;}
.jo9-battle-result #fight_options img,.jo9-battle-result #fight_options_ui2 img{width:155px;height:136px;}
.jo9-battle-result #fight_subtions{left:880px;top:620px;width:147px;height:160px;padding:0;background:none;overflow:hidden;}
.jo9-battle-result #fight_subtions a{padding:0;margin:0;}
.jo9-battle-result #fight_subtions img{width:147px;height:129px;}
.jo9-battle-result #fight_txt{left:423px;top:650px;width:445px;height:132px;font-size:18px;line-height:23px;text-align:center;}
.jo9-battle-result .jo9-battle-result-title{position:absolute;left:423px;top:610px;width:445px;height:34px;line-height:34px;text-align:center;font-size:28px;font-weight:bold;color:#38210b;z-index:5;}
.jo9-battle-v01 #fight_options img,.jo9-battle-v01 #fight_options_ui2 img{max-width:200px;max-height:175px;}
.jo9-battle-v01 #sound_icon{left:997px;top:10px;z-index:7;}
`;
const fullCss=Buffer.concat([css,Buffer.from('\r\n/* JO9 MOD START BATTLE_UI_TEST_V01 */\r\n'+cr(proposal)+'\r\n/* JO9 MOD END BATTLE_UI_TEST_V01 */\r\n')]);
fs.writeFileSync(tmp+'/game/css/base.css',fullCss);
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="460" viewBox="0 0 500 460"><defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#ffb355" stop-opacity="0"/><stop offset=".5" stop-color="#fff9dc"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><path d="M45 410 Q215 140 464 31 Q283 202 45 410" fill="url(#g)"/><path d="M70 427 Q228 200 438 84" fill="none" stroke="#ffd881" stroke-width="5"/><path d="M83 389 Q249 137 472 47" fill="none" stroke="#fff9df" stroke-width="8"/><g fill="#ffda8d"><path d="M245 170l8 22 23 8-23 7-8 23-7-23-23-7 23-8z"/><path d="M330 117l5 13 14 5-14 4-5 14-4-14-14-4 14-5z"/><path d="M166 277l5 14 14 5-14 5-5 14-5-14-14-5 14-5z"/></g></svg>`;
const asset='content/pic/ui/jo9_battle_test_v01/slash.svg';fs.mkdirSync(path.dirname(tmp+'/game/'+asset),{recursive:true});fs.writeFileSync(tmp+'/game/'+asset,svg);
// Reuse immutable resources through directory links; keep the new asset in its own real directory.
function linkTree(src,dst){fs.mkdirSync(dst,{recursive:true});for(const e of fs.readdirSync(src,{withFileTypes:true})){const a=path.join(src,e.name),b=path.join(dst,e.name);if(fs.existsSync(b)){if(e.isDirectory()&&!fs.lstatSync(b).isSymbolicLink())linkTree(a,b);continue;}if(e.isDirectory())fs.symlinkSync(a,b,'junction');else fs.copyFileSync(a,b);}}
linkTree(work+'/content',tmp+'/game/content');
if(!fs.existsSync(tmp+'/game/json'))fs.symlinkSync(work+'/json',tmp+'/game/json','junction');
fs.copyFileSync(tmp+'/mods/2026-10-27_battle_ui_test_v01.json',repo+'/mods/2026-10-27_battle_ui_test_v01.json');
fs.copyFileSync(tmp+'/game/css/base.css',rec+'/base.candidate.css');
fs.copyFileSync(__filename,rec+'/scripts/build.cjs');
if(path.resolve(proposalPath)!==path.resolve(rec+'/scripts/base-ui.css'))fs.copyFileSync(proposalPath,rec+'/scripts/base-ui.css');
fs.writeFileSync(rec+'/candidate.json',JSON.stringify({backup:before.backup,candidate:tmp+'/game/jack.qsp',qsp:after,css:c.hash(fullCss),changedLocations:edits.map(e=>e.location),asset,workUnchanged:true},null,2)+'\n');
console.log(JSON.stringify({candidate:tmp+'/game/jack.qsp',qsp:after,changedLocations:edits.map(e=>e.location)}));
