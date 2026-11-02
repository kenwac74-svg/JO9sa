const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
for(const name of ['credits','main_menu','$newloc']){
 const l=d.locations.find(x=>x.name===name),lines=c.shift(d.lines[l.body],5).split('\r\n');
 if(name==='credits')console.log(name+'\n'+lines.map((s,i)=>(i+1)+': '+s).join('\n'));
 else {const n=lines.findIndex(s=>s.includes('$code_rev'));console.log(name+'\n'+lines.slice(Math.max(0,n-5),n+6).map((s,i)=>(Math.max(0,n-5)+i+1)+': '+s).join('\n'));}
}
const refs=[];for(const l of d.locations){const lines=c.shift(d.lines[l.body],5).split('\r\n');for(let i=0;i<lines.length;i++)if(/code_rev/i.test(lines[i]))refs.push({location:l.name,line:i+1,text:lines[i].slice(0,380)});}
console.log(JSON.stringify({codeRevReferences:refs}));
