const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {create}=require('./grok-prompt.cjs');
function fixture(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jo9-grok-')),image=path.join(dir,'test.png');fs.writeFileSync(image,Buffer.from('89504e470d0a1a0a','hex'));return{dir,image,clean:()=>fs.rmSync(dir,{recursive:true,force:true})};}
const protect=(x,reverse)=>reverse?x.slice(7):'sealed:'+x;
test('only manual chat invokes completion; image, command and follow-up preserved; keys never in public settings',async()=>{
  const f=fixture(),calls=[];
  const g=create(f.dir,{protect,fetch:async(url,init)=>{calls.push({url,init});return{ok:true,status:200,json:async()=>url.includes('/models?')?{data:[{id:'x-ai/grok-test',name:'Grok Test',architecture:{input_modalities:['text','image'],output_modalities:['text']}},{id:'x-ai/grok-code',architecture:{input_modalities:['text'],output_modalities:['text']}}]}:{choices:[{message:{content:'POSITIVE: preserve details'}}],usage:{total_tokens:70}}};}});
  try{
    assert.deepEqual(g.settings({model:'x-ai/grok-test',apiKey:'dummy-test-secret'}),{model:'x-ai/grok-test',keyConfigured:true,provider:'openrouter',aiId:'',openrouterKeyConfigured:true,kindroidKeyConfigured:false});assert.equal(calls.length,0);
    assert(!JSON.stringify(g.state()).includes('dummy-test-secret'));assert(!fs.readFileSync(path.join(f.dir,'grok-settings.json'),'utf8').includes('"apiKey"'));
    assert.equal((await g.models()).length,2);
    const first=await g.chat(f.image,'content/pic/bg/test.png',{message:'Make SDXL prompt, preserve hat',reset:true});assert.equal(first.reply,'POSITIVE: preserve details');
    let sent=JSON.parse(calls.at(-1).init.body);assert.equal(sent.messages.at(-1).content,'Make SDXL prompt, preserve hat');assert(sent.messages[1].content[1].image_url.url.startsWith('data:image/png;base64,'));
    await g.chat(f.image,'content/pic/bg/test.png',{message:'Lower saturation'});sent=JSON.parse(calls.at(-1).init.body);assert.equal(sent.messages[2].content,'Make SDXL prompt, preserve hat');assert.equal(sent.messages[3].role,'assistant');
    await g.chat(f.image,'content/pic/bg/test.png',{message:'New instructions',reset:true});assert.equal(JSON.parse(calls.at(-1).init.body).messages.length,3);
    const restored=create(f.dir,{protect});assert.equal(restored.state().keyConfigured,true);
    g.settings({model:'x-ai/grok-test',clearKey:true});assert.equal(g.state().keyConfigured,false);await assert.rejects(g.chat(f.image,'x',{message:'test'}),/API 키/);
  }finally{f.clean();}
});
test('network failures, unauthorized models and malformed settings do not disclose secrets or save chat',async()=>{
  const f=fixture();let fail=true,posted=[];
  const g=create(f.dir,{protect,fetch:async(url,init)=>{if(url.includes('/models?'))return{ok:true,json:async()=>({data:[{id:'x-ai/grok-test',architecture:{input_modalities:['image'],output_modalities:['text']}}]})};posted.push(JSON.parse(init.body));return{ok:!fail,status:fail?401:200,json:async()=>fail?{error:{message:'dummy-test-secret'}}:{choices:[{message:{content:'ok'}}]}};}});
  try{assert.throws(()=>g.settings({model:'invalid id',apiKey:'a'}),/OpenRouter/);g.settings({model:'x-ai/grok-test',apiKey:'dummy-test-secret'});await assert.rejects(g.chat(f.image,'a',{message:'first'}),e=>!e.message.includes('dummy-test-secret')&&/API 키/.test(e.message));fail=false;await g.chat(f.image,'a',{message:'retry'});assert.equal(posted.at(-1).messages.length,3);g.settings({model:'x-ai/grok-missing'});await assert.rejects(g.chat(f.image,'a',{message:'test'}),/목록/);}finally{f.clean();}
});
test('Windows DPAPI persists a dummy key without plaintext', {skip:process.platform!=='win32'},()=>{
  const f=fixture();try{const g=create(f.dir);g.settings({model:'x-ai/grok-test',apiKey:'jo9-DUMMY-only'});assert(!fs.readFileSync(path.join(f.dir,'grok-settings.json'),'utf8').includes('jo9-DUMMY-only'));assert.equal(create(f.dir).state().keyConfigured,true);}finally{f.clean();}
});
test('blank command requests SDXL extraction with established defaults; custom command still works',async()=>{
  const f=fixture();let sent;
  const g=create(f.dir,{protect,fetch:async(url,init)=>({ok:true,status:200,json:async()=>url.includes('/models?')?{data:[{id:'x-ai/grok-test',architecture:{input_modalities:['image'],output_modalities:['text']}}]}:(sent=JSON.parse(init.body),{choices:[{message:{content:'test response'}}]})})});
  try{
    g.settings({model:'x-ai/grok-test',apiKey:'dummy'});
    await g.chat(f.image,'test',{message:'   '});
    const command=sent.messages.at(-1).content;
    assert.equal(command,'Extract an SDXL prompt from the attached image.');assert.doesNotMatch(JSON.stringify(sent.messages),/elf ears|human ears|fantasy video game CG|painterly shading|Preserve reference/);
    await g.chat(f.image,'test',{message:'Keep the background empty'});
    assert.equal(sent.messages.at(-1).content,'Keep the background empty');
    assert.match(sent.messages[0].content,/Do not describe, name, copy, or infer the original image art style/);
    assert.match(sent.messages[0].content,/SDXL/);assert.doesNotMatch(sent.messages[0].content,/ears|fantasy|painterly|Preserve/);
  }finally{f.clean();}
});
