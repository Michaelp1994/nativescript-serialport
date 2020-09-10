module.exports = {
  parserOptions: {
    ecmaVersion: 9,
    sourceType: "module",
    parser: "babel-eslint",
  },
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  env: {
    node: true,
  },
  root: true,
  // plugins: ["nativescript"],
};
