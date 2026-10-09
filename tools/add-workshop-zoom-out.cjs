'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const active='C:/Users/Ken Choung/Documents/Codex/2026-10-06/task/JO9sa';
const files=[active+'/tools/local-workspace/catalog/catalog_editor.js',active+'/tools/local-workspace/catalog-seed/catalog_editor.js','C:/MOVE/Jack O Nine Tails v2.3 Kor_nosex/game/modtools/place/JO9_Place_Workshop.html','C:/MOVE/Jack O Nine Tails v2.3 Kor_nosex/payload/modtools/place/JO9_Place_Workshop.html'];
function patch(source){
 const escaped=source.includes('id=\\"zoom\\"'),q=escaped?'\\"':'"';
 const old='<label>확대<input id='+q+'zoom'+q+' type='+q+'range'+q+' min='+q+'100'+q+' max='+q+'800'+q+' value='+q+'100'+q+'><output id='+q+'zoomlabel'+q+'>100%</output></label>';
 if(!source.includes(old))throw Error('Expected zoom control missing');
 const control='<label>축소 / 확대<input id='+q+'zoom'+q+' type='+q+'range'+q+' min='+q+'10'+q+' max='+q+'800'+q+' value='+q+'100'+q+'><output id='+q+'zoomlabel'+q+'>100%</output></label><button id='+q+'zoomout'+q+' type='+q+'button'+q+'>− 축소</button><button id='+q+'zoomin'+q+' type='+q+'button'+q+'>+ 확대</button>';
 source=source.replace(old,control);
 const hook="$('edreset').onclick=";
 if(!source.includes(hook))throw Error('Expected controls missing');
 source=source.replace(hook,"function stepZoom(delta){if(!S.edit||S.busy)return;$('zoom').value=Math.max(Number($('zoom').min),Math.min(Number($('zoom').max),Number($('zoom').value)+delta));changed()}\n$('zoomout').onclick=()=>stepZoom(-10);$('zoomin').onclick=()=>stepZoom(10);\n"+hook);
 const clamp="if(mode==='cover'){x=Math.max(b.x+b.w-dw,Math.min(b.x,x));y=Math.max(b.y+b.h-dh,Math.min(b.y,y))}";
 if(!source.includes(clamp))throw Error('Expected raster positioning missing');
 source=source.replace(clamp,"if(mode==='cover'){if(dw>=b.w)x=Math.max(b.x+b.w-dw,Math.min(b.x,x));if(dh>=b.h)y=Math.max(b.y+b.h-dh,Math.min(b.y,y))}");
 if(escaped)new vm.Script(source);else for(const m of source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
 return source;
}
if(require.main===module){const apply=process.argv.includes('--apply'),stamp=new Date().toISOString().replace(/[:.]/g,'-');for(const file of files){if(!fs.existsSync(file))continue;const source=fs.readFileSync(file,'utf8'),next=patch(source);if(apply){fs.copyFileSync(file,file+'.bak_zoom_'+stamp);fs.writeFileSync(file,next);}console.log((apply?'updated ':'checked ')+file);}}
module.exports={patch};
