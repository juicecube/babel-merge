import test from 'ava';
import { loadPartialConfig } from '@babel/core';
import omit from 'object.omit';
import babelMerge from '../src';

function formatBabelConfig({ file, options }) {
  return options ? [file.resolved, options] : file.resolved;
}

test('should deeply merge preset options', t => {
  t.deepEqual(
    babelMerge(
      {
        presets: [
          ['@babel/env', {
            module: true,
            targets: {
              browsers: [
                'latest 1 Chrome'
              ]
            }
          }]
        ]
      },
      {
        presets: [
          ['@babel/env', {
            targets: {
              browsers: [
                'latest 1 Firefox'
              ]
            }
          }]
        ]
      }
    ),
    {
      presets: [
        [require.resolve('@babel/preset-env'), {
          module: true,
          targets: {
            browsers: [
              'latest 1 Firefox'
            ]
          }
        }]
      ]
    }
  );
});

test('should merge by resolved name', t => {
  t.deepEqual(
    babelMerge(
      {
        presets: [
          [require.resolve('@babel/preset-env'), {
            targets: {
              browsers: [
                'latest 1 Chrome'
              ]
            }
          }]
        ]
      },
      {
        presets: [
          ['@babel/env', {
            targets: {
              browsers: [
                'latest 1 Firefox'
              ]
            }
          }]
        ]
      }
    ),
    {
      presets: [
        [require.resolve('@babel/preset-env'), {
          targets: {
            browsers: [
              'latest 1 Firefox'
            ]
          }
        }]
      ]
    }
  );
});

test('should merge env options', t => {
  t.deepEqual(
    babelMerge(
      {
        env: {
          development: {
            presets: [
              [require.resolve('@babel/preset-env'), {
                targets: {
                  browsers: [
                    'latest 1 Chrome'
                  ]
                }
              }]
            ]
          }
        }
      },
      {
        env: {
          development: {
            presets: [
              ['@babel/env', {
                targets: {
                  browsers: [
                    'latest 1 Firefox'
                  ]
                }
              }]
            ]
          }
        }
      }
    ),
    {
      env: {
        development: {
          presets: [
            [require.resolve('@babel/preset-env'), {
              targets: {
                browsers: [
                  'latest 1 Firefox'
                ]
              }
            }]
          ]
        }
      }
    }
  );
});

test('should preserve plugin / preset order', t => {
  t.deepEqual(
    babelMerge(
      {
        presets: [
          './test/local-preset'
        ],
        plugins: [
          'module:fast-async',
          '@babel/plugin-syntax-dynamic-import',
          './test/local-plugin'
        ]
      },
      {
        presets: [
          '@babel/env'
        ],
        plugins: [
          ['./test/local-plugin', { foo: 'bar' }],
          '@babel/plugin-proposal-object-rest-spread',
          ['module:fast-async', { spec: true }],
          '@babel/plugin-proposal-class-properties'
        ]
      }
    ),
    {
      presets: [
        require.resolve('./local-preset'),
        require.resolve('@babel/preset-env')
      ],
      plugins: [
        [require.resolve('fast-async'), { 'spec': true }],
        require.resolve('@babel/plugin-syntax-dynamic-import'),
        [require.resolve('./local-plugin'), { foo: 'bar' }],
        require.resolve('@babel/plugin-proposal-object-rest-spread'),
        require.resolve('@babel/plugin-proposal-class-properties')
      ]
    }
  );
});

test('should merge an array of config objects', t => {
  t.deepEqual(
    babelMerge.all([
      {
        presets: [
          require.resolve('@babel/preset-env')
        ]
      },
      {
        presets: [
          '@babel/preset-env'
        ]
      },
      {
        presets: [
          '@babel/env'
        ]
      }
    ]),
    {
      presets: [
        require.resolve('@babel/preset-env')
      ]
    }
  );
});

test('should dedupe merged arrays', t => {
  t.deepEqual(
    babelMerge.all([
      {
        presets: [
          [require.resolve('@babel/preset-env'), {
            module:false,
            targets: {
              browsers: [
                'latest 1 Chrome'
              ]
            }
          }]
        ]
      },
      {
        presets: [
          ['@babel/preset-env', {
            targets: {
              browsers: [
                'latest 1 Chrome'
              ]
            }
          }]
        ]
      },
      {
        presets: [
          ['@babel/env', {
            targets: {
              browsers: [
                'latest 1 Chrome'
              ]
            }
          }]
        ]
      }
    ]),
    {
      presets: [
        [require.resolve('@babel/preset-env'), {
          module: false,
          targets: {
            browsers: [
              'latest 1 Chrome'
            ]
          }
        }]
      ]
    }
  );
});

test('should support ES6+ data structures', t => {
  const a = {
    Map: new Map([['a', 'a']]),
    Set: new Set(['a']),
    WeakMap: new WeakMap([[{ a: true }, 'a']]),
    WeakSet: new WeakSet([{ a: true }])
  };

  const b = {
    Map: new Map([['b', 'b']]),
    Set: new Set(['b']),
    WeakMap: new WeakMap([[{ b: true }, 'b']]),
    WeakSet: new WeakSet([{ b: true }])
  };

  const c = {
    Map: new Map([['c', 'c']]),
    Set: new Set(['c']),
    WeakMap: new WeakMap([[{ c: true }, 'c']]),
    WeakSet: new WeakSet([{ c: true }])
  };

  t.deepEqual(
    babelMerge.all([
      { presets: [[require.resolve('@babel/preset-env'), a]] },
      { presets: [['@babel/preset-env', b]] },
      { presets: [['@babel/env', c]] }
    ]),
    {
      presets: [
        [require.resolve('@babel/preset-env'), c]
      ]
    }
  );
});

test('test merge plugins for import', (t) => {
  const _import = require.resolve('babel-plugin-import');
  t.deepEqual(babelMerge(
    {
      plugins: [
        ['import', {
          'libraryName': 'antd',
          'style': 'css',
        }, 'antd'],
        "lodash",
        ['import', {
          'libraryName': '@mlz/doraemon',
          'camel2DashComponentName': false,
        }, 'doraemon'],
      ]
    },
    {
      plugins: [[
        "import",
        {
          libraryName: "antd",
          style: "css"
        }
      ],
    ],
    }
  ), {
    plugins: [
      [_import, {
        'libraryName': 'antd',
        'style': 'css',
      }, 'antd'],
      require.resolve("babel-plugin-lodash"),
      [_import, {
        'libraryName': '@mlz/doraemon',
        'camel2DashComponentName': false,
      }, '@mlz/doraemon'],
    ]
  })
})
