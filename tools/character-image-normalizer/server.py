#!/usr/bin/env python3
"""JO9 local-only API relay. Python >=3.10, standard library only.
No remote writes, no keys/images logged, no automatic paid retries.
"""
from __future__ import annotations
import argparse,base64,binascii,http.server,ipaddress,json,os,re,secrets,socket,threading,time,urllib.error,urllib.parse,urllib.request,webbrowser
from pathlib import Path
ROOT=Path(__file__).resolve().parent
LIMIT=32*1024*1024
TOKEN=secrets.token_urlsafe(32)
GEN_LOCK=threading.Lock()
MAGE_ROUTES={'mango','nano_banana_v2','stable_diffusion_xl','sdxl_plus'}
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        raise ValueError('외부 리디렉션은 보안상 허용하지 않습니다.')
OPENER=urllib.request.build_opener(NoRedirect())
def error_text(obj):
    if isinstance(obj,dict):
        e=obj.get('error',obj.get('message',obj))
        if isinstance(e,dict): e=e.get('message',e.get('detail',e))
    else:e=obj
    t=str(e)
    t=re.sub(r'data:image/[^\s\"]+', '[image]', t)
    t=re.sub(r'(?:sk-or-v1-|mage_sk_)[A-Za-z0-9_-]+','[redacted]',t)
    return t[:900]
def fetch(url,method='GET',payload=None,key='',extra=None,timeout=300):
    h={'Accept':'application/json','User-Agent':'JO9-Normalizer/1.0'}
    if key:h['Authorization']='Bearer '+key
    if extra:h.update(extra)
    body=None
    if payload is not None:body=json.dumps(payload).encode();h['Content-Type']='application/json'
    req=urllib.request.Request(url,data=body,headers=h,method=method)
    try:
        with OPENER.open(req,timeout=timeout) as r:
            raw=r.read(LIMIT+1)
            if len(raw)>LIMIT:raise ValueError('API 응답이 32MB 제한을 넘었습니다.')
            return json.loads(raw)
    except urllib.error.HTTPError as e:
        raw=e.read(4096).decode('utf-8','replace')
        try:raw=error_text(json.loads(raw))
        except (ValueError,TypeError):raw=raw[:900]
        raise ValueError(f'공급자 HTTP {e.code}: {raw}. 자동 재시도하지 않았습니다.') from None
    except urllib.error.URLError as e:
        raise ValueError(f'네트워크 오류: {str(e.reason)[:200]}. 제출되었을 수 있으니 공급자 기록을 확인한 뒤 재시도하세요.') from None

def validate_data_url(s):
    if not isinstance(s,str) or len(s)>LIMIT or not re.match(r'^data:image/(png|jpeg|webp);base64,',s):raise ValueError('입력은 로컬 PNG/JPEG/WebP data URL이어야 합니다.')
    try:b=base64.b64decode(s.split(',',1)[1],validate=True)
    except (ValueError,binascii.Error):raise ValueError('잘못된 이미지 base64') from None
    if not b.startswith((b'\x89PNG\r\n\x1a\n',b'\xff\xd8\xff',b'RIFF')):raise ValueError('이미지 파일 서명이 올바르지 않습니다.')
    return s

def build_request(req):
    provider=req.get('provider');image=validate_data_url(req.get('image'))
    model=req.get('model','').strip();prompt=req.get('prompt','').strip()
    if not model or len(model)>180 or not re.fullmatch(r'[a-zA-Z0-9._/:-]+',model):raise ValueError('모델 ID를 입력해 주세요.')
    if not prompt or len(prompt)>12000:raise ValueError('프롬프트는 1~12000자여야 합니다.')
    ratio=req.get('aspect_ratio','4:3')
    if provider=='openrouter':
        if ratio not in {'4:3','5:4'}:raise ValueError('지원하지 않는 전송 비율')
        p={'model':model,'prompt':prompt,'aspect_ratio':ratio,'input_references':[{'type':'image_url','image_url':{'url':image}}], 'provider':{'allow_fallbacks':False}}
        return 'https://openrouter.ai/api/v1/images',p
    if provider=='mage':
        route=req.get('route','mango')
        if route not in MAGE_ROUTES:raise ValueError('등록되지 않은 Mage API 경로')
        if ratio!='5:4':raise ValueError('Mage 전송 캔버스는 5:4입니다.')
        p={'model_id':model,'prompt':prompt,'aspect_ratio':ratio,'image':image}
        if route in {'mango','nano_banana_v2'}:p['resolution']='1K'
        return f'https://api.mage.space/v1/{route}/generate',p
    raise ValueError('등록되지 않은 공급자')

