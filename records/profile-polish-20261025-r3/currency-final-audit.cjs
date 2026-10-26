'use strict';
// Read-only audit of final candidate and the isolated currency edit set.
const fs=require('node:fs'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),{transform,scan}=require('./currency.cjs');
const input='G:/Codex/tmp/profile-polish-20261025-r3/candidate.qsp',baseline='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const candidate=c.parse(fs.readFileSync(input)),before=c.parse(fs.readFileSync(baseline));
assert.equal(candidate.hash,'38aaaaa5e7c424ec0f9b0b22f125bc2ca4966392ea42f982750375c4d982c0ed');
const edits=JSON.parse(fs.readFileSync(__dirname+'/currency-edits.json')).edits;
// '$가' in '1500$가' is a price suffix plus Korean particle, not a QSP identifier.
const vars=s=>[...s.matchAll(/\$[\p{L}_][\p{L}\p{N}_.]*/gu)].filter(m=>!(/\d$/.test(s.slice(0,m.index))||s.slice(Math.max(0,m.index-2),m.index)==='>>')).map(m=>m[0]);
const failures=[],interpolationChanges=[],remaining=[],notIdempotent=[],incomplete=[];
let literals=0,numericPostfix=0,currencyLabels=0,allNounOccurrences=0;
for(const [i,e]of edits.entries()){
 if(transform(e.before)!==e.after)failures.push({i,reason:'Recorded currency edit is not converter output'});
 if(JSON.stringify(vars(e.before))!==JSON.stringify(vars(e.after)))failures.push({i,location:e.location,reason:'Dollar identifier sequence changed'});
 const oldEx=e.before.match(/<<[\s\S]*?>>/g)||[],newEx=e.after.match(/<<[\s\S]*?>>/g)||[];
 if(JSON.stringify(oldEx)!==JSON.stringify(newEx))interpolationChanges.push({i,location:e.location});
}
function codeSkeleton(body){
 const literals=c.literals(body),pieces=[];let at=0;
 for(const e of literals){pieces.push(body.slice(at,e.start),'QSP_LITERAL');at=e.end;}
 pieces.push(body.slice(at));const out=pieces.join('');
 return out.split('\r\n').filter(l=>!/^\s*! JO9 MOD (?:START|END) PROFILE_POLISH_20261025_R3\s*$/.test(l)).join('\r\n');
}
const codeChanges=[];
for(const loc of candidate.locations){
 const orig=before.locations.find(l=>l.name===loc.name);assert(orig);
 const body=c.shift(candidate.lines[loc.body],5),oldBody=c.shift(before.lines[orig.body],5);
 if(codeSkeleton(body)!==codeSkeleton(oldBody))codeChanges.push(loc.name);
 for(const e of c.literals(body)){
  literals++;if(!/스파크|\$/.test(e.text))continue;
  if(transform(e.text)!==e.text)notIdempotent.push({location:loc.name,line:e.line});
  const s=scan(e.text);if(s.skipped)incomplete.push({location:loc.name,line:e.line});
  // This is a second check, not the sole evidence: anchored numeric unit tokens only.
  numericPostfix+=[...e.text.matchAll(/(?:\d[\d,.]*|>>)(?:<\/[a-z]+>)*[ \t]*(?:스파크|\$(?![A-Za-z0-9_]))/g)].length;
  currencyLabels+=[...e.text.matchAll(/스파크[ \t]*:[ \t]*(?:\d|<<)/g)].length;
  for(const m of e.text.matchAll(/스파크/g)){
   allNounOccurrences++;
   const left=e.text.slice(Math.max(0,m.index-30),m.index),right=e.text.slice(m.index+3,m.index+15);
   remaining.push({location:loc.name,line:e.line,left,right,kind:/^\s*:/.test(right)?'standalone-label':'abstract-or-nonnumeric-currency-noun'});
  }
 }
}
const allowed=['exit','$newloc','$ongload','jo9_traits_view'];
for(const loc of codeChanges)if(!allowed.includes(loc))failures.push({location:loc,reason:'Unexpected nonliteral code change'});
if(notIdempotent.length||incomplete.length||numericPostfix||currencyLabels)failures.push({reason:'Noncanonical currency tokens remain',notIdempotent:notIdempotent.length,incomplete:incomplete.length,numericPostfix,currencyLabels});
if(interpolationChanges.length)failures.push({reason:'Currency changed interpolation source',count:interpolationChanges.length});
const displayOnlyExceptions=[
 {location:'hero_creation',before:'size="7">스파크:</font>',after:'size="7">보유금:</font>',reason:'Label and amount are in separate QSP literals; explicit display-only replacement.'},
 {location:'hero_creation',before:'size="6"><<sparks>></font>',after:'size="6">$<<sparks>></font>',reason:'Add currency prefix to the adjacent amount without changing interpolation or value.'}
];
const oldHero=c.shift(before.lines[before.locations.find(l=>l.name==='hero_creation').body],5),newHero=c.shift(candidate.lines[candidate.locations.find(l=>l.name==='hero_creation').body],5);
for(const row of displayOnlyExceptions){assert.equal(oldHero.split(row.before).length-1,1);assert.equal(newHero.split(row.after).length-1,1);assert.equal(newHero.includes(row.before),false);}
const result={status:failures.length?'FAIL':'PASS',candidate:input,candidateHash:candidate.hash,baselineHash:before.hash,currencyEdits:edits.length,displayOnlyExceptions,literalsReviewed:literals,converterIdempotenceFailures:notIdempotent,incompleteInterpolations:incomplete,numericPostfix,currencyAmountLabelsRemaining:currencyLabels,currencyDollarIdentifierChanges:failures.filter(x=>x.reason==='Dollar identifier sequence changed').length,currencyInterpolationChanges:interpolationChanges,nonliteralCodeChangedLocations:codeChanges,nonliteralChangesExplained:'Only approved game-over wrapping script, cache refresh hooks and trait-label metadata logic. Currency edits are exact transform(before)=after and preserve every dollar identifier and interpolation byte; two explicit hero display-only edits are separately asserted.',nounOccurrencesRemaining:allNounOccurrences,remaining,failures,limits:['Numeric postfix zero is corroborated by exact recorded display edits, identifier preservation, interpolation preservation, code-skeleton comparison and converter idempotence. It does not mean every occurrence of the world currency name should be removed.','Explicit hero label/amount display-only edits are outside the automatic converter and are separately recorded and checked.','No runtime file or candidate file is modified by this audit. Native rendering/evaluation is separate.']};
fs.writeFileSync(__dirname+'/currency-final-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,remaining:result.remaining.filter(x=>x.kind==='standalone-label'),failures:result.failures}));
