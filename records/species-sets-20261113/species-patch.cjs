'use strict';
const fs=require('fs'),a=require('assert/strict'),R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/species-sets-20261113',D=R+'/records/species-sets-20261113',c=require(R+'/tools/text-workshop/core.cjs'),raw=fs.readFileSync(process.argv[2]||W+'/jack.qsp');a.equal(c.hash(raw),'c1a37feb6ef11513b7293efa93ec974d514997354013dc11ee4c4a3d363465b9');const d=c.parse(raw),edits=[],nl=s=>s.replace(/\r?\n/g,'\r\n'),body=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5);
function edit(location,old,replacement,id='SPECIES_SET_20261113',count=1){old=nl(old);replacement=nl(replacement);const l=d.locations.find(x=>x.name===location),s=body(location);a.equal(s.split(old).length-1,count,location+':'+id);edits.push({location,field:'body',old,new:replacement,count,patchId:id});d.lines[l.body]=c.shift(s.split(old).join(replacement),-5)}const mark=(s,id='SPECIES_SET_20261113')=>`! JO9 MOD START ${id}\n${s}\n! JO9 MOD END ${id}`;
const apply=`if $args[0] = 'species_apply':
 dynamic replace({
  ! jo9_species: 1 ghost, 2 android. Existing vampire marker remains separate.
  if jo9sactor['jo9_species'] = 0 and jo9sactor_type = 3011: jo9sactor['jo9_species'] = 1
  if jo9sactor['jo9_species'] = 0 and jo9sactor_type = 3018: jo9sactor['jo9_species'] = 2
  if jo9sactor['jo9_vampire'] ! 1:
   if jo9sactor['jo9_species'] = 1:
    jo9sactor['masochism'] = 1
    jo9sactor['masochism_revealed'] = 2
    jo9sactor['darkness_attitude'] = 2
    jo9sactor['darkness_attitude_revealed'] = 2
    jo9sactor['passion_luxury'] = -1
    jo9sactor['passion_luxury_revealed'] = 2
    jo9sactor['passion_fame'] = -1
    jo9sactor['passion_fame_revealed'] = 2
    jo9sactor['pos_praise'] = 0
    ! Keep the existing attention/hikikomori exclusion, with the racial set taking priority.
    jo9sactor['jo9_attention'] = 0
    jo9sactor['jo9_attention_known'] = 0
    if jo9sactor['abuse_attitude'] = -1: jo9sactor['abuse_attitude'] = 0 & jo9sactor['abuse_attitude_revealed'] = 0
    jo9sactor['metabolism'] = 5
    jo9sactor['metabolism_revealed'] = 2
   elseif jo9sactor['jo9_species'] = 2:
    jo9sactor['nymphomania'] = -2
    jo9sactor['nymphomania_revealed'] = 2
    jo9sactor['meekness'] = 1
    jo9sactor['meekness_revealed'] = 2
    jo9sactor['metabolism'] = 5
    jo9sactor['metabolism_revealed'] = 2
    jo9sactor['secretary_affinity'] = 1
    jo9sactor['secretary_affinity_revealed'] = 2
   end
  end
 }, 'jo9sactor', $args[1])
 gs 'jo9_traits','stone_repair',$args[1]
 exit
end
if $args[0] = 'stone_repair':
 dynamic replace({
  if jo9stone['nymphomania'] < -1:
   if jo9stone['oral_affinity'] > 0: jo9stone['oral_affinity'] = 0 & jo9stone['oral_affinity_revealed'] = 0
   if jo9stone['anal_affinity'] > 0: jo9stone['anal_affinity'] = 0 & jo9stone['anal_affinity_revealed'] = 0
  end
 },'jo9stone',$args[1])
 exit
end
if $args[0] = 'species_component' or $args[0] = 'species_component_text':
 $result = ''
 if $args[1] = 'pain': $result = $Привычна_к_боли
 if $args[1] = 'darkness': $result = $Дитя_тьмы
 if $args[1] = 'frugal': $result = $Аскетичная
 if $args[1] = 'loner': $result = $Хикикомори
 if $args[1] = 'metabolism': $result = $Мощный_метаболизм
 if $args[1] = 'stone': $result = $jo9_nymph_stone_text
 if $args[1] = 'obedient': $result = $Дисциплинированная
 if $args[1] = 'advisor': $result = $секретарша
 if $args[0] = 'species_component' and $result ! '': msg $result
 exit
end`;
const menus=[['ghost','유령',[['pain','통증 내성',2],['darkness','암흑기호증',2],['frugal','검소함',2],['loner','은둔형 외톨이',2],['metabolism','고도 대사량',5]],' 전투에서 받는 체력·스태미나 피해가 각각 절반으로 줄어듭니다.'],['android','안드로이드',[['stone','석녀',0],['obedient','강한 복종심',5],['metabolism','고도 대사량',5],['advisor','보좌관',5]],' 전투에서 받는 체력·스태미나 피해가 각각 1/3 줄어들며, 사기 피해를 받지 않습니다.']];let menuCode='';for(const [key,title,components,defense]of menus){menuCode+=`if $args[0] = '${key}_text':\n $result = '${title}${key==='ghost'?'은':'는'} 다음과 같은 특성을 모두 가집니다. '\n`;components.forEach(([k,label,grade],i)=>{menuCode+=` $result += '<a href="EXEC: gs ''jo9_traits'', ''species_component'', ''${k}''"><<dyneval($vb_cycle_skill, ${grade}, "[${label}]")>></a>${i<components.length-1?', ':''}'\n`});menuCode+=` $result += '${defense}'\n exit\nend\n`;}
const traitsHead=body('jo9_traits').split('\r\n').slice(0,2).join('\r\n');edit('jo9_traits',traitsHead,mark(apply+'\n'+menuCode)+'\n'+traitsHead.replace('! Existing component fields carry all effects; the species marker adds no separate multiplier.','! Component fields keep their existing effects; incoming combat damage also applies the approved racial reduction.'));edit('jo9_traits',"if $args[0] = 'vampire_apply':","if $args[0] = 'vampire_apply':\n gs 'jo9_traits','species_apply',$args[1]");
const oldRace="  if dynslave['jo9_vampire'] = 1: $result = '<a href=\"EXEC: gs ''jo9_traits'', ''describe'', ''vampire''\">[뱀파이어]</a><br>'";edit('jo9_traits',oldRace,oldRace+"\n  if dynslave['jo9_vampire'] ! 1 and dynslave['jo9_species'] = 1: $result = '<a href=\"EXEC: gs ''jo9_traits'', ''describe'', ''ghost''\">[유령]</a><br>'\n  if dynslave['jo9_vampire'] ! 1 and dynslave['jo9_species'] = 2: $result = '<a href=\"EXEC: gs ''jo9_traits'', ''describe'', ''android''\">[안드로이드]</a><br>'");
edit('jo9_traits'," if $args[1] = 'vampire': $result = $func('jo9_traits','vampire_text')"," if $args[1] = 'vampire': $result = $func('jo9_traits','vampire_text')\n if $args[1] = 'ghost': $result = $func('jo9_traits','ghost_text')\n if $args[1] = 'android': $result = $func('jo9_traits','android_text')");
const vampEnd=" $result += '<a href=\"EXEC: gs ''jo9_traits'', ''vampire_component'', ''mage''\"><<dyneval($vb_cycle_skill, 5, \"[타고난 마법사]\")>></a>'";edit('jo9_traits',vampEnd,vampEnd+"\n $result += ' 전투에서 받는 체력·스태미나·사기 피해가 각각 1/3 줄어듭니다.'");
edit('jo9_traits',"if $args[0] = 'vampire_cache':","if $args[0] = 'vampire_cache':\n if instr($jo9_nymph_stone_text,'애널·펠라 중독과 색정광·정액 중독은 발생하지 않는다.') = 0: $jo9_nymph_stone_text += ' 애널·펠라 중독과 색정광·정액 중독은 발생하지 않는다.'",'STONE_EXCLUSION_CACHE_20261113');
for(const key of ['$update_slave_features_list','$newloc_update_iced_features_list'])edit('jo9_traits',`instr(${key},'VAMPIRE_SET_20261113')`,`instr(${key},'SPECIES_SET_20261113')`);
for(const loc of ['#static_base','$stock_traits','jo9_farid_consignment','$newloc']){const line=body(loc).split('\r\n').find(s=>s.includes("+= $func('jo9_traits','race_list'"));a(line);edit(loc,line,'! SPECIES_SET_20261113\n'+line);}
for(const [prefix,extra]of [["if dynslave['jo9_vampire'] ! 1 and dynslave['metabolism'] = 5 and","dynslave['jo9_species'] = 0"],["if dynslave['jo9_vampire'] ! 1 and dynslave['darkness_attitude'] = 2 and","dynslave['jo9_species'] ! 1"],["if dynslave['masochism'] = 1 and","dynslave['jo9_species'] ! 1"],["if dynslave['passion_luxury'] = -1 and","dynslave['jo9_species'] ! 1"],["if dynslave['passion_fame'] = -1 and","dynslave['jo9_species'] ! 1"],["if dynslave['nymphomania'] < -1 and","dynslave['jo9_species'] ! 2"],["if dynslave['meekness'] > 0 and","dynslave['jo9_species'] ! 2"],["if dynslave['secretary_affinity'] > 0 and","dynslave['jo9_species'] ! 2"]]){const line=body('#static_base').split('\r\n').find(s=>s.trim().startsWith(prefix)&&s.includes('spell_revelio'));a(line,prefix);edit('#static_base',line,mark(line.replace('if ',`if ${extra} and `)));}
edit('jo9_traits',"if $args[0] = 'repair_exclusions':\n result = 0","if $args[0] = 'repair_exclusions':\n gs 'jo9_traits','stone_repair',$args[1]\n result = 0",'STONE_EXCLUSION_20261113');
edit('jo9_traits'," if jo9x_candidate = 0: exit"," if jo9x_candidate = 0: exit\n"+mark(" if jo9x_candidate > 0 and ($args[2] = 'oral_affinity' or $args[2] = 'anal_affinity' or $args[2] = 'nymphomania'):\n  if dyneval('result = <<$args[1]>>[\"nymphomania\"]') < -1: result = 0 & exit\n end",'STONE_EXCLUSION_20261113'),'STONE_EXCLUSION_20261113');
for(const [old,rep]of [["  if jo9ceactor['nymphomania'] < 0:","  if jo9ceactor['jo9_species'] ! 2 and jo9ceactor['nymphomania'] < 0:"],["  if jo9ceactor['passion_luxury'] = -1 or jo9ceactor['passion_luxury'] = 1:","  if jo9ceactor['jo9_species'] ! 1 and (jo9ceactor['passion_luxury'] = -1 or jo9ceactor['passion_luxury'] = 1):"],["  if jo9ceactor['passion_fame'] = -1:","  if jo9ceactor['jo9_species'] ! 1 and jo9ceactor['passion_fame'] = -1:"]])edit('jo9_chaotic',old,mark(rep));
const combat=`if $args[0] = 'incoming':
 result = args[2]
 if result <= 0 or $jo9_trait_combat_actor = '': exit
 local jo9s_vampire = dyneval('result = <<$jo9_trait_combat_actor>>["jo9_vampire"]')
 local jo9s_species = dyneval('result = <<$jo9_trait_combat_actor>>["jo9_species"]')
 if jo9s_vampire = 1:
  result = result * 2 / 3
 elseif jo9s_species = 1 and $args[1] ! 'morale':
  result /= 2
 elseif jo9s_species = 2:
  if $args[1] = 'morale':
   result = 0
  else
   result = result * 2 / 3
  end
 end
 exit
end`;
edit('jo9_traits_combat',body('jo9_traits_combat').split('\r\n')[0],mark(combat)+'\n'+body('jo9_traits_combat').split('\r\n')[0]);edit('jo9_traits_combat'," $jo9_trait_combat_actor = $args[1]"," $jo9_trait_combat_actor = $args[1]\n if $args[1] ! '': gs 'jo9_traits','vampire_apply',$args[1]");
for(const [resource,key,count]of [['здоровье_игрока','hp',1],['выносливость_игрока','stamina',2],['дух_игрока','morale',3]])edit('конец_раунда',resource+' -= cheat_fight_dif * нанесенный_вред[i]',resource+` -= func('jo9_traits_combat','incoming','${key}',cheat_fight_dif * нанесенный_вред[i])`,'SPECIES_DAMAGE_20261113',count);
// Preserve stone while other background/legacy profile passes apply. Generic stone cure remains available.
edit('generate_stock',"if stock['nymphomania'] < 0: stock['nymphomania'] = rand(0,1)","if stock['nymphomania'] = -1: stock['nymphomania'] = rand(0,1)",'STONE_EXCLUSION_20261113');edit('jo9_occupation_init',"if (stock['nymphomania'] = -1) = 0:","if stock['nymphomania'] >= 0:",'STONE_EXCLUSION_20261113',2);edit('$ongload',"if jo9shiruactor['jo9_nymph_no_upgrade'] = 0:","if jo9shiruactor['jo9_nymph_no_upgrade'] = 0 and jo9shiruactor['nymphomania'] >= -1:",'STONE_EXCLUSION_20261113');
let dm=body('jo9_dohna_migrate');for(const line of new Set(dm.split('\r\n').filter(s=>/j9dmactor\['nymphomania'\]=max/.test(s))))edit('jo9_dohna_migrate',line,line.replace("j9dmactor['nymphomania']=", "if j9dmactor['nymphomania'] >= -1: j9dmactor['nymphomania']="),'STONE_EXCLUSION_20261113',dm.split(line).length-1);for(const key of ['oral_affinity','anal_affinity']){const line=body('jo9_dohna_migrate').split('\r\n').find(s=>s.trim()===`j9dmactor['${key}']=1`);a(line);edit('jo9_dohna_migrate',line,line.replace(`j9dmactor['${key}']=1`,`if j9dmactor['nymphomania'] >= -1: j9dmactor['${key}']=1`),'STONE_EXCLUSION_20261113');}
const stone=body('#static_txt').split('\r\n').find(s=>s.startsWith('$jo9_nymph_stone_text = '));a(stone);edit('#static_txt',stone,stone.slice(0,-1)+' 애널·펠라 중독과 색정광·정액 중독은 발생하지 않는다.\'','STONE_EXCLUSION_20261113');
const bytes=c.serialize(d);a.equal(c.parse(bytes).locations.length,311);fs.writeFileSync(T+'/candidate.qsp',bytes);const mod={id:'2026-11-13_species_sets_damage_stone',status:'APPROVED',approval:'User specified ghost/android bundles, vampire and android take2/3 HP/stamina damage, vampire takes2/3 morale, ghost takes1/2 HP/stamina with unchanged morale, android morale immunity, stone blocks oral/anal/nymph addictions. Existing ghost/android preset matches verified in JSON.',before_sha256:c.hash(raw),after_sha256:c.hash(bytes),edits};fs.writeFileSync(D+'/candidate-mod.json',JSON.stringify(mod,null,2)+'\n');console.log(JSON.stringify({before:mod.before_sha256,after:mod.after_sha256,edits:edits.length,changed:[...new Set(edits.map(x=>x.location))]}));
