const fs=require('fs'),z=require('zlib'),crypto=require('crypto');const record='G:/somi/JO9sa/records/dialogue-range-20261108';
for(const root of ['G:/somi/JO9sa/tools/text-workshop','G:/somi/Jack O Nine Tails v2.4_work/game/modtools/text-workshop']){const p=root+'/script-range.js',raw=fs.readFileSync(p);fs.writeFileSync(record+'/before/'+crypto.createHash('sha256').update(raw).digest('hex')+'.gz',z.gzipSync(raw));let s=raw.toString('utf8');for(const [from,to] of [
 ['stageEntries=[],busy=false;','stageEntries=[],busy=false,pending=false;'],
 ["$('rangeSave').disabled=busy||!startPoint||!endPoint;","$('rangeSave').disabled=busy||pending||!startPoint||!endPoint;"],
 ['  current=c;','  current=c;pending=false;$(\'rangePrompt\').replaceChildren();'],
 ["function accept(role,p){","function accept(role,p){\n  pending=false;"],
 ["const host=$('rangePrompt');\n   host.append", "pending=true;const host=$('rangePrompt');\n   host.append"],
 ["cancel.onclick=()=>host.replaceChildren();", "cancel.onclick=()=>{pending=false;host.replaceChildren();buttons();};"],
 ["if(busy||!startPoint||!endPoint)return;", "if(busy||pending||!startPoint||!endPoint)return;"],
 ["$('rangeReset').onclick=()=>{startPoint", "$('rangeReset').onclick=()=>{pending=false;startPoint"]]){if(!s.includes(from))throw Error('not found '+from);s=s.replace(from,to);}fs.writeFileSync(p,s);}
console.log('Unanswered boundary confirmation disables saving; changing selection clears old prompt');
