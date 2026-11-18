'use strict';
const {fs,assert,core,H,GAME,body,source,block,assignment,assignments,apply}=require('./common.cjs');
const raw=fs.readFileSync(GAME+'/jack.qsp'),d=core.parse(raw);assert.equal(d.hash,'f0564b27dd84062269dc433091527e7e270a2c4375dbe206a04fcc883f78a7ed');assert(raw.equals(Buffer.from(d.lines.join('\r\n'),'utf16le')));
const original=block(body(source(),'#var_base')),old=block(body(d,'#var_base')),src=assignments(original);let i=0;
let restored=old.split('\r\n').map(s=>{const m=s.match(assignment);if(!m)return s;const a=src[i++];assert.equal(Number(m[2]),a.field);return m[1]+a.rhs;}).join('\r\n');assert.equal(i,137);
function replaceOnce(s,a,b){assert.equal(s.split(a).length-1,1,a);return s.replace(a,b);}
restored=replaceOnce(restored,"if slave['age'] = CONST_INT['loli_age'] and assistant['age'] = CONST_INT['loli_age']:","if slave['age'] = CONST_INT['milf_age']:");
restored=replaceOnce(restored,"\tif slave['boobs'] = 2 and slave['age'] = CONST_INT['loli_age'] and no_loli = 2:","\tif slave['boobs'] = 0 and slave['age'] ! CONST_INT['loli_age']:");
restored=replaceOnce(restored,"if slave['boobs'] = 2 and slave['age'] = CONST_INT['loli_age'] and no_loli = 2:","if slave['boobs'] = 1:");
for(const k of ['perversion','homosexualism'])restored=replaceOnce(restored,`if slave['${k}_revealed'] = 1 and slave['${k}'] ! 0:`,`if (slave['${k}_revealed'] = 1 or slave['${k}_revealed'] = 2) and slave['${k}'] ! 0:`);
restored=restored.split('\r\n').filter(s=>!s.includes('JO9 MOD START ARGON1114_TEXT_00')&&!s.includes('JO9 MOD END ARGON1114_TEXT_00')).join('\r\n');
const neutral=restored.replace(/\bslave(?=\[)/g,'jo9_hum_actor').replace(/\$slave_name\b/g,'$jo9_hum_actor_name').replace(/\$slave_psy_status\b/g,'$jo9_hum_actor_psy_status').trimEnd();
const pool="! JO9 MOD START HUMILIATION_FULL_TEXT_ROLES_20261117\r\n! Original 2.2.3 prose; retain current indexes, sign placement, and RNG draw order.\r\nlocal $jo9_hum_code\r\n$jo9_hum_code = {\r\n"+neutral+"\r\n}\r\nif $args[0] = 'assistant':\r\n dynamic $replace($jo9_hum_code, 'jo9_hum_actor', 'assistant')\r\nelse\r\n dynamic $replace($jo9_hum_code, 'jo9_hum_actor', 'slave')\r\nend\r\n! JO9 MOD END HUMILIATION_FULL_TEXT_ROLES_20261117";
const stat=body(d,'#static_txt'),descLines=stat.split('\r\n').filter(s=>/^\$disgrace_lesson_description\[[0-5]\] = /.test(s));assert.equal(descLines.length,6);const descBlock=descLines.join('\r\n');assert(stat.includes(descBlock));
const desc="! JO9 MOD START HUMILIATION_SHARED_DESCRIPTION_20261117\r\nlocal jo9_hum_subex_mode\r\njo9_hum_subex_mode = DISABLESUBEX\r\nDISABLESUBEX = 1\r\n"+descBlock+"\r\nDISABLESUBEX = jo9_hum_subex_mode\r\n! JO9 MOD END HUMILIATION_SHARED_DESCRIPTION_20261117";
const patch={id:'2026-11-17_humiliation_full_restore_roles',status:'APPROVED',description:'Restore all supplied Korean2.2.3 humiliation text; retain fixed indices and RNG/sign behavior, select the actual lesson actor, refresh shared female lesson templates, and accept discovered trait states1/2.',before_sha256:d.hash,edits:[
 {location:'#var_base',field:'body',old,new:"! JO9 MOD START HUMILIATION_POOL_CALL_20261117\r\ngs 'jo9_humiliation_pool', $args[0]\r\n! JO9 MOD END HUMILIATION_POOL_CALL_20261117\r\n\r\n",count:1},
 {location:'#static_txt',field:'body',old:descBlock,new:"! JO9 MOD START HUMILIATION_STATIC_DESCRIPTION_CALL_20261117\r\ngs 'jo9_humiliation_description'\r\n! JO9 MOD END HUMILIATION_STATIC_DESCRIPTION_CALL_20261117",count:1},
 {location:'interaction',field:'body',old:"gs '#var_base'\r\ngs '#txt'\r\ngs '#txt_2'",new:"! JO9 MOD START HUMILIATION_ACTOR_AND_DESCRIPTION_20261117\r\ngs '#var_base', iif(interaction = 7034, 'assistant', 'slave')\r\ngs '#txt'\r\ngs '#txt_2'\r\nif interaction = 1375 or interaction = 7034: gs 'jo9_humiliation_description'\r\n! JO9 MOD END HUMILIATION_ACTOR_AND_DESCRIPTION_20261117",count:1}
],add_locations:[{name:'jo9_humiliation_pool',desc:'',body:pool,actions:[]},{name:'jo9_humiliation_description',desc:'',body:desc,actions:[]}]};
let out=apply(raw,patch);patch.after_sha256=core.hash(out);const parsed=core.parse(out);assert.equal(parsed.locations.length,d.locations.length+2);assert(out.equals(Buffer.from(parsed.lines.join('\r\n'),'utf16le')));
const inverse=parsed.lines.slice();inverse.splice(inverse.length-9,8);inverse[3]=d.lines[3];for(const e of patch.edits.slice().reverse()){const l=d.locations.find(x=>x.name===e.location);inverse[l.body]=core.shift(core.shift(inverse[l.body],5).replace(e.new,e.old),-5);}assert(raw.equals(Buffer.from(inverse.join('\r\n'),'utf16le')));
for(const l of d.locations){if(patch.edits.some(e=>e.location===l.name))continue;const al=parsed.locations.find(x=>x.name===l.name);assert.equal(parsed.lines[al.body],d.lines[l.body]);}
fs.writeFileSync(H+'/patch.json',JSON.stringify(patch,null,2)+'\n');
for(const n of ['#var_base','#static_txt','interaction'])fs.writeFileSync(H+'/before-'+n.replace('#','')+'.txt',body(d,n),'utf8');
fs.writeFileSync(H+'/prepared.json',JSON.stringify({before:d.hash,after:patch.after_sha256,bytes:out.length,sourceOriginalSha256:'a936d0022fd9132ccb374405e915f27c49e6d94cd6179a097bd6c89f692d114e',restoredAssignments:137,addedSharedLocations:2,newSavedFields:0,inverseExact:true,unrelatedLocationBodiesIdentical:true},null,2)+'\n');
console.log(JSON.stringify({before:d.hash,after:patch.after_sha256,textAssignments:137,locations:parsed.locations.length}));
