'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const {initQspEngine}=require('G:/somi/JO9sa/tools/modding-hub/vendor/qsp/wasm-engine.cjs');
const source=process.argv[2]||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',raw=fs.readFileSync(source),doc=core.parse(raw);
const body=name=>core.shift(doc.lines[doc.locations.find(loc=>loc.name===name).body],5);
const city=body('interaction_city'),start=city.indexOf('IF interaction_city = 6028:'),end=city.indexOf('! JO9 MOD END PRISCILLA_REWARD_CHOICE_20261116',start);
assert(start>=0&&end>start);
const scene=city.slice(start,end),screen=body('interaction_screen_city').split('\r\n').slice(56,59).join('\r\n');
assert(screen.includes('dynamic $special_action[txt]'));
const bodies=new Map([['Start','exit'],['qa_scene',scene],['qa_screen',screen],['$moodlets_account',body('$moodlets_account')],['snk_room_bridge','exit']]);
const lines=['QSPGAME','','',core.shift(String(bodies.size),-5)];
for(const [name,text]of bodies)lines.push(core.shift(name,-5),'',core.shift(text,-5),core.shift('0',-5));lines.push('');
const fixture=Buffer.from(lines.join('\r\n'),'utf16le');
console.log=()=>{};
(async()=>{
 const api=await initQspEngine('G:/somi/JO9sa/tools/modding-hub/vendor/qsp/qsp-engine.wasm'),errors=[],checks=[];
 api.on('error',error=>errors.push(error));api.on('msg',(_text,done)=>done());
 for(const event of ['main_changed','stats_changed','actions_changed','objects_changed','timer','refresh','show_window','panel_visibility','close_file'])api.on(event,()=>{});
 api.openGame(fixture.buffer.slice(fixture.byteOffset,fixture.byteOffset+fixture.byteLength),true);
 const num=name=>Number(api.readVariable(name));
 const run=code=>{const before=errors.length;api.execCode(code.replace(/\r?\n/g,'\r\n'));assert.equal(errors.length,before,JSON.stringify(errors.slice(before)));};
 const reset=(rate,good,bad)=>run(`killall\r\ninteraction_city=6028\r\nmaster_mood_rate=${rate}\r\n$master_good_mood[0]='positive0'\r\n$master_good_mood[1]='positive1'\r\n$master_bad_mood[0]='negative0'\r\n$master_bad_mood[1]='negative1'\r\nmaster_moodlet['positive0']=${good}\r\nmaster_moodlet['positive1']=${good}\r\nmaster_moodlet['negative0']=${bad}\r\nmaster_moodlet['negative1']=${bad}\r\ngs '$moodlets_account'\r\ngs 'qa_scene'`);
 function check(name,fn){try{fn();checks.push({name,pass:true});}catch(error){checks.push({name,pass:false,error:error.message});}}
 check('pages 1 through 6 do not award the completion flag or change mood rate',()=>{reset(7,3,4);const mood=num('master_mood');for(let page=1;page<=6;page++){run(`txt=${page}\r\ngs 'qa_screen'`);assert.equal(num('priscilla_slv'),0);assert.equal(num('master_mood_rate'),7);assert.equal(num('master_mood'),mood);}});
 for(const [name,rate,good,bad]of [['mixed moodlets',7,3,4],['severely negative rate',-300,0,9],['already high rate',200,5,0]])check('last page gives ecstasy and flag and survives refresh: '+name,()=>{
  reset(rate,good,bad);run("txt=7\r\ngs 'qa_screen'");assert.equal(num('priscilla_slv'),1);assert.equal(num('master_mood'),5);assert.equal(num('master_mood_plus'),5);assert.ok(num('master_mood_rate')>=rate);
  for(const [key,value]of [['positive0',good],['positive1',good],['negative0',bad],['negative1',bad]])assert.equal(Number(api.readVariableByKey('master_moodlet',key)),value);
  const after=num('master_mood_rate');run("gs '$moodlets_account'");assert.equal(num('master_mood'),5);
  run("gs 'qa_screen'");assert.equal(num('master_mood_rate'),after);assert.equal(num('priscilla_slv'),1);
 });
 check('another reward branch does not acquire the completion flag',()=>{reset(0,0,0);run("killvar '$special_action'\r\ninteraction_city=6027\r\ngs 'qa_scene'\r\ntxt=7\r\ngs 'qa_screen'");assert.equal(num('priscilla_slv'),0);assert.equal(num('master_mood_rate'),0);});
 const result={phase:process.argv[2]?'GREEN':'RED',source,sha256:core.hash(raw),engine:'QSP WASM 5.8.0',checks,passed:checks.filter(check=>check.pass).length,total:checks.length,errors,limits:['Uses the exact 6028 branch, the actual page callback dispatch, and existing mood accounting.','The rest of scene rendering and full home UI are not executed.','Existing daily reset of master_mood_rate is unchanged; visual play remains unverified.']};
 fs.writeFileSync(path.join(__dirname,result.phase.toLowerCase()+'.json'),JSON.stringify(result,null,2)+'\n');process.stdout.write(JSON.stringify({phase:result.phase,passed:result.passed,total:result.total,errors,failed:checks.filter(check=>!check.pass)})+'\n');if(result.passed!==result.total||errors.length)process.exitCode=1;
})().catch(error=>{process.stderr.write(error.stack+'\n');process.exitCode=1;});
