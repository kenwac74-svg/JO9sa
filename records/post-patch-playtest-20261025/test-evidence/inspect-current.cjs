'use strict';
const k=require('./root-kit.cjs');const {fs,c}=k;
const raw=fs.readFileSync('G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp'),old=c.parse(raw),cur=k.doc();
const body=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
for(const [label,d,get] of [['shipped',old,n=>body(old,n)],['current',cur.d,n=>cur.get(n)]]){
 console.log(label,c.hash(label==='shipped'?raw:fs.readFileSync(k.root+'/source.qsp')),'goto_loc',d.locations.some(l=>l.name==='goto_loc'));
 for(const l of d.locations){const b=get(l.name);const lines=b.split(/\r?\n/);for(let i=0;i<lines.length;i++)if(lines[i].includes("$return_lock = 'goto_loc'"))console.log(l.name,lines.slice(Math.max(0,i-3),i+3).join('\n'));}
}
const b=cur.get('interaction_city');for(const n of [445,471,472]){const r=new RegExp('(?:elseif|if) interaction_city = '+n+'[^0-9]');const p=b.search(r);console.log(n,b.slice(p,p+1900));}
const op=cur.get('#options'),i=op.indexOf('$milk_cooperative[1] =');console.log(op.slice(i,i+3600));
