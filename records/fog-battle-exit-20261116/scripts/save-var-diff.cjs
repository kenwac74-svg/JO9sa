const fs=require('fs'),codec=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
function sizes(p){const s=codec.parse(fs.readFileSync(p));const m=new Map();for(const v of s.vars){let b=0,nz=0;for(const [n,t] of v.values){b+=(n||'').length+(t||'').length+4;if((t&&t.length)||(n&&n!=='0'))nz++;}m.set(v.name,{b,nz,n:v.values.length});}return m;}
const a=sizes(process.argv[2]),b=sizes(process.argv[3]);
const rows=[];for(const [k,v] of a){const o=b.get(k)||{b:0,nz:0,n:0};rows.push([k,v.b-o.b,v.nz,o.nz,v.n,o.n]);}
rows.sort((x,y)=>y[1]-x[1]);console.log('name'.padEnd(34),'dBytes','nz(new)','nz(old)','len(new)','len(old)');
rows.slice(0,22).forEach(r=>console.log(String(r[0]).padEnd(34),String(r[1]).padStart(8),String(r[2]).padStart(8),String(r[3]).padStart(8),String(r[4]).padStart(9),String(r[5]).padStart(9)));
console.log('total new',[...a.values()].reduce((s,v)=>s+v.b,0),'old',[...b.values()].reduce((s,v)=>s+v.b,0));
