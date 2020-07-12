module.exports = {
  "extends": "eslint:recommended",
  "rules": {
     "consistent-return": 2,
     "indent"           : [1, 4],
     "no-else-return"   : 1,
     "semi"             : [1, "always"],
     "space-unary-ops"  : 2
  },
  'globals': {
    // browser common
    'BigInt': true,
    'document': true,
    'Blob': true,
    'URL': true,
    'window': true,
    'XMLSerializer': true,
    // jest
    'describe': true,
    'expect': true,
    'it': true
  },
  "parserOptions": {
     "sourceType": "module",
     "ecmaVersion": 2015
  }
}
