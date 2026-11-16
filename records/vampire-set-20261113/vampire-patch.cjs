'use strict';
const fs=require('fs'),a=require('assert/strict'),R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/vampire-set-20261113',D=R+'/records/vampire-set-20261113',c=require(R+'/tools/text-workshop/core.cjs');
const raw=fs.readFileSync(W+'/jack.qsp');a.equal(c.hash(raw),'e58aa4d77b1be754837bc9f619ed8953536218c58c73ca69df6da643f40c7a6a');const d=c.parse(raw),edits=[],nl=s=>s.replace(/\r?\n/g,'\r\n');
function edit(location,old,rep,id){const l=d.locations.find(x=>x.name===location);let s=c.shift(d.lines[l.body],5);old=nl(old);rep=nl(rep);a.equal(s.split(old).length-1,1,location+': '+id);edits.push({location,field:'body',old,new:rep,count:1,patchId:id});d.lines[l.body]=c.shift(s.replace(old,rep),-5)}
const mark=(s,id='VAMPIRE_SET_20261113')=>`! JO9 MOD START ${id}\n${s}\n! JO9 MOD END ${id}`;
const helper=`! Existing component fields carry all effects; the species marker adds no separate multiplier.
if $args[0] = 'vampire_apply':
 dynamic replace({
  if jo9vactor['jo9_vampire'] = 1:
   jo9vactor['blood_attitude'] = 2
   jo9vactor['blood_attitude_revealed'] = 2
   jo9vactor['darkness_attitude'] = 2
   jo9vactor['darkness_attitude_revealed'] = 2
   jo9vactor['passion_sweets'] = -1
   jo9vactor['passion_sweets_revealed'] = 2
   jo9vactor['pos_dessert'] = 0
   jo9vactor['jo9_constitution'] = 1
   jo9vactor['metabolism'] = 5
   jo9vactor['metabolism_revealed'] = 2
   jo9vactor['enchanter_affinity'] = 1
   jo9vactor['enchanter_affinity_revealed'] = 2
  end
 }, 'jo9vactor', $args[1])
 exit
end
if $args[0] = 'race_list':
 gs 'jo9_traits','vampire_apply',$args[1]
 $result = $dyneval(replace({
  $result = ''
  if dynslave['jo9_vampire'] = 1: $result = '<a href="EXEC: gs ''jo9_traits'', ''describe'', ''vampire''">[뱀파이어]</a><br>'
 }, 'dynslave', $args[1]))
 exit
end
if $args[0] = 'vampire_text':
 $result = '뱀파이어는 다음과 같은 특성을 모두 가집니다. '
 $result += '<a href="EXEC: gs ''jo9_traits'', ''vampire_component'', ''blood''"><<dyneval($vb_cycle_skill, 2, "[혈액기호증]")>></a>, '
 $result += '<a href="EXEC: gs ''jo9_traits'', ''vampire_component'', ''darkness''"><<dyneval($vb_cycle_skill, 2, "[암흑기호증]")>></a>, '
 $result += '<a href="EXEC: gs ''jo9_traits'', ''vampire_component'', ''picky''"><<dyneval($vb_cycle_skill, 2, "[까다로운 입맛]")>></a>, '
 $result += '<a href="EXEC: gs ''jo9_traits'', ''vampire_component'', ''healthy''">[건강체질]</a>, '
 $result += '<a href="EXEC: gs ''jo9_traits'', ''vampire_component'', ''metabolism''"><<dyneval($vb_cycle_skill, 5, "[고도 대사량]")>></a>, '
 $result += '<a href="EXEC: gs ''jo9_traits'', ''vampire_component'', ''mage''"><<dyneval($vb_cycle_skill, 5, "[타고난 마법사]")>></a>'
 exit
end
if $args[0] = 'vampire_component' or $args[0] = 'vampire_component_text':
 $result = ''
 if $args[1] = 'blood': $result = $Кровожадная
 if $args[1] = 'darkness': $result = $Дитя_тьмы
 if $args[1] = 'picky': $result = $Не_любит_сладкое
 if $args[1] = 'healthy': $result = $func('jo9_traits','text','healthy')
 if $args[1] = 'metabolism': $result = $Мощный_метаболизм
 if $args[1] = 'mage': $result = $чародейка
 if $args[0] = 'vampire_component' and $result ! '': msg $result
 exit
end
if $args[0] = 'vampire_cache':
 if instr($update_slave_features_list,'VAMPIRE_SET_20261113') = 0: gs '#static_base'
 if instr($newloc_update_iced_features_list,'VAMPIRE_SET_20261113') = 0: code_defined['newloc_update_iced_features_list'] = 0
 exit
end
if $args[0] = 'vampire_load':
 local jo9v_i
 for jo9v_i = 0 to arrsize('$all_slave_characters') - 1:
  gs 'jo9_traits','vampire_apply',$all_slave_characters[jo9v_i]
 end
 gs 'jo9_traits','vampire_apply','stock'
 gs 'jo9_traits','vampire_apply','jo9_farid_stored'
 exit
end`;
const loc=d.locations.find(x=>x.name==='jo9_traits'),first=c.shift(d.lines[loc.body],5).split('\r\n')[0];edit('jo9_traits',first,mark(helper)+'\n'+first,'VAMPIRE_SET_20261113');
edit('jo9_traits'," $result = ''\n ! JO9 MOD START ATTENTION_DESCRIPTION", " $result = ''\n"+mark(" if $args[1] = 'vampire': $result = $func('jo9_traits','vampire_text')",'VAMPIRE_SET_DESCRIPTION_20261113')+"\n ! JO9 MOD START ATTENTION_DESCRIPTION",'VAMPIRE_SET_DESCRIPTION_20261113');
edit('jo9_traits',"if dynslave['jo9_vampire'] = 1: $result += '뱀파이어<br>'",mark('! Species rows are prepended by race_list before the ordinary feature rows.'),'VAMPIRE_SET_ROW_20261113');
edit('jo9_traits',"  if dynslave['jo9_constitution'] = 1: $result +=", "  if dynslave['jo9_vampire'] ! 1 and dynslave['jo9_constitution'] = 1: $result +=",'VAMPIRE_SET_HEALTHY_HIDE_20261113');
edit('jo9_traits',"if $args[0] = 'list':","if $args[0] = 'list':\n gs 'jo9_traits','vampire_apply',$args[1]",'VAMPIRE_SET_LIST_REPAIR_20261113');
edit('jo9_traits',"if $args[0] = 'repair':","if $args[0] = 'repair':\n"+mark(" gs 'jo9_traits','vampire_apply',$args[1]"),'VAMPIRE_SET_REPAIR_20261113');
edit('jo9_traits'," gs 'jo9_traits', 'repair_exclusions', $args[1]\n result = 1\n exit\nend", " gs 'jo9_traits', 'repair_exclusions', $args[1]\n"+mark(" gs 'jo9_traits','vampire_apply',$args[1]")+"\n result = 1\n exit\nend",'VAMPIRE_SET_EDIT_REPAIR_20261113');
for(const [location,actor,varname] of [['#static_base','dynslave','$dynslave_features_list'],['$stock_traits','stock','$stock_features_list'],['jo9_farid_consignment','jo9_farid_viewprobe','$jo9_farid_viewprobe_features_list'],['$newloc','dynslave','$dynslave_features_list']]){
 const l=d.locations.find(x=>x.name===location),s=c.shift(d.lines[l.body],5);let line=s.split('\r\n').find(x=>x.trim()===varname+" = ''");a(line);if(location==='$newloc'){const start=s.indexOf(line,s.indexOf('$newloc_update_iced_features_list = {')),guard=s.indexOf("if dynslave_state ! CONST_INT['no_slave']:",start);a(start>0&&guard>start);line=s.slice(start,s.indexOf('\r\n',guard));}edit(location,line,line+'\n'+mark(`${varname} += $func('jo9_traits','race_list','${actor}')`),'VAMPIRE_SET_FIRST_'+actor);
}
for(const old of ["if dynslave['enchanter_affinity'] > 0 and", "if dynslave['metabolism'] = 5 and", "if dynslave['darkness_attitude'] = 2 and", "if dynslave['blood_attitude'] = 2 and", "if dynslave['passion_sweets'] = -1 and"]){const s=c.shift(d.lines[d.locations.find(x=>x.name==='#static_base').body],5),line=s.split('\r\n').find(x=>x.trim().startsWith(old));a(line);edit('#static_base',line,mark(line.replace('if dynslave[',"if dynslave['jo9_vampire'] ! 1 and dynslave[")),'VAMPIRE_SET_HIDE_'+old.match(/\['([^']+)'\]/)[1]);}
edit('jo9_chaotic',"local $jo9_chaotic_keys = ''",mark("gs 'jo9_traits','vampire_apply',$jo9_chaotic_role")+"\nlocal $jo9_chaotic_keys = ''",'VAMPIRE_SET_CHAOTIC_REPAIR_20261113');
edit('jo9_chaotic',"  if jo9ceactor['passion_sweets'] = -1 or jo9ceactor['passion_sweets'] = 1:",mark("  if jo9ceactor['jo9_vampire'] ! 1 and (jo9ceactor['passion_sweets'] = -1 or jo9ceactor['passion_sweets'] = 1):"),'VAMPIRE_SET_CHAOTIC_PROTECT_20261113');
for(const n of ['$ongload','$newloc']){let l=d.locations.find(x=>x.name===n),first=c.shift(d.lines[l.body],5).split('\r\n')[0];edit(n,first,mark("gs 'jo9_traits','vampire_cache'"+(n==='$ongload'?"\ngs 'jo9_traits','vampire_load'":""),'VAMPIRE_SET_CACHE_20261113')+'\n'+first,'VAMPIRE_SET_CACHE_20261113');}
const out=c.serialize(d);a.equal(c.parse(out).locations.length,d.locations.length);fs.writeFileSync(T+'/candidate.qsp',out);const mod={id:'2026-11-13_vampire_set',status:'APPROVED',approval:'User specified six existing traits as vampire set, no duplicate rows, first row [뱀파이어], compact colored component links and original descriptions in the same message pane.',before_sha256:c.hash(raw),after_sha256:c.hash(out),edits};fs.writeFileSync(D+'/candidate-mod.json',JSON.stringify(mod,null,2)+'\n');fs.writeFileSync(D+'/change.json',JSON.stringify({before:mod.before_sha256,after:mod.after_sha256,locations:[...new Set(edits.map(x=>x.location))],edits:edits.length,newLocations:0,newSaveKeys:0,personalSavesChanged:false},null,2)+'\n');console.log(JSON.stringify({after:mod.after_sha256,edits:edits.length,locations:[...new Set(edits.map(x=>x.location))]}));
