const fs=require('fs'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',rec='G:/somi/JO9sa/records/collar-runtime-test-20261025',src='G:/somi/JO9sa/records/golden-collar-fix-20261025';
fs.mkdirSync(rec+'/scripts',{recursive:true});
if(!process.argv.includes('--verify')){
 const inputs=JSON.parse(fs.readFileSync(src+'/inputs.json','utf8')).map(f=>({path:f.path,sha256:c.hash(fs.readFileSync(f.path))}));inputs.push({path:game+'/jack.qsp',sha256:c.hash(fs.readFileSync(game+'/jack.qsp'))});
 fs.writeFileSync(rec+'/input-hashes.json',JSON.stringify(inputs,null,2)+'\n');console.log('Snapshotted '+inputs.length+' protected inputs');
}else{
 const inputs=JSON.parse(fs.readFileSync(rec+'/input-hashes.json','utf8'));for(const f of inputs)a.equal(c.hash(fs.readFileSync(f.path)),f.sha256,f.path);console.log('Unchanged protected inputs '+inputs.length);
}
