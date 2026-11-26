var fsp = require('fs/promises');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fsp__default = /*#__PURE__*/_interopDefaultLegacy(fsp);

var createQspModule = (() => {
  var _scriptDir = (typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('wasm-engine.cjs', document.baseURI).href));
  return function (createQspModule) {
    createQspModule = createQspModule || {};
    var Module = typeof createQspModule != 'undefined' ? createQspModule : {};
    var readyPromiseResolve, readyPromiseReject;
    Module['ready'] = new Promise(function (resolve, reject) {
      readyPromiseResolve = resolve;
      readyPromiseReject = reject;
    });
    var moduleOverrides = Object.assign({}, Module);
    var thisProgram = './this.program';

    var quit_ = (status, toThrow) => {
      throw toThrow;
    };

    var ENVIRONMENT_IS_WEB = typeof window == 'object';
    var ENVIRONMENT_IS_WORKER = typeof importScripts == 'function';
    typeof process == 'object' && typeof process.versions == 'object' && typeof process.versions.node == 'string';
    var scriptDirectory = '';

    function locateFile(path) {
      if (Module['locateFile']) {
        return Module['locateFile'](path, scriptDirectory);
      }

      return scriptDirectory + path;
    }

    var readAsync, readBinary;

    if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
      if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = self.location.href;
      } else if (typeof document != 'undefined' && document.currentScript) {
        scriptDirectory = document.currentScript.src;
      }

      if (_scriptDir) {
        scriptDirectory = _scriptDir;
      }

      if (scriptDirectory.indexOf('blob:') !== 0) {
        scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, '').lastIndexOf('/') + 1);
      } else {
        scriptDirectory = '';
      }

      {

        if (ENVIRONMENT_IS_WORKER) {
          readBinary = url => {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            xhr.responseType = 'arraybuffer';
            xhr.send(null);
            return new Uint8Array(xhr.response);
          };
        }

        readAsync = (url, onload, onerror) => {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.responseType = 'arraybuffer';

          xhr.onload = () => {
            if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
              onload(xhr.response);
              return;
            }

            onerror();
          };

          xhr.onerror = onerror;
          xhr.send(null);
        };
      }
    }

    Module['print'] || console.log.bind(console);
    var err = Module['printErr'] || console.warn.bind(console);
    Object.assign(Module, moduleOverrides);
    moduleOverrides = null;
    if (Module['thisProgram']) thisProgram = Module['thisProgram'];
    if (Module['quit']) quit_ = Module['quit'];
    var wasmBinary;
    if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];

    if (typeof WebAssembly != 'object') {
      abort('no native wasm support detected');
    }

    var wasmMemory;
    var ABORT = false;
    var EXITSTATUS;

    function assert(condition, text) {
      if (!condition) {
        abort(text);
      }
    }

    typeof TextDecoder != 'undefined' ? new TextDecoder('utf8') : undefined;

    var buffer, HEAP8, HEAPU8, HEAP32, HEAPU32;

    function updateGlobalBufferAndViews(buf) {
      buffer = buf;
      Module['HEAP8'] = HEAP8 = new Int8Array(buf);
      Module['HEAP16'] = new Int16Array(buf);
      Module['HEAP32'] = HEAP32 = new Int32Array(buf);
      Module['HEAPU8'] = HEAPU8 = new Uint8Array(buf);
      Module['HEAPU16'] = new Uint16Array(buf);
      Module['HEAPU32'] = HEAPU32 = new Uint32Array(buf);
      Module['HEAPF32'] = new Float32Array(buf);
      Module['HEAPF64'] = new Float64Array(buf);
    }
    var wasmTable;

    function writeStackCookie() {
      var max = _emscripten_stack_get_end();

      HEAPU32[max >> 2] = 34821223;
      HEAPU32[max + 4 >> 2] = 2310721022;
      HEAPU32[0] = 1668509029;
    }

    function checkStackCookie() {
      if (ABORT) return;

      var max = _emscripten_stack_get_end();

      var cookie1 = HEAPU32[max >> 2];
      var cookie2 = HEAPU32[max + 4 >> 2];

      if (cookie1 != 34821223 || cookie2 != 2310721022) {
        abort('Stack overflow! Stack cookie has been overwritten at 0x' + max.toString(16) + ', expected hex dwords 0x89BACDFE and 0x2135467, but received 0x' + cookie2.toString(16) + ' 0x' + cookie1.toString(16));
      }

      if (HEAPU32[0] !== 1668509029) abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
    }

    var __ATPRERUN__ = [];
    var __ATINIT__ = [];
    var __ATPOSTRUN__ = [];

    function preRun() {
      if (Module['preRun']) {
        if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];

        while (Module['preRun'].length) {
          addOnPreRun(Module['preRun'].shift());
        }
      }

      callRuntimeCallbacks(__ATPRERUN__);
    }

    function initRuntime() {
      checkStackCookie();

      ___set_stack_limits(_emscripten_stack_get_base(), _emscripten_stack_get_end());

      callRuntimeCallbacks(__ATINIT__);
    }

    function postRun() {
      checkStackCookie();

      if (Module['postRun']) {
        if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];

        while (Module['postRun'].length) {
          addOnPostRun(Module['postRun'].shift());
        }
      }

      callRuntimeCallbacks(__ATPOSTRUN__);
    }

    function addOnPreRun(cb) {
      __ATPRERUN__.unshift(cb);
    }

    function addOnInit(cb) {
      __ATINIT__.unshift(cb);
    }

    function addOnPostRun(cb) {
      __ATPOSTRUN__.unshift(cb);
    }

    var runDependencies = 0;
    var dependenciesFulfilled = null;

    function addRunDependency(id) {
      runDependencies++;

      if (Module['monitorRunDependencies']) {
        Module['monitorRunDependencies'](runDependencies);
      }
    }

    function removeRunDependency(id) {
      runDependencies--;

      if (Module['monitorRunDependencies']) {
        Module['monitorRunDependencies'](runDependencies);
      }

      if (runDependencies == 0) {

        if (dependenciesFulfilled) {
          var callback = dependenciesFulfilled;
          dependenciesFulfilled = null;
          callback();
        }
      }
    }

    function abort(what) {
      {
        if (Module['onAbort']) {
          Module['onAbort'](what);
        }
      }
      what = 'Aborted(' + what + ')';
      err(what);
      ABORT = true;
      EXITSTATUS = 1;
      what += '. Build with -sASSERTIONS for more info.';
      var e = new WebAssembly.RuntimeError(what);
      readyPromiseReject(e);
      throw e;
    }

    var dataURIPrefix = 'data:application/octet-stream;base64,';

    function isDataURI(filename) {
      return filename.startsWith(dataURIPrefix);
    }

    function isFileURI(filename) {
      return filename.startsWith('file://');
    }

    var wasmBinaryFile;

    if (Module['locateFile']) {
      wasmBinaryFile = 'qsp-engine.wasm';

      if (!isDataURI(wasmBinaryFile)) {
        wasmBinaryFile = locateFile(wasmBinaryFile);
      }
    } else {
      wasmBinaryFile = new URL('qsp-engine.wasm', (typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('wasm-engine.cjs', document.baseURI).href))).toString();
    }

    function getBinary(file) {
      try {
        if (file == wasmBinaryFile && wasmBinary) {
          return new Uint8Array(wasmBinary);
        }

        if (readBinary) {
          return readBinary(file);
        }

        throw 'both async and sync fetching of the wasm failed';
      } catch (err) {
        abort(err);
      }
    }

    function getBinaryPromise() {
      if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
        if (typeof fetch == 'function' && !isFileURI(wasmBinaryFile)) {
          return fetch(wasmBinaryFile, {
            credentials: 'same-origin'
          }).then(function (response) {
            if (!response['ok']) {
              throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
            }

            return response['arrayBuffer']();
          }).catch(function () {
            return getBinary(wasmBinaryFile);
          });
        } else {
          if (readAsync) {
            return new Promise(function (resolve, reject) {
              readAsync(wasmBinaryFile, function (response) {
                resolve(new Uint8Array(response));
              }, reject);
            });
          }
        }
      }

      return Promise.resolve().then(function () {
        return getBinary(wasmBinaryFile);
      });
    }

    function createWasm() {
      var info = {
        a: asmLibraryArg
      };

      function receiveInstance(instance, module) {
        var exports = instance.exports;
        exports = Asyncify.instrumentWasmExports(exports);
        Module['asm'] = exports;
        wasmMemory = Module['asm']['g'];
        updateGlobalBufferAndViews(wasmMemory.buffer);
        wasmTable = Module['asm']['V'];
        addOnInit(Module['asm']['h']);
        removeRunDependency();
      }

      addRunDependency();

      function receiveInstantiationResult(result) {
        receiveInstance(result['instance']);
      }

      function instantiateArrayBuffer(receiver) {
        return getBinaryPromise().then(function (binary) {
          return WebAssembly.instantiate(binary, info);
        }).then(function (instance) {
          return instance;
        }).then(receiver, function (reason) {
          err('failed to asynchronously prepare wasm: ' + reason);
          abort(reason);
        });
      }

      function instantiateAsync() {
        if (!wasmBinary && typeof WebAssembly.instantiateStreaming == 'function' && !isDataURI(wasmBinaryFile) && !isFileURI(wasmBinaryFile) && typeof fetch == 'function') {
          return fetch(wasmBinaryFile, {
            credentials: 'same-origin'
          }).then(function (response) {
            var result = WebAssembly.instantiateStreaming(response, info);
            return result.then(receiveInstantiationResult, function (reason) {
              err('wasm streaming compile failed: ' + reason);
              err('falling back to ArrayBuffer instantiation');
              return instantiateArrayBuffer(receiveInstantiationResult);
            });
          });
        } else {
          return instantiateArrayBuffer(receiveInstantiationResult);
        }
      }

      if (Module['instantiateWasm']) {
        try {
          var exports = Module['instantiateWasm'](info, receiveInstance);
          exports = Asyncify.instrumentWasmExports(exports);
          return exports;
        } catch (e) {
          err('Module.instantiateWasm callback failed with error: ' + e);
          return false;
        }
      }

      instantiateAsync().catch(readyPromiseReject);
      return {};
    }

    function ExitStatus(status) {
      this.name = 'ExitStatus';
      this.message = 'Program terminated with exit(' + status + ')';
      this.status = status;
    }

    function callRuntimeCallbacks(callbacks) {
      while (callbacks.length > 0) {
        callbacks.shift()(Module);
      }
    }

    function handleException(e) {
      if (e instanceof ExitStatus || e == 'unwind') {
        return EXITSTATUS;
      }

      quit_(1, e);
    }

    function ___handle_stack_overflow(requested) {
      requested = requested >>> 0;
      abort('stack overflow (Attempt to set SP to 0x' + requested.toString(16) + ', with stack limits [0x' + _emscripten_stack_get_end().toString(16) + ' - 0x' + _emscripten_stack_get_base().toString(16) + '])');
    }

    function __emscripten_date_now() {
      return Date.now();
    }

    function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.copyWithin(dest, src, src + num);
    }

    function getHeapMax() {
      return 2147483648;
    }

    function emscripten_realloc_buffer(size) {
      try {
        wasmMemory.grow(size - buffer.byteLength + 65535 >>> 16);
        updateGlobalBufferAndViews(wasmMemory.buffer);
        return 1;
      } catch (e) {}
    }

    function _emscripten_resize_heap(requestedSize) {
      var oldSize = HEAPU8.length;
      requestedSize = requestedSize >>> 0;
      var maxHeapSize = getHeapMax();

      if (requestedSize > maxHeapSize) {
        return false;
      }

      let alignUp = (x, multiple) => x + (multiple - x % multiple) % multiple;

      for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
        var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
        var replacement = emscripten_realloc_buffer(newSize);

        if (replacement) {
          return true;
        }
      }

      return false;
    }

    var ENV = {};

    function getExecutableName() {
      return thisProgram || './this.program';
    }

    function getEnvStrings() {
      if (!getEnvStrings.strings) {
        var lang = (typeof navigator == 'object' && navigator.languages && navigator.languages[0] || 'C').replace('-', '_') + '.UTF-8';
        var env = {
          USER: 'web_user',
          LOGNAME: 'web_user',
          PATH: '/',
          PWD: '/',
          HOME: '/home/web_user',
          LANG: lang,
          _: getExecutableName()
        };

        for (var x in ENV) {
          if (ENV[x] === undefined) delete env[x];else env[x] = ENV[x];
        }

        var strings = [];

        for (var x in env) {
          strings.push(x + '=' + env[x]);
        }

        getEnvStrings.strings = strings;
      }

      return getEnvStrings.strings;
    }

    function writeAsciiToMemory(str, buffer, dontAddNull) {
      for (var i = 0; i < str.length; ++i) {
        HEAP8[buffer++ >> 0] = str.charCodeAt(i);
      }

      if (!dontAddNull) HEAP8[buffer >> 0] = 0;
    }

    function _environ_get(__environ, environ_buf) {
      var bufSize = 0;
      getEnvStrings().forEach(function (string, i) {
        var ptr = environ_buf + bufSize;
        HEAPU32[__environ + i * 4 >> 2] = ptr;
        writeAsciiToMemory(string, ptr);
        bufSize += string.length + 1;
      });
      return 0;
    }

    function _environ_sizes_get(penviron_count, penviron_buf_size) {
      var strings = getEnvStrings();
      HEAPU32[penviron_count >> 2] = strings.length;
      var bufSize = 0;
      strings.forEach(function (string) {
        bufSize += string.length + 1;
      });
      HEAPU32[penviron_buf_size >> 2] = bufSize;
      return 0;
    }

    function uleb128Encode(n, target) {
      if (n < 128) {
        target.push(n);
      } else {
        target.push(n % 128 | 128, n >> 7);
      }
    }

    function sigToWasmTypes(sig) {
      var typeNames = {
        i: 'i32',
        j: 'i64',
        f: 'f32',
        d: 'f64',
        p: 'i32'
      };
      var type = {
        parameters: [],
        results: sig[0] == 'v' ? [] : [typeNames[sig[0]]]
      };

      for (var i = 1; i < sig.length; ++i) {
        type.parameters.push(typeNames[sig[i]]);
      }

      return type;
    }

    function convertJsFunctionToWasm(func, sig) {
      if (typeof WebAssembly.Function == 'function') {
        return new WebAssembly.Function(sigToWasmTypes(sig), func);
      }

      var typeSectionBody = [1, 96];
      var sigRet = sig.slice(0, 1);
      var sigParam = sig.slice(1);
      var typeCodes = {
        i: 127,
        p: 127,
        j: 126,
        f: 125,
        d: 124
      };
      uleb128Encode(sigParam.length, typeSectionBody);

      for (var i = 0; i < sigParam.length; ++i) {
        typeSectionBody.push(typeCodes[sigParam[i]]);
      }

      if (sigRet == 'v') {
        typeSectionBody.push(0);
      } else {
        typeSectionBody.push(1, typeCodes[sigRet]);
      }

      var bytes = [0, 97, 115, 109, 1, 0, 0, 0, 1];
      uleb128Encode(typeSectionBody.length, bytes);
      bytes.push.apply(bytes, typeSectionBody);
      bytes.push(2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0);
      var module = new WebAssembly.Module(new Uint8Array(bytes));
      var instance = new WebAssembly.Instance(module, {
        e: {
          f: func
        }
      });
      var wrappedFunc = instance.exports['f'];
      return wrappedFunc;
    }

    var wasmTableMirror = [];

    function getWasmTableEntry(funcPtr) {
      var func = wasmTableMirror[funcPtr];

      if (!func) {
        if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
        wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
      }

      return func;
    }

    function updateTableMap(offset, count) {
      if (functionsInTableMap) {
        for (var i = offset; i < offset + count; i++) {
          var item = getWasmTableEntry(i);

          if (item) {
            functionsInTableMap.set(item, i);
          }
        }
      }
    }

    var functionsInTableMap = undefined;
    var freeTableIndexes = [];

    function getEmptyTableSlot() {
      if (freeTableIndexes.length) {
        return freeTableIndexes.pop();
      }

      try {
        wasmTable.grow(1);
      } catch (err) {
        if (!(err instanceof RangeError)) {
          throw err;
        }

        throw 'Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.';
      }

      return wasmTable.length - 1;
    }

    function setWasmTableEntry(idx, func) {
      wasmTable.set(idx, func);
      wasmTableMirror[idx] = wasmTable.get(idx);
    }

    function addFunction(func, sig) {
      if (!functionsInTableMap) {
        functionsInTableMap = new WeakMap();
        updateTableMap(0, wasmTable.length);
      }

      if (functionsInTableMap.has(func)) {
        return functionsInTableMap.get(func);
      }

      var ret = getEmptyTableSlot();

      try {
        setWasmTableEntry(ret, func);
      } catch (err) {
        if (!(err instanceof TypeError)) {
          throw err;
        }

        var wrapped = convertJsFunctionToWasm(func, sig);
        setWasmTableEntry(ret, wrapped);
      }

      functionsInTableMap.set(func, ret);
      return ret;
    }

    function runAndAbortIfError(func) {
      try {
        return func();
      } catch (e) {
        abort(e);
      }
    }

    function callUserCallback(func) {
      if (ABORT) {
        return;
      }

      try {
        func();
      } catch (e) {
        handleException(e);
      }
    }

    var Asyncify = {
      State: {
        Normal: 0,
        Unwinding: 1,
        Rewinding: 2,
        Disabled: 3
      },
      state: 0,
      StackSize: 4096,
      currData: null,
      handleSleepReturnValue: 0,
      exportCallStack: [],
      callStackNameToId: {},
      callStackIdToName: {},
      callStackId: 0,
      asyncPromiseHandlers: null,
      sleepCallbacks: [],
      getCallStackId: function (funcName) {
        var id = Asyncify.callStackNameToId[funcName];

        if (id === undefined) {
          id = Asyncify.callStackId++;
          Asyncify.callStackNameToId[funcName] = id;
          Asyncify.callStackIdToName[id] = funcName;
        }

        return id;
      },
      instrumentWasmImports: function (imports) {
        var ASYNCIFY_IMPORTS = ['env.invoke_*', 'env.emscripten_sleep', 'env.emscripten_wget', 'env.emscripten_wget_data', 'env.emscripten_idb_load', 'env.emscripten_idb_store', 'env.emscripten_idb_delete', 'env.emscripten_idb_exists', 'env.emscripten_idb_load_blob', 'env.emscripten_idb_store_blob', 'env.SDL_Delay', 'env.emscripten_scan_registers', 'env.emscripten_lazy_load_code', 'env.emscripten_fiber_swap', 'wasi_snapshot_preview1.fd_sync', 'env.__wasi_fd_sync', 'env._emval_await', 'env._dlopen_js', 'env.__asyncjs__*'].map(x => x.split('.')[1]);

        for (var x in imports) {
          (function (x) {
            var original = imports[x];

            if (typeof original == 'function') {
              ASYNCIFY_IMPORTS.indexOf(x) >= 0 || x.startsWith('__asyncjs__');
            }
          })(x);
        }
      },
      instrumentWasmExports: function (exports) {
        var ret = {};

        for (var x in exports) {
          (function (x) {
            var original = exports[x];

            if (typeof original == 'function') {
              ret[x] = function () {
                Asyncify.exportCallStack.push(x);

                try {
                  return original.apply(null, arguments);
                } finally {
                  if (!ABORT) {
                    var y = Asyncify.exportCallStack.pop();
                    assert(y === x);
                    Asyncify.maybeStopUnwind();
                  }
                }
              };
            } else {
              ret[x] = original;
            }
          })(x);
        }

        return ret;
      },
      maybeStopUnwind: function () {
        if (Asyncify.currData && Asyncify.state === Asyncify.State.Unwinding && Asyncify.exportCallStack.length === 0) {
          Asyncify.state = Asyncify.State.Normal;
          runAndAbortIfError(_asyncify_stop_unwind);

          if (typeof Fibers != 'undefined') {
            Fibers.trampoline();
          }
        }
      },
      whenDone: function () {
        return new Promise((resolve, reject) => {
          Asyncify.asyncPromiseHandlers = {
            resolve: resolve,
            reject: reject
          };
        });
      },
      allocateData: function () {
        var ptr = _malloc(12 + Asyncify.StackSize);

        Asyncify.setDataHeader(ptr, ptr + 12, Asyncify.StackSize);
        Asyncify.setDataRewindFunc(ptr);
        return ptr;
      },
      setDataHeader: function (ptr, stack, stackSize) {
        HEAP32[ptr >> 2] = stack;
        HEAP32[ptr + 4 >> 2] = stack + stackSize;
      },
      setDataRewindFunc: function (ptr) {
        var bottomOfCallStack = Asyncify.exportCallStack[0];
        var rewindId = Asyncify.getCallStackId(bottomOfCallStack);
        HEAP32[ptr + 8 >> 2] = rewindId;
      },
      getDataRewindFunc: function (ptr) {
        var id = HEAP32[ptr + 8 >> 2];
        var name = Asyncify.callStackIdToName[id];
        var func = Module['asm'][name];
        return func;
      },
      doRewind: function (ptr) {
        var start = Asyncify.getDataRewindFunc(ptr);
        return start();
      },
      handleSleep: function (startAsync) {
        if (ABORT) return;

        if (Asyncify.state === Asyncify.State.Normal) {
          var reachedCallback = false;
          var reachedAfterCallback = false;
          startAsync(handleSleepReturnValue => {
            if (ABORT) return;
            Asyncify.handleSleepReturnValue = handleSleepReturnValue || 0;
            reachedCallback = true;

            if (!reachedAfterCallback) {
              return;
            }

            Asyncify.state = Asyncify.State.Rewinding;
            runAndAbortIfError(() => _asyncify_start_rewind(Asyncify.currData));

            if (typeof Browser != 'undefined' && Browser.mainLoop.func) {
              Browser.mainLoop.resume();
            }

            var asyncWasmReturnValue,
                isError = false;

            try {
              asyncWasmReturnValue = Asyncify.doRewind(Asyncify.currData);
            } catch (err) {
              asyncWasmReturnValue = err;
              isError = true;
            }

            var handled = false;

            if (!Asyncify.currData) {
              var asyncPromiseHandlers = Asyncify.asyncPromiseHandlers;

              if (asyncPromiseHandlers) {
                Asyncify.asyncPromiseHandlers = null;
                (isError ? asyncPromiseHandlers.reject : asyncPromiseHandlers.resolve)(asyncWasmReturnValue);
                handled = true;
              }
            }

            if (isError && !handled) {
              throw asyncWasmReturnValue;
            }
          });
          reachedAfterCallback = true;

          if (!reachedCallback) {
            Asyncify.state = Asyncify.State.Unwinding;
            Asyncify.currData = Asyncify.allocateData();

            if (typeof Browser != 'undefined' && Browser.mainLoop.func) {
              Browser.mainLoop.pause();
            }

            runAndAbortIfError(() => _asyncify_start_unwind(Asyncify.currData));
          }
        } else if (Asyncify.state === Asyncify.State.Rewinding) {
          Asyncify.state = Asyncify.State.Normal;
          runAndAbortIfError(_asyncify_stop_rewind);

          _free(Asyncify.currData);

          Asyncify.currData = null;
          Asyncify.sleepCallbacks.forEach(func => callUserCallback(func));
        } else {
          abort('invalid state: ' + Asyncify.state);
        }

        return Asyncify.handleSleepReturnValue;
      },
      handleAsync: function (startAsync) {
        return Asyncify.handleSleep(wakeUp => {
          startAsync().then(wakeUp);
        });
      }
    };
    var asmLibraryArg = {
      a: ___handle_stack_overflow,
      e: __emscripten_date_now,
      f: _emscripten_memcpy_big,
      b: _emscripten_resize_heap,
      c: _environ_get,
      d: _environ_sizes_get
    };
    createWasm();

    Module['___wasm_call_ctors'] = function () {
      return (Module['___wasm_call_ctors'] = Module['asm']['h']).apply(null, arguments);
    };

    Module['_init'] = function () {
      return (Module['_init'] = Module['asm']['i']).apply(null, arguments);
    };

    Module['_dispose'] = function () {
      return (Module['_dispose'] = Module['asm']['j']).apply(null, arguments);
    };

    Module['_getVersion'] = function () {
      return (Module['_getVersion'] = Module['asm']['k']).apply(null, arguments);
    };

    Module['_setErrorCallback'] = function () {
      return (Module['_setErrorCallback'] = Module['asm']['l']).apply(null, arguments);
    };

    Module['_getMainDesc'] = function () {
      return (Module['_getMainDesc'] = Module['asm']['m']).apply(null, arguments);
    };

    Module['_isMainDescChanged'] = function () {
      return (Module['_isMainDescChanged'] = Module['asm']['n']).apply(null, arguments);
    };

    Module['_getVarsDesc'] = function () {
      return (Module['_getVarsDesc'] = Module['asm']['o']).apply(null, arguments);
    };

    Module['_isVarsDescChanged'] = function () {
      return (Module['_isVarsDescChanged'] = Module['asm']['p']).apply(null, arguments);
    };

    Module['_getActions'] = function () {
      return (Module['_getActions'] = Module['asm']['q']).apply(null, arguments);
    };

    var _malloc = Module['_malloc'] = function () {
      return (_malloc = Module['_malloc'] = Module['asm']['r']).apply(null, arguments);
    };

    Module['_selectAction'] = function () {
      return (Module['_selectAction'] = Module['asm']['s']).apply(null, arguments);
    };

    Module['_executeSelAction'] = function () {
      return (Module['_executeSelAction'] = Module['asm']['t']).apply(null, arguments);
    };

    Module['_isActionsChanged'] = function () {
      return (Module['_isActionsChanged'] = Module['asm']['u']).apply(null, arguments);
    };

    Module['_getObjects'] = function () {
      return (Module['_getObjects'] = Module['asm']['v']).apply(null, arguments);
    };

    Module['_selectObject'] = function () {
      return (Module['_selectObject'] = Module['asm']['w']).apply(null, arguments);
    };

    Module['_isObjectsChanged'] = function () {
      return (Module['_isObjectsChanged'] = Module['asm']['x']).apply(null, arguments);
    };

    Module['_loadGameData'] = function () {
      return (Module['_loadGameData'] = Module['asm']['y']).apply(null, arguments);
    };

    Module['_restartGame'] = function () {
      return (Module['_restartGame'] = Module['asm']['z']).apply(null, arguments);
    };

    Module['_saveGameData'] = function () {
      return (Module['_saveGameData'] = Module['asm']['A']).apply(null, arguments);
    };

    var _free = Module['_free'] = function () {
      return (_free = Module['_free'] = Module['asm']['B']).apply(null, arguments);
    };

    Module['_loadSavedGameData'] = function () {
      return (Module['_loadSavedGameData'] = Module['asm']['C']).apply(null, arguments);
    };

    Module['_execString'] = function () {
      return (Module['_execString'] = Module['asm']['D']).apply(null, arguments);
    };

    Module['_execCounter'] = function () {
      return (Module['_execCounter'] = Module['asm']['E']).apply(null, arguments);
    };

    Module['_execLoc'] = function () {
      return (Module['_execLoc'] = Module['asm']['F']).apply(null, arguments);
    };

    Module['_execUserInput'] = function () {
      return (Module['_execUserInput'] = Module['asm']['G']).apply(null, arguments);
    };

    Module['_getLastErrorNum'] = function () {
      return (Module['_getLastErrorNum'] = Module['asm']['H']).apply(null, arguments);
    };

    Module['_getLastErrorLoc'] = function () {
      return (Module['_getLastErrorLoc'] = Module['asm']['I']).apply(null, arguments);
    };

    Module['_getLastErrorActIndex'] = function () {
      return (Module['_getLastErrorActIndex'] = Module['asm']['J']).apply(null, arguments);
    };

    Module['_getLastErrorLine'] = function () {
      return (Module['_getLastErrorLine'] = Module['asm']['K']).apply(null, arguments);
    };

    Module['_getErrorDesc'] = function () {
      return (Module['_getErrorDesc'] = Module['asm']['L']).apply(null, arguments);
    };

    Module['_getVarStringValue'] = function () {
      return (Module['_getVarStringValue'] = Module['asm']['M']).apply(null, arguments);
    };

    Module['_getVarNumValue'] = function () {
      return (Module['_getVarNumValue'] = Module['asm']['N']).apply(null, arguments);
    };

    Module['_getVarStringValueByKey'] = function () {
      return (Module['_getVarStringValueByKey'] = Module['asm']['O']).apply(null, arguments);
    };

    Module['_getVarNumValueByKey'] = function () {
      return (Module['_getVarNumValueByKey'] = Module['asm']['P']).apply(null, arguments);
    };

    Module['_getVarSize'] = function () {
      return (Module['_getVarSize'] = Module['asm']['Q']).apply(null, arguments);
    };

    Module['_initCallBacks'] = function () {
      return (Module['_initCallBacks'] = Module['asm']['R']).apply(null, arguments);
    };

    Module['_setCallBack'] = function () {
      return (Module['_setCallBack'] = Module['asm']['S']).apply(null, arguments);
    };

    Module['_freeItemsList'] = function () {
      return (Module['_freeItemsList'] = Module['asm']['T']).apply(null, arguments);
    };

    Module['_freeSaveBuffer'] = function () {
      return (Module['_freeSaveBuffer'] = Module['asm']['U']).apply(null, arguments);
    };

    var _emscripten_stack_init = Module['_emscripten_stack_init'] = function () {
      return (_emscripten_stack_init = Module['_emscripten_stack_init'] = Module['asm']['W']).apply(null, arguments);
    };

    var _emscripten_stack_get_base = Module['_emscripten_stack_get_base'] = function () {
      return (_emscripten_stack_get_base = Module['_emscripten_stack_get_base'] = Module['asm']['X']).apply(null, arguments);
    };

    var _emscripten_stack_get_end = Module['_emscripten_stack_get_end'] = function () {
      return (_emscripten_stack_get_end = Module['_emscripten_stack_get_end'] = Module['asm']['Y']).apply(null, arguments);
    };

    var ___set_stack_limits = Module['___set_stack_limits'] = function () {
      return (___set_stack_limits = Module['___set_stack_limits'] = Module['asm']['Z']).apply(null, arguments);
    };

    var _asyncify_start_unwind = Module['_asyncify_start_unwind'] = function () {
      return (_asyncify_start_unwind = Module['_asyncify_start_unwind'] = Module['asm']['_']).apply(null, arguments);
    };

    var _asyncify_stop_unwind = Module['_asyncify_stop_unwind'] = function () {
      return (_asyncify_stop_unwind = Module['_asyncify_stop_unwind'] = Module['asm']['$']).apply(null, arguments);
    };

    var _asyncify_start_rewind = Module['_asyncify_start_rewind'] = function () {
      return (_asyncify_start_rewind = Module['_asyncify_start_rewind'] = Module['asm']['aa']).apply(null, arguments);
    };

    var _asyncify_stop_rewind = Module['_asyncify_stop_rewind'] = function () {
      return (_asyncify_stop_rewind = Module['_asyncify_stop_rewind'] = Module['asm']['ba']).apply(null, arguments);
    };

    Module['addFunction'] = addFunction;
    Module['Asyncify'] = Asyncify;
    var calledRun;

    dependenciesFulfilled = function runCaller() {
      if (!calledRun) run();
      if (!calledRun) dependenciesFulfilled = runCaller;
    };

    function stackCheckInit() {
      _emscripten_stack_init();

      writeStackCookie();
    }

    function run(args) {

      if (runDependencies > 0) {
        return;
      }

      stackCheckInit();
      preRun();

      if (runDependencies > 0) {
        return;
      }

      function doRun() {
        if (calledRun) return;
        calledRun = true;
        Module['calledRun'] = true;
        if (ABORT) return;
        initRuntime();
        readyPromiseResolve(Module);
        if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();
        postRun();
      }

      if (Module['setStatus']) {
        Module['setStatus']('Running...');
        setTimeout(function () {
          setTimeout(function () {
            Module['setStatus']('');
          }, 1);
          doRun();
        }, 1);
      } else {
        doRun();
      }

      checkStackCookie();
    }

    if (Module['preInit']) {
      if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];

      while (Module['preInit'].length > 0) {
        Module['preInit'].pop()();
      }
    }

    run();
    return createQspModule.ready;
  };
})();

