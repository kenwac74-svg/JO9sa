// QSP 엔진(@qsp/wasm-engine 2.0.0)으로 jack.qsp를 열고 질문 조각 데이터를 읽어 보는 확인용 스크립트
const fs=require('fs');const p=require.resolve('@qsp/wasm-engine');
const m=require(p);const {initQspEngine}=m;
(async()=>{const api=await initQspEngine(fs.readFileSync(require('path').dirname(p)+'/qsp-engine.wasm'));const errs=[];api.on('error',e=>errs.push(e));
for(const ev of ['msg','input','wait','play_file','close_file','is_play','version','menu'])api.on(ev,(...a)=>{const cb=a.find(x=>typeof x==='function');if(cb)cb(ev==='input'?'':ev==='is_play'?false:ev==='version'?'5.7.0':-1);});
const raw=fs.readFileSync(process.argv[2]);api.openGame(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),true);
api.execCode("gs '#txt_man','jo9_voice_fragment_data'\r\n$qa=$voice_fragment_text['body_fear_1_core_direct_2']\r\nqn=voice_fragment_count['fact_fear_1_core_frank_3']");
console.log('errors',errs.length, JSON.stringify(errs[0]||'').slice(0,200));console.log(api.readVariable('$qa'), api.readVariable('qn'));})();
