const fs=require('node:fs'),core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const files={work:'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',original:'G:/somi/JO9O/game/jack.qsp'};
const name=process.argv[2]||'work',query=process.argv[3]||'마녀들의.{0,8}(모임|집회)|witches|coven|shabash';
const doc=core.parse(fs.readFileSync(files[name]||name)),re=new RegExp(query,'i'),mode=process.argv[4]||'scan';
console.log(JSON.stringify({file:files[name]||name,qspSha256:doc.hash,locations:doc.locations.length}));
let total=0;
for(const loc of doc.locations){const body=core.shift(doc.lines[loc.body],5),lines=body.split(/\r?\n/),hits=[];
 if(mode.startsWith('range:')){if(!re.test(loc.name))continue;const [,a,b]=mode.split(':').map(Number);console.log(JSON.stringify({location:loc.name,totalLines:lines.length,body:lines.slice(a-1,b).map((s,i)=>(i+a)+': '+s.slice(0,1800)).join('\n')}));continue;}
 for(let i=0;i<lines.length;i++)if(re.test(lines[i])||(mode==='location'&&re.test(loc.name)))hits.push(i);
 if(!hits.length)continue;
 if(mode==='location'){console.log(JSON.stringify({location:loc.name,totalLines:lines.length,body:lines.map((s,i)=>(i+1)+': '+s).join('\n')}));continue;}
 const show=hits.slice(0,15).map(i=>({line:i+1,context:lines.slice(Math.max(0,i-2),i+3).map((s,j)=>(Math.max(0,i-2)+j+1)+': '+s.slice(0,1200)).join('\n')}));
 console.log(JSON.stringify({location:loc.name,matches:hits.length,hits:show}));if(++total>=25){console.log('Output capped at 25 locations');break;}
}