var QspCallType;

(function (QspCallType) {
  QspCallType[QspCallType["DEBUG"] = 0] = "DEBUG";
  /* void func(QSPString str) */

  QspCallType[QspCallType["ISPLAYINGFILE"] = 1] = "ISPLAYINGFILE";
  /* QSP_BOOL func(QSPString file) */

  QspCallType[QspCallType["PLAYFILE"] = 2] = "PLAYFILE";
  /* void func(QSPString file, int volume) */

  QspCallType[QspCallType["CLOSEFILE"] = 3] = "CLOSEFILE";
  /* void func(QSPString file) */

  QspCallType[QspCallType["SHOWIMAGE"] = 4] = "SHOWIMAGE";
  /* void func(QSPString file) */

  QspCallType[QspCallType["SHOWWINDOW"] = 5] = "SHOWWINDOW";
  /* void func(int type, QSP_BOOL isShow) */

  QspCallType[QspCallType["SHOWMENU"] = 6] = "SHOWMENU";
  /* int func(QSPListItem *items, int count) */

  QspCallType[QspCallType["SHOWMSGSTR"] = 7] = "SHOWMSGSTR";
  /* void func(QSPString text) */

  QspCallType[QspCallType["REFRESHINT"] = 8] = "REFRESHINT";
  /* void func(QSP_BOOL isRedraw) */

  QspCallType[QspCallType["SETTIMER"] = 9] = "SETTIMER";
  /* void func(int msecs) */

  QspCallType[QspCallType["SETINPUTSTRTEXT"] = 10] = "SETINPUTSTRTEXT";
  /* void func(QSPString text) */

  QspCallType[QspCallType["SYSTEM"] = 11] = "SYSTEM";
  /* void func(QSPString cmd) */

  QspCallType[QspCallType["OPENGAME"] = 12] = "OPENGAME";
  /* void func(QSP_BOOL isNewGame) */

  QspCallType[QspCallType["OPENGAMESTATUS"] = 13] = "OPENGAMESTATUS";
  /* void func(QSPString file) */

  QspCallType[QspCallType["SAVEGAMESTATUS"] = 14] = "SAVEGAMESTATUS";
  /* void func(QSPString file) */

  QspCallType[QspCallType["SLEEP"] = 15] = "SLEEP";
  /* void func(int msecs) */

  QspCallType[QspCallType["GETMSCOUNT"] = 16] = "GETMSCOUNT";
  /* int func() */

  QspCallType[QspCallType["INPUTBOX"] = 17] = "INPUTBOX";
  /* void func(QSPString text, QSP_CHAR *buffer, int maxLen) */

  QspCallType[QspCallType["VERSION"] = 18] = "VERSION";
  QspCallType[QspCallType["DUMMY"] = 19] = "DUMMY";
})(QspCallType || (QspCallType = {}));

