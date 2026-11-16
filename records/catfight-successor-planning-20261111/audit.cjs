const fs=require('node:fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const file='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',d=c.parse(fs.readFileSync(file));
const mode=process.argv[2]||'overview',name=process.argv[3],body=l=>c.shift(d.lines[l.body],5).split(/\r?\n/);
console.log(JSON.stringify({sha256:d.hash,locations:d.locations.length}));
if(mode==='names')console.log(d.locations.map(l=>l.name).filter(n=>/catfight|кэт|club|fight|npc_base/.test(n)).join('\n'));
if(mode==='overview')for(const l of d.locations){const lines=body(l),hits=[];lines.forEach((s,i)=>{if(/\begeya_lose\b|\b10201\b|\b3040\b|chunhyang/i.test(s))hits.push({line:i+1,code:s.slice(0,220)});});if(hits.length)console.log(JSON.stringify({location:l.name,hits:hits.slice(0,40),totalHits:hits.length}));}
if(mode==='range'){const l=d.locations.find(l=>l.name===name);if(!l)throw Error(name);const start=Number(process.argv[4]),end=Number(process.argv[5]);console.log(body(l).slice(start-1,end).map((s,i)=>(start+i)+': '+s).join('\n'));}
if(mode==='logic'){const l=d.locations.find(l=>l.name===name);if(!l)throw Error(name);const start=Number(process.argv[4]||1),end=Number(process.argv[5]||body(l).length);console.log(body(l).slice(start-1,end).map((s,i)=>({n:start+i,s})).filter(x=>!/^\s*(\$text\b|\$refuse_txt|\$sp_text|\$txt\b|\$npc_info|\$описание|\*p)/i.test(x.s)).map(x=>x.n+': '+x.s.slice(0,400)).join('\n'));}
if(mode==='hits'){const re=new RegExp(process.argv[4]||'egeya','i');for(const l of d.locations){if(name&&!new RegExp(name).test(l.name))continue;const hits=[];body(l).forEach((s,i)=>{if(re.test(s))hits.push({line:i+1,code:s.slice(0,350)});});if(hits.length)console.log(JSON.stringify({location:l.name,hits:hits.slice(0,45),totalHits:hits.length}));}}
