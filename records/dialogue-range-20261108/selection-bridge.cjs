const fs=require('fs'),z=require('zlib'),crypto=require('crypto');
const roots=['G:/somi/JO9sa/tools/text-workshop','G:/somi/Jack O Nine Tails v2.4_work/game/modtools/text-workshop'];
const record='G:/somi/JO9sa/records/dialogue-range-20261108';const log=[];
for(const root of roots)for(const name of ['index.html','script-range.js']){
 const p=root+'/'+name,raw=fs.readFileSync(p),hash=crypto.createHash('sha256').update(raw).digest('hex');
 fs.writeFileSync(record+'/before/'+hash+'.gz',z.gzipSync(raw));let s=raw.toString('utf8');
 if(name==='index.html')s=s.replace('renderGame(c);if(window.JO9_VARIABLE_SELECT)',"renderGame(c);window.dispatchEvent(new CustomEvent('jo9:selection',{detail:c}));if(window.JO9_VARIABLE_SELECT)");
 else s=s.replace("const previous=window.JO9_VARIABLE_SELECT;window.JO9_VARIABLE_SELECT=function(c){if(typeof previous==='function')previous(c);select(c);};","window.addEventListener('jo9:selection',event=>select(event.detail));");
 if(s===raw.toString('utf8'))throw Error('No change '+p);fs.writeFileSync(p,s);log.push({file:p,before:hash,after:crypto.createHash('sha256').update(s).digest('hex')});
}
fs.writeFileSync(record+'/selection-bridge.json',JSON.stringify(log,null,2));console.log('Selection event bridge installed in source and WORK');
