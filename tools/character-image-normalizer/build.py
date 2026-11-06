from pathlib import Path
root=Path(__file__).resolve().parent
html=(root/'src/template.html').read_text(encoding='utf-8')
for key,path in [('__CSS__','style.css'),('__CORE__','core.js'),('__APP__','app.js')]:
    html=html.replace(key,(root/'src'/path).read_text(encoding='utf-8'))
(root/'JO9_Normalizer.html').write_text(html,encoding='utf-8')
print('Built',root/'JO9_Normalizer.html')
