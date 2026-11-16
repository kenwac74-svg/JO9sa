import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const file=fileURLToPath(new URL('../overrides/studio-look.mjs',import.meta.url));
async function editor(){
 let source=await fs.readFile(file,'utf8');
 source=source.replace("'./sim-data.mjs'",JSON.stringify('data:text/javascript;base64,'+Buffer.from('export const esc=s=>String(s??"");').toString('base64'))).replace("'./studio-look-geometry.mjs'",JSON.stringify(new URL('../overrides/studio-look-geometry.mjs',import.meta.url).href));
 const {createLookEditor}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 globalThis.Image=class {naturalWidth=795;naturalHeight=596;set src(v){this.trace=v;queueMicrotask(()=>this.onload());}};
 const makeCanvas=()=>{const canvas={width:795,height:596,trace:[]},context=new Proxy({drawImage(im){canvas.trace.push(im.trace);},getImageData(){return {data:new Uint8ClampedArray(canvas.width*canvas.height*4).fill(255)};}},{get:(o,k)=>o[k]||(()=>{})});canvas.getContext=()=>context;canvas.toDataURL=()=> 'data:image/png;base64,'+Buffer.from(JSON.stringify({width:canvas.width,height:canvas.height,trace:canvas.trace})).toString('base64');canvas.focus=()=>{};return canvas;};
 globalThis.document={createElement:()=>makeCanvas(),activeElement:null};
 const handlers={},cv=makeCanvas(),root={addEventListener:(k,v)=>handlers[k]=v,querySelector:s=>s==='[data-lk-canvas]'?cv:null,querySelectorAll:()=>[]};let request;
 const ed=createLookEditor({toast:m=>{throw Error(m);},call:async(url,body)=>{request=body;return {files:[],warnings:[],sharedWith:[]};},onSaved:()=>{}});
 const slots=Object.fromEntries(['base','title','maid','secr','dom'].map(k=>[k,{label:k,url:'/'+k,reference:k}]));
 ed.reset({id:1,slots,faces:{},sharedWith:[]});ed.bind(root,()=>{});
 const click=async dataset=>handlers.click({target:{closest:()=>({dataset})},shiftKey:false});
 return {ed,click,request:()=>request};
}
test('all outfit tabs expose portrait selection and crop the chosen outfit without rewriting its full image',async()=>{
 for(const name of ['base','title','maid','secr','dom']){
  const x=await editor();await x.click({lkSlot:name});await x.click({lkAct:'existing'});
  assert(x.ed.html().includes('data-lk-facefile'),name+' should allow a portrait file');
  await x.click({lkAct:'face-mode'});assert(x.ed.html().includes('얼굴 상자 편집 중'),name);
  await x.click({lkAct:'preview'});const p=x.request();assert.deepEqual(p.slots,{});
  assert.equal(p.face.mode,'file');const png=JSON.parse(Buffer.from(p.face.src.split(',')[1],'base64'));assert.equal(png.width,151);assert.equal(png.height,150);assert(JSON.stringify(png.trace).includes('/'+name));assert(JSON.stringify(png.trace).includes('0001_black_long_loli.png'),'default game border must be composed');
 }
});
test('switching tabs keeps the selected portrait source',async()=>{
 const x=await editor();await x.click({lkSlot:'maid'});await x.click({lkAct:'existing'});await x.click({lkAct:'face-mode'});await x.click({lkSlot:'title'});await x.click({lkAct:'preview'});
 assert.equal(x.request().face.mode,'file');assert(Buffer.from(x.request().face.src.split(',')[1],'base64').toString().includes('/maid'));
});