const POINTER_SIZE = 4; // pointers are 4 bytes in C

function allocStringPointer(module) {
  return module._malloc(POINTER_SIZE * 2);
}
function allocPointer(module) {
  return module._malloc(POINTER_SIZE);
}
function derefPointer(module, ptr) {
  return readI32Value(module, ptr);
}
function movePointer(ptr, times = 1) {
  return ptr + POINTER_SIZE * times;
}
function freePointer(module, ptr) {
  module._free(ptr);
}
function readInt(module, ptr) {
  return readI32Value(module, ptr);
}
function readString(module, ptr) {
  const start = derefPointer(module, ptr);

  if (!start) {
    return '';
  }

  const end = derefPointer(module, movePointer(ptr));
  return readUTF32String(module, start, end - start);
}
function writeString(module, value) {
  const length = lengthBytesUTF32(value);

  const ptr = module._malloc(length + 4);

  writeUTF32String(module, value, ptr, length + 4);
  return ptr;
}
function withStringRead(module, callback) {
  const ptr = allocStringPointer(module);
  callback(ptr);
  const result = readString(module, ptr);
  freePointer(module, ptr);
  return result;
}
function withStringWrite(module, value, callback) {
  const ptr = writeString(module, value);
  callback(ptr);

  module._free(ptr);
}
function withListRead(module, callback) {
  const countPtr = allocPointer(module);
  const listPtr = callback(countPtr);
  const count = readInt(module, countPtr);
  const list = readListItems(module, listPtr, count);

  module._freeItemsList(listPtr);

  freePointer(module, countPtr);
  return list;
}
function withBufferWrite(module, data, callback) {
  const bytes = new Uint8Array(data);

  const ptr = module._malloc(bytes.length);

  module.HEAPU8.set(bytes, ptr);
  callback(ptr, bytes.length);

  module._free(ptr);
}
function withBufferRead(module, callback) {
  const sizePtr = allocPointer(module);
  const bufferPtr = callback(sizePtr);
  const size = readI32Value(module, sizePtr);

  if (!size) {
    freePointer(module, sizePtr);
    return null;
  }

  const data = module.HEAPU8.slice(bufferPtr, bufferPtr + size);

  module._freeSaveBuffer(bufferPtr);

  freePointer(module, sizePtr);
  return data.buffer;
}
function readListItems(module, listPtr, count) {
  const list = [];
  let ptr = listPtr;

  for (let i = 0; i < count; i++) {
    const image = readString(module, ptr);
    ptr = movePointer(ptr, 2);
    const name = readString(module, ptr);
    ptr = movePointer(ptr, 2);
    list.push({
      name,
      image
    });
  }

  return list;
}
function asAsync(module, callback) {
  return module.Asyncify.handleSleep(wakeUp => {
    callback(result => wakeUp(result || 0));
  });
}

