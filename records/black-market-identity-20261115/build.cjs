'use strict';
const fs=require('fs'),z=require('zlib'),a=require('assert/strict'),path=require('path');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',D=R+'/records/black-market-identity-20261115',T='G:/Codex/tmp/black-market-identity-20261115',c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs');
const raw=fs.readFileSync(W+'/jack.qsp'),d=c.parse(raw),nl=s=>s.replace(/\r?\n/g,'\r\n'),id='BLACK_MARKET_RANDOM_IDENTITY_20261115';a.equal(c.hash(raw),'20b14e3101884ea111484258ec6e5c6919d6e3d4457e8c081e9987073b819d45');a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));a(c.serialize(d).equals(raw));
const body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),gs=body('generate_stock').split('\r\n'),bg=body('jo9_background_b');
const familyKeys=new Set(),jobKeys=new Set();
for(const line of bg.split('\r\n')){if(!line.includes("$args[1] = 'barbarian'"))continue;const m=line.match(/\$result = '([^']+)'/);if(!m)continue;if(line.includes('args[3]'))m[1].split('|').forEach(x=>jobKeys.add(x));else if(line.includes('args[2]'))m[1].split('|').forEach(x=>familyKeys.add(x));}
a(familyKeys.size>10);a(jobKeys.size>20);
function info(kind,key){const p=gs.findIndex(l=>l.includes("$stock_"+kind+" = '"+key+"'"));a(p>=0,key);const following=gs.slice(p+1).findIndex(l=>/^(?:else)?if \$stock_(family|occupation) = /.test(l)),block=gs.slice(p,p+1+(following<0?45:following));const indexKey=kind==='family'?'family_index':'work_index';const index=block.find(l=>l.includes('stock[')&&l.includes(indexKey));a(index,key+' index');const number=index.match(/=\s*(\d+)/);a(number,key);let label=block.find(l=>l.includes('$stock_'+kind+'_auk'));label=label?label.slice(label.indexOf('=')+1).trim():null;if(key==='barbarian_princess')label="'야만족 공주'";if(key==='rich_wife')label="'부유한 아내'";a(label,key+' label');return{index:Number(number[1]),label};}
const familyMap=Object.fromEntries([...familyKeys].map(k=>[k,info('family',k)])),jobMap=Object.fromEntries([...jobKeys].map(k=>[k,info('occupation',k)]));
let mapping='';for(const[k,v]of Object.entries(familyMap))mapping+=` if $stock_family='${k}': stock['family_index']=${v.index} & $stock_family_auk=${v.label}\n`;for(const[k,v]of Object.entries(jobMap))mapping+=` if $stock_occupation='${k}': stock['work_index']=${v.index} & $stock_occupation_auk=${v.label}\n`;
const branch=nl(`! JO9 MOD START ${id}
if $args[0]='market_identity':
 result=0
 if stock_type<2586 or stock_type>2597 or creating_clone!0: exit
 gs 'jo9_background_b','refresh'
 local $jo9_bm_families,$jo9_bm_jobs,$jo9_bm_family,$jo9_bm_job,$jo9_bm_namebase
 local jo9_bm_name_count
 ! Preserve the registered world/region values and world story. Use its existing civilization-stage pool.
 $jo9_bm_families=$func('jo9_background_b','families','barbarian',stock['age'])
 if $jo9_bm_families='': exit
 $jo9_bm_family=$func('jo9_background_b','pick',$jo9_bm_families)
 $jo9_bm_jobs=$func('jo9_background_b','occupations','barbarian',$jo9_bm_family,stock['age'])
 if $jo9_bm_jobs='': exit
 $jo9_bm_job=$func('jo9_background_b','pick',$jo9_bm_jobs)
 if $family_description[$jo9_bm_family]='' or $occupation_description[$jo9_bm_job]='': exit
 $jo9_bm_namebase='barbarian'
 if stock_type>=2589 and stock_type<=2591: $jo9_bm_namebase='euro'
 if stock_type>=2595: $jo9_bm_namebase='russian'
 if stock_type>=2592 and stock_type<=2594:
  $stock_name=$func('jo9_background_b','pick','아키라|아야|아야네|치하루|에미|하나|하루카|히나|이즈미|카에데|카나|카오리|미오|미사키|나나|나오|리나|사쿠라|사야|시오리|수진|서연|지은|하린|유나|메이|린|리엔|샤오란|위에')
 else
  jo9_bm_name_count=arrsize('$'+$jo9_bm_namebase+'_name')-1
  if jo9_bm_name_count<1: exit
  $stock_name=$dyneval('$result=$'+$jo9_bm_namebase+'_name['+str(rand(1,jo9_bm_name_count))+']')
 end
 $stock_family=$jo9_bm_family
 $stock_occupation=$jo9_bm_job
 $stock_family_description=$family_description[$stock_family]
 $stock_occupation_description=$occupation_description[$stock_occupation]
${mapping} result=1
 exit
end
! JO9 MOD END ${id}
`);
const edits=[];function edit(n,old,nu){const b=body(n);a.equal(b.split(old).length,2,'unique '+n);d.lines[d.locations.find(l=>l.name===n).body]=c.shift(b.replace(old,()=>nu),-5);edits.push({location:n,field:'body',old,new:nu,count:1,patchId:id});}
const bgAnchor='! JO9 MOD START B_BACKGROUND_SELECTOR_20261112';edit('jo9_background_b',bgAnchor,branch+bgAnchor);
const anchor='special_stock = 0\r\n\r\n! JO9 MOD END TRAIT_MERGE_EXCLUSIONS_20261025';
edit('generate_stock',anchor,nl(`! JO9 MOD START ${id}
if special_stock>=2586 and special_stock<=2597 and stock_type=special_stock and creating_clone=0:
 gs 'jo9_background_b','market_identity'
end
! JO9 MOD END ${id}
`)+anchor);
const out=c.serialize(d);qa.inspectWorld(out);a.equal(c.parse(out).locations.length,c.parse(raw).locations.length);fs.mkdirSync(D,{recursive:true});fs.mkdirSync(T+'/mods',{recursive:true});if(fs.existsSync(D+'/baseline.qsp.gz'))a(z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz')).equals(raw));else fs.writeFileSync(D+'/baseline.qsp.gz',z.gzipSync(raw));fs.writeFileSync(D+'/manifest.before.json.gz',z.gzipSync(fs.readFileSync(R+'/assets/runtime-source-2.4.1.json')));fs.writeFileSync(T+'/baseline.qsp',raw);fs.writeFileSync(T+'/candidate.qsp',out);const mod={id,status:'APPROVED',before_sha256:c.hash(raw),after_sha256:c.hash(out),edits};fs.writeFileSync(T+'/mods/2026-11-15_black_market_random_identity.json',JSON.stringify(mod,null,2)+'\n');fs.writeFileSync(D+'/plan.json',JSON.stringify({before:mod.before_sha256,after:mod.after_sha256,locations:edits.map(e=>e.location),familyMap,jobMap,newSaveFields:0,mod:'2026-11-15_black_market_random_identity.json'},null,2)+'\n');for(const f of ['build.cjs','probe.cjs','PLAN_KO.md'])if(path.resolve(__dirname+'/'+f)!==path.resolve(D+'/'+f))fs.copyFileSync(__dirname+'/'+f,D+'/'+f);fs.copyFileSync(__dirname+'/PLAN_KO.md',R+'/docs/superpowers/plans/2026-11-15-black-market-identity.md');console.log(JSON.stringify({after:mod.after_sha256,edits:2,families:familyKeys.size,jobs:jobKeys.size}));
