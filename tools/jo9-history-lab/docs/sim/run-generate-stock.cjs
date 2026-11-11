// 시뮬레이션 전용: QSP WASM 엔진으로 실제 generate_stock과 영입 처리(stock_to_slave_nogt)를 N번 실행해, 특성 추첨이 모두 끝난 노예의 값을 JSON으로 뽑는다
// 사용: node --stack-size=60000 run-generate-stock.cjs <wasm 패키지> <for 변환한 qsp> <json 폴더> <N> <출력.json>
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const [pkg,qspPath,jsonDir,countArg,outPath]=process.argv.slice(2);
const {initQspEngine}=require(path.resolve(pkg,'dist/node/wasm-engine.cjs'));
// 공식과 화면에 필요한 인물 값
const STOCK_KEYS=['age','virginity','fertility','pregnant','parasite','clone','beauty','base_beauty','jo9_peerless','exotic','base_exotic','style','temper','pride','sensitivity','ego','stamina','fat','intellect','fame',
 'nymphomania','homosexualism','perversion','anal_affinity','oral_affinity','jo9_gag_reflex','masochism','jo9_slave_nature',
 'sub_hug','sub_hj','sub_fj','sub_paizuri','sub_kiss','sub_tongue','sub_bj','sub_dt','sub_asslik','sub_vaginal','sub_anal','sub_fisting','anal_stretch'];
(async()=>{
 const api=await initQspEngine(path.resolve(pkg,'dist/qsp-engine.wasm')),errors=[];
 api.on('error',e=>errors.push(e));
 for(const ev of ['msg','input','wait','play_file','close_file','is_play','version','menu','view','open_game','save_game','sleep','show_window','refresh','system_cmd'])
  api.on(ev,(...a)=>{const cb=a.find(x=>typeof x==='function');if(cb)cb(ev==='input'?'':ev==='is_play'?false:ev==='version'?'5.7.0':-1);});
 const raw=fs.readFileSync(qspPath);api.openGame(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),true);
 const run=(code,tag)=>{const n=errors.length;api.execCode(code);if(errors.length>n)throw Error((tag||code.slice(0,80))+' '+JSON.stringify(errors.slice(n,n+2)));};
 // refresh_database의 순서대로 생성에 필요한 정적 location만 실행한다(#item_base는 이 엔진에서 스택이 넘쳐 제외: 생성 경로가 쓰지 않는다)
 for(const loc of ['#static_base','#static_txt','#dynamic','#food_base','#variative','#help_msg','#masters_base','#moodlet_base','#npc_base','#options','#place_base','#estate_base','#var_base'])run(`gs '${loc}'`);
 // FastQSP가 json 폴더를 읽어 채우는 값을 흉내 낸다: slave_index.json과 각 템플릿의 seed_* 숫자·문자열
 const index=JSON.parse(fs.readFileSync(path.join(jsonDir,'slave_index.json'),'utf8').replace(/^﻿/,''));
 run(Object.entries(index).map(([k,v])=>`${k} = ${v}`).join('\r\n'));
 const q=s=>"'"+String(s).replaceAll("'","''")+"'";
 for(const f of fs.readdirSync(path.join(jsonDir,'slaves'))){
  const m=f.match(/^(\d+)(?:_[^.]*)?\.json$/);if(!m)continue;
  const d=JSON.parse(fs.readFileSync(path.join(jsonDir,'slaves',f),'utf8').replace(/^﻿/,''));
  const lines=[];for(const [k,v]of Object.entries(d))if(k.startsWith('seed_')){if(typeof v==='number')lines.push(`${k}[${m[1]}] = ${v}`);else if(typeof v==='string')lines.push(`$${k}[${m[1]}] = ${q(v)}`);}
  if(lines.length)run(lines.join('\r\n'),f);
 }
 run('no_loli = 1\r\nspecial_stock = 0');
 const N=Number(countArg),rows=[],failures=[];
 for(let i=0;i<N;i++){
  // 생성 → 영입(stock_to_slave_nogt: 처녀 성 기술 초기화, 노예근성 추첨) 순서로 실행하고 마지막 slave 값을 읽는다
  let bg;
  try{
   run("killvar 'stock'\r\nkillvar 'stock_rate'\r\nkillvar 'slave'\r\nkillvar 'slave_rate'\r\nspecial_stock = 0\r\ngs 'generate_stock'",'generate_stock');
   // 세계·출신·직업 문자열은 영입 뒤 지워지므로 생성 직후 읽는다
   bg={type:api.readVariable('stock_type',0),world:api.readVariable('$stock_world',0),family:api.readVariable('$stock_family',0),occupation:api.readVariable('$stock_occupation',0)};
   run("stock_state = CONST_INT['slave_exist']\r\nslave_state = CONST_INT['no_slave']\r\ngs 'stock_to_slave_nogt'",'stock_to_slave_nogt');
  }catch(e){failures.push(String(e).slice(0,300));if(failures.length>20)break;continue;}
  // result는 gs가 끝나면 지워지는 특수 변수라서, 영입 성공은 slave_state로 확인한다
  if(api.readVariable('slave_state',0)!==1||api.readVariable('stock_state',0)!==0){failures.push('영입 처리 실패');continue;}
  const r={...bg};
  for(const k of STOCK_KEYS)r[k]=api.readVariableByKey('slave',k);
  rows.push(r);
 }
 const out={source:'QSP WASM 실제 generate_stock 실행',qspSha256:crypto.createHash('sha256').update(fs.readFileSync(qspPath)).digest('hex'),
  note:'generate_stock 뒤 영입 처리 stock_to_slave_nogt까지 실행한 최종 slave 값. no_loli = 1(연령 코드 1 제외), special_stock = 0(랜덤 노예). for 반복문은 label/jump로 바꾼 사본으로 실행했다.',count:rows.length,failures:failures.length,keys:['type','world','family','occupation',...STOCK_KEYS],
  rows:rows.map(r=>['type','world','family','occupation',...STOCK_KEYS].map(k=>r[k]))};
 fs.writeFileSync(outPath,JSON.stringify(out));
 console.log('생성',rows.length,'실패',failures.length,failures.slice(0,3));
})().catch(e=>{console.error('FAIL',String(e).slice(0,600));process.exit(1);});
