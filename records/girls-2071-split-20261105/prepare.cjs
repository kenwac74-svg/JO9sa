'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',repo='G:/somi/JO9sa';
const root=__dirname,tmp='G:/Codex/tmp/girls-2071-split-20261105';
const put=(p,b)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b);};
const raw=fs.readFileSync(game+'/jack.qsp'),doc=c.parse(raw),baseline=c.hash(raw);
assert.equal(baseline,'5cbc0fbf858b8102bdc6afe8cdfeb2b07eacfe9329c3c5b1a7623c14ced4cf2e');
assert.ok(c.serialize(doc).equals(raw));assert.ok(raw.equals(fs.readFileSync(repo+'/assets/runtime/2.4.1/jack.qsp')));
assert.ok(!fs.readdirSync(game+'/json/slaves').some(n=>/^0*2340(?:_|\.)/i.test(n)));
const originalRaw=fs.readFileSync('G:/somi/JO9O/game/json/slaves/2071.json');
const original=JSON.parse(originalRaw.toString('utf8').replace(/^\uFEFF/,'')),next={...original};
const fields=['fullimage','seed_ava','seed_ava_gray','seed_ava_clear'];
for(const f of fields){assert.ok(original[f].includes('2071_blond_short_milf'));next[f]=original[f].replace('2071_blond_short_milf','2340_blond_short_milf');}
for(const f of Object.keys(original))if(!fields.includes(f))assert.deepEqual(next[f],original[f]);
assert.ok(next.fullmade===''&&next.fullsecretary===''&&next.fullmistress==='');
const images=fields.map(field=>{
 const old=original[field].replace(/^content\/pic\//,'')+'.png',target=next[field].replace(/^content\/pic\//,'')+'.png';
 assert.ok(!fs.existsSync(game+'/content/pic/'+target));const b=fs.readFileSync(game+'/content/pic/'+old);
 assert.equal(b.subarray(1,4).toString(),'PNG');return{field,old,target,bytes:b.length,sha256:c.hash(b),width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
});
const protectedJson={};for(const id of [2017,2071,2324])protectedJson[id]=c.hash(fs.readFileSync(game+'/json/slaves/'+id+'.json'));
const blue=JSON.parse(fs.readFileSync(game+'/json/slaves/2324.json'));
assert.equal(blue.fullimage,'girls/full/2324_blue_short_milf');
for(const f of fields){const p=game+'/content/pic/'+blue[f].replace(/^content\/pic\//,'')+'.png';assert.ok(fs.existsSync(p));}
const indexRaw=fs.readFileSync(game+'/json/slave_index.json'),index=JSON.parse(indexRaw);assert.equal(index.milf_last,2339);
const old='if meta_type = 3: stock_type = rand(milf_first, max(milf_last,2338))';
const replacement=[
 '! JO9 MOD START GIRLS_2071_SPLIT_2340_20261105',
 '! Restore the original blond character separately; blue is already registered as 2324.',
 'if meta_type = 3: stock_type = rand(milf_first, max(milf_last,2340))',
 '! JO9 MOD END GIRLS_2071_SPLIT_2340_20261105'
].join('\r\n');
const l=doc.locations.find(x=>x.name==='generate_stock'),body=c.shift(doc.lines[l.body],5);assert.equal(body.split(old).length-1,1);
doc.lines[l.body]=c.shift(body.replace(old,replacement),-5);const candidate=c.serialize(doc);assert.ok(c.serialize(c.parse(candidate)).equals(candidate));
const rev=c.parse(candidate),rl=rev.locations.find(x=>x.name==='generate_stock');rev.lines[rl.body]=c.shift(c.shift(rev.lines[rl.body],5).replace(replacement,old),-5);assert.ok(c.serialize(rev).equals(raw));
const patch={id:'2026-11-05_girls_2071_split_2340',description:'Restore original blond 2071 as 2340; keep brown 2071 and previously registered blue 2324 independent.',before_sha256:baseline,after_sha256:c.hash(candidate),edits:[{location:'generate_stock',field:'body',old,new:replacement,count:1}]};
put(root+'/mods/'+patch.id+'.json',JSON.stringify(patch,null,2)+'\n');put(root+'/2340.json',JSON.stringify(next,null,2)+'\n');put(tmp+'/candidate.qsp',candidate);put(tmp+'/baseline.qsp',raw);
const plan={id:patch.id,baseline,candidate:patch.after_sha256,newId:2340,existingBlueId:2324,protectedJson,oldIndexSha256:c.hash(indexRaw),originalJsonSha256:c.hash(originalRaw),newJsonSha256:c.hash(fs.readFileSync(root+'/2340.json')),images,roundtrip:true,reverseByteIdentical:true,fullTouched:false};
put(root+'/plan.json',JSON.stringify(plan,null,2)+'\n');
// The installed engine reloads JSON on KILLALL, as normal game startup does.
const dir=tmp+'/native',marker='JO9_QA_GIRLS_split_characters_COMPLETE';
const code=['killall',
 "if $fullimage[2071] ! 'girls/full/2071_brown_long_milf': msg 'JO9_SPLIT_BROWN_FAIL' & exit",
 "if $fullimage[2324] ! 'girls/full/2324_blue_short_milf': msg 'JO9_SPLIT_BLUE_FAIL' & exit",
 "if $fullimage[2340] ! 'girls/full/2340_blond_short_milf': msg 'JO9_SPLIT_BLOND_FAIL' & exit",
 "if $seed_boobs_img[2340] ! 'boobs_C': msg 'JO9_SPLIT_ORIGINAL_SEED_FAIL' & exit",
 'meta_type=3 & milf_first=2340 & milf_last=2339',replacement,
 "if stock_type ! 2340: msg 'JO9_SPLIT_OLD_RANGE_FAIL' & exit",
 'milf_first=2341 & milf_last=2341',replacement,
 "if stock_type ! 2341: msg 'JO9_SPLIT_FUTURE_RANGE_FAIL' & exit",
 'meta_type=2 & stock_type=1001',replacement,
 "if stock_type ! 1001: msg 'JO9_SPLIT_OTHER_GROUP_FAIL' & exit"];
for(const [id,stem] of [[2324,'2324_blue_short_milf'],[2340,'2340_blond_short_milf']])for(const role of ['fullmade','fullsecretary','fullmistress']){
 code.push(`$probe=func('jo9_seed_role_images','resolve',${id},'', '${role}')`,`if $probe ! 'girls/full/${stem}': msg 'JO9_SPLIT_FALLBACK_${id}_${role}_FAIL' & exit`);
}
code.push("$probe=func('jo9_seed_role_images','resolve',2071,'','fullmade')","if $probe ! 'girls/full/cloth/2071_brown_long_milf': msg 'JO9_SPLIT_BROWN_OUTFIT_FAIL' & exit",`msg '${marker}'`);
const helper=c.shift(doc.lines[doc.locations.find(x=>x.name==='jo9_seed_role_images').body],5);
const fixture=Buffer.from(['QSPGAME','','',c.shift('2',-5),...[["Start",code.join('\r\n')],["jo9_seed_role_images",helper]].flatMap(([n,s])=>[c.shift(n,-5),'',c.shift(s,-5),c.shift('0',-5)]),''].join('\r\n'),'utf16le');
assert.ok(c.serialize(c.parse(fixture)).equals(fixture));put(dir+'/split-2071.qsp',fixture);
for(const id of [2017,2071,2324])put(dir+'/json/slaves/'+id+'.json',fs.readFileSync(game+'/json/slaves/'+id+'.json'));
put(dir+'/json/slaves/2340.json',fs.readFileSync(root+'/2340.json'));put(dir+'/json/slave_index.json',JSON.stringify({...index,milf_last:2340}));
for(const rel of ['girls/full/2071_brown_long_milf.png','girls/full/cloth/2071_brown_long_milf.png','girls/full/cloth/2071_blue_short_milf.png','girls/full/2324_blue_short_milf.png'])put(dir+'/content/pic/'+rel,fs.readFileSync(game+'/content/pic/'+rel));
for(const f of images)put(dir+'/content/pic/'+f.target,fs.readFileSync(game+'/content/pic/'+f.old));
put(dir+'/config.xml','<game width="640" height="480" title="JO9 2071 split diagnostic"/>');put(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
put(dir+'/plan.json',JSON.stringify([{name:'split-characters',file:dir+'/split-2071.qsp',marker,checkpoint:'Actual JSON identities, original gold seed, pool bounds, six absent-outfit fallbacks and existing brown outfit'}],null,2)+'\n');
console.log(JSON.stringify({prepared:true,newId:2340,existingBlueId:2324,newImages:images.length,baseline,candidate:plan.candidate,workWritten:false}));
