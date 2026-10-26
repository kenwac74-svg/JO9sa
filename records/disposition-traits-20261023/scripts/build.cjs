'use strict';
// Prepare a candidate from the pinned latest WORK. Does not replace WORK.
const fs=require('node:fs'),path=require('node:path');
const repo='G:/somi/JO9sa',core=require(repo+'/tools/text-workshop/core.cjs');
const qa=require(repo+'/tools/qa/release-check.cjs');
const baseline='G:/somi/JO9_work_backups/disposition_traits_20261023/before.qsp';
const tmp='G:/Codex/tmp/jo9-disposition-20261023';
const record=repo+'/records/disposition-traits-20261023';
const id='2026-10-23_disposition_traits';
const raw=fs.readFileSync(baseline),before=core.hash(raw);
if(before!=='26115873b7cfbe72cc35531345fa319cfd759a5704b46bf80378e8fe1da59796')throw Error('Unexpected baseline');
const doc=core.parse(raw);if(!core.serialize(doc).equals(raw))throw Error('Roundtrip');
const edits=[];
const crlf=s=>s.replace(/\r?\n/g,'\r\n');
function change(location,old,value,tag){
 const loc=doc.locations.find(l=>l.name===location);if(!loc)throw Error('Missing '+location);
 let body=core.shift(doc.lines[loc.body],5);old=crlf(old);value=crlf(value);
 if(body.split(old).length!==2)throw Error('Exact anchor count '+location+' '+tag);
 const replacement=crlf(`! JO9 MOD START ${tag} | ${id}\n${value}\n! JO9 MOD END ${tag}`);
 body=body.replace(old,replacement);doc.lines[loc.body]=core.shift(body,-5);
 edits.push({location,field:'body',old,new:replacement,count:1});
}
change('jo9_traits'," stock['defiant'] = 0\n if rand(1,100) <= 10: stock['defiant'] = 1",` jo9_trait_registry_roll = rand(1,100)
 stock['defiant'] = 0
 stock['jo9_slave_nature'] = 0
 stock['jo9_slave_nature_initialized'] = 0
 if jo9_trait_registry_roll <= 2: stock['defiant'] = 1
 if jo9_trait_registry_roll > 2 and jo9_trait_registry_roll <= 12 and stock['ego'] < 4 and stock['pride'] < 4: stock['jo9_slave_nature'] = 1`,'DISPOSITION_ROLL');

const desc=" if $args[1] = 'slave_nature': msg '천성적으로 노예 생활을 받아들이며, 새 주인의 기본 명령에도 순순히 따른다. 획득할 때부터 기초 복종훈련이 되어 있어 복종시키는 시간을 들이지 않아도 된다. 다만 일에 필요한 기술과 체력은 별개다.'";
const traitLocation=doc.locations.find(l=>l.name==='jo9_traits');
const muteLine=core.shift(doc.lines[traitLocation.body],5).split('\r\n').find(l=>l.startsWith(" if $args[1] = 'innate_mute':"));
if(!muteLine)throw Error('Description anchor missing');
change('jo9_traits',muteLine,desc+'\n'+muteLine,'SLAVE_NATURE_DESCRIPTION');
change('jo9_traits',"  if dynslave['defiant'] = 1: $result += '<a href=\"EXEC: gs ''jo9_traits'', ''describe'', ''defiant''\">거센 반항심</a><br>'",`  if dynslave['defiant'] = 1: $result += '<a href="EXEC: gs ''jo9_traits'', ''describe'', ''defiant''">거센 반항심</a><br>'
  if dynslave['jo9_slave_nature'] = 1: $result += '<a href="EXEC: gs ''jo9_traits'', ''describe'', ''slave_nature''">노예근성</a><br>'`,'SLAVE_NATURE_LIST');

