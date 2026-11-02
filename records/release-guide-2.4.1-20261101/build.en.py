from pathlib import Path
from PIL import Image
from html import escape as esc
import base64, io, json, hashlib, sys
sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parent
GAME = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
OUT = ROOT / 'JO9_2.4.1_Update_Guide_EN.html'
data = json.loads((ROOT/'content.en.json').read_text(encoding='utf-8'))
assets = {
    'city': ('content/pic/bg/kamira_street_small (2).png', 640),
    'battle': ('content/pic/mob/ogre.png', 560),
    'club': ('content/pic/bg/catfightclub.png', 560),
}
manifest = []
def picture(key, alt, eager=False):
    rel, width = assets[key]
    raw = (GAME/rel).read_bytes()
    with Image.open(io.BytesIO(raw)) as im:
        im = im.convert('RGB')
        im.thumbnail((width, width), Image.Resampling.LANCZOS)
        w,h=im.size
        buf=io.BytesIO(); im.save(buf,'WEBP',quality=76,method=6)
    binary=buf.getvalue()
    manifest.append({'key':key,'source':rel,'source_sha256':hashlib.sha256(raw).hexdigest(),'width':w,'height':h,'embedded_bytes':len(binary)})
    return f'<img src="data:image/webp;base64,{base64.b64encode(binary).decode()}" width="{w}" height="{h}" alt="{esc(alt)}" loading="{"eager" if eager else "lazy"}" decoding="async">'

def bullets(items):
    return '<ul>'+''.join('<li>'+esc(s)+'</li>' for s in items)+'</ul>'

def detail_groups(groups):
    return ''.join(f'''<details class="topic"><summary><span class="topic-no">{i:02}</span><span>{esc(g['title'])}</span><span class="topic-count">{len(g['items'])} items</span><span class="plus" aria-hidden="true">＋</span></summary><div class="topic-body">{bullets(g['items'])}</div></details>''' for i,g in enumerate(groups,1))

def fixes(groups):
    return ''.join(f'''<article class="fix-group"><div class="fix-head"><h3>{esc(g['title'])}</h3><span class="version-tag">{esc(g['version'])}</span></div>{bullets(g['items'])}</article>''' for g in groups)

cards=[]
for i,f in enumerate(data['features241'],1):
    art=''
    if f.get('image'):
        art='<figure>'+picture(f['image'],f['alt'])+'<figcaption>'+esc(f['caption'])+'</figcaption></figure>'
    cards.append(f'''<article class="feature {'feature-art' if art else 'feature-text'}">{art}<div class="feature-copy"><p class="eyebrow">UPDATE {i:02}</p><h3>{esc(f['title'])}</h3><p>{esc(f['body'])}</p>{bullets(f['items']) if f.get('items') else ''}</div></article>''')

