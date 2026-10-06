const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),os=require('os'),path=require('path');
const {create}=require('./grok-prompt.cjs');
const protect=(x,reverse)=>reverse?x.slice(7):'sealed:'+x;
test('large model catalog is fetched in bounded pages, not one truncated response',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jo9-pages-'));const offsets=[];
 const g=create(dir,{protect,fetch:async url=>{const u=new URL(url),offset=+u.searchParams.get('offset');assert.equal(u.searchParams.get('limit'),'50');offsets.push(offset);const count=offset===0?50:2;return{ok:true,status:200,json:async()=>({data:Array.from({length:count},(_,i)=>({id:'vendor/model-'+(offset+i),architecture:{input_modalities:['text'],output_modalities:['text']}})),links:{next:offset===0?'next':null}})};}});
 try{assert.equal((await g.models()).length,52);assert.deepEqual(offsets,[0,50]);await g.models();assert.equal(offsets.length,2);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('model settings remain independent after restart; key reuse does not copy model',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jo9-models-'));
 try{const catalog=create(dir,{protect});catalog.settings({model:'vendor/image',apiKey:'test-key'});const dialogue=create(dir,{protect,kind:'dialogue'});assert.equal(dialogue.state().model,'');assert.equal(dialogue.state().keyConfigured,true);dialogue.settings({model:'other/text'});assert.equal(catalog.state().model,'vendor/image');assert.equal(create(dir,{protect}).state().model,'vendor/image');assert.equal(create(dir,{protect,kind:'dialogue'}).state().model,'other/text');}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('all text output models are searchable; text-only model never receives image data',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jo9-models-')),image=path.join(dir,'test.png');fs.writeFileSync(image,Buffer.from('89504e470d0a1a0a','hex'));let sent;
 const g=create(dir,{protect,fetch:async(url,init)=>({ok:true,status:200,json:async()=>url.includes('/models?')?{data:[{id:'vendor/image',name:'Vision',architecture:{input_modalities:['text','image'],output_modalities:['text']}},{id:'other/text',name:'Text',architecture:{input_modalities:['text'],output_modalities:['text']}},{id:'vendor/generator',architecture:{input_modalities:['text'],output_modalities:['image']}}]}:(sent=JSON.parse(init.body),{choices:[{message:{content:'reply'}}]})})});
 try{g.settings({model:'other/text',apiKey:'test-key'});assert.deepEqual((await g.models()).map(x=>x.id),['other/text','vendor/image']);const r=await g.chat(image,'test',{message:'Describe using my supplied notes'});assert.equal(sent.model,'other/text');assert.equal(sent.messages[1].content.length,1);assert(!JSON.stringify(sent).includes('data:image'));assert.equal(r.imageSent,false);assert.match(r.notice,/텍스트 전용/);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
