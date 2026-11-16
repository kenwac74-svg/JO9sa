const test=require('node:test'),a=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const file=__dirname+'/workshop-batch-frame.js';
function fixture(rows=[],resources=[]){
 const C={frameSpec:m=>m&&((m.width===59&&m.height===66)||([150,151].includes(m.width)&&m.height===150))?{x:5,y:5,w:m.width-10,h:m.height-10,r:0}:null,norm:s=>String(s).toLowerCase(),read:async()=>new Uint8Array([1]).buffer,hash:async()=>'before',describe:async(_root,path)=>({path,width:150,height:150,bytes:new Uint8Array([1]).buffer})};
 const S={inputs:rows.length?[{id:'in'}]:[],rows,root:{},busy:false};const out={C,S,File,crypto:require('crypto').webcrypto,URL:{createObjectURL:()=> 'blob:preview'},inputInfo:()=>({}),relPicPath:p=>p.replace('content/pic/',''),selectedResources:()=>resources,conflicts:()=>new Set(),busy:v=>{S.busy=v;},msg:(s,e)=>{out.message=s;out.isError=e;},render(){},renderScreenResources(){},processRow:async r=>{r.output='converted';},rebuild:async()=>{S.rows=S.inputs.map(s=>({inputId:s.id,selected:true,file:s.file,meta:{width:150,height:150,before:'before'},options:{}}));}};
 vm.createContext(out);vm.runInContext(fs.existsSync(file)?fs.readFileSync(file,'utf8'):'',out);return out;
}
test('batch frame changes only selected supported replacement rows and never saves files',async()=>{
 const selected={inputId:'in',selected:true,meta:{width:150,height:150},options:{crop:{x:0,y:0,w:1,h:1},zoom:2}},off={selected:false,meta:{width:150,height:150},options:{}},large={selected:true,meta:{width:795,height:596},options:{}};
 const f=fixture([selected,off,large]);a.equal(typeof f.makeSelectedFrames,'function');await f.makeSelectedFrames();a.equal(selected.options.makeFrame,true);a.equal(selected.options.zoom,2);a.equal(selected.output,'converted');a.equal(off.output,undefined);a.equal(large.output,undefined);a.equal(f.S.busy,false);
});
test('without input files the explicitly selected originals become exact frame-only snapshots',async()=>{
 const f=fixture([],[{path:'content/pic/girls/face/one.png',width:150,height:150},{path:'content/pic/bg/room.png',width:795,height:596}]);await f.makeSelectedFrames();a.equal(f.S.inputs.length,1);a.equal(f.S.inputs[0].mappedPath,'content/pic/girls/face/one.png');a.equal(f.S.inputs[0].frameOnly,true);a.equal(f.S.rows[0].options.frameOnly,true);a.equal(f.S.rows[0].output,'converted');a.match(f.message,/제외 1개/);
});
test('individual conversion failure is visible and does not strand the tool busy',async()=>{
 const row={inputId:'in',selected:true,meta:{width:59,height:66},options:{}};const f=fixture([row]);f.processRow=async()=>{throw Error('pixel failure');};await f.makeSelectedFrames();a.equal(row.error,'pixel failure');a.equal(f.S.busy,false);a.match(f.message,/실패/);
});
test('an original changed between snapshot and target rebuild is never staged for replacement',async()=>{
 const f=fixture([],[{path:'content/pic/girls/face/one.png',width:150,height:150}]);f.rebuild=async()=>{f.S.rows=f.S.inputs.map(s=>({inputId:s.id,selected:true,file:s.file,meta:{width:150,height:150,before:'changed'},options:{}}));};await f.makeSelectedFrames();a.equal(f.S.rows[0].output,undefined);a.equal(f.S.rows[0].meta,null);a.match(f.message,/변경/);a.equal(f.S.busy,false);
});
