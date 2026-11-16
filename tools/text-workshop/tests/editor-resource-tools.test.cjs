const test=require('node:test'),a=require('node:assert/strict');
const bridge=require('../catalog-search-bridge.js');
test('keyword transfer fills input after opening gallery without executing search or input events',async()=>{
 let activated=0,searched=0,dispatched=0;const input={value:'old',focus(){},dispatchEvent(){dispatched++;}},status={textContent:''};
 await bridge.putKeyword({tabs:{activate:async k=>{a.equal(k,'gallery');activated++;}},input:()=>input,status:()=>status,search:()=>searched++},'african3');
 a.equal(input.value,'african3');a.equal(activated,1);a.equal(searched,0);a.equal(dispatched,0);
});
test('search transfer only accepts the embedding local parent',()=>{
 const parent={};const data={type:'jo9:set-image-search',keyword:'african3'};
 a.equal(bridge.accept({data,source:parent,origin:'http://127.0.0.1:7689'},parent),'african3');
 a.equal(bridge.accept({data,source:{},origin:'http://127.0.0.1:7689'},parent),null);
 a.equal(bridge.accept({data,source:parent,origin:'https://external.example'},parent),null);
});
test('game source suggestions keep same-named files in distinct folders and prefer portraits',()=>{
 const fn=require('../catalog-resource-source.js').matches;
 const files=[{path:'ui/buttons/african3.png',name:'african3.png'},{path:'girls/full/african3_black_long.png',name:'african3_black_long.png'},{path:'girls/face/african3.png',name:'african3.png'},{path:'girls/face/other.png',name:'other.png'}];
 const found=Array.from(fn(files,'AFRICAN3'));a.equal(found.length,3);a.equal(found[0].path,'girls/face/african3.png');a.equal(new Set(found.map(x=>x.path)).size,3);
});

test('character keyword uses the image family and retains numbered character identity',async()=>{
 const {pathToFileURL}=require('node:url'),path=require('node:path');
 const {characterImageKeyword:keyword}=await import(pathToFileURL(path.resolve(__dirname,'../../modding-hub/integration.mjs')));
 a.equal(keyword('2588_african3.json','girls/full/african3_black_long'),'african3');
 a.equal(keyword('2341_Gloria.json','girls/full/2341_gloria'),'2341');
 a.equal(keyword('2588_african3.json'),'african3');
 a.equal(keyword('2588_african3.json','characters/african3_black_long_title'),'african3');
});
