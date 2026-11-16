const fs=require('fs'),path=require('path'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const G='G:/somi/Jack O Nine Tails v2.4_work/game',raw=fs.readFileSync(G+'/jack.qsp'),d=c.parse(raw),missingLiteral=[],stems=new Set(),missingStems=[],missingDefaults=[];
if(process.argv.includes('--candidate')){const patch=JSON.parse(fs.readFileSync(__dirname+'/patch.json'));if(c.hash(raw)!==patch.before_sha256)throw Error('Source changed');for(const e of patch.edits){const l=d.locations.find(x=>x.name===e.location),body=c.shift(d.lines[l.body],5);if(body.split(e.old).length-1!==1)throw Error('Patch mismatch');d.lines[l.body]=c.shift(body.replace(e.old,e.new),-5);}}
let literalPlayCalls=0,closeAllCalls=0;const locations=new Set();
for(const l of d.locations){const b=c.shift(d.lines[l.body],5),lines=b.split('\r\n').filter(x=>!/^\s*!/.test(x));
 for(const line of lines){for(const m of line.matchAll(/\bplay\s+['"]([^'"\r\n]+)['"]/gi)){const file=m[1].replaceAll('\\','/');if(!file.startsWith('content/snd/')||file.includes('<<'))continue;literalPlayCalls++;locations.add(l.name);if(!fs.existsSync(G+'/'+file))missingLiteral.push({location:l.name,file});}
 for(const m of line.matchAll(/\$play_sound\[[^\]\r\n]+\]\s*=\s*(['"])([^'"\r\n]*)\1/g))if(m[2]&&!m[2].includes('<<'))stems.add(m[2]);
 if(/(?:^|[&:])\s*close\s+all\b/i.test(line))closeAllCalls++;
 }
 if(l.name==='jo9_audio_formats')for(const m of b.matchAll(/\$jo9_bgm_track\['([^']+)'\] = '([^']+)'/g))if(!fs.existsSync(G+'/'+m[2]))missingDefaults.push({key:m[1],path:m[2],directAssignments:[]});
}
for(const value of stems){let file=value.replaceAll('\\','/');if(!file.includes('/'))file='content/snd/'+file;if(!/\.(wav|mp3|ogg)/i.test(file))file+='.wav';if(!fs.existsSync(G+'/'+file))missingStems.push(value);}
for(const l of d.locations){const lines=c.shift(d.lines[l.body],5).split('\r\n');for(let i=0;i<lines.length;i++){if(/^\s*!/.test(lines[i]))continue;let executable=lines[i];if(/^\s*(?:if|elseif)\b/.test(executable))executable=executable.slice(executable.indexOf(':')+1);for(const item of missingDefaults)if(new RegExp('\\$toplay\\s*=\\s*[\x27\x22]'+item.key+'[\x27\x22]').test(executable))item.directAssignments.push(l.name+':'+(i+1));}}
const jsFiles=fs.readdirSync(G+'/content/js').filter(x=>x.endsWith('.js')),jsAudio=[];for(const f of jsFiles){const b=fs.readFileSync(G+'/content/js/'+f,'utf8');if(/\b(?:new\s+Audio|play\s+['"]content\/snd|close\s+['"]content\/snd)/i.test(b))jsAudio.push(f);}
const result={sourceHash:c.hash(c.serialize(d)),literalPlayCalls,literalPlayLocations:[...locations],missingLiteral,soundStems:[...stems],missingStems,missingDefaults,closeAllCalls,jsFiles:jsFiles.length,jsDirectAudio:jsAudio};fs.writeFileSync(__dirname+'/sound-path-audit.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
