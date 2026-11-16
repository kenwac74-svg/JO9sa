const fs=require('fs'),http=require('http'),assert=require('assert/strict');
const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const source='G:/somi/JO9sa/tools/image-workshop/place/JO9_Place_Workshop.html',out='G:/Codex/tmp/jo9-workshop-batch-frame-20261111';
(async()=>{
 fs.mkdirSync(out,{recursive:true});if(!fs.existsSync(out+'/catalog_editor.js'))require('child_process').execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','G:/somi/JO9sa/tools/imgmg/make_catalog_editor.ps1','-Workshop',source,'-Out',out+'/catalog_editor.js'],{windowsHide:true});
 const server=http.createServer((req,res)=>{if(req.url==='/'){res.setHeader('Content-Type','text/html;charset=utf-8');res.end(fs.readFileSync(source));}else if(req.url==='/catalog'){res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<!doctype html><title>Catalog fixture</title><button id="open" onclick="window.JO9WS.open([])">교체기 열기</button><script>window.JO9PIC={state:{ready:false,busy:false,message:"fixture"},subscribe(fn){fn(this.state)},connect(){}};</script><script src="/catalog_editor.js"></script>');}else if(req.url==='/catalog_editor.js'){res.setHeader('Content-Type','application/javascript');res.end(fs.readFileSync(out+'/catalog_editor.js'));}else{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({status:'fixture',resources:[],files:[]}));}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>window.JO9Workshop?.screen.status==='fixture');
  assert.equal(await page.locator('#batchframe').count(),1);
  await page.evaluate(async()=>{
   const W=window.JO9Workshop,c=document.createElement('canvas');c.width=150;c.height=150;const x=c.getContext('2d');x.fillStyle='#286080';x.fillRect(0,0,150,150);const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png')),bytes=await blob.arrayBuffer(),file=new File([blob],'input.png',{type:'image/png'});
   const input={id:'one',file,relative:'input.png',mappedPath:'content/pic/girls/face/a.png',url:URL.createObjectURL(file),faceCrop:{x:0,y:0,w:1,h:1}};
   W.state.inputs=[input];W.state.root={};W.state.rows=[{id:'row-one',inputId:'one',file,relative:'input.png',target:'girls/face/a.png',selected:true,meta:{width:150,height:150,path:'girls/face/a.png',kind:'portrait',bytes},options:{fit:'stretch',zoom:1,x:0,y:0},error:''},{id:'row-off',inputId:'one',file,target:'girls/face/off.png',selected:false,meta:{width:150,height:150,path:'girls/face/off.png',kind:'portrait',bytes},options:{fit:'stretch',zoom:1},error:''}];W.render();
  });
  await page.locator('#batchframe').click();await page.waitForFunction(()=>!window.JO9Workshop.state.busy&&!!window.JO9Workshop.state.rows[0].output);
  const replacement=await page.evaluate(()=>({selected:window.JO9Workshop.state.rows[0].output.byteLength,unselected:!!window.JO9Workshop.state.rows[1].output,message:document.getElementById('message').textContent,perCardFrameButtons:[...document.querySelectorAll('.targetcard button')].filter(e=>e.textContent.includes('테두리')).length}));
  assert(replacement.selected>0);assert.equal(replacement.unselected,false);assert.equal(replacement.perCardFrameButtons,0);
  // A second clean fixture exercises the top-level selection without any replacement input.
  await page.reload();await page.waitForFunction(()=>window.JO9Workshop?.screen.status==='fixture');
  await page.evaluate(async()=>{
   const W=window.JO9Workshop,c=document.createElement('canvas');c.width=59;c.height=66;const x=c.getContext('2d');x.fillStyle='#246080';x.fillRect(0,0,59,66);const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));
   let writes=0;const root={async getDirectoryHandle(){return root;},async getFileHandle(){return{async getFile(){return new File([blob],'test.png',{type:'image/png'});},async createWritable(){writes++;throw Error('Must not write before Apply');}};}};
   window.__frameWrites=()=>writes;W.state.root=root;W.screen.status='ready';W.screen.resources=[{path:'content/pic/ui/legacy_overhaul/test.png',file:'test.png',width:59,height:66,bytes:blob.size,folder:'ui'}];await W.refreshLaunch();
  });
  await page.locator('#showAllImages').check();await page.locator('[data-action="screen-select"]').check();await page.locator('#batchframe').click();await page.waitForFunction(()=>!window.JO9Workshop.state.busy&&window.JO9Workshop.state.rows.length===1&&!!window.JO9Workshop.state.rows[0].output);
  const originals=await page.evaluate(()=>({rows:window.JO9Workshop.state.rows.length,frameOnly:window.JO9Workshop.state.rows[0].options.frameOnly,path:window.JO9Workshop.state.rows[0].target,writes:window.__frameWrites(),message:document.getElementById('message').textContent,buttons:document.querySelectorAll('#batchframe').length}));
  assert.equal(originals.rows,1);assert.equal(originals.frameOnly,true);assert.equal(originals.writes,0);assert.equal(originals.buttons,1);assert.equal(originals.path,'ui/legacy_overhaul/test.png');
  assert.deepEqual(errors,[]);fs.mkdirSync(out,{recursive:true});await page.screenshot({path:out+'/batch-frame-ui.png',fullPage:true});
  await page.goto('http://127.0.0.1:'+server.address().port+'/catalog');await page.locator('#open').click();assert.equal(await page.locator('#batchframe').count(),1);assert(await page.locator('#batchframe').isVisible());
  await page.evaluate(()=>{const W=window.JO9Workshop,file=new File(['fixture'],'demo.png',{type:'image/png'});W.state.root={};W.state.inputs=[{id:'demo',file,url:'',mappedPath:'content/pic/girls/face/demo.png'}];W.state.rows=[{id:'demo-row',inputId:'demo',file,target:'girls/face/demo.png',selected:true,options:{},meta:{width:150,height:150,kind:'portrait'},error:''}];W.render();});
  assert.equal(await page.locator('option[value="__new_path__"]').count(),1);assert(await page.locator('#batchframe').isEnabled());assert.deepEqual(errors,[]);
  await page.screenshot({path:out+'/catalog-batch-frame-ui.png',fullPage:true});fs.writeFileSync(out+'/browser-results.json',JSON.stringify({pass:true,replacement,originals,catalog:{oneBatchButton:true,newPathOptionRetained:true,batchEnabledForSelection:true},pageErrors:errors},null,2));console.log('PASS real browser: one batch button, selected rows only, original-only staging, generated catalog/new-path option and no file writes before Apply');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
