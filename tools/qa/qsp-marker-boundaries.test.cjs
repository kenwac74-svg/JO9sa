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
