'use strict';
const fs=require('node:fs'),path=require('node:path');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',rec=repo+'/records/ui-position-rules-audit-20261027';
const c=require(repo+'/tools/text-workshop/core.cjs'),raw=fs.readFileSync(game+'/jack.qsp'),doc=c.parse(raw),config=fs.readFileSync(game+'/config.xml');
const cfg=config.toString(config[0]===255&&config[1]===254?'utf16le':'utf8').replace(/^\uFEFF/,'');
const assignments=[],html=[],screenModes=[],helpers=[];
const coordinate= /\b((?:MAINDESC|STATDESC|OBJECTS|MSG|ACTS|INPUT|ACTDESC|INPUTDESC)_(?:TEXT_|OK_)?(?:X|Y|W|H))\s*=\s*([^\r\n&]+)/gi;
for(const loc of doc.locations){const body=c.shift(doc.lines[loc.body],5),lits=c.literals(body,true);
 const lines=body.split('\r\n');
 if(/layout|раскладка/i.test(loc.name))helpers.push({location:loc.name,lineCount:lines.length,geometry:[]});
 for(const m of body.matchAll(coordinate)){
  const line=body.slice(0,m.index).split('\r\n').length,entry=lits.find(x=>x.start<=m.index&&x.end>=m.index),sourceLine=lines[line-1];
  if(entry&&entry.comment||/^\s*!/.test(sourceLine))continue;
  const row={location:loc.name,line,key:m[1].toUpperCase(),value:m[2].trim(),context:entry?'quoted':'statement'};
  assignments.push(row);const h=helpers.find(x=>x.location===loc.name);if(h)h.geometry.push(row);
 }
 for(let i=0;i<lines.length;i++){if(/^\s*!/.test(lines[i]))continue;const s=lines[i].match(/\b(INTEGRATED_ACTIONS|SHOWOBJS|SHOWACTS|SHOWSTAT|DISABLESCROLL|HIDE_SCROLL_ARROWS)\b\s*=?\s*(-?\d+)/i);if(s)screenModes.push({location:loc.name,line:i+1,key:s[1].toUpperCase(),value:Number(s[2])});}
 for(const lit of lits){if(lit.comment)continue;for(const match of lit.text.matchAll(/<([a-z][\w-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi)){
  const attr=match[2],sm=attr.match(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/i);if(!sm)continue;
  const style=sm[1]??sm[2],geometry={};for(const pair of style.split(';')){const p=pair.indexOf(':');if(p<0)continue;const key=pair.slice(0,p).trim().toLowerCase();if(/^(?:left|top|right|bottom|width|height|min-width|min-height|max-width|max-height|position|transform|margin(?:-left|-right|-top|-bottom)?|padding(?:-left|-right|-top|-bottom)?)$/.test(key))geometry[key]=pair.slice(p+1).trim();}
  if(!Object.keys(geometry).length)continue;
  const id=attr.match(/\bid\s*=\s*(?:"([^"]*)"|'([^']*)')/i),cls=attr.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  html.push({location:loc.name,line:lit.line+lit.text.slice(0,match.index).split('\n').length-1,tag:match[1].toLowerCase(),id:id?(id[1]??id[2]):'',class:cls?(cls[1]??cls[2]):'',geometry});
 }}
}
const countBy=(rows,key)=>Object.fromEntries(Object.entries(rows.reduce((a,x)=>(a[x[key]]=(a[x[key]]||0)+1,a),{})).sort((a,b)=>b[1]-a[1]));
const cssFiles=['css/base.css','css/mainScreen.css','css/jo9_traits_view.css'],hashes={qsp:c.hash(raw),...Object.fromEntries(cssFiles.map(p=>[p,c.hash(fs.readFileSync(game+'/'+p))]))};
const result={inputHashes:hashes,locationCount:doc.locations.length,configEncoding:config[0]===255&&config[1]===254?'UTF-16LE BOM':'UTF-8',canvas:{width:Number((cfg.match(/\bwidth="(\d+)"/)||[])[1]),height:Number((cfg.match(/\bheight="(\d+)"/)||[])[1])},summary:{engineCoordinateAssignments:assignments.length,directAssignmentLocations:new Set(assignments.filter(x=>x.context==='statement').map(x=>x.location)).size,quotedCoordinateAssignments:assignments.filter(x=>x.context==='quoted').length,layoutHelpers:helpers.length,inlineGeometryTags:html.length,inlineGeometryLocations:new Set(html.map(x=>x.location)).size,topInlineLocations:countBy(html,'location')},assignments,helpers,screenModes,inlineHtmlGeometry:html,limits:['Inventory distinguishes strings from direct statements, but does not execute dynamic strings or expand every branch.','Only static HTML style attributes with parseable quotes are counted; interpolated HTML tags can be omitted.','Counts identify distributed ownership and review candidates, not proven UI defects.']};
fs.mkdirSync(rec+'/scripts',{recursive:true});fs.writeFileSync(rec+'/inline-and-engine-geometry.json',JSON.stringify(result,null,2)+'\n');if(path.resolve(__filename)!==path.resolve(rec+'/scripts/audit-inline.cjs'))fs.copyFileSync(__filename,rec+'/scripts/audit-inline.cjs');
console.log(JSON.stringify({hashes,locations:doc.locations.length,canvas:result.canvas,summary:result.summary,helpers:helpers.map(x=>({name:x.location,assignments:x.geometry.length})),engineCoordinateLocations:countBy(assignments,'location')},null,2));
