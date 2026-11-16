"""Recover the two existing image tools without trusting stale port records."""
import json, os, subprocess, sys, threading, urllib.request
from pathlib import Path
from urllib.parse import urlsplit

MANAGED = {'workshop', 'imageReview'}

def loopback_url(value):
    p = urlsplit(str(value))
    if p.scheme != 'http' or p.hostname != '127.0.0.1' or not p.port or p.username or p.password or p.path not in ('', '/') or p.query or p.fragment:
        raise ValueError('이미지 도구 주소가 올바르지 않습니다.')
    return f'http://127.0.0.1:{p.port}/'

class ImageToolRuntime:
    def __init__(self, repo, urls_file, game_root, probe=None, launch=None):
        self.repo, self.urls_file, self.game_root = Path(repo), Path(urls_file), game_root
        self._probe_override, self._launch_override = probe, launch
        self._lock = threading.Lock()

    def _urls(self):
        try: return json.loads(self.urls_file.read_text('utf-8-sig'))
        except (OSError, ValueError): return {}

    def _catalog(self, game):
        try:
            cfg = json.loads((self.repo/'tools/local-workspace/local.config.json').read_text('utf-8-sig'))
            if Path(cfg.get('game', '')).resolve() == game.resolve() and cfg.get('catalog'):
                return Path(cfg['catalog'])
        except (OSError, ValueError): pass
        return game/'modtools/catalog'

    def _probe(self, key, url, game, catalog):
        if self._probe_override: return self._probe_override(key, url, game, catalog)
        try:
            url = loopback_url(url)
            opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
            with opener.open(url+'api/status', timeout=1) as res: status = json.load(res)
            if key == 'imageReview':
                return status.get('app') == 'image-folder-review' and Path(status['data_dir']).resolve() == (catalog/'folder-review').resolve()
            runtime = game/'modtools/runtime'
            pid = int((runtime/'server.pid').read_text('ascii').strip())
            port = int((runtime/'port.txt').read_text('ascii').strip())
            return bool(status.get('alive')) and status.get('pid') == pid and status.get('port') == port == urlsplit(url).port
        except (OSError, ValueError, KeyError, TypeError): return False

    def _launch(self, key, game, catalog):
        if self._launch_override: return self._launch_override(key, game, catalog)
        script = self.repo/'tools/modding-hub/Start-Image-Tool.ps1'
        env = dict(os.environ, PYTHONIOENCODING='utf-8')
        env['JO9_MODDING_HUB_ORIGIN'] = ' '.join(f'http://127.0.0.1:{p}' for p in [*range(7689,7710), *range(7719,7730)])
        command = ['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File',str(script),'-ToolKey',key,'-GameDir',str(game),'-CatalogDir',str(catalog),'-PythonPath',sys.executable]
        result = subprocess.run(command, capture_output=True, encoding='utf-8', errors='replace', timeout=45, env=env, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        if result.returncode:
            raise RuntimeError('이미지 도구를 시작하지 못했습니다. '+result.stderr.strip()[-500:])
        for line in reversed(result.stdout.splitlines()):
            try:
                value=json.loads(line)
                if isinstance(value,dict) and value.get('url'): return value
            except ValueError: pass
        raise RuntimeError('이미지 도구의 실행 주소를 확인하지 못했습니다.')

    def ensure(self, key):
        if key not in MANAGED: raise ValueError('지원하지 않는 이미지 도구입니다.')
        with self._lock:
            game=Path(self.game_root()).resolve();catalog=self._catalog(game);urls=self._urls()
            old=urls.get(key,'')
            if old and self._probe(key,old,game,catalog): return {'key':key,'url':loopback_url(old),'reused':True}
            launched=self._launch(key,game,catalog);url=loopback_url(launched['url'])
            if not self._probe(key,url,game,catalog): raise RuntimeError('이미지 도구가 준비되지 않았습니다. 다시 열어 주세요.')
            # Re-read so unrelated tool addresses saved during startup are retained.
            urls=self._urls();urls[key]=url;self.urls_file.parent.mkdir(parents=True,exist_ok=True)
            temp=self.urls_file.with_suffix('.json.tmp');temp.write_text(json.dumps(urls,ensure_ascii=False,indent=2)+'\n','utf-8');os.replace(temp,self.urls_file)
            return {'key':key,'url':url,'reused':False}
