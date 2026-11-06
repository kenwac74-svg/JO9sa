from pathlib import Path
from playwright.sync_api import sync_playwright
import json,zipfile,io
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'tests'/'artifacts';OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--allow-file-access-from-files'])
    page=browser.new_page(viewport={'width':1600,'height':1100},device_scale_factor=1,accept_downloads=True)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('dialog',lambda d:d.accept())
    # Standalone HTML: no server or network dependency.
    page.set_content((ROOT/'JO9_Normalizer.html').read_text(encoding='utf-8'));page.click('#demo');page.wait_for_function('JO9App.state.items.length===3');page.wait_for_timeout(500)
    assert page.locator('#connection').inner_text().startswith('● 단독')
    assert page.evaluate('JO9App.state.items.every(i=>i.w===795&&i.h===596)')
    page.click('#landmarks');page.wait_for_timeout(650);box=page.locator('#source').bounding_box()
    page.mouse.click(box['x']+397/795*box['width'],box['y']+16/596*box['height'])
    page.mouse.click(box['x']+397/795*box['width'],box['y']+300/596*box['height']);page.wait_for_timeout(300)
    t=page.evaluate('JO9App.state.items[0].t');assert abs(t['s']*16+t['y']-24)<2;assert abs(t['s']*300+t['y']-596)<2
    page.click('#approve')
    with page.expect_download() as dl:page.click('#exportZip')
    zpath=OUT/'offline.zip';dl.value.save_as(zpath)
    with zipfile.ZipFile(zpath) as z:
        names=[n for n in z.namelist() if n.endswith('.png')];assert names==['demo_full.png'],names
        im=Image.open(io.BytesIO(z.read(names[0])));assert im.size==(795,596);assert im.mode=='RGBA'
        assert 'manifest.json' in z.namelist()
    with page.expect_download() as dl:page.click('#saveSession')
    sp=OUT/'session.json';dl.value.save_as(sp);j=json.loads(sp.read_text());assert 'apiKey' not in sp.read_text();assert len(j['items'])==3
    page.screenshot(path=str(OUT/'offline.png'),full_page=True)
    # Simulated relay mode: browser policy blocks URL navigation in this environment.
    # Real loopback HTTP is tested independently in test_http.py; no browser policy is modified.
    page=browser.new_page(viewport={'width':1600,'height':1100},accept_downloads=True);page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());page.set_content((ROOT/'JO9_Normalizer.html').read_text(encoding='utf-8'));page.evaluate("JO9App.state.token='test-session-token'");page.click('#demo');page.wait_for_function('JO9App.state.items.length===3');page.wait_for_timeout(300)
    page.evaluate("JO9App.state.items[0].t={s:0.85,x:55,y:20}; JO9App.render()")
    page.click('[data-tab=ai]');page.click('#inferMask');page.fill('#apiKey','TEST_ONLY_NOT_REAL')
    fake=page.evaluate("""()=>{let c=document.createElement('canvas');c.width=800;c.height=640;let x=c.getContext('2d');x.fillStyle='#808080';x.fillRect(0,0,800,640);x.fillStyle='#88ad9c';x.fillRect(330,390,130,225);return c.toDataURL('image/png')}""")
    page.evaluate("""(fake)=>{window.testRequests=[];window.fetch=async(url,options)=>{const data=JSON.parse(options.body);window.testRequests.push(data);return new Response(JSON.stringify({image:fake,provider:'mage',usage:{gems_charged:0},request_id:'test-mock'}),{status:200,headers:{'Content-Type':'application/json'}})}}""",fake)
    page.click('#generate');page.wait_for_function('JO9App.state.items[0].ai!==null');page.wait_for_function('!JO9App.state.busy')
    submitted=page.evaluate('window.testRequests');assert len(submitted)==1
    assert submitted[0]['provider']=='mage';assert submitted[0]['aspect_ratio']=='5:4';assert submitted[0]['image'].startswith('data:image/png;base64,')
    preservation=page.evaluate("""async()=>{const a=JO9App, it=a.state.items[0],b=(await a.baseCanvas(it)).getContext('2d').getImageData(0,0,795,596).data,r=(await a.resultCanvas(it)).getContext('2d').getImageData(0,0,795,596).data;let changed=0,wrong=0;for(let i=0;i<b.length;i+=4){const p=i/4,x=p%795,y=Math.floor(p/795),m=it.mask,inside=x>=m.x&&x<m.x+m.w&&y>=m.y&&y<m.y+m.h;const diff=b[i]!==r[i]||b[i+1]!==r[i+1]||b[i+2]!==r[i+2]||b[i+3]!==r[i+3];if(diff)changed++;if(diff&&(!inside||b[i+3]>0))wrong++;}return {changed,wrong}}""")
    assert preservation['wrong']==0,preservation;assert preservation['changed']>0
    page.locator('summary').first.click();page.click('#aiMatte');page.wait_for_timeout(200)
    # Restore sessions is local and clears approval for non-persisted generated data.
    page.click('[data-tab=framing]');page.click('#approve')
    with page.expect_download() as dl:page.click('#saveSession')
    fp=OUT/'ai_session.json';dl.value.save_as(fp);text=fp.read_text();assert 'TEST_ONLY_NOT_REAL' not in text;assert 'data:image' not in text
    data=json.loads(text);assert data['items'][0]['hadAI'];assert not data['items'][0]['approved']
    # Show the local editor, not the mocked AI feature, for the screenshot.
    page.click('#next');page.click('#align');page.wait_for_timeout(300)
    page.screenshot(path='/mnt/data/JO9_Normalizer_preview.png',full_page=True)
    page.set_viewport_size({'width':1100,'height':850});page.screenshot(path=str(OUT/'compact.png'),full_page=True)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2')
    assert not errors, errors
    browser.close()
    print('PASS: standalone/simulated-relay UI, landmarks, exact PNG dimensions, ZIP, session privacy, mocked Mage request, pixel-preserving merge, responsive layout; no paid calls.')
