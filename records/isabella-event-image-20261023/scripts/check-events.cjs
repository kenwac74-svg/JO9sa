'use strict';
// Disposable native fixtures. Production resolver and event statements remain
// byte-identical to INPUT; only Start and demo_estate are instrumented.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const save=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game';
const allowed=path.resolve('G:/Codex/tmp/jo9-isabella-event-20261023');
const q=s=>"'"+String(s).replaceAll("'","''")+"'";
const norm=s=>String(s).replaceAll('\\','/');
function body(doc,name){const l=doc.locations.find(x=>x.name===name);if(!l)throw Error('Missing '+name);return core.shift(doc.lines[l.body],5);}
function set(doc,name,text){const l=doc.locations.find(x=>x.name===name);doc.lines[l.body]=core.shift(text,-5);}
function check(expr,label){return ['if '+expr+':','else',' msg '+q('JO9_QA_ASSERT_FAILED_'+label),' exit','end'];}
function jsonFor(id){const dir=path.join(game,'json/slaves'),f=fs.readdirSync(dir).find(n=>new RegExp('^'+id+'(?:_|\\.)').test(n));if(!f)throw Error('Missing template '+id);return JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));}
function seed(role,id,data,state=1){return [role+'_type='+id,role+'_state='+state,'$'+role+"['fullimage']="+q(data.fullimage),'$'+role+"['fullmade']="+q(data.fullmade||''),'$'+role+"['fullmistress']="+q(data.fullmistress||''),'$'+role+"['fullsecretary']="+q(data.fullsecretary||''),'$'+role+"['cloth']='leather_corset'",role+"['moral']=4",role+"['arousal']=0",role+"['image_mode']=0",role+"['qa_preserve']=73"];} 
function build(raw){
 const d=core.parse(raw),token=crypto.randomBytes(10).toString('hex').toUpperCase();
 const data=new Map([2571,2323,1132,2057,2118,1160].map(id=>[id,jsonFor(id)]));
 const ed=body(d,'end_day_screen'),source=ed.split('\r\n'),eventStatements=[];
 for(let i=0;i<source.length;i++)if(/\$bg_path\s*=\s*func\(["']jo9_seed_role_images["'],\s*["']resolve["']/.test(source[i])){
  const role=source[i].match(/resolve["'],\s*(\w+)_type/)[1];eventStatements.push({role,line:i+1,code:source[i]});
 }
 if(eventStatements.length!==18)throw Error('Expected 18 existing event snapshots, saw '+eventStatements.length);
 const start=source.findIndex(s=>s.startsWith("if cheat_no_starve = 0 and assistant['starvation_warning'] = 1"));
 if(start<0)throw Error('Missing exact assistant starvation branch');let end=start+1;while(end<source.length&&source[end]!=='end')end++;const branch=source.slice(start,end+1).join('\r\n');
 if(!branch.includes("assistant['starvation_warning'] = 2")||!branch.includes("jump 'loop'"))throw Error('Unexpected starvation source');
 const common=['killall',qa.primeState(save.parse(fs.readFileSync(path.join(game,'save/24TEST.sav')))).code,"gs '#static_base'","gs 'refresh_database'",'snk_room_target=0','cheat_no_starve=0'];
 const groups={events:[],resolver:[]},counts={eventStatements:eventStatements.length,eventCases:0,starvationCases:0,resolverCases:0,htmlCases:0,picCases:0};
 for(const [id,j]of data)for(const item of eventStatements){
  const n=counts.eventCases++,r=item.role;groups.events.push(...seed(r,id,j,3),"$bg_path='QA_BEFORE'",item.code,...check("$bg_path="+q(j.indpack_title),'event_'+n),...check(r+'_type='+id,'type_'+n),...check(r+'_state=3','state_'+n),...check(r+"['qa_preserve']=73",'keep_'+n),...check('$'+r+"['fullimage']="+q(j.fullimage),'cache_'+n));
 }
 for(const [id,j]of data)for(const state of [1,2]){
  const n=counts.starvationCases++;groups.events.push(...seed('assistant',id,j,state),"assistant['starvation_warning']=1","$bg_path='QA_BEFORE'","gs 'demo_estate'",...check("$bg_path="+q(j.indpack_title),'starvation_path_'+n),...check("assistant['starvation_warning']=2",'starvation_flag_'+n),...check("$place='study'",'starvation_place_'+n),...check("instr($text,'조수에게 굶주림의 징후')>0",'starvation_text_'+n),...check('assistant_type='+id,'starvation_type_'+n),...check('assistant_state='+state,'starvation_state_'+n));
 }
 const modes=[[0,'fullimage','title'],[1,'fullmistress','dom'],[2,'fullmade','maid'],[3,'fullsecretary','secr']];
 for(const [id,j]of data)for(const [mode,key,pack]of modes){
  if(!j[key])continue;const n=counts.resolverCases++;groups.resolver.push(...seed('assistant',id,j),"assistant['image_mode']="+mode,'$assistant["fullimage"]='+q(j[key]),"$qa_result=func('jo9_seed_role_images','resolve',assistant_type,$assistant['fullimage'],'fullimage')",...check('$qa_result='+q(j['indpack_'+pack]||j.indpack_title||j[key]),'alias_'+n),...check('$assistant["fullimage"]='+q(j[key]),'alias_cache_'+n));
  // Actual display_pic fullimage branch is preserved, with that same actor.
  const p=counts.picCases++;groups.resolver.push("$qa_result=func('display_pic','assistant','fullimage')",...check('$qa_result='+q(j['indpack_'+pack]||j.indpack_title||j[key]),'display_pic_'+p));
 }
 for(const [id,j]of data)for(const [mode,,pack]of modes){
  const n=counts.htmlCases++;groups.resolver.push(...seed('assistant',id,j),"assistant['image_mode']="+mode,"$qa_result=func('display_fullimage','assistant','qa_native_image')",...check("instr($replace($qa_result,'\\','/'),"+q('content/pic/'+j['indpack_'+(mode?pack:'corset')]+'.png')+')>0','html_'+n));
 }
 for(const [id,j]of data)for(const state of [0,2,3]){
  const n=counts.htmlCases++;groups.resolver.push(...seed('assistant',id,j,state),"$qa_result=func('display_fullimage','assistant','qa_native_image')",...check("$qa_result=''",'html_hidden_'+n));
 }
 const j=data.get(2571);
 for(const cached of ['girls/custom/user_picture','',j.indpack_title]){
  const n=counts.resolverCases++;groups.resolver.push("$qa_result=func('jo9_seed_role_images','resolve',2571,"+q(cached)+",'fullimage')",...check('$qa_result='+q(cached),'unmatched_'+n));
 }
 for(const key of ['fullimage','fullmade','fullmistress','fullsecretary']){
  const n=counts.resolverCases++;groups.resolver.push("$qa_result=func('jo9_seed_role_images','resolve',999999,'girls/custom/legacy',"+q(key)+')',...check("$qa_result='girls/custom/legacy'",'unknown_'+n));
 }
 // Explicit named-role calls are existing semantics, not generic snapshots.
 for(const key of ['fullmade','fullmistress','fullsecretary']){
  const n=counts.resolverCases++;groups.resolver.push("$qa_result=func('jo9_seed_role_images','resolve',2571,"+q(j[key])+','+q(key)+')',...check('$qa_result='+q(j[key]),'explicit_role_'+n));
 }
 // Missing role pack uses current title; missing both preserves known cache.
 groups.resolver.push("$indpack_maid[2571]=''","$qa_result=func('jo9_seed_role_images','resolve',2571,"+q(j.fullmade)+",'fullimage')",...check('$qa_result='+q(j.indpack_title),'missing_role_pack'),"$indpack_title[2571]=''","$qa_result=func('jo9_seed_role_images','resolve',2571,"+q(j.fullmade)+",'fullimage')",...check('$qa_result='+q(j.fullmade),'missing_all_packs'));counts.resolverCases+=2;
 // Old namespace cleanup remains active after the new Indie aliases miss.
 groups.resolver.push("$qa_result=func('jo9_seed_role_images','resolve',2579,'girls/full/maid/kirakira','fullimage')",...check('$qa_result=$fullimage[2579]','existing_egeya_cleanup'));counts.resolverCases++;
 const sourceHashes={};for(const name of ['display_fullimage','display_pic','jo9_seed_role_images'])sourceHashes[name]=core.hash(Buffer.from(body(d,name),'utf8'));
 const probes=Object.entries(groups).map(([group,lines])=>{const x=core.parse(raw),name='isabella-'+group,marker='JO9_QA_'+token+'_'+name.replaceAll('-','_')+'_COMPLETE';set(x,'demo_estate',branch+'\r\n:loop');set(x,'Start',[...common,...lines,'msg '+q(marker)].join('\r\n'));for(const n of Object.keys(sourceHashes))if(core.hash(Buffer.from(body(x,n),'utf8'))!==sourceHashes[n])throw Error('Test modified production '+n);const bytes=core.serialize(x);qa.inspectWorld(bytes);return{name,marker,checkpoint:'Native unchanged event and resolver assertions',raw:bytes};});
 return {probes,counts,sourceHashes,eventStatements:eventStatements.map(({role,line})=>({role,line})),starvationSource:branch};
}
if(require.main===module){
 const [input,out,tag]=process.argv.slice(2);if(!input||!out||!['red','green'].includes(tag))throw Error('Usage: node check-events.cjs INPUT ROOT red|green');const dest=path.resolve(out);if(dest!==allowed)throw Error('Exact isolated task root required');fs.mkdirSync(dest,{recursive:true});
 const raw=fs.readFileSync(input),built=build(raw);for(const p of built.probes)if(fs.existsSync(path.join(dest,tag+'-'+p.name+'.qsp')))throw Error('Existing fixture must not be overwritten');
 if(!fs.existsSync(path.join(dest,'json')))fs.cpSync(path.join(game,'json'),path.join(dest,'json'),{recursive:true});
 for(const f of ['config.xml'])if(!fs.existsSync(path.join(dest,f)))fs.copyFileSync(path.join(game,f),path.join(dest,f));fs.writeFileSync(path.join(dest,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 const plan=built.probes.map(p=>{const file=path.join(dest,tag+'-'+p.name+'.qsp');fs.writeFileSync(file,p.raw);return {name:p.name,file,marker:p.marker,checkpoint:p.checkpoint};});fs.writeFileSync(path.join(dest,tag+'-plan.json'),JSON.stringify(plan,null,2));fs.writeFileSync(path.join(dest,tag+'-coverage.json'),JSON.stringify({input,inputSha256:core.hash(raw),...built.counts,sourceHashes:built.sourceHashes,eventStatements:built.eventStatements,starvationSource:built.starvationSource},null,2));console.log(JSON.stringify({plan:path.join(dest,tag+'-plan.json'),inputSha256:core.hash(raw),...built.counts}));
}
module.exports={build};
