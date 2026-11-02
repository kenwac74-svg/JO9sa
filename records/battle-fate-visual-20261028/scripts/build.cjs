'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const input=JSON.parse(fs.readFileSync(__dirname+'/inputs.json','utf8')),{work,repo,tmp,assets}=input;
const cr=s=>s.replace(/\r?\n/g,'\r\n'),hash=p=>c.hash(fs.readFileSync(p));
for(const [f,h]of Object.entries(input.hashes))a.equal(hash(work+'/'+f),h,'WORK changed: '+f);
const raw=fs.readFileSync(tmp+'/before/jack.qsp'),d=c.parse(raw),edits=[];
function once(s,from,to){a.equal(s.split(from).length-1,1,'Unique anchor '+from.slice(0,100));return s.replace(from,to);}
function edit(n,fn){const l=d.locations.find(x=>x.name===n);a(l,n);const before=c.shift(d.lines[l.body],5),after=cr(fn(before));a.notEqual(before,after);d.lines[l.body]=c.shift(after,-5);edits.push({location:n,field:'body',old:before,new:after,count:1});}
const mark=s=>cr('! JO9 MOD START BATTLE_FATE_VISUAL_20261028\n'+s+'\n! JO9 MOD END BATTLE_FATE_VISUAL_20261028');
const arena="elseif ($place = 'colosseum' and colosseum_fight > 0) or ($place = 'colosseum_arena' and $fight_return = 'Start'):\r\n"+mark(`*p '<div id = "fight_bg"><img src = "content/pic/ui/jo9_battle_test_v01/arena.png"></div>'`)+"\r\nelseif ui_style = 2:";
for(const n of ['боевой_интерфейс','конец_боя'])edit(n,s=>{
 s=once(s,'elseif ui_style = 2:',arena);
 if(n==='конец_боя'){
  const lines=["local $jo9_bv_standing = $replace($силуэт_моба[$враг[текущий]], '\\', '/')",'local $jo9_bv_image = $силуэт_моба[$враг[текущий]]',"if $итог_боя = 'победа':"];
  for(const x of assets.filter(x=>x.id)){
   if(/^gladiator_prisoner_[a-d]$/.test(x.id))lines.push(" if $враг[текущий] = 'fugituive_"+x.id.slice(-1)+"': $jo9_bv_image = '"+x.destination+"'");
   else lines.push(" if $jo9_bv_standing = 'content/pic/mob/"+x.id+".png': $jo9_bv_image = '"+x.destination+"'");
  }
  lines.push('end',`if $jo9_bv_image ! '': *p '<div class="jo9-battle-monster-wrap"><img id="jo9-battle-monster" src="<<$jo9_bv_image>>" onerror="this.style.display=String.fromCharCode(110,111,110,101)"></div>'`);
  s=once(s,`if $силуэт_моба[$враг[текущий]] ! '': *p '<div class="jo9-battle-monster-wrap"><img id="jo9-battle-monster" src="<<$силуэт_моба[$враг[текущий]]>>" onerror="this.style.display=String.fromCharCode(110,111,110,101)"></div>'`,mark(lines.join('\n')));
 }
 return s.replace('jo9_battle_log.js?v=20261028FATE','jo9_battle_log.js?v=20261028VISUAL');
});
edit('jo9_battle_fate',s=>{
 s=once(s,`'<a href="EXEC: gt ''jo9_battle_fate'', ''apply'', 2">[`, `'<a class="jo9-battle-fate-spare" href="EXEC: gt ''jo9_battle_fate'', ''apply'', 2">[`);
 s=once(s,`</span></div><div class="jo9-battle-fate-row"><a href="EXEC: gt ''выход_из_боя''">[계속]</a></div></div>'`,`</span></div><div class="jo9-battle-fate-row"></div></div>'`);
 s=once(s,`$jo9_bf_page = $replace($jo9_bf_page, '<div id="jo9_battle_fx_layer" class="jo9-battle-fx-layer" aria-hidden="true">', '<div id="jo9_battle_fx_layer" class="jo9-battle-fx-layer" aria-hidden="true"><div class="jo9-battle-execution"><img src="content/pic/ui/jo9_battle_test_v01/execution.svg"></div>')`,`$jo9_bf_page = $replace($jo9_bf_page, '<div id = "fight_bg">', '<div id = "fight_bg"><div class="jo9-battle-execution"><img src="content/pic/ui/jo9_battle_test_v01/execution_red.png"></div>')`);
 return mark('! Display-only revision; choice ledger and exit guards are unchanged.')+'\r\n'+s;
});
const candidate=c.serialize(d);a(c.serialize(c.parse(candidate)).equals(candidate));
fs.mkdirSync(__dirname+'/mods',{recursive:true});
const mod={id:'2026-10-28_battle_fate_visual',description:'Battle result font and colors, original thumb-only continuation, prepared defeated sprites and arena background/red execution backdrop.',before_sha256:c.hash(raw),after_sha256:c.hash(candidate),edits};
fs.writeFileSync(__dirname+'/mods/2026-10-28_battle_fate_visual.json',JSON.stringify(mod,null,2)+'\n');
fs.writeFileSync(tmp+'/jack.candidate.qsp',candidate);
let css=fs.readFileSync(tmp+'/before/css/base.css','utf8');
const cssStart=css.indexOf('/* JO9 MOD START BATTLE_FATE_CHOICE_20261028'),cssEnd=css.indexOf('/* JO9 MOD END BATTLE_FATE_CHOICE_20261028 */',cssStart)+'/* JO9 MOD END BATTLE_FATE_CHOICE_20261028 */'.length;
a(cssStart>0&&cssEnd>cssStart);
let block=css.slice(cssStart,cssEnd);
block=once(block,'top: 646px;','top: 640px;');block=once(block,'height: 84px;','height: 78px;');block=once(block,'top: 736px;','top: 724px;');
block=once(block,'font-family: inherit;\r\n  font-size: 22px;','font-family: "Sandoll 미생";\r\n  font-size: 23px;');
block=once(block,'color: #681923;','color: #ff0000;');
block=once(block,'#jo9_battle_test_v01 .jo9-battle-fate-row > .is-disabled,','#jo9_battle_test_v01 .jo9-battle-fate-row > .jo9-battle-fate-spare {\r\n  color: #008000;\r\n}\r\n\r\n#jo9_battle_test_v01 .jo9-battle-fate-row > .is-disabled,');
block=block.replaceAll('#jo9_battle_fx_layer > .jo9-battle-execution','#fight_bg > .jo9-battle-execution');
block=once(block,'left: 242px;\r\n  top: 0;','left: 0;\r\n  top: 0;');
block=block.replace('/* Keep this wrapper a direct child of #jo9_battle_fx_layer. Its fixed\r\n   rectangle follows the existing monster picture, not the lower log. */','/* The opaque red backdrop stays inside fight_bg, behind the separate monster sprite.\r\n   Its fixed rectangle and one visibility deadline do not change UI layout. */');
css=css.slice(0,cssStart)+block+css.slice(cssEnd);
let js=fs.readFileSync(tmp+'/before/content/js/jo9_battle_log.js','utf8');
const jsStart=js.indexOf('/* JO9 MOD START BATTLE_FATE_CHOICE_20261028 */');a(jsStart>0);
js=js.slice(0,jsStart)+cr(`/* JO9 MOD START BATTLE_FATE_CHOICE_20261028 */
(function(){
 'use strict';
 var root=document.getElementById('jo9_battle_test_v01');
 var stage=root&&root.querySelector('#fight_bg');
 var effect=stage&&stage.querySelector('.jo9-battle-execution');
 if(!effect||effect.__jo9StaticFxPlayed)return;
 effect.__jo9StaticFxPlayed=true;
 effect.style.visibility='visible';
 setTimeout(function(){
  if(document.getElementById('jo9_battle_test_v01')===root&&effect.parentNode===stage)effect.style.visibility='hidden';
 },1000);
}());
/* JO9 MOD END BATTLE_FATE_CHOICE_20261028 */
`);
const game=tmp+'/candidate-game';a(!fs.existsSync(game),'Candidate directory must be new');fs.mkdirSync(game,{recursive:true});
const overrides=new Map([['css/base.css',Buffer.from(css,'utf8')],['content/js/jo9_battle_log.js',Buffer.from(js,'utf8')],...assets.map(x=>[x.destination,fs.readFileSync(x.source)])]);
for(const rel of overrides.keys())fs.mkdirSync(path.dirname(game+'/'+rel),{recursive:true});
function overlay(rel){
 const src=work+'/'+rel,dst=game+'/'+rel;fs.mkdirSync(dst,{recursive:true});
 if(fs.existsSync(src))for(const ent of fs.readdirSync(src,{withFileTypes:true})){
  const child=rel+'/'+ent.name,target=game+'/'+child;
  if(ent.isDirectory()){
   if(fs.existsSync(target))overlay(child);else fs.symlinkSync(fs.realpathSync(work+'/'+child),target,'junction');
  }else if(ent.isFile()&&!overrides.has(child))fs.copyFileSync(work+'/'+child,target);
 }
}
overlay('css');overlay('content');
for(const [rel,b]of overrides)fs.writeFileSync(game+'/'+rel,b);
for(const rel of ['fonts','json'])fs.symlinkSync(fs.realpathSync(work+'/'+rel),game+'/'+rel,'junction');
for(const f of ['config.xml','FastQSP.ini'])fs.copyFileSync(work+'/'+f,game+'/'+f);
const report={qspBefore:c.hash(raw),qspAfter:c.hash(candidate),candidate:tmp+'/jack.candidate.qsp',game,cssAfter:hash(game+'/css/base.css'),jsAfter:hash(game+'/content/js/jo9_battle_log.js'),modifiedLocations:edits.map(x=>x.location),addedLocations:[],assets,scope:'isolated candidate only; original WORK unchanged'};
fs.writeFileSync(__dirname+'/candidate.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,assets:report.assets.length},null,2));
