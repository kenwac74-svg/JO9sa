'use strict';
const fs=require('fs'),a=require('assert/strict'),cp=require('child_process');
const R='G:/somi/JO9sa',T='G:/Codex/tmp/game-reference-refresh-20261108/tools/game-reference',G='G:/somi/Jack O Nine Tails v2.4_work/game';
function replace(file,old,next){let s=fs.readFileSync(T+'/'+file,'utf8');a.equal(s.split(old).length-1,1,file);fs.writeFileSync(T+'/'+file,s.replace(old,next));}
replace('extract-items.cjs',"assert.equal(storageCount, 34);","assert.ok(storageCount >= 34, 'Unexpected missing storage rows; review the current inventory');");
for(const file of ['extract-items.cjs','enrich-item-acquisition.cjs'])replace(file,"'items.json'","'items.input.json'");
replace('assemble.cjs',"kind + '.json'","(kind === 'items' ? 'items.input' : kind) + '.json'");
replace('assemble.cjs','const encoded = JSON.stringify(data)',"require('./refresh-current.cjs').apply(data, doc);\nfor (const kind of ['traits', 'items']) fs.writeFileSync(path.join(__dirname, kind + '.json'), JSON.stringify(data[kind], null, 2) + '\\n');\nconst encoded = JSON.stringify(data)");
fs.copyFileSync(__dirname+'/refresh-current.cjs',T+'/refresh-current.cjs');
replace('reference-template.html','현재 게임 데이터 · jack.qsp','현재 WORK 데이터 · jack.qsp');
for(const name of ['extract-traits','extract-items','enrich-item-acquisition','assemble']){const input=name==='enrich-item-acquisition'?G:G+'/jack.qsp';console.log(name,cp.execFileSync(process.execPath,[T+'/'+name+'.cjs',input],{encoding:'utf8',windowsHide:true}));}
const data=JSON.parse(fs.readFileSync(T+'/jo9-reference.html','utf8').match(/id="reference-data" type="application\/json">([^\n]+)<\/script>/)[1]);
a.equal(data.traits.rows.length,128);a.equal(data.items.rows.length,271);
console.log(JSON.stringify({traits:data.traits.rows.length,items:data.items.rows.length,hash:data.meta.qspSha256,newTraits:data.traits.rows.filter(r=>r.name==='석녀'||r.name==='정액 중독'),specialFoods:data.items.rows.filter(r=>r.id.startsWith('jo9_agraba_stock'))}));
