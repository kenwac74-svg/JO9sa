// Common fields follow the user's original template; all other keys retain source order.
export const BASE_FIELD_ORDER=[
 'fullimage','fullmade','fullmistress','fullsecretary',
 'seed_ava','seed_ava_gray','seed_ava_clear','seed_age','seed_boobs','seed_boobs_img','seed_pussy_img','seed_psy_basic','seed_world',
 'bathing_alone','singing','cooking','cleaning','dance','enchanting','percussion','fighting','woodwind','gymnastics','lesbo_bath','music','nurse','piano','rest','secretary','student','painting'
];
export function orderCharacterJSON(value,original=value,prefix=[]){
 const atRoot=path=>path.length===prefix.length&&path.every((k,i)=>k===prefix[i]);
 const visit=(node,ref,path)=>{
  if(Array.isArray(node))return node.map((v,i)=>visit(v,ref?.[i],[...path,String(i)]));
  if(node===null||typeof node!=='object')return node;
  const refKeys=ref&&typeof ref==='object'&&!Array.isArray(ref)?Object.keys(ref):[];
  const keys=[...new Set([...(atRoot(path)?BASE_FIELD_ORDER:[]),...refKeys,...Object.keys(node)])].filter(k=>Object.hasOwn(node,k));
  return Object.fromEntries(keys.map(k=>[k,visit(node[k],ref?.[k],[...path,k])]));
 };
 return visit(value,original,[]);
}
const imageHint='이미지 경로입니다. 능력치가 아닙니다. 보통 확장자를 제외하며, 빈 문자열은 전용 이미지 미지정입니다.';
const gradeHint='초기 기술 등급: 0=F, 1=D, 2=C, 3=B, 4=A, 5=S. 누적 수행 횟수가 아닙니다.';
const imageNames={fullimage:'기본 전신',fullmade:'메이드 복장 전신',fullmistress:'지배자 역할 복장 전신',fullsecretary:'비서 복장 전신',seed_ava:'기본 초상화',seed_ava_gray:'회색 상태 초상화',seed_ava_clear:'선명한 상태 초상화',bathing_alone:'혼자 목욕',singing:'노래',cooking:'요리',cleaning:'청소',dance:'춤',enchanting:'마법 부여',percussion:'타악기 연주',fighting:'전투·격투',woodwind:'관악기 연주',strings:'현악기 연주',gymnastics:'체조·운동',lesbo_bath:'동반 목욕',nurse:'간호',piano:'피아노 연주',rest:'휴식',secretary:'비서 업무',student:'학습',painting:'그림 그리기',washing:'세탁'};
const skills={petting:'애무',oral:'구강',penetration:'삽입',sub_vaginal:'질',vaginal:'질',sub_anal:'애널',anal:'애널',sub_hj:'손 기술',sub_fj:'발 기술',sub_hug:'신체 접촉',sub_paizuri:'가슴 기술',sub_kiss:'키스',sub_tongue:'혀 기술',sub_bj:'펠라',sub_dt:'딥스로트',sub_asslik:'항문 애무',sub_fisting:'피스팅',anal_stretch:'애널 확장',sub_seduce:'유혹',sub_masturbation:'자위',sub_dildo:'성인용 도구',sub_exhibit:'노출',sub_humiliation:'굴욕',sub_enema:'관장',sub_mazo:'피학',sub_selfpain:'자가 통증',sub_piss:'배뇨 관련',sub_kopro:'배설 관련',sub_threesome:'3인 행위',sub_dp:'이중 삽입',sub_tp:'삼중 삽입',sub_gangbang:'다인 행위',sub_bukkake:'정액 관련',sub_zoosex:'이종 행위',sub_bestiality:'동물 상대',sub_horse:'말 상대',sub_tentacles:'촉수 상대',sub_arachnidspider:'거미형 상대',sub_polypusvermin:'연체·벌레형 상대',service:'가사·봉사',cook:'요리',secretary:'비서',expression:'표현',nurse:'간호',alchemy:'연금',enchanter:'마법 부여',gladiatrix:'전투',calisthenics:'체조',music:'음악',art:'미술',pet:'애완 역할',cowSK:'소 역할',dressage:'마장·조련'};
const attributes={beauty:'외모',stamina:'체력',sensitivity:'민감도',temper:'기질',ego:'자아',pride:'자존심',intellect:'지성',fat:'체형·체지방',exotic:'이국적 매력',fertility:'생식 능력',custom:'관습',moral:'도덕관',instinct:'본능',rational:'합리성',spoil:'응석',angst:'불안',courage:'용기',compassion:'연민',fear:'공포',meekness:'온순함',metabolism:'신진대사',bruises:'멍 상태',scars:'흉터 상태',virginity:'경험 상태',perversion:'성적 성향',homosexualism:'성적 지향',masochism:'피학 성향',nymphomania:'성욕 성향',obedience_bonus:'복종 난이도 보정',sanity:'정신 안정'};
const outfits={apron:'앞치마',bride:'신부',chainmail:'사슬갑옷',cocktail:'칵테일 드레스',corset:'코르셋',cow:'소 역할',dom:'지배자',exotic:'이국풍',gorgeous:'화려한 의상',kimono:'기모노',lace:'레이스',latex:'라텍스',leotard:'레오타드',maid:'메이드',naked:'기본 신체',nurse:'간호사',pet:'애완 역할',restrain:'구속 복장',school:'학생',secr:'비서',sorc:'마법사',sundress:'선드레스',tail:'tail 슬롯',old_full:'기존 전신 호환',title:'기본 전신'};
const countNames={intimacy:'성적 경험 성공 횟수',combat:'구버전 참전 횟수',learning:'구버전 교육 횟수',teaching:'구버전 지도 횟수',cooking:'구버전 요리 인분',alchemy:'구버전 제작 횟수',care:'구버전 간호·치료 횟수',wins:'승리 횟수',losses:'패배 횟수',escapes:'도주 횟수',kills:'구버전 처치 횟수',incap:'구버전 전투불능 횟수',income:'구버전 과거 수익',pregnancies:'임신 횟수',abortions:'낙태 횟수',births:'출산 횟수',children:'자녀 수'};
const info=(label,description,hint='',category='게임 원본',confirmed=true)=>({label,description,hint,category,confirmed});
export function describeCharacterField(path,value,traits=[]){
 const parts=Array.isArray(path)?path:String(path).split('.'),key=parts.at(-1),joined=parts.join('.');
 if(parts.includes('indpack_info')){
  const names={girl_id:'캐릭터 번호',pack_author:'제작자',pack_description:'팩 설명',pack_name:'팩 이름',pack_type:'팩 유형 코드',pack_uid:'팩 고유 ID',pack_ver:'팩 버전'};
  return info(names[key]??'이미지 팩 정보',`개별 이미지 팩의 ${names[key]??key}입니다.`,'이미지 경로와 구분되는 메타정보입니다.');
 }
 if(parts.includes('jo9_race_tags')||parts.includes('race_tags')||parts.includes('species_tags'))return info('종족 태그','사용자가 지정한 자유 입력 종족·출신 태그입니다.','숫자 종족 코드나 자동 보정 효과가 없습니다.','대시보드 확장');
 if(parts.includes('jo9_owner_history')||parts.includes('ownerCounts')||parts.includes('ownerCombatGroups')){
  if(parts.includes('combat_categories')||parts.includes('ownerCombatGroups')){const type=parts.find(p=>['pvp','pve','unclassified'].includes(p)),stat=parts.find(p=>['wins','losses','escapes'].includes(p));return info(`소속 이후 ${{pvp:'PvP',pve:'PvE',unclassified:'미분류'}[type]??'전투'} ${countNames[stat]??'기록'}`,'현재 주인에게 소속된 이후 전투의 승리·패배·도주만 누적합니다.','신규 영입 시 0. 과거 세계의 전투나 스킬로 추정하지 않습니다.','대시보드 확장');}
  const field=parts.find(p=>['income','pregnancies','births','abortions','children'].includes(p)),label=field==='income'?'누적 수익':countNames[field]??'통계';return info(`소속 이후 ${label}${['source','mode'].includes(key)?' 근거':''}`,'현재 주인에게 소속된 이후에만 누적하는 기록입니다.','신규 영입 시 각각 0. 과거 이력은 이 값으로 옮기지 않습니다.','대시보드 확장');
 }
 if(parts.includes('combatGroups'))return info('구버전 과거 전투 기록','호환성을 위해 보존하는 과거 전투 데이터입니다.','세계별 전투 환경을 비교할 수 없어 현재 통계와 소속 이후 전적에 사용하지 않습니다.','대시보드 확장');
 if(parts.includes('jo9_initial_history')||parts.includes('initial_history')){
  const i=parts.findIndex(x=>['jo9_initial_history','initial_history'].includes(x)),sub=parts.slice(i+1);
  if(sub[0]==='combat_categories')return info('구버전 과거 전투 기록','호환성을 위해 보존하는 과거 전투 데이터입니다.','세계별 전투 환경을 비교할 수 없어 현재 통계와 소속 이후 전적에 사용하지 않습니다.','대시보드 확장');
  if(sub[0]==='values'){
   const label=countNames[sub[1]]??sub[1];
   if(['combat','wins','losses','escapes','abortions','children'].includes(sub[1]))return info(`구버전 과거 ${label}`,'호환성을 위해 보존하는 이전 데이터입니다. 현재 활성 과거 통계나 소속 이후 누적값으로 사용하지 않습니다.','소속 이후 기록은 별도 블록에 저장합니다.','대시보드 확장');
   return info(label,key==='source'?`${label}의 근거입니다.`:`영입 전 ${label}의 저장된 초기값입니다.`,key==='source'?'record=확정, manual=지정, estimate=추정, unknown=미상.':'0은 유효한 값이며, null은 미상입니다.','대시보드 확장');
  }
  if(sub[0]==='distribution'){
   if(sub[1]==='matrix'){const row=['질','구강','애널','미분류'][Number(sub[2])],column=['인간 이성','인간 동성','인간 외'][Number(sub[3])];return info('상세 초기값 분포',`${row??'행위 유형'} × ${column??'상대 유형'}의 성공 횟수입니다.`,'분포 전체 합계는 성적 경험 총횟수와 같아야 합니다.','대시보드 확장');}
   return info('분포 설정','분포의 행·열 분류 또는 근거를 지정합니다.','행: 질/구강/애널/미분류. 열: 인간 이성/인간 동성/인간 외.','대시보드 확장');
  }
  return info(key==='schema_version'?'초기값 형식 버전':'초기값 적용 시점',key==='schema_version'?'초기값 블록의 데이터 형식 버전입니다.':'before_acquisition은 영입 전 경력을 뜻합니다.','','대시보드 확장');
 }
 if(parts.includes('jo9_history_design')){
  const names={schema_version:'설계 형식 버전',character_id:'고정 캐릭터 ID',job:'이전 직업 분류',background:'생활 배경 분류',note:'배경 메모',seed:'고정 난수 시드',scale:'개인 경력 배수',samePct:'인간 중 동성 비중(%)',nonhumanPct:'전체 중 인간 외 비중(%)',desire:'초기 경력 성향',storySelection:'선택한 배경 조합'};
  if(parts.includes('skills'))return info('설계 스킬',`${skills[key]??key}의 초기값 산출용 등급입니다.`,gradeHint,'대시보드 확장');
  if(parts.includes('flags'))return info('설계 예외 태그',`${key} 예외 조건의 적용 여부입니다.`,'true=적용, false=미적용.','대시보드 확장');
  return info(names[key]??'설계 보조값',`${names[key]??joined}을 보존하는 편집 설계 값입니다.`,'게임의 기존 기본 필드와 구분되는 확장 데이터입니다.','대시보드 확장');
 }
 if(key==='seed_age')return info('초기 연령 유형','캐릭터의 초기 연령 분류 코드입니다.','실제 나이 숫자가 아닙니다. 원본의 유형 코드를 유지합니다.');
 if(key==='seed_boobs')return info('초기 가슴 크기','캐릭터의 초기 가슴 크기 분류 코드입니다.','신체 상세 이미지는 seed_boobs_img에서 별도로 지정합니다.');
 if(key==='seed_boobs_img'||key==='seed_pussy_img')return info(key==='seed_boobs_img'?'가슴 상세 이미지':'하체 상세 이미지','신체 상세 화면에 사용할 이미지 식별값입니다.','예: boobs_A 또는 pussy_l1. 숫자 능력치가 아닌 이미지 식별값입니다.');
 if(key==='seed_psy_basic')return info('기본 성격·심리','기본 성격과 심리 배경을 지정하는 문자열입니다.','예: optimistic. 숫자 스킬 등급이 아닙니다.');
 if(key==='seed_world')return info('세계 항목 · 사용 미확인','기존 템플릿의 세계 관련 항목입니다. 현재 로더에서 실제 사용은 확인되지 않았습니다.','출신 세계 설명문은 seed_world_description입니다. 기존 키는 보존합니다.','용도 확인 필요',false);
 if(key==='seed_name'||key==='name')return info('캐릭터 이름','캐릭터의 표시 이름입니다.');
 const story={seed_world_description:'세계',seed_family_description:'출신·가족',seed_occupation_description:'이전 직업'};
 if(story[key])return info(`${story[key]} 배경 설명`,`${story[key]}에 관한 원본 배경 설정 텍스트입니다.`,'게임 원문은 <br> 줄바꿈을 사용할 수 있습니다.');
 if(key==='music'&&typeof value==='string')return info('음악 장면 범주','음악 장면을 요청할 때 사용하는 이미지 항목입니다.','표시 코드는 노래·피아노·타악기·현악기·관악기 중 장면을 무작위 선택합니다.');
 if(imageNames[key]&&typeof value==='string')return info(`${imageNames[key]} 이미지`,`${imageNames[key]} 표시용 이미지 경로입니다.`,imageHint);
 if(key.startsWith('indpack_')){
  const raw=key.slice(8),mode=raw.endsWith('_horny')?'흥분 상태':raw.endsWith('_rebel')?'반항 상태':'기본 상태',slot=raw.replace(/_(horny|rebel)$/,'');
  return info(`${outfits[slot]??slot} 팩 이미지`,`${outfits[slot]??slot} 슬롯의 ${mode} 이미지 경로입니다.`,imageHint);
 }
 const seed=key.startsWith('seed_'),base=seed?key.slice(5):key;
 if(skills[base]&&(seed||typeof value==='number'))return info(`${skills[base]} ${seed?'초기 ':''}기술`,`${skills[base]} 기술의 ${seed?'영입 시 ':''}등급입니다.`,gradeHint+(base==='enchanter'?' 현재 대시보드에서는 연금 분류에 연결됩니다.':''));
 if(base.endsWith('_revealed'))return info('특성 정보 공개 여부',`${base.slice(0,-9)} 관련 정보가 이미 밝혀졌는지 지정합니다.`,'일반적으로 0=미공개, 1=공개이며 원본 코드를 확인해 유지합니다.');
 const matches=traits.filter(t=>t.binding?.key===base),names=[...new Set(matches.map(t=>t.name))];
 if(matches.length)return info(attributes[base]??'특성 조건값',`${seed?'영입 시 ':''}${names.join(' / ')} 특성 판정에 사용하는 값입니다.`,matches.map(t=>`${t.name}: ${t.id}`).join(' · '));
 if(attributes[base])return info(`${attributes[base]} 초기값`,`${attributes[base]}의 초기 능력치·상태 코드입니다.`,'항목별 게임 내부 척도입니다. 기술 등급이나 실제 나이와 동일하게 해석하지 않습니다.');
 return info('추가 필드 · 용도 미등록','원본 또는 사용자가 추가한 필드입니다. 확인된 해설이 아직 없습니다.','값과 원본 순서는 보존합니다. 이름만으로 효과를 추측하지 않습니다.','용도 확인 필요',false);
}
