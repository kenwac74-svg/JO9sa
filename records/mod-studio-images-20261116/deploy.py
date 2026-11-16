import hashlib,json,shutil
from pathlib import Path

D=Path(__file__).resolve().parent
R=Path('G:/somi/JO9sa');H=R/'tools/modding-hub';record=R/'records/mod-studio-images-20261116'
record.mkdir(parents=True,exist_ok=True)
def change(path,old,new,encoding='utf-8'):
 text=path.read_text(encoding='utf-8-sig')
 assert text.count(old)==1,(path,str(old)[:100],text.count(old))
 backup=record/(path.name+'.before')
 if not backup.exists():backup.write_bytes(path.read_bytes())
 text=text.replace(old,new,1);path.write_text(text,encoding=encoding,newline='')
 return hashlib.sha256(path.read_bytes()).hexdigest()
for name in ['image_tool_runtime.py','Start-Image-Tool.ps1','tool-runtime.mjs']:
 assert not (H/name).exists(),name
 (H/name).write_text((D/name).read_text('utf-8'),encoding='utf-8-sig' if name.endswith('.ps1') else 'utf-8',newline='')
shutil.copy2(D/'test_image_tool_runtime.py',H/'tests/test_image_tool_runtime.py')
# Adapt the staged test's import location to the repository tests directory.
p=H/'tests/test_image_tool_runtime.py';p.write_text(p.read_text('utf-8').replace("HERE=Path(__file__).resolve().parent","HERE=Path(__file__).resolve().parent.parent"),'utf-8')
shutil.copy2(D/'tool-runtime.test.mjs',H/'tests/tool-runtime.test.mjs')
p=H/'tests/tool-runtime.test.mjs';p.write_text(p.read_text('utf-8').replace("from './tool-runtime.mjs'","from '../tool-runtime.mjs'"),'utf-8')
change(H/'server.py','import registry\n','import registry\nfrom image_tool_runtime import ImageToolRuntime\n')
change(H/'server.py',' runtime_initials=RuntimeInitials()\n',' runtime_initials=RuntimeInitials()\n image_tools=ImageToolRuntime(repo,urls_file,lambda:base.paths().root)\n')
change(H/'server.py',"if route in ['/workspace/integration.mjs','/workspace/integration.css']:","if route in ['/workspace/integration.mjs','/workspace/integration.css','/workspace/tool-runtime.mjs']:")
change(H/'server.py',"mime='text/javascript' if name.endswith('.mjs') else 'text/css'","mime='text/javascript' if name.endswith('.mjs') else 'text/css'") if False else None
change(H/'server.py',"   runtime=route=='/api/runtime-initials'\n   if not (master or clone or slave or slave_images or general or runtime):return super().do_POST()", "   runtime=route=='/api/runtime-initials'\n   image_tool=route=='/workspace/tools/ensure'\n   if not (master or clone or slave or slave_images or general or runtime or image_tool):return super().do_POST()")
change(H/'server.py',"    if runtime:return self.send_json(200,runtime_initials.call(base.paths().root,body))", "    if image_tool:return self.send_json(200,image_tools.ensure(body.get('key')))\n    if runtime:return self.send_json(200,runtime_initials.call(base.paths().root,body))")
for path in [H/'server.py',H/'Start-Modding-Hub.ps1']:
 change(path,"'server.py','registry.py','integration.mjs'","'server.py','image_tool_runtime.py','Start-Image-Tool.ps1','tool-runtime.mjs','registry.py','integration.mjs'",'utf-8-sig' if path.suffix=='.ps1' else 'utf-8')
change(H/'integration.mjs',"import {createGeneralDbView,simulatorMenuHtml}","import {ensureWorkspaceTool,managedImageTools} from '/workspace/tool-runtime.mjs';\nimport {createGeneralDbView,simulatorMenuHtml}")
p=H/'integration.mjs';text=p.read_text('utf-8');start=text.index(' function openTool(panel,key){');end=text.index(' function renderList(){',start)
old=text[start:end]
new=''' async function openTool(panel,key){
  const requestId=String(Number(panel.dataset.openRequest||0)+1);panel.dataset.openRequest=requestId;panel.dataset.loaded='1';
  const frame=panel.querySelector('[data-workspace-frame="'+key+'"]')||panel.querySelector('iframe');
  const managed=managedImageTools.has(key);
  let status=panel.querySelector('.workspace-tool-status');
  if(!status){status=document.createElement('div');status.className='workspace-tool-status';status.setAttribute('role','status');panel.querySelector('.workspace-toolbar')?.after(status);}
  panel.querySelectorAll('iframe').forEach(other=>{other.hidden=other!==frame;});
  panel.querySelectorAll('[data-workspace-tool]').forEach(b=>b.classList.toggle('primary',b.dataset.workspaceTool===key));
  if(managed){status.textContent='이미지 도구를 연결하는 중입니다…';status.classList.remove('workspace-error');status.hidden=false;frame.hidden=true;delete panel.dataset.externalUrl;}
  try{
   const ready=await ensureWorkspaceTool(key,config);
   if(panel.dataset.openRequest!==requestId)return;
   const url=toolUrl(key);if(!url)throw Error('도구 주소가 없습니다. 모드툴 실행기로 다시 열어 주세요.');
   if(frame.dataset.source!==url||!ready.reused){frame.src=url;frame.dataset.source=url;}
   frame.hidden=false;status.hidden=true;panel.dataset.externalUrl=key==='soundList'?url.replace(/[?&]workspace=1(?:&|$)/,''):config.tools[key];
  }catch(error){
   if(panel.dataset.openRequest!==requestId)return;
   frame.hidden=true;status.textContent=error.message+' 위의 메뉴를 다시 누르면 재시도합니다.';status.classList.add('workspace-error');status.hidden=false;delete panel.dataset.externalUrl;
  }
  sync();
 }
'''
change(p,old,new)
result={'rootFiles':['server.py','Start-Modding-Hub.ps1','integration.mjs','image_tool_runtime.py','Start-Image-Tool.ps1','tool-runtime.mjs'],'tests':['test_image_tool_runtime.py','tool-runtime.test.mjs']}
(D/'deployed.json').write_text(json.dumps(result,indent=2)+'\n','utf-8');(record/'deployed.json').write_text(json.dumps(result,indent=2)+'\n','utf-8')
print(json.dumps(result))
