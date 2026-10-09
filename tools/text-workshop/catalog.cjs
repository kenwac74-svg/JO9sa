'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const FLAGS=['done','ore','mre','branch','spare','wip','todo','delete'];
const normalize=p=>String(p).replace(/\//g,'\\');
function parseStatus(text){const m=text.replace(/^\uFEFF/,'').match(/window\.CATALOG_STATUS\s*=\s*([\s\S]*);\s*$/);if(!m)throw Error('체크리스트 상태 파일 형식을 확인하세요.');const v=JSON.parse(m[1]);if(!v.items||typeof v.items!=='object'||Array.isArray(v.items))throw Error('상태 목록이 올바르지 않습니다.');return v;}
function category(d){const p=normalize(d[0]);if(/\\ui overhaul\\|\\ui[_-]overhaul\\/.test(p))return 'UO';if(/\\bg\\/.test(p))return 'bg';if(/\\characters\\/.test(p))return 'CH';if(/\\scene\\/.test(p))return 'SC';if(/\\ui\\|\\buttons\\/.test(p))return 'UI';if(/\\girls\\/.test(p))return 'GL';if(/\\mob\\/.test(p))return 'MB';if(/\\master\\/.test(p))return 'MA';return 'ET';}
function atomic(file,text){const tmp=file+'.'+crypto.randomBytes(6).toString('hex')+'.tmp';try{fs.writeFileSync(tmp,text,{flag:'wx'});fs.renameSync(tmp,file);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}}
function create(root){
  const html=path.join(root,'catalog_merge_vs_original.html'),statusFile=path.join(root,'catalog_status.js'),idFile=path.join(root,'catalog_work_ids.json');
  let stamp='',records=[],idx=new Map(),ids={version:1,items:{},counters:{}};
  function load(){
    if(!fs.existsSync(html))return false;const st=fs.statSync(html),s=st.mtimeMs+':'+st.size;if(s===stamp)return true;
    const text=fs.readFileSync(html,'utf8'),m=text.match(/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/);if(!m)throw Error('카탈로그 목록을 읽지 못했습니다.');records=JSON.parse(m[1]);idx=new Map(records.map(d=>[normalize(d[0]),d]));
    if(fs.existsSync(idFile))ids=JSON.parse(fs.readFileSync(idFile,'utf8').replace(/^\uFEFF/,''));
    let changed=false;const parents=[...records].sort((a,b)=>normalize(a[0])<normalize(b[0])?-1:1);
    // Reuse legacy folded IDs only when the catalog has exactly one spelling.
    const spellings=new Map();for(const d of records){const folded=normalize(d[0]).toLowerCase();spellings.set(folded,(spellings.get(folded)||0)+1);}
    for(const d of records){const key=normalize(d[0]),folded=key.toLowerCase();if(!ids.items[key]&&ids.items[folded]&&spellings.get(folded)===1){ids.items[key]=ids.items[folded];changed=true;}}
    for(const d of parents){const key=normalize(d[0]);if(!ids.items[key]){const cat=category(d),n=(ids.counters[cat]||0)+1;ids.counters[cat]=n;ids.items[key]=cat+'-'+String(n).padStart(4,'0');changed=true;}}
    if(changed)atomic(idFile,JSON.stringify(ids,null,2)+'\n');stamp=s;return true;
  }
  function state(){return fs.existsSync(statusFile)?parseStatus(fs.readFileSync(statusFile,'utf8')):{savedAt:0,items:{}};}
  function flags(v){if(typeof v==='string')v=[v];return FLAGS.filter(k=>Array.isArray(v)&&v.includes(k));}
  function meta(rel){if(!load())return null;const d=idx.get(normalize(rel));if(!d)return null;const parent=d[7]&&idx.get(normalize(d[7])),unit=parent||d,v=state();return {path:d[0],code:ids.items[normalize(d[0])],category:category(d),unitCode:ids.items[normalize(unit[0])],unit:unit[0],paired:records.filter(x=>normalize(x[7]||'')===normalize(unit[0])).map(x=>x[0]),flags:flags(v.items[d[0]]),savedAt:v.savedAt||0};}
  function snapshot(){if(!load())return {available:false};const v=state();return {available:true,...v,codes:Object.fromEntries(records.map(d=>[d[0],ids.items[normalize(d[0])]])),unitCodes:Object.fromEntries(records.filter(d=>d[7]&&idx.has(normalize(d[7]))).map(d=>[d[0],ids.items[normalize(d[7])]]))};}
  function update(actions){
    if(!load())throw Error('이미지 체크리스트를 찾지 못했습니다.');if(!Array.isArray(actions)||actions.length>50000)throw Error('상태 변경 목록이 올바르지 않습니다.');
    const before=fs.existsSync(statusFile)?fs.readFileSync(statusFile):null,v=state(),next=JSON.parse(JSON.stringify(v));next.autoDone=next.autoDone||{};
    const resolved=[];
    for(const a of actions){const d=idx.get(normalize(a.path));if(!d||!FLAGS.includes(a.flag)||typeof a.checked!=='boolean'||typeof a.expected!=='boolean')throw Error('카탈로그 항목과 상태를 확인하세요.');const cur=flags(v.items[d[0]]).includes(a.flag);if(cur!==a.expected&&cur!==a.checked)throw Error('다른 창에서 상태가 바뀌었습니다. 새로고침 후 다시 선택하세요.');resolved.push([a,d]);}
    function set(rel,flag,on){const f=new Set(flags(next.items[rel]));if(on)f.add(flag);else f.delete(flag);const arr=FLAGS.filter(k=>f.has(k));if(arr.length)next.items[rel]=arr;else delete next.items[rel];}
    for(const [a,d] of resolved){set(d[0],a.flag,a.checked);if(a.flag==='done'){delete next.autoDone[d[0]];for(const child of records.filter(x=>normalize(x[7]||'')===normalize(d[0]))){if(a.checked&&!flags(next.items[child[0]]).includes('done')){set(child[0],'done',true);next.autoDone[child[0]]=d[0];}else if(!a.checked&&next.autoDone[child[0]]===d[0]){set(child[0],'done',false);delete next.autoDone[child[0]];}}}}
    const now=fs.existsSync(statusFile)?fs.readFileSync(statusFile):null;if(!((before===null&&now===null)||(before&&now&&before.equals(now))))throw Error('상태 파일이 바뀌었습니다. 다시 선택하세요.');
    // Keep each prior state. No game images or QSP are modified here.
    if(before){const dir=path.join(root,'image_work','status_backups');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,Date.now()+'_'+crypto.randomBytes(3).toString('hex')+'.js'),before,{flag:'wx'});}
    next.savedAt=Math.max(Date.now(),Number(v.savedAt||0)+1);atomic(statusFile,'// IMGMG shared checklist state\nwindow.CATALOG_STATUS='+JSON.stringify(next)+';\n');return snapshot();
  }
  return {root,load,state,meta,snapshot,update};
}
module.exports={create,parseStatus,category,normalize,FLAGS,atomic};
