const RUNTIME_PUBLIC_PATH = "server/chunks/ssr/[turbopack]_runtime.js";
const RELATIVE_ROOT_PATH = "..";
const ASSET_PREFIX = "/_next/";
/**
 * This file contains runtime types and functions that are shared between all
 * TurboPack ECMAScript runtimes.
 *
 * It will be prepended to the runtime code of each runtime.
 */ /* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="./runtime-types.d.ts" />
const REEXPORTED_OBJECTS = new WeakMap();
/**
 * Constructs the `__turbopack_context__` object for a module.
 */ function Context(module, exports) {
    this.m = module;
    // We need to store this here instead of accessing it from the module object to:
    // 1. Make it available to factories directly, since we rewrite `this` to
    //    `__turbopack_context__.e` in CJS modules.
    // 2. Support async modules which rewrite `module.exports` to a promise, so we
    //    can still access the original exports object from functions like
    //    `esmExport`
    // Ideally we could find a new approach for async modules and drop this property altogether.
    this.e = exports;
}
const contextPrototype = Context.prototype;
const hasOwnProperty = Object.prototype.hasOwnProperty;
const toStringTag = typeof Symbol !== 'undefined' && Symbol.toStringTag;
function defineProp(obj, name, options) {
    if (!hasOwnProperty.call(obj, name)) Object.defineProperty(obj, name, options);
}
function getOverwrittenModule(moduleCache, id) {
    let module = moduleCache[id];
    if (!module) {
        // This is invoked when a module is merged into another module, thus it wasn't invoked via
        // instantiateModule and the cache entry wasn't created yet.
        module = createModuleObject(id);
        moduleCache[id] = module;
    }
    return module;
}
/**
 * Creates the module object. Only done here to ensure all module objects have the same shape.
 */ function createModuleObject(id) {
    return {
        exports: {},
        error: undefined,
        id,
        namespaceObject: undefined
    };
}
/**
 * Adds the getters to the exports object.
 */ function esm(exports, getters) {
    defineProp(exports, '__esModule', {
        value: true
    });
    if (toStringTag) defineProp(exports, toStringTag, {
        value: 'Module'
    });
    let i = 0;
    while(i < getters.length){
        const propName = getters[i++];
        // TODO(luke.sandberg): we could support raw values here, but would need a discriminator beyond 'not a function'
        const getter = getters[i++];
        if (typeof getters[i] === 'function') {
            // a setter
            defineProp(exports, propName, {
                get: getter,
                set: getters[i++],
                enumerable: true
            });
        } else {
            defineProp(exports, propName, {
                get: getter,
                enumerable: true
            });
        }
    }
    Object.seal(exports);
}
/**
 * Makes the module an ESM with exports
 */ function esmExport(getters, id) {
    let module;
    let exports;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
        exports = module.exports;
    } else {
        module = this.m;
        exports = this.e;
    }
    module.namespaceObject = exports;
    esm(exports, getters);
}
contextPrototype.s = esmExport;
function ensureDynamicExports(module, exports) {
    let reexportedObjects = REEXPORTED_OBJECTS.get(module);
    if (!reexportedObjects) {
        REEXPORTED_OBJECTS.set(module, reexportedObjects = []);
        module.exports = module.namespaceObject = new Proxy(exports, {
            get (target, prop) {
                if (hasOwnProperty.call(target, prop) || prop === 'default' || prop === '__esModule') {
                    return Reflect.get(target, prop);
                }
                for (const obj of reexportedObjects){
                    const value = Reflect.get(obj, prop);
                    if (value !== undefined) return value;
                }
                return undefined;
            },
            ownKeys (target) {
                const keys = Reflect.ownKeys(target);
                for (const obj of reexportedObjects){
                    for (const key of Reflect.ownKeys(obj)){
                        if (key !== 'default' && !keys.includes(key)) keys.push(key);
                    }
                }
                return keys;
            }
        });
    }
    return reexportedObjects;
}
/**
 * Dynamically exports properties from an object
 */ function dynamicExport(object, id) {
    let module;
    let exports;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
        exports = module.exports;
    } else {
        module = this.m;
        exports = this.e;
    }
    const reexportedObjects = ensureDynamicExports(module, exports);
    if (typeof object === 'object' && object !== null) {
        reexportedObjects.push(object);
    }
}
contextPrototype.j = dynamicExport;
function exportValue(value, id) {
    let module;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
    } else {
        module = this.m;
    }
    module.exports = value;
}
contextPrototype.v = exportValue;
function exportNamespace(namespace, id) {
    let module;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
    } else {
        module = this.m;
    }
    module.exports = module.namespaceObject = namespace;
}
contextPrototype.n = exportNamespace;
function createGetter(obj, key) {
    return ()=>obj[key];
}
/**
 * @returns prototype of the object
 */ const getProto = Object.getPrototypeOf ? (obj)=>Object.getPrototypeOf(obj) : (obj)=>obj.__proto__;
