'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),crypto=require('node:crypto');
const {create}=require('./character-portrait-frame.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function fixture(){
 const raw=Buffer.from('portrait-source'),framed=Buffer.from('framed-output');
 const assets=new Map([['girls/face/test.png',raw],...['','_gray','_sepia'].map(s=>['girls/face/0001_black_long_loli'+s+'.png',Buffer.from('reference'+s)])]);
 let jsonHash='j1',path='girls/face/test.png',state='unframed',calls=[];
 const links={read(){return{characters:[{id:1,jsonSha256:jsonHash,refs:{seed_ava_clear:path,seed_ava_gray:path,seed_ava:path}},{id:2,refs:{seed_ava:path}}]};},resolve(p){if(!assets.has(p))throw Error('missing');return{path:p,bytes:assets.get(p),width:151,height:150};}};
 const pic={apply(jobs,operation){calls.push({jobs,operation});assets.set(jobs[0].path,Buffer.from(jobs[0].data,'base64'));return{id:'backup-1',status:'applied'};}};
 const processor={composePortraitFrame({pngBytes,frameBytes}){return{status:state,width:151,height:150,borderWidth:5,pngBytes:state==='framed'?pngBytes:framed,changed:state!=='framed',centerPixelsPreserved:true};}};
 const service=create(links,pic,{processor});
 const request={id:1,field:'seed_ava_gray',expectedHash:'j1'};
 return{service,request,assets,calls,setJson(v){jsonHash=v;},setPath(v){path=v;},setState(v){state=v;},raw,framed};
}
test('preview has no writes and pins target, source/reference hashes, shared users and original dimensions',()=>{
 const f=fixture(),p=f.service.preview(f.request);a.equal(f.calls.length,0);a.equal(p.path,'girls/face/test.png');a.equal(p.before,sha(f.raw));a.equal(p.expectedHash,'j1');a.equal(p.frameHash,sha(Buffer.from('reference_gray')));a.equal(p.width,151);a.equal(p.height,150);a.deepEqual(p.sharedWith,[2]);a.equal(p.data,f.framed.toString('base64'));
});
test('apply uses the existing backed-up image writer without editing character JSON',()=>{
 const f=fixture(),p=f.service.preview(f.request),r=f.service.apply(p);a.equal(r.status,'applied');a.equal(f.calls.length,1);a.equal(f.calls[0].operation,'portrait-frame');a.equal(f.calls[0].jobs[0].before,p.before);a.equal(f.assets.get(p.path).toString(),f.framed.toString());
});
test('stale JSON and a re-linked portrait cannot write a previously selected file',()=>{
 const f=fixture(),p=f.service.preview(f.request);f.setJson('j2');a.throws(()=>f.service.apply(p),/JSON|연결/);a.equal(f.calls.length,0);
 const g=fixture(),q=g.service.preview(g.request);g.setPath('girls/face/other.png');g.assets.set('girls/face/other.png',g.raw);a.throws(()=>g.service.apply(q),/경로|연결/);a.equal(g.calls.length,0);
});
test('changed PNG or reference frame after preview is rejected without writes',()=>{
 for(const target of ['girls/face/test.png','girls/face/0001_black_long_loli_gray.png']){const f=fixture(),p=f.service.preview(f.request);f.assets.set(target,Buffer.from('changed'));a.throws(()=>f.service.apply(p),/변경|바뀌/);a.equal(f.calls.length,0);}
});
test('known frames preserve the exact original bytes and do not create backups',()=>{
 const f=fixture();f.setState('framed');const p=f.service.preview(f.request);a.equal(p.changed,false);a.equal(p.data,f.raw.toString('base64'));const r=f.service.apply(p);a.equal(r.status,'unchanged');a.equal(f.calls.length,0);
});
test('unrecognized edges require explicit preview approval and only portrait fields are allowed',()=>{
 const f=fixture();f.setState('uncertain');const p=f.service.preview(f.request);a.throws(()=>f.service.apply(p),/확인/);a.equal(f.calls.length,0);f.service.apply({...p,confirmed:true});a.equal(f.calls.length,1);a.throws(()=>f.service.preview({...f.request,field:'fullimage'}),/초상/);
});
