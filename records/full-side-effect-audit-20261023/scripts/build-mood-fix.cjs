'use strict';
const fs=require('node:fs'),path=require('node:path');
const repo='G:/somi/JO9sa',core=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const root='G:/Codex/tmp/jo9-full-audit-20261023';
const before='5aeff11fffe6e5f2523749987577f42dab870f4d0adee0df385375f9eefb074f';
const raw=fs.readFileSync(root+'/snapshot/jack.qsp');if(core.hash(raw)!==before)throw Error('Wrong pinned baseline');
const d=core.parse(raw),l=d.locations.find(x=>x.name==='jo9_traits');let b=core.shift(d.lines[l.body],5);
const id='2026-10-23_slave_nature_mood_order',edits=[];
function replace(old,value){if(b.split(old).length!==2)throw Error('Exact single anchor missing');b=b.replace(old,value);edits.push({location:'jo9_traits',field:'body',old,new:value,count:1});}
const refresh="    dynamic $replace($newloc_update_slave,'dyn'+'slave','jo9born')";
const old="    $jo9born_psy_status = 'reluctant'\r\n    local jo9born_mood_steps = 0";
const replacement="    $jo9born_psy_status = 'reluctant'\r\n! JO9 MOD START SLAVE_NATURE_INITIAL_MOOD_ORDER_20261023 | "+id+"\r\n    ! Build current appearance, hygiene and household moodlets before initial mood compensation.\r\n"+refresh+"\r\n    $jo9born_psy_status = 'reluctant'\r\n! JO9 MOD END SLAVE_NATURE_INITIAL_MOOD_ORDER_20261023\r\n    local jo9born_mood_steps = 0";
replace(old,replacement);
replace(refresh+'\r\n'+refresh,"! JO9 MOD START SLAVE_NATURE_FINAL_REFRESH_20261023 | "+id+'\r\n'+refresh+'\r\n! JO9 MOD END SLAVE_NATURE_FINAL_REFRESH_20261023');
d.lines[l.body]=core.shift(b,-5);const bytes=core.serialize(d),after=core.hash(bytes);
const patch={id,before_sha256:before,after_sha256:after,edits};qa.inspectWorld(bytes);qa.validatePatchSet([patch],before,after);
fs.mkdirSync(root+'/mods',{recursive:true});fs.writeFileSync(root+'/candidate.qsp',bytes);fs.writeFileSync(root+'/mods/'+id+'.json',JSON.stringify(patch,null,2));
fs.writeFileSync(repo+'/records/full-side-effect-audit-20261023/mood-fix-candidate.json',JSON.stringify({id,before,after,edits:edits.length,changedLocations:['jo9_traits'],fullRefreshCallsBefore:2,fullRefreshCallsAfter:2,candidate:root+'/candidate.qsp'},null,2));
console.log(JSON.stringify({before,after,candidate:root+'/candidate.qsp'}));
