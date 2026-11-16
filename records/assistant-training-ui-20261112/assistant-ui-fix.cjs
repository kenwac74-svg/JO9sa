const fs=require('fs'),z=require('zlib'),a=require('assert/strict');const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',D=R+'/records/assistant-training-ui-20261112',T='G:/Codex/tmp/assistant-training-ui-20261112',id='2026-11-12_zz_assistant_training_ui';const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),sv=require(R+'/tools/qa/save-codec.cjs'),rd=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),wr=(p,o)=>fs.writeFileSync(p,JSON.stringify(o,null,2)+'\n'),body=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),put=(d,n,s)=>d.lines[d.locations.find(l=>l.name===n).body]=c.shift(s,-5),q=s=>"'"+s.replace(/'/g,"''")+"'";
function fixture(raw,stage){const d=c.parse(raw),b=body(d,'menu_form').split('\r\n'),pet=b.slice(b.findIndex(s=>s.trim()==='if menu_form = 231:'),b.findIndex(s=>s==='!main menu - Assistant activities - Sex - Oral techniques')).join('\r\n'),ni=b.findIndex(s=>s.trim()==='IF menu_form = 238:'),ne=b.findIndex((s,i)=>i>ni&&s.includes('Cancel_Nipplefuck'))+1,nipple=b.slice(ni,ne+1).join('\r\n'),ei=b.findIndex((s,i)=>(s.trim()==='IF slave["boobs"] >= 3:'||s.trim()==='IF assistant["boobs"] >= 3:')&&b[i+1]?.includes('238')),entry=b.slice(ei,ei+5).join('\r\n');a(pet&&ni>0&&ne>ni&&ei>0);const setup=`killall
$onnewloc=''
$ongload=''
$counter=''
settimer 0
day=77
sparks=321
master_energy=5
assistant['energy']=4
slave['energy']=3
assistant['sub_hj']=6
assistant['sub_fj']=6
assistant['sub_hug']=6
assistant['sub_paizuri']=6
assistant['sub_nipplefuck']=2
assistant['nipplefuck']=4
slave['nipplefuck']=1
assistant['boobs']=3
slave['boobs']=3
CONST_INT['slave_exist']=1
assistant_state=1
slave_state=1
assistant_type=9001
slave_type=9002
$assistant['cloth']='голая'
$slave['cloth']='голая'
$assistant['fullimage']='QA_ASSISTANT_IMAGE'
$assistant['fullsecretary']='QA_ASSISTANT_SECRETARY'
$slave['fullimage']='QA_SLAVE_IMAGE'
$slave_nipplefuck[4]='ASSISTANT_LEVEL'
$slave_nipplefuck[1]='SLAVE_LEVEL'
hero_choice=0
snk_room_target=0
nsfw=1
$text_display=''
qa_failed=0
qa_checks=0
`;
const invariant="if day!77 or sparks!321 or master_energy!5 or assistant['energy']!4 or slave['energy']!3 or assistant['sub_nipplefuck']!2 or assistant['nipplefuck']!4 or slave['nipplefuck']!1: qa_failed+=1\n";
const variants=[];for(const [name,index,expected,mark]of [['nav-back',1,20,'navback'],['nav-cancel',2,0,'navcancel']]){const start=setup+"menu_form=231\ngs 'RenderPet'\n$qa_tail=$text_display\n$qa_marker='href = \"EXEC: '\nfor qa_i=1 to "+index+" step 1:\n qa_pos=instr($qa_tail,$qa_marker)\n if qa_pos<1: msg 'FAIL missing nav link' & exit\n $qa_tail=mid($qa_tail,qa_pos+len($qa_marker),len($qa_tail))\nend\n$qa_command=mid($qa_tail,1,instr($qa_tail,'\"')-1)\nif instr($qa_command,"+q("''")+")>0: msg 'FAIL doubled navigation quotes' & exit\nqa_expected="+expected+"\ndynamic $qa_command\nmsg 'FAIL navigation did not transfer'\nexit";const dest="if menu_form!qa_expected: qa_failed+=1\n"+invariant+"qa_checks=2\nsavegame "+q(name+'.sav')+"\nif qa_failed>0: msg 'FAIL navigation destination or state' & exit\nmsg 'JO9_QA_ASSIST_"+mark+"_COMPLETE'\nexit";variants.push({name,mark,start,extra:[['menu_form',dest]]});}
let images=setup+`for qa_slave=0 to 1 step 1:
 for qa_mode=0 to 3 step 3:
  for qa_nsfw=0 to 1 step 1:
   for qa_room=0 to 1 step 1:
    slave_state=qa_slave
    assistant['image_mode']=qa_mode
    nsfw=qa_nsfw
    snk_room_target=qa_room
    menu_form=238
    $text_display=''
    gs 'RenderNipple'
    if qa_nsfw=0 and qa_room=0:
     $qa_image=$iif(qa_mode=3,'QA_ASSISTANT_SECRETARY','QA_ASSISTANT_IMAGE')
     if instr($text_display,$qa_image)=0 or instr($text_display,'QA_SLAVE_IMAGE')>0: qa_failed+=1
    else
     if instr($text_display,'QA_ASSISTANT_')>0 or instr($text_display,'QA_SLAVE_IMAGE')>0: qa_failed+=1
    end
    qa_checks+=1
   end
  end
 end
end
nsfw=1
snk_room_target=0
for qa_slave=0 to 1 step 1:
 for qa_ab=2 to 3 step 1:
  for qa_sb=2 to 3 step 1:
   slave_state=qa_slave
   assistant['boobs']=qa_ab
   slave['boobs']=qa_sb
   qa_available=0
   $qa_caption=''
   gs 'RenderEntry'
   if qa_available!(qa_ab>=3): qa_failed+=1
   if qa_available=1 and $qa_caption!'ASSISTANT_LEVEL': qa_failed+=1
   qa_checks+=1
  end
 end
end
`+invariant+"qa_checks+=1\nsavegame 'images.sav'\nif qa_failed>0: msg 'FAIL assistant actor image/menu '+str(qa_failed) & exit\nmsg 'JO9_QA_ASSIST_images_COMPLETE'\nexit";variants.push({name:'images',mark:'images',start:images,extra:[]});
const dir=T+'/'+stage;fs.mkdirSync(dir,{recursive:true});fs.copyFileSync(G+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');const plans=[];for(const v of variants){const locs=[['Start',v.start],['RenderPet',pet],['RenderNipple',nipple],['RenderEntry',entry],['display_fullimage',body(d,'display_fullimage')],['jo9_seed_role_images',"$result=$args[2]"],['$menu',"if $args[0]='menu_form' and args[2]=238: qa_available=1 & $qa_caption=$args[3]"],...v.extra],lines=['QSPGAME','','',c.shift(String(locs.length),-5)];for(const[n,s]of locs)lines.push(c.shift(n,-5),'',c.shift(s.replace(/\r?\n/g,'\r\n'),-5),c.shift('0',-5));lines.push('');const out=c.serialize({lines});qa.inspectWorld(out);fs.writeFileSync(dir+'/'+v.name+'.qsp',out);plans.push({name:v.name,file:dir+'/'+v.name+'.qsp',marker:'JO9_QA_ASSIST_'+v.mark+'_COMPLETE',checkpoint:v.name==='images'?'Actual resolver16 image/state combinations +8 actor/size menu combinations +state preservation':'Render real HTML and execute extracted '+v.name+' href, check destination and game values'});}wr(dir+'/plan.json',plans);
}
if(process.argv[2]==='baseline'){
fs.mkdirSync(D,{recursive:true});fs.mkdirSync(T+'/mods',{recursive:true});const raw=fs.readFileSync(G+'/jack.qsp');a.equal(c.hash(raw),c.hash(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));qa.inspectWorld(raw);fs.writeFileSync(D+'/baseline.qsp.gz',z.gzipSync(raw));fs.writeFileSync(D+'/manifest.before.json.gz',z.gzipSync(fs.readFileSync(R+'/assets/runtime-source-2.4.1.json')));wr(D+'/verification.json',{before:c.hash(raw),locations:['menu_form']});fixture(raw,'before');console.log('Baseline navigation/image fixtures created');
}else if(process.argv[2]==='patch'){
a(rd(T+'/before/client-results.json').every(x=>!x.pass));const raw=z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz'));a.equal(c.hash(raw),c.hash(fs.readFileSync(G+'/jack.qsp')));const d=c.parse(raw),edits=[];function edit(old,nu){a.equal(body(d,'menu_form').split(old).length-1,1);put(d,'menu_form',body(d,'menu_form').replace(old,()=>nu));edits.push({location:'menu_form',field:'body',old,new:nu,count:1,patchId:'ASSISTANT_TRAINING_UI_20261112'});}
for(const name of ['Back_Petting','Cancel_Petting']){const old=body(d,'menu_form').split('\r\n').find(s=>s.includes('id="'+name+'"')&&s.includes('+= {'));a(old);edit(old,old.replace('+= {',"+= '").replace(/}$/, "'"));}
const lines=body(d,'menu_form').split('\r\n'),at=lines.findIndex(s=>s.trim()==='IF menu_form = 238:');const image=lines.slice(at,at+3).join('\r\n');a(image.includes("func('display_fullimage', 'slave'"));edit(image,image.replace("func('display_fullimage', 'slave'","func('display_fullimage', 'assistant'"));
const ei=lines.findIndex((s,i)=>s.trim()==='IF slave["boobs"] >= 3:'&&lines[i+1]?.includes('238'));a(ei>0);const old=lines.slice(ei,ei+2).join('\r\n');edit(old,old.replaceAll('slave["boobs"]','assistant["boobs"]').replaceAll('slave["nipplefuck"]','assistant["nipplefuck"]'));
const petPart=s=>s.slice(s.indexOf('if menu_form = 231:'),s.indexOf('!main menu - Assistant activities - Sex - Oral techniques'));edits.splice(0,2,{location:'menu_form',field:'body',old:petPart(body(c.parse(raw),'menu_form')),new:petPart(body(d,'menu_form')),count:1,patchId:'ASSISTANT_TRAINING_UI_20261112'});
const candidate=c.serialize(d);qa.inspectWorld(candidate);const m={id,status:'APPROVED',before_sha256:c.hash(raw),after_sha256:c.hash(candidate),description:'조수 애무 뒤로/취소의 중괄호 문자열 따옴표 오류 수정 및 유두 교육 선택화면 이미지/체형/단계의 조수 대상 정정. 비용/수치/교육 결과/이미지 자산 보존.',edits};wr(R+'/mods/'+id+'.json',m);wr(T+'/mods/'+id+'.json',m);fs.writeFileSync(T+'/candidate.qsp',raw);const p=rd(D+'/verification.json');p.after=c.hash(candidate);p.edits=edits.length;wr(D+'/verification.json',p);fixture(candidate,'after');console.log(p.after);
}else if(process.argv[2]==='finish'){
const p=rd(D+'/verification.json');a(rd(T+'/after/client-results.json').every(x=>x.pass));const raw=fs.readFileSync(G+'/jack.qsp');a.equal(c.hash(raw),p.after);a.equal(c.hash(fs.readFileSync(T+'/candidate.qsp')),p.after);qa.inspectWorld(raw);const restored=c.parse(raw),m=rd(R+'/mods/'+id+'.json');for(const e of [...m.edits].reverse()){const s=body(restored,e.location);a.equal(s.split(e.new).length-1,1);put(restored,e.location,s.replace(e.new,()=>e.old));}a(c.serialize(restored).equals(z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz'))));fs.copyFileSync(G+'/jack.qsp',R+'/assets/runtime/2.4.1/jack.qsp');const meta=rd(R+'/assets/runtime-source-2.4.1.json');a.equal(meta.sourceQspSha256,p.before);meta.sourceQspSha256=p.after;for(const f of meta.files)if(f.runtimePath==='jack.qsp'){f.sha256=p.after;f.bytes=raw.length;}meta.latestAssistantTrainingUI={date:'2026-11-12',mod:id,report:'records/assistant-training-ui-20261112/REPORT_KO.md'};wr(R+'/assets/runtime-source-2.4.1.json',meta);for(const stage of ['before','after'])for(const f of fs.readdirSync(T+'/'+stage))if(/\.log$|client-results\.json$/.test(f))fs.copyFileSync(T+'/'+stage+'/'+f,D+'/'+stage+'-'+f);for(const[n,count]of [['nav-back',2],['nav-cancel',2],['images',25]]){const s=sv.parse(fs.readFileSync(T+'/after/'+n+'.sav'));a.equal(+sv.value(s,'qa_failed')[0],0);a.equal(+sv.value(s,'qa_checks')[0],count);}fs.copyFileSync('./assistant-ui-fix.cjs',D+'/assistant-ui-fix.cjs');console.log('WORK/source/manifest, native nav2 + image/menu25, inverse byte scope PASS '+p.after);
}
