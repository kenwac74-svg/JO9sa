'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const vendor='G:/Codex/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/outputs/fog-relay-startup-fix-20261017/legacy-engine-probe/package';
const {initQspEngine}=require(vendor+'/dist/node/wasm-engine.cjs');
const source='G:/Codex/tmp/jo9-independent-qa-r2-20261105/qsp/jack.qsp',raw=fs.readFileSync(source),doc=core.parse(raw);
const body=name=>core.shift(doc.lines[doc.locations.find(l=>l.name===name).body],5),enc=s=>core.shift(s,-5),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const fixture=Buffer.from(['QSPGAME','','',enc('2'),enc('Start'),'','',enc('0'),enc('jo9_traits_value'),'',enc(body('jo9_traits_value')),enc('0'),''].join('\r\n'),'utf16le');
(async()=>{
 const api=await initQspEngine(vendor+'/dist/qsp-engine.wasm'),errors=[];
 api.on('error',e=>errors.push(e));api.openGame(fixture.buffer.slice(fixture.byteOffset,fixture.byteOffset+fixture.byteLength),true);
 const run=s=>{const at=errors.length;api.execCode(s.replace(/\r?\n/g,'\r\n'));assert.equal(errors.length,at,JSON.stringify(errors.slice(at)));};
 const num=s=>{run('qa_result='+s);return Number(api.readVariable('qa_result'));};
 const checks=[];
 function check(label,actual,expected){checks.push({label,actual,expected});assert.equal(actual,expected,label);}
 // Explicit accepted-value table; the executed implementation is the candidate's real helper.
 const amounts=[
  {gross:10000,base:[10000,12500,11250],haggle:[10000,15000,12500],market:[10000,100000,150000,55000,80000],auction:[10000,20000,30000,15000,20000]},
  {gross:10003,base:[10003,12503,11253],haggle:[10003,15004,12503],market:[10003,100030,150045,55016,80024],auction:[10003,20006,30009,15004,20006]}
 ];
 for(const a of amounts)for(const difficulty of [0,1,2]){
  run(`difficulty_setting=${difficulty}\ngame_difficulty=${difficulty===2?0:2}\nkillvar 'slave'`);
  check(`base no trait D${difficulty} A${a.gross}`,num(`func('jo9_traits_value','base_price','slave',${a.gross})`),a.base[0]);
  run("slave['jo9_versatile']=1");
  check(`versatile D${difficulty} A${a.gross}`,num(`func('jo9_traits_value','base_price','slave',${a.gross})`),a.base[difficulty===2?2:1]);
  run("slave['jo9_versatile']=0\nslave['virginity']=0\nslave['jo9_peerless']=0");
  check(`haggle no paired trait D${difficulty} A${a.gross}`,num(`func('jo9_traits_value','haggle','slave',${a.gross})`),a.haggle[0]);
  run("slave['virginity']=4\nslave['jo9_peerless']=1");
  check(`haggle paired trait D${difficulty} A${a.gross}`,num(`func('jo9_traits_value','haggle','slave',${a.gross})`),a.haggle[difficulty===2?2:1]);
  for(const mode of ['market','auction'])for(const pair of [[0,0,0],[4,0,1],[0,1,1],[4,1,2]]){
   run(`slave['virginity']=${pair[0]}\nslave['jo9_peerless']=${pair[1]}`);
   const index=pair[2]===0?0:pair[2]+(difficulty===2?2:0);
   check(`${mode} V${pair[0]} P${pair[1]} D${difficulty} A${a.gross}`,num(`func('jo9_traits_value','${mode}','slave',${a.gross})`),a[mode][index]);
  }
 }
 // This is a parser-behavior probe, not a claim that the flagged full locations ran.
 const parserProbes=[];
 for(const [name,code]of [['orphan END','qa_before=1\nend\nqa_after=1'],['orphan ELSE','qa_before=1\nelse\nqa_after=1'],['duplicate ELSE','qa_before=1\nif 0:\nqa_branch=1\nelse\nqa_branch=2\nelse\nqa_branch=3\nend\nqa_after=1']]){
  run("killvar 'qa_before'\nkillvar 'qa_after'\nkillvar 'qa_branch'");const at=errors.length;api.execCode(code.replace(/\n/g,'\r\n'));
  parserProbes.push({name,code,errors:errors.slice(at),before:api.readVariable('qa_before'),after:api.readVariable('qa_after'),branch:api.readVariable('qa_branch')});
 }
 const r={createdAt:new Date().toISOString(),source,inputSha256:hash(raw),engineVersion:api.version(),checks:checks.length,failed:0,assertions:checks,parserProbes,inputUnchanged:hash(fs.readFileSync(source))===hash(raw),limits:['Only the actual jo9_traits_value helper is executed for trait tests.','Fixtures isolate appraisal amount and trait fields; no customer UI, actual acquisition or personal save loading.','Minimal orphan END/ELSE probes characterize the legacy WASM interpreter only, not FastQSP native behavior or every full flagged location.','No game/native EXE launched.']};
 fs.writeFileSync(path.join(__dirname,'trait-and-parser-wasm-results.json'),JSON.stringify(r,null,2)+'\n');
 console.log(JSON.stringify({checks:r.checks,failed:0,engine:r.engineVersion,parserProbes:r.parserProbes,inputUnchanged:r.inputUnchanged}));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
