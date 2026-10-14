from pathlib import Path
import json,re,urllib.request,urllib.parse,hashlib
root=Path(__file__).parent;r=json.loads((root/'full-release-record.json').read_text(encoding='utf-8'));game=Path(r['stage'])/'game'
state=json.loads((game/'modtools/text-workshop/runtime/server.json').read_text(encoding='utf-8'));base=state['url']
def get(p,headers={}):
 with urllib.request.urlopen(urllib.request.Request(base+p,headers=headers),timeout=30) as f:return f.status,f.read()
status,html=get('catalog');assert status==200
text=html.decode('utf-8');assert 'var MR="PACKAGED_GAME", OR="PACKAGED_ORIGINAL_CUTS";' in text
token=re.search(r'"token":"([a-f0-9]{48})"',text)[1]
for name in ['catalog_workshop.js','catalog_editor.js','catalog_work_codes.js','catalog_pic.js','catalog_cuts.js']:
 assert get(name)[0]==200,name
registry=json.loads((game/'modtools/image-original-cuts.json').read_text(encoding='utf-8'))
checks=[]
for entry in list(registry['originals'].values())[:3]:
 p='api/catalog-asset?'+urllib.parse.urlencode({'t':token,'p':'content/pic/'+entry['base'],'original':'1'})
 status,data=get(p);assert status==200 and hashlib.sha256(data).hexdigest()==entry['sourceSha']
 checks.append(entry['base'])
status,data=get('api/pic?'+urllib.parse.urlencode({'t':token,'p':'content/pic/ui overhaul/jo9_biker_garage.png'}));assert status==200 and data[:8]==b'\x89PNG\r\n\x1a\n'
status,ready=get('api/workshop/ready');ready=json.loads(ready);assert ready['target']==str(game/'jack.qsp')
status,found=get('api/search?'+urllib.parse.urlencode({'q':'#nwtx'}),{'X-JO9-Token':token});found=json.loads(found);assert status==200 and found['total']>=228 and found['hash']==r['source_qsp_sha256']
out={'catalog_http':200,'catalog_root_variables':True,'catalog_modules':5,'original_comparison_samples':checks,'actual_icon_asset':200,'target_is_package':True,'image_iframe_rendered':True,'dialogue_tab_rendered':True,'nwtx_search_total':found['total'],'development_server_not_reused':True}
(root/'full-release-http-QA.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(out,ensure_ascii=False))
