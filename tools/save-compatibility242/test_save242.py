import importlib.util, json, pathlib, tempfile, unittest, sys, io, contextlib
from unittest import mock

HERE=pathlib.Path(__file__).parent
spec=importlib.util.spec_from_file_location('save242',HERE/'save242.py') if (HERE/'save242.py').exists() else None
M=importlib.util.module_from_spec(spec) if spec else None
if M: spec.loader.exec_module(M)

def shift(s,delta):
    b=s.encode('utf-16-le','surrogatepass'); nums=[(int.from_bytes(b[i:i+2],'little')+delta)&65535 for i in range(0,len(b),2)]
    return b''.join(x.to_bytes(2,'little') for x in nums).decode('utf-16-le','surrogatepass')

def fixture(name='OldDefault',ident=1448,location='main_screen'):
    vals=[('SLAVE_TYPE',[['1448' if ident==1448 else str(ident),'']],[]),('SLAVE_NAME',[['0',name]],[]),('SLAVE',[['77',''],['5',''],['0','girls/full/old'],['0',name]],[[0,'ID'],[1,'STAMINA'],[2,'FULLIMAGE'],[3,'NAME']]),('SPARKS',[['987654','']],[]),('PRIVATE_NOTE',[['0','Keep this exact text 🦊']],[]),('CODE_REV',[['0','2.4.1']],[])]
    h=['QSPSAVEDGAME','5.7.0']+[shift(x,-5) for x in ['123456','99','-1','-1','','content/pic/buttons/a.png','<img src="content\\pic\\buttons\\a.png">','','main_screen','1','1','1','1','500','0','0','0','0']]
    h[10]=shift(location,-5);h[7]=shift('content/pic/buttons/a.png',-5)
    h.append(shift(str(len(vals)),-5))
    for i,(key,pairs,idx) in enumerate(vals):
        h.extend(shift(str(x),-5) for x in [i,key,len(pairs)])
        for pair in pairs:h.extend(shift(x,-5) for x in pair)
        h.append(shift(str(len(idx)),-5))
        for n,k in idx:h.extend([shift(str(n),-5),shift(k,-5)])
    return ('\r\n'.join(h)+'\r\n').encode('utf-16-le','surrogatepass')

RULES={'schema':1,'version':'2.4.2','paths':[{'old':'content/pic/buttons/a.png','new':'content/pic/ui/buttons/a.png'}],'actors':{'1448':{'old_names':['OldDefault'],'new_name':'시루','fields':{'FULLIMAGE':[{'old':'girls/full/old','new':'girls/full/new'}]}}}}

