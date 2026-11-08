from pathlib import Path
import re, json, hashlib

REPO=Path('G:/somi/JO9sa')
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog')
SEED=REPO/'tools/local-workspace/catalog-seed'
NAME='catalog_merge_vs_original.html'
START='<!-- JO9 GIRLS CHECKLIST START 20261104 -->'
END='<!-- JO9 GIRLS CHECKLIST END 20261104 -->'
BACK=Path('G:/Codex/tmp/catalog-ui-20261108/before')
def replace(s,a,b):
    assert s.count(a)==1, (a[:100],s.count(a))
    return s.replace(a,b,1)

def girls(s):
    s=replace(s,"const search = node('input');", "const search = node('input');\n  let appliedSearch='';\n  const searchGo=node('button','검색');searchGo.type='button';searchGo.id='jo9GirlsSearchGo';")
    s=replace(s,"toolbar.append(search, filter, sort, namedLabel, label, refresh, save);", "filter.value='all';\n  toolbar.append(search, searchGo, filter, sort, namedLabel, label, refresh, save);")
    s=replace(s,"const term = search.value.trim().toLowerCase();", "const term = appliedSearch;")
    s=replace(s,"search.oninput=filter.onchange=sort.onchange=()=>{page=0;render();};images.onchange=render;", "searchGo.onclick=()=>{appliedSearch=search.value.trim().toLowerCase();page=0;render();};\n  filter.onchange=sort.onchange=()=>{page=0;render();};images.onchange=render;")
    return s

TABS='''
<!-- JO9 MOD START CATALOG_TABS_MANUAL_SEARCH_20261108 -->
<style>
#jo9CatalogTabs{display:flex;flex-wrap:wrap;gap:6px;padding:10px;background:#202b38;border-bottom:2px solid #987445;margin-bottom:14px}
#jo9CatalogTabs button{padding:11px 18px;background:#303d4e;color:#eee;border:1px solid #71849c;border-radius:5px 5px 0 0;cursor:pointer;font-size:15px}
#jo9CatalogTabs button[aria-selected=true]{background:#e5c28a;color:#211c16;border-color:#e5c28a;font-weight:bold}
.jo9-catalog-panel[hidden]{display:none!important}
.jo9-catalog-panel>details{margin:0!important}
.jo9-catalog-panel>details>summary,.jo9-catalog-panel>.jo9-review-wrapper>details>summary{display:none}
</style>
<script>
(function(){
 function init(){
  const main=document.getElementById('main');if(!main||document.getElementById('jo9CatalogTabs'))return;
  const summary=Array.from(main.querySelectorAll('summary')).find(e=>e.textContent.startsWith('처리 주석 달린 이미지'));
  const review=summary&&summary.closest('details').parentElement;
  if(review){review.id='jo9-catalog-review';review.classList.add('jo9-review-wrapper');}
  const defs=[['gallery','전체 이미지',null],['girls','노예 이미지',document.getElementById('jo9-girls-checklist')],['pack','추가 이미지팩',document.getElementById('jo9-additional-pack')],['mob','전투 MOB',document.getElementById('jo9-mob-sets')],['notes','처리 주석',review]];
  const nav=document.createElement('nav');nav.id='jo9CatalogTabs';nav.setAttribute('role','tablist');nav.setAttribute('aria-label','이미지 목록');
  const panels=new Map(),buttons=new Map();
  for(const [key,label,root] of defs){
   const panel=document.createElement('section');panel.id='jo9-catalog-panel-'+key;panel.className='jo9-catalog-panel';panel.setAttribute('role','tabpanel');panel.hidden=true;
   const button=document.createElement('button');button.type='button';button.id='jo9-catalog-tab-'+key;button.textContent=label;button.setAttribute('role','tab');button.setAttribute('aria-controls',panel.id);panel.setAttribute('aria-labelledby',button.id);button.onclick=()=>activate(key);nav.append(button);buttons.set(key,button);panels.set(key,panel);if(root)panel.append(root);
  }
  const gallery=panels.get('gallery');while(main.firstChild)gallery.append(main.firstChild);
  main.append(nav,...panels.values());
  function activate(key){
   if(!panels.has(key))key='gallery';
   for(const [id,panel] of panels){panel.hidden=id!==key;buttons.get(id).setAttribute('aria-selected',String(id===key));buttons.get(id).tabIndex=id===key?0:-1;const root=panel.firstElementChild;if(root?.tagName==='DETAILS')root.open=id===key;}
   if(key==='notes'&&review){const details=review.querySelector('details');if(details)details.open=true;}
   const url=new URL(location.href);url.searchParams.set('catalogtab',key);history.replaceState(null,'',url);
  }
  window.JO9_CATALOG_TABS={activate};
  const pick=window.pick;if(typeof pick==='function')window.pick=function(){activate('gallery');return pick.apply(this,arguments);};
  const girlNav=document.getElementById('jo9GirlsNav');if(girlNav)girlNav.onclick=()=>{activate('girls');nav.scrollIntoView({block:'start'});};
  nav.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const keys=[...buttons.keys()],i=keys.findIndex(k=>buttons.get(k)===document.activeElement);const next=e.key==='Home'?0:e.key==='End'?keys.length-1:(i+(e.key==='ArrowRight'?1:-1)+keys.length)%keys.length;activate(keys[next]);buttons.get(keys[next]).focus();});
  if(review)review.addEventListener('click',e=>{if(e.target.closest('a,button'))activate('gallery');});
  const params=new URLSearchParams(location.search);activate(params.get('catalogtab')||(params.get('girlssets')==='1'?'girls':params.get('mobsets')==='1'?'mob':'gallery'));
 }
 if(document.readyState==='complete')init();else window.addEventListener('load',init);
})();
</script>
<!-- JO9 MOD END CATALOG_TABS_MANUAL_SEARCH_20261108 -->
'''

