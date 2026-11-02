'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('assert/strict'),zlib=require('zlib');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const rec=__dirname,tmp='G:/Codex/tmp/jo9-julia-images-tests-20261028',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const baseline='3fbdb2cca0e3eb2d4a70c2f9b442f2fb39bb756f1aefe6217cf8c10668f1106c';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)),quote=s=>"'"+s.replaceAll("'","''")+"'";
function get(d,n){const l=d.locations.find(x=>x.name===n);assert(l,n);return c.shift(d.lines[l.body],5).replace(/\r\n/g,'\n');}
function set(d,n,s){const l=d.locations.find(x=>x.name===n);assert(l,n);d.lines[l.body]=c.shift(s.replace(/\r?\n/g,'\r\n'),-5);}
function load(){const input=process.env.JO9_JULIA_TEST_BASELINE||game+'/jack.qsp',bytes=fs.readFileSync(input),raw=/\.gz$/i.test(input)?zlib.gunzipSync(bytes):bytes;assert.equal(c.hash(raw),baseline);return {raw,d:c.parse(raw)};}
function candidate(patchPath){const {raw,d}=load(),patch=read(patchPath);assert.equal(patch.before_sha256,baseline);
 for(const e of patch.edits||[]){assert.equal(e.field,'body');const l=d.locations.find(x=>x.name===e.location);assert(l);const body=c.shift(d.lines[l.body],5);assert.equal(body.split(e.old).length-1,e.count??1,e.location);d.lines[l.body]=c.shift(body.split(e.old).join(e.new),-5);}
 for(const l of patch.add_locations||[]){assert(!(l.actions||[]).length);assert(!d.locations.some(x=>x.name===l.name));d.lines.splice(-1,0,c.shift(l.name,-5),c.shift(l.desc||'',-5),c.shift(l.body.replace(/\r?\n/g,'\r\n'),-5),c.shift('0',-5));}
 if((patch.add_locations||[]).length)d.lines[3]=c.shift(String(d.locations.length+patch.add_locations.length),-5);const bytes=c.serialize(d);assert.equal(c.hash(bytes),patch.after_sha256);return {raw,bytes,d:c.parse(bytes),patch};}
function meeting(d){const text=get(d,'interaction_city'),a=text.indexOf('if interaction_city = 163:'),b=text.indexOf('\n!Arena',a);assert(a>0&&b>a);return text.slice(a,b);}
function run(d,name,code){
 const liveBefore=c.hash(fs.readFileSync(game+'/jack.qsp'));
 fs.mkdirSync(tmp,{recursive:true});set(d,'Start',"usehtml=1\n$onnewloc=''\n$counter=''\n"+code+`\nmsg 'JO9_QA_JULIA_${name.replaceAll('-','_')}_COMPLETE'\n`);
 const file=tmp+'/'+name+'.qsp';fs.writeFileSync(file,c.serialize(d));write(tmp+'/'+name+'-plan.json',[{name,file,marker:`JO9_QA_JULIA_${name.replaceAll('-','_')}_COMPLETE`,checkpoint:'Actual reunion event actions with synthetic actors and generation call counter'}]);fs.writeFileSync(tmp+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','G:/somi/JO9sa/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',tmp+'/'+name+'-plan.json','-TimeoutSeconds','20'],{encoding:'utf8',windowsHide:true,timeout:30000});const results=read(tmp+'/client-results.json'),log=fs.readFileSync(tmp+'/'+name+'-stderr.log','utf8');fs.writeFileSync(rec+'/'+name+'.log',log);assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),liveBefore);return {engineExit:r.status,results,log};
}
const previous=require('../../auction-consignment-fix-20261028/tests/harness.cjs');
module.exports={fs,path,cp,assert,c,sc,rec,tmp,game,baseline,read,write,quote,get,set,load,candidate,meeting,run,actor:previous.actor,init:previous.init,roleView:previous.roleView};
