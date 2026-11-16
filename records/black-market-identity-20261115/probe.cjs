'use strict';
const fs=require('fs'),a=require('assert/strict'),path=require('path');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',D=R+'/records/black-market-identity-20261115',T='G:/Codex/tmp/black-market-identity-20261115';
const c=require(R+'/tools/text-workshop/core.cjs'),q=s=>"'"+s.replaceAll("'","''")+"'",nl=s=>s.replace(/\r?\n/g,'\r\n');
const stage=process.argv[2]||'red',raw=fs.readFileSync(process.argv[3]||W+'/jack.qsp'),d=c.parse(raw);
let code="killall\n$onnewloc=''\n$ongload=''\n$counter=''\nsettimer 0\ngs '#static_base'\ngs '#dynamic'\ngs '#variative'\ngs '#static_txt'\ngs '#item_base'\nqa_checks=0\nqa_failed=0\n";
const check=(expr,want,tag)=>code+=`qa_checks+=1\nif ${expr}!${typeof want==='string'?q(want):want}:\nqa_failed+=1\n$qa_errors[]=${q(tag||expr)}\nend\n`;
const files=fs.readdirSync(W+'/json/slaves').filter(f=>/^(258[6-9]|259[0-7])_.*\.json$/.test(f)),templates=[];
for(const file of files){const id=Number(file.split('_')[0]),j=JSON.parse(fs.readFileSync(W+'/json/slaves/'+file,'utf8'));templates.push({id,file,json:j});for(const[k,v]of Object.entries(j)){a(/^[A-Za-z_][A-Za-z0-9_]*$/.test(k),k);a(['number','string'].includes(typeof v),k);code+=(typeof v==='string'?'$':'')+k+'['+id+']='+ (typeof v==='string'?q(v):v)+'\n';}}
for(const {id,json:j}of templates){
 for(let sample=0;sample<5;sample++){
  code+=`special_stock=${id}\ngs 'generate_stock'\n`;
  check('stock_type',id,'fixed template id');check('$stock_name='+q(j.seed_name),0,'random name '+id);check('$stock_family_description='+q(j.seed_family_description),0,'random origin '+id);check('$stock_occupation_description='+q(j.seed_occupation_description),0,'random occupation '+id);
  check("stock['world_index']",j.stock_world_index,'world fixed');check("stock['nation_index']",j.stock_nation_index,'region fixed');check('$stock_world_description',j.seed_world_description,'world story fixed');check('$fullimage[stock_type]',j.fullimage,'fullimage registry fixed');check("stock['jo9_bg_random']",0,'no generic profession/growth bonuses');
  code+=`$qa_names[${id*10+sample}]=$stock_name\n$qa_origins[${id*10+sample}]=$stock_family\n$qa_jobs[${id*10+sample}]=$stock_occupation\n`;
  if(sample===0){
   code+=`copyarr 'qa_before_${id}','stock'\ncopyarr 'qa_before_rate_${id}','stock_rate'\n$qa_world_before=$stock_world_description\n$qa_image_before=$stock['fullimage']\ngs 'jo9_background_b','market_identity'\ncopyarr 'qa_after_${id}','stock'\ncopyarr 'qa_after_rate_${id}','stock_rate'\n`;
   check('$stock_world_description','$qa_world_before','world preserved on reroll');
   // Direct expressions are used for equality to avoid treating variable names as strings.
   code=code.replace("if $stock_world_description!'$qa_world_before':","if $stock_world_description!$qa_world_before:");
   code+=`$qa_expected_name=$stock_name\n$qa_expected_family=$stock_family_description\n$qa_expected_job=$stock_occupation_description\n$qa_expected_img=$stock['fullimage']\ngs 'stock_to_slave_nogt'\n`;
   for(const[left,right]of [['$slave_name','$qa_expected_name'],['$slave_family_description','$qa_expected_family'],['$slave_occupation_description','$qa_expected_job'],["$slave['fullimage']",'$qa_expected_img']])code+=`qa_checks+=1\nif ${left}!${right}:qa_failed+=1\n`;
   code+="dynamic $clear_slave_instance,'slave'\n";
  }
 }
}
code+="stock_type=1448\n$stock_name='KEEP_NAME'\n$stock_family_description='KEEP_ORIGIN'\n$stock_occupation_description='KEEP_JOB'\ngs 'jo9_background_b','market_identity'\n";
check('$stock_name','KEEP_NAME','outside target');check('$stock_family_description','KEEP_ORIGIN');check('$stock_occupation_description','KEEP_JOB');
code+=`savegame 'qa.sav'\nif qa_failed>0:msg 'FAIL blackmarket '+str(qa_failed)+' '+$qa_errors[0] & exit\nmsg 'JO9_QA_BMIDENTITY_${stage}_COMPLETE'\nexit`;
d.lines[d.locations.find(l=>l.name==='Start').body]=c.shift(nl(code),-5);
fs.mkdirSync(T+'/'+stage,{recursive:true});fs.mkdirSync(D,{recursive:true});fs.writeFileSync(T+'/'+stage+'/test.qsp',c.serialize(d));fs.copyFileSync(W+'/config.xml',T+'/'+stage+'/config.xml');fs.writeFileSync(T+'/'+stage+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');fs.writeFileSync(T+'/'+stage+'/plan.json',JSON.stringify([{name:'black-market-identity',file:T+'/'+stage+'/test.qsp',marker:'JO9_QA_BMIDENTITY_'+stage+'_COMPLETE',checkpoint:'Actual generator for 12 fixed-image templates, repeated identity draws, price/stat/image/world preservation and owned transfer'}],null,2));
if(path.resolve(__filename)!==path.resolve(D+'/probe.cjs'))fs.copyFileSync(__filename,D+'/probe.cjs');fs.writeFileSync(D+'/'+stage+'-fixture.json',JSON.stringify({sourceHash:c.hash(raw),templates:templates.map(x=>({id:x.id,file:x.file,sha256:c.hash(fs.readFileSync(W+'/json/slaves/'+x.file))})),assertions:(code.match(/qa_checks\+=1/g)||[]).length},null,2)+'\n');console.log(JSON.stringify({stage,assertions:(code.match(/qa_checks\+=1/g)||[]).length,templates:templates.length,draws:templates.length*5}));
