'use strict';
// Existing spoken-question and elocution entries only. No new QSP location,
// persistent bookkeeping, physical gag state, or unrelated stat penalty.
const locations=['interaction'];
const blocked=r=>'('+r+"['jo9_voice_trait']=1 or "+r+"['jo9_voice_trait']=2)";
function wrap(id,lines,eol){return ['! JO9 MOD START '+id+' | 2026-10-19_argon_trait_text_integration',...lines,'! JO9 MOD END '+id].join(eol);}
function transform(name,body){
 if(name!=='interaction')throw Error('Unexpected voice transform location '+name);
 if(body.includes('JO9 MOD START ARGON_VOICE_ACTION_GUARD'))throw Error('Voice guard already applied');
 const eol=body.includes('\r\n')?'\r\n':'\n',edits=[];
 const anchor="$place = 'study'"+eol+"$interaction_type = 'basic'";
 if(body.split(anchor).length!==2)throw Error('Missing or ambiguous post-reset voice anchor');
 const guard=wrap('ARGON_VOICE_ACTION_GUARD',[
  '! 발화가 필요한 질문과 수사학 수업만 제한. 명령 이해·일반 업무·음악 연주는 유지.',
  "local $jo9_voice_block_actor=''",
  "local $jo9_voice_block_reason=''",
  'if '+blocked('slave')+':',
  ' if (interaction>=1111 and interaction<=1117):',
  "  $jo9_voice_block_actor='slave'",
  "  $jo9_voice_block_reason='말을 할 수 없어 이 대화에 답할 수 없습니다.'",
  ' elseif interaction=1231 or interaction=4131 or interaction=1731 or interaction=5610:',
  "  $jo9_voice_block_actor='slave'",
  "  $jo9_voice_block_reason='말을 할 수 없어 수사학 교육에 참여할 수 없습니다.'",
  ' elseif interaction=854:',
  "  $jo9_voice_block_actor='slave'",
  "  $jo9_voice_block_reason='말을 할 수 없어 이 대화에 참여할 수 없습니다.'",
  ' end',
  'end',
  "if $jo9_voice_block_actor='' and "+blocked('assistant')+':',
  ' if interaction=1118 or interaction=1126 or interaction=1138:',
  "  $jo9_voice_block_actor='assistant'",
  "  $jo9_voice_block_reason='말을 할 수 없어 이 대화에 답할 수 없습니다.'",
  ' elseif interaction=5015 or interaction=4131:',
  "  $jo9_voice_block_actor='assistant'",
  "  $jo9_voice_block_reason='말을 할 수 없어 수사학 교육에 참여할 수 없습니다.'",
  ' elseif interaction=854:',
  "  $jo9_voice_block_actor='assistant'",
  "  $jo9_voice_block_reason='말을 할 수 없어 이 대화에 참여할 수 없습니다.'",
  ' end',
  'end',
  "if $jo9_voice_block_actor!'':",
  ' interaction_no_auto_energy_drop=1',
  " if $jo9_voice_block_actor='slave':",
  '  show_slave_fullimage=1',
  "  $text[1]='['+$slave_name+']<br>'+$jo9_voice_block_reason",
  ' else',
  '  show_assistant_fullimage=1',
  "  $text[1]='['+$assistant_name+']<br>'+$jo9_voice_block_reason",
  ' end',
  " gt 'interaction_screen'",
  'end',
 ],eol);
 const afterAnchor=anchor+eol+eol+guard;
 let result=body.replace(anchor,afterAnchor);
 edits.push({location:name,patchId:'ARGON_VOICE_ACTION_GUARD',before:anchor,after:afterAnchor,reason:'발화 불가 대상의 질문 답변·수사학 교육을 실행 전에 안내하고 종료',stateEffects:'해당 차단 행동의 비용·보상·관계 변화 없음. 기존 상태초기화 후 기존 화면으로 안내.'});
 // These two orders remain valid: replace only their spoken acknowledgement
 // for a voiceless actor with a nod, while preserving the same order effects.
 for(const [actor,id]of [['slave','ARGON_VOICE_ACK_SLAVE'],['assistant','ARGON_VOICE_ACK_ASSISTANT']]){
  const old='<<$'+actor+'_name>>는 고개를 숙이며 당신의 뜻을 따르겠다고 말한다.';
  const occurrences=result.split(old).length-1;
  if(occurrences!==2)throw Error('Expected two isolation acknowledgements for '+actor+', found '+occurrences);
  const replacement='<<IIF('+blocked(actor).replaceAll("'",'"')+', $'+actor+'_name + "는 당신의 말을 이해했다는 듯 고개를 끄덕인다.", "'+old.replaceAll('<<$'+actor+'_name>>','" + $'+actor+'_name + "')+'")>>';
  // Keep QSP subexpression delimiters at one level; the unblocked branch
  // concatenates the name rather than nesting another <<...>> expression.
  const beforeRows=result.split(/\r?\n/).filter(row=>row.includes(old));
  for(const [i,before]of beforeRows.entries()){
   const after=before.replaceAll(old,replacement),wrapped=wrap(id+'_'+(i+1),[after],eol);
   result=result.replace(before,wrapped);
   edits.push({location:name,patchId:id+'_'+(i+1),before,after,reason:'명령 효과는 유지하고 발화 불가 인물만 말 대신 고개로 확인',stateEffects:'없음; 기존 명령과 관계 변화 그대로'});
  }
 }
 return {body:result,edits};
}
module.exports={locations,transform};