def safe_mage_url(url):
    if not isinstance(url,str):raise ValueError('Mage status_url 누락')
    u=urllib.parse.urljoin('https://api.mage.space',url);p=urllib.parse.urlparse(u)
    if p.scheme!='https' or p.hostname!='api.mage.space' or p.port not in (None,443) or p.username or p.password or not p.path.startswith('/v1/'):
        raise ValueError('허용되지 않는 Mage 상태 URL')
    return u

def download_image(url):
    p=urllib.parse.urlparse(url)
    if p.scheme!='https' or not p.hostname or p.username or p.password or p.port not in (None,443):raise ValueError('이미지 결과 URL이 안전한 HTTPS 주소가 아닙니다.')
    addresses=socket.getaddrinfo(p.hostname,443,type=socket.SOCK_STREAM)
    if not addresses or any(not ipaddress.ip_address(a[4][0]).is_global for a in addresses):raise ValueError('사설 주소 결과는 가져올 수 없습니다.')
    req=urllib.request.Request(url,headers={'User-Agent':'JO9-Normalizer/1.0'})
    with OPENER.open(req,timeout=90) as r:
        b=r.read(LIMIT+1)
    if len(b)>LIMIT:raise ValueError('결과 이미지가 32MB 제한을 넘었습니다.')
    if b.startswith(b'\x89PNG'):mime='image/png'
    elif b.startswith(b'\xff\xd8'):mime='image/jpeg'
    elif b.startswith(b'RIFF') and b[8:12]==b'WEBP':mime='image/webp'
    else:raise ValueError('지원되지 않는 결과 이미지 형식')
    return f'data:{mime};base64,'+base64.b64encode(b).decode()

def generate(req,key):
    url,payload=build_request(req)
    if req['provider']=='openrouter':
        r=fetch(url,'POST',payload,key,{'X-Title':'JO9 Image Normalizer'})
        if r.get('error'):raise ValueError(error_text(r))
        data=r.get('data') or []
        if not data or not data[0].get('b64_json'):raise ValueError('이미지 데이터가 없습니다. 모델의 이미지 입력 지원/차단 여부를 확인하세요.')
        mime=data[0].get('media_type') or 'image/png'
        if mime not in {'image/png','image/jpeg','image/webp'}:raise ValueError('PNG/JPEG/WebP 결과만 지원합니다.')
        img=validate_data_url('data:'+mime+';base64,'+data[0]['b64_json'])
        return {'image':img,'usage':r.get('usage',{}),'provider':'openrouter'}
    idem=secrets.token_hex(16)
    r=fetch(url,'POST',payload,key,{'Idempotency-Key':idem})
    request_id=r.get('request_id','');status_url=r.get('status_url');deadline=time.monotonic()+600
    while True:
        status=str(r.get('status','')).lower()
        if status=='completed':
            result=r.get('result') or {};u=result.get('url')
            if not u:raise ValueError(f'Mage 결과 URL 누락. request_id={request_id}')
            return {'image':download_image(u),'usage':r.get('billing',{}),'provider':'mage','request_id':request_id}
        if status in {'failed','cancelled','canceled','blocked','rejected'}:
            raise ValueError(f'Mage {status}: {error_text(r)} / request_id={request_id}. 자동 재시도/공급자 전환을 하지 않았습니다.')
        if time.monotonic()>deadline:raise ValueError(f'Mage 대기 한도 초과. request_id={request_id}. 재제출 전에 Mage 기록을 확인하세요.')
        if not status_url:raise ValueError(f'Mage status_url 누락: {error_text(r)}')
        time.sleep(2)
        try:r=fetch(safe_mage_url(status_url),key=key,timeout=90)
        except ValueError as e:raise ValueError(f'{e} / Mage request_id={request_id}') from None

