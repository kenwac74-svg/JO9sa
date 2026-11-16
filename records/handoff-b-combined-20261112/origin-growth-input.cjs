const cp=require('child_process'),fs=require('fs'),a=require('assert/strict');
const R='G:/somi/JO9sa';
const read=p=>cp.execFileSync('git',['--git-dir='+R+'/.git','show','66178cf5:'+p]);
const py=String.raw`import sys,zipfile,io,json,xml.etree.ElementTree as E
z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read()));ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
ss=[]
if 'xl/sharedStrings.xml' in z.namelist():
 for si in E.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',ns): ss.append(''.join(t.text or '' for t in si.findall('.//s:t',ns)))
w=E.fromstring(z.read('xl/workbook.xml'));rels=E.fromstring(z.read('xl/_rels/workbook.xml.rels'));m={r.attrib['Id']:r.attrib['Target'] for r in rels}
out=[]
for sh in w.find('s:sheets',ns):
 if sh.attrib['name']!='출신보정':continue
 target=m[sh.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']].lstrip('/');target=target if target.startswith('xl/') else 'xl/'+target
 for row in E.fromstring(z.read(target)).findall('.//s:sheetData/s:row',ns):
  cells={}
  for cell in row:
   ref=cell.attrib.get('r');col=''.join(x for x in ref if x.isalpha());typ=cell.attrib.get('t');v=cell.find('s:v',ns);text=v.text if v is not None else ''.join(t.text or '' for t in cell.findall('.//s:t',ns))
   cells[col]=ss[int(text)] if typ=='s' and text else text
  out.append(cells)
print(json.dumps(out,ensure_ascii=True))`;
const python='C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1110-778-0_26.1110.778.0_x64__3k8sg7r9htsxt/dependencies/python/python.exe';
const rows=JSON.parse(cp.execFileSync(python,['-c',py],{input:read('tools/jo9-history-lab/presets/JO9_Origin_Personality_Presets_20261111.xlsx'),encoding:'utf8'}));
const background=JSON.parse(read('tools/jo9-history-lab/dist/data/backgrounds.json').toString('utf8'));
if(process.argv[2]==='inspect'){console.log(JSON.stringify({rowKeys:rows[7],backgroundKeys:Object.keys(background),background:JSON.stringify(background).slice(0,900),rows:rows.slice(7).map(r=>Object.fromEntries(['A','O','P','R','S','X','Y','Z','AA','AB','AC','AD'].filter(k=>r[k]!==undefined).map(k=>[k,r[k]])))},null,2));}
module.exports={rows,background};
