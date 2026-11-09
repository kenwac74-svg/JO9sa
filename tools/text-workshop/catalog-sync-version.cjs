'use strict';
// JO9 MOD START CATALOG_SYNC_VERSION_20261109
const crypto=require('node:crypto');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function plan(raw,statusRaw,html,registry,rows){
 const state=JSON.parse(statusRaw.toString('utf8').replace(/^\uFEFF/,'').match(/window\.CATALOG_STATUS\s*=\s*([\s\S]*);\s*$/)?.[1]||'null');if(!state?.items||typeof state.items!=='object')throw Error('체크 기록을 읽지 못했습니다.');
 const selected=require('./original-cuts.cjs').selectedRows(rows,state,registry).map(r=>String(r[0]).replaceAll('\\','/').replace(/^content\/pic\//i,'').toLowerCase()).filter(p=>/^(bg|characters|scene|mob|reserve)\/.+\.png$/i.test(p)&&!/ \(\d+\)\.png$/i.test(p));
 const wanted=new Set(selected),existing=new Set([...Object.keys(registry.originals||{}),...Object.keys(registry.reservations||{})]),analysis=html.match(/"qspSha256"\s*:\s*"([a-f0-9]{64})"/i)?.[1]||null;
 return{qspHash:hash(raw),statusHash:hash(statusRaw),analysisHash:analysis,selected:wanted.size,registered:Object.keys(registry.originals||{}).length,reservations:existing.size,add:[...wanted].filter(k=>!existing.has(k)).length,release:[...existing].filter(k=>!wanted.has(k)).length};
}
function assertCurrent(input,current){if(input?.qspHash!==current.qspHash||input?.statusHash!==current.statusHash)throw Error('동기화 기준 QSP 또는 체크 기록이 변경됐습니다. 최신 WORK 버전을 확인한 뒤 다시 동기화하세요.');}
module.exports={plan,assertCurrent};
// JO9 MOD END CATALOG_SYNC_VERSION_20261109
