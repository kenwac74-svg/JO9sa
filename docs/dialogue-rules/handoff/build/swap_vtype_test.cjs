// copyarr와 $swap_slave_instances가 인물 배열의 글자 값($slave['jo9_vtype'])까지 옮기는지 QSP 엔진으로 확인한다
const fs=require('fs');const p=require.resolve('@qsp/wasm-engine');const {initQspEngine}=require(p);
(async()=>{const api=await initQspEngine(fs.readFileSync(require('path').dirname(p)+'/qsp-engine.wasm'));const errs=[];api.on('error',e=>errs.push(e));
for(const ev of ['msg','input','wait','play_file','close_file','is_play','version','menu'])api.on(ev,(...a)=>{const cb=a.find(x=>typeof x==='function');if(cb)cb(ev==='input'?'':ev==='is_play'?false:ev==='version'?'5.7.0':-1);});
const raw=fs.readFileSync(process.argv[2]);api.openGame(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),true);
api.execCode("killvar 'tb'\r\n$ta['jo9_vtype']='princess'\r\nta['moral']=4\r\ncopyarr 'tb','ta'\r\n$q1=$tb['jo9_vtype']\r\nq2=tb['moral']");
console.log('copyarr 숫자 이름으로 복사 →', JSON.stringify(api.readVariable('$q1')), api.readVariable('q2'));
api.execCode("gs '#static_base'");
api.execCode("killvar 'slave'\r\nkillvar 'assistant'\r\n$slave['jo9_vtype']='princess'\r\nslave['moral']=4\r\n$assistant['jo9_vtype']='meek'\r\nassistant['moral']=1\r\ndynamic $swap_slave_instances, 'slave', 'assistant'\r\n$r1=$slave['jo9_vtype']\r\n$r2=$assistant['jo9_vtype']\r\nr3=slave['moral']\r\nr4=assistant['moral']");
console.log('교체 뒤 slave:', api.readVariable('$r1'), api.readVariable('r3'), '/ assistant:', api.readVariable('$r2'), api.readVariable('r4'));
console.log('errors',errs.length, JSON.stringify(errs.slice(0,2)).slice(0,300));})();
