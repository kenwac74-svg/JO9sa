// 패키지 jack.qsp의 #dynamic에서 장비 툴팁 보조 코드를 WASM 엔진으로 실행해 보는 검사 (인자: 패키지 폴더 또는 jack.qsp 경로)
const fs=require('fs'),path=require('path'),assert=require('assert');
const vendor=path.resolve(__dirname,'../audits/reward-diagnostic/vendor-legacy/package');
const {initQspEngine}=require(path.join(vendor,'dist/node/wasm-engine.cjs'));
(async()=>{
 const api=await initQspEngine(path.join(vendor,'dist/qsp-engine.wasm'));const errors=[];
 api.on('error',e=>errors.push(e));
 for(const ev of ['msg','input','wait','play_file','close_file','is_play','version','menu','main_changed','stats_changed','actions_changed','objects_changed'])api.on(ev,(...a)=>{const cb=a.find(x=>typeof x==='function');if(cb)cb(ev==='input'?'':ev==='is_play'?false:ev==='version'?'5.7.0':-1)});
 const arg=process.argv[2], file=fs.statSync(arg).isDirectory()?path.join(arg,'payload/jack.qsp'):arg;
 const b=fs.readFileSync(file);api.openGame(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),true);
 api.execCode("gs '#dynamic'");
 assert.deepStrictEqual(errors,[],'#dynamic 실행 오류');
 for(const line of [`$item_description['testitem'] = '<b>굵게</b> 설명<br>둘째 줄 "따옴표" <font size = 3%>작게</font>'`,`$item_name['testitem'] = '시험 아이템'`,`$dyn_aurabound_tooltip = ''`,`$equip_choice = ''`,`dynamic $get_non_combat_equipment, 'testitem', 5, '', 1, 0`]) api.execCode(line);
 assert.deepStrictEqual(errors,[],'툴팁 보조 코드 실행 오류');
 const out=api.readVariable('$equip_choice');
 assert.ok(out.includes('class="tooltip-left" tooltip-data="굵게 설명 둘째 줄 &quot;따옴표&quot; 작게"'),out);
 assert.ok(out.includes('시험 아이템</a>'),out);
 console.log('PASS: 장비 툴팁 보조 코드 실행, 설명 태그 정리·따옴표 처리');
})();
