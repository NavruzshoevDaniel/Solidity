import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    files: [
      "**/*.{js,mjs,cjs,ts}"
    ]
  },
  {
    files: ["**/*.js"], languageOptions: {
      sourceType: "commonjs"
    }
  },
  {
    languageOptions: {
      globals: globals.browser
    }
  },
  {
    ignores: [
      "artifacts/*",
      "cache/*",
      "coverage/*",
      "node_modules/*",
      "typechain-types/*",
    ]
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
