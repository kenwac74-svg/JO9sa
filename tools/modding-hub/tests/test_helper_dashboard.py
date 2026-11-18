import concurrent.futures, importlib.util, io, json, socket, struct, sys, tempfile, threading, time, types, unittest, zlib
from pathlib import Path
from unittest.mock import patch
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent))
sys.path.insert(0,str(HERE))
import helper_dashboard as hd


class SourceTests(unittest.TestCase):
    def packaged(self, folder, html=b'<html>sample</html>'):
        payload=zlib.compress(html)
        name=b'static\\index.html\0'
        toc=struct.pack('!iIIIBc',18+len(name),0,len(payload),len(html),1,b'b')+name
        cookie=struct.pack('!8sIIII64s',b'MEI\x0c\x0b\x0a\x0b\x0e',len(payload)+len(toc)+88,len(payload),len(toc),314,b'python314.dll')
        file=Path(folder)/'JO9_Helper.exe';file.write_bytes(b'MZtest'+payload+toc+cookie);return file
    def test_resource_is_read_without_execution_and_keeps_original(self):
        with tempfile.TemporaryDirectory() as tmp:
            file=self.packaged(tmp);before=file.read_bytes()
            self.assertEqual(hd.extract_dashboard(file),b'<html>sample</html>')
            self.assertEqual(file.read_bytes(),before)
    def test_invalid_archive_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            file=Path(tmp)/'bad.exe';file.write_bytes(b'MZinvalid')
            with self.assertRaises(ValueError):hd.extract_dashboard(file)
    def test_game_image_traversal_never_starts_helper(self):
        manager=hd.HelperDashboard(lambda:Path('unused'),Path('unused'))
        with patch.object(manager,'ensure') as start:
            for query in ['path=../../save/test.sav','path=C%3A%5CWindows%5Ca','path=%00']:
                with self.assertRaises(ValueError):manager.fetch('/api/game-img',query)
            start.assert_not_called()
    def test_unrelated_api_is_not_forwarded(self):
        manager=hd.HelperDashboard(lambda:Path('unused'),Path('unused'))
        with patch.object(manager,'ensure') as start:
            for route in ['/api/shutdown','/api/open-topmost','/api/char/1']:
                with self.assertRaises(ValueError):manager.fetch(route)
            start.assert_not_called()


class RuntimeTests(unittest.TestCase):
    def test_one_lazy_server_and_original_cli_flags_under_concurrent_open(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)/'game';root.mkdir();(root/'jack.qsp').write_bytes(b'untouched');exe=Path(tmp)/'JO9_Helper.exe';exe.write_bytes(b'MZ')
            manager=hd.HelperDashboard(lambda:root,Path(tmp)/'runtime',exe)
            events=[]
            process=types.SimpleNamespace(pid=77,poll=lambda:None,terminate=lambda:None,resume=lambda:events.append('resume'),close=lambda:None)
            job=types.SimpleNamespace(assign=lambda p:events.append('assign'),process_ids=lambda:{77},close=lambda:None)
            class Response(io.BytesIO):
                pass
            payload=json.dumps({'ok':True,'port':54321,'api_version':1}).encode()
            with patch.object(hd,'WindowsOwnedJob',return_value=job),patch.object(hd,'free_port',return_value=54321),patch.object(hd,'owned_listener_ports',return_value={54321}),patch.object(hd,'SuspendedHelperProcess',return_value=process) as launch,patch.object(manager,'_get',return_value=(200,'application/json',payload)),patch.object(manager,'_disable_idle_exit') as lifetime:
                with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:self.assertEqual(list(pool.map(lambda _:manager.ensure(),range(5))),[54321]*5)
                self.assertEqual(launch.call_count,1)
                self.assertEqual(events,['assign','resume'])
                lifetime.assert_called_once_with(54321)
                args=launch.call_args.args[0]
                self.assertEqual(args,[str(exe.resolve()),'--game-dir',str(root.resolve()),'--port','54321','--no-overlay','--no-tray','--no-browser'])
                self.assertEqual((root/'jack.qsp').read_bytes(),b'untouched')
                state=json.loads((Path(tmp)/'runtime/helper-dashboard.json').read_text('utf8'));self.assertEqual(state['port'],54321)
                manager.close()
    def test_failed_start_closes_only_owned_child(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)/'game';root.mkdir();(root/'jack.qsp').write_bytes(b'qsp');exe=Path(tmp)/'JO9_Helper.exe';exe.write_bytes(b'MZ')
            manager=hd.HelperDashboard(lambda:root,Path(tmp)/'runtime',exe)
            job=unittest.mock.Mock();process=unittest.mock.Mock();process.poll.return_value=1
            with patch.object(hd,'WindowsOwnedJob',return_value=job),patch.object(hd,'free_port',return_value=54322),patch.object(hd,'SuspendedHelperProcess',return_value=process):
                with self.assertRaises(RuntimeError):manager.ensure()
                job.close.assert_called_once();process.terminate.assert_not_called();self.assertIsNone(manager.process)

if __name__=='__main__':unittest.main()
