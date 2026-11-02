'use strict';
const fs=require('fs'),assert=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const here=__dirname,label=process.argv[2]||'',p=here+'/results'+label+'.json',r=JSON.parse(fs.readFileSync(p));let failures=0;
for(const x of r.results){const f=r.instrumentation.find(z=>z.name===x.name),issues=[];
 try{
  const log=fs.readFileSync(here+'/'+x.name+label+'-stderr.log','utf8'),m=log.match(/showMessage\(\), str:\s*"(JO9_QA_WONGFIX_[^"\r\n]+)"/);assert(m,'native marker missing');
  x.rawMarker=m[1];x.marker=decodeURIComponent(m[1]);const d=Object.fromEntries(x.marker.split('|').slice(1).map(z=>z.split('=')));x.observed=d;
  assert.equal(+d.REP,f.after,'reputation');assert.equal(d.NPC,'master_vong');assert(+d.DOMLEN>0,'dialogue empty');
  if(f.fatal){assert.equal(d.DAY,'0','fatal day');assert.equal(d.EXPEL,'1','expulsion ending');assert.equal(d.GAMEOVER,'1','Game Over');assert.equal(+d.ILL,f.ill,'fatal retains native illness counter');assert.equal(+d.PARA,f.para,'fatal retains native parasite counter');assert.equal(d.GUARD,'0','fatal retains native guard');assert.equal(d.WARN,'1');assert.equal(d.EVENTS,'0');}
  else{assert.equal(d.INTRO,'1','intro');assert.equal(d.SPEAKER,'1','speaker');if(f.ill>0)assert.equal(d.ILLTEXT,'1','illness rebuke');if(f.para>0)assert.equal(d.PARATEXT,'1','parasite rebuke');assert.equal(d.DAY,'102');assert.equal(d.ILL,'0');assert.equal(d.PARA,'0');assert.equal(d.GUARD,'1');assert.equal(d.EVENTS,'1');assert.equal(+d.WARN,f.para>0?1:0);if(f.para>0)assert.equal(d.EXTRA,'1','native follow-up text[3]');
   x.overflow=+d.SCROLLHEIGHT>+d.CLIENTHEIGHT||+d.SCROLLWIDTH>+d.CLIENTWIDTH;
   if(x.overflow)issues.push('DIALOGUE_OVERFLOW client='+d.CLIENTHEIGHT+' scroll='+d.SCROLLHEIGHT);
  }
 }catch(e){issues.push(e.message)}
 x.pass=issues.length===0;x.issues=issues;x.reason=issues.join('; ');if(!x.pass)failures++;
}
const cand=JSON.parse(fs.readFileSync(here+'/fixture-manifest'+label+'.json')).candidatePath;
r.after={workQsp:c.hash(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp')),candidate:c.hash(fs.readFileSync(cand)),save:c.hash(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/save/JO9_GOLD_AP_CHECK_20261026.sav'))};assert.deepEqual(r.after,r.before);
r.sourceUnchanged=true;r.nativeRuns=r.results.length;r.allPass=failures===0;r.failures=failures;
fs.writeFileSync(p,JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify({allPass:r.allPass,failures,nativeRuns:r.nativeRuns,sourceUnchanged:true,results:r.results}));if(failures)process.exitCode=1;
