'use strict';
const fs=require('fs'),a=require('assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',D=R+'/records/black-market-attributes-20261115',T='G:/Codex/tmp/black-market-attributes-20261115',c=require(R+'/tools/text-workshop/core.cjs');
const stage=process.argv[2]||'red',raw=fs.readFileSync(process.argv[3]||W+'/jack.qsp'),d=c.parse(raw),q=s=>"'"+s.replaceAll("'","''")+"'",nl=s=>s.replace(/\r?\n/g,'\r\n');
let code="killall\n$onnewloc=''\n$ongload=''\n$counter=''\nsettimer 0\ngs '#static_base'\ngs '#dynamic'\ngs '#variative'\ngs '#static_txt'\ngs '#item_base'\nqa_checks=0\nqa_failed=0\n";
const check=(expr,want,tag)=>code+=`qa_checks+=1\nif ${expr}!${want}:\nqa_failed+=1\n$qa_errors[]=${q(tag||expr)}\nend\n`;
function grade(k,v){if(k==='beauty'||k==='stamina')return v<=40?2:v<=70?3:v<=90?4:5;if(k==='pride')return v<=45?2:v<=75?1:0;return v<=35?1:v<=65?2:v<=85?3:v<=95?4:5;}
for(let k of ['beauty','stamina','pride','exotic'])for(let v=1;v<=100;v++)check(`func('jo9_background_b','market_grade','${k}',${v})`,grade(k,v),'grade '+k+' '+v);
const files=fs.readdirSync(W+'/json/slaves').filter(f=>/^(258[6-9]|259[0-7])_.*\.json$/.test(f)),templates=[];
for(let file of files){let j=JSON.parse(fs.readFileSync(W+'/json/slaves/'+file,'utf8')),id=Number(file.split('_')[0]);templates.push({id,file,j});for(let[k,v]of Object.entries(j)){a(/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k));code+=(typeof v==='string'?'$':'')+k+'['+id+']='+(typeof v==='string'?q(v):v)+'\n';}}
// Observe raw draws before unchanged normal-game adjustments; instrumentation is diagnostic-only.
let g=d.locations.find(l=>l.name==='generate_stock'),b=c.shift(d.lines[g.body],5),anchor='!TRANSLATE PRESET BEAUTY TO RATE (backgrounds can modify beauty rate)';a.equal(b.split(anchor).length,2);b=b.replace(anchor,()=>"copyarr 'qa_draw_current','stock'\r\n"+anchor);d.lines[g.body]=c.shift(b,-5);
let index=0;
for(let difficulty of [1,2])for(let {id,j}of templates)for(let sample=0;sample<8;sample++){
 code+=`difficulty_setting=${difficulty}\nspecial_stock=${id}\ncreating_clone=0\ngs 'generate_stock'\n`;
 check('stock_type',id,'template');check("stock['fat']<0 or stock['fat']>4",0,'body range');check("stock['world_index']",j.stock_world_index,'world');check("stock['nation_index']",j.stock_nation_index,'region');check('$stock_world_description',q(j.seed_world_description),'world story');check('$fullimage[stock_type]',q(j.fullimage),'registry image');
 for(let k of ['sensitivity','temper','intellect','ego'])check(`qa_draw_current['${k}']<1 or qa_draw_current['${k}']>5`,0,'raw mental range '+k);
 check("qa_draw_current['beauty']<2 or qa_draw_current['beauty']>5",0,'beauty range');check("qa_draw_current['stamina']<2 or qa_draw_current['stamina']>5",0,'stamina range');check("qa_draw_current['pride']<0 or qa_draw_current['pride']>2",0,'attitude range');check("qa_draw_current['exotic']<1 or qa_draw_current['exotic']>5",0,'exotic range');
 check("stock['oral_affinity']>0 and stock['jo9_gag_reflex']>0",0,'oral exclusion');
 code+=`qa_meta[${index}]=${id}\nqa_meta_difficulty[${index}]=${difficulty}\n`;
 for(let k of ['beauty','stamina','sensitivity','temper','intellect','ego','pride','exotic','fat'])code+=`qa_draw_${k}[${index}]=qa_draw_current['${k}']\n`;
 code+=`$qa_name[${index}]=$stock_name\n$qa_family[${index}]=$stock_family\n$qa_job[${index}]=$stock_occupation\n`;
 if(sample===0){let key=id+'_'+difficulty;code+=`copyarr 'qa_actor_${key}','stock'\ncopyarr 'qa_rate_${key}','stock_rate'\n$qa_img_${key}=$stock['fullimage']\n$qa_psy_${key}=$stock_psy_basic\n`;code+="gs 'stock_to_slave_nogt'\n";for(let k of ['stamina','sensitivity','intellect','pride','exotic','fat','base_beauty','world_index','nation_index'])check(`slave['${k}']`,`qa_actor_${key}['${k}']`,'owned copy '+k);code+=`copyarr 'qa_owned_${key}','slave'\ncopyarr 'qa_owned_rate_${key}','slave_rate'\n`;code+="dynamic $clear_slave_instance,'slave'\n";}
 index++;
}
code+="special_stock=1448\nstock_type=1448\nstock['beauty']=9\nstock['courage']=9\ngs 'jo9_background_b','market_attributes'\ngs 'jo9_background_b','market_traits'\n";check("stock['beauty']",9,'outside target attributes');check("stock['courage']",9,'outside target traits');
code+="special_stock=2586\nstock_type=2586\ncreating_clone=1\ngs 'jo9_background_b','market_attributes'\ngs 'jo9_background_b','market_traits'\n";check("stock['beauty']",9,'clone attributes');check("stock['courage']",9,'clone traits');
code+=`savegame 'qa.sav'\nmsg 'JO9_QA_BMATTR_${stage}_COMPLETE'\nexit`;
d.lines[d.locations.find(l=>l.name==='Start').body]=c.shift(nl(code),-5);fs.mkdirSync(T+'/'+stage,{recursive:true});fs.mkdirSync(D,{recursive:true});fs.writeFileSync(T+'/'+stage+'/test.qsp',c.serialize(d));fs.copyFileSync(W+'/config.xml',T+'/'+stage+'/config.xml');fs.writeFileSync(T+'/'+stage+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');fs.writeFileSync(T+'/'+stage+'/plan.json',JSON.stringify([{name:'black-market-attributes',file:T+'/'+stage+'/test.qsp',marker:'JO9_QA_BMATTR_'+stage+'_COMPLETE',checkpoint:'Weighted base attributes, common traits, fixed skills/image/world preservation and owned transfer'}],null,2));
fs.writeFileSync(D+'/'+stage+'-fixture.json',JSON.stringify({sourceHash:c.hash(raw),draws:index,templates:templates.map(x=>({id:x.id,file:x.file,sha256:c.hash(fs.readFileSync(W+'/json/slaves/'+x.file))})),assertions:(code.match(/qa_checks\+=1/g)||[]).length},null,2)+'\n');console.log(JSON.stringify({stage,draws:index,assertions:(code.match(/qa_checks\+=1/g)||[]).length}));
