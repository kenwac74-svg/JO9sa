const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),os=require('node:os'),path=require('node:path');
const dir=process.argv[2]||__dirname;
const source=fs.readFileSync(path.join(dir,'catalog_workshop.js'),'utf8');
const section=source.slice(source.indexOf('  var copySide=side;'),source.indexOf('  function accept'));
const calls=[],selected=[];
const ctx={window:{JO9_GROK_SELECT:(...a)=>selected.push(a)},OR:'original',MR:'current',config:{},isImg:p=>/\.png$/.test(p),js:p=>p.replaceAll('\\','\\\\'),side:()=>'<div><a>x</a></div></div>',request:async(route,data)=>{calls.push(data);return {destination:'work/test.png'}},alert:e=>{throw Error(e)},confirm:()=>true};
vm.createContext(ctx);vm.runInContext(section,ctx);
for(const original of [true,false]){const html=ctx.side('label',original?'original':'current','content\\pic\\test.png',123,original);assert.ok(html.includes('copyCatalogImage'));assert.ok(html.includes(',this,'+original+')'));}
assert.ok(!ctx.side('missing','original','test.png',0,true).includes('copyCatalogImage'));
(async()=>{await ctx.window.copyCatalogImage('content\\pic\\test.png',{},false);assert.equal(calls.at(-1).original,false);assert.equal(selected.at(-1)[1].original,false);await ctx.window.copyCatalogOriginal('content\\pic\\test.png',{});assert.equal(calls.at(-1).original,true);console.log('PASS: both buttons, absent original, original compatibility, selected source routing');})();
