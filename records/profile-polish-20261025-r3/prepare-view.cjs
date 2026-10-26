'use strict';
const fs=require('fs'),assert=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',root='G:/Codex/tmp/profile-polish-20261025-r3',out=root+'/native-view';
assert(!fs.existsSync(out));fs.mkdirSync(out);fs.mkdirSync(out+'/content');fs.mkdirSync(out+'/content/js');fs.mkdirSync(out+'/css');
for(const ent of fs.readdirSync(game+'/content',{withFileTypes:true})){if(ent.name==='js')continue;if(ent.isDirectory())fs.symlinkSync(game+'/content/'+ent.name,out+'/content/'+ent.name,'junction');else fs.copyFileSync(game+'/content/'+ent.name,out+'/content/'+ent.name);}
fs.cpSync(game+'/content/js',out+'/content/js',{recursive:true});fs.cpSync(game+'/css',out+'/css',{recursive:true});fs.copyFileSync(__dirname+'/jo9_traits_view.css',out+'/css/jo9_traits_view.css');fs.copyFileSync(__dirname+'/jo9_traits_view.js',out+'/content/js/jo9_traits_view.js');fs.copyFileSync(__dirname+'/jo9_word_wrap.js',out+'/content/js/jo9_word_wrap.js');
fs.symlinkSync(game+'/fonts',out+'/fonts','junction');fs.cpSync(game+'/json',out+'/json',{recursive:true});
fs.writeFileSync(out+'/config.xml','<game width="1280" height="800" title="JO9 PROFILE R3 CHECK" icon="icon.ico"/>');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
fs.copyFileSync(root+'/candidate.qsp',out+'/jack.qsp');assert.equal(c.hash(fs.readFileSync(out+'/jack.qsp')),JSON.parse(fs.readFileSync(__dirname+'/candidate.json')).after);console.log(out);
