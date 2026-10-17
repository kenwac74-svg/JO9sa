'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const core=require('../text-workshop/core.cjs'),{inspect}=require('./check-qsp-line-endings.cjs');
function fixture(body){return Buffer.from(['QSPGAME','',core.shift('',-5),core.shift('1',-5),core.shift('menu_form',-5),'',core.shift(body,-5),core.shift('0',-5),''].join('\r\n'),'utf16le');}
test('detects a loneLF joining an END command to a preceding comment',()=>{const raw=fixture('if menu_form = 2106:\r\n! marker\nend\r\n');const r=inspect(raw);assert.deepEqual(r.issues.map(x=>[x.location,x.line,x.kind]),[['menu_form',2,'loneLF']]);assert.deepEqual(core.serialize(core.parse(raw)),raw);});
test('detects loneCR before an inserted comment while accepting canonical CRLF',()=>{assert.equal(inspect(fixture('else\r! inserted\r\nend')).issues[0].kind,'loneCR');assert.deepEqual(inspect(fixture('else\r\n! inserted\r\nend')).issues,[]);});
test('checks raw bodies including delayed templates without trim or line-ending cleanup',()=>{const r=inspect(fixture('$cached = {\r\n if value = 1:\r! marker\r\n end\r\n}\r\n! next\nend'));assert.deepEqual(r.issues.map(x=>x.kind),['loneCR','loneLF']);});
test('validates an explicit full-world target read-only',()=>{if(!process.env.QSP_VERIFY_TARGET)return;const raw=fs.readFileSync(process.env.QSP_VERIFY_TARGET),r=inspect(raw);assert.deepEqual(r.issues,[]);assert.deepEqual(fs.readFileSync(process.env.QSP_VERIFY_TARGET),raw);});
