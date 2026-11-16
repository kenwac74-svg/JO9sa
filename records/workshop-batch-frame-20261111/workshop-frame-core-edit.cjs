'use strict';
const fs=require('fs'),assert=require('assert/strict'),path=require('path'),vm=require('vm');
const source='G:/somi/JO9sa/tools/image-workshop/place/JO9_Place_Workshop.html';
const backup='G:/somi/JO9_work_backups/workshop-batch-frame-20261111/JO9_Place_Workshop.before.html';
const raw=fs.readFileSync(source),html=raw.toString('utf8'),matches=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(matches.length,5);const m=matches[1],original=m[1];let code=original;
const templates=Object.fromEntries([['icon','button_template.png'],['portrait','mob template.png']].map(([k,n])=>[k,fs.readFileSync('G:/somi/JO9sa/tools/image-workshop/'+n).toString('base64')]));
const frameCode=`// JO9 MOD START WORKSHOP_BATCH_FRAME_CORE_20261111
 const FRAME_PNG=${JSON.stringify(templates)};
 function frameSpec(meta){if(!meta)return null;if(meta.width===59&&meta.height===66)return{x:5,y:8,w:49,h:51,r:3};if((meta.width===150||meta.width===151)&&meta.height===150)return{x:5,y:5,w:meta.width-10,h:140,r:0};return null}
 function frameBox(meta){return meta?.bytes?frameSpec(meta):null}
 function copyFramePixels(baseRGBA,frameRGBA,maskRGBA){
  const view=value=>ArrayBuffer.isView(value)?new Uint8ClampedArray(value.buffer,value.byteOffset,value.byteLength):new Uint8ClampedArray(value);
  const base=view(baseRGBA),frame=view(frameRGBA),mask=view(maskRGBA);
  if(!base.length||base.length%4||frame.length!==base.length||mask.length!==base.length)throw Error('테두리 픽셀 규격이 일치하지 않습니다.');
  const out=new Uint8ClampedArray(base);
  for(let i=0;i<out.length;i+=4){
   const inside=mask[i+3]/255;if(inside===1)continue;
   if(inside===0){out.set(frame.subarray(i,i+4),i);continue;}
   const sourceAlpha=base[i+3]/255*inside,frameAlpha=frame[i+3]/255*(1-inside),alpha=sourceAlpha+frameAlpha;
   for(let k=0;k<3;k++)out[i+k]=alpha?Math.round((base[i+k]*sourceAlpha+frame[i+k]*frameAlpha)/alpha):0;
   out[i+3]=Math.round(alpha*255);
  }
  return out;
 }
 function frameMask(w,h,box){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const context=canvas.getContext('2d');round(context,box.x,box.y,box.w,box.h,box.r);context.fill();return context.getImageData(0,0,w,h).data}
 async function generatedFrame(meta,options,base){
  const box=frameSpec(meta);if(!box)throw Error('테두리 생성은 59×66 썸네일과 150/151×150 초상에 사용할 수 있습니다.');
  const encoded=FRAME_PNG[meta.width===59?'icon':'portrait'],bytes=Uint8Array.from(atob(encoded),v=>v.charCodeAt(0));
  const frame=await bitmap(new Blob([bytes],{type:'image/png'}));
  const canvas=document.createElement('canvas');canvas.width=meta.width;canvas.height=meta.height;
  const context=canvas.getContext('2d',{willReadFrequently:true});
  const gray=options.gray||/_gray\\.png$/i.test(meta.path||''),sepia=options.sepia||/_sepia\\.png$/i.test(meta.path||'');
  context.filter=\`grayscale(\${gray?1:0}) sepia(\${sepia?0.8:0})\`;
  try{context.drawImage(frame,0,0,meta.width,meta.height);}finally{frame.close();}
  const mask=frameMask(meta.width,meta.height,box);
  return{rgba:copyFramePixels(base,context.getImageData(0,0,meta.width,meta.height).data,mask),mask};
 }
 // JO9 MOD END WORKSHOP_BATCH_FRAME_CORE_20261111`;
