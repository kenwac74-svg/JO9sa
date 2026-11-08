'use strict';
const assert=require('node:assert/strict');
const actions=new Set(['keep_connected','duplicate_cleanup','compare_choose','review_registration',
 'review_female_variant','reserve_event','reserve_comment','review_variant','keep_cut_registry']);
const normalize=value=>String(value).replaceAll('\\','/').toLowerCase();
function attachReviewNotes(metadata,source,hashForPath){
 assert.equal(source.schema,1);assert(/^[a-f0-9]{64}$/.test(source.qspSha256));assert(Array.isArray(source.entries));
 const seen=new Set(),plans=[];
 for(const note of source.entries){
  const key=normalize(note.path);assert(key.startsWith('content/pic/scene/')&&!key.split('/').includes('..'));
  assert(!seen.has(key),'Duplicate review path: '+key);seen.add(key);assert(actions.has(note.action));
  for(const field of ['label','reason','nextStep','deleteDecision'])assert(typeof note[field]==='string'&&note[field].trim()&&note[field].length<=2000,field);
  assert(/^[a-f0-9]{64}$/.test(note.imageSha256));
  const entry=metadata.entries[key];if(!entry)continue;
  const staleReasons=[];
  if(source.qspSha256!==metadata.qspSha256)staleReasons.push('QSP 변경');
  if(hashForPath&&hashForPath(entry.path)!==note.imageSha256)staleReasons.push('이미지 변경');
  plans.push({entry,review:{action:note.action,label:note.label,reason:note.reason,nextStep:note.nextStep,
   deleteDecision:note.deleteDecision,evidence:note.evidence||[],reviewedQspSha256:source.qspSha256,
   stale:staleReasons.length>0,staleReasons}});
 }
 const counts={};for(const {entry,review}of plans){entry.review=review;counts[review.action]=(counts[review.action]||0)+1;}
 metadata.reviewSummary={total:plans.length,counts,reviewedQspSha256:source.qspSha256,
  stale:plans.filter(plan=>plan.review.stale).length,missing:source.entries.length-plans.length};
 return metadata;
}
module.exports={attachReviewNotes};
