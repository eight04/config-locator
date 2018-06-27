const path = require("path");
const fsAccess = require("util").promisify(require("fs").access);
const requireAsync = require("node-require-async")(module);

function tryAccess(file) {
  return fsAccess(file)
    .then(() => true)
    .catch(() => false);
}

function tryRequire(file) {
  return requireAsync(file)
    .catch(() => null);
}

const DEFAULT_EXTENSIONS = {
  ".js": tryRequire,
  ".json": tryRequire
};

function createConfigLocator({
  config,
  findAll = false,
  stopAtRoot = true,
  stopAt = null,
  extensions = null,
  race = true,
  _tryAccess = tryAccess
}) {
  const cache = new Map;
  let closing = Promise.resolve();
  extensions = Object.assign({}, DEFAULT_EXTENSIONS, extensions);
  config = (Array.isArray(config) ? config : [config])
    .map(filename => {
      const loader = extensions[path.extname(filename)];
      return {filename, loader};
    });
  return {findConfig, searchDir, clearCache, close};
  
  function clearCache() {
    cache.clear();
  }
  
  function close() {
    return closing;
  }
  
  function findConfig(file) {
    let dir = path.dirname(path.resolve(file));
    return searchDir(dir);
  }
  
  function waitAll(promises) {
    return Promise.all(promises)
      .then(result => result.filter(Boolean));
  }
  
  function getFirst(promises) {
    if (race) {
      return promises.reduce((pending, curr) =>
        pending.then(value => {
          if (value) {
            closing = closing.then(() => curr);
            return value;
          }
          return curr;
        })
      );
    }
    return waitAll(promises)
      .then(result => result.length ? result[0] : null);
  }
  
  function searchDir(dir) {
    const cachedResult = cache.get(dir);
    if (cachedResult) {
      return cachedResult;
    }
    const pendingRoot = stopAtRoot ? _tryAccess(path.join(dir, "package.json")) : Promise.resolve(false);
    const pendingConfig = (findAll ? waitAll : getFirst)(config.map(({filename, loader}) => {
      filename = path.join(dir, filename);
      return Promise.resolve(loader(filename))
        .then(obj => obj ? {filename, config: obj} : null);
    }));
    const pendingStop = stopAt ? stopAt(dir, pendingConfig) : Promise.resolve(false);
    const pending = Promise.all([pendingRoot, pendingStop])
      .then(shouldStop => {
        shouldStop = shouldStop.reduce((a, b) => a || b);
        return pendingConfig
          .then(config => {
            const parentDir = path.dirname(dir);
            if (config && !findAll || shouldStop || parentDir === dir) {
              return config;
            }
            return searchDir(parentDir)
              .then(parentConfig =>
                findAll ? config.concat(parentConfig) : parentConfig
              );
          });
      });
    cache.set(dir, pending);
    return pending;
  }
}

module.exports = {
  findConfig: (file, options) => createConfigLocator(options).findConfig(file),
  createConfigLocator,
  tryRequire,
  tryAccess
};
