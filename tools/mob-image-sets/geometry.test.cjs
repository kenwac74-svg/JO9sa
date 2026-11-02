'use strict';
const test=require('node:test'),a=require('node:assert/strict'),crop=require('./portrait-crop.js');
const inside=(r,w,h)=>{a(r.size>0&&r.size<=Math.min(w,h));a(r.x>=0&&r.y>=0&&r.x+r.size<=w&&r.y+r.size<=h);};
test('portrait and landscape starting selections are square and contained',()=>{for(const [w,h]of [[150,150],[600,400],[400,1600],[1,1]])inside(crop.initial(w,h),w,h);});
test('dragging a selection outside the source clamps its position',()=>{a.deepEqual(crop.square(600,400,100,-40,900),{x:0,y:300,size:100});});
test('oversized and zero-size requests remain within real source pixels',()=>{a.deepEqual(crop.square(600,400,2000,100,100),{x:100,y:0,size:400});inside(crop.square(1,1,0,0,0),1,1);});
test('each resize corner retains a square inside the image',()=>{for(let k=0;k<4;k++)for(const [x,y]of [[-20,-30],[100,80],[900,600]])inside(crop.resize({x:100,y:80,size:100},k,x,y,600,400),600,400);});
test('new selections work in all drag directions and at image edges',()=>{for(const [x,y]of [[10,20],[500,20],[10,350],[500,350],[300,200]])inside(crop.fromDrag(300,200,x,y,600,400),600,400);});
test('invalid source dimensions and nonfinite crop values are rejected',()=>{for(const args of [[0,4,1,0,0],[10,10,NaN,0,0],[10,Infinity,1,0,0]])a.throws(()=>crop.square(...args));});
