'use strict';
const fs=require('fs'),assert=require('assert/strict'),z=require('zlib');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',rec=repo+'/records/chunhyang-menu-links-20261112',tmp='G:/Codex/tmp/chunhyang-menu-links-20261112';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),json=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n'),body=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),put=(d,n,s)=>d.lines[d.locations.find(l=>l.name===n).body]=c.shift(s.replace(/\r?\n/g,'\r\n'),-5);
const imageSource=game+'/content/modworkpic/girls/chunhyang/거대한 클레이모어와 전쟁의 방.png',imageTarget=game+'/content/pic/bg/chunhyang.png',id='2026-11-12_chunhyang_scene_presentation';
const phase=process.argv[2];
if(phase==='prepare'){
 const baseline=fs.readFileSync(game+'/jack.qsp'),links=read(repo+'/mods/2026-11-12_chunhyang_menu_links.json');assert.equal(c.hash(baseline),links.before_sha256);const d=c.parse(baseline);put(d,'jo9_chun_club',links.edits[0].new);assert.equal(c.hash(c.serialize(d)),links.after_sha256);
 const edits=[];function edit(location,old,fixed){old=old.replace(/\r?\n/g,'\r\n');fixed=fixed.replace(/\r?\n/g,'\r\n');const s=body(d,location);assert.equal(s.split(old).length,2,location+' unique old');put(d,location,s.replace(old,fixed));edits.push({location,field:'body',old,new:fixed,count:1,patchId:'CHUNHYANG_SCENE_PRESENTATION_20261112'});}
 let club=body(d,'jo9_chun_club'),newClub=club;
 newClub=newClub.replace(" $bg['chunhyang_battle'] = $bg['catfightclub']\r\n if $bg['chunhyang_battle'] = '': $bg['chunhyang_battle'] = 'catfightclub'"," $bg['chunhyang_battle'] = 'chunhyang'");
 newClub=newClub.replace("  $text_display += '<div id=\"center_Isabella\"><img src=\"content/pic/characters/3040_chunhyang_title.png\"></div>'",'');
 // Actual current helper has one leading space on the foreground line.
 newClub=newClub.replace(" $text_display += '<div id=\"center_Isabella\"><img src=\"content/pic/characters/3040_chunhyang_title.png\"></div>'",'');
 const lines={
  "[춘향]<br>에게야가 떠난 뒤 이 클럽을 샀습니다. 경기 상대도 새로 모았습니다. 전보다 힘겨운 싸움이 될 겁니다.":"[춘향]<br>…어서 오십시오. 에게야가 떠난 뒤 이곳을 인수했습니다.<br>경기 상대는 제가 골랐습니다. 예전과 같은 싸움을 생각하고 오셨다면, 먼저 구경하시는 편이 좋겠습니다.",
  "[춘향]<br>약속은 지키겠습니다. 저와 이 클럽은 당신 것입니다. 저를 데려갈 준비가 되면 말씀하십시오.<br>클럽 재개장에는 지배인이 필요하다.":"[춘향]<br>약속은 지키겠습니다. 이제 저와 이 클럽은 당신 것입니다.<br>…데려가실 준비가 되시면 말씀하십시오. 기다리겠습니다.<br><br>클럽을 다시 열려면 운영을 맡길 지배인이 필요하다.",
  "[춘향]<br>대쥬신제국에서는 암행어사 문수님의 산도였습니다. 계략에 빠져 로마에 왔고, 한 여주인의 검투 노예로 살았습니다. 콜로세움 최고의 챔피언이 되어 자유를 얻은 뒤 이곳을 샀습니다.<br>제게 이기시면 당신을 따르겠습니다. 20만 스파크 이상은 갖고 오십시오. 지셨을 때의 대가는 당신이 살아온 방식에 달렸습니다.":"[춘향]<br>대쥬신제국에서 암행어사 문수님의 산도로 일했습니다. 계략에 빠져 로마로 왔고, 한 여주인의 검투 노예로 살았습니다. 콜로세움 최고의 챔피언이 되어 자유를 얻은 뒤 이 클럽을 샀습니다.<br>일반 경기는 선수 한 사람당 여섯 번까지입니다. 제게 직접 도전하시려면 20만 스파크 이상은 갖고 오십시오. 이기시면 저와 이 클럽을 드리겠습니다. 지셨을 때의 대가는… 당신이 살아온 방식에 달렸습니다.",
  "[춘향]<br>경기에서 버틸 수 있는 사람을 찾습니다. <font color=\"#008080\"><b>체력이 A 이상</b></font>이어야 합니다. 나머지는 직접 살펴보겠습니다.":"[춘향]<br>검투사로 훈련받은 선수를 찾습니다. 무기를 들고 버틸 몸부터 갖춰야 합니다. <font color=\"#008080\"><b>체력이 A 이상</b></font>이어야 합니다.<br>…나머지는 직접 살펴보겠습니다. 말만으로는 받지 않습니다.",
  "[춘향]<br>지금은 선수가 충분합니다. 자리가 나면 다시 말씀드리겠습니다.":"[춘향]<br>지금은 선수가 충분합니다. 새로 받을 자리는 없습니다.<br>…며칠 뒤에 다시 들르십시오.",
  "[춘향]<br>승부는 났습니다. 오늘은 돌아가십시오.<br>결투 패배로 <<jo9_chunhyang[\"last_cost\"]>> 스파크를 정산했다.":"[춘향]<br>…승부는 났습니다. 더는 무리하지 마십시오.<br>약속한 대가는 받겠습니다. 오늘은 돌아가십시오.<br><br>결투 패배로 <<jo9_chunhyang[\"last_cost\"]>> 스파크를 정산했다.",
  "[춘향]<br>…제가 졌습니다. 약속대로 당신을 따르겠습니다. 이 클럽도 넘겨드리겠습니다. 준비가 되시면 말씀하십시오.<br>승리로 스파크가 차감되지는 않았다. 클럽 재개장에는 지배인이 필요하다.":"[춘향]<br>…제가 졌습니다. 변명하지 않겠습니다.<br>약속대로 당신을 따르겠습니다. 클럽도 넘겨드리지요. 데려가실 준비가 되면 말씀하십시오.<br><br>승리로 스파크가 차감되지는 않았다. 클럽을 다시 열려면 지배인이 필요하다."
 };
 for(const [old,fixed]of Object.entries(lines)){assert(newClub.includes(old),old);newClub=newClub.replace(old,fixed);}assert(!newClub.includes('<div id="center_Isabella">'));edit('jo9_chun_club',club,newClub);
 const menuLine='dynamic $display_options[sp_txt]';
 edit('shop_general',menuLine,menuLine+`\n! JO9 MOD START CHUNHYANG_MENU_STAGE_20261112
if $place = 'catfightclub' and egeya_lose ! 0 and interaction_city = 904030 and sp_txt = 3:
 $sp_text[3] = '[춘향]<br>익숙한 무장을 고르십시오. 상대가 누구든, 다루지 못하는 무기는 짐이 됩니다.<br>…준비되시면 말씀하십시오.'
end
if $place = 'chunhyang_battle' and sp_txt = 1 and instr($sp_text[1],'[춘향]<br>제게 이기시면') = 0:
 $sp_text[1] = '[춘향]<br>제게 이기시면 저와 이 클럽을 드리겠습니다. 지셨을 때의 대가는 당신이 살아온 방식에 달렸습니다.<br>…무장을 고르십시오.<br><br>' + $sp_text[1]
end
! JO9 MOD END CHUNHYANG_MENU_STAGE_20261112`);
 const bg="\t*p func('interior_change', 'jo9_html', '<div id = \"bg\"><img src=\"content/pic/bg/<<$bg[$place]>>.png\"></div>')";
 edit('shop_general',bg,`! JO9 MOD START CHUNHYANG_MENU_BACKGROUND_20261112
 if ($place = 'catfightclub' and egeya_lose ! 0 and interaction_city = 904030) or $place = 'chunhyang_battle':
  *p func('interior_change', 'jo9_html', '<div id = "bg"><img src="content/pic/bg/chunhyang.png" width="795" height="596"></div>')
 else
${bg}
 end
! JO9 MOD END CHUNHYANG_MENU_BACKGROUND_20261112`);
 const oldShared=body(d,'interaction_city').match(/! JO9 MOD START CHUNHYANG_CLUB_TEXT_20261112[\s\S]*?! JO9 MOD END CHUNHYANG_CLUB_TEXT_20261112/)[0];
 edit('interaction_city',oldShared,`! JO9 MOD START CHUNHYANG_CLUB_TEXT_20261112
if egeya_lose ! 0:
 if interaction_city = 102019:
  $text[1] = '춘향은 경기장 가장자리에서 두 선수의 무장을 살핀 뒤 짧게 손을 내렸다.<br><br>[춘향]<br>…시작하십시오.<br><br>무기가 부딪치는 소리가 함성을 갈랐다. 새로 모은 선수들의 움직임은 예전보다 훨씬 날카로웠다.'
  $text[2] = '승부가 나자 춘향이 두 사람 사이로 걸어 들어갔다.<br><br>[춘향]<br>승부는 끝났습니다. 무기를 거두십시오.<br><br>그녀는 승자를 확인하고 정산을 마쳤다. 다음 경기를 기다리는 선수들이 말없이 무장을 고쳐 쥐었다.'
  $special_image[1] = 'bg\\chunhyang.png'
 end
 if interaction_city = 103001:
  $text[1] = '[춘향]<br>다음 선수는 <<$slave_name>>입니다. 준비한 무장으로 들어오십시오.<br>…상대도 준비됐습니다. 시작하십시오.'
  $special_image[1] = 'bg\\chunhyang.png'
 end
 if interaction_city = 103002 or interaction_city = 103003: $text[1] += '<br><br>[춘향]<br>…끝났습니다. 경기장을 정리하십시오.'
 if interaction_city = 103004: $text[1] += '<br><br>[춘향]<br>그만. 승부는 났습니다.<br>…아직 숨이 붙어 있습니다. 데려가십시오.'
 if interaction_city = 103005: $text[1] += '<br><br>[춘향]<br>승리를 확인했습니다. 약속한 상금입니다.<br>…다음에도 나서실 생각이면, 먼저 선수를 쉬게 하십시오.'
end
! JO9 MOD END CHUNHYANG_CLUB_TEXT_20261112`);
 const salePoint='! JO9_INLINE_TEXT_PREFIX_20261015';
 edit('slave_sell',salePoint,`! JO9 MOD START CHUNHYANG_SUPPLY_VOICE_20261112
if $npc_id = 'chunhyang':
 if sl_txt = 100: $text[1] += '<br><br>[춘향]<br>말씀드린 조건에 맞지 않습니다. …다시 준비해서 데려오십시오.'
 if sl_txt = 101: $text[1] += '<br><br>[춘향]<br>이 정도 준비로는 받기 어렵습니다. 요구한 등급을 맞춰 주십시오.'
 if sl_txt = 103 or sl_txt = 104 or sl_txt = 105: $text[1] += '<br><br>[춘향]<br>살펴봤습니다. 하지만 이번에는 받지 않겠습니다.'
 if sl_txt = 102: $text[1] += '<br><br>[춘향]<br>어떤 훈련을 받았습니까? …경기장에서는 숨길 수 없는 것들입니다.'
 if sl_txt = 1: $text[1] += '<br><br>[춘향]<br>필요한 준비는 되어 있군요. 가격을 말씀하십시오.'
 if sl_txt = 2: $text[1] += '<br><br>[춘향]<br>잘 훈련시켰습니다. 다만 제가 구하는 선수의 기준으로 값을 매기겠습니다.'
 if sl_txt = 3: $text[1] += '<br><br>[춘향]<br>말씀은 들었습니다. 그럼 가격을 정하지요.'
end
! JO9 MOD END CHUNHYANG_SUPPLY_VOICE_20261112
${salePoint}`);
 const npc="if nsfw = 0 and $npc_image[$npc_id] ! '': *p func('interior_change', 'jo9_html', '<div id = \"bg\"><img src=\"content\\pic\\characters\\<<$npc_image[$npc_id]>>.png\"></div>')";
 edit('slave_sell',npc,`! JO9 MOD START CHUNHYANG_SUPPLY_BACKGROUND_20261112
if nsfw = 0 and $npc_id = 'chunhyang':
 *p func('interior_change', 'jo9_html', '<div id = "bg"><img src="content/pic/bg/chunhyang.png" width="795" height="596"></div>')
else
 ${npc}
end
! JO9 MOD END CHUNHYANG_SUPPLY_BACKGROUND_20261112`);
 const pic="\tif nsfw = 0: *p func('interior_change', 'jo9_html', '<div id = \"bg\"><img src=\"content\\pic\\<<$special_image[txt]>>\"></div>')";
 edit('interaction_screen_city',pic,`! JO9 MOD START CHUNHYANG_SCENE_BACKGROUND_20261112
 if nsfw = 0 and $special_image[txt] = 'bg\\chunhyang.png':
  *p func('interior_change', 'jo9_html', '<div id = "bg"><img src="content/pic/bg/chunhyang.png" width="795" height="596"></div>')
 else
${pic}
 end
! JO9 MOD END CHUNHYANG_SCENE_BACKGROUND_20261112`);
 const gold="local $jo9_gold_result_text = $text[txt]";
 edit('interaction_screen_city',gold,gold+`\n! JO9 MOD START CHUNHYANG_SUPPLY_RESULT_20261112
if $npc_id = 'chunhyang' and (interaction_city = 911 or interaction_city = 912 or interaction_city = 913) and ($interaction_type = 'slave_sold' or $interaction_type = 'slave_sold_house'):
 $jo9_gold_result_text += '<br><br>[춘향]<br>거래는 끝났습니다. 선수는 제가 맡겠습니다.'
end
! JO9 MOD END CHUNHYANG_SUPPLY_RESULT_20261112`);
 const candidate=c.serialize(d);qa.inspectWorld(candidate);const mod={id,status:'APPROVED',description:'사용자 승인: 춘향 클럽 각 장면을 전용 말투로 조정하고, 기존 제작된 집무실 배경 포함 이미지를 에게야와 같은 #bg 화면(795×596)에 표시한다. 전투·금액·참가 조건·사망/석방·기존 에게야 단계는 보존한다.',before_sha256:links.after_sha256,after_sha256:c.hash(candidate),edits};
 json(repo+'/mods/'+id+'.json',mod);json(tmp+'/mods/'+id+'.json',mod);fs.writeFileSync(tmp+'/candidate.qsp',baseline);json(rec+'/scene-plan.json',{id,beforeSha256:links.after_sha256,combinedBeforeSha256:c.hash(baseline),afterSha256:c.hash(candidate),edits:edits.length,locations:[...new Set(edits.map(e=>e.location))],imageSource,imageTarget,imageHash:c.hash(fs.readFileSync(imageSource)),imagePixelsChanged:false,displayWidth:795,displayHeight:596});
 console.log(JSON.stringify({phase,edits:edits.length,hash:c.hash(candidate)}));
}else if(phase==='probe'){
 let s=fs.readFileSync(rec+'/chun-menu-probe.cjs','utf8');s=s.replace("const raw=fs.readFileSync(game+'/jack.qsp'),d=c.parse(raw);","const raw=fs.readFileSync(variant==='candidate'?tmp+'/candidate.qsp':game+'/jack.qsp'),d=c.parse(raw);");
 const visual="\nif instr($maintxt,'content/pic/bg/chunhyang.png')=0: msg 'FAIL_SCENE_BACKGROUND' & exit\nif instr($maintxt,'width=\"795\" height=\"596\"')=0: msg 'FAIL_SCENE_SIZE' & exit\n";
 s=s.replace("put(d,target,body(d,target)+'\\n'+checks+done(name));","const visual=['about','pref','duel','style','supply','watch'].includes(key)?"+JSON.stringify(visual)+":''; put(d,target,body(d,target)+'\\n'+checks+visual+'\\n$qa_render=$maintxt'+done(name));");
 s=s.replace("sourceHash:c.hash(fs.readFileSync(game+'/jack.qsp'))","sourceHash:c.hash(fs.readFileSync(variant==='candidate'?tmp+'/candidate.qsp':game+'/jack.qsp'))");
 s=s.replace("const visual=['about'", "if(key==='duel'){put(d,target,body(d,target)+\"\\nif qa_duel_repaint=0: qa_duel_repaint=1 & gt 'shop_general'\\nif len(\u0024sp_text[1])-len(replace(\u0024sp_text[1],'[춘향]','')) ! 4: msg 'FAIL_REPEATED_DUEL_INTRO' & exit\");} const visual=['about'");
 assert(s.includes('FAIL_SCENE_BACKGROUND'));fs.writeFileSync(rec+'/scene-route-probe.cjs',s);fs.mkdirSync(tmp+'/content/pic/bg',{recursive:true});fs.copyFileSync(imageTarget,tmp+'/content/pic/bg/chunhyang.png');console.log('Scene route diagnostic script ready');
}else if(phase==='verify'){
 const p=read(rec+'/scene-plan.json'),raw=fs.readFileSync(tmp+'/candidate.qsp');assert.equal(c.hash(raw),p.afterSha256);qa.inspectWorld(raw);const old=c.parse(z.gunzipSync(fs.readFileSync(rec+'/baseline.qsp.gz'))),d=c.parse(raw),changed=[];for(const l of d.locations)if(body(old,l.name)!==body(d,l.name))changed.push(l.name);assert.deepEqual(changed.sort(),p.locations.slice().sort());assert(!body(d,'jo9_chun_club').includes('<div id="center_Isabella">'));assert(body(d,'jo9_chun_club').includes("$bg['chunhyang_battle'] = 'chunhyang'"));json(rec+'/scene-scope.json',{hash:p.afterSha256,changedLocations:changed,structureAndBoundaries:true,roundtrip:c.serialize(d).equals(raw),transparentForegroundRemoved:true,oldStagePreservedByConditionalDisplay:true});console.log('Combined candidate scope: PASS');
}else if(phase==='image'){
 const p=read(rec+'/scene-plan.json');const b=fs.readFileSync(imageSource);assert.equal(c.hash(b),p.imageHash);for(const target of [imageTarget,repo+'/assets/content/pic/bg/chunhyang.png']){if(fs.existsSync(target))assert.equal(c.hash(fs.readFileSync(target)),p.imageHash);else{fs.mkdirSync(require('path').dirname(target),{recursive:true});fs.writeFileSync(target,b);}}console.log('Opaque original copied unchanged');
}else if(phase==='metadata'){
 const p=read(rec+'/scene-plan.json'),raw=fs.readFileSync(game+'/jack.qsp');assert.equal(c.hash(raw),p.afterSha256);assert.equal(c.hash(fs.readFileSync(repo+'/assets/runtime/2.4.1/jack.qsp')),p.combinedBeforeSha256);fs.copyFileSync(game+'/jack.qsp',repo+'/assets/runtime/2.4.1/jack.qsp');const file=repo+'/assets/runtime-source-2.4.1.json',m=read(file);assert.equal(m.sourceQspSha256,p.combinedBeforeSha256);m.sourceQspSha256=p.afterSha256;for(const f of m.files.filter(f=>f.runtimePath==='jack.qsp')){f.sha256=p.afterSha256;f.bytes=raw.length;}const resource={runtimePath:'content/pic/bg/chunhyang.png',repositoryPath:'assets/content/pic/bg/chunhyang.png',bytes:fs.statSync(imageTarget).size,sha256:p.imageHash};const i=m.files.findIndex(f=>f.runtimePath===resource.runtimePath);if(i>=0)m.files[i]=resource;else m.files.push(resource);m.latestChunhyangMenuLinks={date:'2026-11-12',mods:['2026-11-12_chunhyang_menu_links',id],report:'records/chunhyang-menu-links-20261112/REPORT_KO.md',qspSha256:p.afterSha256,opaqueClubScene:resource.runtimePath};fs.writeFileSync(file,JSON.stringify(m,null,2).replace(/\n/g,'\r\n')+'\r\n');console.log('Combined WORK/source/metadata aligned');
}else throw Error('Unknown phase');
