'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',task='G:/Codex/tmp/shop-text-quest-20261026',stage=task+'/runtime',id='2026-10-26_shop_text_quest_ui';
const before='8b9cf39fe2327079b0823f6e474c93151538a512fa8738ed5f330749a0940db5';
const raw=fs.readFileSync(game+'/jack.qsp');assert.equal(c.hash(raw),before);assert(!fs.existsSync(stage));
const inputs=JSON.parse(fs.readFileSync(__dirname+'/inputs.json','utf8'));for(const x of inputs)assert.equal(c.hash(fs.readFileSync(x.path)),x.sha256,x.path);
const source=c.parse(raw),doc=c.parse(raw),edits=[];qa.inspectWorld(raw);assert(c.serialize(source).equals(raw));
const fragments=[...require('./UI-edits.cjs').buildUiEdits(source),...require('./text-edits.cjs').buildTextEdits(source),...require('./quest-edits.cjs').buildQuestEdits(source)];assert.equal(fragments.length,8);
const get=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),set=(d,n,s)=>{d.lines[d.locations.find(l=>l.name===n).body]=c.shift(s,-5);};
for(const [i,e]of fragments.entries()){
 assert.equal(e.count,1);const body=get(doc,e.location),old=e.old.replace(/(?:\r\n)+$/,''),next=e.new.replace(/(?:\r\n)+$/,'');
 assert.equal(body.split(old).length-1,1,e.location);const at=body.indexOf(old),prev=body.lastIndexOf('\r\n',at-1),start=prev<0?0:prev+2;
 let end=body.indexOf('\r\n',at+old.length);if(end<0)end=body.length;
 const context=body.slice(start,end),replacement=context.replace(old,()=>next),marker='SHOP_TEXT_20261026_'+String(i+1).padStart(3,'0');
 assert.equal(body.split(context).length-1,1,'Unique line context '+e.location);
 const value='! JO9 MOD START '+marker+' | '+id+'\r\n'+replacement+'\r\n! JO9 MOD END '+marker;
 set(doc,e.location,body.replace(context,()=>value));edits.push({location:e.location,field:'body',old:context,new:value,count:1});
}
const changed=new Set(edits.map(e=>doc.locations.find(l=>l.name===e.location).body));assert.equal(changed.size,8);
for(let i=0;i<doc.lines.length;i++)if(!changed.has(i))assert.equal(doc.lines[i],source.lines[i]);assert.equal(doc.locations.length,273);
const bytes=c.serialize(doc);qa.inspectWorld(bytes);assert(c.serialize(c.parse(bytes)).equals(bytes));const after=c.hash(bytes);
const replay=c.parse(raw);for(const e of edits){const b=get(replay,e.location);assert.equal(b.split(e.old).length-1,1);set(replay,e.location,b.replace(e.old,()=>e.new));}assert(c.serialize(replay).equals(bytes));
fs.mkdirSync(stage+'/content/js',{recursive:true});fs.mkdirSync(stage+'/css');
for(const e of fs.readdirSync(game+'/content',{withFileTypes:true})){if(e.name==='js')continue;const to=stage+'/content/'+e.name;if(e.isDirectory())fs.symlinkSync(game+'/content/'+e.name,to,'junction');else fs.copyFileSync(game+'/content/'+e.name,to);}
fs.cpSync(game+'/content/js',stage+'/content/js',{recursive:true});fs.cpSync(game+'/css',stage+'/css',{recursive:true});fs.cpSync(game+'/json',stage+'/json',{recursive:true});fs.symlinkSync(game+'/fonts',stage+'/fonts','junction');fs.copyFileSync(game+'/config.xml',stage+'/config.xml');
fs.writeFileSync(stage+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');fs.writeFileSync(stage+'/jack.qsp',bytes);
const assetFragments=JSON.parse(fs.readFileSync(__dirname+'/ui-asset-edits.json','utf8'));
assert(Array.isArray(assetFragments));assert.equal(assetFragments.length,13);const assets=new Map();
for(const e of assetFragments){assert(['json/menu_icon.json','css/base.css'].includes(e.path));if(!assets.has(e.path))assets.set(e.path,fs.readFileSync(game+'/'+e.path,'utf8'));const old=assets.get(e.path);assert.equal(old.split(e.old).length-1,1,e.path);assets.set(e.path,old.replace(e.old,()=>e.new));}
assets.set('content/js/jo9_word_wrap.js',fs.readFileSync(__dirname+'/jo9_word_wrap.js','utf8'));JSON.parse(assets.get('json/menu_icon.json').replace(/^\uFEFF/,''));new Function(assets.get('content/js/jo9_word_wrap.js'));
const runtime=[{path:'jack.qsp',before,after}];for(const [rel,text]of assets){fs.writeFileSync(stage+'/'+rel,text,'utf8');runtime.push({path:rel,before:c.hash(fs.readFileSync(game+'/'+rel)),after:c.hash(fs.readFileSync(stage+'/'+rel))});}
const patch={id,before_sha256:before,after_sha256:after,edits};fs.mkdirSync(task+'/mods');fs.writeFileSync(task+'/mods/'+id+'.json',JSON.stringify(patch,null,2)+'\n');fs.writeFileSync(__dirname+'/patch.json',JSON.stringify(patch,null,2)+'\n');
const manifest={status:'CANDIDATE_STATIC_REPLAY_PASS',id,game,task,stage,before,after,candidate:stage+'/jack.qsp',mods:task+'/mods',runtime,locations:edits.map(e=>e.location),fragments:edits.length,newLocations:0,newPersistentKeys:0,protectedInputs:inputs.length,checks:{structure:true,roundtrip:true,patchReplay:true,onlyApprovedBodiesChanged:true,assetJsonValid:true,assetJsParse:true},runtimeWritten:false};
fs.writeFileSync(__dirname+'/candidate.json',JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(manifest));
