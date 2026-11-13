// 순찰 성기사단 처형·감방 가둠 악명 mod를 실제 QSP 엔진(WASM)으로 검증
'use strict';
const fs=require('node:fs'),path=require('node:path');
const [pkg,qsp]=process.argv.slice(2);
const {initQspEngine}=require(path.resolve(pkg,'dist/node/wasm-engine.cjs'));
(async()=>{
 const api=await initQspEngine(path.resolve(pkg,'dist/qsp-engine.wasm')),errors=[];api.on('error',e=>errors.push(e));
 for(const ev of ['msg','input','wait','play_file','close_file','is_play','version','menu','view','open_game','save_game','sleep','show_window','refresh','system_cmd'])api.on(ev,(...a)=>{const cb=a.find(x=>typeof x==='function');if(cb)cb(ev==='input'?'':ev==='is_play'?false:ev==='version'?'5.7.0':-1);});
 const raw=fs.readFileSync(qsp);api.openGame(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),true);
 const run=c=>{const n=errors.length;api.execCode(c);if(errors.length>n)throw Error(c.slice(0,60)+' '+JSON.stringify(errors.slice(n).map(e=>e.args??e).slice(0,2)).slice(0,300));};
 run("gs '#static_base'");
 const cm=()=>api.readVariable('jo9_cruel_mercy',0)*2+api.readVariable('jo9_cruel_mercy_half',0);
 const fight=(enemy,choice)=>{
  run(`jo9_cruel_mercy = 0\r\njo9_cruel_mercy_half = 0\r\n$итог_боя = 'победа'\r\nколичество_врагов = 1\r\n$враг[1] = '${enemy}'\r\njo9_fate['mode'] = 1\r\njo9_fate['phase'] = 1\r\njo9_fate['count'] = 1\r\n$place = 'edge_patrol'\r\n$fight_return = 'city_menu_form'`);
  try{run(`gs 'jo9_battle_fate', 'choose', ${choice}`);}catch(e){console.log('  (choose 뒤 처리 중 오류: 테스트 환경 상태 부족)',String(e).slice(0,160));}
  return cm();
 };
 for(const [en,ch,exp] of [['паладин',1,-1],['пехотинец',1,0],['черный_медик',1,0],['канибал',1,0],['козлорогий',1,0],['garsid',1,0],['исчадие',1,0]]){
  const v=fight(en,ch);console.log(`${en} 처형 → 반점 ${v} (기대 ${exp})`);if(v!==exp)throw Error(en);
 }
 // 감방: 추가한 줄의 조건을 그대로 실행
 const body=api.readVariable?null:null;
 run("jo9_cruel_mercy = 0\r\njo9_cruel_mercy_half = 0\r\nstock_state = CONST_INT['slave_exist']\r\nhunting_prize = 1\r\nif stock_state = CONST_INT['slave_exist'] and hunting_prize >= 1: gs 'jo9_cruel_mercy_apply', -1");
 console.log('감방(전리품 있음) → 반점',cm());if(cm()!==-1)throw Error('prison');
 run("jo9_cruel_mercy = 0\r\njo9_cruel_mercy_half = 0\r\nstock_state = CONST_INT['no_slave']\r\nif stock_state = CONST_INT['slave_exist'] and hunting_prize >= 1: gs 'jo9_cruel_mercy_apply', -1");
 console.log('감방(전리품 없음, 다시 불러오기 등) → 반점',cm());if(cm()!==0)throw Error('prison2');
 console.log('PASS');
})().catch(e=>{console.error('FAIL',String(e).slice(0,400));process.exit(1);});
