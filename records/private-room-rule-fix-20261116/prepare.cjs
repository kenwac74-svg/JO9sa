'use strict';
const {fs,a,R,W,T,c,body,generic,sections}=require('./shared.cjs');
const raw=fs.readFileSync(W+'/jack.qsp');a.equal(c.hash(raw),'a244ee964f0aaa1ffd6f0d0696242fa0b2bf6b46841cb3b8df2ca9e7747a416a');
const s=sections(raw),accept=generic(s.accept.replaceAll('\t\tovernight_rules_count += 1\r\n',''));
a(!accept.includes('overnight_rules_count'));a(accept.includes("'dyn'+'slave'"));a(!accept.includes("'dyn'+'dynslave'"));
const block=[
'! JO9 MOD START PRIVATE_SANITARY_RULES_20261116',
'local $jo9_sanitary_roles, $jo9_sanitary_daily',
"$jo9_sanitary_roles[0]='room1'",
"$jo9_sanitary_roles[1]='room2'",
"$jo9_sanitary_roles[2]='room3'",
"$jo9_sanitary_roles[3]='room4'",
'$jo9_sanitary_daily = {',
" if $args[0] ! $jo9_wake_worker: $dynslave['rules_explanations']=''",
" if dynslave_state = CONST_INT['slave_exist']:",
"  if dynslave['duty'] < 2 or dynslave['duty'] > 4:",
'   local jo9_sanitary_old_broken, jo9_sanitary_old_forced, jo9_sanitary_broken, jo9_sanitary_forced',
"   jo9_sanitary_old_broken=dynslave['num_rules_broken']",
"   jo9_sanitary_old_forced=dynslave['num_rules_wanttobreak']",
"   dynslave['urinal_rule_broken']=0",
"   dynslave['toilet_rule_broken']=0",
accept,
"   jo9_sanitary_broken=dynslave['num_rules_broken']-jo9_sanitary_old_broken",
"   jo9_sanitary_forced=dynslave['num_rules_wanttobreak']-jo9_sanitary_old_forced",
"   dynslave['rules_broken']=iif(dynslave['num_rules_broken']>0,1,0)",
'   if jo9_sanitary_broken>0:',
"    if jo9_sanitary_old_broken=0: dynamic $sin_gained_now, 'dynslave'",
"    master_moodlet['neg_rebell']=1",
"    master_moodlet['pos_nice_slave']=0",
"    if dynslave['sin']>1:",
"     dynslave_rate['custom']-=jo9_sanitary_broken",
"     if jo9_sanitary_old_broken=0: dynslave_rate['instinct']-=dynslave['ego']",
'    end',generic(s.targetRefusal),
'   end',generic(s.effects),
'   if jo9_sanitary_forced>0:',
"    dynslave_rate['angst']+=jo9_sanitary_forced*(dynslave['sensitivity']+2)",
"    dynslave_rate['moral']-=jo9_sanitary_forced*5",
"    dynslave_rate['rational']+=min(dynslave['intellect'],dynslave['num_rules_wanttobreak'])-min(dynslave['intellect'],jo9_sanitary_old_forced)",
"    dynslave_rate['custom']+=jo9_sanitary_forced",
'   end',
'  end',
' end',
'}',
"dynamic $do_for_each_slave_in_list, '$jo9_sanitary_daily', '$jo9_sanitary_roles'",
'! JO9 MOD END PRIVATE_SANITARY_RULES_20261116',''].join('\r\n');
const anchor='! JO9 MOD END MAID_BATH_WAKE_PRIORITY\r\n\r\n!rest conditions';a.equal(s.next.split(anchor).length,2);
const next=s.next.replace(anchor,'! JO9 MOD END MAID_BATH_WAKE_PRIORITY\r\n\r\n'+block+'\r\n!rest conditions');
const doc=c.parse(raw),loc=doc.locations.find(l=>l.name==='next_day');doc.lines[loc.body]=c.shift(next,-5);const candidate=c.serialize(doc);a(c.serialize(c.parse(candidate)).equals(candidate));
const inverse=c.parse(candidate);inverse.lines[loc.body]=c.shift(next.replace(block+'\r\n',''),-5);a(c.serialize(inverse).equals(raw));
const edits=[{location:'next_day',field:'body',old:anchor,new:'! JO9 MOD END MAID_BATH_WAKE_PRIORITY\r\n\r\n'+block+'\r\n!rest conditions',count:1,patchId:'PRIVATE_SANITARY_RULES_20261116'}];
fs.mkdirSync(T,{recursive:true});fs.writeFileSync(T+'/candidate.qsp',candidate);fs.writeFileSync(__dirname+'/daily-block.qsrc',block);fs.writeFileSync(__dirname+'/daily-patch.json',JSON.stringify({id:'2026-11-16_private_sanitary_rules',before_sha256:c.hash(raw),after_sha256:c.hash(candidate),edits},null,2)+'\n');
console.log(JSON.stringify({before:c.hash(raw),dailyCandidate:c.hash(candidate),locations:doc.locations.length,newLocations:0,newSaveFields:0,targets:['room1','room2','room3','room4'],primaryAndAssistantCodeUnchanged:true,productionUnchanged:true}));
