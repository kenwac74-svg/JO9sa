import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {startService,publicSettings,mergeSettings} from '../hub-server.mjs';
const toolRoot=fileURLToPath(new URL('../',import.meta.url));

test('public configuration omits credentials and accepts identifier zero',()=>{
 const view=publicSettings({sourceFolder:'example',sourceId:0,target:{id:0,apiKey:'private-test-value'},openrouter:{apiKey:'private-test-value',model:'example'}});
 assert.equal(view.targetId,'0');assert.equal(view.configured,true);assert(!JSON.stringify(view).includes('private-test-value'));
});

test('setup retains original private configuration and accepts named identifiers',async()=>{
 const input={sourceFolder:toolRoot,sourceId:'named_source',targetId:'새캐릭터',model:'example'};
 const original={openrouter:{apiKey:'test-only-value',concurrency:3},target:{includeAppearance:false}};
 const result=await mergeSettings(original,input);assert.equal(result.openrouter.apiKey,'test-only-value');assert.equal(result.target.id,'새캐릭터');assert.equal(result.target.includeAppearance,false);
 await assert.rejects(()=>mergeSettings(original,{...input,targetId:'../invalid'}));
});

test('local worksheet setup/proxy/reload works without analysis or external API requests',async()=>{
 process.env.OPENROUTER_API_KEY='test-only-unused';process.env.MAGE_API_KEY='test-only-unused';
 const parent=process.env.JONT_TEST_TMP||path.join(os.tmpdir(),'jont-remake-tests');await fs.mkdir(parent,{recursive:true});const root=await fs.mkdtemp(parent+'/probe-');
 const source=path.join(root,'empty-images');await fs.mkdir(source);const sourceId='probe_'+crypto.randomBytes(4).toString('hex'),targetId='target_probe';
 const service=await startService({port:0,configFile:path.join(root,'config.json'),runtime:path.join(root,'runtime')});
 try{
  const get=async p=>(await fetch(service.url+p)).json();
  const initial=await get('api/hub/settings');assert.equal(initial.configured,false);assert.equal((await get('api/hub/status')).nativePid,null);
  const home=await(await fetch(service.url+'?workspace=1')).text();assert(home.includes('remakeSetup'));assert(!home.includes('test-only-unused'));
  const cross=await fetch(service.url+'api/hub/settings',{method:'POST',headers:{Origin:'https://invalid.example','Content-Type':'application/json'},body:'{}'});assert.equal(cross.status,403);
  const apply=await fetch(service.url+'api/hub/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sourceFolder:source,sourceId,targetId,mageMention:'',model:'example-model'})});
  assert.equal(apply.status,200,await apply.clone().text());
  const native=await get('api/hub/status');assert(native.nativePid>0);
  const worksheet=await(await fetch(service.url+'?workspace=1')).text();assert(worksheet.includes('data-tab="scenes"'));assert(worksheet.includes('data-tab="samples"'));assert(worksheet.includes('/*__DATA__*/')===false);assert(!worksheet.includes('test-only-unused'));
  const reload=await fetch(service.url+'api/hub/reload',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(reload.status,200);assert.notEqual((await get('api/hub/status')).nativePid,native.nativePid);
  const library=await get('api/library');assert(Array.isArray(library.items));
 }finally{
  await service.close();
  const generated=path.resolve(toolRoot,'work',sourceId+'_to_'+targetId);assert(generated.startsWith(path.resolve(toolRoot,'work')+path.sep));
  try{await fs.rmdir(generated);}catch(e){if(e.code!=='ENOENT')throw e;}
 }
});
