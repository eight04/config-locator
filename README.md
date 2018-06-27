config-locator
==============

[![Build Status](https://travis-ci.org/eight04/config-locator.svg?branch=master)](https://travis-ci.org/eight04/config-locator)
[![codecov](https://codecov.io/gh/eight04/config-locator/branch/master/graph/badge.svg)](https://codecov.io/gh/eight04/config-locator)
[![install size](https://packagephobia.now.sh/badge?p=config-locator)](https://packagephobia.now.sh/result?p=config-locator)

Find the config file from ancestor folders.

Features
--------

* The result is cached.
* Load CommonJS modules or JSON files.
* Everything runs asynchronously.

Installation
------------
```
npm install config-locator
```

Usage
------

```js
const {createConfigLocator} = require("config-locator");
/*
- my-config.js
- src:
  - index.js
  - lib:
    - some-file.js
*/
const locator = createConfigLocator({
  config: [
    "my-config.json",
    "my-config.js"
  ]
});
const result = await locator.findConfig("src/lib/some-file.js");
const result2 = await locator.findConfig("src/index.js");

result.filename === result2.filename; // true
result.config === result2.config; // true
```

API
----

This module exports following members:

* `findConfig(file, options)` - find config fore `file`.
* `createConfigLocator(options)` - create a config locator.

### findConfig

```js
async findConfig(file: String, options: Object) => null|Array|Object
```

This is a shortcut of `createConfigLocator(options).findConfig(file)`.

### createConfigLocator

```js
createConfigLocator(options: Object) => locator
```

`options` has following properties:

* `config: String|Array<String>` - the filename of the config file(s). The locator would check if these files are in the directory.
* `findAll?: Boolean` - by default, the locator would return the first found config file. If `findAll` is `true` then find all config files. Default: `false`.
* `stopAtRoot?: Boolean` - stop finding if `package.json` is found in the directory. Default: `true`.
* `stopAt?: (dirname: String, pendingConfig: Promise) => shouldStop: Boolean|Promise<Boolean>` - a hook to customize when to stop finding. The function could be async.
* `extensions?: {extensionName: filename => null|config}` - a plain object that map each extension name (e.g. `.js`) to a loader function. The loader function should return `null` if `filename` doesn't exist. By default, the locator uses [node-require-async](https://www.npmjs.com/package/node-require-async) to load `.js` and `.json` files.

  The loader function may return a promise.
  
* `race?: Boolean` - by default, when finding multiple configs in the same directory, the locator reads the file in parallel (but ordered). If a config file is found (i.e. the loader returns a truthy value), the locator returns the config immediately.

  If `race` is `false`, the locator would wait for all loaders to finish and return the first found config.
  
  This option has no effect if `config` has only one item or `findAll` is true.
  
  Default: `true`.

`locator` has following methods:

* `async findConfig(filename) => null|result|Array<result>` - find the config for `file`. It's a shortcut to `searchDir(path.dirname(file))`.
* `async searchDir(dirname) => null|result|Array<result>` - start searching the config from `dirname`.

  `result` is an object `{filename, config}` that `filename` is the filename of the config and `config` is the object returned by the loader function registered in `options.extensions`.
  
  If `options.findAll` is `true` then it would be an array of result objects.
  
* `clearCache()` - clear the cache. *Note that this function only clears the cache of config locator, you may want to remove the module from `require.cache` that is created by `node-require-async`.*
* `async close()` - make sure all files are closed i.e. all loaders have finished.

Changelog
---------

* 0.1.0 (Jun 27, 2018)

    - First release.
