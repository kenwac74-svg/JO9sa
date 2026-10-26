'use strict';
const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const root='G:/Codex/tmp/profile-polish-20261025-r3',base=c.parse(fs.readFileSync('G:/somi/JO9_work_backups/profile-polish-20261025-r3/jack.qsp')),next=c.parse(fs.readFileSync(root+'/candidate.qsp'));
const fields=[];for(const l of base.locations){const n=next.locations.find(v=>v.name===l.name);for(const field of ['body','desc']){const old=c.shift(base.lines[l[field]],5),value=c.shift(next.lines[n[field]],5);if(old!==value)fields.push({location:l.name,field,old,new:value});}}
const payload={id:'2026-10-25_profile_polish_r3',before_sha256:base.hash,after_sha256:next.hash,fields};
fs.writeFileSync(root+'/fields-for-diff.json',JSON.stringify(payload));
const result=cp.spawnSync('C:/Users/User/AppData/Local/Programs/Python/Python314/python.exe',[__dirname+'/compact-patch.py',root+'/fields-for-diff.json',root+'/mods/2026-10-25_profile_polish_r3.json'],{encoding:'utf8',windowsHide:true,timeout:180000,maxBuffer:1024*1024});assert.equal(result.status,0,result.stderr);console.log(result.stdout);
const patch=JSON.parse(fs.readFileSync(root+'/mods/2026-10-25_profile_polish_r3.json'));
for(const phase of [1,2])for(const e of patch.edits){const l=base.locations.find(v=>v.name===e.location),at=l[e.field],text=c.shift(base.lines[at],5),nOld=text.split(e.old).length-1,nNew=text.split(e.new).length-1;
 if(nNew===1&&(nOld===0||e.new.includes(e.old)))continue;
 assert.equal(phase,1,'Reapplication would modify '+e.location);assert.equal(nOld,1,'Exact old fragment '+e.location);base.lines[at]=c.shift(text.replace(e.old,()=>e.new),-5);
}assert.equal(c.hash(c.serialize(base)),next.hash);
fs.copyFileSync(root+'/mods/2026-10-25_profile_polish_r3.json',__dirname+'/patch.json');
const meta=JSON.parse(fs.readFileSync(__dirname+'/candidate.json'));meta.edits=patch.edits.length;fs.writeFileSync(__dirname+'/candidate.json',JSON.stringify(meta,null,2));
console.log(JSON.stringify({replay:true,idempotent:true,hash:next.hash}));
