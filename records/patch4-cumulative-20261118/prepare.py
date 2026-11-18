from pathlib import Path

ROOT = Path('G:/somi/JO9sa/records/patch3-cumulative-20261117')
D = Path(__file__).resolve().parent
src = (ROOT/'inventory.py').read_text('utf-8-sig')
src = src.replace("G:/somi/JO9_2.4.2_Patch2_20261116_Cumulative/JO9_2.4.2_Patch2_20261116_Cumulative.zip", "G:/somi/JO9_2.4.2_Patch3_20261117_Cumulative/JO9_2.4.2_Patch3_20261117_Cumulative.zip")
src = src.replace('6f938b7afa85f026c37483d784abe1939adbd3213e418f996c8fe855a8379a0f', '950138711f793580d72afadbc4ce5a6f9c11379e92315abf8bfff5692c8b742d')
src = src.replace('records/hotfix-cumulative-20261115/inventory.json', 'records/patch3-cumulative-20261117/inventory.json')
src = src.replace('records/patch2-cumulative-20261116/package-manifest.json', 'records/patch3-cumulative-20261117/package-manifest.json')
src = src.replace('changedSincePatch2', 'changedSincePatch3').replace('addedSincePatch2', 'addedSincePatch3')
src = src.replace("assert current_qsp == digest(R/'assets/runtime/2.4.1/jack.qsp'), 'WORK/tracked QSP mismatch; preserve WORK and review'", "tracked_qsp = digest(R/'assets/runtime/2.4.1/jack.qsp') # Current manual WORK dialogue is authoritative; no source overwrite")
src = src.replace("prior['mandatoryAliasPaths']", "prior['mandatoryAliases']")
src = src.replace("'workQspSha256':current_qsp", "'trackedQspSha256':tracked_qsp,'workQspSha256':current_qsp")
(D/'inventory.py').write_text(src, 'utf-8')
print('Prepared Patch4 inventory from verified Patch3 workflow')