change('jo9_traits',"if $args[0] = 'edit':",`if $args[0] = 'edit' and $args[2] = 'jo9_slave_nature':
 if dyneval('result = '+$args[1]+"['jo9_slave_nature']") ! 1:
  if dyneval('result = '+$args[1]+"['ego']") >= 4 or dyneval('result = '+$args[1]+"['pride']") >= 4:
   msg '노예근성은 자아가 단호함 미만이고 태도가 건방짐 미만일 때만 부여할 수 있습니다.'
   exit
  end
 end
end
if $args[0] = 'edit':`,'SLAVE_NATURE_EDITOR_GUARD');
change('jo9_traits',"  if $args[0] = 'defiant': dynslave['jo9_defiant_resolved'] = 0",`  if $args[0] = 'defiant':
   dynslave['jo9_defiant_resolved'] = 0
   if dynslave['defiant'] = 1:
    dynslave['jo9_slave_nature'] = 0
    dynslave['jo9_slave_nature_initialized'] = 0
   end
  end
  if $args[0] = 'jo9_slave_nature':
   dynslave['jo9_slave_nature_initialized'] = 0
   if dynslave['jo9_slave_nature'] = 1: dynslave['defiant'] = 0
  end`,'SLAVE_NATURE_EDITOR_OPPOSITES');
change('jo9_traits'," gs 'jo9_traits_personality', 'gradecheck', $args[1]",` if $args[2] = 'jo9_slave_nature': gs 'jo9_traits', 'init_slave_nature', $args[1]
 gs 'jo9_traits_personality', 'gradecheck', $args[1]`,'SLAVE_NATURE_EDITOR_INITIALIZE');
change('jo9_traits',"  $setting_display_r += '<div id=\"under_cheats\"><a href=\"EXEC: gs ''jo9_traits'', ''edit'', ''dynslave'', ''defiant'', 1 & gt ''menu_form''\">거센 반항심: '",`  $setting_display_r += '<div id="under_cheats"><a href="EXEC: gs ''jo9_traits'', ''edit'', ''dynslave'', ''jo9_slave_nature'', 1 & gt ''menu_form''">노예근성: '
  if dynslave['jo9_slave_nature'] = 1: $setting_display_r += '있음'
  if dynslave['jo9_slave_nature'] ! 1: $setting_display_r += '없음'
  $setting_display_r += '</a></div>'
  $setting_display_r += '<div id="under_cheats"><a href="EXEC: gs ''jo9_traits'', ''edit'', ''dynslave'', ''defiant'', 1 & gt ''menu_form''">거센 반항심: '`,'SLAVE_NATURE_EDITOR');

