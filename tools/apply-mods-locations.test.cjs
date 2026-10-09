'use strict';
// Integration checks for append-only QSP locations, existing edits, and pre-write conflicts.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const tool=process.argv[2]||path.join(__dirname,'apply_mods.ps1');
const shift=s=>Buffer.from([...s].map(x=>String.fromCharCode((x.charCodeAt(0)-5)&65535)).join(''),'utf16le').toString('utf16le');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jo9-addloc-test-'));const qsp=path.join(dir,'test.qsp'),mods=path.join(dir,'mods');fs.mkdirSync(mods);
const raw=Buffer.from(['QSPGAME','','',shift('1'),shift('existing'),' ',shift("*p 'before'"),shift('0'),''].join('\r\n'),'utf16le');fs.writeFileSync(qsp,raw);
const mod={id:'fixture',add_locations:[{name:'room_helper',desc:'',body:"*p 'room'",actions:[]}],edits:[{location:'existing',field:'body',old:'before',new:'after',count:1}]};
const save=()=>fs.writeFileSync(path.join(mods,'fixture.json'),JSON.stringify(mod));save();
function run(dry=false){return cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',tool,'-Qsp',qsp,'-ModsDir',mods,...(dry?['-DryRun']:[])],{encoding:'utf8',windowsHide:true});}
let r=run(true);assert.equal(r.status,0,r.stdout+r.stderr);assert(fs.readFileSync(qsp).equals(raw));
r=run();assert.equal(r.status,0,r.stdout+r.stderr);const applied=fs.readFileSync(qsp);assert(!applied.equals(raw));
r=run();assert.equal(r.status,0,r.stdout+r.stderr);assert(fs.readFileSync(qsp).equals(applied));
mod.add_locations[0].body="*p 'conflicting body'";save();r=run();assert.notEqual(r.status,0);assert(fs.readFileSync(qsp).equals(applied));
delete mod.add_locations;mod.edits=[{location:'existing',field:'body',old:'after',new:'legacy-compatible',count:1}];save();r=run();assert.equal(r.status,0,r.stdout+r.stderr);
console.log('PASS: dry run, append + edit, idempotence, conflict no-write, legacy edit-only mod. Fixtures: '+dir);
