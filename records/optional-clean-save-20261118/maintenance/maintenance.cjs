'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {MARKER,PICKER_OLD_PREFIX,PICKER_NEW_PREFIX,LAZY_ENSURE}=require('../lazy/lazy_patch.cjs');
const scope=require('../scope/whitelist.json');
const NAME='jo9_save_maintenance',NL='\r\n';
const q=s=>"'"+s.replaceAll("'","''")+"'";
function buildHelper(){
 assert.equal(scope.cacheVariables.length,15);assert.equal(new Set(scope.cacheVariables.map(x=>x.replace(/^\$/,'').toUpperCase())).size,15);assert.equal(scope.meal.currentIds.length,76);
 const lines=[
  '! JO9 MOD START JO9_SAVE_MAINTENANCE_20261118',
  '! Manual clean-save voice-bank lifecycle and exact legacy-cache housekeeping.',
  "local $j9sm_mode = lcase($args[0])",
  'local j9sm_pos, j9sm_ready, j9sm_size, j9sm_i, j9sm_match',
  "local $j9sm_old, $j9sm_new, $j9sm_expected, $j9sm_first",
  "if lcase($ongsave) ! "+q(NAME)+':',
  " if $ongsave ! '':",
  '  $jo9_previous_save_hook = $ongsave',
  ' else',
  "  killvar '$jo9_previous_save_hook'",
  ' end',
  'end',
  "$ongsave = "+q(NAME),
  "if $j9sm_mode = 'install': exit",
  "if $j9sm_mode ! '' and $j9sm_mode ! 'load' and $j9sm_mode ! 'clean': exit",
  "if $j9sm_mode = '' and $jo9_previous_save_hook ! '' and lcase($jo9_previous_save_hook) ! "+q(NAME)+':',
  ' gs $jo9_previous_save_hook',
  ' if lcase($ongsave) ! '+q(NAME)+':',
  "  if $ongsave ! '':",
  '   $jo9_previous_save_hook = $ongsave',
  '  else',
  "   killvar '$jo9_previous_save_hook'",
  '  end',
  ' end',
  'end',
  "$ongsave = "+q(NAME),
  '$j9sm_old = '+q(PICKER_OLD_PREFIX),
  '$j9sm_new = '+q(PICKER_NEW_PREFIX),
  'j9sm_pos = instr($voice_pick_fragment, $j9sm_old)',
  'if j9sm_pos >= 1 and j9sm_pos <= 3 and instr($voice_pick_fragment, '+q(MARKER)+') = 0:',
  ' ! Replace only the recognized opening segment; preserve the rest verbatim.',
  ' $voice_pick_fragment = mid($voice_pick_fragment,1,j9sm_pos-1) + replace(mid($voice_pick_fragment,j9sm_pos,len($j9sm_old)),$j9sm_old,$j9sm_new) + mid($voice_pick_fragment,j9sm_pos+len($j9sm_old))',
  'end',
  'j9sm_pos = instr($voice_pick_fragment, $j9sm_new)',
  'j9sm_ready = iif(j9sm_pos >= 1 and j9sm_pos <= 3,1,0)',
  "if $j9sm_mode = 'clean' and j9sm_ready = 1:",
  ...scope.cacheVariables.map(name=>' killvar '+q(name)),
  ' voice_fragment_revision = 0',
  'end',
  "killvar '$masters_vars'",
  "j9sm_size = arrsize('$meal_id')",
  'if j9sm_size > 76 and j9sm_size mod 76 = 0:',
  ...scope.meal.currentIds.map((id,i)=>' $j9sm_expected['+i+'] = '+q(id)),
  ' j9sm_i = 0',
  ' j9sm_match = 1',
  ' :j9sm_meal_check',
  ' if j9sm_i < j9sm_size and j9sm_match = 1:',
  '  if $meal_id[j9sm_i] ! $j9sm_expected[j9sm_i mod 76] or meal_id[j9sm_i] ! 0: j9sm_match = 0',
  '  j9sm_i += 1',
  "  jump 'j9sm_meal_check'",
  ' end',
  ' if j9sm_match = 1:',
  "  copyarr '$j9sm_first', '$meal_id', 0, 76",
  "  killvar '$meal_id'",
  "  copyarr '$meal_id', '$j9sm_first'",
  ' end',
  'end',
  'jo9_save_clean_revision = 1',
  '! JO9 MOD END JO9_SAVE_MAINTENANCE_20261118',
 ];
 const body=lines.join(NL)+NL;
 return {name:NAME,body,marker:'JO9_SAVE_MAINTENANCE_20261118',cacheVariables:scope.cacheVariables.slice(),savedOwnVariables:['jo9_save_clean_revision','$jo9_previous_save_hook'],hookVariable:'$ongsave',modes:{install:'register/chains hook only',load:'repair compatible cached picker and exact legacy meal/orphan housekeeping; retain voice bank','':'call prior save hook first, then safe legacy housekeeping; retain voice bank',clean:'explicit manual clean-save preparation; guarded voice-bank purge plus safe legacy housekeeping; no prior hook or file writing'},requiredPicker:{marker:MARKER,oldPrefix:PICKER_OLD_PREFIX,newPrefix:PICKER_NEW_PREFIX,ensure:LAZY_ENSURE},sourceHooks:{newGame:"gs '"+NAME+"','install'",load:"gs '"+NAME+"','load'",clean:"gs '"+NAME+"','clean'"},preservation:'Normal load/save retain the entire voice bank and revision. Only explicit clean mode can remove the exact cache whitelist and invalidate revision. Plural masters-vars, exact repeated meal-ID list and helper-owned hook/version variables can change during safe housekeeping. Other arrays/scripts/pages/callbacks are untouched.'};
}
module.exports={NAME,buildHelper};
if(require.main===module){const h=buildHelper();fs.writeFileSync(path.join(__dirname,'helper.qsps'),'# '+h.name+NL+h.body+NL+'--- '+h.name+' ---------------------------------'+NL,'utf8');fs.writeFileSync(path.join(__dirname,'helper-meta.json'),JSON.stringify({...h,body:undefined,requiredPicker:{marker:h.requiredPicker.marker}},null,2)+'\n','utf8');process.stdout.write(JSON.stringify({name:h.name,lines:h.body.split(NL).length,bytes:Buffer.byteLength(h.body,'utf8')})+'\n');}
