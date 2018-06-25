/* eslint-env mocha */
const assert = require("assert");
// const sinon = require("sinon");
const temp = require("temporarily");

function buildDir(name, children) {
  if (typeof name !== "string") {
    children = name;
    name = undefined;
  }
  return temp.dir(
    {name},
    children.map(c => {
      if (typeof c === "string") {
        return temp.file({name: c});
      }
      const [name, data] = c;
      if (typeof data === "string") {
        return temp.file({name, data});
      }
      return buildDir(name, data);
    })
  );
}

describe("find config", () => {
  const path = require("path");
  const {findConfig} = require("..");
  
  function test(options) {
    // prepare dir
    const dir = buildDir(options.dir || []);
    options.entry = path.join(dir.filepath, options.entry);
    (Array.isArray(options.expect) ? options.expect : [options.expect])
      .forEach(o => {
        if (!o) return;
        o.filename = path.join(dir.filepath, o.filename);
      });
    return findConfig(options.entry, options)
      .then(result => {
        assert.deepEqual(result, options.expect);
      });
  }
  
  it("read js, json files", () =>
    test({
      config: [
        "config.json", // the order of config would affect the order of the result
        "config.js"
      ],
      findAll: true,
      entry: "dummy",
      dir: [
        "package.json",
        ["config.js", "module.exports = {foo: 'foo'};"],
        ["config.json", JSON.stringify({bar: "bar"})]
      ],
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
  
  it("find in ancestor", () =>
    test({
      config: "config.js",
      entry: "foo/dummy",
      dir: [
        "package.json",
        ["config.js", "exports.foo = 'foo'"],
        ["foo", []]
      ],
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
      dir: [
        ["config.js", "exports.foo = 'foo'"],
        ["foo", [
          "package.json"
        ]]
      ],
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