const oldBox=code.match(/ function frameBox\(meta\)\{[^\r\n]+/)[0];code=code.replace(oldBox,frameCode);
const oldKind="if(w===59&&h===66&&/ui overhaul\\//i.test(p))return'icon'";
assert(code.includes(oldKind));code=code.replace(oldKind,"if(w===59&&h===66&&/(?:ui overhaul|ui[\\\\/]legacy_overhaul)[\\\\/]/i.test(p))return'icon'");
const start=code.indexOf(' async function raster('),end=code.indexOf(' const recordWrite=',start);assert(start>0&&end>start);
const raster=` async function raster(file,meta,options){const i=await bitmap(file),{width:w,height:h}=meta,c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});let b={x:0,y:0,w,h},mask=null;const preserveFrame=options.frame&&!options.makeFrame&&!options.frameOnly;try{
  if(preserveFrame){const box=frameBox(meta);if(!box)throw Error('이 원본에는 테두리 보존 규격이 등록되어 있지 않습니다.');const base=await bitmap(new Blob([meta.bytes],{type:'image/png'}));ctx.drawImage(base,0,0);base.close();b=box;mask=frameMask(w,h,b);ctx.save();round(ctx,b.x,b.y,b.w,b.h,b.r);ctx.clip();ctx.fillStyle='#211d17';ctx.fillRect(b.x,b.y,b.w,b.h)}
  if(options.frameOnly){
   if(i.width!==w||i.height!==h)throw Error('테두리만 생성할 원본 이미지의 크기가 변경됐습니다. 다시 선택하세요.');
   ctx.drawImage(i,0,0);
  }else{
   const mode=preserveFrame?'cover':options.fit;let source=i;if(options.smallCrop||options.crop){const q=options.smallCrop||options.crop,crop=document.createElement('canvas');crop.width=Math.max(1,Math.round(q.w*i.width));crop.height=Math.max(1,Math.round(q.h*i.height));crop.getContext('2d').drawImage(i,q.x*i.width,q.y*i.height,q.w*i.width,q.h*i.height,0,0,crop.width,crop.height);source=crop}
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.filter=\`grayscale(\${options.gray?1:0}) sepia(\${options.sepia?0.8:0}) brightness(\${options.brightness||1})\`;
   if(mode==='stretch')ctx.drawImage(source,b.x,b.y,b.w,b.h);else{const s=(mode==='contain'?Math.min:Math.max)(b.w/source.width,b.h/source.height)*(options.zoom||1),dw=source.width*s,dh=source.height*s;let x=b.x+(b.w-dw)/2+(Number(options.x)||0),y=b.y+(b.h-dh)/2+(Number(options.y)||0);if(mode==='cover'){if(dw>=b.w)x=Math.max(b.x+b.w-dw,Math.min(b.x,x));if(dh>=b.h)y=Math.max(b.y+b.h-dh,Math.min(b.y,y))}ctx.drawImage(source,x,y,dw,dh)}
  }
  if(preserveFrame)ctx.restore();let pixels=ctx.getImageData(0,0,w,h);
  if(options.makeFrame){const result=await generatedFrame(meta,options,pixels.data);pixels.data.set(result.rgba);mask=result.mask;ctx.putImageData(pixels,0,0);}
  return{canvas:c,rgba:pixels.data.buffer,mask:mask?.buffer};
 }finally{i.close()}}
`;
code=code.slice(0,start)+raster+code.slice(end);
assert(code.includes('return{BACKUPS,frameBox,'));code=code.replace('return{BACKUPS,frameBox,','return{BACKUPS,frameSpec,frameBox,copyFramePixels,');
code=code.replace(/\r\n|\n/g,'\r\n');new vm.Script(code);
const next=html.slice(0,m.index+8)+code+html.slice(m.index+8+original.length);assert.equal([...next.matchAll(/<script>([\s\S]*?)<\/script>/g)].length,5);
fs.mkdirSync(path.dirname(backup),{recursive:true});if(fs.existsSync(backup))assert(fs.readFileSync(backup).equals(raw),'Unexpected existing backup');else fs.writeFileSync(backup,raw);
assert(fs.readFileSync(source).equals(raw),'Source changed during edit');fs.writeFileSync(source,next);
console.log('Updated source core only; original backed up.');
