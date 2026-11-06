'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const core = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const vendor = 'G:/Codex/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/outputs/fog-relay-startup-fix-20261017/legacy-engine-probe/package';
const {initQspEngine} = require(vendor + '/dist/node/wasm-engine.cjs');
const source = process.argv[2] || 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const doc = core.parse(fs.readFileSync(source));
const body = name => core.shift(doc.lines[doc.locations.find(l => l.name === name).body], 5);
const enc = s => core.shift(s, -5);
const slice=(name,from,to)=>{const text=body(name),a=text.indexOf(from),z=text.indexOf(to,a+from.length);assert.ok(a>=0&&z>a,`slice ${name}/${from}`);return text.slice(a,z);};
const records = new Map([
 ['jo9_traits_value',body('jo9_traits_value')],
 ['jo9_meiki_sale',body('jo9_meiki_sale')],
 ['jo9_farid_consignment',body('jo9_farid_consignment')],
 ['slave_auction_sell_end',body('slave_auction_sell_end')],
 ['interaction_result_city',body('interaction_result_city')],
 ['qa_private_quote',slice('interaction_city','if interaction_city = 911:', 'if interaction_city = 92:')],
 ['qa_auction_m',slice('interaction_city','if interaction_city = 931 and hero_choice < 100:', 'if interaction_city = 932 and hero_choice < 100:')],
 ['qa_auction_f',slice('interaction_city','if interaction_city = 931 and hero_choice > 100:', '! JO9 MOD START DEALER_WONG_OFFER')],
 ['qa_load_quotes',slice('$ongload','! JO9 MOD START DEALER_OLD_CONFIRM_LOAD','! JO9 MOD END DEALER_OLD_CONFIRM_LOAD')+'\r\n'+slice('$ongload','! JO9 MOD START DEALER_OLD_CONFIRM_REFRESH','! JO9 MOD START TUTORIAL_CURRENT_UI_20261102')],
 ['$slave_price',"rating=qa_rating\nslave_base_price=qa_base\nslaveprice=qa_price\ncharm=qa_charm"],
 ['$cow_price','cowprice=qa_cow_price'],
 ['slave_sell_chek','buyer_interested=1'],
 ['interaction_screen_city',"qa_screen_count+=1\n$qa_page=$text[txt]"],
 ['guild',"$qa_destination='guild'"],
 ['city_menu_form',"$qa_destination='city_menu_form'"],
 ['shop_general',"$qa_destination='shop_general'"],
 ['choice_screen',"$qa_destination='choice_screen'"],
 ['jo9_buyer_rumors',''],
 ['refresh_database','qa_cache_refreshed+=1'],
 ['interaction_city',"$qa_destination='interaction_city'"],
 ['slave_auction_sell',"$qa_destination='slave_auction_sell'"],
]);
function wasmFor(code) {
 let n=0;
 return code.replace(/for jo9_fc_i = 0 to arrsize\('\$slave_vars'\) - 1:\r\n([\s\S]*?)\r\n  ?end/g,(all,inner)=>{
  const label='qa_fc_loop_'+(++n);
  return `jo9_fc_i = 0\r\n:${label}\r\nif jo9_fc_i < arrsize('$slave_vars'):\r\n${inner}\r\njo9_fc_i += 1\r\njump '${label}'\r\nend`;
 });
}
const fixture = (start, wasm=false) => Buffer.from(['QSPGAME','','',enc(String(records.size+1)),enc('Start'),'',enc(start),enc('0'),...[...records].flatMap(([name,code])=>[enc(name),'',enc((wasm&&name==='jo9_farid_consignment'?wasmFor(code):code).replace(/gt '(interaction_screen_city|guild|city_menu_form|shop_general|choice_screen|interaction_city|slave_auction_sell)'/g, (match,dest)=>"gs '"+dest+"' & exit").replace(/\r?\n/g,'\r\n')),enc('0')]),''].join('\r\n'),'utf16le');
async function main() {
 const api = await initQspEngine(vendor + '/dist/qsp-engine.wasm');
 const errors = [], checks = [], native = [];
 api.on('error', e => errors.push(e));
 api.on('main_changed', () => {});
 const raw = fixture('',true);
 api.openGame(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),true);
 const run = code => {code = code.replace(/\r?\n/g,'\r\n'); native.push(code); api.execCode(code); assert.deepEqual(errors,[]);};
 const check = (label, expr, want) => {
  run('qa_result = ' + expr);
  const got = Number(api.readVariable('qa_result'));
  checks.push({label,got,want});
  native.push(`if qa_result ! ${want}: msg 'JO9_SALE_TAX_FAIL_${checks.length}' & exit`);
  assert.equal(got,want,label);
 };
 const base = () => run(`killvar 'slave'\nkillvar 'cow'\nkillvar '$text'\nkillvar '$special_action'\nkillvar '$special_image'\nkillvar '$special_image_full'\nkillvar '$yes'\nkillvar '$no'\nkillvar 'jo9_dealer_farid_quote'\nkillvar 'jo9_dealer_wong_quote'\nkillvar '$jo9_dealer_farid_name'\nkillvar '$jo9_dealer_wong_name'\nkillvar 'jo9_dealer_farid_id'\nkillvar 'jo9_dealer_farid_type'\nkillvar 'jo9_dealer_wong_type'\nCONST_INT['no_slave']=0\nCONST_INT['slave_exist']=1\nCONST_INT['slave_faint']=2\nslave_state=1\ncow_state=1\nstock_state=1\nslave['id']=123\nslave['brand']=1\nslave['obedience']=10\nslave['stamina']=3\nslave['energy']=10\nslave_type=123\n$slave_name='QA'\n$npc_id='qa_buyer'\ndemand_rating['qa_buyer']=10\ncommon_price[10]=10000\nnpc_money['qa_buyer']=25000\n$slave_psy_status=''\n$clear_slave_instance={if $args[0]='slave': slave_state=0\nif $args[0]='cow': cow_state=0}\n$sold_clothing=''\nqa_rating=10\nqa_base=20000\nqa_price=20000\nqa_charm=46\nrating=10\ncharm=46\nsparks=123\nclient_satisfaction=0\nbrand_reputation=3\nguild_reputation=10\nhero_choice=1\ncustom_game=1\nsound_on=0\nsnk_room_target=0\nfarid_debt=0\nfarid_potential_debt=0\nbuyer_interested=1\nno_charm_check=1\nnoprice=0\ntxt=1\nsp_txt_is_set_from_save=0\ntxt_is_set_from_save=0\nqa_screen_count=0\n$qa_destination=''`);
 for (const difficulty of [0,1,2]) for (const creation of [0,1,2]) for (const amount of [-1,0,1,5999,6000,6019,9999,10000,10009,20001]) {
  run(`difficulty_setting=${difficulty}\ngame_difficulty=${creation}\nsparks=123`);
  const tax = difficulty === 2 ? (Math.trunc(amount * (amount >= 10000 ? .1 : amount >= 6000 ? .05 : 0)) || 0) : 0;
  check(`tax ${difficulty}/${creation}/${amount}`,`func('jo9_traits_value','sale_tax',${amount})`,tax);
  check(`net ${difficulty}/${creation}/${amount}`,`func('jo9_traits_value','sale_net',${amount})`,amount-tax);
  run(`$qa_receipt=$func('jo9_traits_value','sale_receipt',${amount})`);
  assert.match(String(api.readVariable('$qa_receipt')),/거래 총액: \$/);
  check('tax collector narrative only when taxed',"instr($qa_receipt, '악질적인 세금징수원') > 0",tax>0?1:0);
  check('preview does not pay','sparks',123);
  run(`$qa_receipt=$func('jo9_traits_value','sale_pay',${amount})`);
  check(`pay ${difficulty}/${creation}/${amount}`,'sparks',123+amount-tax);
 }
 // Execute the real settlement locations, using documented appraisal/render stubs only.
 for(const difficulty of [0,1,2])for(const type of ['slave_sold','slave_sold_house','sell_slave_simple','sell_slave_complex'])for(const hero of [1,101]){
  base();run(`difficulty_setting=${difficulty}\nhero_choice=${hero}\n$interaction_type='${type}'\nsell_price=10000\ngs 'interaction_result_city'`);
  check(`actual ${difficulty}/${type}/${hero}`,'sparks',123+(difficulty===2?9000:10000));
  check('actor removed','slave_state',0);
  run("gs 'interaction_result_city'");check('result replay does not pay','sparks',123+(difficulty===2?9000:10000));
 }
 for(const hero of [1,101]){
  base();run(`difficulty_setting=2\nhero_choice=${hero}\n$interaction_type='sell_slave_complex'\nnoprice=1\ngs 'interaction_result_city'`);check('noprice event unchanged','sparks',123);
 }
 for(const difficulty of [0,1,2]){
  base();run(`difficulty_setting=${difficulty}\nslave['brand']=0\nsell_price=10000\ngs 'slave_auction_sell_end'`);
  check(`farid actual ${difficulty}`,'sparks',123+(difficulty===2?9000:difficulty===1?27000:22500));
  run("gs 'slave_auction_sell_end'");check('farid replay does not pay','sparks',123+(difficulty===2?9000:difficulty===1?27000:22500));
  base();run(`difficulty_setting=${difficulty}\ngs 'jo9_traits_value','dealer_wong_finish',123`);
  const wongGross=difficulty===2?0:(difficulty===1?27000:22500);
  // The Hard lookup is configured explicitly, retaining its original grade-based depreciation.
  if(difficulty!==2)check(`wong actual ${difficulty}`,'sparks',123+wongGross);
 }
 base();run("difficulty_setting=2\nauction_price[10]=10000\ngs 'jo9_traits_value','dealer_wong_finish',123");check('wong hard actual','sparks',9123);
 run("gs 'jo9_traits_value','dealer_wong_finish',123");check('wong replay does not pay','sparks',9123);
 for(const difficulty of [0,1,2]){
  base();run(`difficulty_setting=${difficulty}\n$interaction_type='sell_milk_cow'\ncow['cowSK']=3\ncow['stamina']=3\ncow['energy']=10\nqa_cow_price=10000\ngs 'interaction_result_city'`);run('dynamic $yes');
  check(`cow actual ${difficulty}`,'sparks',123+(difficulty===2?9000:10000));
  run('dynamic $yes');check('cow callback replay does not pay','sparks',123+(difficulty===2?9000:10000));
 }
 // Existing saved receivables are collected as saved. New quotes are net before aggregation.
 base();run("difficulty_setting=2\n$slave_vars[0]='instance'\n$slave_vars[1]='$instance'\n$slave_vars[2]='instance_type'\n$slave_vars[3]='instance_state'\n$slave_vars[4]='$instance_name'\nstock['id']=999\nstock_type=999\n$stock_name='Consigned'\nfarid_debt=5999\nfarid_potential_debt=6000\n$qa_deposit=$func('jo9_farid_consignment','deposit')");
 check('legacy pending aggregated unchanged','farid_debt',11999);check('new consignment share taxed once','farid_potential_debt',9000);check('deposit no wallet payout','sparks',123);
 assert.match(String(api.readVariable('$qa_deposit')),/거래 총액: \$10000/);
 run("qa_settled=func('jo9_farid_consignment','settle')\nqa_collected=func('jo9_farid_consignment','collect')");
 check('mixed old and new collect once','sparks',21122);
 run("qa_collected=func('jo9_farid_consignment','collect')");check('consignment collect replay does not pay','sparks',21122);
 for(const sex of ['m','f'])for(const amount of [5999,6000,9999,10000,20001]){
  base();run(`difficulty_setting=2\ninteraction_city=931\nhero_choice=${sex==='m'?1:101}\nguild_reputation=0\ncontract['active']=1\nsparks_get=${amount}\n$auction_flow[1]='낙찰'\ngs 'qa_auction_${sex}'`);
  const tax=Math.trunc(amount*(amount>=10000?.1:amount>=6000?.05:0));
  check(`auction actual ${sex}/${amount}`,'sparks',123+amount-tax);
  run(`gs 'qa_auction_${sex}'`);check('auction replay does not pay','sparks',123+amount-tax);
 }
 // Direct private gross remains above 8000; a buyer liquidity cap still wins in negotiation.
 for(const quote of [912,913]){
  base();run(`difficulty_setting=2\ninteraction_city=${quote}\nvirgin_price=3000\ngs 'qa_private_quote'`);check(`private quote ${quote}`,'sell_price',quote===912?13000:10500);
 }
 base();run("difficulty_setting=2\ninteraction_city=911\nday=1\njo9_meiki_max_sale=0\nmaster_cha=5\nmaster_domination=5\nmaster_style=5\nmaster_str=5\npersonal_relations['qa_buyer']=30\nnpc_money['qa_buyer']=9000\ngs 'qa_private_quote'");check('buyer liquidity preserved','sell_price',9000);
 // Run source-derived cached-quote refresh and rumor ordering statements.
 base();run("$npc_id='master_vong'\n$yes={gs 'jo9_traits_value','dealer_wong_finish',123}\njo9_dealer_wong_quote=6000\nqa_cache_refreshed=0\ngs 'qa_load_quotes'");check('saved capped Wong quote refreshes','qa_cache_refreshed',1);
 check('refresh does not pay','sparks',123);
 const rumor=body('jo9_rumor_scan').split('\r\n').filter(line=>line.includes("'sale_net', jo9_rs_")).join('\r\n');
 run("difficulty_setting=2\njo9_rs_guild_quote=10000\njo9_rs_rank=9999\n"+rumor);check('rumor dealer net','jo9_rs_guild_quote',9000);check('rumor private net','jo9_rs_rank',9500);
 const caps = [];
 for (const name of ['interaction_city','interaction_result_city','interaction_screen_city','slave_auction_sell','slave_auction_sell_end','jo9_traits_value','jo9_rumor_scan']) {
  const lines = body(name).split('\r\n');
  lines.forEach((line,i) => {if (/\bmin\((?:6000\s*,|sell_price\s*,\s*8000|8000\s*,)|sparks_get\s*=\s*6000|최대 \$8,000/.test(line)) caps.push({name,line:i+1,text:line});});
 }
 assert.deepEqual(caps,[],'normal sale caps removed');
 const summary={source,checks:checks.length,failed:0};
 fs.writeFileSync(path.join(__dirname,'wasm-results.json'),JSON.stringify(summary,null,2)+'\n');
 if (process.argv[3]) {
  const out = path.resolve(process.argv[3]);fs.mkdirSync(out,{recursive:true});
  const file=path.join(out,'sale-tax.qsp'), marker='JO9_QA_SALETAX_sale_tax_COMPLETE';
  native.push(`msg '${marker}'`);
  fs.writeFileSync(file,fixture(native.join('\r\n')));
  fs.writeFileSync(path.join(out,'plan.json'),JSON.stringify([{name:'sale-tax',file,marker,checkpoint:'sale tax helper boundaries and payments'}],null,2));
  fs.writeFileSync(path.join(out,'config.xml'),'<game width="640" height="480" title="JO9 sale tax diagnostic"/>');
  fs.writeFileSync(path.join(out,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 }
 console.log(JSON.stringify(summary));
}
main().catch(e => {console.error(e);process.exitCode=1;});
