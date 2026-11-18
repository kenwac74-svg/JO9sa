import urllib.request,json,re,hashlib
from pathlib import Path
HERE=Path(__file__).resolve().parent
BASE='http://127.0.0.1:7689'
PREFIX=BASE+'/v/lab-5a7d91cab3f5/'
def get(url,headers=None):
 req=urllib.request.Request(url,headers={'Connection':'close',**(headers or {})})
 with urllib.request.urlopen(req,timeout=10) as r:return r.status,dict(r.headers),r.read()
code,headers,raw=get('http://127.0.0.1:3813/patch-schedule?workspace=1')
assert BASE in headers.get('Content-Security-Policy','')
session=json.loads(re.search(r'const SESSION=/\*__JO9_PATCH_SESSION__\*/(.*?);',raw.decode()).group(1))
api,_,data=get('http://127.0.0.1:3813/api/patch-schedule',{'X-JO9-Token':session['token']})
schedule=json.loads(data);assert api==200 and isinstance(schedule['tasks'],list)
_,_,config=get(BASE+'/workspace/config');config=json.loads(config)
modules=[]
for name in ['past-history.mjs','sim-data.mjs','coef-view.mjs','pillow-talk.mjs','sim-view.mjs']:
 a,_,ar=get(PREFIX+name);b,_,br=get(BASE+'/'+name)
 assert a==200 and b==200 and ar==br,name
 modules.append({'name':name,'versionedStatus':a,'plainStatus':b,'sha256':hashlib.sha256(ar).hexdigest()})
_,_,data=get(PREFIX+'data/past-history-formula.json');formula=json.loads(data)
assert formula['excludedAges']==[] and formula['ageFactor']['1']==100
status,_,data=get(BASE+'/api/talkbook/8878');talk=json.loads(data)
assert status==200 and talk['noAutoGenerate'] is False
applied=json.loads((HERE/'applied.json').read_text('utf-8'))
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
assert sha('G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/patch-schedule.json')==applied['scheduleUnchanged']
assert sha('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp')==applied['gameQspUnchanged']
report={'status':'PASS','hubBuild':config['build'],'schedule':{'pageStatus':code,'apiStatus':api,'tasks':len(schedule['tasks']),'explicitHubOriginAllowed':True,'savedFileUnchanged':True},'modules':modules,'defaultExcludedAges':formula['excludedAges'],'defaultCode1Weight':formula['ageFactor']['1'],'code1Talkbook':{'status':status,'noAutoGenerate':talk['noAutoGenerate']},'gameQspUnchanged':True}
(HERE/'live-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
