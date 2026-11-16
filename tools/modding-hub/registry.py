"""Read-only index and original-file viewer for user-facing HTML artifacts."""
import hashlib,html,os,re
from datetime import datetime,timezone,timedelta
from pathlib import Path
from urllib.parse import quote

DIAGNOSTIC_DIRS={'before','after','evidence','test-evidence','tests','test','fixtures','fixture','source','installed','candidate','backup','backups','__pycache__','.git','node_modules','game','modtools'}
ASSETS={'.png','.jpg','.jpeg','.gif','.webp','.bmp','.svg','.css','.js','.mjs','.woff','.woff2','.ttf','.ico','.mp3','.wav','.ogg'}
def diagnostic(p):
 return any(s.lower() in DIAGNOSTIC_DIRS for s in p.parts) or bool(re.search(r'(^|[-_])(before|after|candidate|installed|fixture|probe|previous|test)([-_.]|$)',p.name,re.I))
def file_url(p):return '/workspace/fs/'+quote(Path(p).resolve().as_posix(),safe='/:')
def category(p,title):
 text=str(p).lower()+' '+title
 if any(k in text for k in ['mockup','시안','draft']):return '시안'
 if any(k in text for k in ['release','업데이트','changelog','배포','패치_안내']):return '배포·안내'
 if any(k in text for k in ['dialogue','대사','comparison','비교']):return '대사·비교'
 if any(k in text for k in ['catalog','카탈로그','모브','이미지','portrait']):return '이미지·캐릭터'
 if any(k in text for k in ['report','review','검토','점검']):return '검토·보고서'
 return '기타'
def catalog_rows(roots):
 seen=set();by_hash={}
 for root in roots:
  root=Path(root)
  candidates=[root] if root.is_file() else root.rglob('*.html') if root.exists() else []
  for p in sorted(candidates):
   if p.is_symlink() or diagnostic(p.relative_to(root) if root.is_dir() else Path(p.name)):continue
   resolved=p.resolve()
   if resolved in seen:continue
   seen.add(resolved)
   try:raw=p.read_bytes();text=raw.decode('utf-16' if raw.startswith((b'\xff\xfe',b'\xfe\xff')) else 'utf-8-sig',errors='replace')
   except OSError:continue
   title=re.search(r'<title\b[^>]*>(.*?)</title>',text,re.I|re.S)
   if not title or not re.search(r'<!doctype|<html\b',text,re.I):continue
   sha=hashlib.sha256(raw).hexdigest()
   if sha in by_hash:by_hash[sha]['copies'].append(str(resolved));continue
   label=html.unescape(re.sub('<[^>]+>','',title[1])).strip()
   date=datetime.fromtimestamp(p.stat().st_mtime,timezone(timedelta(hours=9))).strftime('%Y-%m-%d')
   row={'id':hashlib.sha256(str(resolved).encode()).hexdigest()[:16],'title':label or p.stem,'category':category(p,label),'date':date,'path':str(resolved),'url':file_url(resolved),'copies':[str(resolved)]}
   by_hash[sha]=row
 return sorted(by_hash.values(),key=lambda r:(r['date'],r['title']),reverse=True)
def default_roots(repo):
 repo=Path(repo);roots=[repo/'docs',repo/'records',repo/'tools/qsp-compare-editor-draft/index.html']
 somi=repo.parent
 for p in somi.iterdir():
  if p.is_dir() and p.name.startswith('JO9_') and not any(k in p.name.lower() for k in ['backups','unused','trash','work_backups','release_sync']):
   # Only published/report HTML near the output root, never an entire game tree.
   roots.extend(sorted(p.glob('*.html')))
   roots.extend(sorted(p.glob('*/*.html')))
 return roots
def resolve_file(value,rows,asset_roots):
 p=Path(value).resolve()
 registered={Path(x).resolve() for r in rows for x in r.get('copies',[r['path']])}
 if not p.is_file():raise FileNotFoundError(value)
 if p in registered:return p
 parents=[x.parent for x in registered]+[Path(x).resolve() for x in asset_roots]
 if p.suffix.lower() in ASSETS and any(p.is_relative_to(root) for root in parents):return p
 raise PermissionError('열람 목록에 등록된 HTML과 관련 리소스만 열 수 있습니다.')
def rewrite_html(text):
 return re.sub(r'file:/+', '/workspace/fs/', text,flags=re.I)
