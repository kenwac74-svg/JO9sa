'use strict';
// Read-only, isolated QSP evaluator. The game and saves are never written.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),readline=require('node:readline');
// Upstream logs unhandled UI notifications to console; stdout is reserved for NDJSON.
console.log=()=>{};
const corePath=process.env.JO9_RUNTIME_CORE||path.resolve(__dirname,'../text-workshop/core.cjs');
const core=require(corePath);
const appearance=require(path.join(path.dirname(corePath),'appearance-rules.cjs'));
const vendor=process.env.JO9_RUNTIME_VENDOR||path.resolve(__dirname,'vendor/qsp');
const {initQspEngine}=require(path.join(vendor,'wasm-engine.cjs'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const q=s=>String(s).split('<<').map(p=>"'"+p.replaceAll("'","''")+"'").join(" + '<' + '<' + ");
const json=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const ab=b=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);
const normal=s=>s.replace(/\r\n/g,'\n').trim();
function compatible(s){return s.replace(/^(\s*)for\s+([\w$]+)\s*=\s*(.*?)\s+to\s+(.*?)(?:\s+step\s+(-?\d+))?:/gim,(_,sp,v,lo,hi,step)=>`${sp}loop ${v} = ${lo} while ${v} ${(step||'1').startsWith('-')?'>=':'<='} ${hi} step ${v} += ${step||1}:`);}
// FastQSP keeps separate numeric/string slots. These three unused legacy string
// labels must not overwrite numeric actor IDs in the QSP 5.8 variant engine.
const legacyKinds=s=>s.replace(/\$(slave|assistant|stock)_type\b/g,(_,role)=>'$jo9_preview_'+role+'_kind');
let state;
async function boot(root){
 const raw=fs.readFileSync(path.join(root,'jack.qsp')),doc=core.parse(raw),bodies=new Map(doc.locations.map(l=>[l.name,core.shift(doc.lines[l.body],5)]));
 const keys=new Set(['beauty','exotic','style','fame','mood','obedience','sex_sum','supermacy','arousal','fear','angst','spoil','moral','instinct','custom','rational']);
 for(const body of bodies.values())for(const m of body.matchAll(/\b(?:slave|assistant|dynslave)(?:_rate)?\[\s*['"]([\w]+)['"]\s*\]/g))keys.add(m[1]);
 let loops=0,bridge=0;
 for(const loc of doc.locations){let body=bodies.get(loc.name);loops+=(body.match(/^\s*for\s+/gim)||[]).length;body=compatible(body);
  // FastQSP's file-presence intrinsic is bridged to a read-only inventory.
  body=body.replace("dynamic 'jo9_lookup_exists = %<<$jo9_lookup_path>>%'",()=>{bridge++;return "jo9_lookup_exists=jo9_preview_files[lcase($replace($jo9_lookup_path,'\\','/'))]";});
  if(['Start','main_screen','menu_form','slave_stat','assistant_stat','city_screen','choice_screen'].includes(loc.name))body='exit';
  doc.lines[loc.body]=core.shift(legacyKinds(body),-5);
 }
 const api=await initQspEngine(process.env.JO9_RUNTIME_WASM||path.join(vendor,'qsp-engine.wasm')),errors=[],effects=[];
 api.on('error',e=>errors.push(e));
 for(const ev of ['msg','input','wait','play_file','close_file','is_play','version','menu','view','open_game','load_save','save_game','sleep','panel_visibility','main_changed','stats_changed','actions_changed','objects_changed','timer','user_input','system_cmd'])api.on(ev,(...args)=>{
  if(!['refresh','show_window','is_play','version'].includes(ev))effects.push({event:ev});
  const cb=args.find(x=>typeof x==='function');if(cb)cb(ev==='input'?'':ev==='is_play'?false:ev==='version'?'5.7.0':-1);
 });
 const run=(code,label)=>{const n=errors.length,at=effects.length;api.execCode(legacyKinds(compatible(code)).replace(/\r?\n/g,'\r\n'));
  if(errors.length>n)throw Error(label+': '+JSON.stringify(errors.slice(n)));
  if(effects.slice(at).some(x=>['input','menu','open_game','load_save','save_game','system_cmd'].includes(x.event)))throw Error(label+': 사용자 입력 또는 외부 실행이 필요한 경로입니다.');
 };
 api.openGame(ab(core.serialize(doc)),true);
 for(const loc of ['#static_base','#static_txt','#dynamic','#food_base','#variative','#help_msg','#item_base','#masters_base','#moodlet_base','#simple_npc','#npc_base','#options','#place_base','#estate_base','#var_base'])if(bodies.has(loc))run(`gs ${q(loc)}`,loc);
 run("$onnewloc=''\n$ongload=''\n$counter=''\ngs 'init_game'\ngs 'init_story_mode'",'new-game initialization');
 const index=json(path.join(root,'json/slave_index.json'));run(Object.entries(index).filter(([,v])=>typeof v==='number').map(([k,v])=>`${k}=${v}`).join('\n'),'slave_index');
 const templates=new Map();
 for(const f of fs.readdirSync(path.join(root,'json/slaves')).sort()){
  const m=f.match(/^(\d+)(?:_[^.]*)?\.json$/);if(!m)continue;const id=Number(m[1]),data=json(path.join(root,'json/slaves',f));
  if(templates.has(id))throw Error('중복 등록 ID: '+id);
  templates.set(id,{file:f,data});
  const lines=[];for(const [k,v]of Object.entries(data)){if(!/^\w+$/.test(k))continue;
   if(k.startsWith('seed_'))keys.add(k.slice(5));
   if(typeof v==='number'&&Number.isSafeInteger(v))lines.push(`${k}[${id}]=${v}`);
   else if(typeof v==='string')lines.push(`$${k}[${id}]=${q(v)}`);
  }if(lines.length)run(lines.join('\n'),f);
 }
 let files=0;if(bridge){const walk=dir=>{const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.isSymbolicLink())continue;const p=path.join(dir,e.name);if(e.isDirectory())out.push(...walk(p));else out.push(p);}return out;};
  const inventory=walk(path.join(root,'content/pic'));for(let i=0;i<inventory.length;i+=400)run(inventory.slice(i,i+400).map(p=>`jo9_preview_files[${q(path.relative(root,p).replaceAll('\\','/').toLowerCase())}]=1`).join('\n'),'file inventory');files=inventory.length;
 }
 run("$onnewloc=''\n$ongload=''\n$counter=''",'snapshot callbacks');const snapshot=api.saveGame();if(!snapshot)throw Error('초기 엔진 상태를 보관하지 못했습니다.');
 const catalog=json(process.env.JO9_RUNTIME_ROUTES||path.join(__dirname,'acquisition-routes-runtime.json'));
 const symbols=appearance.symbolsFor(bodies),normalizedLocations=new Map();
 const normalizeRule=code=>normal(appearance.adaptRule(code));
 function matchesReference(fragment){
  if(!normalizedLocations.has(fragment.location))normalizedLocations.set(fragment.location,normalizeRule(bodies.get(fragment.location)||''));
  return normalizedLocations.get(fragment.location).includes(normalizeRule(fragment.code));
 }
 const routes=catalog.routes.map(r=>{
  const refs=[r.source_fragment,r.replay_fragment,r.setup_fragment,r.helper_fragment].filter(Boolean);
  const valid=refs.every(matchesReference);
  return {...r,valid};
 });
 const masters=[];for(let id=1;id<1000;id++){const name=api.readVariable('$master_base_name',id);if(name)masters.push({id,name});}
 const appearanceRules={mode:{code:symbols.mode,label:appearance.modeLabel,defaultValue:api.readVariable(symbols.mode),values:appearance.modeValues},classes:appearance.classes};
 state={root,api,run,snapshot,keys:[...keys],templates,routes,bodies,masters,hash:hash(raw),loops,files,effects,errors,instances:new Map(),draw:0,named:new Set(catalog.characters.map(c=>c.id)),symbols,appearanceRules};return state;
}
function meta(s,id){
 const known=s.routes.filter(r=>r.character_id===Number(id));
 const generic=[{id:'template',label:'템플릿 생성 · 게임 영입 경로 아님',role:'stock',valid:true},{id:'regular',label:'일반 영입 · 기본 영입 처리',role:'slave',valid:true}];
 const kinds={generate_stock_direct_swap_assistant:'조수 영입',generate_stock_direct_swap_slave:'직접 영입',quest_assistant:'퀘스트 조수 영입',generate_stock_stock_to_slave:'이벤트·상점 영입',dynamic_gloria_join:'글로리아 영입',black_market_sequence:'암시장 순환 상품'};
 return {masters:s.masters,routes:[...known.map(r=>({id:r.route_id,label:`${kinds[r.kind]||r.kind} · ${r.selector||r.location}`,role:r.output_role,valid:r.valid,requirements:r.preconditions||'',notes:r.notes})),...generic],defaultRoute:known.find(r=>r.valid)?.route_id??(s.named.has(Number(id))?'template':'regular'),qspHash:s.hash,engine:s.api.version(),templates:s.templates.size,appearanceRules:s.appearanceRules};
}
function calculate(s,req){
 const {api,run}=s;api.loadSave(s.snapshot);
 const context=req.context||{},id=Number(req.characterId||0),master=Number(context.master),difficulty=Number(context.difficulty),obedience=Number(context.obedience);
 if(!s.masters.some(m=>m.id===master)||![0,1,2].includes(difficulty)||![0,1,2].includes(obedience))throw Error('주인공·게임 난이도·복종 난이도를 선택하세요.');
 if(id&&!s.templates.has(id))throw Error('게임에서 등록된 캐릭터 ID가 아닙니다.');
 let selected=s.routes.find(r=>r.route_id===context.route&&r.character_id===id),role=selected?.output_role||'slave',routeCode;
 if(selected){if(!selected.valid)throw Error('QSP 영입 코드가 바뀌었습니다. 이 경로의 연결 정보를 다시 확인해야 합니다.');routeCode=appearance.adaptRule(selected.replay_code||selected.replay_fragment.code,s.symbols);}
 else if(context.route==='template'){role='stock';routeCode=`special_stock=${id}\ngs 'generate_stock'`;}
 else if(context.route==='regular'){routeCode=`special_stock=${id}\ngs 'generate_stock'\ngs 'stock_to_slave_nogt'`;}
 else throw Error('영입 경로를 선택하세요.');
 // The selected preset is executed, including equipment/sex-specific startup code.
 run(`hero_choice=${master}\nhero_select=hero_choice\ndynamic $master_version_stats[hero_choice]\nmaster_energy=min(5,master_str+1)\ndifficulty_setting=${obedience}\ngame_difficulty=${difficulty}\ngs '#var_base'`,'master preset');
 const start=s.bodies.get('start_game').split(/\r?\n/).slice(59,76).join('\n');
 run(start+"\ngs '$calculate_attributes'",'master startup recalculation');
 // Route preconditions are an explicit preview fixture, not progress in a real save.
 run(`slave_state=0\nassistant_state=0\nstock_state=0\nget_initial_slave=0\njo9_cruel_mercy=${Number(context.cm)||0}`,'acquisition fixture');
 const overrides=req.data;if(overrides){if(!id)throw Error('랜덤 전체 생성에는 개별 JSON 덮어쓰기를 사용하지 않습니다.');
  const original=s.templates.get(id).data,lines=[];for(const key of new Set([...Object.keys(original),...Object.keys(overrides)])){
   if(!/^\w+$/.test(key))continue;const v=overrides[key];
   if(typeof v==='number'&&Number.isSafeInteger(v))lines.push(`${key}[${id}]=${v}`);
   else if(typeof v==='string')lines.push(`$${key}[${id}]=${q(v)}`);
   else if(v===undefined&&key.startsWith('seed_'))lines.push(`${key}[${id}]=0\n$${key}[${id}]=''`);
  }if(lines.length)run(lines.join('\n'),'pending JSON');
 }
 const effectAt=s.effects.length;
 const identity=hash(JSON.stringify({id,data:req.data,master,cm:context.cm||0,route:context.route}));
 let instance=req.acquisitionToken&&s.instances.get(req.acquisitionToken),token=req.acquisitionToken;
 if(req.acquisitionToken&&!instance)throw Error('고정한 생성 상태가 만료되었습니다. 다시 생성을 눌러 새 결과를 만드세요.');
 if(instance&&instance.identity===identity){api.loadSave(instance.snapshot);run(`difficulty_setting=${obedience}\ngame_difficulty=${difficulty}`,'difficulty recalculation');
  // Reuse the game's AP-cap expression; preserve route-specific explicit AP overrides.
  const energy=s.bodies.get('generate_stock').split(/\r?\n/).find(l=>/^stock\['energy'\]\s*=.*difficulty_setting/.test(l));
  if(energy&&role!=='stock'&&instance.energyFormula){run(energy.replaceAll('stock',role),'difficulty AP cap');}
 }
 else {s.draw++;run(`loop jo9_preview_skip=0 while jo9_preview_skip<${s.draw} step jo9_preview_skip+=1:\njo9_preview_random=rand(0,1000000)\nend`,'next random draw');run(routeCode,'selected acquisition');token=crypto.randomUUID();const stamina=api.readVariableByKey(role,'stamina'),energy=api.readVariableByKey(role,'energy');instance={identity,snapshot:api.saveGame(),energyFormula:energy===(stamina>0?Math.min(5,stamina+(obedience===2?0:1)):0)};if(!instance.snapshot)throw Error('영입 결과 보관 실패');s.instances.set(token,instance);if(s.instances.size>24)s.instances.delete(s.instances.keys().next().value);}
 const actualId=api.readVariable(role+'_type');if(id&&actualId!==id)throw Error(`영입 결과 ID가 다릅니다: ${actualId} (요청 ${id})`);
 if(api.readVariable(role+'_state')!==1)throw Error('선택한 경로에서 영입이 완료되지 않았습니다.');
 run(`gs '$slave_traits'\n`+(role==='stock'?`dynamic $replace($newloc_update_slave,'dyn'+'slave','stock')`:`dynamic $do_for_each_slave_in_list,'$newloc_update_slave','$main_screen_slave_characters'`)+`\ngs '$calculate_attributes'`,'final game recalculation');
 run(`jo9_preview_supermacy=func('jo9_supermacy',${q(role)})`,'target supremacy');
 const values=Object.fromEntries(s.keys.map(k=>[k,api.readVariableByKey(role,k)]));values.supermacy=api.readVariable('jo9_preview_supermacy');
 const rates=Object.fromEntries(['mood','arousal','fear','angst','spoil','moral','instinct','custom','rational'].map(k=>['rate.'+k,api.readVariableByKey(role+'_rate',k)]));
 const strings=Object.fromEntries(['name','world','family','occupation','psy_status','psy_basic','cloth','fullimage'].map(k=>[k,api.readVariableByKey('$'+role,k)]));
 strings.name=api.readVariable('$'+role+'_name')||strings.name;strings.psy_status=api.readVariable('$'+role+'_psy_status')||strings.psy_status;strings.psy_basic=api.readVariable('$'+role+'_psy_basic')||strings.psy_basic;
 for(const k of ['world','family','occupation'])strings[k]=api.readVariable('$'+role+'_'+k)||strings[k];
 for(const k of ['world_description','family_description','occupation_description'])strings[k]=api.readVariable('$'+role+'_'+k)||'';
 return {values,rates,strings,characterId:actualId,role,context,route:context.route,qspHash:s.hash,engine:api.version(),instanceId:crypto.randomUUID(),acquisitionToken:token,source:selected?{location:selected.location,line:selected.assignment_line,kind:selected.kind,requirements:selected.preconditions||''}:{kind:context.route},compatibility:{forLoops:s.loops,fileChecks:s.files,host:'FastQSP 5.7 / QSP WASM '+api.version()},effects:s.effects.slice(effectAt).filter(x=>!['main_changed','stats_changed','actions_changed','objects_changed','panel_visibility','timer','user_input'].includes(x.event))};
}
async function handle(req){if(!state||state.root!==req.root)await boot(req.root);if(req.action==='meta')return meta(state,req.characterId);return calculate(state,req);}
const lines=readline.createInterface({input:process.stdin,crlfDelay:Infinity});let chain=Promise.resolve();
lines.on('line',line=>{chain=chain.then(async()=>{let req;try{req=JSON.parse(line);const result=await handle(req);process.stdout.write(JSON.stringify({id:req.requestId,result})+'\n');}catch(error){process.stdout.write(JSON.stringify({id:req?.requestId,error:String(error.message||error)})+'\n');}});});
lines.on('close',()=>chain.then(()=>process.exit(0)));
