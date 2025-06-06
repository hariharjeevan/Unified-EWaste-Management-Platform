export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      indent: ["error", 2],
      "max-len": ["error", { code: 80 }],
      "object-curly-spacing": ["error", "always"],
      "comma-dangle": ["error", "always-multiline"],
    },
  },
];