function readI32Value(module, ptr) {
  return module.HEAP32[ptr >> 2];
}

function lengthBytesUTF32(str) {
  let len = 0;

  for (let i = 0; i < str.length; ++i) {
    const codeUnit = str.charCodeAt(i);
    if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
    len += 4;
  }

  return len;
}

function writeUTF32String(module, str, outPtr, maxBytesToWrite = 2147483647) {
  if (maxBytesToWrite < 4) return 0;
  const startPtr = outPtr;
  const endPtr = startPtr + maxBytesToWrite - 4;

  for (let i = 0; i < str.length; ++i) {
    let codeUnit = str.charCodeAt(i);

    if (codeUnit >= 55296 && codeUnit <= 57343) {
      const trailSurrogate = str.charCodeAt(++i);
      codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023;
    }

    module.HEAP32[outPtr >> 2] = codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }

  module.HEAP32[outPtr >> 2] = 0;
  return outPtr - startPtr;
}

function readUTF32String(module, ptr, maxBytesToRead) {
  let i = 0;
  const str = [];

  while (!(i >= maxBytesToRead / 4)) {
    const utf32 = module.HEAP32[ptr + i * 4 >> 2];
    if (utf32 == 0) break;
    ++i;

    if (utf32 >= 65536) {
      const ch = utf32 - 65536;
      str.push(String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023));
    } else {
      str.push(String.fromCharCode(utf32));
    }
  }

  return str.join('');
}

