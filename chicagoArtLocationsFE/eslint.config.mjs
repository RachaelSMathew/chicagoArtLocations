import globals from 'globals';
import pluginReact from 'eslint-plugin-react';
import { defineConfig } from 'eslint/config';
import prettierConfig from 'eslint-config-prettier';

export default defineConfig([
  {
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-duplicate-key': 'error',
      'prettier/prettier': 'error',
    },
    files: ['**/*.{js,mjs,cjs,jsx,svg}'],
    languageOptions: { globals: globals.browser },
  },
  pluginReact.configs.flat.recommended,
  prettierConfig,
]);
