// 장악력 mod를 실제 QSP 엔진(WASM)으로 검증: 대상별 계산, 잔인함 평판 반영, 메인 노예 결과가 패치 전과 같은지
'use strict';
const fs=require('node:fs'),path=require('node:path');
const [pkg,qspA,qspB]=process.argv.slice(2);
const {initQspEngine}=require(path.resolve(pkg,'dist/node/wasm-engine.cjs'));
async function open(qsp){
 const api=await initQspEngine(path.resolve(pkg,'dist/qsp-engine.wasm')),errors=[];api.on('error',e=>errors.push(e));
 for(const ev of ['msg','input','wait','play_file','close_file','is_play','version','menu','view','open_game','save_game','sleep','show_window','refresh','system_cmd'])api.on(ev,(...a)=>{const cb=a.find(x=>typeof x==='function');if(cb)cb(ev==='input'?'':ev==='is_play'?false:ev==='version'?'5.7.0':-1);});
 const raw=fs.readFileSync(qsp);api.openGame(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),true);
 const run=c=>{const n=errors.length;api.execCode(c);if(errors.length>n)throw Error(c.slice(0,80)+' '+JSON.stringify(errors.slice(n)));};
 run("gs '#static_base'");
 return {api,run,num:k=>api.readVariable(k,0)};
}
const setup=(who,v)=>Object.entries(v).map(([k,x])=>`${who}['${k}'] = ${x}`).join('\r\n');
const MASTER="master_cha = 3\r\nmaster_domination = 2\r\nmaster_str = 4\r\nmaster_visage = 1\r\nmaster_haircut = 1\r\nmaster_mood = 1\r\nmagna_magnifika = 0\r\nitem_supermacy_bonus = 0\r\nhero_select = 1\r\n$master_cloth = ''\r\n$master_back_wpn = ''\r\nslave_state = 1";
const SLAVE={temper:2,ego:3,pride:1,stamina:2,intellect:4,beaten_ever:0,age:0};
(async()=>{
 const B=await open(qspB),A=await open(qspA);
 for(const E of [A,B]){E.run(MASTER);E.run(setup('slave',SLAVE));E.run("gs '$calculate_attributes'");}
 console.log('master',['master_cha','master_domination','master_str','master_style'].map(k=>k+'='+A.num(k)).join(' '),'slave',['temper','ego','pride','stamina','intellect'].map(k=>k+'='+A.api.readVariableByKey('slave',k)).join(' '));
 const style=A.num('master_style'),before=B.num('master_supermacy'),after=A.num('master_supermacy');
 console.log('style',style,'메인 노예 패치 전',before,'패치 후',after);if(before!==after)throw Error('메인 노예 결과가 다름');
 const f=t=>{A.run(`jo9_t = func('jo9_supermacy', '${t}')`);return A.num('jo9_t');};
 const M=A.num('master_cha')+A.num('master_domination')+style+A.num('master_str')+A.num('magna_magnifika')+A.num('item_supermacy_bonus');const expect=M-(2+3+1+2+(4-3));console.log('slave 함수',f('slave'),'기대',expect);if(f('slave')!==expect)throw Error('slave');
 A.run('jo9_cruel_mercy = -5');console.log('잔인함 -5, 구타 없음',f('slave'));if(f('slave')!==expect+1)throw Error('cruel');
 A.run("jo9_cruel_mercy = -4");if(f('slave')!==expect)throw Error('cruel -4');
 A.run("jo9_cruel_mercy = -30\r\nslave['beaten_ever'] = 1");console.log('구타 1 + 잔인함 -30',f('slave'));if(f('slave')!==expect+1)throw Error('no double');
 A.run(setup('room1',{temper:5,ego:5,pride:5,stamina:5,intellect:5,beaten_ever:0,age:0}));A.run('jo9_cruel_mercy = 0');
 const r1=f('room1'),er=M-(5+5+5+5+2);console.log('room1',r1,'기대',er,'메인 노예',f('slave'));if(r1!==er)throw Error('room1');
 A.run(setup('cow',{temper:0,ego:1,pride:0,stamina:1,intellect:0,beaten_ever:1,age:2}));console.log('cow',f('cow'));
 // 개인실 노예가 의지가 강하면 메인 노예와 달리 사육이 오르지 않아야 한다: next_day 4808 줄의 조건식만 평가
 A.run("jo9_ok = iif(func('jo9_supermacy', 'room1') > 0, 1, 0)");console.log('room1 사육 조건',A.num('jo9_ok'),'(메인 노예 기준이었다면',f('slave')>0?1:0,')');
 console.log('PASS');
})().catch(e=>{console.error('FAIL',String(e).slice(0,500));process.exit(1);});
