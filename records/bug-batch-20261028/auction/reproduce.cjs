'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),cp=require('child_process');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');const root=__dirname;
const inputs={current:'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',original:'G:/somi/JO9O/game/jack.qsp'};
const tmp=path.join(root,'native-fixture');fs.mkdirSync(tmp,{recursive:true});
const results=[];const hashes={};let assertions=0;
for(const[k,input]of Object.entries(inputs)){
 const raw=fs.readFileSync(input);hashes[k]=c.hash(raw);const d=c.parse(raw),get=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5).replace(/\r\n/g,'\n'),set=(n,s)=>{d.lines[d.locations.find(l=>l.name===n).body]=c.shift(s.replace(/\n/g,'\r\n'),-5)};
 const sb=get('#static_base');const begin=sb.indexOf("killvar '$playable_vars'"),finish=sb.indexOf('!!!!! core game function',begin);assert(begin>0&&finish>begin);
 let nogt=get('stock_to_slave_nogt');const warning=nogt.split('\n').find(s=>s.startsWith('if stock_state ! CONST_INT'));
 assert(warning&&warning.includes('msg '));nogt=nogt.replace(warning,"if stock_state ! CONST_INT['slave_exist']: qa_warning+=1");set('stock_to_slave_nogt',nogt);
 // Only post-swap display/text refresh locations are stubbed; transfer arrays, state guard and accounting fragments remain actual code.
 for(const n of ['#var_base','#txt_man','#txt_2_man'])set(n,'');
 const city=get('interaction_city');const range=(a,b)=>{const x=city.indexOf(a),y=city.indexOf(b,x+a.length);assert(x>0&&y>x);return city.slice(x,y)};
 const deposit=range('if interaction_city = 119:','if interaction_city = 1191:').replace(/gs '\$slave_price', 'stock'/,"slaveprice = 200 &! isolate inventory behavior from price calculation");
 const takeback=range('if interaction_city = 1191:','if interaction_city = 1192:');
 const check=(s,label)=>{assertions++;return `if (${s}) = 0: msg 'FAIL_AUCTION_${k}_${label}' & exit\n`;};
 const seed=(genius)=>"killvar 'slave'\nkillvar 'stock'\nslave_state=0\nstock_state=1\nstock['id']=41001\nstock['jo9_learning_trait']="+genius+"\nstock['age']=1\nstock['virginity']=2\nstock['stamina']=4\nstock['energy']=4\nstock_type=99\n$stock_name='QA_CAPTURED'\nfarid_debt=0\nfarid_potential_debt=0\nsparks=100\nqa_warning=0\nhunting_prize=0\n";
 let code="usehtml=1\n$onnewloc=''\n$counter=''\nCONST_INT['no_slave']=0\nCONST_INT['slave_exist']=1\nCONST_INT['slave_faint']=2\nCONST_INT['loli_age']=0\n"+sb.slice(begin,finish)+"\n$update_slave_features_list=''\n";
 for(const genius of [0,1]){
  code+=seed(genius)+"interaction_city=119\n"+deposit+'\n';
  code+=check("stock_state=1 and stock['id']=41001 and farid_potential_debt=100",'deposit_'+genius);
  code+="interaction_city=1191\n"+takeback+'\n';
  code+=check("qa_warning=0 and slave_state=1 and slave['id']=41001 and slave['jo9_learning_trait']="+genius+" and farid_potential_debt=0 and sparks=95",'intact_return_'+genius);
  code+=seed(genius)+"interaction_city=119\n"+deposit+'\n';
  code+="dynamic $clear_slave_instance, 'stock'\nstock_state=1\nstock['id']=41002\n";
  code+=check("stock['id']=41002 and farid_potential_debt=100",'shared_stock_overwritten_'+genius);
  code+="dynamic $clear_slave_instance, 'stock'\n"; // Actual guild contract rejection clears generated preview stock.
  code+=check("stock_state=0 and stock['id']=0 and farid_potential_debt=100",'rejection_leaves_invalid_pending_'+genius);
  code+="interaction_city=1191\n"+takeback+'\n';
  code+=check("qa_warning=1 and slave_state=0 and slave['id']=0 and farid_potential_debt=0 and sparks=95",'invalid_return_clears_claim_and_charges_'+genius);
 }
 code+="msg 'JO9_QA_AUCTION_"+k+"_COMPLETE'\n";set('Start',code);
 const file=path.join(tmp,k+'.qsp');fs.writeFileSync(file,c.serialize(d));results.push({name:k,file,marker:'JO9_QA_AUCTION_'+k+'_COMPLETE',checkpoint:'Actual consignment/return fragments; current/original with/without genius; display refresh stubs and warning counter instrumentation'});
}
fs.writeFileSync(path.join(tmp,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');fs.writeFileSync(path.join(tmp,'plan.json'),JSON.stringify(results));
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','G:/somi/JO9sa/tools/qa/run-client-smoke.ps1','-Engine','G:/somi/Jack O Nine Tails v2.4_work/game/engine/jack.exe','-Plan',path.join(tmp,'plan.json'),'-TimeoutSeconds','15'],{encoding:'utf8',windowsHide:true,timeout:40000});
const observed=JSON.parse(fs.readFileSync(path.join(tmp,'client-results.json'),'utf8').replace(/^\uFEFF/,''));
const unchanged=Object.entries(inputs).every(([k,p])=>c.hash(fs.readFileSync(p))===hashes[k]);
const report={inputs,hashes,assertions,engineExit:run.status,observed,inputsUnchanged:unchanged,instrumentation:['Original diagnostic modal statement replaced by warning counter in diagnostic copy only, allowing inspection after the unsafe continuation.','Post-swap #var_base/#txt_man/#txt_2_man display refresh stubbed.','Consignment price fixed at200; actor state and swap/accounting statements unchanged.','Intervening generate/reject represented by their actual clear statements plus a second synthetic actor marker.'],limits:['No actual user save loaded or written.','This reproduces one reachable shared-stock invalidation cause, not the exact unknown actions from the reported personal session.']};
fs.writeFileSync(path.join(root,'native-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
for(const k of Object.keys(inputs))fs.copyFileSync(path.join(tmp,k+'-stderr.log'),path.join(root,'native-'+k+'.log'));
assert.equal(path.resolve(tmp),path.join(path.resolve(root),'native-fixture'));assert(!fs.lstatSync(tmp).isSymbolicLink());
const known=new Set(['current.qsp','original.qsp','FastQSP.ini','plan.json','current-stderr.log','current-stdout.log','original-stderr.log','original-stdout.log','client-results.json']);
if(fs.existsSync(path.join(tmp,'save'))){const p=path.join(tmp,'save');assert(!fs.lstatSync(p).isSymbolicLink());assert.equal(fs.readdirSync(p).length,0);fs.rmdirSync(p);}
for(const n of fs.readdirSync(tmp)){assert(known.has(n));assert(fs.lstatSync(path.join(tmp,n)).isFile());}
for(const n of fs.readdirSync(tmp))fs.unlinkSync(path.join(tmp,n));fs.rmdirSync(tmp);
assert(unchanged&&observed.length===2&&observed.every(x=>x.pass));
