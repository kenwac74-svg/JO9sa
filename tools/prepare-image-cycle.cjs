// 현재 QSP의 이미지 출력만 감싸고 선택 컷을 보존하는 선언형 패치를 준비한다.
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {checkSyntax}=require('./check-image-cycle-syntax.cjs');
const root=path.resolve(__dirname,'..');
const core=require('C:/Users/Ken Choung/Documents/Codex/2026-10-06/task/JO9sa/tools/text-workshop/core.cjs');
const game='C:/MOVE/Jack O Nine Tails v2.3 Kor_nosex/game';
const raw=fs.readFileSync(path.join(game,'jack.qsp')),doc=core.parse(raw);
if(!core.serialize(doc).equals(raw))throw Error('Roundtrip mismatch');
const out=path.join(root,'tmp/image-cycle');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'base.qsp'),raw);
const groups=[];
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
for(const category of ['bg','characters']){
 const files=walk(path.join(game,'content/pic',category));
 for(const p of files){
  if(!/\.png$/i.test(p)||/ \((?:[2-9]|[1-9][0-9]+)\)\.png$/i.test(p))continue;
  const escaped=p.slice(0,-4).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const windows=files.map(f=>({p:f,m:f.match(new RegExp('^'+escaped+' \\((\\d+)\\)\\.png$','i'))})).filter(x=>x.m&&+x.m[1]>=2).sort((a,b)=>+a.m[1]-+b.m[1]);
  const variants=[p,...windows.map(x=>x.p)];
  if(variants.length>1)groups.push({base:path.relative(game,p).replaceAll('\\','/').toLowerCase(),paths:variants.map(x=>path.relative(game,x).replaceAll('\\','/'))});
 }
}
const q=s=>"'"+s.replaceAll("'","''")+"'";
const registry=groups.map(g=>`if $jo9_base = ${q(g.base)}:\r\n\tjo9_count = ${g.paths.length}\r\n`+g.paths.map((p,i)=>`\tif jo9_selected = ${i}: $jo9_path = ${q(p)}\r\n`).join('')+'end').join('\r\n');
const handler="! JO9 image-cycle: saved choices are keyed by original image path.\r\nif $args[0] = 'jo9_path':\r\n local $jo9_base, $jo9_path, jo9_count, jo9_selected\r\n $jo9_base = $lcase($replace($args[1], '\\', '/'))\r\n $jo9_path = $args[1]\r\n jo9_count = 1\r\n jo9_selected = jo9_cut_choice[$jo9_base]\r\n if jo9_selected < 0: jo9_selected = 0\r\n ! JO9 LIVE REGISTRY\r\n if jo9_selected >= jo9_count:\r\n  jo9_cut_choice[$jo9_base] = 0\r\n  $jo9_path = $args[1]\r\n end\r\n jo9_image_count = jo9_count\r\n $result = $jo9_path\r\n exit\r\nend\r\nif $args[0] = 'jo9_html':\r\n local $jo9_html, $jo9_tail, $jo9_src, $jo9_attr, $jo9_newsrc, $jo9_saved_html, jo9_at, jo9_next\r\n $jo9_html = $args[1]\r\n ! JO9 paired cutscene tools: exclude home dashboard and combat.\r\n if $curloc = 'main_screen' or $curloc = 'demo_estate' or $curloc = 'боевой_интерфейс' or $curloc = 'конец_боя' or $curloc = 'colosseum_fight' or instr($jo9_html, 'fight_bg') > 0 or instr($jo9_html, 'bg_right') > 0:\r\n  $result = $jo9_html\r\n  exit\r\n end\r\n if instr($jo9_html, '<img') = 0:\r\n  $result = $jo9_html\r\n  exit\r\n end\r\n ! Reset image-only mode on a fresh scene; preserve layered pictures within one render.\r\n jo9_clean_hidden = 0\r\n if $jo9_clean_overlay ! '':\r\n  $jo9_saved_html = $replace($maintxt, $jo9_clean_overlay, '')\r\n  if $jo9_saved_html ! $maintxt:\r\n   *clr\r\n   *p $jo9_saved_html\r\n  end\r\n end\r\n $jo9_clean_overlay = ''\r\n ! Remove the previous layer switch, but retain its selected picture.\r\n if $jo9_last_button ! '':\r\n  $jo9_saved_html = $replace($maintxt, $jo9_last_button, '')\r\n  if $jo9_saved_html ! $maintxt:\r\n   *clr\r\n   *p $jo9_saved_html\r\n  end\r\n end\r\n $jo9_last_button = ''\r\n $jo9_visible_top = ''\r\n jo9_at = 1\r\n :jo9_image_scan\r\n jo9_next = instr($mid($jo9_html, jo9_at), '<img')\r\n if jo9_next > 0:\r\n  jo9_next += jo9_at - 1\r\n  $jo9_tail = $mid($jo9_html, jo9_next)\r\n  $jo9_src = $strfind($jo9_tail, 'src\\s*=\\s*\"([^\"]+)\"', 1)\r\n  if $jo9_src ! '':\r\n   $jo9_visible_top = $lcase($replace($jo9_src, '\\', '/'))\r\n   $jo9_newsrc = func('interior_change', 'jo9_path', $jo9_src)\r\n   $jo9_attr = $strfind($jo9_tail, 'src\\s*=\\s*\"([^\"]+)\"')\r\n   $jo9_html = $replace($jo9_html, $jo9_attr, 'src=\"' + $jo9_newsrc + '\"')\r\n  end\r\n  jo9_at = jo9_next + 4\r\n  jump 'jo9_image_scan'\r\n end\r\n if $jo9_visible_top ! '':\r\n  $jo9_newsrc = func('interior_change', 'jo9_path', $jo9_visible_top)\r\n  if jo9_image_count >= 1:\r\n   $jo9_last_button = '<div id=\"jo9_image_cycle\" style=\"position:absolute;left:7px;right:auto;top:4px;width:62px;height:28px;z-index:2147483600;\"><a class=\"tooltip-right\" tooltip-data=\"이미지 전환\" title=\"이미지 전환\" style=\"display:block;position:relative;width:26px;height:26px;\" href=\"EXEC: gs ''interior_change'', ''jo9_toggle''\"><img style=\"width:26px;height:26px;\" src=\"content/pic/ui/approved_main_v1/tool_room.png\"></a><a id=\"jo9_cutscene_view\" class=\"tooltip-right\" tooltip-data=\"컷신만 보기 / UI 복원\" title=\"컷신만 보기 / UI 복원\" style=\"display:block;position:absolute;left:32px;top:0;width:26px;height:26px;line-height:26px;text-align:center;background:#202820;color:#e8d39c;border:1px solid #b59d62;border-radius:3px;font-size:20px;\" href=\"EXEC: gs ''interior_change'', ''jo9_clean_toggle''\">◉</a></div>'\r\n   if jo9_image_count = 1:\r\n    $jo9_last_button = $replace($jo9_last_button, 'tooltip-data=\"이미지 전환\" title=\"이미지 전환\"', 'tooltip-data=\"이미지 전환 · 추가 컷 없음\" title=\"이미지 전환 · 추가 컷 없음\"')\r\n    $jo9_last_button = $replace($jo9_last_button, 'display:block;position:relative;width:26px;height:26px;', 'display:block;position:relative;width:26px;height:26px;opacity:0.45;')\r\n   end\r\n   $jo9_html = $replace($jo9_html, '</div>', $jo9_last_button + '</div>')\r\n  end\r\n end\r\n $result = $jo9_html\r\n exit\r\nend\r\nif $args[0] = 'jo9_toggle':\r\n local $jo9_before, $jo9_after, $jo9_current_html, $jo9_before_attr, $jo9_after_attr, jo9_match, jo9_searchpos, jo9_last_match\r\n if $jo9_visible_top = '': exit\r\n $jo9_before = func('interior_change', 'jo9_path', $jo9_visible_top)\r\n if jo9_image_count < 2: exit\r\n jo9_cut_choice[$jo9_visible_top] = (jo9_cut_choice[$jo9_visible_top] + 1) mod jo9_image_count\r\n $jo9_after = func('interior_change', 'jo9_path', $jo9_visible_top)\r\n $jo9_current_html = $replace($maintxt, $jo9_clean_overlay, '')\r\n $jo9_before_attr = 'src=\"' + $jo9_before + '\"'\r\n $jo9_after_attr = 'src=\"' + $jo9_after + '\"'\r\n jo9_searchpos = 1\r\n jo9_last_match = 0\r\n :jo9_find_top_attribute\r\n jo9_match = instr($mid($jo9_current_html, jo9_searchpos), $jo9_before_attr)\r\n if jo9_match > 0:\r\n  jo9_last_match = jo9_searchpos + jo9_match - 1\r\n  jo9_searchpos = jo9_last_match + len($jo9_before_attr)\r\n  jump 'jo9_find_top_attribute'\r\n end\r\n if jo9_last_match = 0:\r\n  jo9_cut_choice[$jo9_visible_top] = (jo9_cut_choice[$jo9_visible_top] + jo9_image_count - 1) mod jo9_image_count\r\n  exit\r\n end\r\n $jo9_current_html = $mid($jo9_current_html, 1, jo9_last_match - 1) + $jo9_after_attr + $mid($jo9_current_html, jo9_last_match + len($jo9_before_attr))\r\n if jo9_clean_hidden = 1:\r\n  $jo9_clean_overlay = func('interior_change', 'jo9_clean_html')\r\n  $jo9_current_html += $jo9_clean_overlay\r\n end\r\n *clr\r\n *p $jo9_current_html\r\n refint\r\n exit\r\nend\r\n! End JO9 image-cycle; original home room switching follows.\r\n! JO9 image-only viewing never re-enters a game location.\r\nif $args[0] = 'jo9_clean_html':\r\n ! Hide real UI nodes without cloning or resizing any pictures.\r\n $result = '<style id=\"jo9_clean_style\">.menu,.tooltip,#main_screen,#sparks_display,#snk_room_menu{visibility:hidden!important;pointer-events:none!important}'\r\n if $curloc = 'city_screen': $result += '#settings,#settings_2r,#settings_ex,#settings_ex2,#back_home{visibility:hidden!important;pointer-events:none!important}'\r\n $result += '</style>'\r\n exit\r\nend\r\n\r\nif $args[0] = 'jo9_clean_toggle':\r\n local $jo9_view_html\r\n if $jo9_last_button = '' or instr($maintxt, $jo9_last_button) = 0: exit\r\n $jo9_view_html = $replace($maintxt, $jo9_clean_overlay, '')\r\n jo9_clean_hidden = 1 - jo9_clean_hidden\r\n $jo9_clean_overlay = ''\r\n if jo9_clean_hidden = 1:\r\n  $jo9_clean_overlay = func('interior_change', 'jo9_clean_html')\r\n  $jo9_view_html += $jo9_clean_overlay\r\n end\r\n *clr\r\n *p $jo9_view_html\r\n refint\r\n exit\r\nend\r\n\r\n".replace('! JO9 LIVE REGISTRY', registry);
const handlerCheck=checkSyntax(handler);
if(!handlerCheck.ok)throw Error('Image cycle handler syntax: '+JSON.stringify(handlerCheck.errors));
const edits=[];
for(const loc of doc.locations){
 const body=core.shift(doc.lines[loc.body],5);
 if(loc.name==='interior_change'){
  const anchor='!Move to a different room in your apartment';
  if(!body.includes(anchor))throw Error('interior anchor missing');
  const mark='! JO9 image-cycle: saved choices are keyed by original image path.';
  const old=body.startsWith(mark)?body.slice(0,body.indexOf(anchor))+anchor:anchor;
  if(old!==handler+anchor)edits.push({location:loc.name,field:'body',old,new:handler+anchor,count:1});continue;
 }
 if(loc.name==='display_fullimage'){
  const anchor=`$result = '<div id="<<$args[1]>>"><img src="content\\pic\\<<$res_image_path>>.png"></div>'`;
  const next=anchor+"\r\nif $args[1] = 'bg' or $args[1] = 'large_image': $result = func('interior_change', 'jo9_html', $result)";
  if(body.split(anchor).length-1!==1)throw Error('display_fullimage anchor missing or repeated');
  if(!body.includes(next))edits.push({location:loc.name,field:'body',old:anchor,new:next,count:1});
 }
 // Only actual large-image output is wrapped; image assignments and icons remain untouched.
 for(const l of core.literals(body)){
  if(!/\*p\s*$/i.test(body.slice(Math.max(0,l.start-18),l.start-1)))continue;
  const imageContainer=/^\s*<div\s+id\s*=\s*["'](?:bg|large_image|bg_right|ride_bg|fight_bg)["']/i.test(l.text);
  const roomOverlay=/^(?:assistant_private_room|slave_private_room[1-4])$/.test(loc.name)&&/^\s*<div\s+style\s*=\s*["']position:absolute;top:3px;left:150px;["']\s*>\s*<img\b/i.test(l.text);
  if(!(imageContainer||roomOverlay)||!l.text.includes('<img'))continue;
  const original=body.slice(l.start-1,l.end+1);
  const old='*p'+body.slice(body.lastIndexOf('*p',l.start-1)+2,l.start-1)+original;
  // *P output casing is normalized from the actual source interval.
  const start=body.toLowerCase().lastIndexOf('*p',l.start-1);
  const actual=body.slice(start,l.end+1);
  const newText=`*p func('interior_change', 'jo9_html', ${original})`;
  if(edits.some(e=>e.location===loc.name&&e.old===actual))continue;
  const count=body.split(actual).length-1;
  edits.push({location:loc.name,field:'body',old:actual,new:newText,count});
 }
}
let candidate=core.parse(raw);
for(const e of edits){const loc=candidate.locations.find(l=>l.name===e.location);let b=core.shift(candidate.lines[loc.body],5);if(b.split(e.old).length-1!==e.count)throw Error('count mismatch '+e.location);candidate.lines[loc.body]=core.shift(b.split(e.old).join(e.new),-5);}
const changed=core.serialize(candidate);core.parse(changed);
const id=core.shift(doc.lines[doc.locations.find(l=>l.name==='interior_change').body],5).startsWith('! JO9 image-cycle:')?'2026-10-08_image_cycle_registry_refresh':'2026-10-08_persistent_image_cycle';
const mod={id,description:'최상위 이미지 순환 버튼, 이미지 경로별 컷 선택 저장, 배경 선택 유지. 집 방 전환 아이콘 재사용.',before_sha256:core.hash(raw),after_sha256:core.hash(changed),edits};
const mods=path.join(out,'mods');fs.mkdirSync(mods,{recursive:true});
fs.writeFileSync(path.join(mods,id+'.json'),JSON.stringify(mod,null,2));
fs.writeFileSync(path.join(out,'candidate.qsp'),changed);
fs.writeFileSync(path.join(out,'registry.json'),JSON.stringify(groups,null,2));
fs.writeFileSync(path.join(out,'handler.qsrc'),handler);
console.log(JSON.stringify({before:core.hash(raw),after:core.hash(changed),edits:edits.length,locations:[...new Set(edits.map(e=>e.location))],groups:groups.length,roundtrip:true}));