class QspAPIImpl {
  constructor(module) {
    this.module = void 0;
    this.listeners = new Map();
    this.variableWatchers = new Set();
    this.variableValues = new Map();
    this.time = Date.now();
    this.staticStrings = new Map();

    this.onError = () => {
      const errorData = this.readError();

      if (errorData) {
        console.error(errorData);
        this.emit('error', errorData);
      }

      this.onRefresh(true);
    };

    this.onRefresh = isRedraw => {
      this.reportVariables();

      if (isRedraw || this.module._isMainDescChanged()) {
        const mainDesc = withStringRead(this.module, ptr => this.module._getMainDesc(ptr));
        this.emit('main_changed', mainDesc);
      }

      if (isRedraw || this.module._isVarsDescChanged()) {
        const varsDesc = withStringRead(this.module, ptr => this.module._getVarsDesc(ptr));
        this.emit('stats_changed', varsDesc);
      }

      if (isRedraw || this.module._isActionsChanged()) {
        const actions = withListRead(this.module, ptr => this.module._getActions(ptr));
        this.emit('actions_changed', actions);
      }

      if (isRedraw || this.module._isObjectsChanged()) {
        const objects = withListRead(this.module, ptr => this.module._getObjects(ptr));
        this.emit('objects_changed', objects);
      }
    };

    this.onShowWindow = (type, isShown) => {
      this.emit('panel_visibility', type, isShown);
    };

    this.onMenu = (listPtr, count) => {
      const items = readListItems(this.module, listPtr, count);
      return asAsync(this.module, done => this.emit('menu', items, done));
    };

    this.onMsg = textPtr => {
      this.onRefresh(false);
      const text = readString(this.module, textPtr);
      return asAsync(this.module, done => this.emit('msg', text, done));
    };

    this.onInput = (textPtr, retPtr, maxSize) => {
      this.onRefresh(false);
      const text = readString(this.module, textPtr);
      return asAsync(this.module, done => {
        const onInput = inputText => {
          writeUTF32String(this.module, inputText, retPtr, maxSize);
          done();
        };

        this.emit('input', text, onInput);
      });
    };

    this.onVersion = (textPtr, retPtr, maxSize) => {
      const params = readString(this.module, textPtr);
      return asAsync(this.module, done => {
        const onVersion = versionText => {
          writeUTF32String(this.module, versionText, retPtr, maxSize);
          done();
        };

        this.emit('version', params, onVersion);
      });
    };

    this.onWait = ms => {
      return asAsync(this.module, done => this.emit('wait', ms, done));
    };

    this.onSetTimer = ms => {
      this.emit('timer', ms);
    };

    this.onSetUserInput = textPtr => {
      const text = readString(this.module, textPtr);
      this.emit('user_input', text);
    };

    this.onView = pathPtr => {
      const path = readString(this.module, pathPtr);
      this.emit('view', path);
    };

    this.onDebug = strPtr => {
      const text = readString(this.module, strPtr);
      console.log('DEBUG:', text);
    };

    this.onSystemCmd = strPtr => {
      const text = readString(this.module, strPtr);
      this.emit('system_cmd', text);
    };

    this.onGetMS = () => {
      const elapsed = Date.now() - this.time;
      this.time = Date.now();
      return elapsed;
    };

    this.onOpenGame = (pathPtr, isNewGame) => {
      const path = readString(this.module, pathPtr);
      return asAsync(this.module, done => this.emit('open_game', path, isNewGame, done));
    };

    this.onOpenGameStatus = pathPtr => {
      const path = readString(this.module, pathPtr);
      return asAsync(this.module, done => this.emit('load_save', path, done));
    };

    this.onSaveGameStatus = pathPtr => {
      const path = readString(this.module, pathPtr);
      return asAsync(this.module, done => this.emit('save_game', path, done));
    };

    this.onIsPlay = filePtr => {
      const file = readString(this.module, filePtr);
      return asAsync(this.module, done => this.emit('is_play', file, result => done(result ? 1 : 0)));
    };

    this.onPlayFile = (filePtr, volume) => {
      const file = readString(this.module, filePtr);
      return asAsync(this.module, done => this.emit('play_file', file, volume, done));
    };

    this.onCloseFile = filePtr => {
      const file = readString(this.module, filePtr);
      return asAsync(this.module, done => this.emit('close_file', file, done));
    };

    this.module = module;
    this.init();
  }