class Handler(http.server.BaseHTTPRequestHandler):
    server_version='JO9Local/1.0'
    def log_message(self,fmt,*args):pass
    def valid_origin(self):
        host=self.headers.get('Host','')
        valid={f'127.0.0.1:{self.server.server_port}',f'localhost:{self.server.server_port}'}
        if host not in valid:return False
        origin=self.headers.get('Origin')
        if origin and origin not in {'http://'+v for v in valid}:return False
        if self.headers.get('Sec-Fetch-Site')=='cross-site':return False
        return True
    def send(self,status,obj,ctype='application/json; charset=utf-8'):
        b=json.dumps(obj,ensure_ascii=False).encode() if isinstance(obj,(dict,list)) else obj
        self.send_response(status);self.send_header('Content-Type',ctype);self.send_header('Content-Length',str(len(b)));self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.send_header('Referrer-Policy','no-referrer');self.send_header('X-Frame-Options','DENY')
        if ctype.startswith('text/html'):self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'")
        self.end_headers()
        try:self.wfile.write(b)
        except (BrokenPipeError,ConnectionResetError):pass
    def do_OPTIONS(self):self.send(403,{'error':'CORS access is disabled.'})
    def do_GET(self):
        if not self.valid_origin():return self.send(403,{'error':'로컬 동일 출처 접근만 가능합니다.'})
        path=urllib.parse.urlparse(self.path).path
        if path=='/api/session':return self.send(200,{'token':TOKEN,'version':'1.0','env_keys':{'openrouter':bool(os.getenv('OPENROUTER_API_KEY')),'mage':bool(os.getenv('MAGE_API_KEY'))}})
        if path in {'/','/JO9_Normalizer.html'}:return self.send(200,(ROOT/'JO9_Normalizer.html').read_bytes(),'text/html; charset=utf-8')
        return self.send(404,{'error':'Not found'})
    def do_POST(self):
        if not self.valid_origin() or not secrets.compare_digest(self.headers.get('X-JO9-Token',''),TOKEN):return self.send(403,{'error':'세션 인증 실패. 로컬 시작 파일로 열고 새로고침하세요.'})
        try:
            length=int(self.headers.get('Content-Length','0'))
            if not 0<length<=LIMIT:raise ValueError('요청 크기 제한 초과/빈 요청')
            if not self.headers.get('Content-Type','').startswith('application/json'):raise ValueError('JSON 요청만 지원합니다.')
            req=json.loads(self.rfile.read(length))
            if not isinstance(req,dict):raise ValueError('JSON 객체가 필요합니다.')
            provider=req.get('provider');key=str(req.pop('apiKey','')).strip() or os.getenv('MAGE_API_KEY' if provider=='mage' else 'OPENROUTER_API_KEY','')
            if '\n' in key or '\r' in key:raise ValueError('올바르지 않은 키')
            if self.path=='/api/models':
                if provider!='openrouter':raise ValueError('자동 목록은 OpenRouter에서만 지원합니다.')
                result=fetch('https://openrouter.ai/api/v1/images/models',key=key,timeout=60)
                rows=[{'id':m.get('id'),'name':m.get('name'),'supported_parameters':m.get('supported_parameters',{})} for m in result.get('data',[]) if 'input_references' in m.get('supported_parameters',{})]
                return self.send(200,{'data':rows})
            if self.path!='/api/generate':return self.send(404,{'error':'Not found'})
            if not key:raise ValueError('API 키가 없습니다. 화면에 입력하거나 환경변수를 설정하세요.')
            build_request(req)  # Validate before any network call.
            if not GEN_LOCK.acquire(blocking=False):return self.send(409,{'error':'이미 생성 요청이 진행 중입니다. 중복 요청을 보내지 않았습니다.'})
            try:out=generate(req,key)
            finally:GEN_LOCK.release()
            self.send(200,out)
        except (ValueError,TypeError,KeyError,json.JSONDecodeError) as e:self.send(400,{'error':error_text(str(e))})
        except Exception as e:self.send(502,{'error':f'중계 오류: {type(e).__name__}. 생성 요청을 자동 재시도하지 않았습니다. 공급자 기록을 확인하세요.'})

def main():
    p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=8766);p.add_argument('--no-browser',action='store_true');args=p.parse_args()
    if not (ROOT/'JO9_Normalizer.html').is_file():raise SystemExit('JO9_Normalizer.html을 server.py와 같은 폴더에 두세요.')
    try:s=http.server.ThreadingHTTPServer(('127.0.0.1',args.port),Handler)
    except OSError as e:raise SystemExit(f'포트를 열 수 없습니다: {e}. --port 8767 등으로 실행하세요.')
    url=f'http://127.0.0.1:{s.server_port}'
    print('JO9 이미지 규격 통일기:',url,'\n종료: Ctrl+C / 키와 원본 이미지는 디스크에 저장하지 않습니다.',flush=True)
    if not args.no_browser:threading.Timer(.5,lambda:webbrowser.open(url)).start()
    try:s.serve_forever()
    except KeyboardInterrupt:pass
    finally:s.server_close()
if __name__=='__main__':main()
