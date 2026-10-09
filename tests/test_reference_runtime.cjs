'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const repo=process.argv[3]||path.resolve(__dirname,'..'),c=require(path.join(repo,'tools/text-workshop/core.cjs'));
const qsp=process.argv[2];a(qsp,'Usage: node tests/test_reference_runtime.cjs GAME/jack.qsp [REPO]');
const raw=fs.readFileSync(qsp),d=c.parse(raw);a(c.serialize(d).equals(raw));
const body=name=>{const l=d.locations.find(x=>x.name===name);a(l,name);return c.shift(d.lines[l.body],5);};
const info=body('jo9_reference_info');
a(!info.replace(/\r\n/g,'').includes('\n'),'Executable reference lines must use CRLF, not bare LF');
const rows=info.split('\r\n');
a.equal(rows.filter(x=>x.startsWith('if $trim(')).length,135);
a.equal(rows.filter(x=>x==='end').length,135);
a(rows.includes('jo9_reference_info_revision = 1'));
for(let i=0;i<rows.length;i++)if(rows[i].startsWith('if $trim(')){a(/^\t\$(npc|place)_info\[/.test(rows[i+1]));a.equal(rows[i+2],'end');}
for(const n of ['#npc_base','#place_base']){const b=body(n);a(b.endsWith("\r\n\r\ngs 'jo9_reference_info'\r\n"),n+' statement delimiter');}
a(body('$newloc').includes("gs 'snk_room_diet_migrate'\r\nif jo9_reference_info_revision < 1: gs 'jo9_reference_info'"),'New-location initialization statements must be separated by CRLF');
console.log('PASS: reference code has 135 separate CRLF blocks and three CRLF-delimited initialization hooks; QSP round trip. This is not a gameplay test.');
