import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export const baseConfig = [
  {
    ignores: ["dist"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
];

export const createTypeScriptConfig = ({ tsconfigRootDir, project }) => ({
  files: ["src/**/*.{ts,tsx}"],
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    globals: globals.browser,
    parser: tseslint.parser,
    parserOptions: {
      project,
      tsconfigRootDir,
    },
  },
  rules: {
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    "react-hooks/set-state-in-effect": "off",
    "react-hooks/exhaustive-deps": "off",
  },
});

export default baseConfig;