  on(event, listener) {
    var _this$listeners$get;

    const list = (_this$listeners$get = this.listeners.get(event)) != null ? _this$listeners$get : [];
    list.push(listener);
    this.listeners.set(event, list);
  }

  off(event, listener) {
    var _this$listeners$get2;

    let list = (_this$listeners$get2 = this.listeners.get(event)) != null ? _this$listeners$get2 : [];
    list = list.filter(l => l !== listener);

    if (list.length) {
      this.listeners.set(event, list);
    } else {
      this.listeners.delete(event);
    }
  }

  watchVariable(name, index, callback) {
    let value = this.readVariable(name, index);
    callback(value);

    const updater = () => {
      const newValue = this.readVariable(name, index);

      if (value !== newValue) {
        value = newValue;
        callback(value);
      }
    };

    this.variableWatchers.add(updater);
    return () => {
      this.variableWatchers.delete(updater);
    };
  }

  watchVariableByKey(name, key, callback) {
    let value = this.readVariableByKey(name, key);
    callback(value);

    const updater = () => {
      const newValue = this.readVariableByKey(name, key);

      if (value !== newValue) {
        value = newValue;
        callback(value);
      }
    };

    this.variableWatchers.add(updater);
    return () => {
      this.variableWatchers.delete(updater);
    };
  }