@unittest.skipIf(M is None,'Backend pending')
class Migration(unittest.TestCase):
    def test_lossless_raw_roundtrip(self):
        raw=fixture(); self.assertEqual(M.serialize_save(M.parse_save(raw)),raw)
    def test_only_exact_id_old_default_names_change(self):
        out,r=M.migrate(fixture(),RULES);d=M.parse_save(out);self.assertEqual(M.value(d,'SLAVE_NAME')[1],'시루');self.assertEqual(M.value(d,'SLAVE','NAME')[1],'시루')
    def test_user_name_preserved(self):
        d=M.parse_save(M.migrate(fixture('My own name'),RULES)[0]);self.assertEqual(M.value(d,'SLAVE_NAME')[1],'My own name')
    def test_wrong_character_id_preserved(self):
        d=M.parse_save(M.migrate(fixture(ident=9999),RULES)[0]);self.assertEqual(M.value(d,'SLAVE_NAME')[1],'OldDefault')
    def test_numbers_keys_and_unknown_strings_unchanged(self):
        raw=fixture();old=M.parse_save(raw);new=M.parse_save(M.migrate(raw,RULES)[0]);
        self.assertEqual([(v['name'],v['slot'],v['idx'],[p[0] for p in v['values']]) for v in old['vars']],[(v['name'],v['slot'],v['idx'],[p[0] for p in v['values']]) for v in new['vars']]);self.assertEqual(M.value(new,'PRIVATE_NOTE'),M.value(old,'PRIVATE_NOTE'))
    def test_allowlisted_header_and_actor_image_updated(self):
        old=M.parse_save(fixture());new=M.parse_save(M.migrate(fixture(),RULES)[0]);self.assertIn('content\\pic\\ui\\buttons\\a.png',M.decode(new['lines'][8]));self.assertEqual(M.value(new,'SLAVE','FULLIMAGE')[1],'girls/full/new');self.assertEqual(new['lines'][7],old['lines'][7])
    def test_crc_preserved_not_bypassed(self):
        old=M.parse_save(fixture());new=M.parse_save(M.migrate(fixture(),RULES)[0]);self.assertEqual(new['lines'][2],old['lines'][2])
    def test_duplicate_legacy_helpers_preserved(self):
        d=M.parse_save(fixture());d['vars'] += [{'slot':11822,'name':'ARRAY_APPEND','values':[['0','code']],'idx':[]},{'slot':11824,'name':'ARRAY_APPEND','values':[['0','code']],'idx':[]}]
        raw=M.serialize_save(d);self.assertEqual(M.serialize_save(M.parse_save(raw)),raw);self.assertEqual(M.migrate(raw,{'paths':[],'actors':{}})[0],raw)
    def test_repeat_is_byte_identical(self):
        one,_=M.migrate(fixture(),RULES);two,r=M.migrate(one,RULES);self.assertEqual(one,two);self.assertEqual(r['change_count'],0)
    def test_combat_save_rejected(self):
        with self.assertRaises(ValueError):M.migrate(fixture(location='боевой_интерфейс'),RULES)
    def test_unsupported_and_truncated_rejected(self):
        with self.assertRaises(ValueError):M.parse_save(fixture()[:-12])
        with self.assertRaises(ValueError):M.parse_save(b'not a save')
    def test_original_and_existing_output_never_overwritten(self):
        with tempfile.TemporaryDirectory() as t:
            src=pathlib.Path(t)/'old.sav';out=pathlib.Path(t)/'new.sav';src.write_bytes(fixture());raw=src.read_bytes();M.convert_file(src,out,RULES);self.assertEqual(src.read_bytes(),raw)
            with self.assertRaises(ValueError):M.convert_file(src,src,RULES)
            with self.assertRaises((ValueError,FileExistsError)):M.convert_file(src,out,RULES)
    def test_conflicting_rules_fail_without_output(self):
        broken=json.loads(json.dumps(RULES));broken['paths'].append({'old':'content/pic/buttons/a.png','new':'content/pic/ui/other.png'})
        with self.assertRaises(ValueError):M.migrate(fixture(),broken)
    def test_cli_report_cannot_replace_input_output_rules_or_existing_file(self):
        for collision in ['input','output','rules','existing']:
            with self.subTest(collision=collision),tempfile.TemporaryDirectory() as t:
                root=pathlib.Path(t);src=root/'old.sav';out=root/'new.sav';rules=root/'rules.json';existing=root/'report.json'
                src.write_bytes(fixture());rules.write_text(json.dumps(RULES));existing.write_bytes(b'KEEP REPORT')
                report={'input':src,'output':out,'rules':rules,'existing':existing}[collision]
                before={p:p.read_bytes() for p in [src,rules,existing]}
                argv=['save242','--input',str(src),'--output',str(out),'--rules',str(rules),'--report',str(report)]
                with mock.patch.object(sys,'argv',argv),contextlib.redirect_stderr(io.StringIO()),contextlib.redirect_stdout(io.StringIO()):code=M.main()
                self.assertEqual(code,2)
                for p,b in before.items():self.assertEqual(p.read_bytes(),b)
                self.assertFalse(out.exists())
    def test_cli_error_report_cannot_overwrite_invalid_input(self):
        with tempfile.TemporaryDirectory() as t:
            p=pathlib.Path(t)/'broken.sav';p.write_bytes(b'KEEP INVALID SAVE')
            with mock.patch.object(sys,'argv',['save242','--input',str(p),'--report',str(p)]),contextlib.redirect_stderr(io.StringIO()):self.assertEqual(M.main(),2)
            self.assertEqual(p.read_bytes(),b'KEEP INVALID SAVE')
    def test_cli_new_report_created_without_touching_source(self):
        with tempfile.TemporaryDirectory() as t:
            root=pathlib.Path(t);src=root/'old.sav';out=root/'new.sav';rules=root/'rules.json';report=root/'report.json';src.write_bytes(fixture());rules.write_text(json.dumps(RULES));raw=src.read_bytes()
            with mock.patch.object(sys,'argv',['save242','--input',str(src),'--output',str(out),'--rules',str(rules),'--report',str(report)]),contextlib.redirect_stdout(io.StringIO()):self.assertEqual(M.main(),0)
            self.assertEqual(src.read_bytes(),raw);self.assertTrue(out.exists());self.assertGreater(json.loads(report.read_text('utf-8'))['change_count'],0)

class BackendExists(unittest.TestCase):
    def test_backend_exists(self):self.assertIsNotNone(M,'Save migration backend has not been implemented')

if __name__=='__main__':unittest.main(verbosity=2)
