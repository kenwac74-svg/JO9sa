const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const src='G:/somi/Jack O Nine Tails v2.4_work',root='G:/Codex/tmp/jo9-button-runtime-20261024',game=root+'/game';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert(!fs.existsSync(root),'Test root already exists');
fs.mkdirSync(game+'/save',{recursive:true});
const protectedFiles=[src+'/game/jack.qsp',src+'/game/FastQSP.ini',src+'/FastQSP.ini',...fs.readdirSync(src+'/game/save').filter(n=>/\.sav$/i.test(n)).map(n=>src+'/game/save/'+n)];
const manifest={source:src,root,qspSha256:hash(src+'/game/jack.qsp'),protected:protectedFiles.map(p=>({path:p,sha256:hash(p)})),createdAt:new Date().toISOString(),saveCopies:[]};
assert.equal(manifest.qspSha256,'bf3c77ae27fde193c2ca3e2f7733c96f99b75bb40eeb22a61c3491f6db618d9f');
for(const n of ['jack.qsp','config.xml','icon.ico'])fs.copyFileSync(src+'/game/'+n,game+'/'+n);
for(const n of ['engine','css','fonts','json'])fs.cpSync(src+'/game/'+n,game+'/'+n,{recursive:true});
fs.symlinkSync(src+'/game/content',game+'/content','junction');
fs.copyFileSync(src+'/Jack-o-nine-tails.exe',root+'/Jack-o-nine-tails.exe');
for(const p of [root+'/FastQSP.ini',game+'/FastQSP.ini'])fs.writeFileSync(p,'[General]\r\nignoreCRC=true\r\nmutedState=true\r\nAutosaveWhenExiting=false\r\n');
for(const n of ['JO9_TEST_20261023_11_SIZE0.sav','JO9_TEST_20261023_16_AUTO-SLAVE.sav','JO9_TEST_20261023_17_AUTO-ASSISTANT.sav']){fs.copyFileSync(src+'/game/save/'+n,game+'/save/'+n);manifest.saveCopies.push({name:n,sha256:hash(game+'/save/'+n)});}
fs.writeFileSync(root+'/manifest.json',JSON.stringify(manifest,null,2));
console.log(JSON.stringify({root,exactProductionQsp:hash(game+'/jack.qsp')===manifest.qspSha256,saveCopies:manifest.saveCopies.length,protectedFiles:manifest.protected.length}));
