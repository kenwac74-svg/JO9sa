// Curated, editable introduction compatibility. IDs never change with translated labels.
export const COHERENT_CONNECTIONS_VERSION='20261112-links-v2';
const words=value=>value.trim().split(/\s+/).filter(Boolean);
const same=(...values)=>[...new Set(values.flatMap(value=>typeof value==='string'?words(value):value))];
const feudal='orphan bondman gypsy church craftsman merchant valetry knight mprincess ancient_noble ancient_citizen roman_freedslave pesant hunter fisher';
const tribal='tribe amazon nomad pesant hunter fisher viking barbarian_king orphan craftsman merchant ancient_noble ancient_citizen roman_freedslave';
const factory='farmers workhouse proletarian clerk naturalist ingeneer doctor servant magnat bankeer mayor mafiosi';
const contemporary='orpnange worker policeman manager biologist programmer surgeon businessman finance general';
export const WORLD_FAMILIES={
 prehistoric:words('tribe amazon'),
 barbarian:words(tribal),
 sns:same(tribal,feudal),
 medieval:words(feudal),
 darkfantasy:same(feudal,'tribe amazon nomad barbarian_king'),
 highfantasy:same(feudal,'tribe amazon nomad barbarian_king'),
 steampunk:same(factory,'knight mprincess ancient_noble ancient_citizen roman_freedslave'),
 industrial:words(factory),
 modern:words(contemporary),
 cyberpunk:same(contemporary,'gendesigner'),
 utopia:words('poet artist architect operator'),
 darkfuture:words('jailer bioreactor minitruth anter proletarian ingeneer general'),
 space:same('freetrader astrofarm asteroid astrogator admiral nanofarmacist gendesigner',contemporary),
 earth_rome:words('ancient_noble ancient_citizen roman_freedslave orphan craftsman merchant valetry pesant hunter fisher mprincess'),
};
const settled='barbarian sns medieval darkfantasy highfantasy steampunk industrial modern cyberpunk space earth_rome';
const premodern='barbarian sns medieval darkfantasy highfantasy earth_rome';
const technical='steampunk industrial modern cyberpunk darkfuture space';
const JOB_WORLDS={
 tribal_girl:'prehistoric barbarian sns earth_rome',
 schoolgirl:'medieval darkfantasy highfantasy steampunk industrial modern cyberpunk utopia darkfuture space',
 dancer:settled+' utopia darkfuture',
 shaman:'prehistoric barbarian sns darkfantasy highfantasy',
 heroine:'prehistoric barbarian sns medieval darkfantasy highfantasy earth_rome',
 huntress:'prehistoric barbarian sns medieval darkfantasy highfantasy steampunk industrial modern',
 bride:premodern,
 viking_wife:'barbarian sns',
 witch:'sns darkfantasy highfantasy',
 herbalist:settled,
 barbarian_princess:'barbarian sns darkfantasy highfantasy',
 thief:settled+' darkfuture',
 beggar:settled,
 gypsy:'barbarian sns medieval darkfantasy highfantasy steampunk industrial modern',
 whore:settled,
 markitane:'barbarian sns medieval darkfantasy highfantasy steampunk industrial earth_rome',
 brothel:settled,
 nun:'medieval darkfantasy highfantasy steampunk industrial modern cyberpunk space',
 valertry:'sns medieval darkfantasy highfantasy steampunk',
 sorceress:'sns darkfantasy highfantasy',
 thug:settled+' darkfuture',
 poor_bride:settled,
 poor_wife:settled,
 brigand:premodern+' steampunk industrial',
 noble_bride:'sns medieval darkfantasy highfantasy steampunk earth_rome',
 noble_wife:'sns medieval darkfantasy highfantasy steampunk',
 mprincess:'sns medieval darkfantasy highfantasy steampunk earth_rome',
 farmer:'steampunk industrial modern cyberpunk darkfuture',
 milker:settled,
 swiner:settled,
 weaver:technical,
 freaser:technical,
 maid:technical,
 sufragist:'steampunk industrial modern cyberpunk space',
 nurse:'medieval darkfantasy highfantasy steampunk industrial modern cyberpunk darkfuture space',
 teacher:settled+' darkfuture utopia',
 oficiant:'steampunk industrial modern cyberpunk space',
 avanturiste:'sns medieval darkfantasy highfantasy steampunk industrial modern cyberpunk space earth_rome',
 rich_bride:settled,
 rich_wife:settled,
 punk:'modern cyberpunk space',
 student:'steampunk industrial modern cyberpunk darkfuture space utopia',
 secretary:technical,
 voleyball:'industrial modern cyberpunk space utopia',
 karateka:'industrial modern cyberpunk space',
 hymnast:'industrial modern cyberpunk space utopia',
 policewoman:'steampunk industrial modern cyberpunk space',
 model:'industrial modern cyberpunk space',
 hacker:'modern cyberpunk darkfuture space',
 writer:'steampunk industrial modern cyberpunk darkfuture space utopia',
 major:'industrial modern cyberpunk space',
 artist:'sns medieval darkfantasy highfantasy steampunk industrial modern cyberpunk darkfuture space utopia earth_rome',
 mind_contol:'darkfuture',
 time_plice:'darkfuture space',
 jailer:'darkfuture',
 anter:'darkfuture',
 academy:'space',
 mech:'space',
 contraband:'space',
 astrofarmer:'space',
 installer:'space',
 courtesan:settled,
 serial_killer:settled+' darkfuture',
 gang_member:settled+' darkfuture',
 mafia_boss:settled,
 former_slave:'barbarian sns earth_rome medieval highfantasy darkfantasy steampunk',
};
export const JOB_COMPATIBILITY_REASONS={
 royal:'공주 직업은 왕가·부족장 가문 출신을 필요로 한다.',
 noble:'귀족 신분을 직접 전제하는 직업은 귀족·왕가 출신에 연결한다.',
 wealth:'혼인 재산을 직접 전제하는 직업은 재산이 있는 가정 출신에 연결한다.',
 hardship:'기본 생계형 범죄·빈곤 경력은 생활 여건이 어려운 출신을 중심으로 연결한다.',
 space:'함선·행성 간 운송·궤도시설을 직접 전제하므로 성간 우주 문명에 한정한다.',
 magic:'실제 마법 수련은 마법이 명시된 세계에 한정한다. 샤먼의 의례와 구분한다.',
 control:'사상 단속·생물반응기 형벌·국가 직업 배치는 전체주의 통제 세계에 한정한다.',
 industry:'기계 공장·선반·회사 사무는 산업 기반이 있는 세계에 연결한다.',
 utopia:'범죄·빈곤·군경이 사라진 유토피아에는 이를 전제하는 직업을 연결하지 않는다.',
};
const familyProfiles={
 royal:words('mprincess barbarian_king'),
 noble:words('mprincess barbarian_king knight ancient_noble'),
 wealthy:words('mprincess barbarian_king knight ancient_noble merchant farmers doctor magnat bankeer mayor mafiosi surgeon businessman finance programmer general astrofarm admiral gendesigner'),
 hardship:words('tribe amazon nomad pesant hunter fisher viking orphan bondman gypsy church valetry roman_freedslave ancient_citizen workhouse proletarian servant orpnange worker anter asteroid freetrader'),
 rural:words('tribe amazon nomad pesant hunter fisher viking barbarian_king bondman gypsy ancient_citizen roman_freedslave farmers'),
 seafaring:words('viking fisher barbarian_king'),
};
export const HARDSHIP_CONNECTION_JOBS=words('thief beggar whore markitane brothel thug brigand gang_member');
export function occupationConnectionClass(id){
 if(id==='barbarian_princess')return 'tribalRoyal';
 if(id==='mprincess')return 'royal';
 if(id==='noble_bride')return 'noble';
 if(['noble_wife','rich_bride','rich_wife','major'].includes(id))return 'wealthy';
 if(id==='viking_wife')return 'seafaring';
 if(['shaman','huntress'].includes(id))return 'rural';
 if(HARDSHIP_CONNECTION_JOBS.includes(id))return 'hardship';
 return 'open';
}
export function buildCoherentConnections(catalogue){
 const ids=kind=>catalogue.records.filter(r=>r.kind===kind).map(r=>r.id);
 const families=new Set(ids('family')),jobs=[...new Set(ids('occupation'))],worlds=[...new Set(ids('world'))];
 const links={worldFamilies:{},worldOccupations:{},occupations:{},occupationFamilies:{}};
 for(const world of worlds){
  if(!WORLD_FAMILIES[world])throw new Error('세계 연결 검토 필요: '+world);
  links.worldFamilies[world]=WORLD_FAMILIES[world].filter(id=>families.has(id));
  links.worldOccupations[world]=[];
  for(const job of jobs){
   if(!JOB_WORLDS[job])throw new Error('직업 연결 검토 필요: '+job);
   if(!words(JOB_WORLDS[job]).includes(world))continue;
   const group=occupationConnectionClass(job);
   const pool=group==='tribalRoyal'?['barbarian_king']:group==='open'?null:familyProfiles[group];
   const allowed=pool===null?null:links.worldFamilies[world].filter(id=>pool.includes(id));
   if(allowed?.length===0)continue;
   links.worldOccupations[world].push(job);
   links.occupationFamilies[world+':'+job]={required:allowed,rejected:[]};
  }
 }
 return links;
}

// Explicit application replaces the graph. Existing ages are retained; newly
// connected, previously approved age defaults are filled only when absent.
export function applyCoherentConnections(config,catalogue){
 config.backgroundSettings??={};
 config.backgroundSettings.links=buildCoherentConnections(catalogue);
 config.backgroundSettings.ageRules??={world:{},family:{},occupation:{}};
 for(const record of catalogue.records){
  const rule=record.id==='tribal_girl'&&record.kind==='occupation'?{required:[0],rejected:[]}:record.suggestedAgeRule;
  if(rule){const group=config.backgroundSettings.ageRules[record.kind]??={};if(!Object.hasOwn(group,record.id))group[record.id]=JSON.parse(JSON.stringify(rule));}
 }
 config.backgroundSettings.defaultConnectionsVersion=COHERENT_CONNECTIONS_VERSION;
 return config.backgroundSettings.links;
}