const init=`if $args[0] = 'init_slave_nature':
 dynamic $replace({
  if jo9born['jo9_slave_nature'] = 1 and jo9born['jo9_slave_nature_initialized'] = 0:
   jo9born['jo9_slave_nature_initialized'] = 1
   if jo9born['ego'] >= 4 or jo9born['pride'] >= 4 or jo9born['defiant'] = 1:
    jo9born['jo9_slave_nature'] = 0
   else
    ! One acquisition-only initialization; later normal play can change these values.
    if jo9born['ego']+jo9born['temper']+jo9born['pride'] < 3: jo9born['ego'] = 3-jo9born['temper']-jo9born['pride']
    jo9born['rational'] = 5
    jo9born['custom'] = max(3,jo9born['custom'])
    jo9born['moral'] = max(1,jo9born['moral'])
    jo9born['fear'] = 0
    jo9born['angst'] = 0
    jo9born['spoil'] = 0
    jo9born['arousal'] = 0
    jo9born_rate['rational'] = 0
    jo9born_rate['custom'] = 0
    jo9born_rate['moral'] = 0
    jo9born_rate['instinct'] = 0
    jo9born_rate['fear'] = 0
    jo9born_rate['angst'] = 0
    jo9born_rate['spoil'] = 0
    jo9born_rate['arousal'] = 0
    $jo9born_psy_status = 'reluctant'
    local jo9born_mood_steps = 0
    :jo9born_initial_mood
    dynamic $replace($recalc_slave_mood,'dyn'+'slave','jo9born')
    if jo9born['mood'] < 1 and jo9born_mood_steps < 200:
     jo9born_rate['mood'] += 10
     jo9born_mood_steps += 1
     jump 'jo9born_initial_mood'
    end
    gs '$slave_price','jo9born'
    :jo9born_initial_custom
    if jo9born['obedience'] < 5 and jo9born['custom'] < 5:
     jo9born['custom'] += 1
     gs '$slave_price','jo9born'
     jump 'jo9born_initial_custom'
    end
    :jo9born_initial_instinct
    if jo9born['obedience'] < 5 and jo9born['instinct'] < 5:
     jo9born['instinct'] += 1
     gs '$slave_price','jo9born'
     jump 'jo9born_initial_instinct'
    end
    :jo9born_initial_moral
    if jo9born['obedience'] < 5 and jo9born['moral'] < 3:
     jo9born['moral'] += 1
     gs '$slave_price','jo9born'
     jump 'jo9born_initial_moral'
    end
    dynamic $replace($newloc_update_slave,'dyn'+'slave','jo9born')
    dynamic $replace($newloc_update_slave,'dyn'+'slave','jo9born')
   end
  end
 },'jo9born',$args[1])
end`;
change('jo9_traits',"if $args[0] = 'restored_refresh':",init+"\nif $args[0] = 'restored_refresh':",'SLAVE_NATURE_ACQUIRE_ONCE');
change('get_stock_seed',"stock['jo9_defiant_resolved'] = 0",`stock['jo9_defiant_resolved'] = 0
stock['jo9_slave_nature'] = 0
stock['jo9_slave_nature_initialized'] = 0`,'SLAVE_NATURE_SEED_DEFAULT');
change('get_special_assistant_quest','assistant["defiant"] = seed_defiant[assistant_type]',`assistant["defiant"] = seed_defiant[assistant_type]
assistant['jo9_slave_nature'] = 0
assistant['jo9_slave_nature_initialized'] = 0`,'SLAVE_NATURE_ASSISTANT_DEFAULT');
for(const [loc,old] of [['stock_to_slave_nogt',"dynamic $swap_slave_instances, 'slave', 'stock'"],['expert_to_slave',"dynamic $swap_slave_instances, 'slave', 'selected'"]]){
 change(loc,old,old+"\ngs 'jo9_traits','init_slave_nature','slave'",'SLAVE_NATURE_ACQUIRE_'+loc.toUpperCase());
}
change('$expert_search',"\t\tdynamic $swap_slave_instances, 'stock', 'selected'",`  if stock['ego'] >= 4 or stock['pride'] >= 4: stock['jo9_slave_nature'] = 0
\t\tdynamic $swap_slave_instances, 'stock', 'selected'`,'SLAVE_NATURE_EXPERT_FINAL_ELIGIBILITY');
change('generate_clone',"stock['pride'] = 4",`stock['pride'] = 4
stock['jo9_slave_nature'] = 0`,'SLAVE_NATURE_CLONE_FINAL_ELIGIBILITY');
const result=core.serialize(doc),after=core.hash(result),patch={id,before_sha256:before,after_sha256:after,edits};
qa.inspectWorld(result);qa.validatePatchSet([patch],before,after);
fs.mkdirSync(tmp,{recursive:true});fs.mkdirSync(record,{recursive:true});fs.mkdirSync(path.join(tmp,'mods'),{recursive:true});
const candidate=path.join(tmp,'candidate.qsp');fs.writeFileSync(candidate,result);
fs.writeFileSync(path.join(tmp,'mods',id+'.json'),JSON.stringify(patch,null,2));
const changed=[...new Set(edits.map(e=>e.location))];
fs.writeFileSync(path.join(record,'candidate-summary.json'),JSON.stringify({id,before,after,candidate,edits:edits.length,changed},null,2));
console.log(JSON.stringify({before,after,candidate,edits:edits.length,changed},null,2));
