from pathlib import Path
import hashlib,json

R=Path('G:/somi/JO9sa');W=Path('G:/somi/Jack O Nine Tails v2.4_work/game');D=R/'records/mod-studio-images-20261116'
paths=[R/'tools/image-workshop/JO9_Server.ps1',W/'modtools/JO9_Server.ps1']
anchor="            elseif ($Path -eq '/api/context') {"
new="""            elseif ($Path -eq '/catalog-resource-source.js') {
                $asset = Join-Path $Root 'catalog-resource-source.js'
                if (Test-Path -LiteralPath $asset -PathType Leaf) {
                    Write-Response -Stream $Stream -Type 'text/javascript; charset=utf-8' -Body ([IO.File]::ReadAllBytes($asset))
                } else {
                    Write-Response -Stream $Stream -Status 404
                }
            }
"""+anchor
rows=[]
for i,p in enumerate(paths):
 raw=p.read_bytes();text=raw.decode('utf-8-sig');assert text.count(anchor)==1
 (D/('workshop-server-'+str(i)+'.before.ps1')).write_bytes(raw)
 text=text.replace(anchor,new,1);p.write_text(text,encoding='utf-8-sig',newline='')
 rows.append({'path':str(p),'before':hashlib.sha256(raw).hexdigest(),'after':hashlib.sha256(p.read_bytes()).hexdigest()})
assert paths[0].read_bytes()==paths[1].read_bytes()
(D/'workshop-asset-fix.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n','utf-8')
print(json.dumps({'identicalSourceAndInstalled':True,'fixedRoute':'/catalog-resource-source.js'}))
