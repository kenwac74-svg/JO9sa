const fs=require('fs'),path=require('path'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const work='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/battle-fx-repaint-20261027',rec='G:/somi/JO9sa/records/battle-fx-repaint-20261027';
const source=c.parse(fs.readFileSync(tmp+'/native/both-fast-reentry.qsp'));
let start=c.shift(source.lines[source.locations.find(x=>x.name==='Start').body],5);
start=start.split('\r\n').filter(line=>!line.startsWith('*p \'<a id="qa_scroll_callback"')).join('\r\n');
if(start.includes('qa_scroll_callback')||start.includes('qa_fx_second'))throw Error('Diagnostic callback remains in visual Start');
const output=[];
for(const mode of ['animated-baseline','static-candidate']){
 const out=tmp+'/visual-'+mode,extra=mode==='static-candidate'?tmp+'/candidate':work;
 fs.mkdirSync(out+'/css',{recursive:true});fs.mkdirSync(out+'/content/js',{recursive:true});
 for(const base of [work,extra])for(const n of fs.readdirSync(base+'/css').filter(x=>x.endsWith('.css')))fs.copyFileSync(base+'/css/'+n,out+'/css/'+n);
 for(const n of fs.readdirSync(work+'/content'))if(n!=='js'&&!fs.existsSync(out+'/content/'+n))fs.symlinkSync(fs.realpathSync(work+'/content/'+n),out+'/content/'+n,'junction');
 for(const n of fs.readdirSync(work+'/content/js'))if(fs.statSync(work+'/content/js/'+n).isFile())fs.copyFileSync(work+'/content/js/'+n,out+'/content/js/'+n);
 if(mode==='static-candidate')fs.copyFileSync(extra+'/content/js/jo9_battle_log.js',out+'/content/js/jo9_battle_log.js');
 for(const n of ['fonts','json'])if(!fs.existsSync(out+'/'+n))fs.symlinkSync(fs.realpathSync(work+'/'+n),out+'/'+n,'junction');
 const config=fs.readFileSync(work+'/config.xml');if(config[0]!==255||config[1]!==254)throw Error('Expected original UTF16 config');
 const title='JO9 FX '+mode;
 fs.writeFileSync(out+'/config.xml',Buffer.from(config.toString('utf16le').replace(/title="[^"]*"/, 'title="'+title+'"'),'utf16le'));
 fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 const delta=mode==='static-candidate'?'.jo9-battle-v01 .jo9-battle-hit,.jo9-battle-v01 .jo9-battle-player-hit{visibility:visible!important;}':'.jo9-battle-v01 .jo9-battle-hit,.jo9-battle-v01 .jo9-battle-player-hit{-webkit-animation-duration:6s!important;animation-duration:6s!important;-webkit-animation-iteration-count:infinite!important;animation-iteration-count:infinite!important;}';
 fs.appendFileSync(out+'/css/base.css','\n/* Diagnostic visual hold only; never production. */\n'+delta+'\n');
 const d=c.parse(fs.readFileSync(work+'/jack.qsp'));d.lines[d.locations.find(x=>x.name==='Start').body]=c.shift(start,-5);fs.writeFileSync(out+'/visual.qsp',c.serialize(d));
 output.push({mode,title,qsp:out+'/visual.qsp',workingDirectory:out,engine:work+'/engine/jack.exe',baselineCss:mode==='animated-baseline',sourceCSSHash:c.hash(fs.readFileSync(extra+'/css/base.css')),sourceJSHash:c.hash(fs.readFileSync(out+'/content/js/jo9_battle_log.js')),diagnosticHold:mode==='static-candidate'?'visibility forced visible while production timer is tested separately':'6 second infinite CSS animation; diagnostic comparison only'});
}
fs.mkdirSync(rec+'/scripts',{recursive:true});fs.copyFileSync(__filename,rec+'/scripts/make-static-fx-visual.cjs');fs.writeFileSync(rec+'/visual-fixtures.json',JSON.stringify({status:'PREPARED_NOT_LAUNCHED',noSaveWritten:true,noAutoMessage:true,fixtures:output},null,2)+'\n');console.log(JSON.stringify(output,null,2));
