'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',repo='G:/somi/JO9sa';
const out='G:/Codex/tmp/girls-2017-split-20261105',root=__dirname;
const put=(p,b)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b);};
const raw=fs.readFileSync(game+'/jack.qsp'),doc=core.parse(raw);
assert.equal(core.hash(raw),'5cbc0fbf858b8102bdc6afe8cdfeb2b07eacfe9329c3c5b1a7623c14ced4cf2e');
assert.ok(core.serialize(doc).equals(raw));
assert.ok(raw.equals(fs.readFileSync(repo+'/assets/runtime/2.4.1/jack.qsp')));
assert.ok(!fs.existsSync(game+'/json/slaves/2340.json'));
assert.ok(!fs.readdirSync(game+'/json/slaves').some(f=>/^0*2340(?:_|\.)/i.test(f)));
const short=fs.readFileSync(game+'/json/slaves/2017.json');
const original=fs.readFileSync('G:/somi/JO9O/game/json/slaves/2017.json');
const long=JSON.parse(original.toString('utf8').replace(/^\uFEFF/,''));
const fields=['fullimage','seed_ava','seed_ava_gray','seed_ava_clear'];
const next={...long};for(const field of fields){assert.ok(next[field].includes('2017_black_long_milf'));next[field]=next[field].replace('2017_black_long_milf','2340_black_long_milf');}
for(const field of Object.keys(long))if(!fields.includes(field))assert.deepEqual(next[field],long[field]);
assert.equal(long.fullmade,'');assert.equal(long.fullmistress,'');assert.equal(long.fullsecretary,'');
const indexRaw=fs.readFileSync(game+'/json/slave_index.json'),index=JSON.parse(indexRaw.toString('utf8').replace(/^\uFEFF/,''));
assert.equal(index.milf_last,2339);const nextIndex={...index,milf_last:2340};
const images=fields.map(field=>{
 const old=long[field].replace(/^content\/pic\//,'')+'.png',target=next[field].replace(/^content\/pic\//,'')+'.png';
 assert.ok(!fs.existsSync(game+'/content/pic/'+target));
 const b=fs.readFileSync(game+'/content/pic/'+old);
 assert.equal(b.subarray(1,4).toString(),'PNG');
 return{field,old,target,bytes:b.length,sha256:core.hash(b),width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
});
const loc=doc.locations.find(l=>l.name==='generate_stock'),body=core.shift(doc.lines[loc.body],5);
const old='if meta_type = 3: stock_type = rand(milf_first, max(milf_last,2338))';
const replacement=[
 '! JO9 MOD START GIRLS_2017_SPLIT_2340_20261105',
 '! Separate the former 2017 long-hair image set; retain saved image paths.',
 'if meta_type = 3: stock_type = rand(milf_first,max(milf_last,2340))',
 '! JO9 MOD END GIRLS_2017_SPLIT_2340_20261105'
].join('\r\n');
assert.equal(body.split(old).length-1,1);
doc.lines[loc.body]=core.shift(body.replace(old,replacement),-5);
const candidate=core.serialize(doc),after=core.hash(candidate);
assert.ok(core.serialize(core.parse(candidate)).equals(candidate));
const reversed=core.parse(candidate),r=reversed.locations.find(l=>l.name==='generate_stock');
reversed.lines[r.body]=core.shift(core.shift(reversed.lines[r.body],5).replace(replacement,old),-5);
assert.ok(core.serialize(reversed).equals(raw));
const patch={id:'2026-11-05_girls_2017_split_2340',description:'Separate long-haired 2017 into independently generated ID 2340; retain short-haired 2017 and old-save image addresses.',before_sha256:core.hash(raw),after_sha256:after,edits:[{location:'generate_stock',field:'body',old,new:replacement,count:1}]};
put(out+'/baseline.qsp',raw);put(out+'/candidate.qsp',candidate);
put(root+'/mods/'+patch.id+'.json',JSON.stringify(patch,null,2)+'\n');
put(root+'/2340.json',JSON.stringify(next,null,2)+'\n');
put(root+'/slave_index.json',JSON.stringify(nextIndex,null,2)+'\n');
const plan={id:patch.id,baseline:patch.before_sha256,candidate:after,old2017JsonSha256:core.hash(short),oldIndexSha256:core.hash(indexRaw),originalLongJsonSha256:core.hash(original),newJsonSha256:core.hash(fs.readFileSync(root+'/2340.json')),images,newBytes:images.reduce((n,f)=>n+f.bytes,0),roundtrip:true,reverseByteIdentical:true,changedLocations:['generate_stock'],fullTouched:false};
put(root+'/plan.json',JSON.stringify(plan,null,2)+'\n');
// Native engine probe: use the actual modified generation line and real JSON loader.
const native=out+'/native',marker='JO9_QA_GIRLS_split_pool_COMPLETE';
const code=[
 'killall',
 "if $fullimage[2017] ! 'girls/full/2017_black_short_milf': msg 'JO9_SPLIT_FAIL_JSON_SHORT' & exit",
 "if $fullimage[2340] ! 'girls/full/2340_black_long_milf': msg 'JO9_SPLIT_FAIL_JSON_LONG' & exit",
 "if $seed_boobs_img[2340] ! 'boobs_CC': msg 'JO9_SPLIT_FAIL_LONG_SEED' & exit",
 "if $fullmade[2340] ! '': msg 'JO9_SPLIT_FAIL_LONG_OUTFIT' & exit",
 'meta_type=3 & milf_first=2340 & milf_last=2339',replacement,
 "if stock_type ! 2340: msg 'JO9_SPLIT_FAIL_SAVED_RANGE' & exit",
 'milf_first=2341 & milf_last=2341',replacement,
 "if stock_type ! 2341: msg 'JO9_SPLIT_FAIL_FUTURE_RANGE' & exit",
 'meta_type=2 & stock_type=1001',replacement,
 "if stock_type ! 1001: msg 'JO9_SPLIT_FAIL_OTHER_GROUP' & exit",
 `msg '${marker}'`
].join('\r\n');
const fixture=Buffer.from(['QSPGAME','','',core.shift('1',-5),core.shift('Start',-5),'',core.shift(code,-5),core.shift('0',-5),''].join('\r\n'),'utf16le');
assert.ok(core.serialize(core.parse(fixture)).equals(fixture));
put(native+'/split-pool.qsp',fixture);
put(native+'/json/slaves/2017.json',short);put(native+'/json/slaves/2340.json',fs.readFileSync(root+'/2340.json'));put(native+'/json/slave_index.json',fs.readFileSync(root+'/slave_index.json'));
put(native+'/config.xml','<game width="640" height="480" title="JO9 character split diagnostic"/>');
put(native+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
put(native+'/plan.json',JSON.stringify([{name:'split-pool',file:native+'/split-pool.qsp',marker,checkpoint:'Actual engine JSON loading and modified mature generation bounds'}],null,2)+'\n');
const saveMarker='JO9_QA_GIRLS_split_save_COMPLETE';
const saveStart=[
 'killall',"$ongload='Loaded'",'milf_last=2339',
 "$fullimage[2340]='' & $seed_ava[2340]='' & $seed_ava_gray[2340]='' & $seed_ava_clear[2340]=''",
 "savegame 'old-range.sav'", "opengame 'old-range.sav'"
].join('\r\n');
const saveLoaded=[
 "if $fullimage[2340] ! 'girls/full/2340_black_long_milf': msg 'JO9_SPLIT_SAVE_JSON_FAIL' & exit",
 "if $seed_ava_clear[2340] ! 'content/pic/girls/face/2340_black_long_milf': msg 'JO9_SPLIT_SAVE_FACE_FAIL' & exit",
 'meta_type=3 & milf_first=2340',replacement,
 "if stock_type ! 2340: msg 'JO9_SPLIT_SAVE_RANGE_FAIL' & exit",`msg '${saveMarker}'`
].join('\r\n');
const saveFixture=Buffer.from(['QSPGAME','','',core.shift('2',-5),...[["Start",saveStart],["Loaded",saveLoaded]].flatMap(([n,s])=>[core.shift(n,-5),'',core.shift(s,-5),core.shift('0',-5)]),''].join('\r\n'),'utf16le');
assert.ok(core.serialize(core.parse(saveFixture)).equals(saveFixture));put(native+'/split-save.qsp',saveFixture);
put(native+'/save-plan.json',JSON.stringify([{name:'split-save',file:native+'/split-save.qsp',marker:saveMarker,checkpoint:'Synthetic old-save arrays and stale range refreshed by actual engine load'}],null,2)+'\n');
console.log(JSON.stringify(plan,null,2));
