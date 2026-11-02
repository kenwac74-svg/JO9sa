'use strict';
// Generates proposal fragments only. Does not change WORK or candidate QSP.
const fs=require('node:fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),a=require('node:assert/strict');
const work='G:/somi/Jack O Nine Tails v2.4_work/game',d=c.parse(fs.readFileSync(work+'/jack.qsp'));
const body=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),cr=s=>s.replace(/\r?\n/g,'\r\n');
const mark=s=>cr('! JO9 MOD START BATTLE_HIT_TYPES_20261028\n'+s+'\n! JO9 MOD END BATTLE_HIT_TYPES_20261028');
const edits=[];
function propose(location,old,newText){a.equal(body(location).split(old).length-1,1,'Unique snippet anchor in '+location);edits.push({location,field:'body',old,new:newText,count:1});}
propose('раскладка_бой',"jo9_bui_ready = 0",mark("killvar 'jo9_bui_hit'\nkillvar 'jo9_bui_hit_type'\nkillvar 'jo9_bui_hit_id'")+"\r\njo9_bui_ready = 0");
const pre=mark(`local jo9_bh_hp = здоровье_врага[текущий]
local jo9_bh_stamina = выносливость_врага[текущий]
local jo9_bh_spirit = дух_врага[текущий]`);
propose('конец_раунда','!make damage and create status effect',pre+'\r\n!make damage and create status effect');
const capture=mark(`if jo9_bh_hp > здоровье_врага[текущий] or jo9_bh_stamina > выносливость_врага[текущий] or jo9_bh_spirit > дух_врага[текущий] or ($класс_врага[текущий] = 'пешка' and $состояние[текущий] = 'повержен' and враг[текущий] = 1 and модификатор > 0):
 jo9_bui_hit[текущий] = 1
 $jo9_bui_hit_type[текущий] = $тип_нанесенного_вреда
 $jo9_bui_hit_id[текущий] = $враг[текущий]
end`);
propose('конец_раунда',"if $наложение = 'слабость':",capture+"\r\nif $наложение = 'слабость':");
const secondaryOld="\t\t\tgs 'рассчет_вреда'\r\n\r\n\t\t\tif $класс_врага[вторцель] = 'пешка':";
const secondaryPre=mark(`local jo9_bh_secondary_hp = здоровье_врага[вторцель]
local jo9_bh_secondary_stamina = выносливость_врага[вторцель]
local jo9_bh_secondary_spirit = дух_врага[вторцель]`);
propose('атака_игрока',secondaryOld,"\t\t\tgs 'рассчет_вреда'\r\n"+secondaryPre+"\r\n\t\t\tif $класс_врага[вторцель] = 'пешка':");
const secondaryEnd="\r\n\t\tend\r\n\t}\r\n\t$атака[0] = 'быстрая'\r\n\t$рассчетный_тип_вреда = 'рубящий'";
const secondaryPost=mark(`if jo9_bh_secondary_hp > здоровье_врага[вторцель] or jo9_bh_secondary_stamina > выносливость_врага[вторцель] or jo9_bh_secondary_spirit > дух_врага[вторцель] or ($класс_врага[вторцель] = 'пешка' and $состояние[вторцель] = 'повержен' and враг[вторцель] = 1 and модификатор > 0):
 jo9_bui_hit[вторцель] = 1
 $jo9_bui_hit_type[вторцель] = $тип_нанесенного_вреда
 $jo9_bui_hit_id[вторцель] = $враг[вторцель]
end`);
propose('атака_игрока',secondaryEnd,'\r\n'+secondaryPost+secondaryEnd);
const oldDetector=cr(`if jo9_bui_ready = 1 and jo9_bui_enemy_index = текущий and $jo9_bui_enemy_id = $враг[текущий]:
 if jo9_bui_enemy_hp > здоровье_врага[текущий]: $jo9_bui_fx = '<img class="jo9-battle-hit" src="content/pic/ui/jo9_battle_test_v01/slash.svg">'
end`);
const fx=mark(`local $jo9_bh_svg = ''
if jo9_bui_hit[текущий] = 1 and $jo9_bui_hit_id[текущий] = $враг[текущий]:
 if $jo9_bui_hit_type[текущий] = 'колющий': $jo9_bh_svg = 'pierce'
 if $jo9_bui_hit_type[текущий] = 'рубящий': $jo9_bh_svg = 'slash'
 if $jo9_bui_hit_type[текущий] = 'дробящий': $jo9_bh_svg = 'impact'
 if $jo9_bui_hit_type[текущий] = 'психический': $jo9_bh_svg = 'whip'
end
if $jo9_bh_svg ! '': $jo9_bui_fx = '<img class="jo9-battle-hit" src="content/pic/ui/jo9_battle_test_v01/fx/<<$jo9_bh_svg>>.svg">'
killvar 'jo9_bui_hit'
killvar 'jo9_bui_hit_type'
killvar 'jo9_bui_hit_id'`);
for(const location of ['боевой_интерфейс','конец_боя'])propose(location,oldDetector,fx);
const out={status:'proposal-fragments-only',baselineSha256:d.hash,edits,assetSources:['pierce','slash','impact','whip'].map(n=>'fx/'+n+'.svg'),assetDestinations:['pierce','slash','impact','whip'].map(n=>'content/pic/ui/jo9_battle_test_v01/fx/'+n+'.svg'),limitations:['FX is shown for the currently displayed target only; an auto-switched survivor is not hit by a dead target\'s cue. Pending markers are then cleared once.','Pawn enemies have status defeat rather than resource decrease; their successful defeat is explicitly included.','Flame, lightning, cold and light are existing nonphysical damage types without a new visual in this four-type scope.'],structuralCost:{newLocations:0,newDependencies:0,transientArrays:['jo9_bui_hit','jo9_bui_hit_type','jo9_bui_hit_id'],modifiedLocations:[...new Set(edits.map(x=>x.location))]}};
fs.writeFileSync(__dirname+'/hit-snippets.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({baselineSha256:d.hash,edits:edits.length,locations:out.structuralCost.modifiedLocations},null,2));
