'use strict';
const fs=require('fs'),path=require('path');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const core=require(repo+'/tools/text-workshop/core.cjs');
const out=process.argv[2]||'G:/Codex/tmp/reference-panel-layout-20261101';
const id='REFERENCE_PANEL_SPACING_20261101';
fs.mkdirSync(out+'/mods',{recursive:true});
const source=process.argv[3]||game+'/jack.qsp';
const raw=fs.readFileSync(source),d=core.parse(raw);
if(!core.serialize(d).equals(raw))throw Error('baseline roundtrip');
const edits=[],counts={labels:0,bodies:0,auctionAttitude:0},inventory=[];
const wrap=s=>'! JO9 MOD START '+id+'\r\n'+s+'\r\n! JO9 MOD END '+id;
for(const l of d.locations){
 const orig=core.shift(d.lines[l.body],5);let s=orig;
 // The rendered title only; leave inactive historical comments unchanged.
 s=s.split('\r\n').map(x=>{
  if(x.trimStart().startsWith('!'))return x;
  if(/참고 정보:|Информация к размышлению:/.test(x)){
   counts.labels++;
   inventory.push({location:l.name,type:'label',old:x.trim()});
   if(/^\s*\*nl\s*'참고 정보:'\s*$/.test(x))return wrap('! Reference heading removed; name and subtitle remain.');
   return x.replace(/참고 정보:|Информация к размышлению:/g,'');
  }
  return x;
 }).join('\r\n');
 if(l.name==='guild_board')s=s.replace("*nl ':</center></div>'","*nl '</center></div>'");
 if(l.name==='black_market_interface'){
  const header=/\*p '<div id = "side_panel_main">[\s\S]+?<\/center><\/div>'/.exec(s);
  if(!header)throw Error('black market header missing');
  s=s.replace(header[0],wrap(header[0]));
 }
 const add=(old,args)=>{
  if(!s.includes(old))throw Error('missing body '+l.name);
  const replacement=wrap("*p func('jo9_reference_panel', "+args+")");
  s=s.replace(old,replacement);counts.bodies++;
  inventory.push({location:l.name,type:'body',args});
 };
 // NPC descriptions: the attitude may be absent; it must not leave an empty first line.
 const npcPattern=/^[ \t]*\*p '<div id = "side_panel_text"><<(\$npc_attitude\[[^\r\n]+?)>>(?:<br>)?'\r\n[ \t]*\*nl '<span class="jo9-reference-body"><<\$npc_info\[\$npc_id\]>><\/span><style>[^\r\n]+?<\/style><\/div>'/gm;
 for(const m of [...s.matchAll(npcPattern)])add(m[0],'$npc_info[$npc_id], '+m[1]);
 const tutorial=/^[ \t]*\*p '<div id = "side_panel_text"><<(\$npc_attitude\[[^\r\n]+?)>>'\r\n[ \t]*\*nl '<<\$csell_tuto>><\/div>'/gm;
 for(const m of [...s.matchAll(tutorial)])add(m[0],'$csell_tuto, '+m[1]);
 if(l.name==='pharmacy'){
  const p=/^[ \t]*\*p '<div id = "side_panel_text">[ \t]*<<(\$npc_attitude\[[^\r\n]+?)>>\r\n[ \t]*<span class="jo9-reference-body"><<\$npc_info\[\$npc_id\]>><\/span><style>[^\r\n]+?<\/style>\r\n<\/div>'/gm;
  for(const m of [...s.matchAll(p)])add(m[0],'$npc_info[$npc_id], '+m[1]);
 }
 // Remaining ordinary information bodies: place/stage/item description and auction NPC.
 const plain=/^[ \t]*\*(?:p|nl) '<div id = "side_panel_text">([ \t]*|<<\$info_bar>>)<span class="jo9-reference-body"><<([^\r\n]+?)>><\/span><style>[^\r\n]+?<\/style>(?:<br>)?(?:\r\n)?<\/div>'/gm;
 for(const m of [...s.matchAll(plain)]){
  let args=m[2];
  if(l.name==='slave_auction_buy'&&m[2]==='$npc_info[$npc_id]')args+=', $npc_attitude[npc_attitude[$npc_id]]';
  else args+=", ''";
  if(m[1].includes('$info_bar'))args+=', $info_bar';
  add(m[0],args);
 }
 if(l.name==='slave_auction_buy'){
  const old='\t*p \'<div id = "side_panel_attitude"><<$npc_attitude[npc_attitude[$npc_id]]>></div>\'';
  if(!s.includes(old))throw Error('auction attitude missing');
  s=s.replace(old,wrap('! Attitude is rendered with the description in jo9_reference_panel.'));
  counts.auctionAttitude++;
 }
 if(s!==orig){
  // Each changed location is one pinned edit, with unchanged common prefix/suffix omitted.
  let start=0;while(start<orig.length&&start<s.length&&orig[start]===s[start])start++;
  start=orig.lastIndexOf('\r\n',start)+2;if(start===1)start=0;
  let suffix=0;while(orig.length-suffix>start&&s.length-suffix>start&&orig.at(-1-suffix)===s.at(-1-suffix))suffix++;
  const endLine=orig.indexOf('\r\n',orig.length-suffix);
  const end=endLine<0?orig.length:endLine;
  const newEnd=s.length-(orig.length-end);
  let old=orig.slice(start,end),next=s.slice(start,newEnd);
  if(!next.includes('! JO9 MOD START '+id))next=wrap(next);
  edits.push({location:l.name,field:'body',old,new:next,count:1});
  d.lines[l.body]=core.shift(orig.replace(old,next),-5);
 }
}
if(counts.labels!==28||counts.bodies!==31)throw Error('unexpected coverage '+JSON.stringify(counts));
for(const l of d.locations){
 const remaining=core.shift(d.lines[l.body],5).split('\r\n').filter(x=>x.includes('side_panel_text')&&!x.trimStart().startsWith('!'));
 if(remaining.length&&!['jo9_liquidation','jo9_buyer_rumors'].includes(l.name))throw Error('unconverted body '+l.name+' '+remaining.join('\n'));
}
const helper=[
 '! JO9 MOD START '+id,
 '! Inputs: description HTML, optional attitude HTML, optional existing prefix HTML.',
 '! Only local copies are trimmed; saved NPC/place text and internal paragraph breaks remain intact.',
 'local $jo9_ref_body = $args[0]',
 'local $jo9_ref_attitude = $args[1]',
 'local $jo9_ref_prefix = $args[2]',
 "local $jo9_ref_empty = $strfind($jo9_ref_body, '^(\\s|&nbsp;|<[bB][rR]\\s*/?>)+')",
 "if $jo9_ref_empty ! '': $jo9_ref_body = $mid($jo9_ref_body, len($jo9_ref_empty) + 1, len($jo9_ref_body))",
 "$jo9_ref_empty = $strfind($jo9_ref_attitude, '^(\\s|&nbsp;|<[bB][rR]\\s*/?>)+')",
 "if $jo9_ref_empty ! '': $jo9_ref_attitude = $mid($jo9_ref_attitude, len($jo9_ref_empty) + 1, len($jo9_ref_attitude))",
 "$result = '<div id=\"side_panel_text\" class=\"jo9-reference-panel\">' + $jo9_ref_prefix",
 "if $jo9_ref_attitude ! '': $result += $jo9_ref_attitude + '<br>'",
 "$result += '<span class=\"jo9-reference-body\">' + $jo9_ref_body + '</span></div>'",
 '! JO9 MOD END '+id
].join('\r\n');
const newLoc={name:'jo9_reference_panel',desc:'',body:helper,actions:[]};
d.lines.pop();d.lines.push(...[newLoc.name,'',helper,'0'].map(x=>core.shift(x,-5)),'');
d.lines[3]=core.shift(String(d.locations.length+1),-5);
const after=core.serialize(d),patch={id:'2026-11-01_reference_panel_spacing',description:'Remove generic reference labels and align ordinary NPC/place description first text to the former label plus two 25px body lines. Preserve source definitions and body paragraphs; custom financial/rumor/attribute layouts stay separate.',before_sha256:core.hash(raw),after_sha256:core.hash(after),edits,add_locations:[newLoc]};
for(const l of core.parse(after).locations){
 for(const text of core.literals(core.shift(d.lines[l.body],5))){
  if(text.text.includes('! JO9 MOD START '+id)||text.text.includes('! JO9 MOD END '+id))throw Error('provenance inside literal '+l.name);
 }
}
fs.writeFileSync(out+'/before.qsp',raw);fs.writeFileSync(out+'/candidate.qsp',after);
fs.writeFileSync(out+'/mods/'+patch.id+'.json',JSON.stringify(patch,null,2)+'\n');
const cssRaw=fs.readFileSync(process.argv[4]||game+'/css/base.css'),css=cssRaw.toString('utf8');
const rule='\r\n/* JO9 MOD START '+id+' */\r\n/* Body first glyph: y206 in the native 1280x800 canvas; former label y156 + 2x25px. */\r\n#side_panel_text.jo9-reference-panel { top:203px; height:585px; }\r\n#side_panel_text.jo9-reference-panel .jo9-reference-body,\r\n#side_panel_text.jo9-reference-panel .jo9-reference-body * { font-size:20px !important; }\r\n/* JO9 MOD END '+id+' */\r\n';
if(css.includes(id))throw Error('already CSS');
fs.mkdirSync(out+'/css',{recursive:true});
for(const name of fs.readdirSync(game+'/css')){const from=game+'/css/'+name;if(fs.statSync(from).isFile())fs.copyFileSync(from,out+'/css/'+name);}
fs.writeFileSync(out+'/css/base.css',css+rule);
fs.writeFileSync(out+'/coverage.json',JSON.stringify({counts,inventory,baselineSha:core.hash(raw),candidateSha:core.hash(after),baseCssBefore:core.hash(cssRaw),baseCssAfter:core.hash(Buffer.from(css+rule)),rule},null,2)+'\n');
console.log(JSON.stringify({out,counts,locations:edits.map(e=>e.location),baseline:core.hash(raw),candidate:core.hash(after)}));
