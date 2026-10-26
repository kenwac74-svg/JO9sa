'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const work='G:/somi/Jack O Nine Tails v2.4_work/game';
const q=s=>"'"+s.replaceAll("'","''")+"'";
const inventory=JSON.parse(fs.readFileSync(path.join(__dirname,'research/room-paths/DIRECT_FULLIMAGE_INVENTORY.json'),'utf8')).items.filter(x=>x.location!=='slavebase_test');
const templates=new Map();for(const id of [2571,1132,2057,2118,1160,2323]){const name=fs.readdirSync(path.join(work,'json/slaves')).find(n=>new RegExp('^'+id+'(?:_|\\.)').test(n));if(!name)throw Error('Missing template '+id);templates.set(id,JSON.parse(fs.readFileSync(path.join(work,'json/slaves',name),'utf8')));}
function body(doc,name){const l=doc.locations.find(x=>x.name===name);if(!l)throw Error('Missing '+name);return core.shift(doc.lines[l.body],5);}
function set(doc,name,text){const l=doc.locations.find(x=>x.name===name);if(!l)throw Error('Missing '+name);doc.lines[l.body]=core.shift(text,-5);}
function check(expr,label){return['if '+expr+':','else',' msg '+q('JO9_QA_ASSERT_FAILED_'+label),' exit','end'];}
function viewKind(item){if(['$addon_custom_data','slavebase_test','stasis_cell','black_market_interface'].includes(item.location))return 'static';if(item.location.startsWith('slave_private_room')||item.location==='snk_room_menu_screen'||item.location==='assistant_private_room')return 'private';return 'other';}
function role(item){if(item.location.startsWith('slave_private_room'))return 'room'+item.location.at(-1);if(item.location==='snk_room_menu_screen')return 'slave';if(item.location==='prison_cell')return 'prisoner';if(item.location==='barn')return 'cow';if(item.location==='stasis_cell')return 'dynslave';return 'assistant';}
function seedVars(id,data){const out=[];for(const r of ['slave','assistant','cow','prisoner','farmhand','stock','dynslave','room1','room2','room3','room4'])out.push(r+'_type='+id,r+"_state=CONST_INT['slave_exist']",'$'+r+"['fullimage']="+q(data.fullimage),'$'+r+"['cloth']='leather_corset'",r+"['moral']=4",r+"['arousal']=0",r+"['image_mode']=0",r+"['qa_keep']=71",'$'+r+"_name='KEEP'");return out;}
function build(raw){
 const base=core.parse(raw),token=crypto.randomBytes(10).toString('hex').toUpperCase(),files=new Set(),counts={};
 const render=[];
 inventory.forEach((item,i)=>{
  const current=body(base,item.location),key='ROOM_IMAGE_LINK_'+i;
  const tagged=current.match(new RegExp('! JO9 MOD START '+key+'[^\\r]*\\r\\n([\\s\\S]*?)\\r\\n! JO9 MOD END '+key));
  let code=tagged?tagged[1]:item.source;
  if(!tagged&&!current.includes(item.source))throw Error('Source view changed: '+item.location);
  // Isolate the actual render statement; keep in-line predicates. Source
  // conditionals outside it remain covered by the unchanged-body diff gate.
  render.push('if qa_view='+i+':\r\n'+code+'\r\nend');
 });
 const groups={private:[],other:[],static:[],resolver:[],mixed:[]};
 for(const [id,data]of templates)for(let i=0;i<inventory.length;i++)for(const [moral,arousal,suffix]of [[4,0,''],[2,0,'_rebel'],[4,4,'_horny']]){
  const item=inventory[i],r=role(item),kind=viewKind(item),key=kind==='static'?'indpack_title':r==='cow'?'indpack_cow'+suffix:'indpack_corset'+suffix;
  const wanted=data[key]||data[key.replace(/_(?:rebel|horny)$/,'')];if(!wanted)throw Error('Missing expected image '+id+'/'+key);files.add(wanted);
  const lines=groups[kind],caseNo=(counts[kind]||0);counts[kind]=caseNo+1;
  lines.push(...seedVars(id,data),'nsfw=0','txt=0','s_type='+id,'qa_view='+i,"$text_display=''",'*clr',r+"['moral']="+moral,r+"['arousal']="+arousal);
  if(item.location==='stasis_cell')lines.push('dynslave_state='+(arousal?3:moral<3?2:1));
  lines.push("gs 'demo_estate', '', "+id);
  lines.push(...check("instr($replace($maintxt+$text_display, '\\', '/'), "+q('content/pic/'+wanted+'.png')+')>0',kind+'_'+caseNo));
  lines.push(...check(r+'_type='+id+' and '+r+"['qa_keep']=71 and $"+r+"_name='KEEP' and $"+r+"['fullimage']="+q(data.fullimage),kind+'_state_'+caseNo));
  if(['assistant_private_room','prison_cell','barn'].includes(item.location))lines.push(...check("instr($maintxt, 'position:absolute;top:3px;left:150px;')>0",'position_'+kind+'_'+caseNo));
 }
 const roles=['slave','assistant','cow','prisoner','farmhand','stock','room1','room2','room3','room4'];
 for(const [id,data]of templates)for(const r of roles)for(const [cloth,key]of [['голая','naked'],['maid_dress','maid'],['leather_corset','corset'],['qa_unknown_outfit','title']]){
  const wanted=data['indpack_'+(r==='stock'?'title':r==='cow'?'cow':key)];if(!wanted)throw Error('Missing direct image');files.add(wanted);
  const n=counts.resolver||0;counts.resolver=n+1;
  groups.resolver.push(...seedVars(id,data),'$'+r+"['cloth']="+q(cloth),"$qa_image=func('display_fullimage', "+q(r)+", 'snk_room_character')",...check("instr($replace($qa_image, '\\', '/'), "+q('content/pic/'+wanted+'.png')+')>0','resolver_'+n));
 }
 for(const [id,data]of templates)for(const [mode,key]of [[1,'dom'],[2,'maid'],[3,'secr']])for(const [moral,arousal,suffix]of [[4,0,''],[2,0,'_rebel'],[4,4,'_horny']]){
  const wanted=data['indpack_'+key+suffix]||data['indpack_'+key];if(!wanted)throw Error('Missing job image');files.add(wanted);const n=counts.resolver++;
  groups.resolver.push(...seedVars(id,data),'assistant["image_mode"]='+mode,'assistant["moral"]='+moral,'assistant["arousal"]='+arousal,"$qa_image=func('display_fullimage', 'assistant', 'snk_room_character')",...check("instr($replace($qa_image, '\\', '/'), "+q('content/pic/'+wanted+'.png')+')>0','job_'+n));
 }
 // A custom actor without Indie registration must keep its original image.
 const legacy='girls/full/isabella_black_long_milf';files.add(legacy);
 counts.legacyFallback=4;counts.hiddenStates=12;
 for(const r of ['room1','room2','room3','room4']){
  groups.resolver.push(...seedVars(999999,{fullimage:legacy}),"$"+r+"['cloth']='qa_unknown_outfit'","$qa_image=func('display_fullimage', "+q(r)+", 'snk_room_character')",...check("instr($replace($qa_image, '\\', '/'), "+q('content/pic/'+legacy+'.png')+')>0','legacy_'+r));
  for(const state of [0,2,3])groups.resolver.push(r+'_state='+state,"$qa_image=func('display_fullimage', "+q(r)+", 'snk_room_character')",...check("$qa_image='"+"'",'hidden_'+r+'_'+state));
 }
 // Different simultaneous actors expose a renderer accidentally using another
 // slot's type. ID previews also deliberately differ from the current stock.
 const ids={slave:1132,assistant:2571,cow:2118,prisoner:1160,room1:2057,room2:2323,room3:2571,room4:1132,dynslave:2057};
 for(let i=0;i<inventory.length;i++){
  const item=inventory[i],kind=viewKind(item),r=role(item),selected=kind==='static'?(item.location==='$addon_custom_data'?1160:item.location==='black_market_interface'?2118:2057):ids[r];
  const wanted=templates.get(selected)[kind==='static'?'indpack_title':r==='cow'?'indpack_cow':'indpack_corset'];files.add(wanted);
  const lines=groups.mixed;lines.push(...seedVars(2323,templates.get(2323)));for(const [r,id]of Object.entries(ids))lines.push(r+'_type='+id);
  lines.push('nsfw=0','txt=0','s_type=2118','qa_view='+i,"$text_display=''",'*clr',"gs 'demo_estate', '', 1160",...check("instr($replace($maintxt+$text_display, '\\', '/'), "+q('content/pic/'+wanted+'.png')+')>0','mixed_view_'+i));
 }
 for(const r of ['room1','room2','room3','room4'])groups.mixed.push(...seedVars(999999,{fullimage:legacy}),"$"+r+"['cloth']='maid_dress'","$qa_image=func('display_fullimage', "+q(r)+", 'snk_room_character')",...check("instr($replace($qa_image, '\\', '/'), "+q('content/pic/'+legacy+'.png')+')>0','registered_cloth_legacy_'+r));
 for(const [cloth,key]of [['leather_corset','indpack_corset'],['qa_unknown_outfit','indpack_title']])groups.mixed.push(...seedVars(2571,templates.get(2571)),"$room1['cloth']="+q(cloth),"$qa_image=func('display_fullimage', 'room1', 'snk_room_character')",...check("instr($replace($qa_image, '\\', '/'), "+q('content/pic/'+templates.get(2571)[key]+'.png')+')>0','consecutive_'+key));
 counts.mixed=inventory.length+6;
 const init=['killall','autosave=0','decadesave=0','autosave_day=0','autosave_decade=0','sound_on=0',"gs '#static_base'",'snk_room_target=0'];
 const probes=Object.entries(groups).map(([group,lines])=>{
  const d=core.parse(raw),name='appearance-'+group,marker='JO9_QA_'+token+'_'+name.replaceAll('-','_')+'_COMPLETE';
  set(d,'demo_estate',render.join('\r\n'));
  set(d,'Start',[...init,...lines,'msg '+q(marker)].join('\r\n'));
  const bytes=core.serialize(d);qa.inspectWorld(bytes);return{name,marker,checkpoint:'Native appearance assertions',raw:bytes};
 });
 return{probes,files:[...files],counts};
}
if(require.main===module){
 const [input,out,only]=process.argv.slice(2),dest=path.resolve(out||'');
 if(!input||!dest.toLowerCase().startsWith(path.resolve('G:/somi/JO9_work_backups').toLowerCase()+path.sep)||fs.existsSync(dest))throw Error('New isolated backup output required');
 const raw=fs.readFileSync(input),built=build(raw);fs.mkdirSync(dest,{recursive:true});
 fs.cpSync(path.join(work,'json'),path.join(dest,'json'),{recursive:true});fs.copyFileSync(path.join(work,'config.xml'),path.join(dest,'config.xml'));
 fs.writeFileSync(path.join(dest,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 for(const rel of built.files){const from=path.join(work,'content/pic',rel+'.png'),to=path.join(dest,'content/pic',rel+'.png');if(!fs.existsSync(from))throw Error('Missing expected resource '+rel);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);}
 const selected=only?built.probes.filter(p=>p.name===only):built.probes;if(!selected.length)throw Error('Unknown probe name');
 const plan=selected.map(p=>{const file=path.join(dest,p.name+'.qsp');fs.writeFileSync(file,p.raw);return{name:p.name,file,marker:p.marker,checkpoint:p.checkpoint};});
 fs.writeFileSync(path.join(dest,'plan.json'),JSON.stringify(plan,null,2));fs.writeFileSync(path.join(dest,'coverage.json'),JSON.stringify({input,sha256:core.hash(raw),...built.counts,resources:built.files.length},null,2));
 console.log(JSON.stringify({out:dest,plan:path.join(dest,'plan.json'),...built.counts,resources:built.files.length}));
}
module.exports={build};
