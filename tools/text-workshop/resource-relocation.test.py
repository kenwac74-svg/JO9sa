import importlib.util, pathlib, tempfile, json, io, zipfile, unittest
from PIL import Image

ROOT=pathlib.Path(__file__).resolve().parents[2]
def module(name,file):
    spec=importlib.util.spec_from_file_location(name,file);obj=importlib.util.module_from_spec(spec);spec.loader.exec_module(obj);return obj
builder=module('builder',ROOT/'tools/text-workshop/build-personal-patch.py')
exporter=module('exporter',ROOT/'tools/local-workspace/export-shared-work.py')
class RelocationTest(unittest.TestCase):
    def test_cutoff_and_existing_ownership_survive_path_move(self):
        with tempfile.TemporaryDirectory(dir=pathlib.Path(__file__).parent) as tmp:
            root=pathlib.Path(tmp);(root/'objects').mkdir();b=io.BytesIO();Image.new('RGB',(12,10),'blue').save(b,'PNG');data=b.getvalue();h=builder.digest(data);(root/'objects'/h).write_bytes(data)
            def event(key,created,operation,files):return dict(key=key,created=created,createdKST=created,operation=operation,files=files)
            old='SNKmod/scene/result.png';new='scene/result.png'
            events=[event('work','2026-10-11T10:00:00Z','replace',[dict(path=old,after=h,bytes=len(data))]),event('move','2026-10-11T11:00:00Z','relocate',[dict(path=new,fromPath=old,after=h,bytes=len(data)),dict(path='ui/not-owned.png',fromPath='SNKmod/ui/not-owned.png',after=h,bytes=len(data))])]
            (root/'events.jsonl').write_text('\n'.join(map(json.dumps,events)),'utf8')
            builder.build(root,root/'before.zip','2026-10-11T10:30:00Z')
            with zipfile.ZipFile(root/'before.zip') as z:self.assertIn('game/content/pic/'+old,z.namelist())
            builder.build(root,root/'after.zip','2026-10-11T11:30:00Z')
            with zipfile.ZipFile(root/'after.zip') as z:
                images=[p for p in z.namelist() if p.startswith('game/content/pic/')]
                self.assertEqual(images,['game/content/pic/'+new])
            self.assertEqual(exporter.selected_images(root/'events.jsonl'),{new:h})

if __name__=='__main__':unittest.main()
