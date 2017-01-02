module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": [
      "eslint:recommended","plugin:react/recommended"
    ],
    "plugins":[
      "react"
    ],
    "parser": "babel-eslint",
    "parserOptions": {
        "ecmaVersion": 6,
        "ecmaFeatures": {
            "jsx": true
        },
        "sourceType": "module"
    },
    "rules": {
        "brace-style": [
          "error"
        ],
        "eqeqeq": [
          "error",
          "smart"
        ],
        "no-multi-spaces": [
          "error"
        ],
        "comma-spacing": [
          "error"
        ],
        "key-spacing": [
          "error",
          { "beforeColon": true,
            "afterColon": true }
        ],
        "array-bracket-spacing": [
          "error"
        ],
        "no-trailing-spaces": [
          "error"
        ],
        "space-infix-ops" : [
          "error"
        ],
        "space-before-blocks" : [
          "error"
        ],
        "indent": [
            "error",
            2
        ],
        "curly": [
            "off",
            "multi"
        ],
        "linebreak-style": [
            "off",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "camelcase": [
            "error"
        ],
        "vars-on-top": [
            "error"
        ]
    }
};