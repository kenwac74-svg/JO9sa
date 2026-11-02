'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib'),assert=require('assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',F='G:/somi/Jack O Nine Tails v2.4 Kor_Full/game';
const T='G:/Codex/tmp/build-2.4.1-20261101',B='G:/somi/JO9_work_backups/build-2.4.1-20261101';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs');
const raw=fs.readFileSync(W+'/jack.qsp'),before=c.hash(raw);assert.equal(before,'a11ecde65897ab9c3d7bf736d0f539a35caa243c379e61a73ba6191241ef7755');assert(fs.readFileSync(F+'/jack.qsp').equals(raw));qa.inspectWorld(raw);
assert(!fs.existsSync(T));assert(!fs.existsSync(B));fs.mkdirSync(T+'/mods',{recursive:true});fs.mkdirSync(B,{recursive:true});
fs.writeFileSync(T+'/before.qsp',raw);fs.writeFileSync(B+'/before.qsp.gz',zlib.gzipSync(raw));assert(zlib.gunzipSync(fs.readFileSync(B+'/before.qsp.gz')).equals(raw));
const d=c.parse(raw),edits=[],changes=[];const id='BUILD_2_4_1_CREDITS_20261101';
function edit(loc,old,next,count){const l=d.locations.find(x=>x.name===loc),body=c.shift(d.lines[l.body],5);assert.equal(body.split(old).length-1,count,loc);d.lines[l.body]=c.shift(body.split(old).join(next),-5);edits.push({location:loc,field:'body',old,new:next,count});}
for(const l of d.locations){if(l.name==='credits')continue;const lines=c.shift(d.lines[l.body],5).split('\r\n');const unique=[...new Set(lines.filter(s=>s.includes('2.4.0.0')))];for(const line of unique){const count=lines.filter(s=>s===line).length;const next='! JO9 MOD START '+id+'\r\n'+line.replaceAll('2.4.0.0','2.4.1')+'\r\n! JO9 MOD END '+id;edit(l.name,line,next,count);changes.push({location:l.name,versionOccurrences:count});}}
const cl=d.locations.find(x=>x.name==='credits'),cb=c.shift(d.lines[cl.body],5);const oldStart=cb.indexOf("*nl '잭오나 한글 2.4.0.0 입니다.");assert(oldStart>=0);
const endToken="잭오나 AI 걸팩을 만들어주신 smsfbatalovehandle 님 덕분에 만들 수 있었습니다. 감사합니다. </div>'";
const end=cb.indexOf(endToken,oldStart)+endToken.length;assert(end>endToken.length);
const old=cb.slice(oldStart,end),thanks='<br><br><b>감사드립니다</b><br>PSP_PSP : 인디패치 원작자<br><b>zonezizone</b> : 잭오나 플레이 실황<br>콤콤삼촌 : 허셀2이미지 제공';
const next='! JO9 MOD START '+id+'\r\n'+old.replace('2.4.0.0','2.4.1').replace("감사합니다. </div>'","감사합니다."+thanks+"</div>'")+'\r\n! JO9 MOD END '+id;
edit('credits',old,next,1);changes.push({location:'credits',versionOccurrences:1,thanks:['PSP_PSP : 인디패치 원작자','zonezizone : 잭오나 플레이 실황','콤콤삼촌 : 허셀2이미지 제공']});
const candidate=c.serialize(d),after=c.hash(candidate);qa.inspectWorld(candidate);
const all=d.locations.map(l=>c.shift(d.lines[l.body],5)).join('\r\n');assert(!all.includes('2.4.0.0'));assert.equal(all.split("$code_rev = '2.4.1'").length-1,2);assert.equal(c.shift(d.lines[d.locations.find(l=>l.name==='init_game').body],5).includes('game_version = 0'),true);
const patch={id:'2026-11-01_build_2_4_1_credits',description:'Set Korean game build display to2.4.1 and add the three requested thanks entries; preserve gameplay values, IDs, saves, existing author credits and runtime paths.',before_sha256:before,after_sha256:after,edits};
fs.writeFileSync(T+'/mods/'+patch.id+'.json',JSON.stringify(patch,null,2)+'\n');fs.writeFileSync(__dirname+'/patch.json',JSON.stringify(patch,null,2)+'\n');fs.writeFileSync(T+'/candidate.qsp',candidate);
const configs=[];for(const root of [W,F]){const b=fs.readFileSync(root+'/config.xml');assert.equal(b[0],255);assert.equal(b[1],254);const text=b.toString('utf16le');assert.equal(text.split('2.4.0.0').length-1,1);const converted=Buffer.from(text.replace('2.4.0.0','2.4.1'),'utf16le');configs.push({path:root+'/config.xml',beforeSha256:c.hash(b),afterSha256:c.hash(converted),beforeBytes:b.length,afterBytes:converted.length});fs.writeFileSync(B+'/'+(root===W?'work':'full')+'-config.xml',b);fs.writeFileSync(T+'/'+(root===W?'work':'full')+'-config.xml',converted);}
const report={version:'2.4.1',before,after,candidate:T+'/candidate.qsp',baseline:T+'/before.qsp',modsDir:T+'/mods',backup:B,patch:patch.id,changedLocations:changes,versionOccurrences:changes.reduce((s,x)=>s+x.versionOccurrences,0),configs,sourceRechecked:c.hash(fs.readFileSync(W+'/jack.qsp'))===before,fullRechecked:c.hash(fs.readFileSync(F+'/jack.qsp'))===before,gameplayLocationsUnchanged:d.locations.filter(l=>!changes.some(x=>x.location===l.name)).length,saveSchemaChanged:false};fs.writeFileSync(__dirname+'/prepared.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
