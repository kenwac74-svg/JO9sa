"""Copy the shared embedded-only skin into existing local tool entry pages."""
from pathlib import Path
import re

repo=Path(__file__).resolve().parents[2]
skin=(repo/'tools/modding-hub/embedded-tools.css').read_text('utf-8-sig')
for rel in ['tools/game-reference/jo9-reference.html','tools/image-workshop/place/JO9_Place_Workshop.html']:
    p=repo/rel
    text=p.read_text('utf-8-sig')
    text,n=re.subn(r'(<!-- JO9_EMBEDDED_TOOL_SHELL_20261115 --><style>).*?(</style><script>)',lambda m:m[1]+skin+m[2],text,count=1,flags=re.S)
    if n!=1:raise RuntimeError('Missing skin insertion point: '+rel)
    p.write_text(text,'utf-8')
p=repo/'tools/image-folder-review/static/style.css'
text=p.read_text('utf-8-sig')
marker='/* JO9 MOD START EMBEDDED_TOOL_SHELL_20261115 */'
if text.count(marker)!=1:raise RuntimeError('Missing folder-review skin insertion point')
p.write_text(text[:text.index(marker)]+skin,'utf-8')
(repo/'tools/text-workshop/workspace-shell.css').write_text(skin,'utf-8')
print('Updated embedded-only tool skins from the shared stylesheet.')
