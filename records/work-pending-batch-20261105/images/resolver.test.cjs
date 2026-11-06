'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const source='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const base=core.parse(fs.readFileSync(source));
const dir=__dirname;
const fixture=(body)=>Buffer.from(['QSPGAME','','',core.shift('2',-5),...['Start','','','0','jo9_seed_role_images','',body,'0'].map(x=>core.shift(x,-5)),''].join('\r\n'),'utf16le');
const compat=s=>s.replace(/^(\s*)for (\w+)\s*=\s*(.*?)\s+to\s+(.*?):/gim,(_,sp,v,a,z)=>`${sp}loop ${v} = ${a} while ${v} <= ${z} step ${v} += 1:`).replace("dynamic 'jo9_lookup_exists = %<<$jo9_lookup_path>>%'","jo9_lookup_exists = jo9_test_files[$jo9_lookup_path]");
const cases=[
 ['missing custom falls back to base',"$fullimage[1]='legacy/base' & $indpack_title[1]='pack/base' & jo9_test_files['content/pic/legacy/base.png']=1", "'resolve',1,'custom/missing','fullimage'",'legacy/base'],
 ['custom valid retained',"$fullimage[1]='legacy/base' & $indpack_title[1]='pack/base' & jo9_test_files['content/pic/custom/valid.png']=1 & jo9_test_files['content/pic/pack/base.png']=1", "'resolve',1,'custom/valid','fullimage'",'custom/valid'],
 ['known base alias keeps pack priority',"$fullimage[1]='legacy/base' & $indpack_title[1]='pack/base' & jo9_test_files['content/pic/legacy/base.png']=1 & jo9_test_files['content/pic/pack/base.png']=1", "'resolve',1,'legacy/base','fullimage'",'pack/base'],
 ['pack-only maid',"$indpack_maid[1]='pack/maid' & jo9_test_files['content/pic/pack/maid.png']=1", "'select',1,'','fullmade','indpack_maid','','pack'",'pack/maid'],
 ['missing mood uses same pack outfit',"$fullmade[1]='legacy/maid' & $indpack_maid[1]='pack/maid' & $indpack_maid_horny[1]='pack/missing-mood' & jo9_test_files['content/pic/pack/maid.png']=1 & jo9_test_files['content/pic/legacy/maid.png']=1", "'select',1,'legacy/maid','fullmade','indpack_maid','_horny','pack'",'pack/maid'],
 ['missing pack outfit uses same legacy outfit',"$fullimage[1]='legacy/base' & $fullmade[1]='legacy/maid' & $indpack_title[1]='pack/base' & $indpack_maid[1]='pack/missing-maid' & $indpack_maid_horny[1]='pack/missing-mood' & jo9_test_files['content/pic/legacy/maid.png']=1 & jo9_test_files['content/pic/pack/base.png']=1", "'select',1,'legacy/maid','fullmade','indpack_maid','_horny','pack'",'legacy/maid'],
 ['missing both outfits uses pack base',"$fullimage[1]='legacy/base' & $fullmade[1]='legacy/missing' & $indpack_title[1]='pack/base' & $indpack_maid[1]='pack/missing' & jo9_test_files['content/pic/pack/base.png']=1", "'select',1,'legacy/missing','fullmade','indpack_maid','','pack'",'pack/base'],
 ['missing all returns empty',"$fullimage[1]='legacy/missing' & $indpack_title[1]='pack/missing'", "'resolve',1,'legacy/missing','fullimage'",''],
 ['direct old custom keeps priority',"$fullimage[1]='legacy/base' & $indpack_title[1]='pack/base' & jo9_test_files['content/pic/custom/valid.png']=1 & jo9_test_files['content/pic/pack/base.png']=1", "'select',1,'custom/valid','fullimage','indpack_title','','legacy'",'custom/valid'],
 ['direct old definition keeps priority',"$fullimage[1]='legacy/base' & $indpack_title[1]='pack/base' & jo9_test_files['content/pic/legacy/base.png']=1 & jo9_test_files['content/pic/pack/base.png']=1", "'select',1,'legacy/base','fullimage','indpack_title','','legacy'",'legacy/base'],
 ['pack screen retains valid custom cache when outfit missing',"$fullimage[1]='legacy/base' & $indpack_title[1]='pack/base' & jo9_test_files['content/pic/custom/valid.png']=1 & jo9_test_files['content/pic/pack/base.png']=1", "'select',1,'custom/valid','fullimage','indpack_nurse','','pack'",'custom/valid'],
 ['pack role screen retains valid custom cache when outfit missing',"$fullmade[1]='legacy/maid' & $indpack_maid[1]='pack/missing' & jo9_test_files['content/pic/custom/valid.png']=1 & jo9_test_files['content/pic/legacy/maid.png']=1", "'select',1,'custom/valid','fullmade','indpack_maid','','pack'",'custom/valid'],
 ['state file preferred even when normal missing',"$indpack_maid[1]='pack/missing' & $indpack_maid_rebel[1]='pack/rebel' & jo9_test_files['content/pic/pack/rebel.png']=1", "'select',1,'','fullmade','indpack_maid','_rebel','pack'",'pack/rebel'],
 ['cached legacy maid uses legacy when pack missing',"$fullimage[1]='legacy/base' & $fullmade[1]='legacy/maid' & $indpack_title[1]='pack/base' & $indpack_maid[1]='pack/missing' & jo9_test_files['content/pic/legacy/maid.png']=1 & jo9_test_files['content/pic/pack/base.png']=1", "'resolve',1,'legacy/maid','fullimage'",'legacy/maid'],
 ['obsolete original25 role is never resurrected',"$fullimage[2577]='legacy/base' & jo9_test_files['content/pic/legacy/base.png']=1 & jo9_test_files['content/pic/girls/full/maid/medico.png']=1", "'resolve',2577,'girls/full/maid/medico','fullmade'",'legacy/base'],
 ['Isabella 2323 shared cache is ID scoped',"$fullimage[2323]='girls/full/2323/2323_full_title' & jo9_test_files['content/pic/girls/full/2323/2323_full_title.png']=1 & jo9_test_files['content/pic/girls/full/isabella_black_long_milf.png']=1", "'resolve',2323,'girls/full/isabella_black_long_milf','fullimage'",'girls/full/2323/2323_full_title'],
 ['Isabella 2571 shared cache uses current art',"$fullimage[2571]='girls/full/isabella_black_long_milf' & jo9_test_files['content/pic/girls/full/isabella_black_long.png']=1 & jo9_test_files['content/pic/girls/full/isabella_black_long_milf.png']=1", "'resolve',2571,'girls/full/isabella_black_long_milf','fullimage'",'girls/full/isabella_black_long'],
 ['other ID sharing the string has no Isabella rewrite',"$fullimage[5]='other/base' & jo9_test_files['content/pic/girls/full/isabella_black_long_milf.png']=1 & jo9_test_files['content/pic/girls/full/isabella_black_long.png']=1", "'resolve',5,'girls/full/isabella_black_long_milf','fullimage'",'girls/full/isabella_black_long_milf'],
 ['Isabella 2571 custom appearance retained',"$fullimage[2571]='girls/full/isabella_black_long_milf' & jo9_test_files['content/pic/custom/valid.png']=1 & jo9_test_files['content/pic/girls/full/isabella_black_long.png']=1", "'resolve',2571,'custom/valid','fullimage'",'custom/valid'],
];
async function main(){
 const engineRoot=path.resolve(dir,'../../outputs/fog-relay-startup-fix-20261017/package/dist');
 const {initQspEngine}=await import(require('node:url').pathToFileURL(path.join(engineRoot,'wasm-engine.modern.js')).href);
 const wasm=fs.readFileSync(path.join(engineRoot,'qsp-engine.wasm'));
 const api=await initQspEngine(wasm.buffer.slice(wasm.byteOffset,wasm.byteOffset+wasm.byteLength));
 const errors=[];api.on('error',e=>errors.push(e));
 const helperPath=path.join(dir,'helper-new.qsrc');
 const body=fs.existsSync(helperPath)?fs.readFileSync(helperPath,'utf8'):core.shift(base.lines[base.locations.find(x=>x.name==='jo9_seed_role_images').body],5);
 await api.openGame(fixture(compat(body)).buffer,true);
 const results=[];
 for(const [name,setup,call,expected]of cases){
  await api.execCode("killall & "+setup+" & $probe=func('jo9_seed_role_images',"+call+")");
  const got=api.readVariable('$probe');results.push({name,expected,got,pass:got===expected});
 }
 for(const [name,setup,key,pack,expected]of [
  ['new-only registered',"$indpack_maid[1]='missing'",'fullmade','indpack_maid',1],
  ['old-only registered even missing',"$fullmade[1]='missing'",'fullmade','indpack_maid',1],
  ['base does not unlock absent outfit',"$fullimage[1]='base' & $indpack_title[1]='base'",'fullmade','indpack_maid',0]
 ]){await api.execCode(`killall & ${setup} & probe=func('jo9_seed_role_images','registered',1,'${key}','${pack}')`);const got=api.readVariable('probe');results.push({name,expected,got,pass:got===expected});}
 for(const id of [2577,2585,2597,2600,2601])for(const key of ['fullmade','fullsecretary','fullmistress','fullpregnant']){
  const stem=['medico','joker','Sana','celestine','olga'][[2577,2585,2597,2600,2601].indexOf(id)],folder={fullmade:'maid',fullsecretary:'secretary',fullmistress:'mistress',fullpregnant:'pregnant'}[key];
  const absentPregnancy=key==='fullpregnant'&&id!==2577;
  const raw=`girls/full/${folder}/${stem}`;
  const setup=`$fullimage[${id}]='legacy/base' & jo9_test_files['content/pic/legacy/base.png']=1 & jo9_test_files['content/pic/${raw}.png']=1`;
  await api.execCode(`killall & ${setup} & $probe=func('jo9_seed_role_images','resolve',${id},'${raw}','${key}')`);
  const got=api.readVariable('$probe'),expected=absentPregnancy?raw:'legacy/base';results.push({name:`original25 ${id}/${key}`,got,expected,pass:got===expected});
 }
 const report={note:'QSP logic executes under WASM with FOR translated and only native file-existence expression replaced by fixture map. Native FastQSP check is separate.',errors,results};
 fs.writeFileSync(path.join(dir,'logic-test-report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({errors,passed:results.filter(x=>x.pass).length,total:results.length,failures:results.filter(x=>!x.pass)},null,2));
 assert.equal(errors.length,0,'QSP logic syntax');assert.equal(results.filter(x=>!x.pass).length,0,'resolver behavior');
}
module.exports={cases,fixture};
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
