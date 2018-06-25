config-locator
==============

[![Build Status](https://travis-ci.org/eight04/config-locator.svg?branch=master)](https://travis-ci.org/eight04/config-locator)
[![Coverage Status](https://coveralls.io/repos/github/eight04/config-locator/badge.svg?branch=master)](https://coveralls.io/github/eight04/config-locator?branch=master)
[![install size](https://packagephobia.now.sh/badge?p=config-locator)](https://packagephobia.now.sh/result?p=config-locator)

Find the config file from ancestor folders.

Features
--------

* The result is cached.
* Load CommonJS module or JSON file asynchronously.
* Everything runs asynchronously.
* Customizable.

Installation
------------
```
npm install config-locator
```

API reference
-------------

This module exports following members:

* `findConfig(file, options)` - find config fore `file`.
* `createConfigLocator(options)` - create a `ConfigLocator`.

### findConfig(file: String, options: Object) => null|FindConfigResult

This is a shortcut of `createConfigLocator(options).findConfig(file)`.

### createConfigLocator(options: Object) => ConfigLocator

`options` has following properties:

* `config: String|Array<String>` - the filename of the config file(s). The locator would check if these files are in the directory.
* `findAll?: Boolean` - by default, the locator would return the first found config file. If `findAll` is `true` then find all config files. Default: `false`.
* `stopAtRoot?: Boolean` - stop finding if `package.json` is found in the directory. Default: `true`.
* `stopAt?: (dirname: String, pendingConfig: Promise) => shouldStop: Boolean` - a hook to customize when to stop finding. The function could be async.
* `extensions: {extensionName: filename => configObject}` - a plain object that map each extension name (e.g. `.js`) to a loader function. Return `null` if `filename` doesn't exist. The locator uses [node-require-async](https://www.npmjs.com/package/node-require-async) to load `.js` and `.json` files by default.

`stopAt` and the functions registered in `extensions` may return `Promise`.

### ConfigLocator

* `findConfig(filename) => null|FindConfigResult` - find the config for `file`. It's a shortcut to `searchDir(path.dirname(file))`.
* `searchDir(dirname) => null|FindConfigResult` - start searching the config from `dirname`.
* `clearCache()` - clear the cache. *Note that this function only clears the cache of config locator not `require.cache` which is used by `node-require-async`.*

### FindConfigResult

The result is an object `{filename, config}` that `filename` is the filename of the config and `config` is the object returned by the loader function registered in `options.extensions`.

If `options.findAll` is `true` then it would be an array of result objects described above.

Changelog
---------

* 0.1.0 (next)

    - First release.
