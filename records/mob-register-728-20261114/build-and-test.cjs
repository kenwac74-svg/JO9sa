'use strict';
const fs=require('fs'),R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',D=R+'/records/mob-register-728-20261114',T='G:/Codex/tmp/mob-register-728-20261114',c=require(R+'/tools/text-workshop/core.cjs');let map=JSON.parse(fs.readFileSync(D+'/registration-map.json'));for(let r of map){if(r.preset.seed_hair)r.preset.seed_hair=r.sourceFile.split('_')[1].replace(/^./,x=>x.toUpperCase());fs.writeFileSync(T+'/green/json/slaves/'+r.file,JSON.stringify(r.preset,null,2)+'\n');}fs.writeFileSync(D+'/registration-map.json',JSON.stringify(map,null,2));let raw=fs.readFileSync(T+'/baseline.qsp'),d=c.parse(raw);if(!c.serialize(d).equals(raw))throw Error('roundtrip');let edits=[];function edit(name,old,v){let l=d.locations.find(l=>l.name===name),b=c.shift(d.lines[l.body],5);if(b.split(old).length!==2)throw Error('match '+name);d.lines[l.body]=c.shift(b.replace(old,v),-5);edits.push({location:name,field:'body',old,new:v,count:1,patchId:'MOB728_POOL_20261114'});}
for(const [meta,old]of [[1,'stock_type = rand(loli_first, loli_last)'],[2,'stock_type = rand(young_first, max(young_last,1462))'],[3,'stock_type = rand(milf_first, max(milf_last,2340))']])edit('generate_stock',old,`stock_type = func('jo9_mob_pool', ${meta})`);
edit('jo9_plain_voice'," if args[1]=1448 or args[1]=1450: exit"," if args[1]=1448 or args[1]=1450: exit\r\n ! JO9 MOD START MOB728_POOL_20261114\r\n if args[1]>=4000 and args[1]<=4727: result=1\r\n ! JO9 MOD END MOB728_POOL_20261114");
let body=`! JO9 MOD START MOB728_POOL_20261114
! Existing range and additional presets share equal per-slot probability.
! args[0]: existing meta category. args[1]: optional one-based audit draw.
local jo9_pool_first, jo9_pool_last, jo9_pool_new, jo9_pool_count, jo9_pool_old, jo9_pool_pick
result=0
if args[0]=1:
 jo9_pool_first=loli_first
 jo9_pool_last=loli_last
 jo9_pool_new=4000
 jo9_pool_count=180
elseif args[0]=2:
 jo9_pool_first=young_first
 jo9_pool_last=max(young_last,1462)
 jo9_pool_new=4180
 jo9_pool_count=260
elseif args[0]=3:
 jo9_pool_first=milf_first
 jo9_pool_last=max(milf_last,2340)
 jo9_pool_new=4440
 jo9_pool_count=288
else
 exit
end
jo9_pool_old=jo9_pool_last-jo9_pool_first+1
jo9_pool_pick=args[1]
if jo9_pool_pick=0: jo9_pool_pick=rand(1,jo9_pool_old+jo9_pool_count)
if jo9_pool_pick<1 or jo9_pool_pick>jo9_pool_old+jo9_pool_count: exit
if jo9_pool_pick<=jo9_pool_old:
 result=jo9_pool_first+jo9_pool_pick-1
else
 result=jo9_pool_new+jo9_pool_pick-jo9_pool_old-1
end
! JO9 MOD END MOB728_POOL_20261114`.replace(/\n/g,'\r\n');
if(d.locations.some(l=>l.name==='jo9_mob_pool'))throw Error('exists');d.lines.splice(d.lines.length-1,0,c.shift('jo9_mob_pool',-5),c.shift('',-5),c.shift(body,-5),c.shift('0',-5));d.lines[3]=c.shift(String(d.locations.length+1),-5);let out=c.serialize(d);fs.mkdirSync(T+'/mods',{recursive:true});let mod={id:'MOB728_POOL_20261114',status:'APPROVED',before_sha256:c.hash(raw),after_sha256:c.hash(out),edits,add_locations:[{name:'jo9_mob_pool',desc:'',body,actions:[]}]};fs.writeFileSync(T+'/mods/20261114_mob728_pool.json',JSON.stringify(mod,null,2));fs.writeFileSync(T+'/candidate.qsp',out);
function fixture(name,code){let p=c.parse(out),l=p.locations.find(x=>x.name==='Start');p.lines[l.body]=c.shift("killall\r\n$onnewloc=''\r\n$counter=''\r\nsettimer 0\r\n"+code.replace(/\n/g,'\r\n')+`\r\nmsg 'JO9_QA_MOB728_${name}_COMPLETE'`,-5);fs.writeFileSync(T+'/green/'+name+'.qsp',c.serialize(p));return{name,file:T+'/green/'+name+'.qsp',marker:`JO9_QA_MOB728_${name}_COMPLETE`,checkpoint:name};}
let checks=[];for(let r of map){for(let[k,v]of Object.entries(r.preset)){if(k==='fullimage'||k.startsWith('seed_ava')||k.startsWith('fullm')||k==='fullsecretary'){checks.push(`if $${k}[${r.newId}] ! '${v}': msg 'FAIL_${r.newId}_${k}' & exit`);}if(k==='seed_age')checks.push(`if ${k}[${r.newId}] ! ${v}: msg 'FAIL_${r.newId}_${k}' & exit`);}checks.push(`if func('jo9_plain_voice','ordinary',${r.newId}) ! 1: msg 'FAIL_VOICE_${r.newId}' & exit`);}
let plan=[fixture('registry',checks.join('\n'))];let poolchecks=[];for(let[meta,first,last,start,count]of [[1,'loli_first','loli_last',4000,180],[2,'young_first','max(young_last,1462)',4180,260],[3,'milf_first','max(milf_last,2340)',4440,288]])poolchecks.push(`jo9_old=${last}-${first}+1\nfor jo9_test=1 to jo9_old+${count}:\n jo9_actual=func('jo9_mob_pool',${meta},jo9_test)\n if jo9_test<=jo9_old:\n  jo9_expected=${first}+jo9_test-1\n else\n  jo9_expected=${start}+jo9_test-jo9_old-1\n end\n if jo9_actual ! jo9_expected: msg 'FAIL_POOL_${meta}' & exit\nend\nif func('jo9_mob_pool',${meta},jo9_old+${count}+1) ! 0: msg 'FAIL_BOUND' & exit`);poolchecks.push("if func('jo9_plain_voice','ordinary',3002) ! 0: msg 'FAIL_UNIQUE_VOICE' & exit");plan.push(fixture('pool',poolchecks.join('\n')));
// Native generation uses unmodified initialization and production generator.
let init=c.parse(raw).locations.find(l=>l.name==='init_game');let initbody=c.shift(c.parse(raw).lines[init.body],5);fs.writeFileSync(T+'/init-game.txt',initbody);
fs.writeFileSync(T+'/green/plan.json',JSON.stringify(plan,null,2));fs.copyFileSync(__filename,D+'/build-and-test.cjs');console.log(JSON.stringify({sha256:c.hash(out),locations:c.parse(out).locations.length,checks:checks.length,plan:plan.map(p=>p.name)}));
