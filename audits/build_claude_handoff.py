from pathlib import Path
import json, shutil, re, hashlib, zipfile

root = Path(__file__).resolve().parents[1]
out = root/'handoff/JO9_SNKmod_0.1_Claude_20260928'
out.mkdir(parents=True, exist_ok=True)
def copy(src, rel):
    dest = out/rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src,dest)
copy(root/'docs/CLAUDE_HANDOFF_RELEASE_0_1_20260928.md','START_HERE_KO.md')
copy(root/'releases/JO9 UI_overhaul_SNKmod_0.1.zip','release/JO9 UI_overhaul_SNKmod_0.1.zip')
for folder in ['build','installer','tests','tools','resources','baseline','docs']:
    for p in (root/folder).rglob('*'):
        if p.is_file() and '__pycache__' not in p.parts:
            copy(p,'source/'+p.relative_to(root).as_posix())
for p in (root/'audits').iterdir():
    if p.is_file() and p.suffix in ['.md','.log','.py','.cjs']:
        copy(p,'source/audits/'+p.name)
for name in ['README.md','.gitattributes','.gitignore']:
    if (root/name).is_file():copy(root/name,'source/'+name)
copy(root.parent/'reference/jack.qsp','reference/jack.qsp')
for rel in ['jack.qsp','css/base.css','json/menu_icon.json','engine/jack.exe','engine/Qt5Widgets.dll']:
    copy(Path('G:/somi/JO9O/game')/rel,'reference/vanilla-game/'+rel)
for name in ['JO9_UIpatch_PRIVATE_ROOM_WORK_HANDOFF_20260927.md','JO9_PrivateRoom_UI_Design_v2_KO.md','JO9_PrivateRoom_Diet_Developer_Handoff_KO.md']:
    copy(Path('F:/DOWNC')/name,'user_handoffs/'+name)

# Export only user-visible conversation. Never export reasoning or tool credentials.
rollout = Path('C:/Users/User/.codex/sessions/2026/09/19/rollout-2026-09-19T14-48-18-01a0b835-5548-79a0-af29-524bff777cd2.jsonl')
messages=[]; seen=set()
for line in rollout.open(encoding='utf-8'):
    x=json.loads(line); p=x.get('payload',{})
    if x.get('type')!='response_item' or p.get('type')!='message' or p.get('role') not in ['user','assistant']:continue
    if p.get('channel')=='analysis':continue
    parts=[c.get('text','') for c in p.get('content',[]) if c.get('type') in ['input_text','output_text','text']]
    text='\n'.join(parts)
    if not text or '<recommended_plugins>' in text or '<environment_context>' in text:continue
    text=re.sub(r'<in-app-browser-context\b.*?</in-app-browser-context>','',text,flags=re.S).strip()
    key=p.get('id') or (x.get('timestamp'),p['role'],text)
    if key in seen:continue
    seen.add(key); messages.append({'timestamp':x.get('timestamp'),'role':p['role'],'text':text})
history=out/'history';history.mkdir(exist_ok=True)
(history/'conversation_visible.json').write_text(json.dumps(messages,ensure_ascii=False,indent=2),encoding='utf-8')
md=['# 현재 Codex 채팅의 사용자/답변 이력','\n시간순 사용자·답변 텍스트. 내부 추론/시스템 지침/도구 원문 및 이미지 바이트는 제외. 다른 채팅 전체 원문을 의미하지 않음.\n']
for i,m in enumerate(messages,1):md.append(f"## {i}. {m['timestamp']} — {m['role']}\n\n{m['text']}\n")
(history/'conversation_visible.md').write_text('\n'.join(md),encoding='utf-8')
index=[]
for p in sorted(out.rglob('*')):
    if p.is_file() and p.name!='MANIFEST.json': index.append({'path':p.relative_to(out).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(out/'MANIFEST.json').write_text(json.dumps({'visible_messages':len(messages),'files':index},ensure_ascii=False,indent=2),encoding='utf-8')
archive=out.parent / (out.name + '.zip')
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
    for p in sorted(out.rglob('*')):
        if p.is_file():z.write(p,out.name+'/'+p.relative_to(out).as_posix())
with zipfile.ZipFile(archive) as z:assert z.testzip() is None
print(json.dumps({'zip':str(archive),'bytes':archive.stat().st_size,'files':len(index)+1,'visible_messages':len(messages),'sha256':hashlib.sha256(archive.read_bytes()).hexdigest()},ensure_ascii=False))
