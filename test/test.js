/* eslint-env mocha */
const assert = require("assert");
const fs = require("fs");

const sinon = require("sinon");
const {withDir} = require("tempdir-yaml");

const {findConfig, createConfigLocator} = require("..");

const SUITS = [
  {
    title: "find config",
    options: null
  },
  {
    title: "find config no race",
    options: {race: false}
  }
];

for (const suit of SUITS) {
  describe(suit.title, () => testFindConfig(suit.options));
}
  
function testFindConfig(DEFAULT_OPTIONS) {
  function test(options) {
    options = Object.assign({}, DEFAULT_OPTIONS, options);
    return withDir(options.dir, resolve => {
      options.entry = resolve(options.entry);
      (Array.isArray(options.expect) ? options.expect : [options.expect])
        .forEach(o => {
          if (!o) return;
          o.filename = resolve(o.filename);
        });
      if (options.race !== false) {
        const locator = createConfigLocator(options);
        return locator.findConfig(options.entry)
          .then(result =>
            // make sure the files are closed
            locator.close()
              .then(() => result)
          );
      }
      return findConfig(options.entry, options);
    })
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
  
  it("don't stop at package root", () =>
    test({
      config: "config.js",
      entry: "foo/dummy",
      stopAtRoot: false,
      dir: `
        - config.js: |
            exports.foo = 'foo';
        - foo:
          - package.json
      `,
      expect: {
        filename: "config.js",
        config: {foo: "foo"}
      }
    })
  );
  
  it("stop at root", () =>
    test({
      config: "config.js",
      entry: "/",
      expect: null
    })
  );
  
  it("stop at", () =>
    test({
      config: "config.js",
      entry: "foo/bar/dummy",
      dir: `
        - config.js
        - foo:
          - config.js: |
              exports.root = true;
          - bar:
            - config.js
      `,
      findAll: true,
      stopAt: (dirname, pendingConfig) =>
        pendingConfig.then(config => config.some(c => c && c.config && c.config.root)),
      expect: [
        {
          filename: "foo/bar/config.js",
          config: {}
        },
        {
          filename: "foo/config.js",
          config: {root: true}
        }
      ]
    })
  );
  
  it("cache", () =>
    withDir(`
      - package.json
      - config.js
    `, resolve => {
      const loader = sinon.spy(filename => {
        try {
          return {
            content: fs.readFileSync(filename, "utf8")
          };
        } catch(err) {
          // pass
        }
      });
      const locator = createConfigLocator({
        config: "config.js",
        extensions: {
          ".js": loader
        }
      });
      return Promise.all([
        locator.findConfig(resolve("foo")),
        locator.findConfig(resolve("bar"))
      ])
        .then(result => {
          assert.equal(result[0].config.content, "");
          assert.equal(result[0], result[1]);
          assert(loader.calledOnce);
          locator.clearCache();
          return locator.findConfig("baz");
        })
        .then(() => {
          assert(loader.calledTwice);
        });
    })
  );
}
