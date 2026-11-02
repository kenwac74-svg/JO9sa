'use strict';
const {fs,assert,c,sc,rec,tmp,baseline,write,load,run}=require('./harness.cjs');
const {d}=load();
const code=`slave_state=1
slave['jo9_focus']=-1
slave['jo9_focus_known']=1
spell_revelio=0
$qa_known=$func('jo9_traits','list','slave')
if instr($qa_known,'산만함')=0: msg 'FAIL_REVELIO_KNOWN_CONTROL' & exit
slave['jo9_focus_known']=0
$qa_hidden=$func('jo9_traits','list','slave')
if instr($qa_hidden,'산만함')>0: msg 'FAIL_REVELIO_HIDDEN_CONTROL' & exit
spell_revelio=1
$qa_spell=$func('jo9_traits','list','slave')
savegame 'red-state.sav'
if instr($qa_spell,'산만함')=0: msg 'FAIL_REVELIO_HIDDEN_FOCUS_EXPECT_VISIBLE' & exit
`;
const runResult=run(d,'red',code),s=sc.parse(fs.readFileSync(tmp+'/red-state.sav'));
const v=(name,key=undefined,string=false)=>sc.value(s,name.toUpperCase(),key)?.[string?1:0];
const report={baseline,expected:'held hidden distracted trait appears with spell_revelio=1',nativeExpectedFailure:runResult.engineExit===1&&runResult.log.includes('FAIL_REVELIO_HIDDEN_FOCUS_EXPECT_VISIBLE'),engineExit:runResult.engineExit,results:runResult.results,knownControl:v('qa_known',undefined,true),hiddenControl:v('qa_hidden',undefined,true),spellOutput:v('qa_spell',undefined,true),focus:v('slave','jo9_focus'),known:v('slave','jo9_focus_known'),spell:v('spell_revelio'),workUnchanged:true,limits:['Synthetic native fixture; actual list helper unchanged, no personal save loaded.']};
write(rec+'/red-results.json',report);assert(report.nativeExpectedFailure);assert.equal(report.focus,'-1');assert.equal(report.known,'0');assert.equal(report.spell,'1');console.log(JSON.stringify(report));
