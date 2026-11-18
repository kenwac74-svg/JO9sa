'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),preformat=require('G:/somi/JO9sa/tools/qa/qsp-preformat.cjs');
const source='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',raw=fs.readFileSync(source),doc=c.parse(raw),baseline='4bb19a7268634acf1ebf7f1619f68ab30b2d2f0cdc7193c5a27253e7149b1585';assert.equal(doc.hash,baseline);
const loc=doc.locations.find(l=>l.name==='jo9_duplicato'),before=c.shift(doc.lines[loc.body],5),quote=text=>"'"+text.replaceAll("'","''")+"'",unsafe=Array.from({length:95},(_,i)=>String.fromCharCode(i+32)).filter(ch=>!/[A-Za-z0-9._~-]/.test(ch)).join(''),codes='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';assert(unsafe.length<codes.length);
const helper=[
'! JO9 MOD START DUPLICATO_SAFE_LINK_TOKEN_20261117',
"if $args[0]='wire_token':",
' local $j9de_wire=$args[1]',
' local $j9de_wire_chars='+quote(unsafe),
' local $j9de_wire_codes='+quote(codes),
' local $j9de_wire_char, $j9de_wire_hex',
' local j9de_wire_i, j9de_wire_code',
' j9de_wire_i=1',
" $j9de_wire=$replace($j9de_wire,'~','~~')",
' :j9de_wire_printable',
' if j9de_wire_i<=len($j9de_wire_chars):',
"  $j9de_wire=$replace($j9de_wire,$mid($j9de_wire_chars,j9de_wire_i,1),'~'+$mid($j9de_wire_codes,j9de_wire_i,1))",
'  j9de_wire_i+=1',
"  jump 'j9de_wire_printable'",
' end',
' j9de_wire_i=1',
' :j9de_wire_control',
' if j9de_wire_i<=32:',
'  j9de_wire_code=iif(j9de_wire_i<32,j9de_wire_i,127)',
"  $j9de_wire_hex=$mid('0123456789ABCDEF',j9de_wire_code/16+1,1)+$mid('0123456789ABCDEF',(j9de_wire_code mod 16)+1,1)",
"  $j9de_wire_char=$strfind($j9de_wire,'\\x{'+$j9de_wire_hex+'}')",
"  if $j9de_wire_char!'': $j9de_wire=$replace($j9de_wire,$j9de_wire_char,'~u'+$j9de_wire_hex)",
'  j9de_wire_i+=1',
"  jump 'j9de_wire_control'",
' end',
' $result=$j9de_wire',
' exit',
'end',
'! JO9 MOD END DUPLICATO_SAFE_LINK_TOKEN_20261117',''].join('\r\n');
const edits=[];function edit(old,value){assert.equal(before.split(old).length-1,1,old.slice(0,80));edits.push({location:'jo9_duplicato',field:'body',old,new:value,count:1,patchId:'DUPLICATO_SAFE_LINK_TOKEN_20261117'});}
edit('! JO9 MOD START DUPLICATO_ACTOR_TOKEN_20261117',helper+'! JO9 MOD START DUPLICATO_ACTOR_TOKEN_20261117');
const resultLine=before.split('\r\n').find(line=>line.includes('$result = $str(j9de_actor_type)'));edit(resultLine,resultLine.replace('$result = ','$result = $func(\'jo9_duplicato\',\'wire_token\', ')+')');
edit(' local $why, $list, $key, $code, _at, _end, _count',' local $why, $list, $key, $code, $j9de_target_token, $j9de_donor_token, _at, _end, _count');
edit("  $list = $func('jo9_duplicato_traits', 'list')","  $list = $func('jo9_duplicato_traits', 'list')\r\n  $j9de_target_token=$func('jo9_duplicato','actor_token','slave')\r\n  $j9de_donor_token=$func('jo9_duplicato','actor_token','assistant')");
const codeLine=before.split('\r\n').find(line=>line.includes('$code = "gt \'jo9_duplicato\', \'preview\''));edit(codeLine,codeLine.replace("$func('jo9_duplicato', 'actor_token', 'slave')",'$j9de_target_token').replace("$func('jo9_duplicato', 'actor_token', 'assistant')",'$j9de_donor_token'));
const fingerprintLine=before.split('\r\n').find(line=>line.includes("$fingerprint = $func('jo9_duplicato_traits', 'removals', $key)"));edit(fingerprintLine,fingerprintLine.replace("$func('jo9_duplicato_traits', 'removals', $key)","$func('jo9_duplicato','wire_token',$func('jo9_duplicato_traits', 'removals', $key))"));
let after=before;for(const e of edits)after=after.replace(e.old,()=>e.new);const syntax=preformat(after);assert.equal(syntax.quote,'');assert.equal(syntax.depth,0);assert(!/(?<!\r)\n|\r(?!\n)/.test(after));const next={...doc,lines:doc.lines.slice()};next.lines[loc.body]=c.shift(after,-5);const candidate=c.serialize(next),parsed=c.parse(candidate);for(let i=0;i<doc.lines.length;i++)if(i!==loc.body)assert.equal(parsed.lines[i],doc.lines[i]);let inverse=after;for(const e of [...edits].reverse())inverse=inverse.replace(e.new,()=>e.old);assert.equal(inverse,before);
const mod={id:'2026-11-17_duplicato_safe_link_token',description:'Encode actor and conflict fingerprints for lossless EXEC link transport; preserve identity checks, talent rules,300spark cost and all AP/usage limits.',status:'CANDIDATE_PENDING_QT_CALLBACK_PROOF',before_sha256:baseline,after_sha256:c.hash(candidate),edits};fs.writeFileSync(path.join(__dirname,mod.id+'.json'),JSON.stringify(mod,null,2)+'\n');fs.writeFileSync(path.join(__dirname,'manifest.json'),JSON.stringify({source,beforeSha256:baseline,candidateSha256:mod.after_sha256,changedLocations:['jo9_duplicato'],edits:edits.length,newPersistentFields:0,allOtherEncodedFieldsIdentical:true,inverse:true,preformat:true,crlf:true,fullQspRetained:false,printableUnsafe:unsafe,printableCodes:codes.slice(0,unsafe.length),pending:'Actual Qt href callback confirmation'},null,2)+'\n');console.log(JSON.stringify({candidateSha256:mod.after_sha256,edits:edits.length,unsafeChars:unsafe.length,pending:true}));
