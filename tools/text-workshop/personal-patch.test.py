import importlib.util, pathlib, tempfile, subprocess, json, datetime, zipfile, unittest, io
from PIL import Image
HERE=pathlib.Path(__file__).parent
spec=importlib.util.spec_from_file_location('builder',HERE/'build-personal-patch.py');builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
NODE=pathlib.Path.home()/'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
class PatchTest(unittest.TestCase):
    def test_snapshots_cutoff_restore_and_catalog_budget(self):
        with tempfile.TemporaryDirectory(dir=HERE) as tmp:
            p=pathlib.Path(tmp); game=p/'game';pic=game/'content/pic/characters';pic.mkdir(parents=True);cat=p/'catalog';f=pic/'test.png'
            images=[]
            for color in ['red','blue','green']:
                b=io.BytesIO();Image.new('RGB',(800,600),color).save(b,'PNG');images.append(b.getvalue())
            script="const fs=require('fs'),t=require(process.argv[1]).create(process.argv[2],process.argv[3]); const f=process.argv[4]; const b=Buffer.from(process.argv[5],'base64');fs.writeFileSync(f,b);t.record({id:process.argv[6],created:process.argv[7],files:[{path:'characters/test.png',before:null,after:require(process.argv[1]).hash(b)}]},process.argv[8]);"
            import base64
            def record(b,id,date,op='replace'):
                subprocess.run([str(NODE),'-e',script,str(HERE/'personal-patch.cjs'),str(game),str(cat),str(f),base64.b64encode(b).decode(),id,date,op],check=True,capture_output=True)
            record(images[0],'one','2026-10-08T00:00:00Z');record(images[1],'two','2026-10-08T01:00:00Z')
            root=cat/'image_work/personal-patch';out=p/'cutoff.zip'
            m=builder.build(root,out,'2026-10-08T09:30:00+09:00')
            with zipfile.ZipFile(out) as z:
                self.assertEqual(z.read('game/content/pic/characters/test.png'),images[0]);self.assertIn('catalog/index.html',z.namelist());self.assertLessEqual(m['thumbnailBytes'],12*1024*1024)
            record(images[2],'restore','2026-10-08T02:00:00Z','restore')
            with self.assertRaises(ValueError):builder.build(root,p/'restored.zip','2026-10-08T12:00:00+09:00')
            with self.assertRaises(FileExistsError):builder.build(root,out,'2026-10-08T09:30:00+09:00')
            self.assertTrue(out.exists())
            self.assertEqual(len(list((root/'objects').iterdir())),3)
    def test_bad_cutoff_requires_timezone(self):
        with self.assertRaises(ValueError):builder.stamp('2026-10-08T12:00:00')
    def test_case_distinct_archive_paths(self):
        with tempfile.TemporaryDirectory(dir=HERE) as tmp:
            p=pathlib.Path(tmp);(p/'objects').mkdir();b=io.BytesIO();Image.new('RGB',(10,10),'red').save(b,'PNG');data=b.getvalue();h=builder.digest(data);(p/'objects'/h).write_bytes(data)
            events=[{'key':name,'created':'2026-10-08T00:00:00Z','createdKST':'2026-10-08 09:00','operation':'replace','files':[{'path':'characters/'+name+'.png','after':h,'bytes':len(data)}]} for name in ('Sultan','sultan')]
            (p/'events.jsonl').write_text('\n'.join(json.dumps(e) for e in events),'utf-8')
            m=builder.build(p,p/'out.zip','2026-10-08T12:00:00+09:00');self.assertEqual(m['count'],2)
            with zipfile.ZipFile(p/'out.zip') as z:
                self.assertIn('game/content/pic/characters/Sultan.png',z.namelist());self.assertIn('game/content/pic/characters/sultan.png',z.namelist())
if __name__=='__main__':unittest.main()
