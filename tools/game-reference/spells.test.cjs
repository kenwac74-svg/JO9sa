'use strict';
const test=require('node:test'),a=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {extract}=require(path.join(process.env.JO9_REFERENCE_SOURCE||__dirname,'extract-spells.cjs'));
const game='G:/somi/Jack O Nine Tails v2.4_work/game';
test('WORK spell definitions have real menu labels, exact costs and source conditions',()=>{
 const data=extract(fs.readFileSync(game+'/jack.qsp'),JSON.parse(fs.readFileSync(game+'/json/menu_item.json','utf8'))),rows=new Map(data.rows.filter(r=>Number.isInteger(r.interactionId)).map(r=>[r.interactionId,r]));
 a.equal(rows.size,11);for(const [id,cost]of [[61,2],[62,5],[63,5],[64,5],[65,5],[66,5],[67,5],[68,25],[69,30],[81,40],[70000,150]]){const row=rows.get(id);a(row);a.equal(row.sparkCost,cost);a.equal(row.linked,true);a(row.source.includes('interaction:'));a(row.requirements.includes('sparks'));a(row.code.includes('sparks -='));}
 a.equal(rows.get(61).name,'아우스펙스');a.equal(rows.get(70000).name,'불누스 사나레 맥시마');a(rows.get(68).code.includes("slave['brand'] = 3"));a(rows.get(81).code.includes('spell_revelio = 1'));
 const named=data.rows.filter(r=>r.id==='jo9_duplicato');a(named.length<=1);if(named.length){a(!Object.hasOwn(named[0],'interactionId'));a.equal(named[0].sparkCost,300);a.equal(named[0].linked,true);a(named[0].source.startsWith('jo9_duplicato:'));}
});
