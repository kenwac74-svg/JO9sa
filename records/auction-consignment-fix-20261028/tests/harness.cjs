'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),cp=require('child_process'),zlib=require('zlib');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const rec=__dirname,root=path.dirname(rec),tmp='G:/Codex/tmp/jo9-auction-consignment-tests-20261028',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const baseline='efdff96228e6cd77b59808c22b3391947e1682918480aea55c89b0a0bb3adebb';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)),quote=s=>"'"+s.replaceAll("'","''")+"'";
function inputBytes(){const p=process.env.JO9_AUCTION_TEST_BASELINE||game+'/jack.qsp',b=fs.readFileSync(p);return /\.gz$/i.test(p)?zlib.gunzipSync(b):b;}
function get(d,n){const l=d.locations.find(l=>l.name===n);assert(l,'Missing location '+n);return c.shift(d.lines[l.body],5).replace(/\r\n/g,'\n');}
function set(d,n,s){const l=d.locations.find(l=>l.name===n);assert(l,'Missing location '+n);d.lines[l.body]=c.shift(s.replace(/\r?\n/g,'\r\n'),-5);}
function section(s,start,end){const a=s.indexOf(start),b=s.indexOf(end,a+start.length);assert(a>=0&&b>a,'Missing exact section '+start);return s.slice(a,b);}
function loadCandidate(patchPath){const raw=inputBytes();assert.equal(c.hash(raw),baseline);const patch=read(patchPath);assert.equal(patch.before_sha256,baseline);const d=c.parse(raw);
 for(const e of patch.edits||[]){assert.equal(e.field,'body');const l=d.locations.find(l=>l.name===e.location);assert(l);const old=c.shift(d.lines[l.body],5);assert.equal(old.split(e.old).length-1,e.count??1,'Exact edit '+e.location);d.lines[l.body]=c.shift(old.split(e.old).join(e.new),-5);}
 for(const l of patch.add_locations||[]){assert(!(l.actions||[]).length);assert(!d.locations.some(x=>x.name===l.name));d.lines.splice(-1,0,c.shift(l.name,-5),c.shift(l.desc||'',-5),c.shift(l.body.replace(/\r?\n/g,'\r\n'),-5),c.shift('0',-5));}
 if((patch.add_locations||[]).length)d.lines[3]=c.shift(String(d.locations.length+patch.add_locations.length),-5);
 const candidate=c.serialize(d),parsed=c.parse(candidate);assert.equal(c.hash(candidate),patch.after_sha256);return {raw,patch,bytes:candidate,d:parsed};
}
function instrumentMessages(body){return body.replace(/\bmsg\s+'(?:[^']|'')*'/g,'qa_notices+=1');}
function isolate(d){for(const n of ['#var_base','#txt_man','#txt_2_man'])set(d,n,'');set(d,'stock_to_slave_nogt',instrumentMessages(get(d,'stock_to_slave_nogt')));}
function init(d){const sb=get(d,'#static_base'),a=sb.indexOf("killvar '$playable_vars'"),b=sb.indexOf('!!!!! core game function',a);assert(a>0&&b>a);
 return "usehtml=1\n$onnewloc=''\n$counter=''\nsnk_room_target=0\nsound_on=0\nCONST_INT['no_slave']=0\nCONST_INT['slave_exist']=1\nCONST_INT['slave_faint']=2\nCONST_INT['loli_age']=0\n"+sb.slice(a,b)+"\n$update_slave_features_list=''\n$all_slave_characters[0]='slave'\n$all_slave_characters[1]='assistant'\n$unfrozen_slave_characters[0]='slave'\n$unfrozen_slave_characters[1]='assistant'\nqa_notices=0\n";
}
function actor(role,id=41001,genius=1){const fields={id,age:1,virginity:2,stamina:4,energy:4,jo9_learning_trait:genius,jo9_focus:-1,jo9_focus_known:0,jo9_grudge:1,jo9_grudge_known:1,jo9_constitution:-1,jo9_voice_trait:1,jo9_versatile:1,jo9_versatile_manual_off:1,qa_sentinel:731,obedience:2,ego:3,pride:1,temper:3,brand:0,arena_level:7,catfight_level:6,has_ride_win:5,diet_portion:7,calories:17,base_exotic:3,exotic:3};
 let s=`dynamic $clear_slave_instance, '${role}'\n${role}_state=1\n${role}_type=2571\n$${role}_name='QA_CAPTURED_${id}'\n$${role}_ava='QA_AVATAR_${id}'\n$${role}_psy_status='docile'\n$${role}_psy_basic='optimistic'\n$${role}_world='QA_WORLD'\n$${role}_world_description='QA_WORLD_DESC'\n$${role}_family='QA_FAMILY'\n$${role}_family_description='QA_FAMILY_DESC'\n$${role}_occupation='QA_OCCUPATION'\n$${role}_occupation_description='QA_OCCUPATION_DESC'\n$${role}_scene_tag='QA_SCENE_TAG'\n$${role}_dohna_tag='QA_DOHNA_TAG'\n`;
 for(const[k,v]of Object.entries(fields))s+=role+'['+quote(k)+']='+v+'\n';
 for(const[k,v]of Object.entries({right_wpn:'гладиус',left_wpn:'безоружный',armor:'полудоспех',cloth:'chainmail_bikini',boots:'sandalii',fullimage:'QA_IMAGE_'+id,qa_sentinel:'STRING_KEEP'}))s+='$'+role+'['+quote(k)+']='+quote(v)+'\n';
 s+=`${role}_rate['stamina']=731\n${role}_rate['qa_sentinel']=732\n${role}_inventory['qa_item']=17\n$${role}_inventory['qa_label']='INV_KEEP'\n${role}_already_done_today['qa_sentinel']=17\n${role}_already_done_total['qa_sentinel']=19\n${role}_already_done_recent['qa_sentinel']=21\n${role}_already_sex_today['qa_sentinel']=23\n${role}_already_sex_total['qa_sentinel']=25\ninteraction_${role}['qa_sentinel']=27\n`;return s;
}
function runFixture(d,name,code,markerPrefix='CONSIGNMENT'){
 fs.mkdirSync(tmp,{recursive:true});set(d,'Start',init(d)+code+`\nmsg 'JO9_QA_${markerPrefix}_${name.replaceAll('-','_')}_COMPLETE'\n`);const file=tmp+'/'+name+'.qsp';fs.writeFileSync(file,c.serialize(d));write(tmp+'/'+name+'-plan.json',[{name,file,marker:`JO9_QA_${markerPrefix}_${name.replaceAll('-','_')}_COMPLETE`,checkpoint:'Actual consignment helper and caller fragments with synthetic state'}]);fs.writeFileSync(tmp+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','G:/somi/JO9sa/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',tmp+'/'+name+'-plan.json','-TimeoutSeconds','20'],{encoding:'utf8',windowsHide:true,timeout:30000});const results=read(tmp+'/client-results.json');fs.copyFileSync(tmp+'/'+name+'-stderr.log',rec+'/'+name+'.log');return {engineExit:r.status,results};
}
function schema(s){return s.vars.find(v=>v.name==='SLAVE_VARS').values.map(x=>x[1]).filter(Boolean);}
function roleView(s,role,templates=schema(s)){return Object.fromEntries(templates.map(t=>{const name=t.replaceAll('instance',role).replace(/^\$/,'').toUpperCase(),v=s.vars.find(v=>v.name===name);return[t.replace(/^\$/,''),v&&v.values.length?{values:v.values,idx:v.idx}:null];}));}
module.exports={fs,path,assert,c,sc,rec,root,tmp,game,baseline,read,write,quote,inputBytes,get,set,section,loadCandidate,instrumentMessages,isolate,init,actor,runFixture,schema,roleView};
