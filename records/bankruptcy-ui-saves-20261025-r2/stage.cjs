'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',root='G:/Codex/tmp/bankruptcy-ui-saves-20261025-r2',c=require(repo+'/tools/text-workshop/core.cjs'),s=require(repo+'/tools/qa/save-codec.cjs');
const recipes=require('./recipes.json'),crc=fs.existsSync(root+'/verify/work-reference.sav')?s.parse(fs.readFileSync(root+'/verify/work-reference.sav')).lines[2]:null;
function restoreInterior(d){
 const str=(n,k)=>s.value(d,n,k)[1],num=(n,k)=>+s.value(d,n,k)[0];
 const put=(n,k,v)=>{const a=d.vars.find(v=>v.name===n),at=a.idx.find(v=>v[1]===k.toUpperCase())?.[0];assert(at!==undefined,n+'.'+k);a.values[at][1]=v;};
 const rooms=[['study','STUDY',true,'home_lux'],['bedroom','BED',true,'bedroom_lux'],['bathroom','BATH',num('BATH')>0,'bathroom_lux'],['dungeon','DUNGEON',num('DUNGEON')>0,'dungeon_lux'],['kitchen','KITCHEN',num('KITCHEN')>0,'kitchen_lux'],['lab','LAB',num('LAB')>0,'lab_lux'],['boudoir','BOUDOIR',num('BOUDOIR')>0,'boudoir_lux'],['barn','BARN',num('BARN')>0,'barn_lux']];
 const changed=[];
 for(const[room,stem,on,large]of rooms){if(!on)continue;const style=str(stem),pic=room==='barn'?str('INTERIOR_BARN'):str('INTERIOR_'+stem,style),wide=room==='barn'?str('INTERIOR_BARN_LARGE'):str('INTERIOR_'+stem+'_LARGE',style);assert(pic&&wide,'Missing known interior '+room);
  for(const[key,v]of[[room,pic],[large,wide]]){const old=str('BG',key);put('BG',key,v);if(old&&old!==v){for(let i=0;i<d.start;i++){let text=s.dec(d.lines[i]);for(const slash of ['\\','/']){const url=n=>'content'+slash+'pic'+slash+'bg'+slash+n.replace(/[\\/]/g,slash)+'.png';text=text.split(url(old)).join(url(v));}d.lines[i]=s.enc(text);}changed.push({key,old,new:v});}}
  const estate=str('ESTATE');put('PLACE_NAME',room,str('ESTATE_'+stem+'_NAME',estate));put('PLACE_LOCATION',room,str('ESTATE_'+stem+'_LOCATION',estate));put('PLACE_INFO',room,room==='barn'?str('INTERIOR_BARN_INFO'):str('INTERIOR_'+stem+'_INFO',style));
 }
 return changed;
}
fs.mkdirSync(root+'/pack',{recursive:true});const files=[];
for(const r of recipes){const p=root+'/factory/out/'+r.file,raw=fs.readFileSync(p),d=s.parse(raw);assert(s.serialize(d).equals(raw));d.vars=d.vars.filter(v=>!/^(?:QA_|JO9SV2_)/.test(v.name));const emptyScratch=d.vars.filter(v=>v.name==='J9_KEY');const removedEmptyScratch=[];if(emptyScratch.length>1){assert(emptyScratch.every(v=>v.values.length===0&&v.idx.length===0),'Nonempty scratch must be preserved');const keep=Math.min(...emptyScratch.map(v=>v.slot));d.vars=d.vars.filter(v=>{const drop=v.name==='J9_KEY'&&v.slot!==keep;if(drop)removedEmptyScratch.push(v.slot);return !drop;});}const changed=restoreInterior(d);if(crc)d.lines[2]=crc;const out=s.serialize(d),again=s.parse(out);assert(s.serialize(again).equals(out));
 const values=[...again.lines.slice(0,again.start).map(s.dec),...again.vars.flatMap(v=>v.values.map(x=>x[1]))].join('\n');assert(!/jo9sv2_boot|jo9sv2_emit|jo9sv2_case|JO9_QA_|QA_R2_/i.test(values),'Factory residue '+r.file);assert.equal(s.value(again,'ONGLOAD')[1],'$ongload');fs.writeFileSync(root+'/pack/'+r.file,out);files.push({file:r.file,title:r.titleKo,sha256:c.hash(out),bytes:out.length,checkpoint:r.checkpoint,interiorChanges:changed,removedEmptyScratchSlots:removedEmptyScratch,nativeSave:true,nativeCrcBound:!!crc});
}
fs.copyFileSync(__dirname+'/사용안내.txt',root+'/pack/사용안내.txt');fs.writeFileSync(__dirname+'/manifest.json',JSON.stringify({sourceHash:c.hash(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp')),count:files.length,nativeCrcBound:!!crc,crc:crc?s.dec(crc):null,files},null,2));console.log(JSON.stringify({staged:files.length,nativeCrcBound:!!crc,bytes:files.reduce((n,f)=>n+f.bytes,0)}));
