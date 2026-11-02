'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const v=JSON.parse(fs.readFileSync(__dirname+'/paths.json','utf8')),rec=v.record,game=v.game,backup=v.backup;
a.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),v.after);a.equal(c.hash(fs.readFileSync(v.save)),v.saveHash);const doc=c.parse(fs.readFileSync(game+'/jack.qsp')),b=c.shift(doc.lines[doc.locations.find(x=>x.name==='interaction_city').body],5);
a.equal(b.split('! JO9 MOD START CATFIGHT_CURRENT_NAME_20261031').length-1,2);a.equal(b.split('\r\n').filter(s=>/^\s*\$text\[1\] = \$catfightclub_slave_presentation\[1\]/.test(s)).length,0);
const retained=[];for(const dir of ['red','green','red-small','green-small']){const f=v.tmp+'/'+dir+'/client-results.json';if(fs.existsSync(f)){fs.copyFileSync(f,rec+'/'+dir+'-client-results.json');retained.push(dir);}}
fs.copyFileSync(__filename,rec+'/finish.cjs');
const duplicates=fs.readdirSync(game).filter(n=>n.startsWith('jack.qsp.bak_20261031_'));for(const n of duplicates){const p=game+'/'+n;if(fs.lstatSync(p).isFile()&&c.hash(fs.readFileSync(p))===v.before){a.equal(c.hash(fs.readFileSync(backup+'/before.qsp')),v.before);fs.unlinkSync(p);}}
const roots=[v.tmp,'G:/Codex/tmp/catfight-current-name-release-20261031'];let bytes=0,files=0;
function collect(dir,out){a(!fs.lstatSync(dir).isSymbolicLink(),dir);for(const n of fs.readdirSync(dir)){const p=path.join(dir,n),st=fs.lstatSync(p);a(!st.isSymbolicLink(),p);if(st.isDirectory())collect(p,out);else{a(st.isFile(),p);out.push(p);}}}
for(const root of roots){const abs=path.resolve(root);a.equal(path.dirname(abs),path.resolve('G:/Codex/tmp'));a(['catfight-current-name-20261031','catfight-current-name-release-20261031'].includes(path.basename(abs)));const list=[];collect(abs,list);for(const p of list){bytes+=fs.statSync(p).size;files++;fs.unlinkSync(p);}const removeEmpty=d=>{for(const n of fs.readdirSync(d))removeEmpty(path.join(d,n));fs.rmdirSync(d);};removeEmpty(abs);}
fs.writeFileSync(rec+'/cleanup.json',JSON.stringify({files,bytes,roots,retainedClientResults:retained,backupPreserved:backup+'/before.qsp',originalSaveUnchanged:true,qspHash:v.after},null,2));console.log(JSON.stringify({finished:true,files,bytes,qspHash:v.after,saveUnchanged:true}));
