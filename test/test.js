/* eslint-env mocha */
const assert = require("assert");
// const sinon = require("sinon");
// const temp = require("temporarily");
const {makeDir} = require("tempdir-yaml");

describe("find config", () => {
  const {findConfig} = require("..");
  
  function test(options) {
    // prepare dir
    const resolve = makeDir(options.dir || "{}");
    options.entry = resolve(options.entry);
    (Array.isArray(options.expect) ? options.expect : [options.expect])
      .forEach(o => {
        if (!o) return;
        o.filename = resolve(o.filename);
      });
    return findConfig(options.entry, options)
      .then(result => {
        assert.deepEqual(result, options.expect);
      });
  }
  
  it("read js, json files", () =>
    test({
      config: [
        "config.js", // the order of the config would affect the order of the result
        "config.json"
      ],
      findAll: true,
      entry: "dummy",
      dir: `
        - package.json
        - config.js: |
            module.exports = {foo: "foo"};
        - config.json: |
            {"bar": "bar"}
      `,
      expect: [
        {
          filename: "config.js",
          config: {foo: "foo"}
        },
        {
          filename: "config.json",
          config: {bar: "bar"}
        }
      ]
    })
  );
  
  it("read first", () =>
    test({
      config: [
        "b.js",
        "a.js"
      ],
      entry: "dummy",
      dir: `
        - package.json
        - a.js: |
            module.exports = "A";
        - b.js: |
            module.exports = "B";
      `,
      expect: {
        filename: "b.js",
        config: "B"
      }
    })
  );
  
  it("read second", () =>
    test({
      config: [
        "b.js",
        "a.js"
      ],
      entry: "dummy",
      dir: `
        - package.json
        - a.js: |
            module.exports = "A";
      `,
      expect: {
        filename: "a.js",
        config: "A"
      }
    })
  );
  
  it("find in ancestor", () =>
    test({
      config: "config.js",
      entry: "foo/dummy",
      dir: `
        - package.json
        - config.js: |
            exports.foo = 'foo';
        - foo:
      `,
      expect: {
        filename: "config.js",
        config: {foo: "foo"}
      }
    })
  );
  
  it("stop at package root", () =>
    test({
      config: "config.js",
      entry: "foo/dummy",
      dir: `
        - config.js: |
            exports.foo = 'foo';
        - foo:
          - package.json
      `,
      expect: null
    })
  );
  
  it("stop at root", () =>
    test({
      config: "config.js",
      entry: "/",
      expect: null
    })
  );
  
  // it("cache", () => {
    // const {tryRequire, tryAccess} = require("../lib/conf");
    // const _tryRequire = sinon.spy(tryRequire);
    // const _tryAccess = sinon.spy(tryAccess);
    // const conf = createConfigLocator({_tryRequire, _tryAccess});
    // return Promise.all([
      // conf.findConfig(`${__dirname}/conf/test`),
      // conf.findConfig(`${__dirname}/conf/b/test`)
    // ])
      // .then(([conf1, conf2]) => {
        // assert.equal(conf1, conf2);
        // assert(_tryRequire.calledTwice);
        // assert(_tryAccess.calledTwice);
      // });
  // });
});
