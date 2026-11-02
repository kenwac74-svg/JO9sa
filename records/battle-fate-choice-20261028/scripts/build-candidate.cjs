'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const stage=__dirname,tmp='G:/Codex/tmp/battle-fate-20261028',work='G:/somi/Jack O Nine Tails v2.4_work/game';
const cr=s=>s.replace(/\r?\n/g,'\r\n'),hash=p=>c.hash(fs.readFileSync(p));
const input=fs.readFileSync(tmp+'/jack.before.qsp'),d=c.parse(input),edits=[];
a.equal(d.hash,'7c366e1ae35a5922e32052847bceb28737ddab32c3861b19bbefd7661b45c2b7');
a.equal(hash(work+'/jack.qsp'),d.hash,'WORK changed; do not overwrite manual changes');
a.equal(hash(work+'/css/base.css'),hash(tmp+'/base.before.css'));
a.equal(hash(work+'/content/js/jo9_battle_log.js'),hash(tmp+'/battle_log.before.js'));
const mark=b=>cr('! JO9 MOD START BATTLE_FATE_CHOICE_20261028\n'+b+'\n! JO9 MOD END BATTLE_FATE_CHOICE_20261028');
function edit(name,mutate){const l=d.locations.find(x=>x.name===name);a(l,name);const before=c.shift(d.lines[l.body],5),after=mutate(before);a.notEqual(before,after,name);d.lines[l.body]=c.shift(after,-5);edits.push({location:name,field:'body',old:before,new:after,count:1});}
function once(s,from,to){a.equal(s.split(from).length-1,1,'Unique anchor: '+from.slice(0,100));return s.replace(from,to);}
edit('раскладка_бой',s=>mark("killvar 'jo9_fate'\nkillvar 'jo9_fate_enemy'")+'\r\n'+s);
for(const [n,source]of[['начать_бой','normal'],['$gladiator_fight_start','arena']])edit(n,s=>once(s,"gs 'боевое_меню'",mark("gs 'jo9_battle_fate', 'init', '"+source+"'")+"\r\ngs 'боевое_меню'"));
edit('конец_раунда',s=>once(s,"\tif враг[i] = 1:\r\n\t\tif здоровье_врага[i] <= 0", "\tif враг[i] = 1:\r\n"+mark(`if jo9_fate['mode'] > 0:
 local jo9_bf_cause = 0
 if здоровье_врага[i] <= 0 and $класс_врага[i] ! 'пешка':
  jo9_bf_cause = 1
 elseif выносливость_врага[i] <= 0 and $класс_врага[i] ! 'пешка':
  jo9_bf_cause = 2
 elseif дух_врага[i] <= 0 and $класс_врага[i] ! 'пешка':
  jo9_bf_cause = 4
 elseif $состояние[i] = 'повержен':
  jo9_bf_cause = 3
 end
 if jo9_bf_cause > 0:
  if func('jo9_battle_fate', 'stage', i, jo9_bf_cause) = 1: jump 'loop5'
 end
end`)+"\r\n\t\tif здоровье_врага[i] <= 0"));
edit('конец_боя',s=>{
 s=mark("gs 'jo9_battle_fate', 'result'")+'\r\n'+s;
 s=once(s,`*p '<div id="jo9_battle_test_v01" class="jo9-battle-v01 jo9-battle-result"><div class="jo9-battle-log-skin"></div>'`,mark(`local $jo9_bf_class = ''
if jo9_fate['mode'] > 0 and jo9_fate['phase'] = 1: $jo9_bf_class = ' jo9-battle-fate-active'
*p '<div id="jo9_battle_test_v01" class="jo9-battle-v01 jo9-battle-result<<$jo9_bf_class>>"><div class="jo9-battle-log-skin"></div>'`));
 s=once(s,`*p '<div id = "fight_txt"><<$информация_о_бое>></div>'`,`*p '<div id = "fight_txt"><<$информация_о_бое>></div>'\r\n`+mark(`gs 'jo9_battle_fate', 'choices'
if jo9_fate['mode'] > 0 and jo9_fate['phase'] = 1: *p $jo9_fate['choices']`));
 s=once(s,`*p '<div id = "fight_subtions"><<$боевое_меню>></div>'`,mark(`if jo9_fate['mode'] > 0 and jo9_fate['phase'] = 1:
 $jo9_fate['thumb_ready'] = $боевое_меню
 $jo9_fate['thumb_pending'] = '<span class="jo9-fate-thumb-disabled" aria-disabled="true"><img src="content/pic/ui/grimdark/buttons/thumb_up.png"></span><br>'
 $боевое_меню = $jo9_fate['thumb_pending']
end`)+`\r\n*p '<div id = "fight_subtions"><<$боевое_меню>></div>'`);
 s=once(s,'content/js/jo9_battle_log.js?v=20261027','content/js/jo9_battle_log.js?v=20261028FATE');
 s+='\r\n'+mark(`if jo9_fate['mode'] > 0 and jo9_fate['phase'] = 1:
 $jo9_fate['last_fx'] = $jo9_bui_fx
 $jo9_fate['page'] = $MAINTXT
end`)+ '\r\n';
 return s;
});
edit('выход_из_боя',s=>mark(`if jo9_fate['mode'] > 0:
 if jo9_fate['phase'] = 1: gt 'jo9_battle_fate', 'render'
 if jo9_fate['phase'] = 3: exit
 if jo9_fate['phase'] = 2: jo9_fate['phase'] = 3
end`)+ '\r\n'+s);
const helper=cr(fs.readFileSync(stage+'/helper.qsp.txt','utf8'));
a(!d.locations.some(x=>x.name==='jo9_battle_fate'));
d.lines.splice(-1,0,c.shift('jo9_battle_fate',-5),c.shift('',-5),c.shift(helper,-5),c.shift('0',-5));
d.lines[3]=c.shift(String(d.locations.length+1),-5);
const out=c.serialize(d);a(c.serialize(c.parse(out)).equals(out));
const patch={id:'2026-10-28_battle_fate_choice',description:'Ordinary fog execution confirmation and human female arena opponent fate choice; story battles unchanged.',before_sha256:d.hash,after_sha256:c.hash(out),edits,add_locations:[{name:'jo9_battle_fate',desc:'',body:helper,actions:[]}]};
fs.mkdirSync(stage+'/mods',{recursive:true});fs.writeFileSync(stage+'/mods/2026-10-28_battle_fate_choice.json',JSON.stringify(patch,null,2)+'\n');
fs.writeFileSync(tmp+'/jack.candidate.qsp',out);
const css=fs.readFileSync(tmp+'/base.before.css','utf8')+'\r\n'+cr(fs.readFileSync(stage+'/fate-ui.css','utf8'))+cr('\n/* JO9 MOD START BATTLE_FATE_CHOICE_THUMB_20261028 */\n.jo9-fate-thumb-disabled{display:inline-block;opacity:.4;pointer-events:none;}\n/* JO9 MOD END BATTLE_FATE_CHOICE_THUMB_20261028 */\n');
const js=fs.readFileSync(tmp+'/battle_log.before.js','utf8')+cr(`
/* JO9 MOD START BATTLE_FATE_CHOICE_20261028 */
(function(){
 'use strict';
 var root=document.getElementById('jo9_battle_test_v01');
 var layer=root&&root.querySelector('#jo9_battle_fx_layer');
 var effect=layer&&layer.querySelector('.jo9-battle-execution');
 if(!effect||effect.__jo9StaticFxPlayed)return;
 effect.__jo9StaticFxPlayed=true;
 effect.style.visibility='visible';
 setTimeout(function(){
  if(document.getElementById('jo9_battle_test_v01')===root&&effect.parentNode===layer)effect.style.visibility='hidden';
 },650);
}());
/* JO9 MOD END BATTLE_FATE_CHOICE_20261028 */
`);
const game=tmp+'/candidate-game';fs.mkdirSync(game,{recursive:true});fs.mkdirSync(game+'/css',{recursive:true});
for(const f of fs.readdirSync(work+'/css').filter(n=>n.endsWith('.css')))fs.copyFileSync(work+'/css/'+f,game+'/css/'+f);
fs.writeFileSync(game+'/css/base.css',css,'utf8');
const overrides=new Map([['content/js/jo9_battle_log.js',Buffer.from(js,'utf8')],['content/pic/ui/jo9_battle_test_v01/execution.svg',fs.readFileSync(stage+'/execution.svg')]]);
function overlay(rel){
 const dest=game+'/'+rel;fs.mkdirSync(dest,{recursive:true});
 for(const ent of fs.readdirSync(work+'/'+rel,{withFileTypes:true})){
  const child=rel+'/'+ent.name,target=game+'/'+child;
  if(overrides.has(child)){fs.writeFileSync(target,overrides.get(child));overrides.delete(child);}
  else if(ent.isDirectory()){
   if([...overrides.keys()].some(x=>x.startsWith(child+'/')))overlay(child);
   else if(!fs.existsSync(target))fs.symlinkSync(fs.realpathSync(work+'/'+child),target,'junction');
  }else if(ent.isFile()&&!fs.existsSync(target))fs.copyFileSync(work+'/'+child,target);
 }
 for(const [relFile,data]of [...overrides])if(path.posix.dirname(relFile)===rel){fs.writeFileSync(game+'/'+relFile,data);overrides.delete(relFile);}
}
overlay('content');a.equal(overrides.size,0);
for(const rel of ['fonts','json'])if(!fs.existsSync(game+'/'+rel))fs.symlinkSync(fs.realpathSync(work+'/'+rel),game+'/'+rel,'junction');
for(const f of ['config.xml','FastQSP.ini'])fs.copyFileSync(work+'/'+f,game+'/'+f);
const report={qspBefore:d.hash,qspAfter:c.hash(out),cssBefore:hash(tmp+'/base.before.css'),cssAfter:hash(game+'/css/base.css'),jsBefore:hash(tmp+'/battle_log.before.js'),jsAfter:hash(game+'/content/js/jo9_battle_log.js'),candidate:tmp+'/jack.candidate.qsp',candidateGame:game,modifiedLocations:edits.map(x=>x.location),addedLocations:['jo9_battle_fate'],scope:'candidate-only; production unchanged'};
fs.writeFileSync(stage+'/candidate.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
