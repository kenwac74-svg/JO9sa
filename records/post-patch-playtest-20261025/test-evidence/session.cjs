'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',root='G:/Codex/tmp/jo9-post-patch-playtest-20261025',rec='G:/somi/JO9sa/records/post-patch-playtest-20261025';
const source=JSON.parse(fs.readFileSync('G:/somi/JO9sa/records/collar-runtime-test-20261025/input-hashes.json','utf8'));
if(!process.argv.includes('--verify')){
 fs.mkdirSync(root,{recursive:true});fs.mkdirSync(rec+'/scripts',{recursive:true});
 const files=source.map(f=>({path:f.path,sha256:c.hash(fs.readFileSync(f.path))}));
 a.equal(files.find(f=>f.path===game+'/jack.qsp').sha256,'a70bd177d8e7ade58243578b2f04745ff00cec3884d26d3b924dfffc8a8d007a');
 fs.writeFileSync(rec+'/inputs.json',JSON.stringify(files,null,2)+'\n');fs.writeFileSync(root+'/source.qsp',fs.readFileSync(game+'/jack.qsp'));
 console.log('Current WORK pinned; '+files.length+' protected files; testing only.');
}else{
 const files=JSON.parse(fs.readFileSync(rec+'/inputs.json','utf8'));for(const f of files)a.equal(c.hash(fs.readFileSync(f.path)),f.sha256,f.path);console.log('Protected files unchanged '+files.length);
}
