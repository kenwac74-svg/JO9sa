'use strict';
const fs=require('node:fs'),vm=require('node:vm');
const base='C:/Users/Ken Choung/Documents/Codex/2026-10-06/task/JO9sa';
const files=[base+'/tools/local-workspace/catalog/catalog_editor.js',base+'/tools/local-workspace/catalog-seed/catalog_editor.js','C:/MOVE/Jack O Nine Tails v2.3 Kor_nosex/game/modtools/place/JO9_Place_Workshop.html','C:/MOVE/Jack O Nine Tails v2.3 Kor_nosex/payload/modtools/place/JO9_Place_Workshop.html'];
function bottomCenter(meta,image,options,frame){
 const b=options.frame&&frame?frame:{w:meta.width,h:meta.height};
 const crop=options.smallCrop||options.crop;
 const width=crop?Math.max(1,Math.round(crop.w*image.width)):image.width;
 const height=crop?Math.max(1,Math.round(crop.h*image.height)):image.height;
 const mode=options.frame?'cover':options.fit;
 if(mode==='stretch')return{x:0,y:0};
 const scale=(mode==='contain'?Math.min:Math.max)(b.w/width,b.h/height)*(options.zoom||1);
 return{x:0,y:(b.h-height*scale)/2};
}
function patch(source){
 if(!source.includes('stepZoom(-10)')||!source.includes('stepZoom(10)'))throw Error('Expected zoom buttons missing');
 source=source.replace('stepZoom(-10)','stepZoom(-1)').replace('stepZoom(10)','stepZoom(1)');
 const q=source.includes('id=\\"zoom\\"')?'\\"':'"';
 const old='<button id='+q+'edreset'+q+'>위치 초기화</button>';
 if(!source.includes(old))throw Error('Expected reset button missing');
 source=source.replace(old,old+'<button id='+q+'edalign'+q+' type='+q+'button'+q+'>하단·중앙 정렬</button>');
 const hook="$('edreset').onclick=";
 source=source.replace(hook,bottomCenter.toString()+"\n$('edalign').onclick=async()=>{const r=S.edit;if(!r||S.busy)return;let image;try{image=await createImageBitmap(r.file,{imageOrientation:'from-image'});if(S.edit!==r)return;Object.assign(r.options,bottomCenter(r.meta,image,r.options,C.frameBox(r.meta)));changed()}catch(e){msg(e.message,true)}finally{image?.close()}};\n"+hook);
 if(q==='\\"')new vm.Script(source);else for(const m of source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
 return source;
}
if(require.main===module){const apply=process.argv.includes('--apply'),stamp=new Date().toISOString().replace(/[:.]/g,'-');for(const file of files){if(!fs.existsSync(file))continue;const next=patch(fs.readFileSync(file,'utf8'));if(apply){fs.copyFileSync(file,file+'.bak_align_'+stamp);fs.writeFileSync(file,next);}console.log((apply?'updated ':'checked ')+file);}}
module.exports={bottomCenter,patch};
