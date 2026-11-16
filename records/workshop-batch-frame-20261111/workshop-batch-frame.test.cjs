const fs=require('fs'),vm=require('vm'),a=require('assert/strict'),test=require('node:test');
const source=process.env.JO9_FRAME_HTML||'G:/somi/JO9sa/tools/image-workshop/place/JO9_Place_Workshop.html';
const scripts=()=>[...fs.readFileSync(source,'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
function core(){const context={console,window:{}};vm.createContext(context);vm.runInContext(scripts()[1],context);return context.window.JO9Core;}
test('current thumbnail paths and 151-wide portraits retain the original frame geometry',()=>{
 const c=core(),bytes=new Uint8Array([1]).buffer;
 a.equal(JSON.stringify(c.frameBox({width:59,height:66,path:'ui/legacy_overhaul/unfamiliar.png',bytes})),JSON.stringify({x:5,y:8,w:49,h:51,r:3}));
 a.equal(JSON.stringify(c.frameBox({width:151,height:150,path:'girls/face/portrait.png',bytes})),JSON.stringify({x:5,y:5,w:141,h:140,r:0}));
 a.equal(c.frameBox({width:795,height:596,path:'bg/room.png',bytes}),null);
});
