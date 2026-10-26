'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const input='G:/somi/Jack O Nine Tails v2.4_work/game/content/js/jo9_word_wrap.js';
const before=fs.readFileSync(input),text=before.toString('utf8');
const old='fragment, i, word;',next='fragment, i, word = null;';assert.equal(text.split(old).length-1,1);
let edited=text.replace(old,next);
const oldSpace='fragment.appendChild(document.createTextNode(pieces[i]));';assert.equal(edited.split(oldSpace).length-1,1);
edited=edited.replace(oldSpace,[
 '// Keep horizontal spaces inside the preceding preformatted word.',
 '                        // QtWebKit otherwise collapses inter-block text-node spaces.',
 '                        if (word && /^[ \\u00a0]+$/.test(pieces[i])) {',
 '                            word.appendChild(document.createTextNode(pieces[i]));',
 '                        } else {',
 '                            fragment.appendChild(document.createTextNode(pieces[i]));',
 '                            word = null;',
 '                        }'
].join('\r\n'));
assert.equal(edited.split("word.style.whiteSpace = 'nowrap';").length-1,1);
edited=edited.replace("word.style.whiteSpace = 'nowrap';","word.style.whiteSpace = 'pre';");
edited=edited.replace('/* JO9 MOD START PROFILE_POLISH_20261025_R3: readonly QtWebKit word wrapping. */','/* JO9 MOD START PROFILE_WORD_SPACES_20261026: readonly QtWebKit word wrapping. */').replace('/* JO9 MOD END PROFILE_POLISH_20261025_R3 */','/* JO9 MOD END PROFILE_WORD_SPACES_20261026 */');
new Function(edited);assert.notEqual(edited,text);
fs.writeFileSync(__dirname+'/jo9_word_wrap.js',edited,{flag:'wx'});
fs.writeFileSync(__dirname+'/word-wrap-manifest.json',JSON.stringify({source:input,before:c.hash(before),after:c.hash(Buffer.from(edited)),textContentPreservedByDesign:true,onlyDomDisplay:true,newGameStateKeys:0,verification:'Native pixel spacing/word-boundary tests pending'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({before:c.hash(before),after:c.hash(Buffer.from(edited)),candidate:__dirname+'/jo9_word_wrap.js'}));
