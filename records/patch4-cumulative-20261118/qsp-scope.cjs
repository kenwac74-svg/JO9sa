const fs=require('node:fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const work=fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'),tracked=fs.readFileSync('G:/somi/JO9sa/assets/runtime/2.4.1/jack.qsp');
const wd=c.parse(work),td=c.parse(tracked),body=(d,l)=>c.shift(d.lines[l.body],5),changed=[];
for(const l of wd.locations){const t=td.locations.find(x=>x.name===l.name);if(!t||body(td,t)!==body(wd,l)){
 const a=t?body(td,t).split('\n'):[],b=body(wd,l).split('\n'),prefix=(()=>{let i=0;while(i<Math.min(a.length,b.length)&&a[i]===b[i])i++;return i;})();let tail=0;while(tail<Math.min(a.length,b.length)-prefix&&a[a.length-1-tail]===b[b.length-1-tail])tail++;
 changed.push({location:l.name,oldLines:a.length,newLines:b.length,changedFromLine:prefix+1,old:a.slice(prefix,a.length-tail),new:b.slice(prefix,b.length-tail)});
}}
const report={workSha256:c.hash(work),trackedSha256:c.hash(tracked),workLocations:wd.locations.length,trackedLocations:td.locations.length,changed};
fs.writeFileSync(__dirname+'/qsp-scope.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
