const fs=require('node:fs'),a=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const src='G:/somi/Jack O Nine Tails v2.4_work',root='G:/Codex/tmp/jo9-asset-runtime-20261024',game=root+'/game';
a(!fs.existsSync(root));fs.mkdirSync(game+'/save',{recursive:true});
const files=[src+'/game/jack.qsp',src+'/game/FastQSP.ini',src+'/FastQSP.ini',...fs.readdirSync(src+'/game/save').filter(n=>/\.sav$/i.test(n)).map(n=>src+'/game/save/'+n)];
const m={source:src,root,qspSha256:c.hash(fs.readFileSync(src+'/game/jack.qsp')),protected:files.map(p=>({path:p,sha256:c.hash(fs.readFileSync(p))})),createdAt:new Date().toISOString(),saveCopies:[]};
a.equal(m.qspSha256,'bf3c77ae27fde193c2ca3e2f7733c96f99b75bb40eeb22a61c3491f6db618d9f');
for(const n of ['jack.qsp','config.xml','icon.ico'])fs.copyFileSync(src+'/game/'+n,game+'/'+n);
for(const n of ['engine','css','fonts','json'])fs.cpSync(src+'/game/'+n,game+'/'+n,{recursive:true});
fs.symlinkSync(src+'/game/content',game+'/content','junction');
for(const p of [root+'/FastQSP.ini',game+'/FastQSP.ini'])fs.writeFileSync(p,'[General]\r\nignoreCRC=true\r\nmutedState=true\r\nAutosaveWhenExiting=false\r\n');
for(const n of ['07_ASSETS','08_SETTLE','09_OCCUPIED','10_QUICK-SALE']){const name='JO9_TEST_20261023_'+n+'.sav';fs.copyFileSync(src+'/game/save/'+name,game+'/save/'+name);m.saveCopies.push({name,sha256:c.hash(fs.readFileSync(game+'/save/'+name))});}
fs.writeFileSync(root+'/manifest.json',JSON.stringify(m,null,2));console.log(JSON.stringify({root,sha256:m.qspSha256,protected:files.length,saveCopies:m.saveCopies.length}));
