const test=require('node:test'),a=require('node:assert/strict');
const {create}=require('./catalog-refresh.js');
test('folder reload reads current files, changes image URLs, preserves filters/checks and never requests QSP mutation',async()=>{
 const base='http://127.0.0.1:3813/',requests=[],rows=[['content\\pic\\girls\\full\\test.png','a','original-tag',10,0,795,596]],flags={done:true},filter={folder:'girls/full'};
 const image={src:base+'api/catalog-asset?original=0&p='+encodeURIComponent(rows[0][0]),parentElement:{tagName:'A'}};
 const control=create({base,getImages:()=>[image],getRows:()=>rows,repaint:()=>{},request:async(action,input)=>{requests.push([action,input]);if(action==='index?rescan=1')return {index:[{path:'girls/full/test.png'}]};if(action==='revisions')return {'girls/full/test.png':{version:'20:100',bytes:20}};throw Error('Unexpected mutation '+action);},now:()=>100});
 await control.refresh({rescan:true});const first=image.src;
 a.equal(rows[0][3],20);a.equal(rows[0][2],'original-tag');a.deepEqual(flags,{done:true});a.deepEqual(filter,{folder:'girls/full'});a.equal(new URL(first).searchParams.get('original'),'0');a.equal(image.parentElement.href,first);
 await control.refresh({rescan:true});a.notEqual(image.src,first,'manual refresh must defeat unchanged old revision caches too');a(requests.every(([name])=>name==='index?rescan=1'||name==='revisions'));
});
test('returning to gallery refreshes visible files without a whole-folder scan and preserves original side',async()=>{
 const images=[{src:'http://127.0.0.1:3813/api/catalog-asset?original=1&p=content%2Fpic%2Fa.png'},{src:'http://127.0.0.1:3813/api/catalog-asset?original=0&p=content%2Fpic%2Fa.png'}],calls=[];
 const c=create({base:'http://127.0.0.1:3813/',getImages:()=>images,getRows:()=>[],repaint:()=>{},request:async(action,input)=>{calls.push(action);return {'a.png':{version:'1:2',bytes:1}};}});
 await c.refresh();a.deepEqual(calls,['revisions']);a.equal(new URL(images[0].src).searchParams.get('original'),'1');a(new URL(images[0].src).searchParams.has('reload'));
});
test('reload count includes images already recreated with fresh URLs by gallery render',async()=>{
 const image={src:'http://127.0.0.1:3813/api/catalog-asset?original=0&p=content%2Fpic%2Fa.png'};
 let c;c=create({base:'http://127.0.0.1:3813/',getImages:()=>[image],getRows:()=>[],request:async()=>({'a.png':{version:'1:2',bytes:1}}),repaint:()=>{image.src=c.versionUrl(image.src);}});
 a.equal((await c.refresh()).count,1);
});
