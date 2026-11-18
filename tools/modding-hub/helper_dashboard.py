"""Read-only web adapter for the user's original JO9 Helper executable."""
from __future__ import annotations
import atexit, ctypes, http.client, json, os, socket, struct, subprocess, threading, time, zlib
from pathlib import Path
from urllib.parse import parse_qs, urlencode


def extract_dashboard(executable: Path) -> bytes:
    """Read the packaged HTML resource without executing or unpacking the EXE."""
    data = executable.read_bytes()
    cookie = data.rfind(b'MEI\x0c\x0b\x0a\x0b\x0e')
    if cookie < 0 or cookie + 88 > len(data):
        raise ValueError('Helper의 웹 화면을 읽지 못했습니다. 지원되는 원본 EXE를 확인하세요.')
    _, size, toc_offset, toc_size, _, _ = struct.unpack('!8sIIII64s', data[cookie:cookie + 88])
    start = cookie + 88 - size
    if start < 0 or toc_offset + toc_size > size - 88:
        raise ValueError('Helper 리소스 경계가 잘못되었습니다.')
    toc = data[start + toc_offset:start + toc_offset + toc_size]
    offset = 0
    while offset < len(toc):
        if len(toc) - offset < 18:
            raise ValueError('Helper 리소스 목록이 손상됐습니다.')
        length, position, packed, unpacked, compressed, _ = struct.unpack('!iIIIBc', toc[offset:offset + 18])
        if length < 18 or offset + length > len(toc):
            raise ValueError('Helper 리소스 항목이 손상됐습니다.')
        name = toc[offset + 18:offset + length].rstrip(b'\0').decode('utf-8')
        offset += length
        if name.replace('\\', '/') != 'static/index.html':
            continue
        if unpacked > 2_000_000 or position + packed > toc_offset:
            raise ValueError('Helper 웹 화면 리소스 크기가 잘못되었습니다.')
        payload = data[start + position:start + position + packed]
        if compressed:
            decoder = zlib.decompressobj()
            payload = decoder.decompress(payload, unpacked + 1)
            if not decoder.eof or decoder.unconsumed_tail:
                raise ValueError('Helper 웹 화면 압축을 읽지 못했습니다.')
        if len(payload) != unpacked:
            raise ValueError('Helper 웹 화면 리소스가 손상됐습니다.')
        return payload
    raise ValueError('Helper에 웹 대시보드가 없습니다.')


class WindowsOwnedJob:
    """A private child job: force-closing the hub also closes its own Helper."""
    def __init__(self):
        if os.name != 'nt':
            raise RuntimeError('JO9 Helper EXE는 Windows에서 실행합니다.')
        from ctypes import wintypes as w
        class Basic(ctypes.Structure):
            _fields_ = [('process_time', ctypes.c_int64), ('job_time', ctypes.c_int64),
                        ('flags', w.DWORD), ('min_ws', ctypes.c_size_t), ('max_ws', ctypes.c_size_t),
                        ('active', w.DWORD), ('affinity', ctypes.c_size_t), ('priority', w.DWORD), ('scheduling', w.DWORD)]
        class Counters(ctypes.Structure):
            _fields_ = [(name, ctypes.c_uint64) for name in ('read_ops', 'write_ops', 'other_ops', 'read_bytes', 'write_bytes', 'other_bytes')]
        class Limits(ctypes.Structure):
            _fields_ = [('basic', Basic), ('io', Counters), ('process_mem', ctypes.c_size_t),
                        ('job_mem', ctypes.c_size_t), ('peak_process', ctypes.c_size_t), ('peak_job', ctypes.c_size_t)]
        self.api = ctypes.WinDLL('kernel32', use_last_error=True)
        self.api.CreateJobObjectW.argtypes = [ctypes.c_void_p, w.LPCWSTR]
        self.api.CreateJobObjectW.restype = w.HANDLE
        self.api.SetInformationJobObject.argtypes = [w.HANDLE, ctypes.c_int, ctypes.c_void_p, w.DWORD]
        self.api.AssignProcessToJobObject.argtypes = [w.HANDLE, w.HANDLE]
        self.api.QueryInformationJobObject.argtypes = [w.HANDLE, ctypes.c_int, ctypes.c_void_p, w.DWORD, ctypes.c_void_p]
        self.api.CloseHandle.argtypes = [w.HANDLE]
        self.handle = self.api.CreateJobObjectW(None, None)
        if not self.handle:
            raise ctypes.WinError(ctypes.get_last_error())
        limits = Limits()
        limits.basic.flags = 0x2000  # JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
        if not self.api.SetInformationJobObject(self.handle, 9, ctypes.byref(limits), ctypes.sizeof(limits)):
            error = ctypes.WinError(ctypes.get_last_error())
            self.close()
            raise error

    def assign(self, process):
        if not self.api.AssignProcessToJobObject(self.handle, int(process._handle)):
            raise ctypes.WinError(ctypes.get_last_error())

    def process_ids(self):
        buffer = ctypes.create_string_buffer(8 + ctypes.sizeof(ctypes.c_size_t) * 128)
        if not self.api.QueryInformationJobObject(self.handle, 3, buffer, len(buffer), None):
            raise ctypes.WinError(ctypes.get_last_error())
        count = struct.unpack_from('II', buffer.raw)[1]
        return {ctypes.c_size_t.from_buffer(buffer, 8 + i * ctypes.sizeof(ctypes.c_size_t)).value for i in range(min(count, 128))}

    def close(self):
        if self.handle:
            self.api.CloseHandle(self.handle)
            self.handle = None


