export const managedImageTools=new Set(['workshop','imageReview']);
const pending=new WeakMap();
export async function ensureWorkspaceTool(key,config,request=fetch){
 if(!managedImageTools.has(key))return {url:config.tools[key]||'',reused:true};
 let tasks=pending.get(config);if(!tasks){tasks=new Map();pending.set(config,tasks);}
 if(tasks.has(key))return tasks.get(key);
 const task=resolve(key,config,request);tasks.set(key,task);
 try{return await task;}finally{tasks.delete(key);}
}
async function resolve(key,config,request){
 const response=await request('/workspace/tools/ensure',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key})});
 let data;try{data=await response.json();}catch{throw Error('이미지 도구의 실행 상태를 읽지 못했습니다.');}
 if(!response.ok)throw Error(data.error||'이미지 도구를 시작하지 못했습니다.');
 const url=new URL(data.url);
 if(url.protocol!=='http:'||url.hostname!=='127.0.0.1'||!url.port||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('이미지 도구 주소가 올바르지 않습니다.');
 config.tools[key]=url.href;return {url:url.href,reused:!!data.reused};
}
