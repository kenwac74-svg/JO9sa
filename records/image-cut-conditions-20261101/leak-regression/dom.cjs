'use strict';
const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs'),sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const T=process.env.JO9_IMAGE_LEAK_QA_ROOT||'G:/Codex/tmp/catfight-image-leak-20261101',F=process.env.JO9_IMAGE_LEAK_QA_GAME_DIR||'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game',D=T+'/dom-scenes';
const q=s=>"'"+s.replaceAll("'","''")+"'",body=(d,n)=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),set=(d,n,s)=>{d.lines[d.locations.find(x=>x.name===n).body]=c.shift(s.replace(/\r?\n/g,'\r\n'),-5);};
if(process.argv[2]==='prepare'){
 assert(!fs.existsSync(D));fs.mkdirSync(D);for(const n of ['json','css','fonts','content'])fs.symlinkSync(fs.realpathSync(F+'/'+n),D+'/'+n,'junction');fs.copyFileSync(F+'/config.xml',D+'/config.xml');fs.writeFileSync(D+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 const d=c.parse(fs.readFileSync(T+'/green-transitions-v2/transition.qsp'));set(d,'Start',body(d,'Start').replace('usehtml=0','usehtml=1'));
 const js='('+function(point,stage,target,old,nonce){
   function click(node){var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);node.dispatchEvent(e);}
   function go(retry){var list=document.querySelectorAll('#bg img'),sceneCount=document.querySelectorAll('#bg > img').length,items=[],wanted=0,stale=0,loading=0;for(var i=0;i<list.length;i++){var img=list[i],src=img.getAttribute('src')||'';items.push({src:src,w:img.naturalWidth,h:img.naturalHeight,parent:img.parentNode.tagName});if(!img.complete)loading++;if(src.indexOf(target)>=0&&img.naturalWidth>0)wanted=1;if((src.indexOf('catfdef1.png')>=0||src.indexOf('catdef2.png')>=0))stale=1;}
     if(loading&&retry<30){setTimeout(function(){go(retry+1);},50);return;}
     var payload=encodeURIComponent(JSON.stringify({point:point,stage:stage,sceneImages:sceneCount,images:items})).replace(/'/g,'%27');var node=document.getElementById('qa_dom_callback');node.setAttribute('href',"EXEC: if qa_dom_nonce="+nonce+": $qa_dom_last='"+payload+"' & qa_dom_target="+wanted+" & qa_dom_stale="+stale+" & qa_dom_count="+sceneCount+" & gs 'qa_checkpoint'");click(node);
   }setTimeout(function(){go(0);},120);
 }.toString()+")('<<$qa_checkpoint>>',<<qa_stage>>,'<<$qa_expected_action>>','<<$qa_expected_cut>>',<<qa_dom_nonce>>);";
 const html='<a id="qa_dom_callback" style="display:none" href="#"></a><script>'+js.replace(/\r?\n/g,' ')+'</script>';
 for(const n of ['interaction_screen_city','interaction_screen','city_screen','main_screen']){
   const old="$qa_checkpoint='"+n+"'\r\ngs 'qa_checkpoint'";let b=body(d,n);assert(b.includes(old),n);
   const hook="$qa_checkpoint='"+n+"'\r\n$qa_rendered_html=$maintxt\r\nqa_dom_nonce+=1\r\nqa_expected_layers=0\r\nif $bg[$place] ! '': qa_expected_layers+=1\r\nif $bg_path ! '': qa_expected_layers+=1\r\nif $special_image_full[txt] ! '':\r\n qa_expected_layers+=1\r\nelseif $special_image[txt] ! '':\r\n qa_expected_layers+=1\r\nend\r\n*p "+q(html);
   set(d,n,b.replace(old,hook));
 }
 let check=body(d,'qa_checkpoint').replace('$qa_html=$maintxt','$qa_html=$qa_rendered_html');
 const extra="if $qa_checkpoint='interaction_screen' and (qa_stage=5 or qa_stage=6):\nqa_checks+=3\nif qa_dom_target!1: qa_failures+=1 & $qa_failed+='DOM-current-image-loaded|'\nif qa_dom_stale!0: qa_failures+=1 & $qa_failed+='DOM-previous-cut-absent|'\nif qa_dom_count!qa_expected_layers: qa_failures+=1 & $qa_failed+='DOM-layer-count|'\nend\n";
 set(d,'qa_checkpoint',extra+check);set(d,'qa_next_case',body(d,'qa_next_case').replace('JO9_QA_IMAGELEAK_green_COMPLETE','JO9_QA_IMAGELEAK_dom_COMPLETE'));
 const b=c.serialize(d);qa.inspectWorld(b);fs.writeFileSync(D+'/transition.qsp',b);fs.writeFileSync(D+'/plan.json',JSON.stringify([{name:'dom-transitions',file:D+'/transition.qsp',marker:'JO9_QA_IMAGELEAK_dom_COMPLETE',checkpoint:'Real Qt DOM image loading, negative stale-image and layer-count checks across actual chained screen renders'}],null,2));console.log('DOM transition probe prepared');
}else{
 const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','G:/somi/JO9sa/tools/qa/run-client-smoke.ps1','-Engine',F+'/engine/jack.exe','-Plan',D+'/plan.json','-TimeoutSeconds','60'],{encoding:'utf8',windowsHide:true,timeout:75000});fs.writeFileSync(__dirname+'/dom-runner.log',(r.stdout||'')+(r.stderr||''));const client=JSON.parse(fs.readFileSync(D+'/client-results.json','utf8').replace(/^\uFEFF/,''));let report={client,processExit:r.status};if(fs.existsSync(D+'/result.sav')){const s=sc.parse(fs.readFileSync(D+'/result.sav'));Object.assign(report,{checks:+sc.value(s,'qa_checks')[0],failures:+sc.value(s,'qa_failures')[0],failedKeys:sc.value(s,'qa_failed')[1],lastDom:JSON.parse(decodeURIComponent(sc.value(s,'qa_dom_last')[1]))});}report.pass=r.status===0&&client.every(x=>x.pass)&&report.failures===0;fs.writeFileSync(__dirname+'/dom-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.pass)process.exitCode=1;
}