  emit(event, ...args) {
    var _this$listeners$get3;

    console.log({
      event,
      args
    });
    const list = (_this$listeners$get3 = this.listeners.get(event)) != null ? _this$listeners$get3 : [];

    for (const listener of list) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      listener(...args);
    }
  }

  openGame(data, isNewGame) {
    withBufferWrite(this.module, data, (ptr, size) => this.module._loadGameData(ptr, size, isNewGame ? 1 : 0));
  }

  saveGame() {
    const buffer = withBufferRead(this.module, ptr => this.module._saveGameData(ptr));

    if (!buffer) {
      this.onError();
      return null;
    }

    return buffer;
  }

  loadSave(data) {
    withBufferWrite(this.module, data, (ptr, size) => this.module._loadSavedGameData(ptr, size));
  }

  restartGame() {
    this.time = Date.now();

    this.module._restartGame();
  }

  selectAction(index) {
    this.module._selectAction(index);
  }

  execSelectedAction() {
    this.module._executeSelAction();
  }

  selectObject(index) {
    this.module._selectObject(index);
  }

  version() {
    return withStringRead(this.module, ptr => this.module._getVersion(ptr));
  }

  getStaticStringPointer(name) {
    const preparedName = name.toLocaleUpperCase();
    const namePtr = this.staticStrings.get(preparedName);
    if (namePtr) return namePtr;
    const newPtr = writeString(this.module, name);
    this.staticStrings.set(preparedName, newPtr);
    return newPtr;
  }

  readVariable(name, index) {
    if (name.startsWith('$')) {
      return this.readVariableString(name, index);
    }

    return this.readVariableNumber(name, index);
  }

  readVariableByKey(name, key) {
    if (name.startsWith('$')) {
      return this.readVariableStringByKey(name, key);
    }

    return this.readVariableNumberByKey(name, key);
  }

  readVariableNumber(name, index = 0) {
    const namePtr = this.getStaticStringPointer(name.toLocaleUpperCase());
    return this.module._getVarNumValue(namePtr, index);
  }

  readVariableNumberByKey(name, key) {
    const namePtr = this.getStaticStringPointer(name.toLocaleUpperCase());
    const keyPtr = this.getStaticStringPointer(key.toLocaleUpperCase());
    return this.module._getVarNumValueByKey(namePtr, keyPtr);
  }

  readVariableString(name, index = 0) {
    const namePtr = this.getStaticStringPointer(name.toLocaleUpperCase());
    return withStringRead(this.module, ptr => this.module._getVarStringValue(namePtr, index, ptr));
  }

  readVariableStringByKey(name, key) {
    const namePtr = this.getStaticStringPointer(name.toLocaleUpperCase());
    const keyPtr = this.getStaticStringPointer(key.toLocaleUpperCase());
    return withStringRead(this.module, ptr => this.module._getVarStringValueByKey(namePtr, keyPtr, ptr));
  }

  readVariableSize(name) {
    const namePtr = this.getStaticStringPointer(name.toLocaleUpperCase());
    return this.module._getVarSize(namePtr);
  }

  execCode(code) {
    withStringWrite(this.module, code, ptr => this.module._execString(ptr));
  }

  execCounter() {
    this.module._execCounter();
  }

  execLoc(name) {
    withStringWrite(this.module, name, ptr => this.module._execLoc(ptr));
  }

  updateUserInput(code) {
    withStringWrite(this.module, code, ptr => this.module._execUserInput(ptr));
  }

  init() {
    this.module._init();

    this.module._initCallBacks();

    this.registerCallbacks();
  }

  registerCallbacks() {
    this.module._setErrorCallback(this.module.addFunction(this.onError, 'i'));

    const callbacks = [[QspCallType.REFRESHINT, this.onRefresh, 'ii'], [QspCallType.SHOWWINDOW, this.onShowWindow, 'iii'], [QspCallType.SHOWMENU, this.onMenu, 'iii'], [QspCallType.SHOWMSGSTR, this.onMsg, 'ii'], [QspCallType.INPUTBOX, this.onInput, 'iiii'], [QspCallType.SLEEP, this.onWait, 'ii'], [QspCallType.SETTIMER, this.onSetTimer, 'ii'], [QspCallType.SETINPUTSTRTEXT, this.onSetUserInput, 'ii'], [QspCallType.SHOWIMAGE, this.onView, 'ii'], [QspCallType.DEBUG, this.onDebug, 'ii'], [QspCallType.GETMSCOUNT, this.onGetMS, 'i'], [QspCallType.OPENGAME, this.onOpenGame, 'iii'], [QspCallType.OPENGAMESTATUS, this.onOpenGameStatus, 'ii'], [QspCallType.SAVEGAMESTATUS, this.onSaveGameStatus, 'ii'], [QspCallType.ISPLAYINGFILE, this.onIsPlay, 'ii'], [QspCallType.PLAYFILE, this.onPlayFile, 'iii'], [QspCallType.CLOSEFILE, this.onCloseFile, 'ii'], [QspCallType.SYSTEM, this.onSystemCmd, 'ii'], [QspCallType.VERSION, this.onVersion, 'iiii']];

    for (const [type, callback, signature] of callbacks) {
      this.registerCallback(type, callback, signature);
    }
  } // eslint-disable-next-line @typescript-eslint/ban-types


  registerCallback(type, callback, signature) {
    this.module._setCallBack(type, this.module.addFunction(callback, signature));
  }

  reportVariables() {
    for (const updater of this.variableWatchers.values()) {
      updater();
    }
  }

  readError() {
    const code = this.module._getLastErrorNum();

    if (!code) return null;
    return {
      code,
      location: withStringRead(this.module, ptr => this.module._getLastErrorLoc(ptr)),
      description: withStringRead(this.module, ptr => this.module._getErrorDesc(ptr, code)),
      actionIndex: this.module._getLastErrorActIndex(),
      line: this.module._getLastErrorLine()
    };
  }

  toJSON() {
    return '[QSP API]';
  }

}

function init(wasmBinary) {
  return new Promise(resolve => {
    createQspModule({
      wasmBinary
    }).then(moduleWasm => {
      resolve(new QspAPIImpl(moduleWasm));
    });
  });
}

async function initQspEngine(filePath) {
  const wasm = await fsp__default["default"].readFile(filePath);
  return init(wasm.buffer);
}

exports.initQspEngine = initQspEngine;
//# sourceMappingURL=wasm-engine.cjs.map
