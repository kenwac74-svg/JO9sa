'use strict';
const fs=require('node:fs'),path=require('node:path');
function select(game,catalog,input){
 const rel=typeof input==='string'?input.replaceAll('\\','/'):'',parts=rel.split('/');
 if(!/^content\/pic\//.test(rel)||parts.some(p=>!p||p==='.'||p==='..'||/[\x00-\x1f:]/.test(p)))return null;
 const exact=catalog.meta(rel);if(exact)return exact.path.replaceAll('\\','/');
 // QSP may spell a Windows file differently. Resolve the real directory entry,
 // preserving every folder; never choose a catalog row by folded basename.
 let cursor=game;const actual=[];
 for(const part of parts){
  if(!fs.existsSync(cursor)||!fs.statSync(cursor).isDirectory())return null;
  const names=fs.readdirSync(cursor),matches=names.includes(part)?[part]:names.filter(n=>n.toLowerCase()===part.toLowerCase());
  if(matches.length!==1)return null;
  cursor=path.join(cursor,matches[0]);if(fs.lstatSync(cursor).isSymbolicLink())return null;actual.push(matches[0]);
 }
 if(!fs.statSync(cursor).isFile())return null;
 const resolved=catalog.meta(actual.join('/'));return resolved?resolved.path.replaceAll('\\','/'):null;
}
module.exports={select};
