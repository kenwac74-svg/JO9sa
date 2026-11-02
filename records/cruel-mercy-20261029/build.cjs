const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),a=require('assert/strict');
const root='G:/Codex/tmp/cruel-mercy-20261029',game='G:/somi/Jack O Nine Tails v2.4_work/game';
fs.mkdirSync(root+'/mods',{recursive:true});const raw=fs.readFileSync(game+'/jack.qsp'),d=c.parse(raw);
const id='CRUEL_MERCY_20261029';
const edits=[
{location:'init_game',old:'!Initialize Game - this is loaded before init_custom_game, hero_creation, and hero_customization (story mode)',new:"! JO9 MOD START "+id+"\r\njo9_cruel_mercy = 0\r\n! JO9 MOD END "+id+"\r\n!Initialize Game - this is loaded before init_custom_game, hero_creation, and hero_customization (story mode)"},
{location:'jo9_battle_fate',old:" jo9_fate['choice'] = jo9_bf_choice\r\n local jo9_bf_i = 1",new:" jo9_fate['choice'] = jo9_bf_choice\r\n! JO9 MOD START "+id+"\r\n! One protagonist decision, regardless of combatant or enemy count.\r\n if jo9_bf_choice = 1: jo9_cruel_mercy -= 1\r\n if jo9_bf_choice = 2: jo9_cruel_mercy += 1\r\n! JO9 MOD END "+id+"\r\n local jo9_bf_i = 1"}
];
for(const e of edits){Object.assign(e,{field:'body',count:1});const l=d.locations.find(x=>x.name===e.location),s=c.shift(d.lines[l.body],5);a.equal(s.split(e.old).length,2);d.lines[l.body]=c.shift(s.split(e.old).join(e.new),-5);}
const out=c.serialize(d),patch={id:'2026-10-29_cruel_mercy',description:'Hidden signed protagonist choice value. Negative cruel; positive mercy. No stat modifiers.',before_sha256:c.hash(raw),after_sha256:c.hash(out),edits};
fs.writeFileSync(root+'/baseline.qsp',raw);fs.writeFileSync(root+'/candidate.qsp',out);fs.writeFileSync(root+'/mods/'+patch.id+'.json',JSON.stringify(patch,null,2));fs.writeFileSync(__dirname+'/patch.json',JSON.stringify(patch,null,2));console.log({before:patch.before_sha256,after:patch.after_sha256});
