'use strict';
const h=require('./harness.cjs'),{fs,assert,sc,rec,tmp,write,quote,load,candidate,run}=h,p=candidate();
const specs=[['oral_affinity',1,'펠라 중독'],['jo9_gag_reflex',1,'반사적 구역질'],['anal_affinity',1,'애널섹스 중독'],['anal_affinity',-1,'애널섹스 혐오'],['defiant',1,'거센 반항심'],['jo9_slave_nature',1,'노예근성'],['jo9_voice_trait',1,'선천적 벙어리'],['jo9_constitution',1,'건강체질'],['jo9_constitution',-1,'약골'],['jo9_combat_trait',1,'광전사'],['jo9_combat_trait',2,'성기사'],['jo9_combat_trait',3,'역전의 용사'],['jo9_versatile',1,'다재다능'],['jo9_peerless',1,'절세미인']];
let code='',rows=[];for(const[key,value,label]of specs)for(const spell of [0,1]){
 const i=rows.length;rows.push({key,value,spell,label});code+=`killvar 'slave'\nslave['${key}']=${value}\nslave['jo9_meiki_state']=0\nspell_revelio=${spell}\n$qa_output[${i}]=$func('jo9_traits','list','slave')\nif instr($qa_output[${i}],${quote(label)})=0 or slave['${key}']!${value} or slave['jo9_meiki_state']!0: msg 'FAIL_REVELIO_ALWAYS_${i}' & exit\n`;
}
const runs=[];for(const[mode,d]of [['baseline',load().d],['candidate',p.d]]){const r=run(d,'always-'+mode,code+`savegame 'always-${mode}.sav'\n`);runs.push({mode,engineExit:r.engineExit,results:r.results});assert.equal(r.engineExit,0);}
const before=sc.parse(fs.readFileSync(tmp+'/always-baseline.sav')),after=sc.parse(fs.readFileSync(tmp+'/always-candidate.sav'));const list=s=>s.vars.find(x=>x.name==='QA_OUTPUT').values;assert.deepEqual(list(after),list(before));
write(rec+'/always-visible-results.json',{baseline:h.baseline,candidate:p.patch.after_sha256,scenariosPerVersion:rows.length,runs,outputsIdentical:true,rows});console.log(JSON.stringify({scenariosPerVersion:rows.length,runs,outputsIdentical:true}));
