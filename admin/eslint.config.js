import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  baseConfig,
  createTypeScriptConfig,
} from "../eslint.config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  ...baseConfig,
  createTypeScriptConfig({
    tsconfigRootDir: __dirname,
    project: [
      path.resolve(__dirname, "./tsconfig.app.json"),
      path.resolve(__dirname, "./tsconfig.node.json"),
    ],
  }),
];
