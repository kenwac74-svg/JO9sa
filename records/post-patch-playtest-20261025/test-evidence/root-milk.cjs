'use strict';
const k=require('./root-kit.cjs'),{fs,root,q,doc,init,resources,addScript,domClick,run,sc}=k;
const out=root+'/milk-native';resources(out,true);const plans=[];
for(let price=1;price<=7;price++){
 const d=doc(),name='milk-'+['one','two','three','four','five','six','seven'][price-1],file=out+'/'+name+'.qsp';
 const js=`(function(){setTimeout(function(){var w=document.getElementById('milk_sign_writing'),b=document.getElementById('milk_sign_board'),m=document.getElementById('sparks_display'),r=w.getBoundingClientRect(),s=window.getComputedStyle(w,null),br=b.getBoundingClientRect(),mr=m.getBoundingClientRect(),z=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);var a=document.createElement('a');a.href="EXEC: qa_dom_black="+(s.color==='rgb(0, 0, 0)'?1:0)+" & qa_dom_text="+(w.textContent.replace(/\\s/g,'')==='${price}'?1:0)+" & qa_dom_x="+Math.round(r.left)+" & qa_dom_y="+Math.round(r.top)+" & qa_dom_w="+Math.round(r.width)+" & qa_dom_h="+Math.round(r.height)+" & qa_dom_top="+(z===w||w.contains(z)?1:0)+" & qa_dom_mx="+Math.round(mr.left)+" & qa_dom_my="+Math.round(mr.top)+" & qa_dom_bx="+Math.round(br.left)+" & qa_dom_by="+Math.round(br.top)+" & gs 'debug_info'";document.body.appendChild(a);var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(e);},350)}());`;
 d.set('Start',init('JO9_TEST_20261023_04_MILK.sav')+`\n$onnewloc='' & $counter=''\nnsfw=0\nmilk_price=${price}\nmilk_license=1 & milk_can=1 & milk_stock=6 & sparks=20000\ninteraction_city=445\ngt 'interaction_city'`);
 d.set('shop_general',d.get('shop_general')+`\nif qa_stage=0:\n qa_stage=1\n ${addScript(js)}\nelseif qa_stage=2:\n if milk_stock!1 or sparks!${20000+5*price}: msg 'FAIL_MILK_TRANSACTION' & exit\n qa_stage=3\n savegame 'milk-${price}.sav'\n msg 'JO9_QA_MILK_${name.replaceAll('-','_')}_COMPLETE'\nend`);
 d.set('debug_info',`if qa_stage!1: exit\nqa_stage=2\nsavegame 'milk-dom-${price}.sav'\n`+addScript(domClick('a',`var aa=document.querySelectorAll('a');a=null;for(var j=0;j<aa.length;j++){if(aa[j].textContent.indexOf('다섯 병을 판다')>=0){a=aa[j];break}}if(!a)return;`)));
 d.set('interaction_screen_city',d.get('interaction_screen_city')+`\nif qa_stage=2:\n if milk_stock!1 or sparks!${20000+5*price}: msg 'FAIL_MILK_TRANSACTION' & exit\n qa_stage=3\n savegame 'milk-${price}.sav'\n msg 'JO9_QA_MILK_${name.replaceAll('-','_')}_COMPLETE'\nend`);
 fs.writeFileSync(file,d.bytes());plans.push({name,file,marker:'JO9_QA_MILK_'+name.replaceAll('-','_')+'_COMPLETE',checkpoint:'Current shop menu -> native DOM geometry -> real sell-five link -> actual money and stock'});
}
const result=run(out,plans,15),details=[];
for(let p=1;p<=7;p++){
 const f=out+'/milk-dom-'+p+'.sav';if(!fs.existsSync(f)){details.push({price:p,status:'NO_DOM_CAPTURE'});continue;}
 const s=sc.parse(fs.readFileSync(f)),num=n=>+sc.value(s,n)[0];details.push({price:p,black:num('qa_dom_black'),text:num('qa_dom_text'),top:num('qa_dom_top'),x:num('qa_dom_x'),y:num('qa_dom_y'),width:num('qa_dom_w'),height:num('qa_dom_h'),money:[num('qa_dom_mx'),num('qa_dom_my')],board:[num('qa_dom_bx'),num('qa_dom_by')]});
}
fs.writeFileSync(out+'/result.json',JSON.stringify({run:result,details},null,2));console.log(JSON.stringify({run:result.status,details}));
