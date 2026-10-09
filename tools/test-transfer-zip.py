# 실제 배포 적용기를 임시 게임에 적용해 원본 보호, 무백업, 파일 검증과 경로 이식을 확인한다.
from pathlib import Path
import datetime,hashlib,json,os,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'tmp'/('transfer-installer-test-'+datetime.datetime.now().strftime('%Y%m%d-%H%M%S'))
PKG=BASE/'압축 해제';PLAY=BASE/'플레이/game';VAN=BASE/'순정/game';TOOLS=BASE/'설치 도구'
def sha(b):return hashlib.sha256(b).hexdigest()
def write(root,rel,b):
    p=root/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b);return p
for root in [PKG,PLAY,VAN]:root.mkdir(parents=True)
for root in [PLAY,VAN]:(root/'content/pic').mkdir(parents=True)
write(PLAY,'jack.qsp',b'BEFORE QSP');write(VAN,'jack.qsp',b'VANILLA QSP')
exe=write(PLAY,'engine/jack.exe',b'KEEP ENGINE');vanilla=write(VAN,'content/pic/characters/Npc.png',b'ORIGINAL PNG')
write(PLAY,'save/existing.sav',b'KEEP SAVE')
files=[]
def payload(rel,b,role):
    write(PKG,rel,b);files.append({'path':rel,'bytes':len(b),'sha256':sha(b),'role':role})
payload('game/jack.qsp',b'PATCHED QSP','qsp')
payload('game/content/pic/characters/Npc.png',b'USER PNG','personal-image')
o={'version':1,'sourceRoot':'SELECT_ORIGINAL_ON_NEW_PC','originals':{'characters/npc.png':{'base':'characters/Npc.png','alias':'characters/Npc (2).png','source':'content/pic/characters/Npc.png','sourceSha':sha(b'ORIGINAL PNG')}},'reservations':{}}
payload('game/modtools/image-original-cuts.json',json.dumps(o).encode(),'original-cut-links')
payload('JO9-tools/tools/local-workspace/catalog/image_work/personal-patch/settings.json',json.dumps({'version':1,'game':'OLD','catalogRoot':'OLD'}).encode(),'ownership-state')
payload('JO9-tools/tools/local-workspace/catalog/image_work/personal-patch/events.jsonl',b'{}\n','ownership-state')
payload('JO9-tools/tools/text-workshop/example.cjs',b'// editor code','tool')
payload('JO9-tools/tools/local-workspace/Open-Modding-Tools.cmd',b'@echo off\r\n','launcher')
payload('JO9-tools/tools/local-workspace/Open-Modding-Tools.ps1',b'# launcher','launcher')
payload('JO9-tools/tools/local-workspace/runtime/dialogue-ai-settings.json',b'{"provider":"kindroid"}','ai-settings')
write(TOOLS,'tools/local-workspace/runtime/dialogue-ai-settings.json',b'{"protectedKey":"EXISTING_LOCAL_KEY"}')
write(PKG,'Apply.ps1',(ROOT/'tools/transfer-zip/Apply.ps1').read_text('utf-8-sig').encode('utf-8-sig'))
write(PKG,'MANIFEST.json',json.dumps({'files':files,'workImageCount':1,'workImages':[{'path':'characters/Npc.png','sha256':sha(b'USER PNG')}]}).encode())
def run(extra=[],play=PLAY,original=VAN):
    r=subprocess.run(['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File',str(PKG/'Apply.ps1'),'-GameDir',str(play),'-OriginalDir',str(original),'-ToolsDir',str(TOOLS),*extra],capture_output=True,timeout=60)
    return r
before=sha((PLAY/'jack.qsp').read_bytes())
r=run(['-VerifyOnly']);assert r.returncode==0,r.stderr.decode(errors='replace')
assert sha((PLAY/'jack.qsp').read_bytes())==before
r=run(['-VerifyOnly'],original=PLAY);assert r.returncode!=0
bad=PKG/'game/content/pic/characters/Npc.png';bad.write_bytes(b'TAMPERED')
r=run();assert r.returncode!=0 and sha((PLAY/'jack.qsp').read_bytes())==before
bad.write_bytes(b'USER PNG')
vanilla.write_bytes(b'WRONG ORIGINAL');r=run();assert r.returncode!=0 and sha((PLAY/'jack.qsp').read_bytes())==before
vanilla.write_bytes(b'ORIGINAL PNG')
r=run();assert r.returncode==0,r.stderr.decode(errors='replace')
assert (PLAY/'jack.qsp').read_bytes()==b'PATCHED QSP'
assert exe.read_bytes()==b'KEEP ENGINE' and (PLAY/'save/existing.sav').read_bytes()==b'KEEP SAVE'
assert (VAN/'jack.qsp').read_bytes()==b'VANILLA QSP' and vanilla.read_bytes()==b'ORIGINAL PNG'
assert (PLAY/'content/jo9o_original_cuts/characters/Npc.png').read_bytes()==b'ORIGINAL PNG'
assert (TOOLS/'tools/local-workspace/catalog/image_work/personal-patch/objects'/sha(b'USER PNG')).read_bytes()==b'USER PNG'
assert json.loads((PLAY/'modtools/image-original-cuts.json').read_text('utf-8'))['sourceRoot']==str(VAN)
assert json.loads((TOOLS/'tools/local-workspace/catalog/image_work/personal-patch/settings.json').read_text('utf-8'))['game']==str(PLAY)
assert (TOOLS/'tools/local-workspace/runtime/dialogue-ai-settings.json').read_bytes()==b'{"protectedKey":"EXISTING_LOCAL_KEY"}'
assert not any('backup' in p.name.lower() or '.bak' in p.name.lower() for p in PLAY.rglob('*'))
r=run();assert r.returncode==0,r.stderr.decode(errors='replace')
result={'passed':True,'fixture':str(BASE),'checks':['verify-only-no-write','reject-same-original-and-play','tampered-payload-rejected-before-write','wrong-original-rejected-before-write','apply-and-repeat','engine-save-original-unchanged','original-junction','ownership-objects-restored','new-PC-paths-rebased','existing-local-AI-key-preserved','no-backup-created','JSON-readable-without-BOM']}
(ROOT/'tmp/transfer-audit/installer-validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),'utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2),flush=True)