class SuspendedHelperProcess:
    """Keep CreateProcess's primary thread handle until the private job owns it.

    Microsoft documents CREATE_SUSPENDED as the one-time initialization barrier:
    https://learn.microsoft.com/windows/win32/procthread/suspending-thread-execution
    """
    def __init__(self, args, cwd):
        import _winapi
        self.api = _winapi
        startup = subprocess.STARTUPINFO()
        startup.dwFlags = subprocess.STARTF_USESHOWWINDOW
        startup.wShowWindow = 0
        self._handle, self.thread, self.pid, _ = _winapi.CreateProcess(
            args[0], subprocess.list2cmdline(args), None, None, False,
            subprocess.CREATE_NO_WINDOW | 0x4, None, cwd, startup)

    def poll(self):
        if self.api.WaitForSingleObject(self._handle, 0) == self.api.WAIT_OBJECT_0:
            return self.api.GetExitCodeProcess(self._handle)
        return None

    def resume(self):
        from ctypes import wintypes as w
        resume = ctypes.WinDLL('kernel32', use_last_error=True).ResumeThread
        resume.argtypes, resume.restype = [w.HANDLE], w.DWORD
        if resume(self.thread) == 0xffffffff:
            raise ctypes.WinError(ctypes.get_last_error())
        self.api.CloseHandle(self.thread)
        self.thread = None

    def terminate(self):
        if self.poll() is None:
            self.api.TerminateProcess(self._handle, 1)

    def close(self):
        for name in ('thread', '_handle'):
            handle = getattr(self, name, None)
            if handle is not None:
                self.api.CloseHandle(handle)
                setattr(self, name, None)


def owned_listener_ports(process_ids: set[int]) -> set[int]:
    """Find only loopback IPv4 listeners belonging to the private job."""
    size = ctypes.c_ulong(0)
    api = ctypes.WinDLL('iphlpapi', use_last_error=True)
    query = api.GetExtendedTcpTable
    query.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_ulong), ctypes.c_bool, ctypes.c_ulong, ctypes.c_int, ctypes.c_ulong]
    query(None, ctypes.byref(size), False, socket.AF_INET, 3, 0)
    for _ in range(3):
        buffer = ctypes.create_string_buffer(size.value)
        result = query(buffer, ctypes.byref(size), False, socket.AF_INET, 3, 0)
        if result == 122:
            continue
        if result:
            raise OSError(result, 'Helper 수신 포트를 확인하지 못했습니다.')
        count = struct.unpack_from('I', buffer.raw)[0]
        ports = set()
        for i in range(count):
            state, address, port, _, _, pid = struct.unpack_from('6I', buffer.raw, 4 + i * 24)
            if state == 2 and pid in process_ids and socket.inet_ntoa(struct.pack('<I', address)) == '127.0.0.1':
                ports.add(socket.ntohs(port & 0xffff))
        return ports
    raise OSError('Helper 수신 포트 목록이 계속 변경되고 있습니다.')


def free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        if hasattr(socket, 'SO_EXCLUSIVEADDRUSE'):
            probe.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        probe.bind(('127.0.0.1', 0))
        return probe.getsockname()[1]


