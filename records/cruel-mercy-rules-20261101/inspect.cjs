const fs=require('fs');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const W='G:/somi/Jack O Nine Tails v2.4_work/game';
const raw=fs.readFileSync(W+'/jack.qsp'), doc=core.parse(raw);
const body=n=>core.shift(doc.lines[doc.locations.find(l=>l.name===n).body],5).replace(/\r\n/g,'\n');
const scenes=require(W+'/modtools/text-workshop/scenes.cjs');
const mode=process.argv[2];
if(mode==='body') console.log(body(process.argv[3]));
if(mode==='scene') {
 const n=process.argv[3], s=scenes.analyse(n,body(n)).scenes.find(s=>s.predicate?.value===process.argv[4]);
 const b=body(n).slice(s.start,s.end);
 console.log(b.split('\n').map((x,i)=>`${i+1}: ${x}`).join('\n'));
}
if(mode==='match') console.log(body(process.argv[3]).split('\n').map((x,i)=>`${i+1}: ${x}`).filter(x=>new RegExp(process.argv[4],'i').test(x)).join('\n'));
if(mode==='slice') console.log(body(process.argv[3]).split('\n').slice(Number(process.argv[4])-1,Number(process.argv[5])).map((x,i)=>`${Number(process.argv[4])+i}: ${x}`).join('\n'));
if(mode==='deps') {const n=process.argv[3];for(const l of doc.locations){const b=body(l.name);const m=b.split('\n').filter(x=>x.includes(n));if(m.length)console.log(l.name+': '+m.filter(x=>x.trimStart().startsWith(n)).map(x=>x.slice(0,80)).join(' | '));}}
