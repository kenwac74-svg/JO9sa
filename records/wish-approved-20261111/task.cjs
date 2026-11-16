'use strict';
const fs=require('node:fs'),a=require('node:assert/strict'),cp=require('node:child_process'),z=require('node:zlib');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/jo9-wish-approved-20261111',rec=repo+'/records/wish-approved-20261111';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'),hash=p=>c.hash(fs.readFileSync(p)),q=s=>"'"+s.replaceAll("'","''")+"'";
const id='2026-11-11_wish_approved_dialogue',marker='WISH_APPROVED_DIALOGUE_20261111';
const data=[
 ['oral_affinity','> 0','펠라 중독','주인님, 전 항상 뭘 빨고 있는게 너무 좋아요… 그런데 말만 시키시니 보여 드릴 기회가 없네요.',false],
 ['anal_affinity','> 0','애널 중독','전 그..앞으로 말고 뒤로 하는게 더 좋더라고요…언제 제대로 배우나 기다려져요.',false],
 ['nymphomania','= 1','색정광','오늘 수업은 벌써 끝인가요? 저는 아직 더 배울 수 있는데… 내일은 조금 더 오래 가르쳐 주시면 안 돼요?',true],
 ['nymphomania','> 1','정액 중독','수업이 끝나면 늘 아쉬워요. 제가 잘해서 주인님이 마지막에 제 구멍에 잔뜩 싸주실 때가 너무 행복하거든요.',true],
 ['homosexualism','= 2','레즈비언','개인적으로는 여자랑 섹스하는게 더 좋지만, 주인님이 시키시는거면 할 수 없죠...',true],
 ['homosexualism','= 1','양성애자','저는…남자나 여자나 가리지 않고 다 같이 잘 놀 수 있답니다.',true]
];
const common='저는 다양한 기술로 남자들을 끝까지 짜내는 섹스머신이 되고 싶어요 😄',general=['masochism','exhibitionism','perversion'];
fs.mkdirSync(tmp,{recursive:true});fs.mkdirSync(rec,{recursive:true});const raw=fs.readFileSync(game+'/jack.qsp'),doc=c.parse(raw),loc=doc.locations.find(l=>l.name==='chose_answer'),body=c.shift(doc.lines[loc.body],5);
function probe(bytes,kind){
 const d=c.parse(bytes),answer=c.shift(d.lines[d.locations.find(l=>l.name==='chose_answer').body],5);
 const setup=data.map((v,i)=>`$qa_text[${i}]=${q(v[3])}`).join('\n')+`\n$qa_common=${q(common)}`;
 const append=data.map((v,i)=>`if slave['${v[0]}'] ${v[1]}: $qa_expected[]= $qa_text[${i}]`).join('\n');
 const code=`
$voice_native={$result=$args[0]}
$update_slave_features_list={qa_refreshes+=1}
${setup}
interaction=1114
qa_cases=0 & qa_fail=0
for qa_oral=0 to 1 step 1:
 for qa_anal=0 to 1 step 1:
  for qa_nymph=0 to 2 step 1:
   for qa_orientation=0 to 2 step 1:
    for qa_maso=0 to 1 step 1:
     for qa_expo=0 to 1 step 1:
      for qa_perv=0 to 1 step 1:
       killvar 'slave' & killvar '$text' & killvar '$special_action' & killvar '$qa_expected'
       slave['oral_affinity']=qa_oral & slave['anal_affinity']=qa_anal
       slave['nymphomania']=qa_nymph & slave['homosexualism']=qa_orientation
       slave['masochism']=qa_maso*2 & slave['exhibitionism']=qa_expo*2 & slave['perversion']=qa_perv*2
       ${append}
       if qa_maso+qa_expo+qa_perv>0: $qa_expected[]=$qa_common
       gs 'Answer'
       if arrsize('$qa_expected')>0:
        if arrsize('$text')!arrsize('$qa_expected'): qa_fail+=1
        for qa_page=0 to arrsize('$qa_expected')-1 step 1:
         if instr($text[qa_page],$qa_expected[qa_page])=0: qa_fail+=1
         if $special_action[qa_page]='': qa_fail+=1
         if $special_action[qa_page]!'': dynamic $special_action[qa_page]
        end
       else
        if arrsize('$text')!1: qa_fail+=1
        if $special_action[0]!'': qa_fail+=1
       end
       if qa_nymph>0 and slave['nymphomania_revealed']!2: qa_fail+=1
       if qa_nymph=0 and slave['nymphomania_revealed']!0: qa_fail+=1
       if qa_orientation>0 and slave['homosexualism_revealed']!2: qa_fail+=1
       if qa_orientation=0 and slave['homosexualism_revealed']!0: qa_fail+=1
       if slave['masochism_revealed']!qa_maso*2 or slave['exhibitionism_revealed']!qa_expo*2 or slave['perversion_revealed']!qa_perv*2: qa_fail+=1
       if slave['oral_affinity']!qa_oral or slave['anal_affinity']!qa_anal or slave['nymphomania']!qa_nymph or slave['homosexualism']!qa_orientation: qa_fail+=1
       qa_cases+=1
      end
     end
    end
   end
  end
 end
end
if qa_cases!288: msg 'FAIL count '+qa_cases & exit
if qa_fail>0: msg 'FAIL approved wish checks '+qa_fail & exit
msg 'JO9_QA_WISH_approved_matrix_COMPLETE'
exit`.trim().replace(/\n/g,'\r\n');
 const lines=['QSPGAME','','',c.shift('2',-5)];for(const [n,b]of [['Start',code],['Answer',answer]])lines.push(c.shift(n,-5),'',c.shift(b,-5),c.shift('0',-5));lines.push('');
 const dir=tmp+'/'+kind;fs.mkdirSync(dir,{recursive:true});fs.copyFileSync(game+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');fs.writeFileSync(dir+'/wish.qsp',c.serialize({lines}));write(dir+'/plan.json',[{name:'wish',file:dir+'/wish.qsp',marker:'JO9_QA_WISH_approved_matrix_COMPLETE',checkpoint:'288 combinations:exact approved text, exclusive stages/orientation, common-page dedup, reveal and original values; voice/list-render doubles'}]);console.log(dir+'/plan.json');
}
const mode=process.argv[2];if(mode==='before')probe(raw,'before');
if(mode==='prepare'){
 a(!body.includes(marker));a(c.serialize(doc).equals(raw));a.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),doc.hash);a(read(tmp+'/before/client-results.json').some(v=>!v.pass));
 const callback=(condition,assign)=>"\t$special_action[arrsize('$text')-1] = {\r\n\t if interaction = 1114 and ("+condition+"):\r\n"+assign+"\t  dynamic $replace($update_slave_features_list, 'dyn'+'slave', 'slave')\r\n\t end\r\n\t}\r\n";
 let block='! JO9 MOD START '+marker+'\r\n';for(const [key,op,title,text,reveal]of data){const condition="slave['"+key+"'] "+op;block+='\tif '+condition+':\r\n\t $text[] = \'[\'+$slave_name+\']<br>&nbsp;\' + '+q(text)+'\r\n'+callback(condition,reveal?"\t  slave['"+key+"_revealed'] = 2\r\n":'')+'\tend\r\n';}
 const gc=general.map(k=>"slave['"+k+"'] = 2").join(' or ');block+='\tif '+gc+':\r\n\t $text[] = \'[\'+$slave_name+\']<br>&nbsp;\' + '+q(common)+'\r\n'+callback(gc,general.map(k=>"\t  if slave['"+k+"'] = 2: slave['"+k+"_revealed'] = 2\r\n").join(''))+'\tend\r\n! JO9 MOD END '+marker+'\r\n';
 const old=body.match(/^if interaction = 1114:\r\n[\s\S]*?^end/m)[0],needle="\tif arrsize('$text') = 0:";a.equal(old.split(needle).length-1,1);const next=old.replace(needle,block+needle);doc.lines[loc.body]=c.shift(body.replace(old,next),-5);const candidate=c.serialize(doc);qa.inspectWorld(candidate);
 for(const v of data)a(c.parse(candidate)&&c.shift(doc.lines[loc.body],5).includes(v[3]));a(c.shift(doc.lines[loc.body],5).includes(common));
 const backup='G:/somi/JO9_work_backups/wish-approved-20261111-'+c.hash(raw).slice(0,12);fs.mkdirSync(backup,{recursive:true});const gz=z.gzipSync(raw);a(z.gunzipSync(gz).equals(raw));fs.writeFileSync(backup+'/before.qsp.gz',gz);fs.copyFileSync(repo+'/assets/runtime-source-2.4.1.json',backup+'/runtime-source-before.json');
 const mod={id,status:'APPROVED',description:'Insert six user-authored trait wish lines verbatim; share the user-authored common line plus smiling emoji among three remaining positive traits; disclose only existing traits on displayed pages. Magic and earlier fourteen affinities preserved.',before_sha256:c.hash(raw),after_sha256:c.hash(candidate),edits:[{location:'chose_answer',field:'body',old,new:next,count:1,patchId:marker}]};fs.mkdirSync(tmp+'/mods',{recursive:true});write(tmp+'/mods/'+id+'.json',mod);write(repo+'/mods/'+id+'.json',mod);fs.writeFileSync(tmp+'/candidate.qsp',candidate);fs.writeFileSync(tmp+'/replay.qsp',raw);write(rec+'/prepared.json',{before:mod.before_sha256,after:mod.after_sha256,backup});write(rec+'/APPROVED_DIALOGUE.json',{status:'USER_AUTHORED_APPROVED',date:'2026-11-11',individual:data.map(([key,condition,trait,text,reveal])=>({key,condition,trait,text,revealOnDisplay:reveal})),common:{text:common,keys:general,condition:'= 2',deduplicated:true}});probe(candidate,'after');
}
if(mode==='install'){
 const s=read(rec+'/prepared.json');a(read(tmp+'/after/client-results.json').every(v=>v.pass));a.equal(c.hash(raw),s.before);a.equal(hash(tmp+'/replay.qsp'),s.after);a.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),s.before);
 const args=['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',tmp+'/mods'];for(const n of ['apply','reapply']){const b=cp.execFileSync('powershell.exe',args,{windowsHide:true});fs.writeFileSync(rec+'/'+n+'.log',new TextDecoder('euc-kr').decode(b));a.equal(hash(game+'/jack.qsp'),s.after);}
 fs.copyFileSync(game+'/jack.qsp',repo+'/assets/runtime/2.4.1/jack.qsp');const p=repo+'/assets/runtime-source-2.4.1.json',m=read(p);a.equal(m.sourceQspSha256,s.before);m.sourceQspSha256=s.after;for(const f of m.files)if(f.repositoryPath==='assets/runtime/2.4.1/jack.qsp'){f.sha256=s.after;f.bytes=fs.statSync(game+'/jack.qsp').size;}m.latestWishApprovedDialogue={date:'2026-11-11',mod:id,report:'records/wish-approved-20261111/REPORT_KO.md'};if(m.latestWishDiscovery)m.latestWishDiscovery.pendingNewDialogue=false;write(p,m);
 const final=c.parse(fs.readFileSync(game+'/jack.qsp')),prior=c.parse(z.gunzipSync(fs.readFileSync(s.backup+'/before.qsp.gz'))),changed=prior.locations.filter(l=>prior.lines[l.body]!==final.lines[l.body]).map(l=>l.name);a.deepEqual(changed,['chose_answer']);write(rec+'/verification.json',{...s,changedLocations:changed,structure:qa.inspectWorld(fs.readFileSync(game+'/jack.qsp')),nativeScenarios:288,userTextPreserved:true,commonDeduplicated:true,magicPreserved:true,traitValuesUnchanged:true,fullTouched:false,commit:false,push:false});for(const stage of ['before','after'])for(const [src,dst]of [['client-results.json','native-'+stage+'.json'],['wish-stderr.log','native-'+stage+'.log']])fs.copyFileSync(tmp+'/'+stage+'/'+src,rec+'/'+dst);console.log('Installed approved dialogue; WORK/source aligned.');
}
