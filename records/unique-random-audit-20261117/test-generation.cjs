'use strict';
// Isolated, in-memory selection tests. Does not run full character creation or write the installation.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const {initQspEngine}=require('G:/somi/JO9sa/tools/modding-hub/vendor/qsp/wasm-engine.cjs');
console.log=()=>{};
const source=process.env.JO9_GENERATION_QSP||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const raw=fs.readFileSync(source),before=core.parse(raw),body=(d,n)=>core.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
const catalogue=process.argv[2]?JSON.parse(fs.readFileSync(process.argv[2],'utf8')):{reviewed:true,blockedIds:[1448,2339,2341],preserveGenericIds:[],note:'Only an isolated regression fixture, not a complete approved exclusion catalogue.'};
const modulePath=path.join(__dirname,'generator-stage.cjs');
// RED fixture: the current generator has no live Gloria exclusion.
const staged=fs.existsSync(modulePath)?require(modulePath).buildStage(raw,catalogue):{raw,helperBody:'result=1',blockedIds:[2341,1448,1450,2339],sourceHash:before.hash};
const candidate=core.parse(staged.raw),full=body(candidate,'generate_stock'),cut=full.indexOf("\r\ngs 'get_stock_seed'");
assert(cut>0,'The test stops immediately before loading the selected preset');
const selector=full.slice(0,cut).replace('jo9_gen_type_tries += 1','jo9_gen_type_tries += 1\r\n\tqa_type_tries=jo9_gen_type_tries')+"\r\nqa_selected=stock_type";
const pool="if qa_forced_pick>0 and args[1]=0: result=qa_forced_pick & exit\r\n"+body(candidate,'jo9_mob_pool');
const entries=[['Start','exit'],['generate_stock',selector],['jo9_mob_pool',pool],['jo9_random_stock_allowed',staged.helperBody],['main_screen','qa_aborted=1'],['city_menu_form','qa_aborted=1']];
const enc=s=>core.shift(s,-5),parts=['QSPGAME','Random stock selection tests','',enc(String(entries.length))];
for(const[n,s]of entries)parts.push(enc(n),'',enc(s),enc('0'));parts.push('');
const fixture=Buffer.from(parts.join('\r\n'),'utf16le');core.parse(fixture);
(async()=>{
 const api=await initQspEngine('G:/somi/JO9sa/tools/modding-hub/vendor/qsp/qsp-engine.wasm'),errors=[],checks=[];
 api.on('error',x=>errors.push(x));api.on('msg',(_text,done)=>done());
 api.openGame(fixture.buffer.slice(fixture.byteOffset,fixture.byteOffset+fixture.byteLength),true);
 function run(s){const at=errors.length;api.execCode(s.replace(/\r?\n/g,'\r\n'));assert.equal(errors.length,at,JSON.stringify(errors.slice(at)));}
 function number(s){run('qa_number='+s);return api.readVariable('qa_number');}
 function check(label,actual,expected){assert.equal(actual,expected,label);checks.push(label);}
 const gate=id=>number("func('jo9_random_stock_allowed',"+id+')');
 for(const id of staged.blockedIds)check('exclude verified unique/compat ID '+id,gate(id),0);
 const keep=[...new Set([...(catalogue.preserveGenericIds||catalogue.preservedTemplateIds||[]),...Array.from({length:18},(_,i)=>2586+i),...Array.from({length:728},(_,i)=>4000+i)])];
 for(const id of keep)check('preserve approved generic ID '+id,gate(id),1);
 check('reject missing type zero',gate(0),0);
 const seed="killall\nCONST_INT['slave_exist']=1\nCONST_INT['no_slave']=0\nCONST_INT['loli_age']=1\nCONST_INT['young_age']=0\nCONST_INT['milf_age']=2\nage_code['young']=0\nage_code['loli']=1\nage_code['milf']=2\n$clear_slave_instance={killvar 'stock' & stock_type=0}\nis_home=1\n";
 // Force an obsolete, artificially widened cached range to repeatedly select Gloria.
 // The production pool body is preserved; only its random draws are controlled in this fixture.
 run(seed+"milf_first=2341\nmilf_last=2341\n$special_age='milf'\nqa_forced_pick=2341\n$seed_ava[2341]='qa_gloria'\nseed_age[2341]=2\n$seed_ava[4440]='qa_generic'\nseed_age[4440]=2\ngs 'generate_stock'");
 check('wide cached bound cannot yield Gloria',api.readVariable('qa_selected'),4440);
 check('existing 32-attempt cap retained',api.readVariable('qa_type_tries'),33);
 check('fallback finds a valid generic template',api.readVariable('qa_aborted'),0);
 for(const id of staged.blockedIds){
  run(seed+'special_stock='+id+"\ngs 'generate_stock'");
  check('explicit acquisition override preserved '+id,api.readVariable('qa_selected'),id);
 }
 // Keep every unrelated part of character creation byte-for-byte unchanged.
 const oldBody=body(before,'generate_stock'),oldCut=oldBody.indexOf("\r\ngs 'get_stock_seed'");
 check('post-selection creation code unchanged',full.slice(cut),oldBody.slice(oldCut));
 const originalNames=new Set(before.locations.map(l=>l.name));
 for(const l of before.locations)if(l.name!=='generate_stock')check('existing location unchanged '+l.name,body(candidate,l.name),body(before,l.name));
 check('only one location added',candidate.locations.filter(l=>!originalNames.has(l.name)).length,1);
 check('installation not written',core.hash(fs.readFileSync(source)),before.hash);
 const proof={status:'PASS',engine:api.version(),checks:checks.length,blockedIds:staged.blockedIds.length,preservedGenericIds:keep.length,sourceHash:before.hash,candidateHash:candidate.hash,errors:0,limits:['Actual selection prefix only; full preset creation and story acquisition are outside this fixture.','Existing special_stock selection bypass is checked for every blocked ID.','No game/native UI, save or installation was written.']};fs.writeFileSync(path.join(__dirname,'generation-verification.json'),JSON.stringify(proof,null,2)+'\n');process.stdout.write(JSON.stringify(proof)+'\n');
})().catch(e=>{process.stderr.write((e.stack||String(e))+'\n');process.exitCode=1;});
