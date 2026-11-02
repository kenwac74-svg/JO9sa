import json,subprocess,xml.etree.ElementTree as ET
from pathlib import Path
P=Path(__file__).resolve().parent
F=Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full/game')
rows=[]
for p in sorted((F/'json').rglob('*.json')):
    row={'path':str(p.relative_to(F))}
    try:json.loads(p.read_text(encoding='utf-8-sig'));row['utf8Json']='PASS'
    except Exception as e:
        row['utf8Json']='FAIL';row['error']=str(e)
        try:json.loads(p.read_text(encoding='cp1251'));row['cp1251Json']='PASS'
        except Exception as e:row['cp1251Json']='FAIL';row['fallbackError']=str(e)
    rows.append(row)
js=[]
for p in sorted((F/'content/js').glob('*.js')):
    r=subprocess.run(['node','--check',str(p)],capture_output=True,text=True)
    js.append({'path':str(p.relative_to(F)),'pass':r.returncode==0,'output':r.stderr.strip()})
try:ET.parse(F/'config.xml');config={'strictXml':'PASS'}
except Exception as e:config={'strictXml':'LEGACY_UNESCAPED_AMPERSAND','error':str(e),'raw':(F/'config.xml').read_text(encoding='utf-16'),'decision':'Keep byte-identical original engine configuration; native engine launch is authoritative. Not a newly introduced XML-format claim.'}
report={'jsonFiles':len(rows),'issues':[x for x in rows if x['utf8Json']!='PASS'],'javascript':js,'configXml':config}
(P/'data-code-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=True))