html='''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Jack-O’-Nine-Tails Korean mod 2.4.1 update guide. Includes cumulative changes since 2.3, the 2.4.0 updates, and new features and fixes in 2.4.1.">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>Jack-O’-Nine-Tails 2.4.1 | English Update Guide</title>
<style>
:root{color-scheme:dark;--bg:#111715;--panel:#19211e;--panel2:#202923;--ink:#f0e9d7;--dim:#b7beaf;--muted:#8f9c8f;--gold:#d8ba76;--line:#354037;--red:#ca8d74;--green:#a4c3a2}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:78px}body{margin:0;background:var(--bg);color:var(--ink);font-family:'Malgun Gothic','맑은 고딕',Arial,sans-serif;font-size:16px;line-height:1.8;word-break:keep-all;overflow-wrap:anywhere}a{color:inherit}button{font:inherit}button,a{touch-action:manipulation}a:focus-visible,button:focus-visible,summary:focus-visible{outline:2px solid var(--gold);outline-offset:5px}img{max-width:100%;height:auto;display:block}.wrap{max-width:1080px;margin:auto;padding:0 32px}.brand{display:flex;justify-content:space-between;gap:18px;align-items:center;padding-top:26px;padding-bottom:22px;border-bottom:1px solid var(--line);font-size:11px;letter-spacing:.15em;color:var(--dim)}.brand strong{font-size:13px;letter-spacing:.08em;color:var(--gold)}.edition{border:1px solid #71603c;border-radius:3px;padding:5px 12px;color:var(--gold);white-space:nowrap}.hero{padding-top:48px;padding-bottom:42px;display:grid;grid-template-columns:1.1fr 1fr;gap:40px;align-items:center}.eyebrow{margin:0 0 10px;color:var(--gold);font-size:11px;font-weight:700;letter-spacing:.16em}.hero h1{font-family:Georgia,'Malgun Gothic',serif;font-size:clamp(30px,4.2vw,48px);line-height:1.32;letter-spacing:-.055em;margin:0 0 20px;font-weight:800}.hero h1 em{font-style:normal;color:var(--gold)}.hero .lead{font-size:16px;color:#c3c9ba;max-width:510px;margin:0}.hero-note{margin:22px 0 0;font-size:12px;color:var(--muted)}.hero-art{position:relative;margin:0;border:1px solid #5c553e;padding:6px;background:#20261e}.hero-art img{width:100%;aspect-ratio:4/3;object-fit:cover}.hero-art figcaption{font-size:10px;color:var(--muted);margin:6px 3px 0}.nav-shell{position:sticky;top:0;z-index:3;background:#111715f5;border-block:1px solid var(--line);backdrop-filter:blur(8px)}nav{display:flex;gap:0}nav a{padding:15px 22px 15px 0;text-decoration:none;font-size:13px;font-weight:700;white-space:nowrap}nav a span{color:var(--gold);margin-right:8px;font-size:11px}nav a:hover{color:var(--gold)}section{padding:52px 0;border-bottom:1px solid var(--line)}.section-head{display:flex;align-items:flex-start;gap:20px;margin-bottom:28px}.section-no{font-family:Georgia,serif;color:var(--gold);font-size:40px;line-height:1.2;font-weight:400}.section-head h2{font-size:28px;line-height:1.35;margin:0 0 8px;letter-spacing:-.04em}.section-head p{margin:0;color:var(--dim);font-size:14px;max-width:760px}.version-line{display:flex;gap:16px;align-items:center;margin:10px 0 22px}.version-line h3{font-size:22px;margin:0;letter-spacing:-.03em}.version-line .rule{height:1px;background:var(--line);flex:1}.chip{display:inline-block;border:1px solid #6d5d39;color:var(--gold);font-size:10px;line-height:1.5;padding:3px 8px;letter-spacing:.05em;white-space:nowrap}.feature-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.feature{border:1px solid var(--line);background:var(--panel);border-radius:4px;overflow:hidden}.feature figure{margin:0}.feature figure img{width:100%;aspect-ratio:4/3;object-fit:cover}.feature figcaption{font-size:10px;color:var(--muted);padding:6px 20px 0}.feature-copy{padding:22px 24px 24px}.feature h3{font-size:21px;line-height:1.45;letter-spacing:-.03em;margin:0 0 12px}.feature p:not(.eyebrow){font-size:14px;color:#c8cebf;margin:0}.feature ul{font-size:13px;color:var(--dim);padding-left:18px;margin:15px 0 0}.feature li+li{margin-top:4px}.feature-text{border-top:2px solid #7e6b41}.feature-text h3{font-size:19px}.carry-intro{margin-top:42px;border-left:3px solid var(--gold);padding:0 0 0 18px}.carry-intro p{color:var(--dim);font-size:14px;margin:9px 0}.topic-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:24px 0 12px;font-size:12px;color:var(--muted)}.expand-button{background:transparent;color:var(--gold);border:1px solid #5f5c44;padding:7px 12px;border-radius:3px;font-size:12px;cursor:pointer}.expand-button:hover{background:#2a3023}.topic{border:1px solid var(--line);border-bottom:0;background:#161e19}.topic:last-child{border-bottom:1px solid var(--line)}summary{list-style:none;display:flex;align-items:center;gap:14px;cursor:pointer;padding:16px 20px;line-height:1.5;font-size:15px;font-weight:700}summary::-webkit-details-marker{display:none}.topic-no{font-size:11px;font-weight:400;color:var(--gold);min-width:18px}.topic-count{font-size:10px;color:var(--muted);font-weight:400;margin-left:auto;white-space:nowrap}.plus{font-size:18px;color:var(--gold);font-weight:400}.topic[open] .plus{transform:rotate(45deg)}.topic[open] summary{border-bottom:1px solid var(--line);background:#20281f}.topic-body{padding:6px 24px 18px 50px;font-size:14px;color:#cbd0c1}.topic-body ul{padding-left:18px;margin:8px 0}.topic-body li{padding:5px 0}.notice{margin:20px 0 0;padding:16px 20px;background:#1c251e;border-left:2px solid #78926f;font-size:13px;color:#c7cfbd}.fix-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.fix-group{border:1px solid var(--line);padding:20px 22px;background:#161d19}.fix-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between}.fix-head h3{font-size:16px;margin:0;line-height:1.5}.version-tag{font-size:10px;color:var(--green);border:1px solid #3f5640;padding:2px 6px;white-space:nowrap}.fix-group ul{margin:12px 0 0;padding-left:18px;color:var(--dim);font-size:13px}.fix-group li+li{margin-top:8px}.other-intro{color:var(--dim);font-size:13px;margin:0 0 18px}.other-list{padding-left:20px;color:#bbc4b4;font-size:14px;margin:0;columns:2;column-gap:36px}.other-list li{break-inside:avoid;margin:0 0 10px;padding-left:3px}.tool-note{font-size:11px;color:var(--muted);margin:16px 0 0}.credits{margin-top:30px;border-top:1px solid var(--line);padding-top:22px;color:var(--muted);font-size:12px}.credits strong{color:var(--dim)}.credits p{margin:6px 0}.footer{padding:25px 0 36px;display:flex;justify-content:space-between;gap:20px;align-items:center;color:var(--muted);font-size:11px}.footer a{text-decoration:none}.footer a:hover{color:var(--gold)}
@media(max-width:720px){.wrap{padding-inline:20px}.brand{padding-top:18px;gap:8px;font-size:9px}.brand strong{font-size:11px}.edition{padding:4px 8px}.hero{grid-template-columns:1fr;gap:24px;padding-top:32px;padding-bottom:30px}.hero h1{font-size:36px}.hero-art{max-width:440px;width:100%;margin:auto}.hero .lead{font-size:15px}nav{justify-content:space-between;gap:8px}nav a{padding:13px 0;font-size:12px}nav a span{margin-right:4px}section{padding:36px 0}.section-head{gap:13px}.section-no{font-size:32px}.section-head h2{font-size:25px}.section-head p{font-size:13px}.feature-grid,.fix-grid{grid-template-columns:1fr}.feature-copy{padding:20px}.feature figure img{max-height:320px;object-fit:contain;background:#111713}.other-list{columns:1}summary{padding:14px;gap:9px;font-size:14px}.topic-count{font-size:9px}.topic-body{padding:6px 17px 16px 25px}.topic-toolbar{align-items:flex-start}.topic-toolbar>span{max-width:55%}.footer{align-items:flex-start}.version-line h3{font-size:20px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
@media print{body{background:#fff;color:#171c16;font-size:10pt}.wrap{max-width:none;padding:0}.nav-shell,.expand-button{display:none}.hero{padding-top:10px}.hero h1{font-size:28pt}.hero .lead,.section-head p,.feature p:not(.eyebrow),.topic-body,.fix-group ul,.other-list{color:#333}.hero-art,.feature,.fix-group,.topic{background:#fff;border-color:#bbb}.feature-copy{padding:12px}.feature-grid,.fix-grid{gap:10px}.feature figure img{max-height:170px;object-fit:contain}section{padding:25px 0}.section-head h2{font-size:20pt}.topic{break-inside:avoid}details>summary{background:#fff!important;color:#222}.topic-body{display:block!important}.credits,.footer,.hero-note,figcaption{color:#555!important}.brand strong,.eyebrow,.section-no{color:#665127}.other-list{columns:1}}
</style></head><body id="top">
<header class="wrap brand"><strong>JACK-O’-NINE-TAILS</strong><span>KOREAN MOD · UPDATE GUIDE</span><span class="edition">VERSION 2.4.1</span></header>
<main>
<div class="wrap hero"><div><p class="eyebrow">RETURN TO ETERNAL ROME</p><h1>A clearer battlefield.<br><em>More ways to grow.</em></h1><p class="lead">Building on the character training and household management of 2.4,<br>2.4.1 adds new combat presentation, match outcomes, and conveniences.</p><p class="hero-note">New to this release? This English guide to the Korean mod covers<br>the cumulative changes since 2.3 and the additions in 2.4.1.</p></div><figure class="hero-art">'''+picture('city','A foggy stone-built city at night, lit by street lamps',True)+'''<figcaption>Korean mod 2.4.1 · update guide</figcaption></figure></div>
<div class="nav-shell"><nav class="wrap" aria-label="Document contents"><a href="#updates"><span>01</span>Updates</a><a href="#fixes"><span>02</span>Bug fixes</a><a href="#others"><span>03</span>Other changes</a></nav></div>
<div class="wrap">
<section id="updates"><div class="section-head"><span class="section-no" aria-hidden="true">01</span><div><h2>Updates</h2><p>Explore the highlights of this release and the full cumulative changes introduced in 2.4.0 since version 2.3.</p></div></div>
<div class="version-line"><span class="chip">NEW</span><h3>Highlights of 2.4.1</h3><span class="rule"></span></div>
<div class="feature-grid">'''+''.join(cards)+'''</div>
<div class="notice"><strong>Further refinements to existing features</strong>'''+bullets(data['followups241'])+'''</div>
<div class="carry-intro"><p class="eyebrow">2.3 → 2.4.0 → 2.4.1</p><h3 style="font-size:24px;margin:0;letter-spacing:-.03em">Everything 2.4.0 brought to the game</h3><p>Send the companions you have trained into battle, adapt training to their personalities and constitutions, and hear dialogue shaped by relationships. The full list below covers changes since 2.3, from traits and private rooms to storage, trade, and financial crises.</p></div>
<div class="topic-toolbar"><span>Select a category to read its full cumulative changes.</span><button id="expand240" class="expand-button" type="button" aria-expanded="false" aria-controls="changes240">Expand all</button></div>
<div id="changes240">'''+detail_groups(data['groups240'])+'''</div>
<p class="notice">The cumulative 2.4.0 entries are not all new in 2.4.1. They bring together the changes since 2.3, using current names and final behavior, for readers downloading this release for the first time.</p>
</section>
<section id="fixes"><div class="section-head"><span class="section-no" aria-hidden="true">02</span><div><h2>Bug fixes</h2><p>Grouped fixes for obstructed screens, interrupted progression, and incorrect character, inventory, and payment handling. The labels distinguish 2.4.1 fixes from the cumulative fixes in 2.4.0.</p></div></div><div class="fix-grid">'''+fixes(data['fixes'])+'''</div></section>
<section id="others"><div class="section-head"><span class="section-no" aria-hidden="true">03</span><div><h2>Other changes</h2><p>Smaller improvements to presentation, resources, and the modding and review environment.</p></div></div>
'''+bullets(data['other']).replace('<ul>','<ul class="other-list">',1)+'''
<p class="tool-note">Tool-related entries describe the modding and review environment. Normal play does not require a separate modding tool.</p>
<div class="credits"><strong>Credits and thanks</strong><p>Korean 2.4 mod revision: SAnk. Thanks to the original creator, past developers, translators, artists, and the community.</p><p>PSP_PSP — Indie Patch creator<br>zonezizone — Jack-O’-Nine-Tails gameplay videos<br>KomkomSamchon (콤콤삼촌) — Honey Select 2 images</p><p>See the in-game credits for the full contributor and original-resource acknowledgments.</p></div>
</section>
<footer class="footer"><span>JACK-O’-NINE-TAILS · KOREAN MOD 2.4.1<br>Update guide · single HTML with embedded images</span><a href="#top">Back to top ↑</a></footer>
</div></main>
<script>
(()=>{const b=document.getElementById('expand240'),topics=[...document.querySelectorAll('#changes240 details')];function state(){const all=topics.every(d=>d.open);b.textContent=all?'Collapse all':'Expand all';b.setAttribute('aria-expanded',String(all));}b.addEventListener('click',()=>{const open=!topics.every(d=>d.open);topics.forEach(d=>d.open=open);state();});topics.forEach(d=>d.addEventListener('toggle',state));window.addEventListener('beforeprint',()=>{topics.forEach(d=>{d.dataset.printOpen=String(d.open);d.open=true;});});window.addEventListener('afterprint',()=>{topics.forEach(d=>{d.open=d.dataset.printOpen==='true';delete d.dataset.printOpen;});state();});})();
</script></body></html>'''
html=html.replace('</style>','@media screen and (min-width:721px){.feature-grid{grid-template-columns:repeat(6,minmax(0,1fr))}.feature-grid>.feature-art{grid-column:span 3}.feature-grid>.feature-text{grid-column:span 2}}\n</style>',1)
OUT.write_text(html,encoding='utf-8')
report={'file':str(OUT),'bytes':OUT.stat().st_size,'sha256':hashlib.sha256(OUT.read_bytes()).hexdigest(),'embedded_images':manifest,'topic_groups':len(data['groups240']),'topic_items':sum(len(g['items']) for g in data['groups240']),'fix_items':sum(len(g['items']) for g in data['fixes']),'other_items':len(data['other'])}
(ROOT/'build-report.en.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='embedded_images'},ensure_ascii=False))
