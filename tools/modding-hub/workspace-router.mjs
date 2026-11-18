// One initialization per view; an older asynchronous navigation cannot replace a newer one.
export function createWorkspaceRouter({has,load,show,begin=()=>{},fail=()=>{},fallback='character',aliases={}}){
 const pending=new Map();let current=fallback,revision=0;
 const resolve=id=>has(aliases[id]||id)?(aliases[id]||id):fallback;
 function ensure(id){id=resolve(id);if(!pending.has(id)){const p=Promise.resolve().then(()=>load(id));pending.set(id,p);p.catch(()=>{if(pending.get(id)===p)pending.delete(id);});}return pending.get(id);}
 async function activate(id){id=resolve(id);current=id;const request=++revision;begin(id);try{await ensure(id);if(request!==revision)return false;show(id);return true;}catch(error){if(request===revision)fail(id,error);return false;}}
 return {activate,ensure,get current(){return current;}};
}
