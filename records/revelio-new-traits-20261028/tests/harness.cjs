'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const rec=__dirname,tmp='G:/Codex/tmp/jo9-revelio-traits-tests-20261028',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const baseline='972d1b7a8719c9b44e6aca4bfaf5a6f73908240762ce65061a7d298d0aa82679';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)),quote=s=>"'"+s.replaceAll("'","''")+"'";
function get(d,n){const l=d.locations.find(x=>x.name===n);assert(l,n);return c.shift(d.lines[l.body],5).replace(/\r\n/g,'\n');}
function set(d,n,s){const l=d.locations.find(x=>x.name===n);assert(l,n);d.lines[l.body]=c.shift(s.replace(/\r?\n/g,'\r\n'),-5);}
function load(){const raw=fs.readFileSync(game+'/jack.qsp');assert.equal(c.hash(raw),baseline);return {raw,d:c.parse(raw)};}
function candidate(patchPath=path.dirname(rec)+'/2026-10-28_revelio_new_traits.json'){
 const {raw,d}=load(),patch=read(patchPath);assert.equal(patch.before_sha256,baseline);assert.equal(patch.edits.length,7);assert(!patch.add_locations?.length);
 for(const e of patch.edits){assert.equal(e.location,'jo9_traits');assert.equal(e.field,'body');const l=d.locations.find(x=>x.name===e.location),body=c.shift(d.lines[l.body],5);assert.equal(body.split(e.old).length-1,e.count);d.lines[l.body]=c.shift(body.split(e.old).join(e.new),-5);}
 const bytes=c.serialize(d);assert.equal(c.hash(bytes),patch.after_sha256);const parsed=c.parse(bytes);assert.equal(parsed.locations.length,c.parse(raw).locations.length);return {raw,bytes,d:parsed,patch};
}
function run(d,name,code){
 fs.mkdirSync(tmp,{recursive:true});set(d,'Start',"usehtml=1\n$onnewloc=''\n$counter=''\n"+code+`\nmsg 'JO9_QA_REVELIO_${name.replaceAll('-','_')}_COMPLETE'\n`);
 const file=tmp+'/'+name+'.qsp';fs.writeFileSync(file,c.serialize(d));write(tmp+'/'+name+'-plan.json',[{name,file,marker:`JO9_QA_REVELIO_${name.replaceAll('-','_')}_COMPLETE`,checkpoint:'Actual compiled trait list with isolated synthetic actors'}]);
 fs.writeFileSync(tmp+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','G:/somi/JO9sa/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',tmp+'/'+name+'-plan.json','-TimeoutSeconds','15'],{encoding:'utf8',windowsHide:true,timeout:24000});
 const results=read(tmp+'/client-results.json'),log=fs.readFileSync(tmp+'/'+name+'-stderr.log','utf8');fs.writeFileSync(rec+'/'+name+'.log',log);assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),baseline);return {engineExit:r.status,results,log};
}
const previous=require('../../auction-consignment-fix-20261028/tests/harness.cjs');
module.exports={fs,path,cp,assert,c,sc,rec,tmp,game,baseline,read,write,quote,get,set,load,candidate,run,actor:previous.actor,init:previous.init,roleView:previous.roleView};
