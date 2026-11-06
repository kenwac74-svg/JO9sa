'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const doc=core.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
const before=new Map(doc.locations.map(l=>[l.name,core.shift(doc.lines[l.body],5)]));
const bodies=new Map(before);
for(const e of require('./mods.json')){const old=bodies.get(e.location);assert.equal(old.split(e.old).length-1,e.count);bodies.set(e.location,old.split(e.old).join(e.new));}
const compat=s=>s.replace(/^(\s*)for (\w+)\s*=\s*(.*?)\s+to\s+(.*?):/gim,(_,sp,v,a,z)=>`${sp}loop ${v} = ${a} while ${v} <= ${z} step ${v} += 1:`).replace("dynamic 'jo9_lookup_exists = %<<$jo9_lookup_path>>%'","jo9_lookup_exists = jo9_test_files[$jo9_lookup_path]");
const qsp=Buffer.from(['QSPGAME','','',core.shift('4',-5),...new Map([['Start',''],['jo9_seed_role_images',bodies.get('jo9_seed_role_images')],['display_fullimage',bodies.get('display_fullimage')],['interior_change','$result=$args[1]']]).entries().flatMap(([n,b])=>[core.shift(n,-5),'',core.shift(compat(b),-5),core.shift('0',-5)]),''].join('\r\n'),'utf16le');
async function main(){
 const root=path.resolve(__dirname,'../../outputs/fog-relay-startup-fix-20261017/package/dist');
 const {initQspEngine}=await import(require('node:url').pathToFileURL(path.join(root,'wasm-engine.modern.js')).href);
 const wasm=fs.readFileSync(path.join(root,'qsp-engine.wasm')),api=await initQspEngine(wasm.buffer.slice(wasm.byteOffset,wasm.byteOffset+wasm.byteLength));
 const errors=[],results=[];api.on('error',e=>errors.push(e));await api.openGame(qsp.buffer.slice(qsp.byteOffset,qsp.byteOffset+qsp.byteLength),true);
 function record(name,got,expected){results.push({name,got,expected,pass:got===expected});}
 async function exec(s){await api.execCode(s);}
 const setup="killall & CONST_INT['slave_exist']=1 & assistant_state=1 & assistant_type=1 & assistant['moral']=4 & assistant['arousal']=4 & $assistant['cloth']='голая' & $assistant['fullimage']='legacy/base' & $fullimage[1]='legacy/base' & $indpack_title[1]='pack/base'";
 for(const [mode,key,pack]of [[0,'fullimage','indpack_naked'],[1,'fullmistress','indpack_dom'],[2,'fullmade','indpack_maid'],[3,'fullsecretary','indpack_secr']]){
  await exec(setup+` & assistant['image_mode']=${mode} & $${key}[1]='legacy/outfit' & $${pack}[1]='pack/outfit' & jo9_test_files['content/pic/legacy/outfit.png']=1 & jo9_test_files['content/pic/pack/outfit.png']=1 & $probe=func('display_fullimage','assistant','center_image')`);
  record(`display assistant mode ${mode} pack priority`,api.readVariable('$probe'),'<div id="center_image"><img src="content\\pic\\pack/outfit.png"></div>');
  await exec("jo9_test_files['content/pic/pack/outfit.png']=0 & $probe=func('display_fullimage','assistant','center_image')");
  record(`display assistant mode ${mode} legacy fallback`,api.readVariable('$probe'),'<div id="center_image"><img src="content\\pic\\legacy/outfit.png"></div>');
 }
 await exec(setup+" & assistant['image_mode']=2 & assistant['moral']=1 & assistant['arousal']=5 & $indpack_maid[1]='pack/maid' & $indpack_maid_horny[1]='pack/horny' & $indpack_maid_rebel[1]='pack/rebel' & jo9_test_files['content/pic/pack/horny.png']=1 & jo9_test_files['content/pic/pack/rebel.png']=1 & $probe=func('display_fullimage','assistant','center_image')");
 record('arousal priority over rebellion',api.readVariable('$probe'),'<div id="center_image"><img src="content\\pic\\pack/horny.png"></div>');
 await exec(setup+" & $assistant['fullimage']='' & $indpack_naked[1]='pack/naked' & jo9_test_files['content/pic/pack/naked.png']=1 & $probe=func('display_fullimage','assistant','center_image')");
 record('new pack actor displays with empty cache',api.readVariable('$probe'),'<div id="center_image"><img src="content\\pic\\pack/naked.png"></div>');
 const clicks=core.literals(bodies.get('assistant_stat')).filter(x=>x.text.includes('EXEC:')&&x.text.includes("$assistant['fullimage'] = func('jo9_seed_role_images'"));
 assert.equal(clicks.length,4,'all four outfit click consumers');
 for(const [mode,key,pack]of [[0,'fullimage','indpack_title'],[1,'fullmistress','indpack_dom'],[2,'fullmade','indpack_maid'],[3,'fullsecretary','indpack_secr']]){
  const literal=clicks.find(x=>x.text.includes(`assistant['image_mode'] = ${mode}`)).text;
  const code=literal.match(/EXEC: (.*?) & gt \$curloc/)[1];
  await exec(`killall & assistant_type=1 & $${pack}[1]='pack/click' & jo9_test_files['content/pic/pack/click.png']=1 & ${code}`);
  record(`new-only click mode ${mode}`,api.readVariableByKey('$assistant','fullimage'),'pack/click');
  record(`click image mode ${mode}`,api.readVariableByKey('assistant','image_mode'),mode);
 }
 const preserve=new Set(['actor_cache_refresh','registry_purge','appearance_metadata_inference','developer_image_preview','actor_cache_initialization','appearance_metadata_filter','appearance_change_cache_write','inactive_comment']);
 for(const e of require('../../girls-checklist-20261104/dual-registration/audit.json').callsites.filter(x=>preserve.has(x.semanticClass)))assert.ok(bodies.get(e.location).includes(e.code),`${e.location}:${e.line} non-rendering code retained`);
 record('assistant six conditions use registration checks',(bodies.get('assistant_stat').match(/func\('jo9_seed_role_images','registered'/g)||[]).length,6);
 record('home gate permits pack-only assistant',bodies.get('menu_form').includes("if nsfw = 0: $text_display += func('display_fullimage', 'assistant', 'center_image_home')"),true);
 // The read resolver must leave definitions and actor custom-cache values unchanged.
 await exec("killall & $fullimage[1]='legacy/base' & $indpack_title[1]='pack/base' & $assistant['fullimage']='custom/valid' & jo9_test_files['content/pic/custom/valid.png']=1 & $probe=func('jo9_seed_role_images','resolve',1,$assistant['fullimage'],'fullimage')");
 record('actor custom cache unchanged',api.readVariableByKey('$assistant','fullimage'),'custom/valid');
 record('legacy registry unchanged',api.readVariableByIndex('$fullimage',1),'legacy/base');
 record('pack registry unchanged',api.readVariableByIndex('$indpack_title',1),'pack/base');
 record('temporary candidate variable restored',api.readVariableSize('$jo9_lookup_candidates'),0);
 record('temporary fullimage key restored',api.readVariableSize('$jo9_full_old_key'),0);
 const report={note:'Real changed QSP consumers and helper under instrumented WASM; native file-existence validation remains separate.',errors,results};
 fs.writeFileSync(path.join(__dirname,'consumer-test-report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({errors,passed:results.filter(x=>x.pass).length,total:results.length,failures:results.filter(x=>!x.pass)},null,2));
 assert.equal(errors.length,0);assert.equal(results.filter(x=>!x.pass).length,0);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
