'use strict';
const fs=require('fs'),assert=require('assert/strict'),vm=require('vm'),test=require('node:test');
const html=process.env.JO9_FRAME_HTML||'G:/somi/JO9sa/tools/image-workshop/place/JO9_Place_Workshop.html';
const source=()=>[...fs.readFileSync(html,'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)][1][1];
test('frame pixels preserve the interior and copy opaque and transparent outer template pixels',()=>{
 const context={window:{}};vm.createContext(context);vm.runInContext(source(),context);const C=context.window.JO9Core;
 assert.equal(typeof C.copyFramePixels,'function');
 const base=new Uint8ClampedArray([10,20,30,255,40,50,60,128,70,80,90,255]);
 const frame=new Uint8ClampedArray([200,190,180,255,100,110,120,0,200,200,200,255]);
 const mask=new Uint8ClampedArray([0,0,0,0,0,0,0,0,0,0,0,255]);
 const out=C.copyFramePixels(base,frame,mask);
 assert.deepEqual(Array.from(out),[200,190,180,255,100,110,120,0,70,80,90,255]);
 assert.deepEqual(Array.from(base),[10,20,30,255,40,50,60,128,70,80,90,255]);
 assert.throws(()=>C.copyFramePixels(base,new Uint8Array(4),mask),/픽셀 규격/);
});
test('real canvases preserve center pixels, template alpha, original bytes and old frame behavior',async()=>{
 const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{const page=await browser.newPage();await page.setContent('<!doctype html><title>Frame test</title>');await page.addScriptTag({content:source()});
 const result=await page.evaluate(async()=>{
  const C=window.JO9Core,issues=[],check=(v,s)=>{if(!v)issues.push(s);};
  const blob=canvas=>new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  for(const [w,h]of [[59,66],[150,150],[151,150]]){
   const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');
   ctx.fillStyle='#123456';ctx.fillRect(0,0,w,h);ctx.fillStyle='#abcdef';ctx.fillRect(w/3,h/3,w/3,h/3);
   const input=await blob(canvas),bytes=await input.arrayBuffer(),copy=new Uint8Array(bytes.slice(0));
   const meta={width:w,height:h,path:w===59?'ui/legacy_overhaul/test.png':'girls/face/test.png',bytes};
   const plain=await C.raster(input,meta,{fit:'stretch',frame:false,zoom:1,gray:false});
   const framed=await C.raster(input,meta,{fit:'stretch',makeFrame:true,frame:true,zoom:1,gray:false});
   const before=new Uint8Array(plain.rgba),after=new Uint8Array(framed.rgba),mask=new Uint8Array(framed.mask);
   let changed=0;for(let i=0;i<after.length;i+=4){if(mask[i+3]===255)for(let k=0;k<4;k++)check(before[i+k]===after[i+k],`${w}:center:${i+k}`);else if(before[i]!==after[i]||before[i+3]!==after[i+3])changed++;}
   check(changed>0,w+':outer changes');check(copy.every((v,i)=>v===new Uint8Array(meta.bytes)[i]),w+':bytes unchanged');
   if(w===59)check(after[3]===0,'thumbnail transparent corner');
   const only=await C.raster(input,{...meta,path:meta.path.replace('.png','_gray.png'),bytes:undefined},{fit:'contain',frameOnly:true,makeFrame:true,frame:true,zoom:4,x:30,y:40,crop:{x:0,y:0,w:.1,h:.1},gray:true,brightness:.2});
   const onlyPixels=new Uint8Array(only.rgba);for(let i=0;i<onlyPixels.length;i+=4)if(mask[i+3]===255)for(let k=0;k<4;k++)check(onlyPixels[i+k]===before[i+k],w+':frameOnly ignores crop/filter/zoom and needs no original bytes');
   const gray=await C.raster(input,meta,{fit:'stretch',makeFrame:true,zoom:1,gray:true});
   const gp=new Uint8Array(gray.rgba);for(let i=0;i<gp.length;i+=4)if(mask[i+3]===0&&gp[i+3]>0)check(Math.abs(gp[i]-gp[i+1])<=1&&Math.abs(gp[i+1]-gp[i+2])<=1,w+':gray frame');
   const sepia=await C.raster(input,{...meta,path:meta.path.replace('.png','_sepia.png')},{fit:'stretch',makeFrame:true,frameOnly:true,zoom:1});
   const sp=new Uint8Array(sepia.rgba);let toned=0;for(let i=0;i<sp.length;i+=4)if(mask[i+3]===0&&sp[i+3]>0&&sp[i]!==after[i])toned++;check(toned>0,w+':sepia frame follows path');
   const old=await C.raster(input,meta,{fit:'cover',frame:true,zoom:1});
   const oldPixels=new Uint8Array(old.rgba),oldMask=new Uint8Array(old.mask);for(let i=0;i<oldPixels.length;i+=4)if(oldMask[i+3]===0)for(let k=0;k<4;k++)check(oldPixels[i+k]===before[i+k],w+':preserved original ring');
  }
  return{issues:issues.slice(0,15),count:issues.length};
 });assert.deepEqual(result,{issues:[],count:0});
 }finally{await browser.close();}
});
