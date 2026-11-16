'use strict';
const fs=require('fs'),z=require('zlib'),a=require('assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',D=R+'/records/black-market-attributes-20261115',T='G:/Codex/tmp/black-market-attributes-20261115',c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs');
const raw=fs.readFileSync(W+'/jack.qsp'),d=c.parse(raw),nl=s=>s.replace(/\r?\n/g,'\r\n'),id='BLACK_MARKET_RANDOM_ATTRIBUTES_20261115';
a.equal(c.hash(raw),'568985a89c642afc0c0cf6e5fa83a1020f4114b00bfacc0622a82ea921705dc0');a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));a(c.serialize(d).equals(raw));
const body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),gs=body('generate_stock'),guard="special_stock>=2586 and special_stock<=2597 and stock_type=special_stock and creating_clone=0";
const legacy=gs.slice(gs.indexOf('\t!TRAITS\r\n')+'\t!TRAITS\r\n'.length,gs.indexOf('\t!ILLNESS\r\n')).replace(/^\t/gm,'');
const keys=[...new Set([...legacy.matchAll(/stock\['([^']+)'\]\s*=/g)].map(m=>m[1]))];a(keys.length>30);
const branch=nl(`! JO9 MOD START ${id}
if $args[0]='market_grade':
 result=0
 if args[2]<1 or args[2]>100: exit
 if $args[1]='beauty' or $args[1]='stamina':
  result=2
  if args[2]>40: result=3
  if args[2]>70: result=4
  if args[2]>90: result=5
 elseif $args[1]='pride':
  result=2
  if args[2]>45: result=1
  if args[2]>75: result=0
 elseif $args[1]='exotic':
  result=1
  if args[2]>35: result=2
  if args[2]>65: result=3
  if args[2]>85: result=4
  if args[2]>95: result=5
 end
 exit
end
if $args[0]='market_attributes':
 if ${guard}:
  ! Roll base attributes; normal physique/trait/status adjustments remain in force.
  stock['beauty']=func('jo9_background_b','market_grade','beauty',rand(1,100))
  stock['stamina']=func('jo9_background_b','market_grade','stamina',rand(1,100))
  stock['sensitivity']=rand(1,5)
  stock['temper']=rand(1,5)
  stock['intellect']=rand(1,5)
  stock['ego']=rand(1,5)
  stock['pride']=func('jo9_background_b','market_grade','pride',rand(1,100))
  stock['exotic']=func('jo9_background_b','market_grade','exotic',rand(1,100))
  stock['fat']=rand(0,4)
  stock_rate['stamina']=0
  stock_rate['sensitivity']=0
  stock_rate['temper']=0
  stock_rate['intellect']=0
  stock_rate['ego']=0
  stock_rate['pride']=0
  stock_rate['fat']=0
 end
 exit
end
if $args[0]='market_traits':
 if ${guard}:
  ! Reset only the existing ordinary-generation trait pool, then reuse its rolls.
${keys.map(k=>`  stock['${k}']=0 & stock['${k}_revealed']=0`).join('\n')}
${legacy.trimEnd().split('\r\n').map(l=>'  '+l).join('\n')}
 end
 exit
end
! JO9 MOD END ${id}
`);
const edits=[];function edit(n,old,nu){let b=body(n);a.equal(b.split(old).length,2,'unique '+n);d.lines[d.locations.find(l=>l.name===n).body]=c.shift(b.replace(old,()=>nu),-5);edits.push({location:n,field:'body',old,new:nu,count:1,patchId:id});}
edit('jo9_background_b','! JO9 MOD START BLACK_MARKET_RANDOM_IDENTITY_20261115',branch+'! JO9 MOD START BLACK_MARKET_RANDOM_IDENTITY_20261115');
edit('generate_stock','!TRANSLATE PRESET BEAUTY TO RATE (backgrounds can modify beauty rate)',nl(`! JO9 MOD START ${id}_BASE
if ${guard}: gs 'jo9_background_b','market_attributes'
! JO9 MOD END ${id}_BASE
`)+ '!TRANSLATE PRESET BEAUTY TO RATE (backgrounds can modify beauty rate)');
edit('generate_stock','!METABOLISM\r\n',nl(`! JO9 MOD START ${id}_LEGACY
if ${guard}: gs 'jo9_background_b','market_traits'
! JO9 MOD END ${id}_LEGACY
`)+ '!METABOLISM\r\n');
edit('generate_stock',"if special_stock = 0: gs 'jo9_traits', 'generate'",nl(`! JO9 MOD START ${id}_REGISTRY
if special_stock=0 or (${guard}): gs 'jo9_traits','generate'
! JO9 MOD END ${id}_REGISTRY`));
const out=c.serialize(d);qa.inspectWorld(out);a.equal(c.parse(out).locations.length,d.locations.length);fs.mkdirSync(D,{recursive:true});fs.mkdirSync(T+'/mods',{recursive:true});
if(fs.existsSync(D+'/baseline.qsp.gz'))a(z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz')).equals(raw));else fs.writeFileSync(D+'/baseline.qsp.gz',z.gzipSync(raw));
fs.writeFileSync(D+'/manifest.before.json.gz',z.gzipSync(fs.readFileSync(R+'/assets/runtime-source-2.4.1.json')));fs.writeFileSync(T+'/baseline.qsp',raw);fs.writeFileSync(T+'/candidate.qsp',out);
const mod={id,status:'APPROVED',before_sha256:c.hash(raw),after_sha256:c.hash(out),edits};fs.writeFileSync(T+'/mods/2026-11-15_black_market_random_attributes.json',JSON.stringify(mod,null,2)+'\n');fs.writeFileSync(D+'/plan.json',JSON.stringify({before:mod.before_sha256,after:mod.after_sha256,traitKeys:keys,locations:edits.map(e=>e.location),newSaveFields:0},null,2)+'\n');console.log(JSON.stringify({after:mod.after_sha256,edits:edits.length,legacyTraitKeys:keys.length}));
