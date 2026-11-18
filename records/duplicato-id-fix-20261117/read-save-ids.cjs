'use strict';
const fs=require('node:fs'),codec=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
for(const file of process.argv.slice(2)){
 const before=fs.statSync(file),s=codec.parse(fs.readFileSync(file));
 const rows=[];
 for(const v of s.vars){
  const at=v.idx.find(x=>x[1]==='ID')?.[0];
  if(at!==undefined&&v.values[at])rows.push({array:v.name,id:v.values[at][0]});
 }
 const val=(a,k)=>codec.value(s,a,k)[0];
 const after=fs.statSync(file);
 console.log(JSON.stringify({file,slaveState:val('slave_state'),assistantState:val('assistant_state'),slaveId:val('slave','id'),assistantId:val('assistant','id'),rows,sourceUnchanged:before.size===after.size&&before.mtimeMs===after.mtimeMs}));
}
