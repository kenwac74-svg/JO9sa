'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),z=require('zlib'),vm=require('vm');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/dialogue-range-20261108',O=R+'/records/dialogue-range-20261108',c=require(R+'/tools/text-workshop/core.cjs');
const baselines=JSON.parse(fs.readFileSync(T+'/baselines.json','utf8')),hash=p=>c.hash(fs.readFileSync(p));
const names=['server.cjs','scenes.cjs','script-export.cjs','script-export.js','index.html','script-range.cjs','script-range.js','script-range.test.cjs'];
for(const name of names){
 const candidate=T+'/text-workshop/'+name;if(/\.c?js$/.test(name))new vm.Script(fs.readFileSync(candidate,'utf8'));
 if(name==='index.html')for(const s of fs.readFileSync(candidate,'utf8').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/\bsrc=/.test(s[1]))new vm.Script(s[2]);
 if(baselines[name])for(const root of [R+'/tools/text-workshop',G+'/modtools/text-workshop'])a.equal(hash(root+'/'+name),baselines[name],root+'/'+name+' changed');
}
fs.mkdirSync(O+'/before',{recursive:true});const files=[];
for(const name of names)for(const root of [R+'/tools/text-workshop',G+'/modtools/text-workshop']){
 if(root.startsWith(G)&&name.endsWith('.test.cjs'))continue;
 const file=root+'/'+name,exists=fs.existsSync(file);let before=null;
 if(exists){const raw=fs.readFileSync(file);before=c.hash(raw);const backup=O+'/before/'+before+'.gz';if(!fs.existsSync(backup))fs.writeFileSync(backup,z.gzipSync(raw,{level:9}));a(z.gunzipSync(fs.readFileSync(backup)).equals(raw));}
 fs.copyFileSync(T+'/text-workshop/'+name,file);files.push({file,before,after:hash(file)});
}
const protectedFiles=[G+'/jack.qsp',G+'/modtools/catalog/catalog_status.js'];
const protectedHashes=Object.fromEntries(protectedFiles.map(f=>[f,hash(f)]));
fs.writeFileSync(O+'/installation.json',JSON.stringify({files,protectedHashes,tests:13},null,2)+'\n');
for(const name of ['prepare.cjs','install.cjs'])fs.copyFileSync(__dirname+'/'+name,O+'/'+name);
console.log(JSON.stringify({installed:files.length,protectedHashes}));
