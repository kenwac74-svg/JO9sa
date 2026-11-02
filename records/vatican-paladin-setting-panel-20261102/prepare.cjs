'use strict';
const fs=require('fs'),zlib=require('zlib'),a=require('assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const W=process.env.JO9_PALADIN_INPUT||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',O=__dirname,T=process.env.JO9_PALADIN_QA_ROOT||'G:/Codex/tmp/vatican-paladin-scene-fix-20261102-native';
const expected='8a3c7604d713b4ec254a90331d65f08ffc5ef8032ae6f7132106f96cfb432b6c',raw=fs.readFileSync(W);a.equal(c.hash(raw),expected,'WORK changed; preserve manual edits');qa.inspectWorld(raw);a(c.serialize(c.parse(raw)).equals(raw));
const red=JSON.parse(fs.readFileSync(O+'/red-native-report.json'));a(red.completed&&red.failures>0,'Native baseline must reproduce before implementation');
fs.mkdirSync(T,{recursive:true});fs.writeFileSync(T+'/before.qsp',raw);const backup=zlib.gzipSync(raw);fs.writeFileSync(O+'/before.qsp.gz',backup);a(zlib.gunzipSync(backup).equals(raw));
const d=c.parse(raw),edits=[],mark='VATICAN_PALADIN_SETTING_PANEL_20261102',block=s=>'! JO9 MOD START '+mark+'\r\n'+s.replace(/\r?\n/g,'\r\n')+'\r\n! JO9 MOD END '+mark;
function edit(n,old,next){const l=d.locations.find(x=>x.name===n),s=c.shift(d.lines[l.body],5);a.equal(s.split(old).length-1,1,n+': unique old fragment');d.lines[l.body]=c.shift(s.replace(old,next),-5);edits.push({location:n,field:'body',old,new:next,count:1});}
const guard="$place = 'fogs_battle1' and interaction_city = 6215 and sp_txt = 6215 and get_weapon = 0 and $враг[1] = 'vatican_paladin'";
const paragraphs=[
 '바티칸의 명을 받들어 차원 관문을 지키는 정예 성기사. 관문을 지나는 물자와 사람, 노예의 행렬은 모두 그녀의 허락 아래 움직인다. 허가 없는 접근자와 안개에서 밀려드는 이계의 괴물 앞에, 축복받은 검은 망설임 없이 내려온다.',
 '성유물로 강화한 갑옷과 끝없는 금욕 훈련은 공포와 고통마저 신앙 아래 짓누른다. 회유와 뇌물로 길을 열려는 자는 차가운 침묵과 검날을 마주할 뿐이다.',
 '팔라딘이 수호하는 것은 교황청이 정한 신성한 질서다. 관문 너머에서 누가 쇠사슬에 묶여 오든, 바티칸의 인가와 통행세가 갖춰진 행렬은 방해받지 않는다.'
];
edit('shop_general','elseif npc = 0:',block('elseif '+guard+':\n $info_bar = \'\'\n *p \'<div id="side_panel_main"><center><div style="font-size:40px;">바티칸 팔라딘</div>교황청 직속 관문 수호자<br>바티칸</center></div>\'\n *p func(\'jo9_reference_panel\', \''+paragraphs.join('<br><br>')+'\')')+'\r\nelseif npc = 0:');
const loadGuard="$curloc = 'shop_general' and $place = 'fogs_battle1' and interaction_city = 6215 and get_weapon = 0 and (skip_to = 6215 or sp_txt = 6215) and $враг[1] = 'vatican_paladin'";
edit('$ongload',"if $curloc = 'main_screen': gt 'menu_form'",block('! Repaint a saved preparation page without resetting combat, actors, quest progress or rewards.\nif '+loadGuard+": gt 'shop_general'")+"\r\nif $curloc = 'main_screen': gt 'menu_form'");
const candidate=c.serialize(d);qa.inspectWorld(candidate);const before=c.parse(raw),changed=d.locations.filter(l=>d.lines[l.body]!==before.lines[before.locations.find(x=>x.name===l.name).body]).map(l=>l.name);a.deepEqual(changed,['$ongload','shop_general']);a.equal(d.locations.length,before.locations.length);
const rev=c.parse(candidate);for(const e of [...edits].reverse()){const l=rev.locations.find(x=>x.name===e.location),s=c.shift(rev.lines[l.body],5);a.equal(s.split(e.new).length-1,e.count);rev.lines[l.body]=c.shift(s.replace(e.new,e.old),-5);}a(c.serialize(rev).equals(raw),'All code outside scoped edits preserved byte-for-byte');
const patch={id:'2026-11-02_vatican_paladin_setting_panel',description:'Fill only the Vatican Paladin preparation title, role, affiliation and three setting paragraphs, and repaint loaded event6215 preparation screens. Preserve all image paths/output, combat, quests, callbacks, actor data, rewards and all other scenes.',before_sha256:expected,after_sha256:c.hash(candidate),edits};
fs.writeFileSync(T+'/candidate.qsp',candidate);fs.writeFileSync(O+'/patch.json',JSON.stringify(patch,null,2)+'\n');fs.writeFileSync(O+'/candidate.qsp',candidate);
const report={baseline:T+'/before.qsp',candidate:T+'/candidate.qsp',durableCandidate:O+'/candidate.qsp',modsDir:T+'/mods-text-only',before:expected,after:patch.after_sha256,changedLocations:changed,edits:edits.length,roundtrip:true,reverseReproducesOriginal:true,newPersistentVariables:0,newLocals:0,newLocations:0,saveSchemaChanged:false,productionApplied:false,backup:O+'/before.qsp.gz',guard,loadGuard,loreCharacters:paragraphs.join('').length,imagePathsChanged:false};
fs.mkdirSync(report.modsDir,{recursive:true});fs.writeFileSync(report.modsDir+'/'+patch.id+'.json',JSON.stringify(patch,null,2)+'\n');
fs.writeFileSync(O+'/prepared.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
