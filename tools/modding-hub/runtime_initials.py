"""Read-only QSP runtime previews, isolated from game/save writes."""
import atexit,hashlib,json,os,queue,shutil,subprocess,threading
from pathlib import Path

HERE=Path(__file__).resolve().parent
class RuntimeInitials:
 def __init__(self):self.lock=threading.Lock();self.process=None;self.signature=None;self.seq=0;atexit.register(self.close)
 def close(self):
  p=self.process;self.process=None
  if p and p.poll() is None:
   try:p.stdin.close();p.wait(timeout=2)
   except Exception:p.kill();p.wait(timeout=2)
 def fingerprint(self,root):
  paths=[root/'jack.qsp',root/'json/slave_index.json',*sorted((root/'json/slaves').glob('*.json'))]
  return hashlib.sha256(repr([(str(p),p.stat().st_mtime_ns,p.stat().st_size) for p in paths]).encode()).hexdigest()
 def call(self,root,body):
  root=Path(root).resolve()
  if body.get('action') not in ('meta','calculate'):raise ValueError('초기값 요청을 확인하세요.')
  sid=body.get('characterId',0)
  if type(sid) is not int or sid<0:raise ValueError('캐릭터 번호를 확인하세요.')
  data=body.get('data')
  if data is not None and (not isinstance(data,dict) or any(not isinstance(k,str) or (k.startswith('seed_') and not isinstance(v,(str,int,float,bool,type(None)))) for k,v in data.items())):raise ValueError('seed_ 초기값은 단일 값이어야 합니다.')
  context=body.get('context',{})
  if not isinstance(context,dict):raise ValueError('계산 기준을 확인하세요.')
  for key in ('master','difficulty','obedience','cm'):
   if key in context and (type(context[key]) is not int or abs(context[key])>1000000):raise ValueError('계산 기준은 정수로 선택하세요: '+key)
  with self.lock:
   signature=(str(root),self.fingerprint(root))
   if self.process is None or self.process.poll() is not None or signature!=self.signature:
    self.close();node=shutil.which('node')
    if not node:raise RuntimeError('초기값 계산에 Node.js가 필요합니다.')
    self.process=subprocess.Popen([node,'--stack-size=60000',str(HERE/'runtime-initials.cjs')],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,encoding='utf-8',bufsize=1,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
    self.responses=queue.Queue();p=self.process;responses=self.responses
    def read():
     try:
      for line in p.stdout:responses.put(json.loads(line))
     except Exception as error:responses.put({'error':str(error)})
     finally:responses.put({'error':'초기값 계산 프로세스가 종료되었습니다.'})
    threading.Thread(target=read,daemon=True).start();self.signature=signature
   self.seq+=1;request={**body,'root':str(root),'requestId':self.seq}
   self.process.stdin.write(json.dumps(request,ensure_ascii=False)+'\n');self.process.stdin.flush()
   try:response=self.responses.get(timeout=50)
   except queue.Empty:self.close();raise RuntimeError('초기값 계산 시간을 초과했습니다. 게임 파일은 변경되지 않았습니다.')
   if response.get('id')!=self.seq or 'error' in response:raise ValueError(response.get('error','초기값 응답 순서가 다릅니다.'))
   return {**response['result'],'sourceRevision':signature[1]}
