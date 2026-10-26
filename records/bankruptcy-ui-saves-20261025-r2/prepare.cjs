'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',repo='G:/somi/JO9sa',root='G:/Codex/tmp/bankruptcy-ui-saves-20261025-r2';
const c=require(repo+'/tools/text-workshop/core.cjs'),s=require(repo+'/tools/qa/save-codec.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const recipes=JSON.parse(fs.readFileSync(__dirname+'/recipes.json'));assert(Array.isArray(recipes));
const raw=fs.readFileSync(game+'/jack.qsp');assert.equal(c.hash(raw),'256293ff14b41ac19efd1bfb412f21066b227f86e1b61ea0e523820a86ebcb3a');
const d=c.parse(raw),loc=n=>{const l=d.locations.find(x=>x.name===n);assert(l,n);return l;},q=x=>"'"+x.replaceAll("'","''")+"'",cr=x=>x.replace(/\r?\n/g,'\r\n');
const sourceFolder=game+'/save/JO9_MANUAL_20261025/01_검사완료재확인';
fs.mkdirSync(root+'/factory/inputs',{recursive:true});fs.mkdirSync(root+'/factory/out',{recursive:true});
d.lines[loc('Start').body]=c.shift("usehtml=1\r\n*pl 'JO9 test save factory R2. Use Game - Load to restore a complete source save.'",-5);
let boot="jo9sv2_case=autosave_day\r\ngs 'interior_storage'\r\ngs 'refresh_database'\r\ngs 'interior_restore'\r\nautosave=0 & decadesave=0 & autosave_day=0 & autosave_decade=0 & sound_on=0\r\n$counter='' & $onnewloc='' & $ongsave='' & $ongload='$ongload'\r\n",emit='';
const specification=[];
for(let i=0;i<recipes.length;i++){
 const r=recipes[i],source=path.isAbsolute(r.baseSave)?r.baseSave:sourceFolder+'/'+r.baseSave,base=fs.readFileSync(source),doc=s.parse(base);assert(s.serialize(doc).equals(base));
 const onload=doc.vars.find(v=>v.name==='ONGLOAD'),selector=doc.vars.find(v=>v.name==='AUTOSAVE_DAY');assert(onload&&selector);onload.values[0][1]='jo9sv2_boot';selector.values[0][0]=String(i+1);
 fs.writeFileSync(root+'/factory/inputs/'+r.file,s.serialize(doc));
 boot+=`if jo9sv2_case=${i+1}:\n`+r.setup.join('\n')+'\n'+r.entry+'\nend\n';
 assert(r.guard||r.checkpointGuard,'Recipe checkpoint guard');
 emit+=`if jo9sv2_case=${i+1} and (${r.guard||r.checkpointGuard}):\n killvar 'JO9SV2_CASE'\n savegame ${q('out/'+r.file)}\nend\n`;
 specification.push({...r,index:i+1,input:root+'/factory/inputs/'+r.file,source,sourceHash:c.hash(base)});
}
for(const name of new Set(recipes.map(r=>r.checkpoint))){const l=loc(name);d.lines[l.body]=c.shift(c.shift(d.lines[l.body],5)+"\r\ngs 'jo9sv2_emit'",-5);}
const lines=c.serialize(d).toString('utf16le').split('\r\n');lines.pop();lines[3]=c.shift(String(d.locations.length+2),-5);
for(const [name,body]of[['jo9sv2_boot',boot],['jo9sv2_emit',emit]])lines.push(c.shift(name,-5),'',c.shift(cr(body),-5),c.shift('0',-5));lines.push('');
const output=Buffer.from(lines.join('\r\n'),'utf16le');qa.inspectWorld(output);fs.writeFileSync(root+'/factory/jack.qsp',output);
fs.writeFileSync(__dirname+'/spec.json',JSON.stringify({source:game+'/jack.qsp',sourceHash:c.hash(raw),nativeFactory:true,root,recipes:specification},null,2));
console.log(JSON.stringify({factory:root+'/factory/jack.qsp',cases:recipes.length,bytes:output.length}));
