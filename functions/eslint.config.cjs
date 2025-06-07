const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script", // CommonJS (require/module.exports)
      globals: {
        ...globals.node,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    plugins: {},
    ...js.configs.recommended,
    rules: {
      ...js.configs.recommended.rules,
      indent: ["error", 2],
      "no-unused-vars": "warn",
      quotes: ["error", "double"],
      "require-jsdoc": "off",
    },
  },
];