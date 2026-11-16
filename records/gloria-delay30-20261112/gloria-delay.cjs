const fs=require('fs'),z=require('zlib'),a=require('assert/strict');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',D=R+'/records/gloria-delay30-20261112',T='G:/Codex/tmp/gloria-delay30-20261112',id='2026-11-12_zz_gloria_delay30_rumor';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),sv=require(R+'/tools/qa/save-codec.cjs'),rd=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),wr=(p,o)=>fs.writeFileSync(p,JSON.stringify(o,null,2)+'\n'),body=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),put=(d,n,s)=>d.lines[d.locations.find(l=>l.name===n).body]=c.shift(s,-5),q=s=>"'"+s.replace(/'/g,"''")+"'";
const oldTerm='day - jo9_gloria_successor_day >= 60',newTerm='day - jo9_gloria_successor_day >= 30';
const cache="! JO9 MOD START GLORIA_DELAY_CACHE_20261112\r\n! Refresh only the old Gloria wait term; keep saved menu customizations and quest progress.\r\n$realtor_options[1] = replace($realtor_options[1], "+q(oldTerm)+', '+q(newTerm)+")\r\n$display_options[1] = replace($display_options[1], "+q(oldTerm)+', '+q(newTerm)+")\r\n! JO9 MOD END GLORIA_DELAY_CACHE_20261112\r\n";
function fixture(raw,name,hasCache){const d=c.parse(raw),lines=body(d,'#options').split('\r\n'),mi=lines.findIndex(s=>s.includes('day - jo9_gloria_successor_day >=')),menu=lines.slice(mi,mi+3).join('\r\n'),r=body(d,'jo9_rumor_scan').split('\r\n'),ri=r.findIndex(s=>s.trim().startsWith("if $jo9_rs_provider = 'skups' and jo9_gloria_event")),rumor=r.slice(ri,ri+3).join('\r\n');a(mi>0&&ri>0);let code="killall\r\n$onnewloc=''\r\n$ongload=''\r\n$counter=''\r\nsettimer 0\r\nCONST_INT['no_slave']=0\r\nqa_failed=0\r\nqa_count=0\r\n";
code+=`for qa_day = 29 to 31 step 1:
 for qa_successor = 0 to 1 step 1:
  for qa_event = 0 to 2 step 1:
   for qa_slave = 0 to 1 step 1:
    for qa_provider = 0 to 1 step 1:
     for qa_room = 0 to 1 step 1:
      day=43+qa_day
      jo9_gloria_successor_day=43
      jo9_gloria_successor=qa_successor
      jo9_gloria_event=qa_event
      slave_state=qa_slave
      snk_room_target=qa_room
      $jo9_rs_provider=$iif(qa_provider=0,'skups','other')
      qa_open=0
      killvar '$jo9_rumor_pages'
      gs 'GloriaMenuGate'
      gs 'GloriaRumorGate'
      qa_expected_menu=(qa_successor=1 and qa_event=0 and qa_day>=30 and qa_slave=0)
      qa_expected_rumor=(qa_successor=1 and qa_event=0 and qa_day>=30 and qa_provider=0 and qa_room=0)
      if qa_open!qa_expected_menu: qa_failed+=1
      if arrsize('$jo9_rumor_pages')!qa_expected_rumor: qa_failed+=1
      if day!43+qa_day or jo9_gloria_successor_day!43 or jo9_gloria_successor!qa_successor or jo9_gloria_event!qa_event or slave_state!qa_slave: qa_failed+=1
      qa_count+=1
     end
    end
   end
  end
 end
end
`;
const bds=sv.parse(fs.readFileSync(G+'/save/bds.sav')),oldMenu=sv.value(bds,'realtor_options')[1]; // Array entry fetched below; preserve literal cached menu.
const v=bds.vars.find(x=>x.name==='REALTOR_OPTIONS');a(v?.values[1]);const saved=v.values[1][1];a(saved.includes(oldTerm));
code+='$realtor_options[1]='+q(saved)+"\r\n$display_options[1]="+q(saved+"\r\n! CUSTOM_MENU_SENTINEL")+"\r\n$display_options[2]='CUSTOM_OTHER_PAGE'\r\nday=66\r\njo9_gloria_successor_day=43\r\njo9_gloria_successor=1\r\njo9_gloria_event=0\r\nslave_state=0\r\n";
if(hasCache)code+='dynamic {\r\n'+cache+'}\r\n';
code+="if instr($realtor_options[1], "+q(newTerm)+")=0 or instr($display_options[1], "+q(newTerm)+")=0: qa_failed+=1\r\nif instr($display_options[1], 'CUSTOM_MENU_SENTINEL')=0 or $display_options[2]!'CUSTOM_OTHER_PAGE': qa_failed+=1\r\nif day!66 or jo9_gloria_successor_day!43 or jo9_gloria_successor!1 or jo9_gloria_event!0 or slave_state!0: qa_failed+=1\r\n";
if(hasCache)code+='dynamic {\r\n'+cache+'}\r\n';
code+="if instr($realtor_options[1], "+q(oldTerm)+")>0: qa_failed+=1\r\nqa_count+=1\r\nsavegame 'gloria-delay.sav'\r\nif qa_failed>0: msg 'FAIL Gloria delay checks '+str(qa_failed) & exit\r\nmsg 'JO9_QA_GLORIA_delay_COMPLETE'\r\nexit";
const locations=[['Start',code.replace(/\r?\n/g,'\r\n')],['GloriaMenuGate',menu],['GloriaRumorGate',rumor],['$menu',"if $args[0]='interaction_city' and args[2]=951541: qa_open=1"]],out=['QSPGAME','','',c.shift(String(locations.length),-5)];for(const[n,s]of locations)out.push(c.shift(n,-5),'',c.shift(s,-5),c.shift('0',-5));out.push('');const dir=T+'/'+name;fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/gloria-delay.qsp',c.serialize({lines:out}));fs.copyFileSync(G+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');wr(dir+'/plan.json',[{name:'gloria-delay',file:dir+'/gloria-delay.qsp',marker:'JO9_QA_GLORIA_delay_COMPLETE',checkpoint:'144 quest/rumor combinations at days29/30/31 plus real bds menu-cache preservation'}]);}
if(process.argv[2]==='prepare'){
fs.mkdirSync(D,{recursive:true});fs.mkdirSync(T+'/mods',{recursive:true});const raw=fs.readFileSync(G+'/jack.qsp');qa.inspectWorld(raw);a.equal(c.hash(raw),c.hash(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));const d=c.parse(raw),edits=[];function edit(n,old,nu){a.equal(body(d,n).split(old).length-1,1);put(d,n,body(d,n).replace(old,()=>nu));edits.push({location:n,field:'body',old,new:nu,count:1,patchId:'GLORIA_DELAY30_RUMOR_20261112'});}
edit('#options','! Sixty days after the first A or better secretary was delivered, with the slave slot empty.\r\n\t\tif jo9_gloria_successor = 1 and jo9_gloria_event = 0 and '+oldTerm+" and slave_state = CONST_INT['no_slave']:",'! Thirty days after the first A or better secretary was delivered, with the slave slot empty.\r\n\t\tif jo9_gloria_successor = 1 and jo9_gloria_event = 0 and '+newTerm+" and slave_state = CONST_INT['no_slave']:");
const old=" if $jo9_rs_provider = 'skups' and jo9_gloria_event = 0 and snk_room_target <= 0:",nu=" if $jo9_rs_provider = 'skups' and jo9_gloria_event = 0 and snk_room_target <= 0 and jo9_gloria_successor = 1 and "+newTerm+':';edit('jo9_rumor_scan',old,nu);const load=body(d,'$ongload');edit('$ongload',load,cache+load);const candidate=c.serialize(d);qa.inspectWorld(candidate);const mod={id,status:'APPROVED',before_sha256:c.hash(raw),after_sha256:c.hash(candidate),description:'사용자 승인: 글로리아 후임 납품 후 대기60→30일, 스쿱스 소문도 같은30일부터. 기존 메뉴 캐시의 해당 날짜조건만 치환; 세이브/진행/비용/완료조건 보존.',edits};wr(R+'/mods/'+id+'.json',mod);wr(T+'/mods/'+id+'.json',mod);fs.writeFileSync(T+'/candidate.qsp',raw);fs.writeFileSync(D+'/baseline.qsp.gz',z.gzipSync(raw));fs.writeFileSync(D+'/manifest.before.json.gz',z.gzipSync(fs.readFileSync(R+'/assets/runtime-source-2.4.1.json')));wr(D+'/verification.json',{before:c.hash(raw),after:c.hash(candidate),bdsSha256:c.hash(fs.readFileSync(G+'/save/bds.sav')),bdsDay:66,bdsSuccessorDay:43,newUnlockDay:73,locations:edits.map(e=>e.location),cache});fixture(raw,'before',false);fixture(candidate,'after',true);console.log(c.hash(candidate));
}else if(process.argv[2]==='finish'){
const p=rd(D+'/verification.json');a(rd(T+'/after/client-results.json').every(x=>x.pass));a.equal(rd(T+'/before/client-results.json')[0].pass,false);a.equal(c.hash(fs.readFileSync(G+'/jack.qsp')),p.after);a.equal(c.hash(fs.readFileSync(T+'/candidate.qsp')),p.after);a.equal(c.hash(fs.readFileSync(G+'/save/bds.sav')),p.bdsSha256);qa.inspectWorld(fs.readFileSync(G+'/jack.qsp'));fs.copyFileSync(G+'/jack.qsp',R+'/assets/runtime/2.4.1/jack.qsp');const m=rd(R+'/assets/runtime-source-2.4.1.json');a.equal(m.sourceQspSha256,p.before);m.sourceQspSha256=p.after;for(const f of m.files)if(f.runtimePath==='jack.qsp'){f.sha256=p.after;f.bytes=fs.statSync(G+'/jack.qsp').size;}m.latestGloriaDelay30={date:'2026-11-12',mod:id,report:'records/gloria-delay30-20261112/REPORT_KO.md'};wr(R+'/assets/runtime-source-2.4.1.json',m);for(const mode of ['before','after'])for(const f of fs.readdirSync(T+'/'+mode))if(/\.log$|client-results\.json$/.test(f))fs.copyFileSync(T+'/'+mode+'/'+f,D+'/'+mode+'-'+f);const saved=sv.parse(fs.readFileSync(T+'/after/gloria-delay.sav'));a.equal(+sv.value(saved,'qa_count')[0],145);a.equal(+sv.value(saved,'qa_failed')[0],0);fs.copyFileSync('./gloria-delay.cjs',D+'/gloria-delay.cjs');console.log('Installed/source/manifest PASS; native145 cases; original bds unchanged. '+p.after);
}