/** Prototypes that are not expanded for exports */ const LEAF_PROTOTYPES = [
    null,
    getProto({}),
    getProto([]),
    getProto(getProto)
];
/**
 * @param raw
 * @param ns
 * @param allowExportDefault
 *   * `false`: will have the raw module as default export
 *   * `true`: will have the default property as default export
 */ function interopEsm(raw, ns, allowExportDefault) {
    const getters = [];
    // The index of the `default` export if any
    let defaultLocation = -1;
    for(let current = raw; (typeof current === 'object' || typeof current === 'function') && !LEAF_PROTOTYPES.includes(current); current = getProto(current)){
        for (const key of Object.getOwnPropertyNames(current)){
            getters.push(key, createGetter(raw, key));
            if (defaultLocation === -1 && key === 'default') {
                defaultLocation = getters.length - 1;
            }
        }
    }
    // this is not really correct
    // we should set the `default` getter if the imported module is a `.cjs file`
    if (!(allowExportDefault && defaultLocation >= 0)) {
        // Replace the binding with one for the namespace itself in order to preserve iteration order.
        if (defaultLocation >= 0) {
            getters[defaultLocation] = ()=>raw;
        } else {
            getters.push('default', ()=>raw);
        }
    }
    esm(ns, getters);
    return ns;
}
function createNS(raw) {
    if (typeof raw === 'function') {
        return function(...args) {
            return raw.apply(this, args);
        };
    } else {
        return Object.create(null);
    }
}
function esmImport(id) {
    const module = getOrInstantiateModuleFromParent(id, this.m);
    // any ES module has to have `module.namespaceObject` defined.
    if (module.namespaceObject) return module.namespaceObject;
    // only ESM can be an async module, so we don't need to worry about exports being a promise here.
    const raw = module.exports;
    return module.namespaceObject = interopEsm(raw, createNS(raw), raw && raw.__esModule);
}
contextPrototype.i = esmImport;
function asyncLoader(moduleId) {
    const loader = this.r(moduleId);
    return loader(this.i.bind(this));
}
contextPrototype.A = asyncLoader;
// Add a simple runtime require so that environments without one can still pass
// `typeof require` CommonJS checks so that exports are correctly registered.
const runtimeRequire = // @ts-ignore
typeof require === 'function' ? require : function require1() {
    throw new Error('Unexpected use of runtime require');
};
contextPrototype.t = runtimeRequire;
function commonJsRequire(id) {
    return getOrInstantiateModuleFromParent(id, this.m).exports;
}
contextPrototype.r = commonJsRequire;
/**
 * `require.context` and require/import expression runtime.
 */ function moduleContext(map) {
    function moduleContext(id) {
        if (hasOwnProperty.call(map, id)) {
            return map[id].module();
        }
        const e = new Error(`Cannot find module '${id}'`);
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    }
    moduleContext.keys = ()=>{
        return Object.keys(map);
    };
    moduleContext.resolve = (id)=>{
        if (hasOwnProperty.call(map, id)) {
            return map[id].id();
        }
        const e = new Error(`Cannot find module '${id}'`);
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    };
    moduleContext.import = async (id)=>{
        return await moduleContext(id);
    };
    return moduleContext;
}
contextPrototype.f = moduleContext;
/**
 * Returns the path of a chunk defined by its data.
 */ function getChunkPath(chunkData) {
    return typeof chunkData === 'string' ? chunkData : chunkData.path;
}
function isPromise(maybePromise) {
    return maybePromise != null && typeof maybePromise === 'object' && 'then' in maybePromise && typeof maybePromise.then === 'function';
}
function isAsyncModuleExt(obj) {
    return turbopackQueues in obj;
}
function createPromise() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej)=>{
        reject = rej;
        resolve = res;
    });
    return {
        promise,
        resolve: resolve,
        reject: reject
    };
}
// Load the CompressedmoduleFactories of a chunk into the `moduleFactories` Map.
// The CompressedModuleFactories format is
// - 1 or more module ids
// - a module factory function
// So walking this is a little complex but the flat structure is also fast to
// traverse, we can use `typeof` operators to distinguish the two cases.
function installCompressedModuleFactories(chunkModules, offset, moduleFactories, newModuleId) {
    let i = offset;
    while(i < chunkModules.length){
        let moduleId = chunkModules[i];
        let end = i + 1;
        // Find our factory function
        while(end < chunkModules.length && typeof chunkModules[end] !== 'function'){
            end++;
        }
        if (end === chunkModules.length) {
            throw new Error('malformed chunk format, expected a factory function');
        }
        // Each chunk item has a 'primary id' and optional additional ids. If the primary id is already
        // present we know all the additional ids are also present, so we don't need to check.
        if (!moduleFactories.has(moduleId)) {
            const moduleFactoryFn = chunkModules[end];
            applyModuleFactoryName(moduleFactoryFn);
            newModuleId?.(moduleId);
            for(; i < end; i++){
                moduleId = chunkModules[i];
                moduleFactories.set(moduleId, moduleFactoryFn);
            }
        }
        i = end + 1; // end is pointing at the last factory advance to the next id or the end of the array.
    }
}
// everything below is adapted from webpack
// https://github.com/webpack/webpack/blob/6be4065ade1e252c1d8dcba4af0f43e32af1bdc1/lib/runtime/AsyncModuleRuntimeModule.js#L13
const turbopackQueues = Symbol('turbopack queues');
const turbopackExports = Symbol('turbopack exports');
const turbopackError = Symbol('turbopack error');
function resolveQueue(queue) {
    if (queue && queue.status !== 1) {
        queue.status = 1;
        queue.forEach((fn)=>fn.queueCount--);
        queue.forEach((fn)=>fn.queueCount-- ? fn.queueCount++ : fn());
    }
}
function wrapDeps(deps) {
    return deps.map((dep)=>{
        if (dep !== null && typeof dep === 'object') {
            if (isAsyncModuleExt(dep)) return dep;
            if (isPromise(dep)) {
                const queue = Object.assign([], {
                    status: 0
                });
                const obj = {
                    [turbopackExports]: {},
                    [turbopackQueues]: (fn)=>fn(queue)
                };
                dep.then((res)=>{
                    obj[turbopackExports] = res;
                    resolveQueue(queue);
                }, (err)=>{
                    obj[turbopackError] = err;
                    resolveQueue(queue);
                });
                return obj;
            }
        }
        return {
            [turbopackExports]: dep,
            [turbopackQueues]: ()=>{}
        };
    });
}
function asyncModule(body, hasAwait) {
    const module = this.m;
    const queue = hasAwait ? Object.assign([], {
        status: -1
    }) : undefined;
    const depQueues = new Set();
    const { resolve, reject, promise: rawPromise } = createPromise();
    const promise = Object.assign(rawPromise, {
        [turbopackExports]: module.exports,
        [turbopackQueues]: (fn)=>{
            queue && fn(queue);
            depQueues.forEach(fn);
            promise['catch'](()=>{});
        }
    });
    const attributes = {
        get () {
            return promise;
        },
        set (v) {
            // Calling `esmExport` leads to this.
            if (v !== promise) {
                promise[turbopackExports] = v;
            }
        }
    };
    Object.defineProperty(module, 'exports', attributes);
    Object.defineProperty(module, 'namespaceObject', attributes);
    function handleAsyncDependencies(deps) {
        const currentDeps = wrapDeps(deps);
        const getResult = ()=>currentDeps.map((d)=>{
                if (d[turbopackError]) throw d[turbopackError];
                return d[turbopackExports];
            });
        const { promise, resolve } = createPromise();
        const fn = Object.assign(()=>resolve(getResult), {
            queueCount: 0
        });
        function fnQueue(q) {
            if (q !== queue && !depQueues.has(q)) {
                depQueues.add(q);
                if (q && q.status === 0) {
                    fn.queueCount++;
                    q.push(fn);
                }
            }
        }
        currentDeps.map((dep)=>dep[turbopackQueues](fnQueue));
        return fn.queueCount ? promise : getResult();
    }
    function asyncResult(err) {
        if (err) {
            reject(promise[turbopackError] = err);
        } else {
            resolve(promise[turbopackExports]);
        }
        resolveQueue(queue);
    }
    body(handleAsyncDependencies, asyncResult);
    if (queue && queue.status === -1) {
        queue.status = 0;
    }
}
contextPrototype.a = asyncModule;
/**
 * A pseudo "fake" URL object to resolve to its relative path.
 *
 * When UrlRewriteBehavior is set to relative, calls to the `new URL()` will construct url without base using this
 * runtime function to generate context-agnostic urls between different rendering context, i.e ssr / client to avoid
 * hydration mismatch.
 *
 * This is based on webpack's existing implementation:
 * https://github.com/webpack/webpack/blob/87660921808566ef3b8796f8df61bd79fc026108/lib/runtime/RelativeUrlRuntimeModule.js
 */ const relativeURL = function relativeURL(inputUrl) {
    const realUrl = new URL(inputUrl, 'x:/');
    const values = {};
    for(const key in realUrl)values[key] = realUrl[key];
    values.href = inputUrl;
    values.pathname = inputUrl.replace(/[?#].*/, '');
    values.origin = values.protocol = '';
    values.toString = values.toJSON = (..._args)=>inputUrl;
    for(const key in values)Object.defineProperty(this, key, {
        enumerable: true,
        configurable: true,
        value: values[key]
    });
};
relativeURL.prototype = URL.prototype;
contextPrototype.U = relativeURL;
/**
 * Utility function to ensure all variants of an enum are handled.
 */ function invariant(never, computeMessage) {
    throw new Error(`Invariant: ${computeMessage(never)}`);
}
/**
 * A stub function to make `require` available but non-functional in ESM.
 */ function requireStub(_moduleId) {
    throw new Error('dynamic usage of require is not supported');
}
contextPrototype.z = requireStub;
// Make `globalThis` available to the module in a way that cannot be shadowed by a local variable.
contextPrototype.g = globalThis;
function applyModuleFactoryName(factory) {
    // Give the module factory a nice name to improve stack traces.
    Object.defineProperty(factory, 'name', {
        value: '__TURBOPACK__module__evaluation__'
    });
}
/* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="../shared/runtime-utils.ts" />
/// A 'base' utilities to support runtime can have externals.
/// Currently this is for node.js / edge runtime both.
/// If a fn requires node.js specific behavior, it should be placed in `node-external-utils` instead.
async function externalImport(id) {
    let raw;
    try {
        switch (id) {
  case "next/dist/compiled/@vercel/og/index.node.js":
    raw = await import("next/dist/compiled/@vercel/og/index.edge.js");
    break;
  default:
    raw = await import(id);
};
    } catch (err) {
        // TODO(alexkirsz) This can happen when a client-side module tries to load
        // an external module we don't provide a shim for (e.g. querystring, url).
        // For now, we fail semi-silently, but in the future this should be a
        // compilation error.
        throw new Error(`Failed to load external module ${id}: ${err}`);
    }
    if (raw && raw.__esModule && raw.default && 'default' in raw.default) {
        return interopEsm(raw.default, createNS(raw), true);
    }
    return raw;
}
contextPrototype.y = externalImport;
function externalRequire(id, thunk, esm = false) {
    let raw;
    try {
        raw = thunk();
    } catch (err) {
        // TODO(alexkirsz) This can happen when a client-side module tries to load
        // an external module we don't provide a shim for (e.g. querystring, url).
        // For now, we fail semi-silently, but in the future this should be a
        // compilation error.
        throw new Error(`Failed to load external module ${id}: ${err}`);
    }
    if (!esm || raw.__esModule) {
        return raw;
    }
    return interopEsm(raw, createNS(raw), true);
}
externalRequire.resolve = (id, options)=>{
    return require.resolve(id, options);
};
contextPrototype.x = externalRequire;
/* eslint-disable @typescript-eslint/no-unused-vars */ const path = require('path');
const relativePathToRuntimeRoot = path.relative(RUNTIME_PUBLIC_PATH, '.');
// Compute the relative path to the `distDir`.
const relativePathToDistRoot = path.join(relativePathToRuntimeRoot, RELATIVE_ROOT_PATH);
const RUNTIME_ROOT = path.resolve(__filename, relativePathToRuntimeRoot);
// Compute the absolute path to the root, by stripping distDir from the absolute path to this file.
const ABSOLUTE_ROOT = path.resolve(__filename, relativePathToDistRoot);
/**
 * Returns an absolute path to the given module path.
 * Module path should be relative, either path to a file or a directory.
 *
 * This fn allows to calculate an absolute path for some global static values, such as
 * `__dirname` or `import.meta.url` that Turbopack will not embeds in compile time.
 * See ImportMetaBinding::code_generation for the usage.
 */ function resolveAbsolutePath(modulePath) {
    if (modulePath) {
        return path.join(ABSOLUTE_ROOT, modulePath);
    }
    return ABSOLUTE_ROOT;
}
Context.prototype.P = resolveAbsolutePath;
/* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="../shared/runtime-utils.ts" />
function readWebAssemblyAsResponse(path) {
    const { createReadStream } = require('fs');
    const { Readable } = require('stream');
    const stream = createReadStream(path);
    // @ts-ignore unfortunately there's a slight type mismatch with the stream.
    return new Response(Readable.toWeb(stream), {
        headers: {
            'content-type': 'application/wasm'
        }
    });
}
async function compileWebAssemblyFromPath(path) {
    const response = readWebAssemblyAsResponse(path);
    return await WebAssembly.compileStreaming(response);
}
async function instantiateWebAssemblyFromPath(path, importsObj) {
    const response = readWebAssemblyAsResponse(path);
    const { instance } = await WebAssembly.instantiateStreaming(response, importsObj);
    return instance.exports;
}
/* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="../shared/runtime-utils.ts" />
/// <reference path="../shared-node/base-externals-utils.ts" />
/// <reference path="../shared-node/node-externals-utils.ts" />
/// <reference path="../shared-node/node-wasm-utils.ts" />
var SourceType = /*#__PURE__*/ function(SourceType) {
    /**
   * The module was instantiated because it was included in an evaluated chunk's
   * runtime.
   * SourceData is a ChunkPath.
   */ SourceType[SourceType["Runtime"] = 0] = "Runtime";
    /**
   * The module was instantiated because a parent module imported it.
   * SourceData is a ModuleId.
   */ SourceType[SourceType["Parent"] = 1] = "Parent";
    return SourceType;
}(SourceType || {});
process.env.TURBOPACK = '1';
const nodeContextPrototype = Context.prototype;
const url = require('url');
const moduleFactories = new Map();
nodeContextPrototype.M = moduleFactories;
const moduleCache = Object.create(null);
nodeContextPrototype.c = moduleCache;
/**
 * Returns an absolute path to the given module's id.
 */ function resolvePathFromModule(moduleId) {
    const exported = this.r(moduleId);
    const exportedPath = exported?.default ?? exported;
    if (typeof exportedPath !== 'string') {
        return exported;
    }
    const strippedAssetPrefix = exportedPath.slice(ASSET_PREFIX.length);
    const resolved = path.resolve(RUNTIME_ROOT, strippedAssetPrefix);
    return url.pathToFileURL(resolved).href;
}
nodeContextPrototype.R = resolvePathFromModule;
function loadRuntimeChunk(sourcePath, chunkData) {
    if (typeof chunkData === 'string') {
        loadRuntimeChunkPath(sourcePath, chunkData);
    } else {
        loadRuntimeChunkPath(sourcePath, chunkData.path);
    }
}
const loadedChunks = new Set();
const unsupportedLoadChunk = Promise.resolve(undefined);
const loadedChunk = Promise.resolve(undefined);
const chunkCache = new Map();
function clearChunkCache() {
    chunkCache.clear();
}
function loadRuntimeChunkPath(sourcePath, chunkPath) {
    if (!isJs(chunkPath)) {
        // We only support loading JS chunks in Node.js.
        // This branch can be hit when trying to load a CSS chunk.
        return;
    }
    if (loadedChunks.has(chunkPath)) {
        return;
    }
    try {
        const resolved = path.resolve(RUNTIME_ROOT, chunkPath);
        const chunkModules = requireChunk(chunkPath);
        installCompressedModuleFactories(chunkModules, 0, moduleFactories);
        loadedChunks.add(chunkPath);
    } catch (e) {
        let errorMessage = `Failed to load chunk ${chunkPath}`;
        if (sourcePath) {
            errorMessage += ` from runtime for chunk ${sourcePath}`;
        }
        throw new Error(errorMessage, {
            cause: e
        });
    }
}
function loadChunkAsync(chunkData) {
    const chunkPath = typeof chunkData === 'string' ? chunkData : chunkData.path;
    if (!isJs(chunkPath)) {
        // We only support loading JS chunks in Node.js.
        // This branch can be hit when trying to load a CSS chunk.
        return unsupportedLoadChunk;
    }
    let entry = chunkCache.get(chunkPath);
    if (entry === undefined) {
        try {
            // resolve to an absolute path to simplify `require` handling
            const resolved = path.resolve(RUNTIME_ROOT, chunkPath);
            // TODO: consider switching to `import()` to enable concurrent chunk loading and async file io
            // However this is incompatible with hot reloading (since `import` doesn't use the require cache)
            const chunkModules = requireChunk(chunkPath);
            installCompressedModuleFactories(chunkModules, 0, moduleFactories);
            entry = loadedChunk;
        } catch (e) {
            const errorMessage = `Failed to load chunk ${chunkPath} from module ${this.m.id}`;
            // Cache the failure promise, future requests will also get this same rejection
            entry = Promise.reject(new Error(errorMessage, {
                cause: e
            }));
        }
        chunkCache.set(chunkPath, entry);
    }
    // TODO: Return an instrumented Promise that React can use instead of relying on referential equality.
    return entry;
}
contextPrototype.l = loadChunkAsync;
function loadChunkAsyncByUrl(chunkUrl) {
    const path1 = url.fileURLToPath(new URL(chunkUrl, RUNTIME_ROOT));
    return loadChunkAsync.call(this, path1);
}
contextPrototype.L = loadChunkAsyncByUrl;
async function loadWebAssembly(chunkPath, _edgeModule, imports) {
  const mod = await loadWasmChunk(chunkPath);
  const { exports } = await WebAssembly.instantiate(mod, imports);
  return exports;
}
contextPrototype.w = loadWebAssembly;
function loadWebAssemblyModule(chunkPath, _edgeModule) {
  return loadWasmChunk(chunkPath);
}
contextPrototype.u = loadWebAssemblyModule;
function getWorkerBlobURL(_chunks) {
    throw new Error('Worker blobs are not implemented yet for Node.js');
}
nodeContextPrototype.b = getWorkerBlobURL;
function instantiateModule(id, sourceType, sourceData) {
    const moduleFactory = moduleFactories.get(id);
    if (typeof moduleFactory !== 'function') {
        // This can happen if modules incorrectly handle HMR disposes/updates,
        // e.g. when they keep a `setTimeout` around which still executes old code
        // and contains e.g. a `require("something")` call.
        let instantiationReason;
        switch(sourceType){
            case 0:
                instantiationReason = `as a runtime entry of chunk ${sourceData}`;
                break;
            case 1:
                instantiationReason = `because it was required from module ${sourceData}`;
                break;
            default:
                invariant(sourceType, (sourceType)=>`Unknown source type: ${sourceType}`);
        }
        throw new Error(`Module ${id} was instantiated ${instantiationReason}, but the module factory is not available.`);
    }
    const module1 = createModuleObject(id);
    const exports = module1.exports;
    moduleCache[id] = module1;
    const context = new Context(module1, exports);
    // NOTE(alexkirsz) This can fail when the module encounters a runtime error.
    try {
        moduleFactory(context, module1, exports);
    } catch (error) {
        module1.error = error;
        throw error;
    }
    module1.loaded = true;
    if (module1.namespaceObject && module1.exports !== module1.namespaceObject) {
        // in case of a circular dependency: cjs1 -> esm2 -> cjs1
        interopEsm(module1.exports, module1.namespaceObject);
    }
    return module1;
}
/**
 * Retrieves a module from the cache, or instantiate it if it is not cached.
 */ // @ts-ignore
function getOrInstantiateModuleFromParent(id, sourceModule) {
    const module1 = moduleCache[id];
    if (module1) {
        if (module1.error) {
            throw module1.error;
        }
        return module1;
    }
    return instantiateModule(id, 1, sourceModule.id);
}
/**
 * Instantiates a runtime module.
 */ function instantiateRuntimeModule(chunkPath, moduleId) {
    return instantiateModule(moduleId, 0, chunkPath);
}
/**
 * Retrieves a module from the cache, or instantiate it as a runtime module if it is not cached.
 */ // @ts-ignore TypeScript doesn't separate this module space from the browser runtime
function getOrInstantiateRuntimeModule(chunkPath, moduleId) {
    const module1 = moduleCache[moduleId];
    if (module1) {
        if (module1.error) {
            throw module1.error;
        }
        return module1;
    }
    return instantiateRuntimeModule(chunkPath, moduleId);
}
const regexJsUrl = /\.js(?:\?[^#]*)?(?:#.*)?$/;
/**
 * Checks if a given path/URL ends with .js, optionally followed by ?query or #fragment.
 */ function isJs(chunkUrlOrPath) {
    return regexJsUrl.test(chunkUrlOrPath);
}
module.exports = (sourcePath)=>({
        m: (id)=>getOrInstantiateRuntimeModule(sourcePath, id),
        c: (chunkData)=>loadRuntimeChunk(sourcePath, chunkData)
    });


//# sourceMappingURL=%5Bturbopack%5D_runtime.js.map

  function requireChunk(chunkPath) {
    switch(chunkPath) {
      case "server/chunks/ssr/[root-of-the-server]__fdefc251._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__fdefc251._.js");
      case "server/chunks/ssr/[turbopack]_runtime.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[turbopack]_runtime.js");
      case "server/chunks/ssr/[root-of-the-server]__1c22191f._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1c22191f._.js");
      case "server/chunks/ssr/[root-of-the-server]__334aff55._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__334aff55._.js");
      case "server/chunks/ssr/[externals]_next_dist_shared_lib_no-fallback-error_external_59b92b38.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[externals]_next_dist_shared_lib_no-fallback-error_external_59b92b38.js");
      case "server/chunks/ssr/node_modules_b235d39a._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_b235d39a._.js");
      case "server/chunks/ssr/node_modules_next_f71b9665._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_f71b9665._.js");
      case "server/chunks/ssr/[root-of-the-server]__1a4f2a5a._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1a4f2a5a._.js");
      case "server/chunks/ssr/[root-of-the-server]__400d6af9._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__400d6af9._.js");
      case "server/chunks/ssr/[root-of-the-server]__44163756._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__44163756._.js");
      case "server/chunks/ssr/[root-of-the-server]__5f0343b0._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__5f0343b0._.js");
      case "server/chunks/ssr/[root-of-the-server]__779aa2cd._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__779aa2cd._.js");
      case "server/chunks/ssr/[root-of-the-server]__854f6b0c._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__854f6b0c._.js");
      case "server/chunks/ssr/[root-of-the-server]__b9b63530._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__b9b63530._.js");
      case "server/chunks/ssr/[root-of-the-server]__cf021652._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__cf021652._.js");
      case "server/chunks/ssr/_0283cdaf._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_0283cdaf._.js");
      case "server/chunks/ssr/_fc6f93a9._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_fc6f93a9._.js");
      case "server/chunks/ssr/node_modules_c6edb212._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_c6edb212._.js");
      case "server/chunks/ssr/node_modules_next_dist_042de4b7._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_042de4b7._.js");
      case "server/chunks/ssr/node_modules_next_dist_48249126._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_48249126._.js");
      case "server/chunks/ssr/node_modules_next_dist_87cd44b0._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_87cd44b0._.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_2fffaa3a._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_2fffaa3a._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_b79d3a52._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_b79d3a52._.js");
      case "server/chunks/ssr/src_app_ca777385._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_ca777385._.js");
      case "server/chunks/ssr/src_app_error_8feb10ec.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_error_8feb10ec.js");
      case "server/chunks/ssr/src_app_loading_285101a8.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_loading_285101a8.js");
      case "server/chunks/ssr/[root-of-the-server]__3224e5a4._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__3224e5a4._.js");
      case "server/chunks/ssr/[root-of-the-server]__49d39bb3._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__49d39bb3._.js");
      case "server/chunks/ssr/[root-of-the-server]__9ea10b2a._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__9ea10b2a._.js");
      case "server/chunks/ssr/[root-of-the-server]__ee452741._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__ee452741._.js");
      case "server/chunks/ssr/_094b8011._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_094b8011._.js");
      case "server/chunks/ssr/_2873ad58._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_2873ad58._.js");
      case "server/chunks/ssr/_538f1544._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_538f1544._.js");
      case "server/chunks/ssr/_d72bcadf._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_d72bcadf._.js");
      case "server/chunks/ssr/_f34c98ed._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_f34c98ed._.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_builtin_global-error_ece394eb.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_builtin_global-error_ece394eb.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_builtin_unauthorized_15817684.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_builtin_unauthorized_15817684.js");
      case "server/chunks/ssr/node_modules_next_dist_fb290741._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_fb290741._.js");
      case "server/chunks/ssr/src_lib_supabase_admin_29f7ea6d.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/src_lib_supabase_admin_29f7ea6d.js");
      case "server/chunks/ssr/[root-of-the-server]__787b9516._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__787b9516._.js");
      case "server/chunks/ssr/_7502d0b8._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_7502d0b8._.js");
      case "server/chunks/ssr/_97531a61._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_97531a61._.js");
      case "server/chunks/ssr/_e43c2fdf._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_e43c2fdf._.js");
      case "server/chunks/ssr/[root-of-the-server]__f8f3cdfc._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__f8f3cdfc._.js");
      case "server/chunks/ssr/_983404d0._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_983404d0._.js");
      case "server/chunks/ssr/_a6cb313e._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_a6cb313e._.js");
      case "server/chunks/ssr/[root-of-the-server]__0b44c05a._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0b44c05a._.js");
      case "server/chunks/ssr/[root-of-the-server]__f0d7c722._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__f0d7c722._.js");
      case "server/chunks/ssr/_1fbea1da._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_1fbea1da._.js");
      case "server/chunks/ssr/_60ec300a._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_60ec300a._.js");
      case "server/chunks/ssr/node_modules_next_dist_3bd4d890._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_3bd4d890._.js");
      case "server/chunks/ssr/[root-of-the-server]__3ed00e09._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__3ed00e09._.js");
      case "server/chunks/ssr/_212d80f3._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_212d80f3._.js");
      case "server/chunks/ssr/[root-of-the-server]__728a51d0._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__728a51d0._.js");
      case "server/chunks/ssr/_26ac2d71._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_26ac2d71._.js");
      case "server/chunks/ssr/_63e27944._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_63e27944._.js");
      case "server/chunks/ssr/[root-of-the-server]__ace57784._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__ace57784._.js");
      case "server/chunks/ssr/_71cc3730._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_71cc3730._.js");
      case "server/chunks/ssr/src_components_marketing_FaqSection_2bdad6eb.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_marketing_FaqSection_2bdad6eb.js");
      case "server/chunks/ssr/[root-of-the-server]__a708f942._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__a708f942._.js");
      case "server/chunks/ssr/_3258c617._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_3258c617._.js");
      case "server/chunks/ssr/[root-of-the-server]__77bfcd7c._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__77bfcd7c._.js");
      case "server/chunks/ssr/_c20b2575._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_c20b2575._.js");
      case "server/chunks/ssr/[root-of-the-server]__66bafa40._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__66bafa40._.js");
      case "server/chunks/ssr/_2e689afd._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_2e689afd._.js");
      case "server/chunks/ssr/_b70d8a7e._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_b70d8a7e._.js");
      case "server/chunks/ssr/[root-of-the-server]__af2c7822._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__af2c7822._.js");
      case "server/chunks/ssr/_5e6860df._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_5e6860df._.js");
      case "server/chunks/ssr/src_app_(marketing)_page_1b847181.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_(marketing)_page_1b847181.js");
      case "server/chunks/ssr/[root-of-the-server]__70bc1f6b._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__70bc1f6b._.js");
      case "server/chunks/ssr/_0da72519._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_0da72519._.js");
      case "server/chunks/ssr/[root-of-the-server]__507fa302._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__507fa302._.js");
      case "server/chunks/ssr/[root-of-the-server]__5d0704a6._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__5d0704a6._.js");
      case "server/chunks/ssr/_72028997._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_72028997._.js");
      case "server/chunks/ssr/_c30f15e3._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_c30f15e3._.js");
      case "server/chunks/ssr/src_11c7a266._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/src_11c7a266._.js");
      case "server/chunks/ssr/[root-of-the-server]__147f0a4a._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__147f0a4a._.js");
      case "server/chunks/ssr/_0184a3c3._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_0184a3c3._.js");
      case "server/chunks/ssr/_33792477._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_33792477._.js");
      case "server/chunks/ssr/[root-of-the-server]__4c58bd59._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__4c58bd59._.js");
      case "server/chunks/ssr/_383b2dd2._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_383b2dd2._.js");
      case "server/chunks/ssr/_66fd0d89._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_66fd0d89._.js");
      case "server/chunks/ssr/_90b0dd5c._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_90b0dd5c._.js");
      case "server/chunks/ssr/[root-of-the-server]__719155ee._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__719155ee._.js");
      case "server/chunks/ssr/_1fa00e11._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_1fa00e11._.js");
      case "server/chunks/ssr/_dc585f47._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_dc585f47._.js");
      case "server/chunks/ssr/[root-of-the-server]__6b3462af._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__6b3462af._.js");
      case "server/chunks/ssr/_afeccbb3._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_afeccbb3._.js");
      case "server/chunks/ssr/_f1cc43bf._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_f1cc43bf._.js");
      case "server/chunks/ssr/[root-of-the-server]__2e4dd7f6._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__2e4dd7f6._.js");
      case "server/chunks/ssr/_52ed0920._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_52ed0920._.js");
      case "server/chunks/ssr/_e35c7e86._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_e35c7e86._.js");
      case "server/chunks/[root-of-the-server]__288cc257._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__288cc257._.js");
      case "server/chunks/[root-of-the-server]__703022d1._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__703022d1._.js");
      case "server/chunks/[turbopack]_runtime.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[turbopack]_runtime.js");
      case "server/chunks/_e950571a._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/_e950571a._.js");
      case "server/chunks/node_modules_zod_v4_classic_external_fa90cebf.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/node_modules_zod_v4_classic_external_fa90cebf.js");
      case "server/chunks/src_lib_supabase_admin_be54e07c.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/src_lib_supabase_admin_be54e07c.js");
      case "server/chunks/[root-of-the-server]__f087829e._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__f087829e._.js");
      case "server/chunks/[root-of-the-server]__f5d0b184._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__f5d0b184._.js");
      case "server/chunks/[root-of-the-server]__9a21c7d4._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__9a21c7d4._.js");
      case "server/chunks/[root-of-the-server]__aff020c1._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__aff020c1._.js");
      case "server/chunks/[root-of-the-server]__be15180c._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__be15180c._.js");
      case "server/chunks/[root-of-the-server]__793b0cfa._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__793b0cfa._.js");
      case "server/chunks/[root-of-the-server]__78ac6cf8._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__78ac6cf8._.js");
      case "server/chunks/[root-of-the-server]__899b46e7._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__899b46e7._.js");
      case "server/chunks/[root-of-the-server]__de4e9f27._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__de4e9f27._.js");
      case "server/chunks/[root-of-the-server]__e5973b55._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__e5973b55._.js");
      case "server/chunks/[root-of-the-server]__f402f50c._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__f402f50c._.js");
      case "server/chunks/[root-of-the-server]__b3a92ed2._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__b3a92ed2._.js");
      case "server/chunks/[root-of-the-server]__7346cbe5._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__7346cbe5._.js");
      case "server/chunks/[root-of-the-server]__8a245f8d._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__8a245f8d._.js");
      case "server/chunks/[root-of-the-server]__f7dca03b._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__f7dca03b._.js");
      case "server/chunks/[root-of-the-server]__6b8bb223._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__6b8bb223._.js");
      case "server/chunks/[root-of-the-server]__3ca82714._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__3ca82714._.js");
      case "server/chunks/[root-of-the-server]__3a3f2b73._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__3a3f2b73._.js");
      case "server/chunks/[root-of-the-server]__b855af73._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__b855af73._.js");
      case "server/chunks/[root-of-the-server]__19d2b2a6._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__19d2b2a6._.js");
      case "server/chunks/[root-of-the-server]__ccaeddde._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__ccaeddde._.js");
      case "server/chunks/[root-of-the-server]__21e21674._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__21e21674._.js");
      case "server/chunks/[root-of-the-server]__7fb2bf73._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__7fb2bf73._.js");
      case "server/chunks/[root-of-the-server]__6457bd23._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__6457bd23._.js");
      case "server/chunks/[root-of-the-server]__1c17d149._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1c17d149._.js");
      case "server/chunks/[root-of-the-server]__ae45c141._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__ae45c141._.js");
      case "server/chunks/[root-of-the-server]__c5cfad58._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__c5cfad58._.js");
      case "server/chunks/[root-of-the-server]__eca1087a._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__eca1087a._.js");
      case "server/chunks/[root-of-the-server]__dea52e39._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__dea52e39._.js");
      case "server/chunks/[root-of-the-server]__af544b3d._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__af544b3d._.js");
      case "server/chunks/[root-of-the-server]__9cc9d2e9._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__9cc9d2e9._.js");
      case "server/chunks/ssr/[root-of-the-server]__2b5d9bc3._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__2b5d9bc3._.js");
      case "server/chunks/ssr/[root-of-the-server]__6e767a79._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__6e767a79._.js");
      case "server/chunks/ssr/_871d7dbd._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_871d7dbd._.js");
      case "server/chunks/ssr/src_16c05794._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/src_16c05794._.js");
      case "server/chunks/ssr/[root-of-the-server]__28f3d271._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__28f3d271._.js");
      case "server/chunks/ssr/_5551a144._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_5551a144._.js");
      case "server/chunks/ssr/_66ce2055._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_66ce2055._.js");
      case "server/chunks/ssr/[root-of-the-server]__d105e9d3._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__d105e9d3._.js");
      case "server/chunks/ssr/_0371a047._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_0371a047._.js");
      case "server/chunks/ssr/_5a144536._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_5a144536._.js");
      case "server/chunks/ssr/[root-of-the-server]__4f18e6c1._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__4f18e6c1._.js");
      case "server/chunks/ssr/_8cc21707._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_8cc21707._.js");
      case "server/chunks/ssr/[root-of-the-server]__0b4e0a0f._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0b4e0a0f._.js");
      case "server/chunks/ssr/_0a2c3d51._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_0a2c3d51._.js");
      case "server/chunks/ssr/_1a16839b._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_1a16839b._.js");
      case "server/chunks/ssr/_d34e2c62._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_d34e2c62._.js");
      case "server/chunks/ssr/src_6071c31f._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/src_6071c31f._.js");
      case "server/chunks/ssr/src_components_games_impl_0ff7da65._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_games_impl_0ff7da65._.js");
      case "server/chunks/ssr/src_components_games_impl_13c37954._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_games_impl_13c37954._.js");
      case "server/chunks/ssr/src_components_games_impl_48e98154._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_games_impl_48e98154._.js");
      case "server/chunks/ssr/src_components_games_impl_6df525c6._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_games_impl_6df525c6._.js");
      case "server/chunks/ssr/src_components_games_impl_752c1d92._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_games_impl_752c1d92._.js");
      case "server/chunks/ssr/src_components_games_impl_77fdeda4._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_games_impl_77fdeda4._.js");
      case "server/chunks/ssr/src_components_games_impl_85af593c._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_games_impl_85af593c._.js");
      case "server/chunks/ssr/src_components_games_impl_d28911f9._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_games_impl_d28911f9._.js");
      case "server/chunks/ssr/src_components_games_impl_eb7481e4._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_games_impl_eb7481e4._.js");
      case "server/chunks/ssr/[root-of-the-server]__cdada556._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__cdada556._.js");
      case "server/chunks/ssr/_ddaac841._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_ddaac841._.js");
      case "server/chunks/ssr/_e17b8192._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_e17b8192._.js");
      case "server/chunks/ssr/[root-of-the-server]__5b137a50._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__5b137a50._.js");
      case "server/chunks/ssr/_52fb3336._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_52fb3336._.js");
      case "server/chunks/ssr/_c0fc67bc._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_c0fc67bc._.js");
      case "server/chunks/ssr/[root-of-the-server]__b9d19a43._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__b9d19a43._.js");
      case "server/chunks/ssr/_423988c3._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_423988c3._.js");
      case "server/chunks/ssr/[root-of-the-server]__cc4e99a5._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__cc4e99a5._.js");
      case "server/chunks/ssr/_3b4ccef0._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_3b4ccef0._.js");
      case "server/chunks/ssr/_98cabbb0._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_98cabbb0._.js");
      case "server/chunks/ssr/[root-of-the-server]__62685bfc._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__62685bfc._.js");
      case "server/chunks/ssr/_8775b256._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_8775b256._.js");
      case "server/chunks/ssr/_ee73a5c5._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_ee73a5c5._.js");
      case "server/chunks/ssr/[root-of-the-server]__d982760e._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__d982760e._.js");
      case "server/chunks/ssr/_28c2e3f2._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_28c2e3f2._.js");
      case "server/chunks/ssr/_999f2a29._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_999f2a29._.js");
      case "server/chunks/ssr/[root-of-the-server]__8b579ffb._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__8b579ffb._.js");
      case "server/chunks/ssr/_693b7fe7._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_693b7fe7._.js");
      case "server/chunks/ssr/_7d4304fb._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_7d4304fb._.js");
      case "server/chunks/ssr/[root-of-the-server]__edcda7f9._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__edcda7f9._.js");
      case "server/chunks/ssr/_5974fd33._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_5974fd33._.js");
      case "server/chunks/ssr/[root-of-the-server]__5b915c43._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__5b915c43._.js");
      case "server/chunks/ssr/_05d295a7._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_05d295a7._.js");
      case "server/chunks/ssr/_baf36812._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_baf36812._.js");
      case "server/chunks/ssr/[root-of-the-server]__102cbc84._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__102cbc84._.js");
      case "server/chunks/ssr/_642b1974._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_642b1974._.js");
      case "server/chunks/ssr/_bbe0aa5e._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_bbe0aa5e._.js");
      case "server/chunks/ssr/[root-of-the-server]__2bcbbc5b._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__2bcbbc5b._.js");
      case "server/chunks/ssr/_bc1dfdb7._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_bc1dfdb7._.js");
      case "server/chunks/ssr/[root-of-the-server]__cf514182._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__cf514182._.js");
      case "server/chunks/ssr/_748ee104._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_748ee104._.js");
      case "server/chunks/ssr/_8d5b086f._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/ssr/_8d5b086f._.js");
      case "server/chunks/[root-of-the-server]__1ba5453a._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1ba5453a._.js");
      case "server/chunks/[root-of-the-server]__f632b351._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__f632b351._.js");
      case "server/chunks/[root-of-the-server]__aab9247a._.js": return require("E:/others web/Income-site/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__aab9247a._.js");
      default:
        throw new Error(`Not found ${chunkPath}`);
    }
  }


  async function loadWasmChunk(chunkPath) {
    switch (chunkPath) {

      default:
        throw new Error(`Unknown wasm chunk: ${chunkPath}`);
    }
  }
