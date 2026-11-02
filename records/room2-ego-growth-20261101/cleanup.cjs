'use strict';
// Task-owned diagnostics only. Never traverse content/css/json/font junctions or erase saves.
const fs=require('fs'),path=require('path'),z=require('zlib'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const R='G:/somi/JO9sa/records/room2-ego-growth-20261101',B='G:/somi/JO9_work_backups/room2-ego-growth-20261101',T='G:/Codex/tmp/room2-ego-growth-20261101';
const meta=JSON.parse(fs.readFileSync(R+'/installed.json'));a.equal(meta.releaseVerdict,'PASS');
a.equal(c.hash(z.gunzipSync(fs.readFileSync(B+'/before.qsp.gz'))),meta.before,'verified minimal recovery backup');
const roots=[T,T+'-native',T+'-release'];
let deletedBytes=0,deletedFiles=0,unlinkedJunctions=0;const preserved=[],resolvedRoots=[];
function bounded(p,root){const rp=path.resolve(p),rr=path.resolve(root);a(rp===rr||rp.startsWith(rr+path.sep),'path outside task '+rp);return rp;}
function collect(p,root,label){bounded(p,root);const st=fs.lstatSync(p);if(st.isSymbolicLink())return;if(st.isDirectory()){for(const n of fs.readdirSync(p))collect(path.join(p,n),root,label);return;}
 const rel=path.relative(root,p),ext=path.extname(p).toLowerCase();if(!['.json','.log','.md','.sav'].includes(ext)||rel.toLowerCase().includes('client'+path.sep+'json'+path.sep))return;
 const out=path.join(R,ext==='.sav'?'diagnostic-saves':'diagnostic-logs',label,rel);bounded(out,R);fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(p,out);a.equal(c.hash(fs.readFileSync(p)),c.hash(fs.readFileSync(out)));preserved.push({path:out,bytes:st.size});}
function remove(p,root){bounded(p,root);const st=fs.lstatSync(p);if(st.isSymbolicLink()){try{fs.unlinkSync(p);}catch(e){if(!['EPERM','EISDIR'].includes(e.code))throw e;fs.rmdirSync(p);}unlinkedJunctions++;return;}
 if(st.isDirectory()){for(const n of fs.readdirSync(p))remove(path.join(p,n),root);fs.rmdirSync(p);return;}
 if(path.extname(p).toLowerCase()==='.sav'){const rel=path.relative(root,p),label=path.basename(root),out=path.join(R,'diagnostic-saves',label,rel);a(fs.existsSync(out));a.equal(c.hash(fs.readFileSync(p)),c.hash(fs.readFileSync(out)));}
 fs.unlinkSync(p);deletedFiles++;deletedBytes+=st.size;}
for(const root of roots){const abs=path.resolve(root);a.equal(path.dirname(abs).toLowerCase(),path.resolve('G:/Codex/tmp').toLowerCase());a(path.basename(abs).startsWith('room2-ego-growth-20261101'));if(!fs.existsSync(abs))continue;a(!fs.lstatSync(abs).isSymbolicLink());resolvedRoots.push(abs);collect(abs,abs,path.basename(abs));remove(abs,abs);a(!fs.existsSync(abs));}
const log=fs.readFileSync(R+'/install.log','utf8'),m=log.match(/([A-Za-z]:[\\/][^\r\n]*jack\.qsp\.bak_\d{8}_\d{6})/);
let redundantApplyBackup=null;if(m){const file=path.resolve(m[1].trim()),game=path.resolve('G:/somi/Jack O Nine Tails v2.4_work/game');a.equal(path.dirname(file),game);a(/^jack\.qsp\.bak_\d{8}_\d{6}$/.test(path.basename(file)));a(!fs.lstatSync(file).isSymbolicLink());a.equal(c.hash(fs.readFileSync(file)),meta.before);const bytes=fs.statSync(file).size;fs.unlinkSync(file);deletedBytes+=bytes;deletedFiles++;redundantApplyBackup={path:file,bytes,compressedRecovery:B+'/before.qsp.gz'};}
const report={resolvedRoots,deletedBytes,deletedFiles,unlinkedJunctions,preserved,uniqueSaveFilesErased:false,redundantApplyBackup,backupVerified:true};
fs.writeFileSync(R+'/cleanup.json',JSON.stringify(report,null,2)+'\n');fs.writeFileSync(__dirname+'/cleanup.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({deletedMiB:Math.round(deletedBytes/1048576),deletedFiles,unlinkedJunctions,preserved:preserved.length,backupVerified:true}));
