'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),qa=require('./release-check.cjs'),core=require('../text-workshop/core.cjs');
function fixture(body){return Buffer.from(['QSPGAME','','',core.shift('1',-5),core.shift('scene',-5),'',core.shift(body,-5),core.shift('0',-5),''].join('\r\n'),'utf16le');}
test('rejects a fully missing newline that comments out a location condition',()=>{assert.throws(()=>qa.inspectWorld(fixture('! JO9 MOD START EXAMPLE\r\nvalue=0\r\n! JO9 MOD END EXAMPLEIF interaction_city=9140:\r\nnpc=1\r\nend')),/marker boundary/i);});
test('rejects a fully missing newline that comments out a battle-menu call',()=>{assert.throws(()=>qa.inspectWorld(fixture("! JO9 MOD START BATTLE\r\nvalue=0\r\n! JO9 MOD END BATTLEgs 'battle_menu'")),/marker boundary/i);});
test('accepts separated markers and permits explicit pipe metadata',()=>{assert.doesNotThrow(()=>qa.inspectWorld(fixture("! JO9 MOD START EXAMPLE\r\nvalue=0\r\n! JO9 MOD END EXAMPLE | documented\r\nif gate=1:\r\nvalue=1\r\nend")));});
test('patch applicator rejects a swallowed command before writing',{skip:process.platform!=='win32'},()=>{
 const fs=require('fs'),path=require('path'),tmp=fs.mkdtempSync(path.join(require('os').tmpdir(),'jo9-joined-guard-')),qsp=path.join(tmp,'world.qsp'),mods=path.join(tmp,'mods');fs.mkdirSync(mods);
 const old="! JO9 MOD START EXAMPLE\r\nvalue=0\r\n! JO9 MOD END EXAMPLE\r\nif gate=1:\r\nvalue=1\r\nend",bad=old.replace('END EXAMPLE\r\nif','END EXAMPLEif'),raw=fixture(old);fs.writeFileSync(qsp,raw);fs.writeFileSync(path.join(mods,'one.json'),JSON.stringify({id:'joined',edits:[{location:'scene',field:'body',old,new:bad,count:1}]}));
 const r=require('child_process').spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.resolve(__dirname,'../apply_mods.ps1'),'-Qsp',qsp,'-ModsDir',mods],{encoding:'utf8',windowsHide:true,timeout:20000});assert.ifError(r.error);assert.notEqual(r.status,0);assert(fs.readFileSync(qsp).equals(raw));assert.equal(fs.readdirSync(tmp).some(x=>x.includes('.bak_')),false);fs.rmSync(tmp,{recursive:true});
});
const {inspectMarkerBoundaries}=require('./check-qsp-marker-boundaries.cjs');
function actionFixture(body){
 const d=core.parse(fixture('value=1')),at=d.locations[0].body-2;
 d.lines[at+3]=core.shift('1',-5);
 d.lines.splice(at+4,0,'',core.shift('Action',-5),core.shift(body,-5));
 return core.serialize(d);
}
test('rejects a START marker joined to a dynamic command',()=>{
 const raw=fixture("\tdynamic $special_part! JO9 MOD START J9TP_NATIVE_TEXT_LOOP_2 | documented\r\nvalue=1\r\n! JO9 MOD END J9TP_NATIVE_TEXT_LOOP_2");
 const r=inspectMarkerBoundaries(raw);assert.equal(r.issues.length,1);assert.equal(r.issues[0].location,'scene');assert.equal(r.issues[0].field,'body');assert.equal(r.issues[0].line,1);assert.equal(r.issues[0].marker,'J9TP_NATIVE_TEXT_LOOP_2');assert.throws(()=>qa.inspectWorld(raw),/marker boundary/i);
});
test('rejects a START marker joined to an inline conditional assignment',()=>{
 assert.throws(()=>qa.inspectWorld(fixture("if gate=1: value += 1! JO9 MOD START CONDITIONAL | documented\r\n! JO9 MOD END CONDITIONAL")),/marker boundary/i);
});
test('rejects a START marker joined after a quoted command argument',()=>{
 assert.throws(()=>qa.inspectWorld(fixture("dynamic 'value=1'! JO9 MOD START QUOTED_ARGUMENT\r\n! JO9 MOD END QUOTED_ARGUMENT")),/marker boundary/i);
});
test('rejects joined START markers in cached code blocks',()=>{
 assert.throws(()=>qa.inspectWorld(fixture("$cached={\r\nvalue=1! JO9 MOD START CACHED\r\n! JO9 MOD END CACHED\r\n}")),/marker boundary/i);
});
test('rejects joined START markers in location action scripts',()=>{
 const raw=actionFixture('value=1! JO9 MOD START ACTION');const r=inspectMarkerBoundaries(raw);
 assert.equal(r.issues.length,1);assert.equal(r.issues[0].field,'action:0');assert.equal(r.issues[0].line,1);assert.throws(()=>qa.inspectWorld(raw),/marker boundary/i);
});
test('accepts marker text inside single double and escaped quoted strings',()=>{
 for(const body of ["$text='value! JO9 MOD START SINGLE'",'$text="value! JO9 MOD START DOUBLE"',"$text='it''s value! JO9 MOD START ESCAPED'"]){assert.doesNotThrow(()=>qa.inspectWorld(fixture(body)));}
});
test('accepts full marker examples inside multiline strings',()=>{
 const body="$text='example\r\n! JO9 MOD START LITERAL\r\nvalue=1! JO9 MOD START ALSO_LITERAL\r\n! JO9 MOD END LITERALgs\r\nexample'";
 assert.doesNotThrow(()=>qa.inspectWorld(fixture(body)));
});
test('accepts START comments after explicit ampersand and colon separators',()=>{
 for(const body of ['value=1 &! JO9 MOD START INLINE | documented','if gate=1: ! JO9 MOD START CONDITIONAL | documented'])assert.doesNotThrow(()=>qa.inspectWorld(fixture(body)));
});
test('accepts marker text embedded within existing comments',()=>{
 for(const body of ['! existing explanation ! JO9 MOD START COMMENT','dynamic $special_part &! note: may modify diligence! JO9 MOD START COMMENT'])assert.doesNotThrow(()=>qa.inspectWorld(fixture(body)));
});
