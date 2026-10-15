const fs=require('fs'),assert=require('assert'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),scan=require('../tools/qa/qsp-preformat.cjs');
const file=process.argv[2]||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',raw=fs.readFileSync(file),d=c.parse(raw),l=d.locations.find(l=>l.name==='#dynamic'),body=c.shift(d.lines[l.body],5),actual=scan(body);
assert.equal(actual.quote,'','Unclosed quote prevents later function definitions from loading');assert.equal(actual.depth,0,'Unclosed code string');
assert.equal(actual.spans.length,516,'All expected dynamic definition boundaries must survive');
const bad=body.replace('new XP from this lesson',"this lesson's new XP"),broken=scan(bad);assert.notEqual(bad,body,'Regression mutation must be present');assert(broken.quote||broken.depth,'Regression lexer must reject the previous one-character fault');
for(const name of ['jo9_meiki_state','jo9_meiki_willing','jo9_meiki_training_bonus']){const n=d.locations.find(l=>l.name===name),result=scan(c.shift(d.lines[n.body],5));assert.equal(result.quote,'',name);assert.equal(result.depth,0,name);}
assert(c.serialize(d).equals(raw));console.log('PASS official-engine lexical rules: 516 dynamic boundaries, no open quote/brace, helper boundaries, old-fault mutation rejected, QSP roundtrip. Not native gameplay.');
