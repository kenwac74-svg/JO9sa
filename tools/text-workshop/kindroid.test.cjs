const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),os=require('os'),path=require('path');
const {create}=require('./grok-prompt.cjs');
const protect=(v,rev)=>rev?v.slice(7):'sealed:'+v;
test('Kindroid dialogue provider keeps OpenRouter model and keys, restores securely, text API only',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jo9-kindroid-'));let calls=[];
 const opts={kind:'dialogue',protect,fetch:async(url,init)=>{calls.push({url,init});return{ok:true,status:200,text:async()=>'각색 완료'};}};
 try{const catalog=create(dir,{protect});catalog.settings({model:'vendor/image',apiKey:'catalog-dummy'});
 const g=create(dir,opts);g.settings({model:'vendor/text',apiKey:'router-dummy'});
 g.settings({provider:'kindroid',aiId:'Narrator_ID',apiKey:'kn_dummy'});
 assert.equal(calls.length,0);assert.equal(g.state().model,'vendor/text');
 const restored=create(dir,opts);assert.equal(restored.state().aiId,'Narrator_ID');assert.equal(restored.state().kindroidKeyConfigured,true);
 const r=await restored.chat('nonexistent.png','scene',{reference:'[상인]<br>10 스파크 <<$master_name>>',message:'풍부하게',reset:true});
 assert.equal(r.reply,'각색 완료');assert.equal(r.imageSent,false);assert.equal(calls.length,1);assert.equal(calls[0].url,'https://api.kindroid.ai/v1/send-message');
 const body=JSON.parse(calls[0].init.body);assert.deepEqual(Object.keys(body).sort(),['ai_id','message','stream']);assert.equal(body.ai_id,'Narrator_ID');assert.match(body.message,/10 스파크/);assert(!body.message.includes('data:image'));
 restored.settings({provider:'openrouter'});assert.equal(restored.state().keyConfigured,true);assert.equal(restored.state().model,'vendor/text');assert.equal(catalog.state().provider,'openrouter');
 assert(!JSON.stringify(restored.state()).includes('kn_dummy'));
 assert.throws(()=>catalog.settings({provider:'kindroid',aiId:'X'}),/서비스/);
 assert.throws(()=>restored.settings({provider:'kindroid',aiId:23}),/AI ID/);
 assert.throws(()=>restored.settings({provider:'kindroid',aiId:'X',apiKey:'wrong'}),/kn_/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('Kindroid authentication errors never expose credentials or call chat-break',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jo9-kindroid-'));let count=0;
 try{const g=create(dir,{kind:'dialogue',protect,fetch:async(url)=>{count++;assert(!url.includes('chat-break'));return{ok:false,status:401,text:async()=>'kn_private'};}});
 g.settings({provider:'kindroid',aiId:'X',apiKey:'kn_private'});
 await assert.rejects(g.chat(null,'x',{reference:'일반 대사'}),e=>/API 키/.test(e.message)&&!e.message.includes('kn_private'));assert.equal(count,1);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
