from pathlib import Path
import shutil
P=Path(__file__).resolve().parent
old=Path('G:/Codex/tmp/build-241-release-20261101/run-NBk2Ys')
for src,name in [(old/'report.json','initial-release-report.json'),(old/'client-runner.log','initial-client-runner.log'),*[(old/'client'/f'{x}-stderr.log',f'initial-{x}-stderr.log') for x in ['home','newgame','cache']]]:
    shutil.copy2(src,P/name)
src=Path('G:/somi/JO9sa/records/full-prezip-20261101/portable-probe.ps1')
text=src.read_text(encoding='utf-8-sig').replace('G:/Codex/tmp/full-prezip-20261101-launcher','G:/Codex/tmp/build-2.4.1-20261101/launcher').replace('C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/output/full-prezip-20261101/portable-launcher-verification.json',(P/'launcher-verification.json').as_posix())
text=text.replace("$native.MainWindowTitle -notlike 'Jack-o-nine-tails*'","$native.MainWindowTitle -ne 'Jack-o-nine-tails 2.4.1 & Kor Ver'")
(P/'launcher-probe.ps1').write_text(text,encoding='utf-8-sig')
Path('G:/Codex/tmp/build-2.4.1-20261101/launcher').mkdir(exist_ok=True)
print('Initial expected-notice failure evidence retained;2.4.1 launcher probe prepared.')
