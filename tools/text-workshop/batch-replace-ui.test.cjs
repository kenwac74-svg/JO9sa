'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const file=__dirname+'/batch-replace.js';
const api=fs.existsSync(file)?require(file):{};
test('checkbox selection covers every page and preserves explicit exclusions',()=>{
 assert.equal(typeof api.createSelection,'function','The batch checkbox controller must be available');
 const s=api.createSelection();assert.equal(s.count(234),0);assert(!s.has('page1:a'));
 s.toggle('page1:a',true);s.toggle('page4:b',true);assert.equal(s.count(234),2);
 assert.deepEqual(s.payload(),{all:false,ids:['page1:a','page4:b']});
 s.setAll(true);assert(s.has('not-loaded-page9:c'));assert.equal(s.count(234),234);
 s.toggle('page4:b',false);assert(!s.has('page4:b'));assert.equal(s.count(234),233);
 assert.deepEqual(s.payload(),{all:true,except:['page4:b']});
 s.toggle('page4:b',true);assert.equal(s.count(234),234);
 s.setAll(false);assert.equal(s.count(234),0);assert.deepEqual(s.payload(),{all:false,ids:[]});
});
test('repeated checkbox events are idempotent and literal replacement is not a regex',()=>{
 assert.equal(typeof api.createSelection,'function');assert.equal(typeof api.replaceLiteral,'function');
 const s=api.createSelection();s.toggle('a',true);s.toggle('a',true);assert.equal(s.count(10),1);
 s.toggle('a',false);s.toggle('a',false);assert.equal(s.count(10),0);
 assert.equal(api.replaceLiteral('a.*a.*','a.*',"$&'"),"$&'$&'");
 assert.equal(api.replaceLiteral('어머 어머','어머',''),' ');
});
