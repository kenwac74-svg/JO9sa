const fs=require('fs'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const root='G:/Codex/tmp/mob-group-sets-20261029',game='G:/somi/Jack O Nine Tails v2.4_work/game',groups=require('./groups.json'),q=s=>"'"+s.replaceAll("'","''")+"'";
fs.mkdirSync(root+'/mods',{recursive:true});const raw=fs.readFileSync(game+'/jack.qsp'),d=c.parse(raw);
const body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
const code=["! JO9 MOD START MOB_GROUP_SETS_20261029","if $args[0] = 'group':"," $result = ''"," if количество_врагов < 2 or количество_врагов > 5: exit"," local jo9_mg_counts"," local jo9_mg_i = 1"," :jo9_mg_count"," if jo9_mg_i <= количество_врагов:","  jo9_mg_counts[$враг[jo9_mg_i]] += 1","  jo9_mg_i += 1","  jump 'jo9_mg_count'"," end"];
for(const g of groups){
 const counts={};g.roster.forEach(k=>counts[k]=(counts[k]||0)+1);
 const cond=g.random?Object.keys(counts).map(k=>"jo9_mg_counts["+q(k)+"]").join(' + ')+' = '+g.count:Object.entries(counts).map(([k,v])=>"jo9_mg_counts["+q(k)+"] = "+v).join(' and ');
 code.push(" if количество_врагов = "+g.count+" and ("+cond+"): $result = "+q(g.path)+" & exit");
}
code.push(" exit","end","! JO9 MOD END MOB_GROUP_SETS_20261029");
const edits=[{location:'jo9_battle_fate',old:"if $args[0] = 'sprite':",new:code.join('\r\n')+"\r\nif $args[0] = 'sprite':"}];
const end=body('конец_боя'),start=end.indexOf("if $place = 'edge_patrol' and jo9_bv_defeated"),finish=end.indexOf("! JO9 MOD END BATTLE_FOLLOWUP",start);a(start>0&&finish>start);
const old=end.slice(start,finish),fallback=old.slice(old.indexOf(" *p '<div"),old.indexOf('\r\nelse\r\n'));
const neu=[
"! JO9 MOD START MOB_GROUP_SETS_20261029",
"local $jo9_mg_image = ''",
"if jo9_bv_defeated = 1: $jo9_mg_image = $func('jo9_battle_fate', 'group')",
"if $jo9_mg_image ! '':",
` *p '<div class="jo9-battle-monster-wrap" id="jo9-group-defeat"><img id="jo9-battle-group-image" style="width:100%;height:100%;object-fit:contain;border:0" src="<<$jo9_mg_image>>" onload="this.parentNode.nextElementSibling.style.display=String.fromCharCode(110,111,110,101)" onerror="this.parentNode.style.display=String.fromCharCode(110,111,110,101)"></div>'`,
fallback,
"else",
" local $jo9_bv_image = $func('jo9_battle_fate', 'sprite', текущий, jo9_bv_defeated)",
` if $jo9_bv_image ! '': *p '<div class="jo9-battle-monster-wrap"><img id="jo9-battle-monster" src="<<$jo9_bv_image>>" data-standing="<<$силуэт_моба[$враг[текущий]]>>" onerror="this.onerror=null;this.src=this.getAttribute(&quot;data-standing&quot;)"></div>'`,
"end","! JO9 MOD END MOB_GROUP_SETS_20261029",""
].join('\r\n');
edits.push({location:'конец_боя',old,new:neu});
for(const e of edits){Object.assign(e,{field:'body',count:1});const l=d.locations.find(x=>x.name===e.location),s=body(e.location);a.equal(s.split(e.old).length,2);d.lines[l.body]=c.shift(s.split(e.old).join(e.new),-5);}
const out=c.serialize(d),patch={id:'2026-10-29_mob_group_sets',description:'Roster group defeat image slots with per-enemy fallback until group PNG exists. Execution filter unchanged.',before_sha256:c.hash(raw),after_sha256:c.hash(out),edits};
fs.writeFileSync(root+'/baseline.qsp',raw);fs.writeFileSync(root+'/candidate.qsp',out);fs.writeFileSync(root+'/mods/'+patch.id+'.json',JSON.stringify(patch,null,2));fs.writeFileSync(__dirname+'/patch.json',JSON.stringify(patch,null,2));console.log({groups:groups.length,before:patch.before_sha256,after:patch.after_sha256});
