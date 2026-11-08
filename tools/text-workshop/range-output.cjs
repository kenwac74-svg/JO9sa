'use strict';
// JO9 MOD START RANGE_OUTPUT_20261108: exact generated script, local-only output.
const fs=require('node:fs'),path=require('node:path');
function save(runtime,id,result){
 if(!/^[a-f0-9]{16}$/.test(id)||result?.status!=='ready'||typeof result.text!=='string'||!result.text.trim())throw Error('완성된 각본만 저장할 수 있습니다.');
 const dir=path.join(runtime,'script-exports');fs.mkdirSync(dir,{recursive:true});
 const fileName='JO9_각본_'+id+'.txt',savedPath=path.resolve(dir,fileName);
 fs.writeFileSync(savedPath,'\uFEFF'+result.text.replace(/\r?\n/g,'\r\n'),{encoding:'utf8',flag:'wx'});
 return {savedPath,fileName};
}
module.exports={save};
// JO9 MOD END RANGE_OUTPUT_20261108
