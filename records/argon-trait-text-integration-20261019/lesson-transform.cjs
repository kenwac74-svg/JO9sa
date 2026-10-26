'use strict';
// Verified direct-target references in the supplied document's key inventory.
// Text and mechanics are preserved;
// each character reference is resolved against the existing delayed target.
const targets=[
 {key:'$cast_spell[66]',id:'ARGON_LESSON_TARGET_01',old:'slave["age"]',next:'dynslave["age"]',reason:'공포 주문의 나이 명사를 현재 대상의 나이로 선택'},
 {key:'$cast_spell[69]',id:'ARGON_LESSON_TARGET_02',old:'<<$slave_name>>',next:'<<$dynslave_name>>',reason:'치유 주문의 이름을 현재 대상으로 치환'},
 {key:'$oratory_lesson_description[0]',id:'ARGON_LESSON_TARGET_03',old:'<<$slave_name>>',next:'<<$dynslave_name>>',reason:'화술 초급 수업의 이름을 현재 대상으로 치환'},
 {key:'$oratory_lesson_description[1]',id:'ARGON_LESSON_TARGET_04',old:'<<$slave_name>>',next:'<<$dynslave_name>>',reason:'화술 다음 단계 수업의 이름을 현재 대상으로 치환'},
 {key:'$music_lesson_description[0]',id:'ARGON_LESSON_TARGET_05',old:'<<$slave_name>>',next:'<<$dynslave_name>>',reason:'음악 입문 수업의 이름을 현재 대상으로 치환'},
 {key:'$music_lesson_description[2]',id:'ARGON_LESSON_TARGET_06',old:'<<$slave_name>>',next:'<<$dynslave_name>>',reason:'음악 연주 수업의 이름을 현재 대상으로 치환'},
 {key:'$cast_spell[70000]',id:'ARGON_LESSON_TARGET_07',old:'<<$slave_name>>',next:'<<$dynslave_name>>',reason:'치유 주문의 이름을 현재 대상으로 치환'},
 {key:'$oratory_lesson_description[3]',id:'ARGON_LESSON_TARGET_08',old:'<<$slave_name>>',next:'<<$dynslave_name>>',reason:'화술 수업의 이름을 현재 대상으로 치환'},
 {key:'$oratory_lesson_description[4]',id:'ARGON_LESSON_TARGET_09',old:'<<$slave_name>>',next:'<<$dynslave_name>>',reason:'화술 수업의 이름을 현재 대상으로 치환'},
 {key:'$oratory_lesson_description[5]',id:'ARGON_LESSON_TARGET_10',old:'<<$slave_name>>',next:'<<$dynslave_name>>',reason:'화술 수업의 이름을 현재 대상으로 치환'},
 {key:'$music_lesson_description[3]',id:'ARGON_LESSON_TARGET_11',old:'<<$slave_name>>',next:'<<$dynslave_name>>',reason:'음악 수업의 이름을 현재 대상으로 치환'},
 {key:'$music_lesson_description[4]',id:'ARGON_LESSON_TARGET_12',old:'<<$slave_name>>',next:'<<$dynslave_name>>',reason:'음악 수업의 이름을 현재 대상으로 치환'},
 {key:'$music_lesson_description[5]',id:'ARGON_LESSON_TARGET_13',old:'<<$slave_name>>',next:'<<$dynslave_name>>',reason:'음악 수업의 이름을 현재 대상으로 치환'},
 {key:'$slave_foreplay_anal[0]',id:'ARGON_LESSON_TARGET_14',old:'$slave_body6_txt[slave["age"]]',next:'$slave_body6_txt[dynslave["age"]]',reason:'기존 문자열의 연령 참조를 현재 대상으로 치환'},
 {key:'$slave_seduction[4]',id:'ARGON_LESSON_TARGET_15',old:'slave["nipple_piercing"]',next:'dynslave["nipple_piercing"]',reason:'기존 문자열의 장신구 상태 참조를 현재 대상으로 치환'},
 {key:'$hj_lesson_description[0]',id:'ARGON_LESSON_TARGET_16',old:'<<$slave_name>>',next:'<<$dynslave_name>>',reason:'기존 수업 문자열의 이름을 현재 대상으로 치환'},
 {key:'$rimming_lesson_description[0]',id:'ARGON_LESSON_TARGET_17',old:'<<$slave_name>>',next:'<<$dynslave_name>>',reason:'기존 수업 문자열의 이름을 현재 대상으로 치환'},
 {key:'$vaginalsex_lesson_description[4]',id:'ARGON_LESSON_TARGET_18',old:'<<$slave_name>>',next:'<<$dynslave_name>>',reason:'기존 수업 문자열의 이름을 현재 대상으로 치환'},
 {key:'$vaginalsex_lesson_description[5]',id:'ARGON_LESSON_TARGET_19',old:'<<$slave_name>>',next:'<<$dynslave_name>>',reason:'기존 수업 문자열의 이름을 현재 대상으로 치환'},
 {key:'$pigsex_lesson_description[0]',id:'ARGON_LESSON_TARGET_20',old:'<<$slave_name>>',next:'<<$dynslave_name>>',reason:'기존 수업 문자열의 이름을 현재 대상으로 치환'},
 {key:'$pigsex_lesson_description[2]',id:'ARGON_LESSON_TARGET_21',old:'<<$slave_name>>',next:'<<$dynslave_name>>',reason:'기존 수업 문자열의 이름을 현재 대상으로 치환'},
 {key:'$pigsex_lesson_description[4]',id:'ARGON_LESSON_TARGET_22',old:'<<$slave_name>>',next:'<<$dynslave_name>>',reason:'기존 수업 문자열의 이름을 현재 대상으로 치환'},
];
function transform(body){
 const eol=body.includes('\r\n')?'\r\n':'\n';
 let result=body;const edits=[];
 for(const item of targets){
  if(result.includes('JO9 MOD START '+item.id))throw Error('Already applied '+item.id);
  const rows=result.split(/\r?\n/).filter(l=>l.startsWith(item.key+' = '));
  if(rows.length!==1)throw Error('Expected one assignment '+item.key+', found '+rows.length);
  const before=rows[0];
  if(before.split(item.old).length!==2)throw Error('Expected one target reference '+item.key);
  const after=before.replace(item.old,item.next);
  const wrapped=['! JO9 MOD START '+item.id+' | 2026-10-19_argon_trait_text_integration','! 지연 출력의 대상 참조만 교정. 기존 문장과 수업·주문 효과는 유지.',after,'! JO9 MOD END '+item.id].join(eol);
  result=result.replace(before,wrapped);
  edits.push({location:'#static_txt',key:item.key,patchId:item.id,before,after,reason:item.reason,count:1,stateEffects:'없음; 기존 출력 문자열 안의 대상 이름·나이 참조만 변경'});
 }
 return {body:result,edits};
}
module.exports={transform,targets};
