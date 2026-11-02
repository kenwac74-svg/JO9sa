from pathlib import Path
import importlib.util
sp=importlib.util.spec_from_file_location('reader','G:/somi/JO9sa/tools/qsp_dump.py');r=importlib.util.module_from_spec(sp);sp.loader.exec_module(r)
locs=r.read_locations(Path('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp').read_bytes());findings=[]
for loc in locs:
    lines=loc['body'].splitlines()
    for i,s in enumerate(lines):
        if '$death =' in s or ('jo9_traits_revision' in s and loc['name'] in ['$newloc','$ongload']):
            findings.append(f"{loc['name']}:{i+1}\n"+'\n'.join(lines[i:i+10]))
text='\n\n'.join(findings);Path(__file__).with_name('helper-evidence.txt').write_text(text,encoding='utf8');print(text[:5500])
