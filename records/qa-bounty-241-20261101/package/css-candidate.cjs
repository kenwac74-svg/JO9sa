'use strict';
// Read-only evidence for one missing decorative CSS background.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const game='G:/somi/Jack O Nine Tails v2.4 Kor_Full/game';
const raw=fs.readFileSync(game+'/jack.qsp'),d=c.parse(raw),matches=[];
for(const loc of d.locations){
  const lines=c.shift(d.lines[loc.body],5).split('\r\n');
  for(let i=0;i<lines.length;i++){
    const line=lines[i];
    if(/rider[1-6]_pic|combat_ui_pic|id\s*=\s*["'](?:ally_pic|enemy_pic|enemy_maxpic)["']/.test(line))
      matches.push({location:loc.name,locationBodyLine:i+1,text:line});
  }
}
const lines=fs.readFileSync(game+'/css/base.css','utf8').split(/\r?\n/),declarations=[];
for(let i=0;i<lines.length;i++){
  if(lines[i].includes("content/a.jpg")){
    const start=lines.slice(0,i+1).findLastIndex(s=>s.includes('{'));
    declarations.push({file:'game/css/base.css',line:i+1,selector:lines[start].trim(),text:lines[i].trim()});
  }
}
const out={checkedUtc:new Date().toISOString(),qspSha256:crypto.createHash('sha256').update(raw).digest('hex'),id:'PKG-C01',classification:'CONFIRMED_STATIC_DANGLING_BACKGROUND_REFERENCE',runtimeImpact:'UNPROVEN',path:'game/content/a.jpg',exists:fs.existsSync(game+'/content/a.jpg'),declarations,currentQspSelectorGenerators:matches,interpretation:'Rider and combat portrait containers are reachable, but their foreground img elements load separate actor portrait variables. Missing background does not establish missing actor art or visible damage. ally_pic/enemy_pic/enemy_maxpic have no current literal selector generators. No production fix proposed without native/visual reproduction.'};
fs.writeFileSync(path.join(__dirname,'css-candidate.json'),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({id:out.id,missingPath:out.path,declarations:declarations.length,compiledSelectorGenerators:matches.length,runtimeImpact:out.runtimeImpact}));
