const test=require('node:test'),assert=require('node:assert/strict');
const {bottomCenter}=require('./add-workshop-alignment.cjs');
test('smaller image centers horizontally and reaches bottom exactly',()=>{
 const p=bottomCenter({width:800,height:600},{width:800,height:600},{fit:'contain',zoom:.75});
 assert.deepEqual(p,{x:0,y:75});assert.equal((600-450)/2+p.y+450,600);
});
test('tall cover images, cropped source, frame interior and stretch remain aligned',()=>{
 assert.deepEqual(bottomCenter({width:800,height:600},{width:400,height:800},{fit:'cover',zoom:1}),{x:0,y:-500});
 const p=bottomCenter({width:59,height:66},{width:200,height:400},{fit:'contain',zoom:.5,frame:true,crop:{w:.5,h:.5}},{w:49,h:51});
 assert.equal(p.x,0);assert.equal(p.y,1);assert.equal((51-49)/2+p.y+49,51);
 assert.deepEqual(bottomCenter({width:800,height:600},{width:200,height:400},{fit:'stretch',zoom:1}),{x:0,y:0});
});
