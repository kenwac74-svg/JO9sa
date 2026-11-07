'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const seed=require('./patch-schedule-data.cjs');
const statuses=new Set(seed.statuses),phases=new Set(seed.phases),ids=new Set(seed.tasks.map(t=>t.id));
const fields=new Set(['id','status','previousStatus','phase','startDate','dueDate','notes']);
function fail(message,status=400){const e=Error(message);e.status=status;throw e;}
function validDate(value){return typeof value==='string'&&(value===''||/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number(value.slice(0,4))>=2000&&Number(value.slice(0,4))<=9999&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value);}
function validate(item){
 if(!item||typeof item!=='object'||Array.isArray(item)||!ids.has(item.id))fail('목록에 없는 작업입니다.');
 for(const k of Object.keys(item))if(!fields.has(k))fail('허용되지 않은 작업 정보입니다.');
 if('status'in item&&!statuses.has(item.status))fail('작업 상태를 확인하세요.');
 if('previousStatus'in item&&(!statuses.has(item.previousStatus)||item.previousStatus==='완료'))fail('완료 전 상태를 확인하세요.');
 if('phase'in item&&!phases.has(item.phase))fail('작업 차수를 확인하세요.');
 for(const k of ['startDate','dueDate'])if(k in item&&!validDate(item[k]))fail('날짜를 YYYY-MM-DD 형식으로 입력하세요.');
 if('notes'in item&&(typeof item.notes!=='string'||item.notes.length>2000))fail('메모는 2,000자 이내로 입력하세요.');
 if(item.startDate&&item.dueDate&&item.startDate>item.dueDate)fail('목표일은 시작일 이후로 정하세요.');
}
function create(root){
 const file=path.join(path.resolve(root),'patch-schedule.json');
 function read(){
  if(!fs.existsSync(file))return {state:{schema:1,overrides:{},updatedAt:null},revision:'initial'};
  const raw=fs.readFileSync(file);let state;try{state=JSON.parse(raw.toString('utf8').replace(/^\uFEFF/,''));}catch{fail('일정 기록을 읽지 못했습니다. 원본 JSON을 확인하세요.');}
  if(state.schema!==1||!state.overrides||typeof state.overrides!=='object'||Array.isArray(state.overrides))fail('지원하지 않는 일정 기록입니다.');
  for(const [id,v]of Object.entries(state.overrides))if(ids.has(id)){if(!v||typeof v!=='object'||Array.isArray(v)||'id'in v)fail('저장된 작업 정보를 확인하세요.');validate({id,...v});}
  return {state,revision:crypto.createHash('sha256').update(raw).digest('hex')};
 }
 function view(){const {state,revision}=read();return {...seed,tasks:seed.tasks.map(t=>({...t,...state.overrides[t.id]})),revision,updatedAt:state.updatedAt};}
 function update(input){
  const loaded=read();if(!input||input.revision!==loaded.revision)fail('다른 창에서 일정이 변경됐습니다. 최신 상태를 불러온 뒤 다시 변경하세요.',409);
  if(!Array.isArray(input.changes)||!input.changes.length||input.changes.length>seed.tasks.length)fail('저장할 작업을 확인하세요.');
  const next=structuredClone(loaded.state),seen=new Set();
  for(const item of input.changes){
   validate(item);if(seen.has(item.id))fail('같은 작업이 두 번 들어 있습니다.');seen.add(item.id);
   const base=seed.tasks.find(t=>t.id===item.id),before={...base,...next.overrides[item.id]},change={...item};delete change.id;
   if(change.status==='완료'&&before.status!=='완료')change.previousStatus=before.status;
   const merged={...before,...change};validate({id:item.id,...Object.fromEntries(Object.entries(merged).filter(([k])=>fields.has(k)&&k!=='id'))});
   next.overrides[item.id]={...next.overrides[item.id],...change};
  }
  next.updatedAt=new Date().toISOString();fs.mkdirSync(path.dirname(file),{recursive:true});const temp=file+'.'+crypto.randomBytes(6).toString('hex')+'.tmp';
  try{fs.writeFileSync(temp,JSON.stringify(next,null,2)+'\n',{flag:'wx'});fs.renameSync(temp,file);}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
  return view();
 }
 function page(token){const html=fs.readFileSync(path.join(__dirname,'patch-schedule.html'),'utf8');const marker='const SESSION=/*__JO9_PATCH_SESSION__*/null;';if(!html.includes(marker))fail('일정판 HTML 연결을 확인하세요.');return html.replace(marker,'const SESSION=/*__JO9_PATCH_SESSION__*/'+JSON.stringify({token})+';');}
 return {view,update,page};
}
module.exports={create,seed,validDate};
