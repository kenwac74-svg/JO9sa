'use strict';
const fs=require('fs'),a=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const raw=fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'),d=c.parse(raw),loc=d.locations.find(l=>l.name==='$ongload'),body=c.shift(d.lines[loc.body],5),old='! JO9 MOD END R02_JOKER_LOAD_REDRAW_20261113';a.equal(body.split(old).length-1,1);
const block=[
'! JO9 MOD START BATTLE_RESULT_LOAD_REDRAW_20261116',
"if instr('|jo9_battle_fate|конец_боя|выход_из_боя|', '|' + $curloc + '|') > 0 and jo9_fate['mode'] > 0:",
" if jo9_fate['phase'] = 3 and jo9_fate['mode'] = 1 and $итог_боя = '': gt 'выход_из_боя'",
" if $итог_боя = 'победа' and (jo9_fate['phase'] = 1 or jo9_fate['phase'] = 2) and instr($jo9_fate['page'], 'jo9-battle-result') > 0:",
"  gs 'jo9_battle_fate', 'render'",
' end',
'end',
'! JO9 MOD END BATTLE_RESULT_LOAD_REDRAW_20261116'
].join('\r\n');
const edit={location:'$ongload',field:'body',old,new:old+'\r\n'+block,count:1};d.lines[loc.body]=c.shift(body.replace(old,()=>edit.new),-5);const output=c.serialize(d);a(c.serialize(c.parse(output)).equals(output));fs.mkdirSync(__dirname+'/mod',{recursive:true});fs.writeFileSync(__dirname+'/mod/patch.json',JSON.stringify({id:'2026-11-16_battle_result_load_redraw',status:'APPROVED',approval:'User requested restoring the blank battle screen exposing the legacy background; repaint saved result cache only, preserve decisions and rewards.',before_sha256:c.hash(raw),after_sha256:c.hash(output),edits:[edit]},null,2)+'\n');fs.writeFileSync(__dirname+'/fragment.txt',block);process.stdout.write(JSON.stringify({prepared:true,changedLocation:'$ongload',addedLocations:0,newPersistentFields:0,before:c.hash(raw),candidate:c.hash(output)})+'\n');
