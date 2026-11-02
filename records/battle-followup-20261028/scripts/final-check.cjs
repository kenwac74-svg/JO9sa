'use strict';
const fs=require('node:fs'),a=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const input=JSON.parse(fs.readFileSync(__dirname+'/inputs.json')),r=JSON.parse(fs.readFileSync(__dirname+'/candidate.json')),hash=p=>c.hash(fs.readFileSync(p));
const work=input.work,repo=input.repo;
a.equal(hash(work+'/jack.qsp'),r.qspAfter);a.equal(hash(work+'/css/base.css'),r.cssAfter);a.equal(hash(work+'/content/js/jo9_battle_log.js'),r.jsAfter);
a.equal(hash(repo+'/assets/css-2.4/base.css'),r.cssAfter);a.equal(hash(repo+'/assets/content/js/jo9_battle_log.js'),r.jsAfter);
for(const x of input.assets){a.equal(hash(work+'/'+x.destination),x.sha256);a.equal(hash(repo+'/resources/new/'+x.destination),x.sha256);a.equal(hash(x.source),x.sha256);}
for(const f of ['save/1.sav','save/JO9_GOLD_AP_CHECK_20261026.sav'])a.equal(hash(work+'/'+f),input.hashes[f]);
for(const f of ['assets/content/js/jo9_traits_view.js','assets/json/menu_icon.json','assets/json/slave_index.json'])a.equal(hash(repo+'/'+f),input.tracked[f]);
const d=c.parse(fs.readFileSync(work+'/jack.qsp'));a(c.serialize(d).equals(fs.readFileSync(work+'/jack.qsp')));
console.log(JSON.stringify({status:'PASS',qsp:r.qspAfter,addedAssets:input.assets.length,savesUnchanged:true,unrelatedTrackedFilesUnchanged:true,adoptedArtSourcesUnchanged:true},null,2));
