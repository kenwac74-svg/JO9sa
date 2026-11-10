'use strict';
const test=require('node:test'),a=require('node:assert/strict'),path=require('node:path');
const {offlineAdapter}=require(path.join(process.env.JO9_REFERENCE_SOURCE||__dirname,'ideas-client.cjs'));
function storage(){const values=new Map();return{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};}
test('standalone notes survive reload and stale tabs retain current text',()=>{const mem=storage(),first=offlineAdapter(mem),old=first.read(),saved=first.upsert(old.revision,{kind:'spells',title:'마법 구상',description:'수동 원고\n유지'});const next=offlineAdapter(mem);a.equal(next.read().items[0].description,'수동 원고\n유지');a.throws(()=>first.upsert(old.revision,{kind:'items',title:'낡은 창'}),e=>e.status===409);const imported=next.import(saved.revision,{schema:1,items:saved.items});a.equal(imported.added,0);a.equal(imported.items.length,1);});
test('standalone quota failure reports failure without claiming save',()=>{const adapter=offlineAdapter({getItem:()=>null,setItem:()=>{throw Error('quota')}});a.throws(()=>adapter.upsert(adapter.read().revision,{kind:'traits',title:'특성'}),/quota/);a.equal(adapter.read().items.length,0);});
