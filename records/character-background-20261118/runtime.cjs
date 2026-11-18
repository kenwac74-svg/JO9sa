'use strict';
// Focused runtime fixture and exact QSP patch. Does not install or write saves.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const TASK='G:/Codex/tmp/character-background-20261118';
const WORK='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const NL='\r\n',cr=s=>s.replace(/\r?\n/g,NL),q=s=>"'"+s.replaceAll("'","''")+"'";
const roles=['slave','assistant','prisoner','cow','room1','room2','room3','room4','farmhand','harpy','pig',...Array.from({length:18},(_,i)=>'iced_'+(i+1))];
const allRoles=[...roles,'stock','snk_parked_slave'];
function body(d,name){const l=d.locations.find(l=>l.name===name);assert(l,'Missing '+name);return c.shift(d.lines[l.body],5);}
function append(d,loc){d.lines.splice(d.lines.length-1,0,...[loc.name,loc.desc||'',loc.body,'0'].map(s=>c.shift(s,-5)));d.lines[3]=c.shift(String(Number(c.shift(d.lines[3],5))+1),-5);}
function bytes(d){return Buffer.from(d.lines.join(NL),'utf16le');}
function document(){const raw=fs.readFileSync(WORK),d=c.parse(raw);assert(raw.equals(bytes(d)),'QSP byte roundtrip');return {raw,d};}
function readHelper(){return cr(fs.readFileSync(path.join(__dirname,'background-runtime.qsps'),'utf8'));}
function modify(){
 const {raw,d}=document(),edits=[];
 function edit(name,old,replacement){const l=d.locations.find(l=>l.name===name),oldBody=body(d,name);assert.equal(oldBody.split(old).length-1,1);d.lines[l.body]=c.shift(oldBody.replace(old,replacement),-5);edits.push({location:name,field:'body',old,new:replacement,count:1});}
 const old="! JO9 MOD END BLACK_MARKET_RANDOM_IDENTITY_20261115\r\nspecial_stock = 0";
 edit('generate_stock',old,"! JO9 MOD END BLACK_MARKET_RANDOM_IDENTITY_20261115\r\n! JO9 MOD START CHARACTER_BACKGROUND_CLASSIFICATION_20261118_GENERATE\r\ngs 'jo9_character_background','apply','stock'\r\n! JO9 MOD END CHARACTER_BACKGROUND_CLASSIFICATION_20261118_GENERATE\r\nspecial_stock = 0");
 const first=body(d,'$newloc').split(NL)[0];
 edit('$newloc',first,"! JO9 MOD START CHARACTER_BACKGROUND_CLASSIFICATION_20261118_REFRESH\r\ngs 'jo9_character_background','all'\r\n! JO9 MOD END CHARACTER_BACKGROUND_CLASSIFICATION_20261118_REFRESH\r\n"+first);
 const added={name:'jo9_character_background',desc:'',body:readHelper(),actions:[]};append(d,added);
 const after=bytes(d),parsed=c.parse(after);assert.equal(parsed.locations.length,d.locations.length+1);
 // Preserve unrelated manual text exactly, including its pre-existing line endings.
 for(const l of parsed.locations.filter(l=>[...edits.map(e=>e.location),added.name].includes(l.name))){const text=c.shift(parsed.lines[l.body],5);assert(!/(^|[^\r])\n|\r(?!\n)/.test(text),'Invalid newline '+l.name);}
 const mod={id:'2026-11-18_character_background_classification',description:'Persist explicit character classification independently of lore and initial stat generation',before_sha256:c.hash(raw),after_sha256:c.hash(after),edits,add_locations:[added]};
 return {raw,after,mod};
}
let checks=0;
function fixture(raw){
 const d=c.parse(raw),lines=[],put=s=>lines.push(s),check=(expr,name)=>{checks++;put(`if ${expr}: msg 'JO9_BG_FAIL_${name}' & exit`);};
 if(process.env.JO9_BG_TRACE==='1'){
  const h=d.locations.find(l=>l.name==='jo9_character_background');
  let trace=cr("msg 'JO9_BG_TRACE_mode_<<$args[0]>>_role_<<$args[1]>>'\n")+body(d,h.name);
  trace=trace.replace("local $jo9_bg_role=$args[1]", "local $jo9_bg_role=$args[1]\r\nmsg 'JO9_BG_TRACE_local_role_<<$jo9_bg_role>>'");
  trace=trace.replace("if jo9_bg_state<=0: exit", "msg 'JO9_BG_TRACE_state_<<jo9_bg_state>>'\r\nif jo9_bg_state<=0: exit");
  trace=trace.replace("if jo9_bg_id<=0: exit", "msg 'JO9_BG_TRACE_id_<<jo9_bg_id>>_fixed_<<seed_background_fixed[jo9_bg_id]>>'\r\nif jo9_bg_id<=0: exit");
  d.lines[h.body]=c.shift(trace,-5);
 }
 put("$onnewloc='' & $ongload='' & $counter='' & debug=0");
 put("stock_state=1 & stock_type=2341 & special_stock=2341");
 put("$stock_world='saved_old' & $stock_family='saved_old' & $stock_occupation='saved_old'");
 put("seed_background_fixed[2341]=1 & $seed_world[2341]='modern' & $seed_family[2341]='princess' & $seed_occupation[2341]='maid'");
 put("stock['stamina']=5 & stock['world_index']=4 & stock['family_index']=3 & stock['work_index']=2 & stock_rate['mood']=47 & $stock_world_description='custom lore' & stock['jo9_bg_random']=0");
 put("jo9_probe_state=dyneval('result=stock_state') & jo9_probe_type=dyneval('result=stock_type') & jo9_probe_instr=instr(',slave,stock,',',stock,')");
 const generate=body(d,'generate_stock'),at=generate.indexOf('! JO9 MOD END BLACK_MARKET_RANDOM_IDENTITY_20261115');assert(at>=0);put(generate.slice(at));
 check("$stock_world ! 'modern' or $stock_family ! 'princess' or $stock_occupation ! 'maid'",'generation_state_<<stock_state>>_type_<<stock_type>>_fixed_<<seed_background_fixed[2341]>>_world_<<$stock_world>>_family_<<$stock_family>>_job_<<$stock_occupation>>_probe_<<jo9_probe_state>>_<<jo9_probe_type>>_<<jo9_probe_instr>>');
 check("stock['stamina'] ! 5 or stock['world_index'] ! 4 or stock['family_index'] ! 3 or stock['work_index'] ! 2 or stock_rate['mood'] ! 47 or $stock_world_description ! 'custom lore' or stock['jo9_bg_random'] ! 0",'preserve_generation');
 put("killvar '$all_slave_characters'");
 for(const role of roles)put('$all_slave_characters[]='+q(role));
 for(const role of allRoles){
  put(`${role}_state=1 & ${role}_type=2341 & $${role}_world='stale_world' & $${role}_family='stale_family' & $${role}_occupation='stale_job'`);
  put(`${role}['beauty']=5 & ${role}['gladiatrix']=5 & ${role}['moral']=4 & ${role}_rate['sensitivity']=67 & ${role}['jo9_bg_random']=0 & $${role}_family_description='authored history'`);
 }
 const newloc=body(d,'$newloc');const marker='! JO9 MOD END CHARACTER_BACKGROUND_CLASSIFICATION_20261118_REFRESH';assert(newloc.includes(marker));put(newloc.slice(0,newloc.indexOf(marker)+marker.length));
 for(const role of allRoles){
  check(`$${role}_world ! 'modern' or $${role}_family ! 'princess' or $${role}_occupation ! 'maid'`,'refresh_'+role);
  check(`${role}['beauty'] ! 5 or ${role}['gladiatrix'] ! 5 or ${role}['moral'] ! 4 or ${role}_rate['sensitivity'] ! 67 or ${role}['jo9_bg_random'] ! 0 or $${role}_family_description ! 'authored history'`,'preserve_'+role);
 }
 put("$seed_world[2341]='' & $seed_family[2341]='' & $seed_occupation[2341]=''");
 put("gs 'jo9_character_background','all'");
 check("$slave_world ! '' or $slave_family ! '' or $slave_occupation ! '' or $iced_18_world ! ''",'explicit_clear');
 put("$seed_world[2341]='sns' & $seed_family[2341]='' & $seed_occupation[2341]='warrior'");
 put("gs 'jo9_character_background','apply','assistant'");
 check("$assistant_world ! 'sns' or $assistant_family ! '' or $assistant_occupation ! 'warrior'",'partial');
 put("seed_background_fixed[2341]=0 & $seed_world[2341]='modern' & $assistant_world='existing_random'");
 put("gs 'jo9_character_background','all'");check("$assistant_world ! 'existing_random'",'unspecified_kept');
 put("seed_background_fixed[2341]=1 & assistant_state=0 & $assistant_world='empty_slot'");
 put("gs 'jo9_character_background','apply','assistant'");check("$assistant_world ! 'empty_slot'",'empty_slot_kept');
 put("gs 'jo9_character_background','apply','not_a_role'");check("$assistant_world ! 'empty_slot'",'invalid_role');
 put("assistant_state=1 & assistant_type=999999 & $assistant_world='other_person'");
 put("gs 'jo9_character_background','apply','assistant'");check("$assistant_world ! 'other_person'",'unregistered_kept');
 put("gs 'jo9_character_background','all'");check("$slave_world ! 'modern' or $slave_family ! '' or $slave_occupation ! 'warrior'",'repeat_refresh');
 put(`msg 'JO9_BG_FINAL_PASS_${checks}'`);
 const start=d.locations.find(l=>l.name==='Start');d.lines[start.body]=c.shift("$onnewloc='' & $counter='' & gt 'qa_bg_begin'",-5);
 append(d,{name:'qa_bg_begin',body:cr(lines.join('\n'))});return bytes(d);
}
const action=process.argv[2]||'prepare';fs.mkdirSync(TASK,{recursive:true});
if(action==='red'){
 const {raw,d}=document(),old=body(d,'generate_stock'),at=old.indexOf('! JO9 MOD END BLACK_MARKET_RANDOM_IDENTITY_20261115');
 const code=cr("$onnewloc='' & $ongload='' & $counter=''\nstock_state=1 & stock_type=2341 & special_stock=2341\n$stock_world='saved_old'\nseed_background_fixed[2341]=1 & $seed_world[2341]='modern'\n"+old.slice(at)+"\nif $stock_world ! 'modern': msg 'JO9_BG_FAIL_generation' & exit\nmsg 'JO9_BG_FINAL_UNEXPECTED'");
 const start=d.locations.find(l=>l.name==='Start');d.lines[start.body]=c.shift("$onnewloc='' & $counter='' & gt 'qa_bg_begin'",-5);append(d,{name:'qa_bg_begin',body:code});fs.writeFileSync(TASK+'/before.qsp',bytes(d));console.log('Prepared RED fixture (no game writes)');
}else if(action==='prepare'){
 const result=modify();fs.writeFileSync(TASK+'/candidate.qsp',result.after);fs.writeFileSync(TASK+'/candidate-native.qsp',fixture(result.after));fs.writeFileSync(path.join(__dirname,'patch.json'),JSON.stringify(result.mod,null,2)+'\n');fs.writeFileSync(path.join(__dirname,'before.qsp.gz'),zlib.gzipSync(result.raw));fs.writeFileSync(path.join(__dirname,'prepared.json'),JSON.stringify({baseline:result.mod.before_sha256,candidate:result.mod.after_sha256,assertions:checks,changedLocations:result.mod.edits.map(x=>x.location),added:'jo9_character_background',allRoles:allRoles.length},null,2)+'\n');console.log(JSON.stringify({candidate:result.mod.after_sha256,assertions:checks}));
}else throw Error('Unknown action');
if(!fs.existsSync(TASK+'/FastQSP.ini'))fs.writeFileSync(TASK+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
