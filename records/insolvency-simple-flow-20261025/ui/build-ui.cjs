'use strict';
// Generates exact display-only edits and review runtime copies inside this folder.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',out=__dirname;
const raw=fs.readFileSync(path.join(game,'jack.qsp')),d=c.parse(raw),edits=[];
const get=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5);
const cr=s=>s.replace(/\r?\n/g,'\r\n');
function edit(location,old,next){assert.notEqual(old,next);assert.equal(get(location).split(old).length-1,1,location+' exact match');edits.push({location,field:'body',old,new:next,count:1});}
for(const [name,role]of[['slave_stat','slave'],['assistant_stat','assistant']]){
 const src=get(name),begin=src.indexOf(`*p '<div id="left_column${role==='assistant'?'_assistant':''}"><br>'`);
 let end=src.indexOf("*p '</div>'",src.indexOf("gs 'jo9_traits_view', 'sidebar', '"+role+"'",begin))+"*p '</div>'".length;
 const trailing='\r\n! JO9 MOD END UI_TRAIT_OVERVIEW_20261025';
 if(src.slice(end).startsWith(trailing))end+=trailing.length;
 assert(begin>=0&&end>begin,name+' profile block');let next=src.slice(begin,end);
 // Keep the original name/age/rank padding. Only spacing between the attribute groups changes.
 const gap='<span class="jo9_profile_group_gap"></span>';
 if(role==='slave')next=next.replaceAll('<div style="line-height:25%"><br></div>',gap);
 else for(const key of ['sensitivity','ego','fat','mood']){
  const lines=next.split('\r\n'),at=lines.findIndex(x=>x.startsWith('*nl ')&&x.includes('<<$'+(key==='mood'?'mood[assistant_mood_plus]':key+'[assistant["'+key+'"]]')+'>>'));
  assert(at>=0,name+' group end '+key);lines[at]=lines[at].replace(/<br>'$/,gap+"'");next=lines.join('\r\n');
 }
 // A block spacer already starts a new row; another *nl would add an entire blank line.
 for(const label of ['성격','태도','세련됨'])next=next.replace("*nl '<font style=\"font-size:12px;\">"+label,"*p '<font style=\"font-size:12px;\">"+label);
 if(role==='slave')next=next.replace("*p '"+gap+"'\r\ngs 'jo9_traits_view'","gs 'jo9_traits_view'");
 next='! JO9 MOD START PROFILE_GROUP_SPACING_20261025\r\n'+next+'\r\n! JO9 MOD END PROFILE_GROUP_SPACING_20261025';
 edit(name,src.slice(begin,end),next);
}
const view=get('jo9_traits_view');
edit('jo9_traits_view',"  *nl '<a class=\"jo9_tv_heading\"","  *p '<a class=\"jo9_tv_heading\"");
for(const location of ['slave_stat','assistant_stat']){
 const old="*p '<link rel=\"stylesheet\" href=\"css/jo9_traits_view.css\"><script src=\"content/js/jo9_traits_view.js\"></script>'";
 edit(location,old,old.replace('jo9_traits_view.css','jo9_traits_view.css?v=20261025r2').replace('jo9_traits_view.js','jo9_traits_view.js?v=20261025r2'));
}
const textRefresh=cr("! JO9 MOD START PROFILE_TEXT_CACHE_20261025\nif jo9_profile_text_revision < 1:\n gs '#static_txt'\n jo9_profile_text_revision = 1\nend\n! JO9 MOD END PROFILE_TEXT_CACHE_20261025\n");
for(const location of ['$ongload','$newloc']){
 const first=get(location).split('\r\n')[0];edit(location,first,textRefresh+first);
}
const hints={
 ambitious:'야심가: 기술이 성장한 뒤 받는 칭찬을 특히 기뻐한다. 성취를 인정해 주면 기분이 좋아지지만, 그 칭찬 때문에 더 응석을 부리지는 않는다.',
 workaholic:'일벌레: 일이 이어져도 쉽게 싫증내지 않는다. 업무나 교육을 거듭할수록 오히려 기분이 좋아진다.',
 content:'안분지족: 바쁘게 지내기보다는 현재에 만족하며 여유를 즐긴다. 업무나 교육이 이어지면 기분이 가라앉는다.',
 activity_active:'활동적: 업무나 교육이 이어지면 오히려 활기를 얻는다. 쉬게 하거나 마사지를 해 주어도 보상으로 받아들이는 정도는 작다. 성향이 드러난 뒤에는 휴식만으로 푹 쉰 기분 효과를 얻지 않는다.',
 activity_passive:'휴식 선호: 업무나 교육이 이어지면 지치고 기분이 가라앉는다. 반면 휴식이나 마사지에는 특히 만족하며, 그런 보상을 기꺼이 받아들인다.',
 persevering:'끈기: 같은 업무나 교육을 꾸준히 반복하면 기분이 좋아지고, 배우는 속도도 빨라진다. 고정 규칙에 따른 업무에는 이 효과가 적용되지 않는다.',
 distracted:'산만함: 같은 업무나 교육이 계속되면 집중력이 흐트러진다. 배우는 속도와 업무 성과가 떨어지지만, 고정 규칙에 따른 업무에는 영향을 주지 않는다.',
 petty:'옹졸함: 좋지 않은 사건을 오래 마음에 담아 둔다. 처음 받은 충격은 같아도 부정적인 기억에서 벗어나는 데 더 오랜 시간이 걸린다.',
 generous:'너그러움: 좋지 않은 일을 겪어도 비교적 빨리 털어 낸다. 처음 받은 충격은 같지만 부정적인 기억이 오래 남지는 않는다.',
 healthy:'건강체질: 전투에서 버틸 체력과 지구력이 좋으며 운동도 빠르게 익힌다. 식사와 보조식품, 충분한 휴식으로 체력을 기르는 데도 유리하다. 타고나기도 하고 의료센터의 체질개선 시술로 얻기도 한다. 약골과 양립하지 않는다.',
 frail:'약골: 전투에서 버틸 체력과 지구력이 부족하고, 운동 관련 교육을 익히는 속도도 더디다. 건강체질과 양립하지 않는다.',
 berserker:'광전사: 지구력과 투지가 뛰어나다. 크게 다쳐 궁지에 몰리면 강렬한 저력을 발휘해 적에게 훨씬 큰 피해를 준다. 다른 전투 특성과 함께 가질 수 없다.',
 paladin:'성기사: 지구력과 사기를 충분히 유지하고 있을 때 적의 공격을 훨씬 잘 견딘다. 아무리 단단히 버텨도 피해가 완전히 사라지지는 않는다.',
 veteran:'역전의 용사: 숱한 싸움을 이겨 낸 경험 덕분에 전투 체력과 지구력, 사기가 모두 뛰어나다. 다른 전투 특성과 함께 가질 수 없다.',
 versatile:'다재다능: 지식과 기술, 성애기술을 두루 높은 수준까지 익히면 영구적으로 얻는 칭호다. 상품 가치가 높아지고, 처음 칭호를 얻을 때 명성도 오른다. 이미 최고의 명성을 얻었다면 더 높아지지는 않는다.',
 peerless:'절세미인: 타고난 아름다움이 한층 돋보이며 외모가 일반적인 한계를 넘어설 수 있다. 흉터와 체형의 불이익은 그대로 남는다. 특별 판매와 경매, 흥정에서 좋은 대우를 받으며 긍정적인 호감과 명성도 더 크게 얻는다.'
};
const trait=get('jo9_traits'),lines=trait.split('\r\n');
for(const[key,text]of Object.entries(hints)){
 const line=lines.find(x=>x.includes("if $args[1] = '"+key+"': $result = '"));assert(line,'description '+key);
 const prefix=line.slice(0,line.indexOf('$result = ')+10);edit('jo9_traits',line,prefix+"'"+text.replaceAll("'","''")+"'");
}
const staticSrc=get('#static_txt');
const legacy={
 jo9_genius_text:'당신의 노예는 천재적인 학습 능력을 타고났다. 처음부터 지성이 매우 뛰어나며, 육체단련을 제외한 여러 분야를 놀라울 만큼 빠르게 익힌다. 다만 애완녀·망아지·젖소녀 역할을 배우는 속도는 남들보다 더디다. 지성은 이후 변할 수 있다.',
 jo9_idiot_text:'당신의 노예는 새로운 지식과 기술을 익히는 데 남들보다 오랜 시간이 걸린다. 처음에는 지성이 매우 낮으며, 육체단련을 제외한 분야의 성장도 더디다. 그래도 경험이 완전히 헛되지는 않으며, 지성은 이후 변할 수 있다.'
};
for(const location of ['#static_txt','#txt_woman']){
 for(const[key,text]of Object.entries(legacy)){const line=get(location).split('\r\n').find(x=>x.startsWith('$'+key+' = '));assert(line,key);edit(location,line,'$'+key+" = '"+text+"'");}
 edit(location,'젖소 적성으로 하루 우유 생산량이 최종 계산값의 1.5배가 된다.','젖소 적성 덕분에 하루 우유 생산량도 눈에 띄게 늘어난다.');
}
let js=fs.readFileSync(path.join(game,'content/js/jo9_traits_view.js'),'utf8');
assert(js.includes("footer.innerHTML = label + '의 특성 전체보기'"));js=js.replace("footer.innerHTML = label + '의 특성 전체보기'","footer.innerHTML = '특성 전체보기'");
const hook="            row.index = map[row.action] || map[row.synthetic] || 0;";assert.equal(js.split(hook).length-1,1);
js=js.replace(hook,()=>hook+`\n            // Display grades follow the existing red/pink/purple/blue/cyan/green scale.\n            var gradeKey = row.action.match(/'describe'\\s*,\\s*'([a-z_]+)'/);\n            var grades = {oral_pref:5,gag_reflex:1,anal_pref:5,anal_averse:0,defiant:0,slave_nature:5,innate_mute:1,ambitious:4,workaholic:4,content:1,activity_active:4,activity_passive:1,persevering:4,distracted:1,petty:1,generous:4,healthy:4,frail:0,berserker:4,paladin:4,veteran:5,peerless:5};\n            row.grade = gradeKey && typeof grades[gradeKey[1]] === 'number' ? grades[gradeKey[1]] : null;\n            if (/\\$jo9_genius_text/.test(row.action)) { row.grade = 5; }\n            if (/\\$jo9_idiot_text/.test(row.action)) { row.grade = 0; }`);
const link="            a.setAttribute('data-kind', row.kind);";assert.equal(js.split(link).length-1,1);
js=js.replace(link,()=>link+"\n            if (row.grade !== null) { a.setAttribute('data-grade', String(row.grade)); }");
let css=fs.readFileSync(path.join(game,'css/jo9_traits_view.css'),'utf8');
css+=cr(`\n/* JO9 MOD START PROFILE_DISPLAY_REFINEMENT_20261025 */\n/* This stylesheet is loaded only by slave_stat and assistant_stat.\n   bg_stat has no left edge; base.css starts the reused edge at y45. */\nbody:before{top:0;height:800px;background-position:-501.5px 0}\n.jo9_profile_group_gap{display:block;height:5px;line-height:0;margin:0;padding:0}\n.jo9_tv_entry[data-grade="0"],.jo9_tv_entry[data-grade="0"] *{color:#cd0000!important}\n.jo9_tv_entry[data-grade="1"],.jo9_tv_entry[data-grade="1"] *{color:#ea0090!important}\n.jo9_tv_entry[data-grade="2"],.jo9_tv_entry[data-grade="2"] *{color:#6b0084!important}\n.jo9_tv_entry[data-grade="3"],.jo9_tv_entry[data-grade="3"] *{color:#0000d8!important}\n.jo9_tv_entry[data-grade="4"],.jo9_tv_entry[data-grade="4"] *{color:#009fef!important}\n.jo9_tv_entry[data-grade="5"],.jo9_tv_entry[data-grade="5"] *{color:#009900!important}\n.jo9_tv_entry[data-kind="title"],.jo9_tv_entry[data-kind="title"] *{color:#5c351d!important}\n/* JO9 MOD END PROFILE_DISPLAY_REFINEMENT_20261025 */\n`);
fs.writeFileSync(path.join(out,'ui-edits.json'),JSON.stringify({id:'PROFILE_DISPLAY_REFINEMENT_20261025',edits},null,2));
fs.writeFileSync(path.join(out,'jo9_traits_view.js'),js);
fs.writeFileSync(path.join(out,'jo9_traits_view.css'),css);
fs.writeFileSync(path.join(out,'provenance.json'),JSON.stringify({baseline:c.hash(raw),locations:[...new Set(edits.map(e=>e.location))],edits:edits.length,hints:Object.keys(hints),legacy:Object.keys(legacy).concat('Indolent'),runtimeFiles:['content/js/jo9_traits_view.js','css/jo9_traits_view.css'],scope:'Display strings/HTML/ES5/CSS only; no effect equations, conditions, generated trait flags or save bookkeeping edited.'},null,2));
const featureSource=get('#static_base').slice(get('#static_base').indexOf('$update_slave_features_list ='));
const excluded=['sanity_broken','sanity_low','Нет_клейма','wounds_chart','scars_chart','bruises_chart','starvation_chart'];
const reachable=[...new Set([...featureSource.matchAll(/msg\s+\$([\p{L}\p{N}_]+)/gu)].map(m=>m[1]))].filter(n=>!excluded.includes(n));
const assignments=[],remaining=[];
for(const l of d.locations){let body=get(l.name);for(const e of edits.filter(e=>e.location===l.name))body=body.replace(e.old,()=>e.new);
 for(const line of body.split('\r\n')){const m=line.match(/^\s*\$([\p{L}\p{N}_]+)\s*=\s*'(.*)'\s*$/u);if(!m||!reachable.includes(m[1]))continue;const visible=m[2].replace(/<<.*?>>/g,'').replace(/<[^>]*>/g,'');const row={location:l.name,key:m[1],hasExpression:/<<.*?>>/.test(m[2])};assignments.push(row);if(/[0-9%×]|두\s*배|세\s*배|절반|한\s*단계|[A-FS]\+*\([0-9]/.test(visible))remaining.push({...row,text:visible});}
}
assert.equal(remaining.length,0,'Reachable legacy trait descriptions still expose mechanics numbers');
fs.writeFileSync(path.join(out,'description-audit.json'),JSON.stringify({reachableLegacyKeys:reachable,excludedStates:excluded,assignments,remainingNumericDescriptions:remaining,newRegistryRewritten:Object.keys(hints),note:'All literal definitions of feature-list MSG targets scanned across every location, including #static_txt and #txt_woman. State readouts/costs/attribute grade help are excluded. QSP expressions preserved and listed for contextual review.'},null,2));
console.log(JSON.stringify({baseline:c.hash(raw),out,edits:edits.length}));
