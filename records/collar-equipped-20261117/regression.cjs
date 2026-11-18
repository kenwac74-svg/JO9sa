'use strict';
// Executes only the real nonsexual humility-rule block in an in-memory test world.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),scenes=require('G:/somi/JO9sa/tools/text-workshop/scenes.cjs');
const {initQspEngine}=require('G:/somi/JO9sa/tools/modding-hub/vendor/qsp/wasm-engine.cjs');
console.log=()=>{};
const mode=process.argv[2]||'red';if(!['red','green'].includes(mode))throw Error('Use red or green');
async function main(){
 const file='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',raw=fs.readFileSync(file),doc=core.parse(raw),loc=doc.locations.find(l=>l.name==='next_day'),body=core.shift(doc.lines[loc.body],5),a=scenes.analyse(loc.name,body),owner=a.blocks.find(b=>b.condition==="slave['humility_rule'] = 1");
 assert(owner,'humility owner block');let code=body.slice(owner.start,owner.end)+body.slice(owner.end).split(/\r?\n/)[0];
 const startLine=owner.line,endLine=body.slice(0,owner.end).split('\n').length;
 if(mode==='green'){const mod=JSON.parse(fs.readFileSync(path.join(__dirname,'candidate-mod.json'),'utf8'));for(const edit of mod.edits){assert.equal(code.split(edit.old).length-1,1);code=code.replace(edit.old,edit.new);}}
 const rows=['QSPGAME','neutral collar regression','',core.shift('1',-5),core.shift('Start',-5),'',core.shift('exit',-5),core.shift('0',-5),''],fixture=Buffer.from(rows.join('\r\n'),'utf16le');
 const engine=await initQspEngine('G:/somi/JO9sa/tools/modding-hub/vendor/qsp/qsp-engine.wasm'),errors=[];engine.on('error',e=>errors.push(e));for(const e of ['timer','main_changed','stats_changed','actions_changed','objects_changed','refresh','show_window','panel_visibility','close_file'])engine.on(e,()=>{});
 engine.openGame(fixture.buffer.slice(fixture.byteOffset,fixture.byteOffset+fixture.byteLength),true);
 const cases=[
  {name:'stored-only',stored:1,worn:'',wantForced:0,wantBroken:1},
  {name:'worn-only',stored:0,worn:'shock_collar',wantForced:1,wantBroken:0},
  {name:'worn-and-spare',stored:1,worn:'shock_collar',wantForced:1,wantBroken:0},
  {name:'other-collar',stored:0,worn:'golden_collar',wantForced:0,wantBroken:1},
  {name:'force-disabled',stored:1,worn:'shock_collar',force:0,wantForced:0,wantBroken:1},
  {name:'rule-disabled',stored:1,worn:'shock_collar',rule:0,wantForced:0,wantBroken:0},
  {name:'already-compliant',stored:1,worn:'shock_collar',obedience:1,wantForced:0,wantBroken:0},
  {name:'assistant-worn-only',stored:0,worn:'',otherWorn:'shock_collar',wantForced:0,wantBroken:1},
  {name:'own-inventory-only',stored:0,ownStored:1,worn:'',wantForced:0,wantBroken:1}
 ];
 const results=[];
 for(const test of cases){
  const beforeErrors=errors.length,seed=`killall\r\nslave['humility_rule']=${test.rule??1}\r\nslave['force_rules']=${test.force??1}\r\nslave['obedience']=${test.obedience??0}\r\ninventory['shock_collar']=${test.stored}\r\nslave_inventory['shock_collar']=${test.ownStored??0}\r\n$slave['collar']='${test.worn}'\r\n$assistant['collar']='${test.otherWorn??''}'\r\n$room1['collar']='${test.otherWorn??''}'\r\n`;
  engine.execCode(seed+code);const observed={neg:engine.readVariableByKey('slave','neg_rules'),wanted:engine.readVariableByKey('slave','num_rules_wanttobreak'),broken:engine.readVariableByKey('slave','humility_rule_broken'),breakCount:engine.readVariableByKey('slave','num_rules_broken')};
  const pass=errors.length===beforeErrors&&observed.neg===test.wantForced&&observed.wanted===test.wantForced&&observed.broken===test.wantBroken&&observed.breakCount===test.wantBroken;
  results.push({name:test.name,pass,stored:test.stored,worn:test.worn,expected:{forced:test.wantForced,broken:test.wantBroken},observed});
 }
 const result={variant:mode,sourceHash:core.hash(raw),scope:{location:'next_day',startLine,endLine,realBlock:true,isolatedDependencies:'Only scalar role/inventory inputs initialized; complete daily lifecycle and personal saves were not executed.'},engineErrors:errors,total:results.length,passed:results.filter(x=>x.pass).length,cases:results};
 fs.writeFileSync(path.join(__dirname,mode+'-results.json'),JSON.stringify(result,null,2)+'\n');process.stdout.write(JSON.stringify({variant:mode,total:result.total,passed:result.passed,failures:results.filter(x=>!x.pass).map(x=>x.name),errors:errors.length})+'\n');
 assert.equal(errors.length,0,JSON.stringify(errors));if(mode==='red'){assert.deepEqual(results.filter(x=>!x.pass).map(x=>x.name),['stored-only','worn-only']);}else assert.equal(result.passed,result.total);
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
