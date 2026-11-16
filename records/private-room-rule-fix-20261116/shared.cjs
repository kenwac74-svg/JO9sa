'use strict';
const fs=require('fs'),a=require('assert/strict'),R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/private-room-rule-fix-20261116',c=require(R+'/tools/text-workshop/core.cjs');
function body(d,n){return c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);}
function slice(s,lo,hi,offset=0){const x=s.indexOf(lo,offset),y=s.indexOf(hi,x+lo.length);a(x>=0&&y>x,'Missing source anchors');return s.slice(x,y);}
function variable(s,name){return slice(s,name+' = {','\r\n}\r\n')+'\r\n}';}
function inner(s){return s.slice(s.indexOf('{')+1,s.lastIndexOf('}'));}
function generic(s){return s.replaceAll("'dyn'+'slave'",'@PRESERVE_SEARCH@').replaceAll('slave','dynslave').replaceAll('@PRESERVE_SEARCH@',"'dyn'+'slave'");}
function sections(raw){const d=c.parse(raw),n=body(d,'next_day');return {
 doc:d,next:n,
 accept:slice(n,"\tif slave['toilet_rule'] = 1:","\tif slave['tentacle_rule'] = 1:"),
 effects:slice(n,"\tif slave['urinal_rule'] = 1 and slave['urinal_rule_broken'] = 0:","\tif slave['v_balls_rule'] = 1 and slave['v_balls_rule_broken'] = 0:"),
 refusal:slice(n,'\t!Handle results when slave breaks one or more rules',"\r\nend\r\n\r\n! JO9 MOD START MAID_BATH_WAKE_PRIORITY | 2026-10-19_wake_other_acceptance"),
 targetRefusal:slice(n,"\t\tif slave['urinal_rule'] = 1 and slave['urinal_rule_broken'] = 1:","\t\tif slave['v_balls_rule'] = 1 and slave['v_balls_rule_broken'] = 1:"),
 forced:slice(n,'\t!Penalties and Bonuses for forcing rules that the slave hates','\r\nend &! end of not fainted'),
 wakeAccept:variable(n,'$jo9_wake_accept'),wakeEffects:variable(n,'$jo9_wake_effects'),
 foreach:variable(body(d,'#static_base'),'$do_for_each_slave_in_list'),mood:variable(body(d,'#static_base'),'$recalc_slave_mood')};}
function region(n){const start=n.indexOf('! JO9 MOD START PRIVATE_SANITARY_RULES_20261116'),end=n.indexOf('! JO9 MOD END PRIVATE_SANITARY_RULES_20261116',start);return start<0?'':n.slice(start,end+'! JO9 MOD END PRIVATE_SANITARY_RULES_20261116'.length);}
function makeFixture(code,extra=[]){const fields=['QSPGAME','private room rule regression','',c.shift(String(1+extra.length),-5),c.shift('Start',-5),'',c.shift(code,-5),c.shift('0',-5)];for(const[n,b]of extra)fields.push(c.shift(n,-5),'',c.shift(b,-5),c.shift('0',-5));fields.push('');const bytes=Buffer.from(fields.join('\r\n'),'utf16le');c.parse(bytes);return bytes;}
module.exports={fs,a,R,W,T,c,body,slice,variable,inner,generic,sections,region,makeFixture};
