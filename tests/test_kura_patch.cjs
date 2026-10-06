// 패키지 jack.qsp에서 쿠라 개인 패치(#masters_base 13번 주인공)를 WASM 엔진으로 실행해 보는 검사 (인자: 패키지 폴더 또는 jack.qsp 경로)
const fs=require('fs'),path=require('path'),assert=require('assert');
const vendor=path.resolve(__dirname,'../audits/reward-diagnostic/vendor-legacy/package');
const {initQspEngine}=require(path.join(vendor,'dist/node/wasm-engine.cjs'));
(async()=>{
 const api=await initQspEngine(path.join(vendor,'dist/qsp-engine.wasm'));const errors=[];
 api.on('error',e=>errors.push(e));
 for(const ev of ['msg','input','wait','play_file','close_file','is_play','version','menu','main_changed','stats_changed','actions_changed','objects_changed'])api.on(ev,(...a)=>{const cb=a.find(x=>typeof x==='function');if(cb)cb(ev==='input'?'':ev==='is_play'?false:ev==='version'?'5.7.0':-1)});
 const arg=process.argv[2], file=fs.statSync(arg).isDirectory()?path.join(arg,'payload/jack.qsp'):arg;
 const b=fs.readFileSync(file);api.openGame(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),true);
 api.execCode("gs '#masters_base'");
 assert.deepStrictEqual(errors,[],'#masters_base 실행 오류');
 assert.strictEqual(api.readVariable('$master_base_name',13),'쿠라');
 assert.strictEqual(api.readVariable('$clear_ava_path',13),'content\\pic\\SNKmod\\master\\master_kura.png');
 assert.strictEqual(api.readVariable('$sepia_ava_path',13),'content\\pic\\SNKmod\\master\\master_kura_sepia.png');
 api.execCode("dynamic $master_version_stats[13]");
 assert.deepStrictEqual(errors,[],'13번 주인공 설정 실행 오류');
 const num=n=>Number(api.readVariable(n));
 assert.strictEqual(num('sparks'),20000);
 assert.strictEqual(num('master_str'),5);
 assert.strictEqual(api.readVariable('$master_cloth'),'fancy_suit');
 assert.strictEqual(Number(api.readVariableByKey('faction_fame','serpis')),3);
 console.log('PASS: 쿠라 13번 주인공 설정 실행 (이름·초상화 경로·스파크 20000·능력치·복장·세르피스 우호)');
})();