class HelperDashboard:
    def __init__(self, game_root, runtime: Path, executable=None):
        self.game_root = game_root
        self.runtime = Path(runtime)
        self.explicit_executable = executable or os.environ.get('JO9_HELPER_EXE')
        self.lock = threading.RLock()
        self.state_lock = threading.Lock()
        self.process = self.job = self.root = self.executable = None
        self.port = None
        self.last_ready_check = 0
        self.html_cache = None
        atexit.register(self.close)

    def _get(self, port, target, timeout=30):
        connection = http.client.HTTPConnection('127.0.0.1', port, timeout=timeout)
        try:
            connection.request('GET', target, headers={'Connection': 'close'})
            response = connection.getresponse()
            body = response.read(32_000_001)
            if len(body) > 32_000_000:
                raise ValueError('Helper 응답 크기가 너무 큽니다.')
            return response.status, response.getheader('Content-Type', 'application/octet-stream'), body
        finally:
            connection.close()

    def _disable_idle_exit(self, port):
        # The private job owns lifetime; the standalone app's close timer must not.
        connection = http.client.HTTPConnection('127.0.0.1', port, timeout=3)
        try:
            body = json.dumps({'auto_exit_on_close': False})
            connection.request('POST', '/api/settings', body=body,
                               headers={'Content-Type': 'application/json', 'Connection': 'close'})
            response = connection.getresponse()
            result = json.loads(response.read(65536))
            if response.status != 200 or result.get('auto_exit_on_close') is not False:
                raise RuntimeError('Helper 전용 서버의 수명을 작업실에 연결하지 못했습니다.')
        finally:
            connection.close()

    def source(self):
        root = Path(self.game_root()).resolve()
        if not (root / 'jack.qsp').is_file():
            raise ValueError('현재 WORK 게임 폴더를 찾지 못했습니다.')
        candidates = [Path(self.explicit_executable)] if self.explicit_executable else [root.parent / 'JO9_Helper_v1.0.0' / 'JO9_Helper.exe', root.parent / 'JO9_Helper.exe']
        executable = next((p.resolve() for p in candidates if p.is_file()), None)
        if not executable:
            raise FileNotFoundError('JO9_Helper.exe를 찾지 못했습니다. 게임 상위 폴더 또는 JO9_Helper_v1.0.0 폴더에 두세요.')
        return root, executable

    def dashboard(self):
        from helper_dashboard_html import adapt_html
        with self.lock:
            _, executable = self.source()
            stat = executable.stat()
            key = (str(executable), stat.st_mtime_ns, stat.st_size)
            if not self.html_cache or self.html_cache[0] != key:
                self.html_cache = (key, adapt_html(extract_dashboard(executable)))
            return self.html_cache[1]

    def ensure(self):
        with self.lock:
            root, executable = self.source()
            if self.process and self.process.poll() is None and self.root == root and self.executable == executable and self.port:
                now = time.monotonic()
                if now - self.last_ready_check < 2:
                    return self.port
                if self.port in owned_listener_ports(self.job.process_ids()):
                    self.last_ready_check = now
                    return self.port
            self.close()
            port = free_port()
            job = WindowsOwnedJob()
            process = None
            try:
                process = SuspendedHelperProcess([str(executable), '--game-dir', str(root), '--port', str(port), '--no-overlay', '--no-tray', '--no-browser'], cwd=str(executable.parent))
                job.assign(process)
                process.resume()
                deadline = time.monotonic() + 25
                while time.monotonic() < deadline:
                    if process.poll() is not None:
                        raise RuntimeError('Helper 분석 서버가 종료됐습니다. 원본 EXE와 게임 경로를 확인하세요.')
                    ports = owned_listener_ports(job.process_ids())
                    for ready_port in sorted(ports):
                        if not port <= ready_port <= port + 10:
                            continue
                        try:
                            status, _, payload = self._get(ready_port, '/api/health', timeout=1)
                            health = json.loads(payload)
                            if status != 200:
                                continue
                            if health.get('ok') is not True or health.get('port') != ready_port:
                                continue
                        except (OSError, ValueError):
                            continue
                        self._disable_idle_exit(ready_port)
                        self.process, self.job = process, job
                        self.root, self.executable, self.port = root, executable, ready_port
                        self.last_ready_check = time.monotonic()
                        self.runtime.mkdir(parents=True, exist_ok=True)
                        (self.runtime / 'helper-dashboard.json').write_text(json.dumps({'ownerHubPid': os.getpid(), 'pid': process.pid, 'port': ready_port, 'game': str(root), 'executable': str(executable), 'apiVersion': health.get('api_version'), 'privateIdleExitDisabled': True}, ensure_ascii=False, indent=2), 'utf-8')
                        return ready_port
                    time.sleep(.1)
                raise TimeoutError('Helper 분석 서버의 준비 시간이 초과됐습니다. 웹 대시보드를 다시 열어 주세요.')
            except BaseException:
                job.close()
                if process and process.poll() is None:
                    process.terminate()
                if process:
                    process.close()
                raise

    def fetch(self, route: str, query: str = ''):
        if route not in ('/api/state', '/api/game-img'):
            raise ValueError('지원하지 않는 Helper 웹 요청입니다.')
        params = parse_qs(query)
        key = 'sav' if route == '/api/state' else 'path'
        value = params.get(key, [''])[0]
        if route == '/api/game-img':
            candidate = value.replace('\\', '/').split('?', 1)[0]
            if '\0' in value or ':' in candidate or '..' in candidate.split('/'):
                raise ValueError('게임 이미지 상대 경로를 확인하세요.')
        port = self.ensure()
        target = route + ('?' + urlencode({key: value}) if value else '')
        if route == '/api/state':
            # Original parsing caches by file mtime; serialize cold reads across tabs.
            with self.state_lock:
                return self._get(port, target, timeout=90)
        return self._get(port, target)

    def close(self):
        with self.lock:
            if self.job:
                self.job.close()
            if self.process:
                self.process.close()
            self.process = self.job = self.root = self.executable = self.port = None