def html(s):
    s=replace(s,"var t;el('q').onkeyup=function(){clearTimeout(t);t=setTimeout(filter,250);};", "el('q').onkeyup=null; // Search is applied by the explicit search button.")
    s=girls(s)
    s=replace(s,"controls.append(search,label,refresh);", "const searchGo=node('button','검색');searchGo.type='button';let appliedSearch='';controls.append(search,searchGo,label,refresh);")
    s=replace(s,"const term=search.value.trim().toLowerCase();const rows=manifest.entries", "const term=appliedSearch;const rows=manifest.entries")
    s=replace(s,"search.oninput=render;missing.onchange=render;", "searchGo.onclick=()=>{appliedSearch=search.value.trim().toLowerCase();render();};missing.onchange=render;")
    s=replace(s,"root.append(search);const list=node('div');", "const searchGo=node('button','검색');searchGo.type='button';let appliedSearch='';root.append(search,searchGo);const list=node('div');")
    s=replace(s,"if(search.value&&!JSON.stringify(files.map(({preview,...f})=>f)).includes(search.value.trim()))", "if(appliedSearch&&!JSON.stringify(files.map(({preview,...f})=>f)).toLowerCase().includes(appliedSearch))")
    s=replace(s,"search.oninput=render;root.addEventListener('toggle'", "searchGo.onclick=()=>{appliedSearch=search.value.trim().toLowerCase();render();};root.addEventListener('toggle'")
    return s+TABS

def workshop(s):
    start=s.index('  function globalSearch()')
    end=s.index('\n})();',start)
    s=s[:start]+'''  // JO9 MOD START CATALOG_MANUAL_SEARCH_20261108
  var appliedQuery=query.value.trim(),appliedScope=scope.checked,lastQuery=null;
  function globalSearch(){return appliedScope&&!!appliedQuery;}
  inDir=function(d){return globalSearch()?true:beforeInDir(d);};
  match=function(d,fs,nd){var draft=query.value,savedDir=curDir;query.value=appliedQuery;if(globalSearch())curDir=catalogDir(d[0]);try{return beforeMatch(d,fs,nd);}finally{query.value=draft;curDir=savedDir;}};
  function run(force){var currentQuery=query.value.trim();query.value=currentQuery;appliedQuery=currentQuery;appliedScope=scope.checked;if(globalSearch()&&(currentQuery!==lastQuery||force===true)){['fs','st','src'].forEach(function(id){document.getElementById(id).value='';});document.getElementById('small').checked=true;}lastQuery=currentQuery;filter();counter.textContent=currentQuery?'검색 결과 '+view.length+'개':'';}
  query.onkeyup=null;
  document.getElementById('jo9SearchGo').onclick=function(){run(true);};document.getElementById('jo9SearchClear').onclick=function(){query.value='';run();query.focus();};scope.onchange=null;
  window.JO9_CATALOG_SEARCH={run:run};
  // JO9 MOD END CATALOG_MANUAL_SEARCH_20261108'''+s[end:]
    a=s.index("  document.addEventListener('keyup',function(e){",s.index('JO9_UNCHECKED_REVIEW_BEGIN'))
    b=s.index("  el('review-unchecked').onclick=enter;",a)
    s=s[:a]+s[b:]
    s=replace(s,'    drawTree();filter();\n  }','    drawTree();window.JO9_CATALOG_SEARCH.run();\n  }')
    s=replace(s,'var oldPage=previous.page;drawTree();filter();page=oldPage;', 'var oldPage=previous.page;drawTree();window.JO9_CATALOG_SEARCH.run();page=oldPage;')
    return s

def main():
    seed=(SEED/NAME).read_text(encoding='utf-8')
    block=seed[seed.index(START):seed.index(END)+len(END)]
    installed=(WORK/NAME).read_text(encoding='utf-8')
    assert START not in installed
    installed=installed+'\n'+block+'\n'
    targets={WORK/NAME:html(installed),SEED/NAME:html(seed)}
    for folder in [WORK,SEED]:
        p=folder/'catalog_workshop.js';targets[p]=workshop(p.read_text(encoding='utf-8'))
    p=REPO/'tools/girls-image-checklist/catalog-girls-checklist.js';targets[p]=girls(p.read_text(encoding='utf-8'))
    BACK.mkdir(parents=True,exist_ok=True)
    report=[]
    for i,(p,value) in enumerate(targets.items()):
        before=p.read_bytes();backup=BACK/f'{i}-{p.name}';assert not backup.exists();backup.write_bytes(before)
        after=value.encode('utf-8');p.write_bytes(after)
        report.append({'file':str(p),'before':hashlib.sha256(before).hexdigest(),'after':hashlib.sha256(after).hexdigest(),'backup':str(backup)})
    rec=REPO/'records/catalog-ui-20261108';rec.mkdir(exist_ok=True)
    (rec/'changes.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (rec/'patch.py').write_bytes(Path(__file__).read_bytes())
    print(json.dumps({'updated':len(targets),'report':str(rec)},ensure_ascii=False))
if __name__=='__main__':main()
