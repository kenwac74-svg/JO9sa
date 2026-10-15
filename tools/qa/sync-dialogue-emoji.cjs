'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const source='G:/somi/Jack O Nine Tails v2.4_work/game/content/pic/ui/dialogue_emoji';
const targets={repo:'G:/somi/JO9sa/tools/text-workshop/assets/dialogue-emoji',workEditor:'G:/somi/Jack O Nine Tails v2.4_work/game/modtools/text-workshop/assets/dialogue-emoji',fullEditor:'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/modtools/text-workshop/assets/dialogue-emoji'};
const fullGame='G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/content/pic/ui/dialogue_emoji';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const pngs=dir=>fs.readdirSync(dir).filter(n=>/\.png$/i.test(n)).sort();
function inventory(dir){return Object.fromEntries(pngs(dir).map(n=>[n,hash(fs.readFileSync(path.join(dir,n)))]));}
function same(dir,expected){assert.deepEqual(inventory(dir),expected,'Image pack mismatch: '+dir);}
const expected=inventory(source),names=Object.keys(expected);assert.equal(names.length,355,'Unexpected current game pack; audit before adopting');
same(fullGame,expected);
const protectedFiles=[];for(const game of [path.resolve(source,'../../../..'),path.resolve(fullGame,'../../../..')])for(const rel of ['jack.qsp','css/base.css','css/mainScreen.css']){const file=path.join(game,rel);protectedFiles.push({file,sha256:hash(fs.readFileSync(file))});}
const diffs=[];for(const [key,dir]of Object.entries(targets)){assert.deepEqual(pngs(dir),names,'Names differ: '+key);const changed=names.filter(n=>hash(fs.readFileSync(path.join(dir,n)))!==expected[n]);for(const n of changed){const a=fs.readFileSync(path.join(source,n)),b=fs.readFileSync(path.join(dir,n));assert(a.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));assert(a.subarray(16,24).equals(b.subarray(16,24)),'Dimension drift '+n);}diffs.push({key,dir,changed});}
console.log(JSON.stringify({source,gamePacksAlreadyMatch:true,differences:diffs.map(x=>({target:x.key,count:x.changed.length}))}));
if(!process.argv.includes('--apply')){process.exitCode=diffs.some(x=>x.changed.length)?1:0;return;}
const backup='G:/somi/IMGMG/backups/emoji-editor-sync-20261016-'+Date.now();fs.mkdirSync(backup,{recursive:true});const record={source,sourcePolicy:'Current installed game pack is authoritative; never replace it with old editor assets.',backup,before:diffs,sourceHashes:expected,protectedFiles,targets:[],nativeVisualVerified:false};
for(const {key,dir,changed}of diffs){const destBackup=path.join(backup,key);fs.mkdirSync(destBackup,{recursive:true});for(const n of changed){const target=path.join(dir,n);fs.copyFileSync(target,path.join(destBackup,n),fs.constants.COPYFILE_EXCL);assert.equal(hash(fs.readFileSync(path.join(destBackup,n))),hash(fs.readFileSync(target)));const bytes=fs.readFileSync(path.join(source,n));assert.equal(hash(bytes),expected[n]);fs.writeFileSync(target,bytes);assert.equal(hash(fs.readFileSync(target)),expected[n]);}same(dir,expected);record.targets.push({key,dir,matched:355,changed:changed.length});}
same(source,expected);same(fullGame,expected);for(const item of protectedFiles)assert.equal(hash(fs.readFileSync(item.file)),item.sha256);
fs.writeFileSync(path.join(backup,'sync-manifest.json'),JSON.stringify(record,null,2));fs.writeFileSync(path.join(__dirname,'emoji-editor-sync-installed.json'),JSON.stringify(record,null,2));console.log('PASS 355 PNGs across all five roots. Game images, QSP and CSS preserved. Backup '+backup);
