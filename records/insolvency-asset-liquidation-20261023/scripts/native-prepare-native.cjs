'use strict';
const fs=require('node:fs'),path=require('node:path');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const input=process.argv[2],out=process.argv[3];
if(!input||!out)throw Error('source and temp output required');
const raw=fs.readFileSync(input),doc=core.parse(raw),head=doc.lines.slice(0,4);
fs.mkdirSync(out,{recursive:true});
function emit(name,body,extra={}){
 const marker='JO9_QA_INSOLVENCY_'+name.replaceAll('-','_')+'_COMPLETE';
 const worlds={Start:body+"\r\nmsg '"+marker+"'",...extra};
 const header=[...head]; header[3]=core.shift(String(Object.keys(worlds).length),-5);
 const lines=[...header];
 for(const[n,b]of Object.entries(worlds))lines.push(core.shift(n,-5),'',core.shift(b,-5),core.shift('0',-5));
 lines.push('');const bytes=Buffer.from(lines.join('\r\n'),'utf16le');core.parse(bytes);
 const file=path.join(out,name+'.qsp');fs.writeFileSync(file,bytes);
 return{name,file,marker,checkpoint:'Installed native engine, exact location presence'};
}
const actual={};for(const n of ['jo9_liquidation','jo9_liquidation_assets','jo9_liquidation_sale']){
 const l=doc.locations.find(l=>l.name===n); if(l)actual[n]=core.shift(doc.lines[l.body],5);
}
const plan=[emit('control',"if loc('QA_CONTROL') ! 1: msg 'JO9_QA_ASSERT_CONTROL_LOC' & exit",{QA_CONTROL:'exit'}),
 emit('required-entry',"gs 'jo9_liquidation','begin'",actual),
 emit('required-assets',"gs 'jo9_liquidation_assets','quote'",actual)];
fs.writeFileSync(path.join(out,'red-plan.json'),JSON.stringify(plan,null,2));
fs.writeFileSync(path.join(out,'red-manifest.json'),JSON.stringify({source:input,sha256:core.hash(raw),test:'Feature presence red; behavior tests follow candidate module availability',copiedBodies:Object.keys(actual)},null,2));
console.log(JSON.stringify({out,sourceHash:core.hash(raw),probes:plan.length}));
