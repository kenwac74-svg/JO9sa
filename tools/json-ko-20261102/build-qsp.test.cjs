'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../text-workshop/core.cjs');
const builder=require('./build-qsp.cjs');
const native=(name,body)=>[core.shift(name,-5),'',core.shift(body,-5),core.shift('0',-5)];
function fixture(){
 const locations=[
  native('Start',"msg 'unchanged'"),
  native('#dynamic',"$voice_native_stored = {\r\n $result=$args[1]\r\n $jo9_vns_group=''\r\n if $args[1]=$family_description['tribe']: jo9_vns_matches+=1\r\n if jo9_vns_matches=1: $result=$dyneval($voice_native,$jo9_vns_group,$args[1])\r\n}"),
  native('interaction',"if instr($voice_native,'VOICE_ARGON_NATIVE_V5')=0 or $voice_native_stored='' or $voice_native_moods='': gs '#dynamic'"),
  native('origins_relations',"snk_origin_relation = slave1['relative_id'] > 0 and slave2['id'] > 0\r\n$snk_origin_relation_body = '<br>' + $slave1['relative_relations']\r\nif snk_origin_relation: $text[2] = $snk_origin_relation_body")
 ];
 return Buffer.from(['QSPGAME','','',core.shift(String(locations.length),-5),...locations.flat(),''].join('\r\n'),'utf16le');
}
const sample=[{old:"  She's my sister.  ",new:'제 자매예요.<!-- #nwtx -->'},{old:'中文 <<literal>>',new:"번역 '문구' <<literal>><!-- #nwtx -->"}];
test('exact raw variants remain distinct; conflicting mappings are rejected',()=>{
 assert.equal(builder.normalizeMap({schema:1,entries:sample}).length,2);
 assert.equal(builder.normalizeMap([{old:'x',new:'가'},{old:'x',new:'가'}]).length,1);
 assert.throws(()=>builder.normalizeMap([{old:'x',new:'가'},{old:'x',new:'나'}]),/Conflicting/);
 assert.throws(()=>builder.normalizeMap([{old:'',new:'가'}]),/empty/);
 assert.throws(()=>builder.normalizeMap([{old:'line\nraw',new:'가'}]),/line break/);
});
test('QSP literals escape apostrophes and preserve interpolation-looking text literally',()=>{
 assert.equal(builder.qspText("She's here."),"'She''s here.'");
 assert.equal(builder.qspText('中文 <<literal>>'),"'中文 <'+'<literal>>'");
 assert.doesNotMatch(builder.qspText('<<<<name>>'),/<<|\r|\n/);
});
test('candidate changes only three declared bodies and adds one display adapter',()=>{
 const raw=fixture(),result=builder.build(raw,{entries:sample});
 const before=core.parse(raw),after=core.parse(result.raw);
 assert.equal(after.locations.length,before.locations.length+1);
 assert.equal(core.serialize(after).equals(result.raw),true);
 assert.equal(result.patch.edits.length,3);
 assert.deepEqual(result.patch.add_locations.map(x=>x.name),['jo9_json_ko']);
 const body=(d,n)=>core.shift(d.lines[d.locations.find(x=>x.name===n).body],5);
 assert.equal(body(after,'Start'),body(before,'Start'));
 const changed=after.locations.filter(x=>x.name!=='jo9_json_ko'&&body(after,x.name)!==body(before,x.name)).map(x=>x.name);
 assert.deepEqual(changed,['#dynamic','interaction','origins_relations']);
 assert.match(body(after,'#dynamic'),/\$result=func\('jo9_json_ko', 'text', \$args\[1\]\)/);
 assert.match(body(after,'#dynamic'),/\$args\[1\]=\$family_description\['tribe'\]/);
 assert.match(body(after,'#dynamic'),/\$dyneval\(\$voice_native,\$jo9_vns_group,\$args\[1\]\)/);
 assert.match(body(after,'interaction'),/instr\(\$voice_native_stored,'jo9_json_ko'\)=0/);
 assert.match(body(after,'origins_relations'),/snk_origin_relation = slave1\['relative_id'\] > 0 and slave2\['id'\] > 0/);
 const helper=body(after,'jo9_json_ko');
 assert.match(helper,/\$result=\$args\[1\]/);
 assert.match(helper,/if \$args\[1\]='  She''s my sister\.  '/);
 assert.doesNotMatch(helper,/trim\(|copyarr|killvar|\$slave|\$assistant|SAVEGAME/i);
 assert.equal(result.patch.before_sha256,core.hash(raw));
 assert.equal(result.patch.after_sha256,core.hash(result.raw));
 for(const l of after.locations)assert.doesNotMatch(body(after,l.name),/\r(?!\n)|(?<!\r)\n/);
});
test('ambiguous or already patched source is rejected before producing a candidate',()=>{
 const raw=fixture(),result=builder.build(raw,{entries:sample});
 assert.throws(()=>builder.build(result.raw,{entries:sample}),/already|exists/i);
 const d=core.parse(raw);d.lines[d.locations.find(x=>x.name==='interaction').body]=core.shift('no matching cache guard',-5);
 assert.throws(()=>builder.build(core.serialize(d),{entries:sample}),/interaction/);
});
module.exports={fixture,sample};
