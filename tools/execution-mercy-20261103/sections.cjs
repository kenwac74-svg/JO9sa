'use strict';
const assert=require('node:assert/strict'),core=require('../text-workshop/core.cjs');
const executions=[{confirm:182,id:1820,label:'교살'},{confirm:183,id:1830,label:'참살'},{confirm:184,id:1840,label:'찰살'},{confirm:185,id:1841,label:'익살'},{confirm:186,id:1842,label:'적살'},{confirm:187,id:1843,label:'안개 숲으로'}];
function body(doc,name){const l=doc.locations.find(l=>l.name===name);assert(l,name);return core.shift(doc.lines[l.body],5);}
function block(text,start){const at=text.indexOf(start);assert(at>=0,start);assert.equal(text.indexOf(start,at+1),-1,'Unique block '+start);const end=text.indexOf('\r\nend\r\n',at);assert(end>at);return text.slice(at,end+'\r\nend\r\n'.length);}
function executionBlock(doc){return block(body(doc,'interaction_result'),"if $interaction_type = 'execution':\r\n");}
function interactionBlock(doc,id){return block(body(doc,'interaction'),'if interaction = '+id+':\r\n');}
module.exports={body,block,executionBlock,interactionBlock,executions};
