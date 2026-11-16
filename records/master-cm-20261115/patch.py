from pathlib import Path
import gzip,shutil
L=Path(__file__).parent;R=Path('G:/somi/JO9sa');H=R/'tools/modding-hub';D=R/'records/master-cm-20261115';D.mkdir(parents=True,exist_ok=True)
def edit(path,changes):
 raw=path.read_bytes();s=raw.decode('utf-8-sig');backup=D/(path.relative_to(R).as_posix().replace('/','__')+'.before.gz')
 if not backup.exists():backup.write_bytes(gzip.compress(raw))
 for a,b in changes:
  assert s.count(a)==1,(str(path),a[:90],s.count(a));s=s.replace(a,b)
 path.write_text(s,'utf-8',newline='\n')
helper='''const CM_KEYS=['jo9_cruel_mercy','jo9_cruel_mercy_half'];
export function cmValue(code,defaults={}){
 const values={...defaults,...Object.fromEntries(nativeRows(code).map(r=>[r.key,r.value]))};
 return (values.jo9_cruel_mercy??0)+(values.jo9_cruel_mercy_half??0)/2;
}
export function patchCm(code,value){
 if(!Number.isFinite(value)||!Number.isSafeInteger(value*2))throw Error('CM은 0.5 단위 숫자로 입력하세요.');
 const whole=Math.trunc(value),half=Math.round((value-whole)*2),newline=code.includes('\\r\\n')?'\\r\\n':'\\n';
 for(const [key,number] of [[CM_KEYS[0],whole],[CM_KEYS[1],half]]){
  if(nativeRows(code).some(r=>r.key===key))code=patchNativeStat(code,key,number);
  else code+=(code && !code.endsWith('\\n')?newline:'')+key+' = '+number;
 }
 return code;
}
'''
edit(H/'overrides/studio-role.mjs',[
 ('const LABELS=',helper+'const LABELS='),
 ('export function masterStats(m,role){','export function masterStats(m,role,defaults={}){'),
 ('<div class="st-grid">${nativeRows(m.statsCode).map', '''<div class="cv-form"><label title="CM = jo9_cruel_mercy + jo9_cruel_mercy_half / 2 · 음수는 Cruel(잔혹), 양수는 Mercy(자비) · 0.5 단위">CM (Cruel &amp; Mercy)<input type="number" step="0.5" data-st-master-cm value="${cmValue(m.statsCode,defaults)}" ${nativeRows(m.statsCode).some(r=>CM_KEYS.includes(r.key)&&r.repeated)?'disabled title="여러 곳에서 지정됩니다. 원본 코드로 편집하세요."':''}></label></div><p class="fine-print">CM은 0.5 단위입니다. 별도로 지정하지 않으면 공통 시작 값을 표시합니다.</p><div class="st-grid">${nativeRows(m.statsCode).filter(r=>!CM_KEYS.includes(r.key)).map''')])
edit(H/'overrides/studio-view.mjs',[
 ('masterStats, patchNativeStat','masterStats, cmValue, patchCm, patchNativeStat'),
 ('masterStats(masterData(),role)','masterStats(masterData(),role,st.ch.nativeDefaults)'),
 ("   if(t.dataset.stMaster==='statsCode') for", "   if(t.dataset.stMaster==='statsCode'){const cm=root.querySelector('[data-st-master-cm]');if(cm)cm.value=cmValue(t.value,st.ch.nativeDefaults);}\n   if(t.dataset.stMaster==='statsCode') for"),
 ('  if (t.dataset.stMasterStat) {', '''  if(t.hasAttribute('data-st-master-cm')){
   if(t.value==='')return;
   try{setMaster('statsCode',patchCm(masterData().statsCode,Number(t.value)));const raw=root.querySelector('[data-st-master="statsCode"]');if(raw)raw.value=masterData().statsCode;}
   catch(error){api.toast(error.message);t.value=cmValue(masterData().statsCode,st.ch.nativeDefaults);}return;
  }
  if (t.dataset.stMasterStat) {''')])
edit(H/'master_editor.py',[
 (' def read(self,sid):', ''' def native_defaults(self,doc=None):
  doc=doc or QspDocument(self.qsp.read_bytes())
  values=stat_values(doc.body('init_game')) if 'init_game' in doc.index else {}
  return {key:values.get(key,0) for key in ['jo9_cruel_mercy','jo9_cruel_mercy_half']}
 def read(self,sid):'''),
 ("  _,body,entries=self._native();master=self._master(sid,entries);", "  doc,body,entries=self._native();master=self._master(sid,entries);"),
 ("'master':master,'revision':self.revision(sid,entries)", "'master':master,'nativeDefaults':self.native_defaults(doc),'revision':self.revision(sid,entries)")])
edit(H/'server.py',[("revision=editor.slave_revision(sid))", "revision=editor.slave_revision(sid),nativeDefaults=editor.native_defaults())")])
source=(L/'cm.test.mjs').read_text('utf-8').replace("'file:///G:/somi/JO9sa/tools/modding-hub/overrides/studio-role.mjs'","'../overrides/studio-role.mjs'")
(H/'tests/master-cm.test.mjs').write_text(source,'utf-8')
shutil.copyfile(L/'test_cm_defaults.py',H/'tests/test_cm_defaults.py')
print('CM field and common-default linkage installed; no game data writes')
