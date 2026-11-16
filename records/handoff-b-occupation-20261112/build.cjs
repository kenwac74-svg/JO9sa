'use strict';
const fs=require('fs'),a=require('assert/strict');
const D=__dirname,R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',c=require(R+'/tools/text-workshop/core.cjs');
const nl=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+s.replaceAll("'","''")+"'",wr=(n,x)=>fs.writeFileSync(D+'/'+n,JSON.stringify(x,null,2)+'\n');
const specs=JSON.parse(fs.readFileSync(D+'/occupation-specs.source.json','utf8'));
const raw=fs.readFileSync(process.env.OCCUPATION_BASELINE||G+'/jack.qsp'),d=c.parse(raw),body=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5);
a.equal(d.hash,'a4d1985cba2f3071405fe8e6ac3edd47a1e29c1693dd84e7485b131974665a72');
const gcd=(x,y)=>y?gcd(y,x%y):x,frac=(n,de)=>{const g=gcd(n,de);return [n/g,de/g];};
const ledger={baseline:d.hash,sourceCommit:'66178cf5',probabilities:[],rules:[],notes:[],randomSeedNonzero:[],randomSeedCount:0,assumptions:[]};
const keys=[...new Set(specs.specs.flatMap(s=>s.rules.map(r=>r.trait?.key)).filter(Boolean))].filter(k=>!k.startsWith('jo9_')&&k!=='activity_sign');
for(const f of fs.readdirSync(G+'/json/slaves')){const match=f.match(/^(\d+)(?:_|\.json$)/);if(!match||!f.endsWith('.json'))continue;const id=+match[1];if(!(id>=1&&id<=247||id>=1001&&id<=1462&&id!==1448&&id!==1450||id>=2001&&id<=2340))continue;const j=JSON.parse(fs.readFileSync(G+'/json/slaves/'+f,'utf8').replace(/^\uFEFF/,''));if(j.seed_world_description||j.seed_family_description||j.seed_occupation_description)continue;ledger.randomSeedCount++;const nonzero=keys.filter(k=>j['seed_'+k]);if(nonzero.length)ledger.randomSeedNonzero.push({id,nonzero});}
a.equal(ledger.randomSeedNonzero.length,0,'Nonzero random seed requires a new conditional baseline derivation');
function prob(id,base,eligible,delta){const extra=frac(delta*eligible[1],100*eligible[0]);a(extra[0]<=extra[1],id+' impossible +percentage points');const row={id,base,eligible,delta,extra};ledger.probabilities.push(row);return extra;}
function defaultFraction(r){const id=r.trait.id,key=r.trait.key;switch(key){
case 'grace':return [[1,18],[17,18]];
case 'metabolism':return [[1,5],[4,5]];
case 'nymphomania':return [[1,30],[29,30]];
case 'homosexualism':return [[1,28],[27,28]];
case 'exhibitionism':return [[1,40],[39,40]];
case 'water_attitude':case 'blood_attitude':case 'perversion':case 'compassion':case 'courage':return [[1,24],[23,24]];
case 'selfesteem':return [[1,18],[17,18]];
case 'calisthenics_affinity':case 'expression_affinity':return [[1,7],[6,7]];
case 'sport_affinity':return [[1,18],[17,18]];
case 'jo9_ambition':case 'jo9_grudge':case 'jo9_focus':return [[1,10],[9,10]];
case 'jo9_learning_trait':case 'jo9_constitution':return [[3,100],[97,100]];
case 'passion_fame':return [[23,576],[506,576]];
case 'vermin_attitude':return [[23,576],[529,576]];
case 'cowSK_affinity':return [[391,3528],[1173,1960]];
case 'activity_sign':return [[5767,35280],[1193,1680]];
default:throw Error('Missing base '+id);}}
const test=t=>t.id==='activity_sign = -1'?"j9occ_upper = -1":`stock[${q(t.key)}] ${t.id.slice(t.key.length).trim()}`;
const value=t=>t.id.includes('<')?-1:t.id.includes('>')?1:+t.id.split('=').at(-1).trim();
function setTrait(t){if(t.key==='activity_sign')return "stock['jo9_work_ethic'] = -1 & stock['passion_comfort'] = 1";if(t.id==='virginity < 2')return "stock['virginity'] = 0";let code=`stock[${q(t.key)}] = ${value(t)}`;
if(t.key==='jo9_learning_trait'&&value(t)===1)code+=" & stock['intellect'] = 5 & stock_rate['intellect'] = 0";
if(t.key==='sport_affinity'&&value(t)===1)code+=" & stock['cowSK_affinity'] = 0";
if(t.key==='gladiatrix_affinity')code+=" & stock['cowSK_affinity'] = 0 & stock['pet_affinity'] = 0 & stock['dressage_affinity'] = 0";
if(t.key==='defiant'&&value(t)===1)code+=" & stock['jo9_slave_nature'] = 0 & stock['meekness'] = min(0,stock['meekness'])";
return code;}
function extraChance(r,id){const t=r.trait,k=t.key;let branches=[];
if(k==='defiant')branches=[{base:[43,2400],eligible:[1333,1600],condition:'j9occ_low = 1'},{base:[43,2400],eligible:[2107,2400],condition:'j9occ_low = 0'}];
else if(k==='meekness'&&t.id.includes('<'))branches=[{base:[19,480],eligible:[437,480],condition:'j9occ_low = 1'},{base:[1,24],eligible:[23,24],condition:'j9occ_low = 0'}];
else if(k==='meekness')branches=[{base:[5,48],eligible:[43,48]}];
else if(k==='jo9_peerless')branches=[{base:[1,100],eligible:[99,100],condition:"stock['beauty'] >= 5"},{base:[0,1],eligible:[1,1],condition:"stock['beauty'] < 5"}];
else{const [base,eligible]=defaultFraction(r);branches=[{base,eligible}];}
const eligible=t.key==='passion_fame'?"stock['jo9_attention'] = 0 and ":t.key==='vermin_attitude'?"stock['courage'] ! 2 and ":t.key==='meekness'&&t.id.includes('<')?"stock['jo9_slave_nature'] ! 1 and ":t.key==='defiant'?"stock['meekness'] <= 0 and stock['jo9_slave_nature'] ! 1 and ":t.key==='cowSK_affinity'?"stock['sport_affinity'] ! 1 and stock['gladiatrix_affinity'] ! 1 and j9occ_upper ! 1 and ":t.key==='activity_sign'?"j9occ_upper = 0 and ":'';
let code='';const fractions=[];for(let i=0;i<branches.length;i++){const b=branches[i],f=prob(id+(branches.length>1?' case'+i:''),b.base,b.eligible,r.probability);fractions.push({condition:b.condition||'all',...b,extra:f});code+=` if ${b.condition?b.condition+' and ':''}${eligible}(${test(t)}) = 0:\n  if func('jo9_occupation_init','roll',${f[1]}) <= ${f[0]}: ${setTrait(t)}\n end\n`;}
return {code,fractions};}
let src=`! JO9 MOD START OCCUPATION_INIT_20261112\n! Extra chances use exact eligible-state fractions frozen from current common rolls.\nif $args[0] = 'roll':\n result = rand(1,args[1])\n exit\nend\nif special_stock ! 0 or creating_clone ! 0 or stock['jo9_bg_random'] ! 1: exit\nlocal j9occ_low = iif(stock['ego'] < 4 and stock['pride'] < 4,1,0)\nlocal j9occ_stamina = stock['stamina']\nlocal j9occ_upper = 0\nif stock['jo9_work_ethic'] > 0 or stock['passion_comfort'] < 0:\n j9occ_upper = 1\nelseif stock['jo9_work_ethic'] < 0 or stock['passion_comfort'] > 0:\n j9occ_upper = -1\nend\nlocal j9occ_draw\n`;
for(let si=0;si<specs.specs.length;si++){const s=specs.specs[si];src+=`! Spec ${si+1}: ${s.label}\nif ${s.occupations.map(o=>'$stock_occupation = '+q(o.id)).join(' or ')}:\n`;for(let ri=0;ri<s.rules.length;ri++){const r=s.rules[ri],row={spec:si+1,rule:ri+1,label:s.label,type:r.type,status:r.status,mode:r.mode,target:r.trait?.id||r.skill?.key||r.text};if(r.status!=='확정'){ledger.rules.push(row);continue;}
switch(r.type){
case 'chance':if(r.mode==='add'){const e=extraChance(r,(si+1)+'.'+(ri+1));row.calculation='base + eligible * extra = base + delta/100';row.extra=e.fractions;src+=e.code;}else{a.equal(r.mode,'final');src+=` if func('jo9_occupation_init','roll',100) <= ${r.probability}:\n  ${setTrait(r.trait)}\n else\n  stock[${q(r.trait.key)}] = ${r.trait.key==='virginity'?2:0}\n end\n`;row.calculation='replacement final '+r.probability+'/100';}break;
case 'grant':src+=` ${setTrait(r.trait)}\n`;break;
case 'exclude':case 'forbid':if(r.trait.id==='virginity < 2')src+=" if stock['virginity'] < 2: stock['virginity'] = 2\n";else if(r.trait.key==='metabolism')src+=` if ${test(r.trait)}: stock['metabolism'] = 3\n`;else src+=` if ${test(r.trait)}: stock[${q(r.trait.key)}] = 0\n`;break;
case 'skillMin':src+=` stock[${q(r.skill.key)}] = max(stock[${q(r.skill.key)}],${r.minValue})\n`;break;
case 'skillExclude':{const vals=r.grades.map(g=>({F:0,D:1,C:2,B:3,A:4,S:5})[g]);a(vals.every((v,i)=>v===i),'Only contiguous lowest-grade exclusions supported');src+=` stock[${q(r.skill.key)}] = max(stock[${q(r.skill.key)}],${Math.max(...vals)+1})\n`;break;}
case 'group':src+=" j9occ_draw = func('jo9_occupation_init','roll',100)\n stock['homosexualism'] = 0\n if j9occ_draw <= 30: stock['homosexualism'] = 2\n if j9occ_draw > 30 and j9occ_draw <= 60: stock['homosexualism'] = 1\n";break;
case 'tiered':src+=" stock['gladiatrix_affinity'] = 0\n if stock['courage'] = 1: stock['courage'] = 0\n stock['jo9_combat_trait'] = 0\n if func('jo9_occupation_init','roll',100) <= 20:\n  if func('jo9_occupation_init','roll',2) = 1:\n   stock['gladiatrix_affinity'] = 1\n   stock['cowSK_affinity'] = 0 & stock['pet_affinity'] = 0 & stock['dressage_affinity'] = 0\n  else\n   stock['courage'] = 1\n  end\n  if func('jo9_occupation_init','roll',100) <= 20: stock['jo9_combat_trait'] = func('jo9_occupation_init','roll',3)\n end\n";row.calculation='20/100 entry, equal first choices, 20/100 conditional upper, 1/3 each upper';break;
default:throw Error('Unsupported '+r.type);}
ledger.rules.push(row);}src+='end\n';}
src+=`! Preserve the initial resource formula if an approved stamina minimum raised stamina.\nif stock['stamina'] > j9occ_stamina:\n stock['calories'] = stock['stamina']\n stock['energy'] = iif(stock['stamina'] > 0,min(5,stock['stamina'] + iif(difficulty_setting = 2,0,1)),0)\nend\ngs 'jo9_traits','activity_repair','stock'\ngs 'jo9_traits','attention_repair','stock'\ngs 'jo9_traits','repair_exclusions','stock'\n! JO9 MOD END OCCUPATION_INIT_20261112\n`;
const gs=body('generate_stock'),start=gs.indexOf('! JO9 MOD START COMBAT_TRAIT_INNATE_BACKGROUND'),end=gs.indexOf('! JO9 MOD END COMBAT_TRAIT_INNATE_BACKGROUND',start)+'! JO9 MOD END COMBAT_TRAIT_INNATE_BACKGROUND'.length;a(start>=0&&end>start);
const old=gs.slice(start,end),hook=nl("! JO9 MOD START OCCUPATION_INIT_CALL_20261112\nif special_stock = 0 and creating_clone = 0 and stock['jo9_bg_random'] = 1: gs 'jo9_occupation_init'\n! JO9 MOD END OCCUPATION_INIT_CALL_20261112");
const m={id:'2026-11-12_handoff_b_occupation_init',description:'31 occupation specs, 73 confirmed initialization rules; random backgrounds only; replaces old heroine innate combat roll',target:'game\\jack.qsp',before_sha256:d.hash,edits:[{location:'generate_stock',field:'body',old,new:hook,count:1}],add_locations:[{name:'jo9_occupation_init',desc:'',body:nl(src),actions:[]}]};
d.lines[d.locations.find(x=>x.name==='generate_stock').body]=c.shift(gs.replace(old,hook),-5);d.lines.splice(-1,0,c.shift('jo9_occupation_init',-5),'',c.shift(nl(src),-5),c.shift('0',-5));d.lines[3]=c.shift(String(d.locations.length+1),-5);const candidate=c.serialize(d);c.parse(candidate);m.after_sha256=c.hash(candidate);
ledger.assumptions=['All eligible current random appearance presets have zero source trait seed fields; verified each build.','Common draw rates are frozen source probabilities; occupation delta adjusts eligible residuals exactly.','Conditional slave-nature rates depend on actual current ego/pride, not aggregate samples.','Activity raw targets and canonical display rates differ after positive/upper folding.','Cheat generation modes are explicit overrides; statistical guarantees apply with cheat_h/j/l off.'];
wr('module.json',m);wr('probability-ledger.json',ledger);fs.writeFileSync(D+'/occupation-init.qsps',nl(src));console.log(JSON.stringify({module:m.id,before:m.before_sha256,after:m.after_sha256,rules:ledger.rules.length,confirmed:ledger.rules.filter(r=>r.status==='확정').length,probabilities:ledger.probabilities.length}));
