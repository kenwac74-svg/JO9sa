'use strict';
// Read-only reproduction. Only writes the small JSON beside this script.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const core = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const work = 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const raw = fs.readFileSync(work), doc = core.parse(raw);
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const locs = doc.locations.map(l => ({name:l.name, lines:core.shift(doc.lines[l.body],5).split('\r\n')}));
const keys = ['courage','darkness_attitude','blood_attitude','fire_attitude','water_attitude','vermin_attitude','deprivation_attitude','jo9_slave_nature','meekness','defiant','jo9_voice_trait','expression_affinity','cowSK_affinity','sport_affinity','passion_comfort','jo9_work_ethic'];
const refs=[], writers=[];
for (const l of locs) for (let i=0;i<l.lines.length;i++) {
  const line=l.lines[i];
  if (/^\s*!/.test(line)) continue;
  for (const key of keys) {
    const re = new RegExp('\\[(?:[\x27\"]+)'+key+'(?:[\x27\"]+)\\]','i');
    if (!re.test(line)) continue;
    refs.push({key,location:l.name,line:i+1});
    // Writer candidates, not a complete QSP grammar. Ignore conditional prefixes.
    let code=line;
    if (/^\s*(?:if|elseif)\b/i.test(code)) code=code.includes(':')?code.slice(code.indexOf(':')+1):'';
    if (!(code.includes('$text[') && !code.includes('EXEC:')) && new RegExp('\\[(?:[\x27\"]+)'+key+'(?:[\x27\"]+)\\]\\s*(?:[+*/-]?=)','i').test(code))
      writers.push({key,location:l.name,line:i+1,code:line.trim()});
  }
}
const game=path.dirname(work), seedDir=path.join(game,'json/slaves');
const phobias=keys.slice(1,7), seedConflicts=[], seedFiles=[];
function check(v) {
 const hit=[];
 if(v.courage===2&&phobias.some(k=>v[k]===-1))hit.push('courage-phobia');
 if(v.jo9_slave_nature===1&&v.meekness<0)hit.push('nature-free');
 if(v.meekness>0&&v.defiant===1)hit.push('obedience-defiant');
 if(v.jo9_voice_trait===1&&v.expression_affinity>0)hit.push('mute-expression');
 if(v.cowSK_affinity>0&&(v.sport_affinity===1||v.passion_comfort===-1||v.jo9_work_ethic===1))hit.push('cow-active');
 return hit;
}
for (const name of fs.readdirSync(seedDir).filter(n=>n.endsWith('.json'))) {
 const j=JSON.parse(fs.readFileSync(path.join(seedDir,name),'utf8').replace(/^\uFEFF/,''));
 const v=Object.fromEntries(keys.map(k=>[k,Number(j['seed_'+k]||0)]));
 const conflicts=check(v);seedFiles.push(name);
 if(conflicts.length)seedConflicts.push({file:name,conflicts,values:Object.fromEntries(Object.entries(v).filter(([k,v])=>v!==0))});
}
const helpers=[];
for(const l of locs)for(let i=0;i<l.lines.length;i++){
 const s=l.lines[i];
 if((l.name==='jo9_traits'&&/dynslave\[\$args\[0\]\]|init_slave_nature|restored_refresh/.test(s))||
   (l.name==='jo9_chaotic'&&/jo9ceactor\[\$args/.test(s))||
   /gs ['\"]jo9_traits['\"].*['\"](?:generate|init_slave_nature)['\"]/.test(s))
   helpers.push({location:l.name,line:i+1,code:s.trim()});
}
const out={readOnly:true,work,workSha256:hash(raw),locationCount:locs.length,keys,refs,writerCandidates:writers,
 candidateWarning:'Static candidates exclude revealed and known fields. Conditional-prefix filtering is heuristic. Dynamic setters and role-copy helpers need explicit review.',
 seedFiles:seedFiles.length,seedConflictCount:seedConflicts.length,seedConflicts,dynamicHelpers:helpers,
 verifiedUnchanged:hash(fs.readFileSync(work))===hash(raw)};
fs.writeFileSync(path.join(__dirname,'inventory.json'),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({hash:out.workSha256,locations:out.locationCount,writers:writers.length,seedFiles:out.seedFiles,seedConflictCount:out.seedConflictCount,groups:Object.fromEntries([...new Set(seedConflicts.flatMap(x=>x.conflicts))].map(g=>[g,seedConflicts.filter(x=>x.conflicts.includes(g)).length])),verifiedUnchanged:out.verifiedUnchanged}));
for(const l of [...new Set(writers.map(x=>x.location))])console.log(l+': '+writers.filter(x=>x.location===l).map(x=>x.key+'@'+x.line).join(', '));
